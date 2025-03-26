const express = require('express');
const router = express.Router();
const axios = require('axios');
const authenticateToken = require('../middleware/authMiddleware');
const { ApiIntegration } = require('../models');
const Product = require('../models/Product');
const { supabase } = require('../config/supabase');

// Trendyol API endpoint'leri
const TRENDYOL_API_URL = 'https://api.trendyol.com/sapigw';

// Önbellek için basit bir Map
const cache = new Map();
const CACHE_DURATION = 15 * 60 * 1000; // 15 dakika

// Trendyol API'den ürünleri getir
const fetchTrendyolProducts = async (apiKey, apiSecret, sellerId, page = 0, size = 1000, onSale = false) => {
    try {
        // Basic Authentication için API key ve secret'ı base64 ile kodla
        const authString = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
        
        console.log(`Trendyol API isteği yapılıyor: Satıcı ID: ${sellerId}, Sayfa: ${page}, Boyut: ${size}, Satışta: ${onSale}`);
        
        // API isteği yap
        const response = await axios.get(
            `${TRENDYOL_API_URL}/suppliers/${sellerId}/products`,
            {
                headers: {
                    'Authorization': `Basic ${authString}`,
                    'User-Agent': `${sellerId} - SelfIntegration`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                params: {
                    page,
                    size,
                    approved: true,
                    onSale: onSale,
                    archived: false
                },
                timeout: 30000
            }
        );

        // Yanıt detaylarını logla
        console.log(`Trendyol API yanıtı: Status: ${response.status}, Ürün sayısı: ${response.data?.content?.length || 0}, Toplam: ${response.data?.totalElements || 0}`);
        
        // Eğer yanıt varsa ama ürün yoksa, API yanıtının yapısını kontrol edelim
        if (response.data && (!response.data.content || response.data.content.length === 0)) {
            console.log('API ürün yanıtı yapısı:', Object.keys(response.data));
            
            // Eğer başka alanlar varsa, onları da görelim
            if (response.data.totalElements === 0) {
                console.log('Trendyol hesabında hiç ürün bulunmuyor olabilir');
            } 
        }

        // Yanıt kontrolü
        if (!response.data) {
            throw new Error('Geçersiz API yanıtı');
        }

        // Başarılı yanıt
        return {
            success: true,
            data: {
                content: Array.isArray(response.data.content) ? response.data.content.map(product => ({
                    id: product.id || '',
                    productCode: product.productCode,
                    barcode: product.barcode || '',
                    title: product.title || '',
                    brand: product.brand || '',
                    brandId: product.brandId,
                    categoryName: product.categoryName || '',
                    stockCode: product.stockCode || '',
                    quantity: product.quantity || 0,
                    listPrice: product.listPrice || 0,
                    salePrice: product.salePrice || 0,
                    vatRate: product.vatRate,
                    dimensionalWeight: product.dimensionalWeight,
                    description: product.description || '',
                    stockUnitType: product.stockUnitType || '',
                    deliveryOption: product.deliveryOption || {},
                    images: Array.isArray(product.images) ? product.images : [],
                    attributes: Array.isArray(product.attributes) ? product.attributes : [],
                    approved: product.approved || false,
                    archived: product.archived || false,
                    onSale: product.onSale || false,
                    productUrl: product.productUrl || '',
                    gender: product.gender || '',
                    color: product.color || '',
                    size: product.size || '',
                    createDateTime: product.createDateTime,
                    lastUpdateDate: product.lastUpdateDate,
                    hasActiveCampaign: product.hasActiveCampaign || false,
                    locked: product.locked || false
                })) : [],
                totalElements: response.data.totalElements || 0,
                totalPages: response.data.totalPages || 1,
                page: response.data.page || 0,
                size: response.data.size || size,
                hasNext: (response.data.page || 0) < (response.data.totalPages - 1)
            }
        };
    } catch (error) {
        console.error('Trendyol API Hatası:', error.response?.data || error.message);
        
        // API'den gelen hata detaylarını kontrol et
        if (error.response?.data) {
            const apiError = error.response.data;
            
            // TrendyolNotFoundException kontrolü
            if (apiError.exception === 'TrendyolNotFoundException') {
                return {
                    success: true,
                    data: {
                        content: [],
                        totalElements: 0,
                        totalPages: 1,
                        page: 0,
                        size: size,
                        hasNext: false
                    }
                };
            }
            
            // ClientApiBusinessException kontrolü
            if (apiError.exception === 'ClientApiBusinessException') {
                return {
                    success: false,
                    error: {
                        message: 'API kimlik bilgileri geçersiz veya eksik. Lütfen API bilgilerinizi kontrol edin.',
                        code: 'CLIENT_API_BUSINESS_EXCEPTION',
                        details: apiError
                    }
                };
            }
            
            // Diğer API hataları için
            return {
                success: false,
                error: {
                    message: apiError.errors?.[0]?.message || 'Trendyol API hatası',
                    code: apiError.exception || 'API_ERROR',
                    details: apiError
                }
            };
        }
        
        // Ağ veya diğer hatalar için
        return {
            success: false,
            error: {
                message: error.message || 'Trendyol API\'ye bağlanırken bir hata oluştu',
                code: 'NETWORK_ERROR',
                details: error
            }
        };
    }
};

// Önbellek kontrolü
const checkCache = (key) => {
    const cachedData = cache.get(key);
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
        console.log(`Önbellek hit: ${key}, veri tipi: ${typeof cachedData.data}, dizi mi: ${Array.isArray(cachedData.data)}`);
        
        // Önbellekteki veri bir dizi değilse ve products özelliği varsa, products dizisini döndür
        if (!Array.isArray(cachedData.data) && cachedData.data?.products) {
            return cachedData.data.products;
        }
        
        return cachedData.data;
    }
    console.log(`Önbellek miss: ${key}`);
    return null;
};

// Önbelleğe veri kaydetme
const setCache = (key, data) => {
    console.log(`Önbelleğe kaydediliyor: ${key}, veri tipi: ${typeof data}, dizi mi: ${Array.isArray(data)}`);
    
    cache.set(key, {
        data,
        timestamp: Date.now()
    });
};

// Önbelleği temizle
const clearCache = () => {
    cache.clear();
    console.log('Önbellek tamamen temizlendi');
};

// Ürünleri senkronize et
const syncProducts = async (req) => {
    try {
        const userId = req.user.id;
        
        // Kullanıcının API entegrasyonunu kontrol et
        const integration = await ApiIntegration.findOne({
            where: { user_id: userId }
        });

        if (!integration) {
            throw new Error('Trendyol API entegrasyonu yapılandırılmamış');
        }

        const { api_key, api_secret, seller_id } = integration;

        if (!api_key || !api_secret || !seller_id) {
            throw new Error('Trendyol API bilgileri eksik');
        }

        // API'den ürünleri getir
        const productsResponse = await fetchTrendyolProducts(api_key, api_secret, seller_id);
        
        // API yanıtı başarısızsa hatayı fırlat
        if (!productsResponse.success) {
            throw new Error(productsResponse.error?.message || 'Trendyol API\'den ürünler alınamadı');
        }
        
        const products = productsResponse.data.content;
        
        console.log(`Toplam ${products.length} ürün bulundu.`);
        
        if (products.length === 0) {
            return { message: 'Senkronize edilecek ürün bulunamadı', count: 0 };
        }

        // Her ürün için veritabanına kaydet veya güncelle
        const productPromises = products.map(async (item) => {
            // Ürün formatını veritabanına uygun hale getir
            const productData = {
                user_id: userId,
                trendyol_id: item.id || '',
                title: item.title,
                barcode: item.barcode,
                stock_code: item.stockCode,
                product_code: item.productCode || item.productContentId?.toString() || null,
                brand: item.brand?.name || null,
                category_name: item.category?.name || null,
                quantity: item.quantity,
                stock_unit_type: item.stockUnitType?.name || null,
                dimensional_weight: item.dimensionalWeight || 0,
                description: item.description || null,
                list_price: item.listPrice || 0,
                sale_price: item.salePrice || 0,
                vat_rate: item.vatRate || 0,
                images: item.images || [],
                gender: item.gender || null,
                color: item.attributes?.find(attr => attr.attributeName === 'Renk')?.attributeValue || null,
                size: item.attributes?.find(attr => attr.attributeName === 'Beden')?.attributeValue || null,
                approved: item.approved || false,
                on_sale: item.onSale || false,
                has_active_campaign: item.hasActiveCampaign || false,
                archived: false,
                last_update_date: new Date(item.lastModificationDate) || new Date()
            };

            // Ürünü veritabanında kontrol et ve güncelle veya oluştur
            const existingProduct = await Product.findOne({
                where: {
                    user_id: userId,
                    trendyolId: item.id || ''
                }
            });

            if (existingProduct) {
                // Ürün varsa güncelle
                await Product.update(productData, {
                    where: {
                        id: existingProduct.id,
                        user_id: userId
                    }
                });
                return { updated: true, id: existingProduct.id };
            } else {
                // Ürün yoksa oluştur
                const newProduct = await Product.create(productData);
                return { created: true, id: newProduct.id };
            }
        });

        // Tüm ürünlerin işlenmesini bekle
        const results = await Promise.all(productPromises);
        
        // İstatistikler
        const created = results.filter(r => r.created).length;
        const updated = results.filter(r => r.updated).length;
        
        return {
            message: 'Ürünler başarıyla senkronize edildi',
            created,
            updated,
            total: results.length
        };
    } catch (error) {
        console.error('Ürün senkronizasyon hatası:', error);
        throw error;
    }
};

// Ürünleri getir
router.get('/products', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('API bilgileri isteği alındı. Kullanıcı ID:', userId);
        
        // Tüm önbelleği temizle (frontend sorununu çözmek için)
        clearCache();
        
        // Filtreleme parametreleri
        const { onSale = 'true', page = 0, size = 1000 } = req.query;
        const isOnSale = onSale === 'true';
        
        console.log(`Ürün filtresi: onSale=${isOnSale}, page=${page}, size=${size}`);
        
        // Önbellek anahtarı - filtreleri içerecek şekilde
        const cacheKey = `products_${userId}_${isOnSale}_${page}_${size}`;
        
        // Önbellekte var mı kontrol et
        const cachedData = checkCache(cacheKey);
        if (cachedData) {
            console.log('Önbellekten ürünler alındı');
            return res.json({ products: cachedData }); // Frontend'in beklediği format
        }
        
        // Kullanıcının API entegrasyonunu kontrol et
        const integration = await ApiIntegration.findOne({
            where: { user_id: userId }
        });

        if (!integration) {
            return res.status(404).json({ error: 'Trendyol API entegrasyonu yapılandırılmamış' });
        }

        const { api_key, api_secret, seller_id } = integration;

        if (!api_key || !api_secret || !seller_id) {
            return res.status(400).json({ error: 'Trendyol API bilgileri eksik' });
        }
        
        console.log(`Trendyol ürünleri alınıyor: sellerId=${seller_id}, API Key: ${api_key.substring(0, 3)}...`);
        
        // Trendyol API'dan ürünleri al
        const productsResponse = await fetchTrendyolProducts(
            api_key, 
            api_secret, 
            seller_id, 
            parseInt(page), 
            parseInt(size), 
            isOnSale
        );
        
        if (!productsResponse.success) {
            console.error('Trendyol API hatası:', productsResponse.error);
            return res.status(500).json({ 
                error: productsResponse.error?.message || 'Trendyol API\'den ürünler alınamadı' 
            });
        }
        
        // API yanıtından ürünleri al
        const products = productsResponse.data.content;
        console.log(`${products.length} adet ürün alındı (Toplam: ${productsResponse.data.totalElements})`);
        
        // Hiç ürün yoksa, tüm ürünleri almayı deneyebiliriz
        if (products.length === 0 && isOnSale) {
            console.log('Satıştaki ürün bulunamadı, tüm ürünleri alınıyor...');
            
            const allProductsResponse = await fetchTrendyolProducts(
                api_key, 
                api_secret, 
                seller_id, 
                parseInt(page), 
                parseInt(size), 
                false // onSale=false ile tüm ürünleri almaya çalış
            );
            
            if (allProductsResponse.success) {
                const allProducts = allProductsResponse.data.content;
                console.log(`Tüm ürünlerden ${allProducts.length} adet bulundu (Toplam: ${allProductsResponse.data.totalElements})`);
                
                if (allProducts.length > 0) {
                    // Ürünleri önbelleğe kaydet
                    setCache(cacheKey, allProducts);
                    
                    // Frontend'in beklediği formatta yanıt döndür
                    return res.json({ 
                        products: allProducts,
                        totalElements: allProductsResponse.data.totalElements,
                        totalPages: allProductsResponse.data.totalPages,
                        page: allProductsResponse.data.page,
                        size: allProductsResponse.data.size,
                        hasNext: allProductsResponse.data.hasNext
                    });
                }
            }
        }
        
        // Debug için yanıtın detaylarını logla
        if (products.length === 0) {
            console.log('API yanıtı tam içerik (ürün bulunamadı):', JSON.stringify(productsResponse.data));
        } else {
            console.log('İlk ürün örneği:', JSON.stringify(products[0]));
        }
        
        // Ürünleri önbelleğe kaydet
        setCache(cacheKey, products);
        
        // Frontend'in beklediği formatta yanıt döndür
        res.json({ 
            products: products,
            totalElements: productsResponse.data.totalElements,
            totalPages: productsResponse.data.totalPages,
            page: productsResponse.data.page,
            size: productsResponse.data.size,
            hasNext: productsResponse.data.hasNext
        });
    } catch (error) {
        console.error('Ürünleri getirme hatası:', error);
        res.status(500).json({ error: 'Ürünler getirilirken bir hata oluştu' });
    }
});

// Senkronizasyon endpoint'i
router.post('/products/sync', authenticateToken, async (req, res) => {
    try {
        // Önbelleği temizle
        clearCache();
        
        // Ürünleri senkronize et
        const result = await syncProducts(req);
        res.json(result);
    } catch (error) {
        console.error('Ürün senkronizasyon hatası:', error);
        res.status(500).json({ error: 'Ürünler senkronize edilirken bir hata oluştu: ' + error.message });
    }
});

// Özel ürün ayarlarını getir
router.get('/product-settings', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Supabase ile ürün ayarlarını getir
        const { data: productSettings, error } = await supabase
            .from('product_settings')
            .select('*')
            .eq('user_id', userId);
        
        if (error) throw error;
        
        res.json({
            products: productSettings
        });
    } catch (error) {
        console.error('Ürün ayarlarını getirme hatası:', error);
        res.status(500).json({ error: 'Ürün ayarları getirilirken bir hata oluştu' });
    }
});

// Trendyol'dan ürün ayarları için ürünleri getir ve önbellekle
router.get('/product-settings-sync', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Önbellek anahtarı
        const cacheKey = `product_settings_${userId}`;
        
        // Önbellekte var mı kontrol et
        const cachedData = checkCache(cacheKey);
        if (cachedData) {
            console.log('Önbellekten ürün ayarları için ürünler alındı');
            return res.json({ products: cachedData });
        }
        
        // Kullanıcının API entegrasyonunu kontrol et
        const integration = await ApiIntegration.findOne({
            where: { user_id: userId }
        });

        if (!integration) {
            return res.status(404).json({ error: 'Trendyol API entegrasyonu yapılandırılmamış' });
        }

        const { api_key, api_secret, seller_id } = integration;

        if (!api_key || !api_secret || !seller_id) {
            return res.status(400).json({ error: 'Trendyol API bilgileri eksik' });
        }
        
        console.log(`Ürün ayarları için Trendyol ürünleri alınıyor: sellerId=${seller_id}`);
        
        // Trendyol API'dan sadece satıştaki ürünleri al
        const productsResponse = await fetchTrendyolProducts(
            api_key, 
            api_secret, 
            seller_id, 
            0, // page 
            1000, // size
            true // onSale = true, sadece satıştaki ürünler
        );
        
        if (!productsResponse.success) {
            console.error('Trendyol API hatası:', productsResponse.error);
            return res.status(500).json({ 
                error: productsResponse.error?.message || 'Trendyol API\'den ürünler alınamadı' 
            });
        }
        
        // API yanıtından ürünleri al
        const products = productsResponse.data.content;
        console.log(`Ürün ayarları için ${products.length} adet ürün alındı (Toplam: ${productsResponse.data.totalElements})`);
        
        // Ürünleri önbelleğe kaydet
        setCache(cacheKey, products);
        
        // Frontend'in beklediği formatta yanıt döndür
        return res.json({ 
            products: products,
            totalElements: productsResponse.data.totalElements,
            totalPages: productsResponse.data.totalPages,
            page: productsResponse.data.page,
            size: productsResponse.data.size,
            hasNext: productsResponse.data.hasNext
        });
        
    } catch (error) {
        console.error('Ürün ayarları için ürünleri getirme hatası:', error);
        res.status(500).json({ error: 'Ürünler getirilirken bir hata oluştu' });
    }
});

// Özel ürün ayarı oluştur veya güncelle
router.post('/product-settings', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { trendyolId, barcode, cost, dimensionalWeight, minPrice, maxPrice, targetProfit } = req.body;
        
        console.log('Ürün ayarı kaydediliyor:', { trendyolId, barcode, cost, dimensionalWeight });
        
        if (!trendyolId && !barcode) {
            return res.status(400).json({ error: 'Trendyol ID veya barkod gereklidir' });
        }
        
        // Veri hazırlığı
        const productData = {
            user_id: req.user.id,
            updated_at: new Date()
        };
        
        // Değerleri güvenli şekilde işle ve ekle
        // Maliyet bilgisi varsa ve geçerli bir değerse ekle
        if (cost !== undefined && cost !== null && cost !== "undefined" && cost !== '') {
            // Sayısal değere çevir
            const costValue = parseFloat(cost);
            if (!isNaN(costValue)) {
                productData.cost = costValue;
            } else {
                productData.cost = null;
            }
        } else {
            // cost değeri tanımsızsa null olarak ata
            productData.cost = null;
        }
        
        // Desi bilgisi varsa ve geçerli bir değerse ekle
        if (dimensionalWeight !== undefined && dimensionalWeight !== null && dimensionalWeight !== "undefined") {
            const desiValue = parseFloat(dimensionalWeight);
            if (!isNaN(desiValue)) {
                productData.dimensional_weight = desiValue;
            }
        }
        
        // Minimum fiyat bilgisi varsa ve geçerli bir değerse ekle
        if (minPrice !== undefined && minPrice !== null && minPrice !== "undefined") {
            const minPriceValue = parseFloat(minPrice);
            if (!isNaN(minPriceValue)) {
                productData.min_price = minPriceValue;
            }
        }
        
        // Maksimum fiyat bilgisi varsa ve geçerli bir değerse ekle
        if (maxPrice !== undefined && maxPrice !== null && maxPrice !== "undefined") {
            const maxPriceValue = parseFloat(maxPrice);
            if (!isNaN(maxPriceValue)) {
                productData.max_price = maxPriceValue;
            }
        }
        
        // Hedef kâr bilgisi varsa ve geçerli bir değerse ekle
        if (targetProfit !== undefined && targetProfit !== null && targetProfit !== "undefined") {
            const targetProfitValue = parseFloat(targetProfit);
            if (!isNaN(targetProfitValue)) {
                productData.target_profit = targetProfitValue;
            }
        }
        
        // Önce var olan kayıt var mı kontrol et
        let existingRecord = null;
        
        if (trendyolId) {
            productData.trendyol_id = trendyolId.toString();
            
            // Trendyol ID'sine göre kayıt ara
            const { data: existingData, error: searchError } = await supabase
                .from('product_settings')
                .select('*')
                .eq('user_id', req.user.id)
                .eq('trendyol_id', trendyolId.toString())
                .maybeSingle();
                
            if (searchError && searchError.code !== 'PGRST116') throw searchError;
            existingRecord = existingData;
        } else if (barcode) {
            productData.barcode = barcode;
            
            // Barkoda göre kayıt ara
            const { data: existingData, error: searchError } = await supabase
                .from('product_settings')
                .select('*')
                .eq('user_id', req.user.id)
                .eq('barcode', barcode)
                .maybeSingle();
                
            if (searchError && searchError.code !== 'PGRST116') throw searchError;
            existingRecord = existingData;
        }
        
        let result;
        
        // Kayıt varsa güncelle, yoksa oluştur
        if (existingRecord) {
            // API'den satıştaki ürünün tüm bilgilerini al
            if (trendyolId && !existingRecord.title) {
                try {
                    // Kullanıcının API entegrasyonunu kontrol et
                    const integration = await ApiIntegration.findOne({
                        where: { user_id: userId }
                    });

                    if (integration?.api_key && integration?.api_secret && integration?.seller_id) {
                        const { api_key, api_secret, seller_id } = integration;
                        
                        // Tüm ürünleri getir
                        const productsResponse = await fetchTrendyolProducts(
                            api_key, 
                            api_secret, 
                            seller_id,
                            0,
                            1000,
                            true // sadece satıştaki ürünler
                        );
                        
                        if (productsResponse.success) {
                            // ID ile eşleşen ürünü bul
                            const matchingProduct = productsResponse.data.content.find(
                                p => p.id.toString() === trendyolId.toString()
                            );
                            
                            if (matchingProduct) {
                                // Ürün bilgilerini ekle
                                productData.title = matchingProduct.title;
                                productData.brand = matchingProduct.brand;
                                productData.category_name = matchingProduct.categoryName;
                                productData.stock_code = matchingProduct.stockCode;
                                productData.product_code = matchingProduct.productCode;
                                productData.barcode = matchingProduct.barcode;
                                productData.quantity = matchingProduct.quantity;
                                productData.stock_unit_type = matchingProduct.stockUnitType;
                                productData.list_price = matchingProduct.listPrice;
                                productData.sale_price = matchingProduct.salePrice;
                                productData.vat_rate = matchingProduct.vatRate;
                                productData.images = matchingProduct.images;
                                productData.gender = matchingProduct.gender;
                                productData.color = matchingProduct.color;
                                productData.size = matchingProduct.size;
                                productData.on_sale = true;
                            }
                        }
                    }
                } catch (apiError) {
                    console.error('Ürün bilgilerini API\'den alma hatası:', apiError);
                    // Hatayı görmezden gel ve sadece gelen verileri kullan
                }
            }
            
            // Mevcut kaydı güncelle
            const { data, error } = await supabase
                .from('product_settings')
                .update(productData)
                .eq('id', existingRecord.id)
                .select();
                
            if (error) throw error;
            result = data[0];
        } else {
            // Yeni kayıt oluşturmadan önce ürün bilgilerini API'den almayı dene
            if (trendyolId) {
                try {
                    // Kullanıcının API entegrasyonunu kontrol et
                    const integration = await ApiIntegration.findOne({
                        where: { user_id: userId }
                    });

                    if (integration?.api_key && integration?.api_secret && integration?.seller_id) {
                        const { api_key, api_secret, seller_id } = integration;
                        
                        // Tüm ürünleri getir
                        const productsResponse = await fetchTrendyolProducts(
                            api_key, 
                            api_secret, 
                            seller_id,
                            0,
                            1000,
                            true // sadece satıştaki ürünler
                        );
                        
                        if (productsResponse.success) {
                            // ID ile eşleşen ürünü bul
                            const matchingProduct = productsResponse.data.content.find(
                                p => p.id.toString() === trendyolId.toString()
                            );
                            
                            if (matchingProduct) {
                                // Ürün bilgilerini ekle
                                productData.trendyol_id = matchingProduct.id ? matchingProduct.id.toString() : null;
                                productData.title = matchingProduct.title;
                                productData.brand = matchingProduct.brand;
                                productData.category_name = matchingProduct.categoryName;
                                productData.stock_code = matchingProduct.stockCode;
                                productData.product_code = matchingProduct.productCode;
                                productData.quantity = matchingProduct.quantity ? parseInt(matchingProduct.quantity) : 0;
                                productData.stock_unit_type = matchingProduct.stockUnitType;
                                productData.list_price = matchingProduct.listPrice ? parseFloat(matchingProduct.listPrice) : 0;
                                productData.sale_price = matchingProduct.salePrice ? parseFloat(matchingProduct.salePrice) : 0;
                                productData.vat_rate = matchingProduct.vatRate ? parseFloat(matchingProduct.vatRate) : 0;
                                productData.images = matchingProduct.images;
                                productData.gender = matchingProduct.gender;
                                productData.color = matchingProduct.color;
                                productData.size = matchingProduct.size;
                                productData.on_sale = true;
                            }
                        }
                    }
                } catch (apiError) {
                    console.error('Ürün bilgilerini API\'den alma hatası:', apiError);
                    // Hatayı görmezden gel ve sadece gelen verileri kullan
                }
            }
            
            // Ürünün minimum gerekli bilgilerini ekle (API'den elde edememiş olsak bile)
            if (!productData.title) {
                productData.title = `Ürün (${barcode || productData.barcode})`;
            }
            
            // trendyol_id null olamaz hatası için
            if (!productData.trendyol_id) {
                // Benzersiz bir değer olması için barkod değerini kullan
                productData.trendyol_id = `dummy_${barcode || productData.barcode}`;
            }
            
            // Yeni ürün oluştur
            const { data, error } = await supabase
                .from('product_settings')
                .insert([productData])
                .select();
            
            if (error) throw error;
            result = data[0];
        }
        
        res.json(result);
    } catch (error) {
        console.error('Ürün ayarı kaydetme hatası:', error);
        let errorMessage = 'Ürün ayarı kaydedilirken bir hata oluştu';
        
        // Supabase hata detayını ekleyelim
        if (error.details || error.hint || error.message) {
            errorMessage += `: ${error.message}`;
            console.error('Hata detayları:', {
                details: error.details,
                hint: error.hint,
                code: error.code
            });
        }
        
        res.status(500).json({ error: errorMessage });
    }
});

// Avantajlı ürünleri getir
router.get('/advantage-products', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Supabase ile avantajlı ürünleri getir
        const { data: advantageProducts, error } = await supabase
            .from('advantage_products')
            .select('*')
            .eq('user_id', req.user.id);
            
        if (error) throw error;
        
        res.json(advantageProducts);
    } catch (error) {
        console.error('Avantajlı ürünleri getirme hatası:', error);
        res.status(500).json({ error: 'Avantajlı ürünler getirilirken bir hata oluştu' });
    }
});

// Flash ürünleri getir
router.get('/flash-products', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Supabase ile flash ürünleri getir
        const { data: flashProducts, error } = await supabase
            .from('flash_products')
            .select('*')
            .eq('user_id', req.user.id);
            
        if (error) throw error;
        
        res.json(flashProducts);
    } catch (error) {
        console.error('Flash ürünleri getirme hatası:', error);
        res.status(500).json({ error: 'Flash ürünler getirilirken bir hata oluştu' });
    }
});

// Önce DB şemasını kontrol edelim
router.get('/check-table-schema', authenticateToken, async (req, res) => {
    try {
        const { userId } = req;
        // Tabloyu sorgulatarak kolonlarını görelim
        const { data, error } = await supabase
            .from('product_settings')
            .select('*')
            .limit(1);
            
        if (error) throw error;
        
        // Mevcut kolonları alalım
        const columns = data.length > 0 ? Object.keys(data[0]) : [];
        
        res.json({
            success: true,
            columns: columns,
            sample: data
        });
    } catch (error) {
        console.error('Şema kontrol hatası:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// update-product-costs endpointini düzenleyelim - ID sorununu çözecek
router.post('/update-product-costs', authenticateToken, async (req, res) => {
    try {
        const { userId } = req;
        const { products } = req.body;
        
        if (!products || !Array.isArray(products)) {
            return res.status(400).json({
                success: false,
                error: 'Geçerli bir ürün listesi gönderilmedi'
            });
        }
        
        let updatedCount = 0;
        let errors = [];
        
        // Her bir ürün için promise oluştur
        const updatePromises = products.map(async (product) => {
            try {
                if (!product.barcode) {
                    throw new Error('Barkod bilgisi eksik');
                }
                
                // Ürün verilerini hazırla
                const productData = {
                    user_id: req.user.id,
                    updated_at: new Date(),
                    created_at: new Date()
                };
                
                // Barcode değerini her zaman ekle
                productData.barcode = product.barcode;
                
                // Maliyet bilgisi varsa ve geçerli bir değerse ekle
                if (product.cost !== undefined && product.cost !== null && product.cost !== "undefined" && product.cost !== '') {
                    // Sayısal değere çevir
                    const costValue = parseFloat(product.cost);
                    if (!isNaN(costValue)) {
                        productData.cost = costValue;
                    } else {
                        productData.cost = null;
                    }
                } else {
                    // cost değeri tanımsızsa null olarak ata
                    productData.cost = null;
                }
                
                // Kâr oranı bilgisi varsa ve geçerli bir değerse ekle
                if (product.targetProfit !== undefined && product.targetProfit !== null && product.targetProfit !== "undefined") {
                    const targetProfitValue = parseFloat(product.targetProfit);
                    if (!isNaN(targetProfitValue)) {
                        productData.target_profit = targetProfitValue;
                    }
                }
                
                // Minimum fiyat bilgisi varsa ve geçerli bir değerse ekle
                if (product.minPrice !== undefined && product.minPrice !== null && product.minPrice !== "undefined") {
                    const minPriceValue = parseFloat(product.minPrice);
                    if (!isNaN(minPriceValue)) {
                        productData.min_price = minPriceValue;
                    }
                }
                
                // Maksimum fiyat bilgisi varsa ve geçerli bir değerse ekle
                if (product.maxPrice !== undefined && product.maxPrice !== null && product.maxPrice !== "undefined") {
                    const maxPriceValue = parseFloat(product.maxPrice);
                    if (!isNaN(maxPriceValue)) {
                        productData.max_price = maxPriceValue;
                    }
                }
                
                // Desi bilgisi varsa ve geçerli bir değerse ekle
                if (product.dimensionalWeight !== undefined && product.dimensionalWeight !== null && product.dimensionalWeight !== "undefined") {
                    const desiValue = parseFloat(product.dimensionalWeight);
                    if (!isNaN(desiValue)) {
                        productData.dimensional_weight = desiValue;
                    }
                }
                
                console.log(`İşlenecek ürün verileri (${product.barcode}):`, productData);
                
                // Supabase ile ürün ayarlarını getir
                const { data: existingProduct, error: searchError } = await supabase
                    .from('product_settings')
                    .select('*')
                    .eq('user_id', req.user.id)
                    .eq('barcode', product.barcode)
                    .maybeSingle();
                    
                if (searchError && searchError.code !== 'PGRST116') throw searchError;
                
                if (existingProduct) {
                    // Mevcut ürünü güncelle
                    const { error } = await supabase
                        .from('product_settings')
                        .update(productData)
                        .eq('id', existingProduct.id);
                        
                    if (error) throw error;
                } else {
                    // Ürün bilgilerini API'den getirmeye çalış
                    try {
                        // Kullanıcının API entegrasyonunu kontrol et
                        const integration = await ApiIntegration.findOne({
                            where: { user_id: userId }
                        });
    
                        if (integration?.api_key && integration?.api_secret && integration?.seller_id) {
                            const { api_key, api_secret, seller_id } = integration;
                            
                            // Tüm ürünleri getir (sadece barkod için arama yap)
                            const productsResponse = await fetchTrendyolProducts(
                                api_key, 
                                api_secret, 
                                seller_id,
                                0,
                                1000,
                                true // sadece satıştaki ürünler
                            );
                            
                            if (productsResponse.success) {
                                // Barkod ile eşleşen ürünü bul
                                const matchingProduct = productsResponse.data.content.find(
                                    p => p.barcode === product.barcode
                                );
                                
                                if (matchingProduct) {
                                    // Ürün bilgilerini ekle
                                    productData.trendyol_id = matchingProduct.id ? matchingProduct.id.toString() : null;
                                    productData.title = matchingProduct.title;
                                    productData.brand = matchingProduct.brand;
                                    productData.category_name = matchingProduct.categoryName;
                                    productData.stock_code = matchingProduct.stockCode;
                                    productData.product_code = matchingProduct.productCode;
                                    productData.quantity = matchingProduct.quantity ? parseInt(matchingProduct.quantity) : 0;
                                    productData.stock_unit_type = matchingProduct.stockUnitType;
                                    productData.list_price = matchingProduct.listPrice ? parseFloat(matchingProduct.listPrice) : 0;
                                    productData.sale_price = matchingProduct.salePrice ? parseFloat(matchingProduct.salePrice) : 0;
                                    productData.vat_rate = matchingProduct.vatRate ? parseFloat(matchingProduct.vatRate) : 0;
                                    productData.images = matchingProduct.images;
                                    productData.gender = matchingProduct.gender;
                                    productData.color = matchingProduct.color;
                                    productData.size = matchingProduct.size;
                                    productData.on_sale = true;
                                }
                            }
                        }
                    } catch (apiError) {
                        console.error('Ürün bilgilerini API\'den alma hatası:', apiError);
                        // Hatayı görmezden gel ve sadece gelen verileri kullan
                    }
                    
                    // Ürünün minimum gerekli bilgilerini ekle (API'den elde edememiş olsak bile)
                    if (!productData.title) {
                        productData.title = `Ürün (${product.barcode})`;
                    }
                    
                    // trendyol_id null olamaz hatası için
                    if (!productData.trendyol_id) {
                        // Benzersiz bir değer olması için barkod değerini kullan
                        productData.trendyol_id = `dummy_${product.barcode}`;
                    }
                    
                    // Yeni ürün oluştur
                    const { data, error } = await supabase
                        .from('product_settings')
                        .insert([productData])
                        .select();
                        
                    if (error) throw error;
                }
                
                updatedCount++; // Başarıyla güncellenen ürün sayısını artır
                return { success: true, barcode: product.barcode };
            } catch (error) {
                console.error(`Ürün güncelleme hatası (${product.barcode}):`, error);
                errors.push({ barcode: product.barcode, message: error.message });
                return { 
                    success: false, 
                    barcode: product.barcode, 
                    error: error.message 
                };
            }
        });
        
        // Tüm güncellemeleri bekle
        await Promise.all(updatePromises);
        
        res.json({
            success: true,
            updatedCount: updatedCount,
            errors: errors
        });
    } catch (error) {
        console.error('Ürün maliyetleri güncelleme hatası:', error);
        res.status(500).json({ error: 'Ürün maliyetleri güncellenirken bir hata oluştu: ' + error.message });
    }
});

// Önbelleği temizle
router.post('/clear-cache', authenticateToken, async (req, res) => {
    try {
        clearCache();
        console.log('Önbellek manuel olarak temizlendi');
        res.json({ success: true, message: 'Önbellek başarıyla temizlendi' });
    } catch (error) {
        console.error('Önbellek temizleme hatası:', error);
        res.status(500).json({ error: 'Önbellek temizlenirken bir hata oluştu' });
    }
});

// Ürün kar analizi endpoint'i
router.get('/product-profit', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Önbellekten kontrol et
        const cacheKey = `profit-products-${userId}`;
        const cachedProducts = checkCache(cacheKey);
        
        if (cachedProducts) {
            return res.json({ success: true, products: cachedProducts });
        }
        
        // Trendyol API entegrasyonunu kontrol et
        const integration = await ApiIntegration.findOne({
            where: { user_id: userId }
        });
        
        if (!integration) {
            return res.status(400).json({ 
                success: false, 
                message: 'Trendyol API entegrasyonu yapılandırılmamış' 
            });
        }
        
        const { api_key, api_secret, seller_id } = integration;
        
        if (!api_key || !api_secret || !seller_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Trendyol API bilgileri eksik' 
            });
        }
        
        // Satıştaki ürünleri getir
        const productsResponse = await fetchTrendyolProducts(api_key, api_secret, seller_id, 0, 1000, true);
        
        if (!productsResponse.success) {
            return res.status(500).json({ 
                success: false, 
                message: productsResponse.error?.message || 'Trendyol API\'den ürünler alınamadı' 
            });
        }
        
        const trendyolProducts = productsResponse.data.content;
        
        // Ürünlerin maliyetlerini veritabanından getir
        const productBarcodes = trendyolProducts.map(p => p.barcode);
        
        // Veritabanından ürün maliyetlerini sorgula
        const { data: dbProducts } = await supabase
            .from('product_settings')
            .select('*')
            .eq('user_id', req.user.id);
        
        // Maliyet bilgilerini barcode'a göre eşleştirmek için map oluştur
        const productCostsMap = {};
        dbProducts.forEach(product => {
            productCostsMap[product.barcode] = {
                cost: product.cost || 0,
                dimensional_weight: product.dimensional_weight || 0
            };
        });
        
        // Platform sabit değerleri
        const PLATFORM_SERVICE_FEE = 6.99; // Platform hizmet bedeli (TL)
        const VAT_RATE = 0.20; // KDV oranı (%20)
        
        // Kargo ücreti hesaplama fonksiyonu (desi değerine göre)
        const calculateShippingCost = (desi) => {
            // 2024 Trendyol kargo fiyatları (Başlangıç fiyatı 31.77 TL - 1 desi)
            const BASE_SHIPPING_COST = 31.77;
            
            if (!desi || desi <= 0) return BASE_SHIPPING_COST;
            
            if (desi <= 1) return BASE_SHIPPING_COST;
            if (desi <= 2) return 37.30;
            if (desi <= 3) return 44.80;
            if (desi <= 4) return 52.25;
            if (desi <= 5) return 58.75;
            if (desi <= 6) return 63.32;
            if (desi <= 7) return 67.39;
            if (desi <= 8) return 71.52;
            if (desi <= 9) return 76.16;
            if (desi <= 10) return 80.24;
            if (desi <= 11) return 84.39;
            if (desi <= 12) return 89.00;
            if (desi <= 13) return 93.14;
            if (desi <= 14) return 96.83;
            if (desi <= 15) return 100.98;
            if (desi <= 16) return 103.68;
            if (desi <= 17) return 106.94;
            if (desi <= 18) return 109.64;
            if (desi <= 19) return 111.78;
            if (desi <= 20) return 113.92;
            if (desi <= 21) return 117.00;
            if (desi <= 22) return 121.15;
            if (desi <= 23) return 124.29;
            if (desi <= 24) return 126.45;
            if (desi <= 25) return 128.59;
            if (desi <= 26) return 130.33;
            if (desi <= 27) return 132.91;
            if (desi <= 28) return 135.05;
            if (desi <= 29) return 137.20;
            if (desi <= 30) return 139.34;
            
            // 30 desi üzeri için her desi başına ek ücret
            return 139.34 + ((desi - 30) * 2.4);
        };
        
        // Komisyon oranını kategori bazında hesaplama (basitleştirilmiş)
        const getCommissionRate = (categoryName) => {
            // Kategori bazlı komisyon oranları (varsayılan olarak %15)
            const categoryCommissions = {
                'Elektronik': 0.10,
                'Bilgisayar': 0.10,
                'Cep Telefonu': 0.08,
                'Giyim': 0.15,
                'Ayakkabı': 0.17,
                'Ev & Yaşam': 0.15,
                'Kitap': 0.12,
                'Kozmetik': 0.18,
                'Spor': 0.16,
                'Oyuncak': 0.14,
                'Bahçe': 0.15,
                'Otomotiv': 0.12,
                'Takı & Mücevher': 0.20,
                'Petshop': 0.13
            };
            
            if (!categoryName) return 0.15; // Varsayılan komisyon oranı
            
            // Kategori adında geçen anahtar kelimelere göre komisyon oranını bul
            for (const [category, rate] of Object.entries(categoryCommissions)) {
                if (categoryName.toLowerCase().includes(category.toLowerCase())) {
                    return rate;
                }
            }
            
            return 0.15; // Kategori bulunamazsa varsayılan komisyon oranı
        };
        
        // Kar hesaplama ve analiz
        const profitProducts = trendyolProducts.map(product => {
            // Ürün maliyeti bilgilerini al
            const productCost = productCostsMap[product.barcode] || { cost: 0, dimensional_weight: product.dimensionalWeight || 0 };
            
            // Satış fiyatı (KDV dahil)
            const salePrice = product.salePrice || 0;
            
            // Maliyet (eğer veritabanında varsa o değeri kullan, yoksa 0)
            const cost = productCost.cost || 0;
            
            // Desi değeri
            const desiFactor = productCost.dimensional_weight || product.dimensionalWeight || 1;
            
            // Kargo ücreti hesapla
            const shippingCost = calculateShippingCost(desiFactor);
            
            // Kategori bazlı komisyon oranı
            const commissionRate = getCommissionRate(product.categoryName);
            
            // Komisyon tutarı hesapla
            const commissionAmount = salePrice * commissionRate;
            
            // Platform hizmet bedeli
            const platformFee = PLATFORM_SERVICE_FEE;
            
            // KDV hesaplamaları
            const saleVAT = salePrice * (VAT_RATE / (1 + VAT_RATE)); // Satış KDV'si
            const costVAT = cost * (VAT_RATE / (1 + VAT_RATE)); // Maliyet KDV'si
            const commissionVAT = commissionAmount * (VAT_RATE / (1 + VAT_RATE)); // Komisyon KDV'si
            const shippingVAT = shippingCost * (VAT_RATE / (1 + VAT_RATE)); // Kargo KDV'si
            const platformFeeVAT = platformFee * (VAT_RATE / (1 + VAT_RATE)); // Platform hizmet bedeli KDV'si
            
            // Net KDV
            const netVAT = saleVAT - costVAT - commissionVAT - shippingVAT - platformFeeVAT;
            
            // Kar hesapla
            const profit = salePrice - cost - commissionAmount - shippingCost - platformFee - netVAT;
            
            // Kar marjı hesapla (%)
            const profitMargin = salePrice > 0 ? profit / salePrice : 0;
            
            // Ürün bilgilerini döndür
            return {
                ...product,
                sale_price: salePrice,
                cost,
                commissionRate,
                commissionAmount,
                shippingCost,
                platformFee,
                profit,
                profitMargin,
                dimensional_weight: desiFactor
            };
        });
        
        // Önbelleğe kaydet
        setCache(cacheKey, profitProducts);
        
        // Başarılı yanıt
        return res.json({
            success: true,
            products: profitProducts
        });
    } catch (error) {
        console.error('Ürün kar analizi hatası:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || 'Ürün kar analizi yapılırken bir hata oluştu' 
        });
    }
});

// Flash ürünleri yükleme endpoint'i
router.post('/upload-flash-products', authenticateToken, async (req, res) => {
  try {
    const { products } = req.body;
    
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Geçerli ürün verisi bulunamadı. Lütfen Excel dosyasını kontrol edin.' 
      });
    }
    
    console.log(`${products.length} flash ürün yükleme isteği alındı`);
    
    const userId = req.user.id;
    
    // Veritabanına ürünleri ekle
    const { data: existingProducts, error: fetchError } = await supabase
      .from('flash_products')
      .select('barcode')
      .eq('user_id', userId);
    
    if (fetchError) {
      console.error('Mevcut ürünleri sorgulama hatası:', fetchError);
      return res.status(500).json({ 
        success: false, 
        message: 'Veritabanı sorgulama hatası oluştu.' 
      });
    }
    
    // Mevcut barkodları al
    const existingBarcodes = existingProducts.map(p => p.barcode);
    
    // Her ürün için insert veya update işlemi yap
    const flashProductsToUpsert = products.map(product => ({
      user_id: userId,
      barcode: product.barcode,
      title: product.title,
      brand: product.brand,
      category: product.category,
      quantity: product.quantity,
      sale_price: product.sale_price,
      commission: product.commission,
      option1_price: product.option1_price,
      option2_price: product.option2_price,
      selected_flash_price: product.selected_flash_price,
      flash_start_date: product.flash_start_date,
      flash_end_date: product.flash_end_date,
      product_code: product.product_code
    }));
    
    // Upsert işlemi
    const { data: insertResult, error: insertError } = await supabase
      .from('flash_products')
      .upsert(flashProductsToUpsert, { onConflict: 'user_id, barcode' });
    
    if (insertError) {
      console.error('Flash ürün ekleme hatası:', insertError);
      return res.status(500).json({ 
        success: false, 
        message: 'Ürünler veritabanına eklenirken bir hata oluştu.' 
      });
    }
    
    // Önbelleği temizle
    clearCache();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Flash ürünler başarıyla yüklendi.',
      importedCount: products.length
    });
    
  } catch (error) {
    console.error('Flash ürün yükleme hatası:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Beklenmeyen bir hata oluştu: ' + error.message 
    });
  }
});

module.exports = router; 