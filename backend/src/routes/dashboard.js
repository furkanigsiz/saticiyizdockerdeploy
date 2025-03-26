const express = require('express');
const router = express.Router();
const { Order, Product, ApiIntegration } = require('../models');
const moment = require('moment-timezone');
const axios = require('axios');
const { PrismaClient } = require('../services/prismaShim');
const { supabase } = require('../config/supabase');

const prisma = new PrismaClient();

// Trendyol API endpoint'i
const TRENDYOL_API_URL = 'https://api.trendyol.com/sapigw';

// Önbellek için değişkenler
const CACHE_DURATION = 10 * 60 * 1000; // 10 dakika
let dashboardCache = {
    data: null,
    lastUpdated: null
};

// Model kontrolü
const checkModels = () => {
    if (!Order || !Product || !ApiIntegration) {
        console.error('HATA: Modeller yüklenemedi');
        throw new Error('Modeller yüklenemedi');
    }
};

// Trendyol'dan sipariş sayılarını al
const getTrendyolOrderStats = async (userId) => {
    try {
        const apiIntegration = await ApiIntegration.findOne({
            where: { user_id: userId }
        });

        if (!apiIntegration) {
            throw new Error('API bilgileri bulunamadı');
        }

        const authString = Buffer.from(`${apiIntegration.api_key}:${apiIntegration.api_secret}`).toString('base64');

        // Farklı durumlar için sipariş sayılarını al
        const statuses = ['Created', 'Picking', 'Shipped', 'Delivered', 'Cancelled'];
        const orderCounts = {};

        for (const status of statuses) {
            const response = await axios.get(
                `${TRENDYOL_API_URL}/suppliers/${apiIntegration.seller_id}/orders`,
                {
                    headers: {
                        'Authorization': `Basic ${authString}`,
                        'User-Agent': `${apiIntegration.seller_id} - SelfIntegration`,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        status,
                        size: 1 // Sadece toplam sayıyı almak için
                    }
                }
            );
            orderCounts[status.toLowerCase()] = response.data.totalElements;
        }

        // Toplam sipariş sayısını hesapla
        orderCounts.total = Object.values(orderCounts).reduce((a, b) => a + b, 0);

        return [{
            total: orderCounts.total,
            new: orderCounts.created || 0,
            preparing: orderCounts.picking || 0,
            shipped: orderCounts.shipped || 0,
            delivered: orderCounts.delivered || 0,
            cancelled: orderCounts.cancelled || 0
        }];
    } catch (error) {
        console.error('Trendyol API Hatası:', error.message);
        return null;
    }
};

// Trendyol'dan gelir istatistiklerini al
const getTrendyolRevenueStats = async (userId) => {
    try {
        const apiIntegration = await ApiIntegration.findOne({
            where: { user_id: userId }
        });

        if (!apiIntegration) {
            throw new Error('API bilgileri bulunamadı');
        }

        const authString = Buffer.from(`${apiIntegration.api_key}:${apiIntegration.api_secret}`).toString('base64');
        const now = moment().tz('Europe/Istanbul');

        // Tarih aralıkları
        const periods = {
            today: now.clone().startOf('day').format(),
            week: now.clone().startOf('week').format(),
            month: now.clone().startOf('month').format(),
            prevMonth: now.clone().subtract(1, 'month').startOf('month').format(),
            prevMonthEnd: now.clone().startOf('month').format()
        };

        // Her dönem için sipariş verilerini al
        const stats = {
            today: { total: 0, count: 0 },
            thisWeek: { total: 0, count: 0 },
            thisMonth: { total: 0, count: 0 },
            lastMonth: { total: 0, count: 0 },
            allTime: { total: 0, count: 0 }
        };

        // Teslim edilen siparişlerin tamamını çekmek için birden fazla sayfalama yapılmalı
        let page = 0;
        const pageSize = 200;
        let hasMore = true;
        
        while (hasMore) {
            try {
                // Teslim edilen siparişler için veri al
                const response = await axios.get(
                    `${TRENDYOL_API_URL}/suppliers/${apiIntegration.seller_id}/orders`,
                    {
                        headers: {
                            'Authorization': `Basic ${authString}`,
                            'User-Agent': `${apiIntegration.seller_id} - SelfIntegration`,
                            'Content-Type': 'application/json'
                        },
                        params: {
                            status: 'Delivered',
                            size: pageSize,
                            page: page,
                            orderByField: 'PackageLastModifiedDate',
                            orderByDirection: 'DESC'
                        }
                    }
                );

                // Sonuç boşsa veya içerik yoksa döngüyü sonlandır
                if (!response.data || !response.data.content || response.data.content.length === 0) {
                    hasMore = false;
                    break;
                }
                
                // Siparişleri işle
                response.data.content.forEach(order => {
                    const orderDate = moment(order.orderDate);
                    const totalPrice = parseFloat(order.totalPrice);

                    // Toplam istatistiklere ekle
                    stats.allTime.total += totalPrice;
                    stats.allTime.count++;

                    // Bugün
                    if (orderDate.isSameOrAfter(periods.today)) {
                        stats.today.total += totalPrice;
                        stats.today.count++;
                    }

                    // Bu hafta
                    if (orderDate.isSameOrAfter(periods.week)) {
                        stats.thisWeek.total += totalPrice;
                        stats.thisWeek.count++;
                    }

                    // Bu ay
                    if (orderDate.isSameOrAfter(periods.month)) {
                        stats.thisMonth.total += totalPrice;
                        stats.thisMonth.count++;
                    }

                    // Geçen ay
                    if (orderDate.isBetween(periods.prevMonth, periods.prevMonthEnd)) {
                        stats.lastMonth.total += totalPrice;
                        stats.lastMonth.count++;
                    }
                });
                
                // Son sayfaya ulaşıldı mı kontrol et
                if (response.data.content.length < pageSize) {
                    hasMore = false;
                } else {
                    // Sonraki sayfaya geç
                    page++;      
                }
            } catch (pageError) {
                console.error(`Trendyol gelir istatistikleri sayfa ${page} alınırken hata:`, pageError.message);
                hasMore = false;
            }
        }

        return [{
            today: stats.today.total,
            thisWeek: stats.thisWeek.total,
            thisMonth: stats.thisMonth.total,
            lastMonth: stats.lastMonth.total,
            total: stats.allTime.total,
            averageOrder: stats.allTime.count > 0 ? stats.allTime.total / stats.allTime.count : 0
        }];
    } catch (error) {
        console.error('Trendyol Gelir İstatistikleri Hatası:', error.message);
        return null;
    }
};

// Trendyol'dan ürün istatistiklerini al
const getTrendyolProductStats = async (apiKey, apiSecret, sellerId) => {
    try {
        const authString = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
        
        const response = await axios.get(
            `${TRENDYOL_API_URL}/suppliers/${sellerId}/products`,
            {
                headers: {
                    'Authorization': `Basic ${authString}`,
                    'User-Agent': `${sellerId} - SelfIntegration`,
                    'Content-Type': 'application/json'
                },
                params: {
                    size: 1,
                    page: 0
                }
            }
        );

        // Aktif ürünleri al
        const activeResponse = await axios.get(
            `${TRENDYOL_API_URL}/suppliers/${sellerId}/products`,
            {
                headers: {
                    'Authorization': `Basic ${authString}`,
                    'User-Agent': `${sellerId} - SelfIntegration`,
                    'Content-Type': 'application/json'
                },
                params: {
                    size: 1,
                    page: 0,
                    onSale: true
                }
            }
        );

        // Stok durumu için ürünleri al
        const productsResponse = await axios.get(
            `${TRENDYOL_API_URL}/suppliers/${sellerId}/products`,
            {
                headers: {
                    'Authorization': `Basic ${authString}`,
                    'User-Agent': `${sellerId} - SelfIntegration`,
                    'Content-Type': 'application/json'
                },
                params: {
                    size: 200,
                    page: 0
                }
            }
        );

        let lowStock = 0;
        let outOfStock = 0;

        if (productsResponse.data.content) {
            productsResponse.data.content.forEach(product => {
                if (product.quantity === 0) {
                    outOfStock++;
                } else if (product.quantity <= 10) {
                    lowStock++;
                }
            });
        }

        return {
            total: response.data.totalElements || 0,
            active: activeResponse.data.totalElements || 0,
            lowStock,
            outOfStock
        };
    } catch (error) {
        console.error('Trendyol Ürün İstatistikleri Hatası:', error.message);
        return null;
    }
};

// En çok satan ürünleri al
const getTopSellingProducts = async (apiKey, apiSecret, sellerId) => {
    try {
        const authString = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
        
        const response = await axios.get(
            `${TRENDYOL_API_URL}/suppliers/${sellerId}/products`,
            {
                headers: {
                    'Authorization': `Basic ${authString}`,
                    'User-Agent': `${sellerId} - SelfIntegration`,
                    'Content-Type': 'application/json'
                },
                params: {
                    size: 100, // Daha fazla ürün al
                    page: 0,
                    orderBy: 'SALES',
                    orderByDirection: 'DESC'
                }
            }
        );

        if (!response.data.content) return [];

        // Benzersiz ürünleri filtrele ve satış miktarına göre sırala
        const uniqueProducts = Array.from(
            new Map(response.data.content.map(item => [item.productCode, item])).values()
        );

        const sortedProducts = uniqueProducts
            .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
            .slice(0, 5)
            .map(product => ({
                name: product.title || 'Bilinmeyen Ürün',
                currentStock: parseInt(product.quantity) || 0,
                price: parseFloat(product.listPrice) || 0,
                totalRevenue: parseFloat(product.listPrice * product.quantity) || 0,
                salesCount: product.salesCount || 0,
                productCode: product.productCode
            }));

        return sortedProducts;
    } catch (error) {
        console.error('En Çok Satan Ürünler Hatası:', error.message);
        return [];
    }
};

// Teslim edilen siparişlerin toplam karını hesapla
const calculateTotalProfit = async (userId) => {
    try {
        const prisma = new PrismaClient();
        
        // API bilgilerini al
        const apiIntegration = await prisma.apiIntegrations.findUnique({
            where: { user_id: userId }
        });

        if (!apiIntegration) {
            throw new Error('API bilgileri bulunamadı');
        }

        const authString = Buffer.from(`${apiIntegration.api_key}:${apiIntegration.api_secret}`).toString('base64');
        
        // Trendyol'dan teslim edilen tüm siparişleri al
        let page = 0;
        const pageSize = 200;
        let allDeliveredOrders = [];
        let hasMore = true;
        
        
        while (hasMore) {
            try {
                const response = await axios.get(
                    `${TRENDYOL_API_URL}/suppliers/${apiIntegration.seller_id}/orders`,
                    {
                        headers: {
                            'Authorization': `Basic ${authString}`,
                            'User-Agent': `${apiIntegration.seller_id} - SelfIntegration`,
                            'Content-Type': 'application/json'
                        },
                        params: {
                            status: 'Delivered',
                            size: pageSize,
                            page: page,
                            orderByField: 'PackageLastModifiedDate',
                            orderByDirection: 'DESC'
                        }
                    }
                );
                
                // Sonuç boşsa veya içerik yoksa döngüyü sonlandır
                if (!response.data || !response.data.content || response.data.content.length === 0) {
                    hasMore = false;
                    break;
                }
                
                // Siparişleri ekle
                allDeliveredOrders = [...allDeliveredOrders, ...response.data.content];
                
                // Son sayfaya ulaşıldı mı kontrol et
                if (response.data.content.length < pageSize) {
                    hasMore = false;
                } else {
                    // Sonraki sayfaya geç
                    page++;                }
            } catch (pageError) {
                console.error(`[Dashboard] Trendyol siparişleri sayfa ${page} alınırken hata:`, pageError.message);
                hasMore = false;
            }
        }
                
        // Eğer Trendyol'dan veri alınamazsa veritabanından devam et
        if (allDeliveredOrders.length === 0) {
        
            
            // Tüm siparişleri al
            const { data: allOrders2, error: allOrdersError2 } = await supabase
                .from('orders')
                .select('id, total_price, status, lines, created_at')
                .eq('user_id', userId);
                
            if (allOrdersError2) {
                console.error(`[Dashboard] Siparişler alınırken hata:`, allOrdersError2);
                throw allOrdersError2;
            }
            
            if (!allOrders2 || allOrders2.length === 0) {
                console.log(`[Dashboard] Kullanıcıya ait sipariş bulunamadı.`);
                return { totalProfit: 0, deliveredOrdersCount: 0 };
            }

            console.log(`[Dashboard] Toplam ${allOrders2.length} sipariş bulundu.`);
            console.log(`[Dashboard] İlk 10 siparişin durumları:`, 
                allOrders2.slice(0, 10).map(o => ({ id: o.id, status: o.status, total: o.total_price }))
            );

            // Durum bilgisi dağılımı incele
            const statusCounts = {};
            allOrders2.forEach(order => {
                if (order.status) {
                    const status = String(order.status).toLowerCase();
                    statusCounts[status] = (statusCounts[status] || 0) + 1;
                }
            });
            console.log(`[Dashboard] Sipariş durumları dağılımı:`, statusCounts);

            // Teslim edilen siparişleri filtrele - tüm olası teslim durumlarını kontrol et
            const deliveredOrders = allOrders2.filter(order => {
                if (!order.status) return false;
                
                const status = String(order.status).toLowerCase();
                return status.includes('deliver') || 
                       status.includes('teslim') || 
                       status.includes('complet') || 
                       status.includes('tamamla') ||
                       status === 'delivered' ||
                       status === 'completed' ||
                       status === 'tamamlandı' ||
                       status === 'teslim edildi';
            });
            
            console.log(`[Dashboard] Toplam ${deliveredOrders.length} teslim edilen sipariş bulundu.`);
            
            if (deliveredOrders.length > 0) {
                return processDeliveredOrders(deliveredOrders);
            } else {
                return { totalProfit: 0, deliveredOrdersCount: 0 };
            }
        } else {
            // Trendyol API'sinden alınan siparişleri işle
            console.log(`[Dashboard] Trendyol siparişleri işleniyor...`);
            
            // Siparişleri uygun formata dönüştür
            const formattedOrders = allDeliveredOrders.map(order => ({
                id: order.id || order.orderNumber,
                total_price: order.totalPrice,
                status: 'delivered'
            }));
            
            return processDeliveredOrders(formattedOrders);
        }
        
        // Teslim edilen siparişleri işleyen yardımcı fonksiyon
        function processDeliveredOrders(deliveredOrders) {
            // Sonuç değişkenlerini tanımla
            let totalProfit = 0;
            let deliveredOrdersCount = deliveredOrders.length;
            
            // Platform hizmet bedeli (sabit)
            const platformServiceFee = 6.99; // TL (KDV hariç)
            
            // Her teslim edilen sipariş için kar hesapla
            for (const order of deliveredOrders) {
                const orderTotal = parseFloat(order.total_price) || 0;
                if (orderTotal <= 0) {
                    console.log(`[Dashboard] Sipariş #${order.id} için fiyat ${orderTotal} olduğundan kar hesaplanmadı.`);
                    continue; // Toplam fiyatı 0 veya negatif olan siparişleri atla
                }
                
                // Siparişin maliyetini tahmin et (varsayılan olarak toplam fiyatın %65'i)
                const orderCost = orderTotal * 0.65;
                
                // Komisyon oranı (varsayılan %15)
                const commissionRate = 0.15;
                const commissionAmount = orderTotal * commissionRate;
                
                // Kargo ücreti (varsayılan 45 TL)
                const shippingCost = 45;
                
                // KDV hesaplamaları
                const vatRate = 0.18; // %18 KDV
                const saleVAT = orderTotal * vatRate;
                const costVAT = orderCost * vatRate;
                const commissionVAT = commissionAmount * 0.18; // Komisyon KDV'si %18
                const shippingVAT = shippingCost * 0.18; // Kargo KDV'si %18
                const platformServiceVAT = platformServiceFee * 0.18; // Platform hizmet bedeli KDV'si %18
                
                // Net KDV = Satış KDV - Ürün Maliyeti KDV - Komisyon KDV - Kargo Ücreti KDV - Platform Hizmet Bedeli KDV
                const netVAT = saleVAT - costVAT - commissionVAT - shippingVAT - platformServiceVAT;
                
                // Kar hesaplama formülü:
                // Kar tutarı = Satış fiyatı - Ürün Maliyeti - Komisyon Tutarı - Kargo Ücreti - Platform Hizmet Bedeli - Net KDV
                const orderProfit = orderTotal - orderCost - commissionAmount - shippingCost - platformServiceFee - netVAT;
                
                // Toplam kara ekle
                totalProfit += orderProfit;
                
                console.log(`[Dashboard] Sipariş #${order.id} için kar: ${orderProfit.toFixed(2)} TL (Toplam: ${orderTotal} TL)`);
            }
            
            console.log(`[Dashboard] Toplam kar: ${totalProfit.toFixed(2)} TL (${deliveredOrders.length} teslim edilen sipariş)`);
            
            return {
                totalProfit: parseFloat(totalProfit.toFixed(2)),
                deliveredOrdersCount
            };
        }
    } catch (error) {
        console.error('Toplam Kar Hesaplama Hatası:', error);
        return { totalProfit: 0, deliveredOrdersCount: 0 };
    }
};

// Dashboard verilerini güncelle
const updateDashboardData = async (userId) => {
    try {
        const apiIntegration = await prisma.apiIntegrations.findUnique({
            where: { user_id: userId }
        });

        if (!apiIntegration) {
            throw new Error('API bilgileri bulunamadı');
        }

        // Sipariş istatistiklerini al
        const orderStats = await getTrendyolOrderStats(userId);
        
        // Ürün istatistiklerini al
        const productStats = await getTrendyolProductStats(
            apiIntegration.api_key,
            apiIntegration.api_secret,
            apiIntegration.seller_id
        );

        // Gelir istatistiklerini al
        const revenueStats = await getTrendyolRevenueStats(userId);

        // En çok satan ürünleri al
        const topProducts = await getTopSellingProducts(
            apiIntegration.api_key,
            apiIntegration.api_secret,
            apiIntegration.seller_id
        );

        // Toplam kar hesapla
        const profitData = await calculateTotalProfit(userId);

        // Aylık büyüme oranını hesapla
        const monthlyGrowth = revenueStats && revenueStats[0] ? 
            revenueStats[0].lastMonth > 0 ? 
                ((revenueStats[0].thisMonth - revenueStats[0].lastMonth) / revenueStats[0].lastMonth * 100).toFixed(1) 
                : 0 
            : 0;

        // Önbelleği güncelle
        dashboardCache = {
            data: {
                orders: orderStats ? orderStats[0] : { total: 0, new: 0, preparing: 0, shipped: 0, delivered: 0, cancelled: 0 },
                products: productStats || { total: 0, active: 0, lowStock: 0, outOfStock: 0 },
                revenue: {
                    ...(revenueStats ? revenueStats[0] : { today: 0, thisWeek: 0, thisMonth: 0, lastMonth: 0, total: 0, averageOrder: 0 }),
                    monthlyGrowth: parseFloat(monthlyGrowth),
                    totalProfit: profitData.totalProfit,
                    deliveredOrdersCount: profitData.deliveredOrdersCount
                },
                topProducts
            },
            lastUpdated: Date.now()
        };

        return dashboardCache.data;
    } catch (error) {
        console.error('Dashboard Güncelleme Hatası:', error.message);
        throw error;
    }
};

// istatistikleri al
router.get('/stats', async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`[Dashboard] ${userId} ID'li kullanıcı için istatistikler istendi`);

        // Kullanıcıya ait API entegrasyonu var mı kontrol et
        const { data: integration, error: integrationError } = await supabase
            .from('api_integrations')
            .select('*')
            .eq('user_id', userId)
            .single();
        
        // API entegrasyonu varsa ve önbellek süresi dolmamışsa önbellekten döndür
        if (
            integration && 
            dashboardCache.data && 
            dashboardCache.lastUpdated && 
            (Date.now() - dashboardCache.lastUpdated) < CACHE_DURATION
        ) {
            console.log(`[Dashboard] ${userId} ID'li kullanıcı için önbellekten veri döndürülüyor`);
            return res.json(dashboardCache.data);
        }

        // API entegrasyonu varsa Trendyol API'sinden verileri çek
        if (integration && !integrationError) {
            try {
                console.log(`[Dashboard] ${userId} ID'li kullanıcı için Trendyol API verisi oluşturuluyor`);
                const dashboardData = await updateDashboardData(userId);
                return res.json(dashboardData);
            } catch (apiError) {
                console.error(`[Dashboard] Trendyol API hatası:`, apiError.message);
                // API hatası durumunda veritabanından veri çekmeye devam et
            }
        }
        
        // Supabase sorguları ile istatistikleri al
        console.log(`[Dashboard] ${userId} ID'li kullanıcı için veritabanı verisi hazırlanıyor`);
        
        // 1. Son 7 gündeki siparişler
        const currentDate = new Date();
        const lastWeekDate = new Date();
        lastWeekDate.setDate(lastWeekDate.getDate() - 7);
        
        const { data: recentOrders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', userId)
            .gte('created_at', lastWeekDate.toISOString())
            .lte('created_at', currentDate.toISOString())
            .order('created_at', { ascending: false });
            
        if (ordersError) throw ordersError;
        
        // 2. Toplam sipariş sayısı
        const { count: totalOrders, error: totalOrdersError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
            
        if (totalOrdersError) throw totalOrdersError;
        
        // 3. Toplam ürün sayısı
        const { count: totalProducts, error: totalProductsError } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
            
        if (totalProductsError) throw totalProductsError;
        
        // 4. Bu ayki toplam satış
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        
        const { data: monthlyOrders, error: monthlyOrdersError } = await supabase
            .from('orders')
            .select('total_price')
            .eq('user_id', userId)
            .gte('created_at', startOfMonth.toISOString())
            .lte('created_at', currentDate.toISOString());
            
        if (monthlyOrdersError) throw monthlyOrdersError;
        
        const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + (parseFloat(order.total_price) || 0), 0);
        
        // 5. En çok satan ürünler için order_items var mı kontrol et
        let topProducts = [];
        try {
            const { data: orderItemsData, error: orderItemsError } = await supabase
            .from('order_items')
            .select(`
                product_id,
                quantity,
                    products!fk_order_items_product(title, images)
            `)
            .eq('user_id', userId)
            .order('quantity', { ascending: false })
            .limit(5);
            
            if (!orderItemsError && orderItemsData) {
                topProducts = orderItemsData.map(item => ({
                    name: item.products?.title || 'Bilinmeyen Ürün',
                    currentStock: 0,
                    totalRevenue: 0,
                    salesCount: item.quantity || 0,
                    productCode: item.product_id
                }));
            }
        } catch (error) {
            console.error('En çok satan ürünler alınırken hata:', error);
        }
        
        // 6. Son siparişler
        const { data: latestOrders, error: latestOrdersError } = await supabase
            .from('orders')
            .select(`
                order_number,
                customer_first_name,
                customer_last_name,
                status,
                total_price,
                created_at
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5);
            
        if (latestOrdersError) throw latestOrdersError;
        
        // 7. Gelir istatistikleri hesapla
        const { data: allOrders, error: allOrdersError } = await supabase
            .from('orders')
            .select('total_price, created_at, status')
            .eq('user_id', userId);
            
        if (allOrdersError) throw allOrdersError;
        
        // Gelir istatistiklerini hesapla
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        
        let revenue = {
            today: 0,
            thisWeek: 0,
            thisMonth: monthlyRevenue,
            lastMonth: 0,
            total: 0,
            averageOrder: 0,
            monthlyGrowth: 0,
            totalProfit: 0,
            deliveredOrdersCount: 0
        };
        
        let totalRevenue = 0;
        let orderCount = 0;
        let lastMonthRevenue = 0;
        let deliveredCount = 0;
        
        allOrders.forEach(order => {
            const orderDate = new Date(order.created_at);
            const orderTotal = parseFloat(order.total_price) || 0;
            
            // Toplam gelir
            totalRevenue += orderTotal;
            orderCount++;
            
            // Bugünkü gelir
            if (orderDate >= todayStart) {
                revenue.today += orderTotal;
            }
            
            // Bu haftaki gelir
            if (orderDate >= weekStart) {
                revenue.thisWeek += orderTotal;
            }
            
            // Geçen ayki gelir
            if (orderDate >= lastMonthStart && orderDate <= lastMonthEnd) {
                lastMonthRevenue += orderTotal;
            }
            
            // Teslim edilen sipariş sayısı
            if (order.status?.toLowerCase() === 'delivered') {
                deliveredCount++;
            }
        });
        
        // Gelir istatistiklerini güncelle
        revenue.total = totalRevenue;
        revenue.lastMonth = lastMonthRevenue;
        revenue.averageOrder = orderCount > 0 ? totalRevenue / orderCount : 0;
        revenue.deliveredOrdersCount = deliveredCount;
        
        // Aylık büyüme oranı
        if (lastMonthRevenue > 0) {
            revenue.monthlyGrowth = ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1);
        }
        
        // Toplam kar hesabı - Trendyol formülüne göre daha doğru bir şekilde
        try {
            console.log(`[Dashboard] ${userId} ID'li kullanıcı için kar hesaplaması başlatılıyor...`);
            
            // Toplam kar için varsayılan değer
            let totalProfit = 0;
            
            // Tüm siparişleri al
            console.log(`[Dashboard] Tüm siparişler alınıyor...`);
            const { data: allOrders2, error: allOrdersError2 } = await supabase
                .from('orders')
                .select('id, total_price, status, lines, created_at')
                .eq('user_id', userId);
                
            if (allOrdersError2) {
                console.error(`[Dashboard] Siparişler alınırken hata:`, allOrdersError2);
                revenue.totalProfit = 0;
                return revenue;
            }
            
            if (!allOrders2 || allOrders2.length === 0) {
                console.log(`[Dashboard] Kullanıcıya ait sipariş bulunamadı.`);
                revenue.totalProfit = 0;
                return revenue;
            }
            
            console.log(`[Dashboard] Toplam ${allOrders2.length} sipariş bulundu.`);
            
            // Durum bilgisi dağılımı incele
            const statusCounts = {};
            allOrders2.forEach(order => {
                if (order.status) {
                    const status = String(order.status).toLowerCase();
                    statusCounts[status] = (statusCounts[status] || 0) + 1;
                }
            });
            console.log(`[Dashboard] Sipariş durumları dağılımı:`, statusCounts);

            // Teslim edilen siparişleri filtrele
            const deliveredOrders = allOrders2.filter(order => {
                if (!order.status) return false;
                
                const status = String(order.status).toLowerCase();
                return status.includes('deliver') || 
                       status.includes('teslim') || 
                       status.includes('complet') || 
                       status.includes('tamamla') ||
                       status === 'delivered' ||
                       status === 'completed';
            });
            
            console.log(`[Dashboard] Toplam ${deliveredOrders.length} teslim edilen sipariş bulundu.`);
            
            if (deliveredOrders.length > 0) {
                // Teslim edilen siparişlerin sayısını güncelle
                revenue.deliveredOrdersCount = deliveredOrders.length;
                
                // Platform hizmet bedeli (sabit)
                const platformServiceFee = 6.99; // TL (KDV hariç)
                
                // Her teslim edilen sipariş için kar hesapla
                for (const order of deliveredOrders) {
                    const orderTotal = parseFloat(order.total_price) || 0;
                    if (orderTotal <= 0) {
                        console.log(`[Dashboard] Sipariş #${order.id} için fiyat ${orderTotal} olduğundan kar hesaplanmadı.`);
                        continue; // Toplam fiyatı 0 veya negatif olan siparişleri atla
                    }
                    
                    // Siparişin maliyetini tahmin et (varsayılan olarak toplam fiyatın %65'i)
                    const orderCost = orderTotal * 0.65;
                    
                    // Komisyon oranı (varsayılan %15)
                    const commissionRate = 0.15;
                    const commissionAmount = orderTotal * commissionRate;
                    
                    // Kargo ücreti (varsayılan 45 TL)
                    const shippingCost = 45;
                    
                    // KDV hesaplamaları
                    const vatRate = 0.18; // %18 KDV
                    const saleVAT = orderTotal * vatRate;
                    const costVAT = orderCost * vatRate;
                    const commissionVAT = commissionAmount * 0.18; // Komisyon KDV'si %18
                    const shippingVAT = shippingCost * 0.18; // Kargo KDV'si %18
                    const platformServiceVAT = platformServiceFee * 0.18; // Platform hizmet bedeli KDV'si %18
                    
                    // Net KDV = Satış KDV - Ürün Maliyeti KDV - Komisyon KDV - Kargo Ücreti KDV - Platform Hizmet Bedeli KDV
                    const netVAT = saleVAT - costVAT - commissionVAT - shippingVAT - platformServiceVAT;
                    
                    // Kar hesaplama formülü:
                    // Kar tutarı = Satış fiyatı - Ürün Maliyeti - Komisyon Tutarı - Kargo Ücreti - Platform Hizmet Bedeli - Net KDV
                    const orderProfit = orderTotal - orderCost - commissionAmount - shippingCost - platformServiceFee - netVAT;
                    
                    // Toplam kara ekle
                    totalProfit += orderProfit;
                    
                    console.log(`[Dashboard] Sipariş #${order.id} için kar: ${orderProfit.toFixed(2)} TL (Toplam: ${orderTotal} TL)`);
                }
                
                // Kar değerini güncelle - yalnızca teslim edilen siparişlerden
                revenue.totalProfit = parseFloat(totalProfit.toFixed(2));
                console.log(`[Dashboard] Toplam kar: ${revenue.totalProfit} TL (${deliveredOrders.length} teslim edilen sipariş)`);
            } else {
                // Teslim edilen sipariş bulunamadı
                console.log(`[Dashboard] Teslim edilen sipariş bulunamadı.`);
                
                revenue.totalProfit = 0;
                revenue.deliveredOrdersCount = orderStatusCounts.delivered || 0;
            }
        } catch (profitError) {
            console.error('[Dashboard] Kar hesaplama hatası:', profitError);
            // Hata durumunda kar 0 olarak ayarla
            revenue.totalProfit = 0;
        }
        
        // Sipariş durumu istatistikleri
        const orderStatusCounts = {
            new: 0,
            preparing: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0
        };
        
        allOrders.forEach(order => {
            const status = order.status?.toLowerCase();
            if (status === 'created' || status === 'new') {
                orderStatusCounts.new++;
            } else if (status === 'preparing' || status === 'processing') {
                orderStatusCounts.preparing++;
            } else if (status === 'shipped' || status === 'in_transit') {
                orderStatusCounts.shipped++;
            } else if (status === 'delivered' || status === 'completed') {
                orderStatusCounts.delivered++;
            } else if (status === 'cancelled' || status === 'canceled') {
                orderStatusCounts.cancelled++;
            }
        });
        
        // Aktif ürün sayısı ve stok durumu
        const { data: productsData, error: productsDataError } = await supabase
            .from('products')
            .select('id, quantity, stock_code')
            .eq('user_id', userId);
        
        if (productsDataError) throw productsDataError;
        
        let lowStockCount = 0;
        let outOfStockCount = 0;
        let activeProductCount = 0;
        
        productsData.forEach(product => {
            const quantity = parseInt(product.quantity) || 0;
            
            if (quantity > 0) {
                activeProductCount++;
                
                if (quantity <= 5) {
                    lowStockCount++;
                }
            } else {
                outOfStockCount++;
            }
        });
        
        // 8. Son veriyi hazırla
        const responseData = {
            orders: {
                total: totalOrders,
                new: orderStatusCounts.new,
                preparing: orderStatusCounts.preparing,
                shipped: orderStatusCounts.shipped,
                delivered: orderStatusCounts.delivered,
                cancelled: orderStatusCounts.cancelled,
                recent: recentOrders
            },
            products: {
                total: totalProducts,
                active: activeProductCount,
                lowStock: lowStockCount,
                outOfStock: outOfStockCount,
                topSelling: topProducts
            },
            revenue: revenue,
            topProducts: topProducts || [],
            latestOrders
        };
        
        // Önbelleğe kaydet
        dashboardCache.data = responseData;
        dashboardCache.lastUpdated = Date.now();
        
        res.json(responseData);
    } catch (error) {
        console.error('İstatistikler alınırken hata:', error);
        res.status(500).json({ 
            orders: { total: 0, new: 0, preparing: 0, shipped: 0, delivered: 0, cancelled: 0 },
            products: { total: 0, active: 0, lowStock: 0, outOfStock: 0 },
            revenue: { 
                today: 0, 
                thisWeek: 0, 
                thisMonth: 0, 
                lastMonth: 0, 
                total: 0, 
                averageOrder: 0, 
                monthlyGrowth: 0,
                totalProfit: 0,
                deliveredOrdersCount: 0
            },
            topProducts: []
        });
    }
});

// API istatistikleri
router.get('/api-stats', async (req, res) => {
    try {
        const userId = req.user.id;
        
        // API entegrasyonunu kontrol et
        const { data: integration, error: integrationError } = await supabase
            .from('api_integrations')
            .select('*')
            .eq('user_id', userId)
            .single();
            
        if (integrationError) throw integrationError;
        
        if (!integration) {
            return res.status(404).json({ error: 'API entegrasyonu bulunamadı' });
        }
        
        // Sonuçları döndür
        res.json({
            hasApiIntegration: !!integration,
            apiDetails: integration
        });
    } catch (error) {
        console.error('API istatistikleri alınırken hata:', error);
        res.status(500).json({ error: 'API istatistikleri alınırken bir hata oluştu' });
    }
});

module.exports = router; 