const express = require("express");
const router = express.Router();
const { User, ApiIntegration } = require("../models");
const authenticateToken = require("../middleware/authMiddleware");
const { PrismaClient } = require('../services/prismaShim');
const prisma = new PrismaClient();
const { userService, integrationService } = require("../services/supabaseService");

// Hesap Bilgileri Güncelleme
router.post("/account", authenticateToken, async (req, res) => {
    try {
        const { firstName, lastName, phone } = req.body;
        const userId = req.user.id;

        // Güncelleme verilerini hazırlayın
        const updateData = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (phone) updateData.phone = phone;

        // Kullanıcı bilgilerini güncelle
        const [updatedRows] = await User.update(updateData, { where: { id: userId } });

        if (updatedRows > 0) {
            res.status(200).json({ message: "Hesap bilgileri başarıyla güncellendi!" });
        } else {
            res.status(404).json({ error: "Kullanıcı bulunamadı veya değişiklik yapılmadı." });
        }
    } catch (error) {
        console.error("Hesap bilgileri güncellenirken hata:", error);
        res.status(500).json({ error: "Bir hata oluştu. Lütfen tekrar deneyin." });
    }
});

// Trendyol API Bilgileri Kaydetme
router.post("/api", authenticateToken, async (req, res) => {
    try {
        const { sellerId, apiKey, apiSecret } = req.body;
        const userId = req.user.id;

        console.log("Kaydedilecek Kullanıcı ID:", userId);

        // Var olan API entegrasyonunu kontrol et
        const existingIntegration = await ApiIntegration.findOne({
            where: { user_id: userId },
        });

        if (existingIntegration) {
            // Mevcut entegrasyonu güncelle
            await ApiIntegration.update(
                { seller_id: sellerId, api_key: apiKey, api_secret: apiSecret },
                { where: { user_id: userId } }
            );
            res.status(200).json({ message: "API bilgileri başarıyla güncellendi!" });
        } else {
            // Yeni API entegrasyonu oluştur
            await ApiIntegration.create({
                user_id: userId,
                seller_id: sellerId,
                api_key: apiKey,
                api_secret: apiSecret,
            });
            res.status(201).json({ message: "API bilgileri başarıyla kaydedildi!" });
        }
    } catch (error) {
        console.error("API bilgileri kaydedilirken hata:", error.message);
        res.status(500).json({ error: "API bilgileri kaydedilirken bir hata oluştu." });
    }
});

// Trendyol API Bilgilerini Getirme
router.get("/api", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('API bilgileri isteği alındı. Kullanıcı ID:', userId);

        const integration = await integrationService.getUserIntegration(userId);

        if (!integration) {
            return res.status(404).json({ error: "API bilgileri bulunamadı." });
        }

        res.status(200).json({
            seller_id: integration.seller_id,
            api_key: integration.api_key,
            api_secret: integration.api_secret
        });
    } catch (error) {
        console.error("API bilgileri getirilirken hata:", error);
        res.status(500).json({ error: "Bir hata oluştu. Lütfen tekrar deneyin." });
    }
});

// Kullanıcı ve API bilgilerini getir
router.get('/user-info', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('Kullanıcı bilgileri isteği alındı. Kullanıcı ID:', userId);

        // userService kullanarak kullanıcı bilgilerini al
        const userInfo = await userService.getUserById(userId);

        if (!userInfo) {
            console.error('Kullanıcı bulunamadı. ID:', userId);
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }

        // API entegrasyonu bilgilerini al
        const apiIntegration = await integrationService.getUserIntegration(userId);

        // Frontend'in beklediği formata dönüştür
        const formattedUserInfo = {
            id: userInfo.id,
            email: userInfo.email,
            first_name: userInfo.first_name,
            last_name: userInfo.last_name,
            phone: userInfo.phone,
            role: userInfo.role,
            api_settings: apiIntegration || {}
        };

        console.log('Kullanıcı bilgileri başarıyla gönderiliyor:', {
            id: formattedUserInfo.id,
            email: formattedUserInfo.email
        });

        res.json(formattedUserInfo);
    } catch (error) {
        console.error('Kullanıcı bilgileri alınırken hata:', error);
        res.status(500).json({ 
            message: 'Kullanıcı bilgileri alınırken bir hata oluştu',
            error: error.message 
        });
    }
});

// Kullanıcı bilgilerini güncelle
router.put('/user-info', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { first_name, last_name, email, phone } = req.body;
        console.log('Kullanıcı bilgileri güncelleme isteği alındı. Kullanıcı ID:', userId);

        // userService kullanarak kullanıcı bilgilerini güncelle
        const updatedUser = await userService.updateUser(userId, {
            first_name,
            last_name,
            email,
            phone
        });

        console.log('Kullanıcı bilgileri başarıyla güncellendi:', {
            id: updatedUser.id,
            email: updatedUser.email
        });

        res.json({
            id: updatedUser.id,
            email: updatedUser.email,
            first_name: updatedUser.first_name,
            last_name: updatedUser.last_name,
            phone: updatedUser.phone,
            role: updatedUser.role
        });
    } catch (error) {
        console.error('HATA (Kullanıcı Güncelleme):', error);
        res.status(500).json({ message: 'Kullanıcı bilgileri güncellenirken bir hata oluştu' });
    }
});

// API bilgilerini güncelle
router.put('/api-settings', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { api_key, api_secret, seller_id } = req.body;
        console.log('API ayarları güncelleme isteği alındı. Kullanıcı ID:', userId);

        // Mevcut entegrasyonu kontrol et
        const existingIntegration = await integrationService.getUserIntegration(userId);

        let updatedApiSettings;
        if (existingIntegration) {
            // Mevcut entegrasyonu güncelle
            updatedApiSettings = await integrationService.updateIntegration(userId, {
                api_key,
                api_secret,
                seller_id,
                updated_at: new Date()
            });
        } else {
            // Yeni entegrasyon oluştur
            updatedApiSettings = await integrationService.createIntegration({
                user_id: userId,
                api_key,
                api_secret,
                seller_id,
                created_at: new Date(),
                updated_at: new Date()
            });
        }

        console.log('API ayarları başarıyla güncellendi');

        res.json({
            message: 'API bilgileri başarıyla güncellendi',
            data: {
                seller_id: updatedApiSettings.seller_id,
                api_key: '***gizli***',
                api_secret: '***gizli***'
            }
        });
    } catch (error) {
        console.error('HATA (API Ayarları Güncelleme):', error);
        res.status(500).json({ 
            message: 'API ayarları güncellenirken bir hata oluştu',
            error: error.message 
        });
    }
});

module.exports = router;
