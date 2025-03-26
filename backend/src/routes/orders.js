const express = require('express');
const router = express.Router();
const axios = require('axios');
const authenticateToken = require('../middleware/authMiddleware');
const { ApiIntegration } = require('../models');
const Order = require('../models/Order');

// Trendyol API endpoint'i
const TRENDYOL_API_URL = 'https://api.trendyol.com/sapigw';

// Önbellek için basit bir Map
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

// Siparişleri getir
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 0, size = 10, status } = req.query;
        const userId = req.user.id;

        console.log('Kullanıcı ID:', userId); // Debug log

        // API bilgilerini al
        const apiIntegration = await ApiIntegration.findOne({
            where: { user_id: userId }
        });

        console.log('API Entegrasyon:', apiIntegration); // Debug log

        if (!apiIntegration) {
            return res.status(404).json({ message: 'API bilgileri bulunamadı' });
        }

        if (!apiIntegration.api_key || !apiIntegration.api_secret || !apiIntegration.seller_id) {
            return res.status(400).json({ message: 'Eksik API bilgileri. Lütfen ayarlar sayfasından API bilgilerinizi kontrol edin.' });
        }

        // Basic Authentication için API key ve secret'ı base64 ile kodla
        const authString = Buffer.from(`${apiIntegration.api_key}:${apiIntegration.api_secret}`).toString('base64');

        console.log('API İsteği yapılıyor...'); // Debug log

        // Trendyol'dan siparişleri getir
        const response = await axios.get(
            `${TRENDYOL_API_URL}/suppliers/${apiIntegration.seller_id}/orders`,
            {
                headers: {
                    'Authorization': `Basic ${authString}`,
                    'User-Agent': `${apiIntegration.seller_id} - SelfIntegration`,
                    'Content-Type': 'application/json'
                },
                params: {
                    page,
                    size,
                    status,
                    orderByField: 'PackageLastModifiedDate',
                    orderByDirection: 'DESC'
                }
            }
        );

        console.log('Trendyol API Yanıtı:', response.data); // Debug log

        // Siparişleri veritabanına kaydet/güncelle
        if (response.data.content) {
            for (const order of response.data.content) {
                try {
                    await Order.upsert({
                        user_id: userId,
                        order_number: order.orderNumber,
                        customer_first_name: order.customerFirstName,
                        customer_last_name: order.customerLastName,
                        customer_email: order.customerEmail,
                        total_price: order.totalPrice,
                        status: order.status,
                        lines: order.lines || [],
                        order_date: new Date(order.orderDate),
                        last_update_date: new Date()
                    });
                } catch (error) {
                    console.error(`Sipariş kaydedilirken hata: ${error.message}`, error);
                    // Tekil hataları yoksay, döngüye devam et
                }
            }
        }

        // Frontend'e gönderilecek verileri hazırla
        const orders = response.data.content.map(order => ({
            ...order,
            lines: order.lines || [],
            orderDate: new Date(order.orderDate),
            lastUpdateDate: new Date(order.lastModifiedDate)
        }));

        res.json({
            orders: orders,
            totalElements: response.data.totalElements,
            totalPages: response.data.totalPages,
            currentPage: response.data.page,
            hasNext: response.data.hasNext
        });

    } catch (error) {
        console.error('Detaylı hata bilgisi:', {
            message: error.message,
            response: error.response?.data,
            stack: error.stack
        });

        // API yanıt hatası
        if (error.response) {
            if (error.response.status === 401) {
                return res.status(401).json({
                    message: 'API kimlik doğrulama hatası. Lütfen API bilgilerinizi kontrol edin.',
                    error: 'AUTH_ERROR'
                });
            }
            if (error.response.status === 404) {
                return res.status(404).json({
                    message: 'Sipariş bulunamadı',
                    error: 'NOT_FOUND'
                });
            }
            if (error.response.status === 429) {
                return res.status(429).json({
                    message: 'İstek limiti aşıldı. Lütfen daha sonra tekrar deneyin.',
                    error: 'RATE_LIMIT'
                });
            }
            return res.status(error.response.status).json({
                message: error.response.data?.message || 'Trendyol API hatası',
                error: error.response.data
            });
        }

        // Diğer hatalar
        res.status(500).json({
            message: 'Siparişler alınırken bir hata oluştu',
            error: {
                message: error.message,
                type: error.name,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }
        });
    }
});

// Sipariş detayı getir
router.get('/:orderNumber', authenticateToken, async (req, res) => {
    try {
        const { orderNumber } = req.params;
        const userId = req.user.id;

        const apiIntegration = await ApiIntegration.findOne({
            where: { user_id: userId }
        });

        if (!apiIntegration) {
            return res.status(404).json({ message: 'API bilgileri bulunamadı' });
        }

        const authString = Buffer.from(`${apiIntegration.api_key}:${apiIntegration.api_secret}`).toString('base64');

        const response = await axios.get(
            `${TRENDYOL_API_URL}/suppliers/${apiIntegration.seller_id}/orders/${orderNumber}`,
            {
                headers: {
                    'Authorization': `Basic ${authString}`,
                    'User-Agent': `${apiIntegration.seller_id} - SelfIntegration`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json(response.data);

    } catch (error) {
        console.error('Sipariş detayı alınırken hata:', error.response?.data || error.message);
        res.status(500).json({ 
            message: 'Sipariş detayı alınırken bir hata oluştu',
            error: error.response?.data || error.message 
        });
    }
});

// Sipariş durumu güncelle
router.put('/status', authenticateToken, async (req, res) => {
    try {
        const { orderNumbers, status } = req.body;
        const userId = req.user.id;

        const apiIntegration = await ApiIntegration.findOne({
            where: { user_id: userId }
        });

        if (!apiIntegration) {
            return res.status(404).json({ message: 'API bilgileri bulunamadı' });
        }

        const authString = Buffer.from(`${apiIntegration.api_key}:${apiIntegration.api_secret}`).toString('base64');

        const response = await axios.put(
            `${TRENDYOL_API_URL}/suppliers/${apiIntegration.seller_id}/orders/status`,
            { orderNumbers, status },
            {
                headers: {
                    'Authorization': `Basic ${authString}`,
                    'User-Agent': `${apiIntegration.seller_id} - SelfIntegration`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Veritabanındaki siparişleri güncelle
        try {
            await Order.update(
                { 
                    status, 
                    last_update_date: new Date() 
                },
                { 
                    where: { 
                        order_number: orderNumbers,
                        user_id: userId 
                    } 
                }
            );
        } catch (error) {
            console.error(`Sipariş durumu güncellenirken veritabanı hatası: ${error.message}`, error);
            // Hata olsa bile API yanıtını döndürelim
        }

        res.json(response.data);

    } catch (error) {
        console.error('Sipariş durumu güncellenirken hata:', error.response?.data || error.message);
        res.status(500).json({ 
            message: 'Sipariş durumu güncellenirken bir hata oluştu',
            error: error.response?.data || error.message 
        });
    }
});

module.exports = router; 