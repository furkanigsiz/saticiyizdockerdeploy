const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticateToken = require('../middleware/authMiddleware');
const { userService, sessionService } = require('../services/supabaseService');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const router = express.Router();

// JWT ayarları
const JWT_SECRET = process.env.JWT_SECRET || 'saticiyz_jwt_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Admin rolünü doğrulama
const authenticateAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Erişim reddedildi: Sadece yöneticiler erişebilir' });
    }
    next();
};

// Admin paneli erişimi
router.get('/admin', authenticateToken, authenticateAdmin, (req, res) => {
    res.status(200).json({ message: 'Yönetici paneline hoş geldiniz!' });
});

// Korunan rota: Mevcut kullanıcı bilgilerini döndür
router.get("/me", authenticateToken, async (req, res) => {
    try {
        // Kullanıcı bilgileri zaten req.user'da bulunuyor
        const { password, ...userWithoutPassword } = req.user;
        
        res.status(200).json(userWithoutPassword);
    } catch (error) {
        console.error("Kullanıcı bilgileri getirilemedi:", error);
        res.status(500).json({ error: "Bir hata oluştu." });
    }
});

// Kullanıcı bilgileri güncelleme
router.put("/update", authenticateToken, async (req, res) => {
    try {
        const { firstName, lastName, phone } = req.body;
        const userId = req.user.id;

        // Kullanıcı bilgilerini güncelle
        const updatedUser = await userService.updateUser(userId, {
            first_name: firstName || req.user.first_name,
            last_name: lastName || req.user.last_name,
            phone: phone || req.user.phone,
            updated_at: new Date()
        });

        if (!updatedUser) {
            return res.status(404).json({ error: "Kullanıcı bilgileri güncellenemedi." });
        }

        res.status(200).json({
            message: "Kullanıcı bilgileri başarıyla güncellendi.",
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                firstName: updatedUser.first_name,
                lastName: updatedUser.last_name,
                phone: updatedUser.phone,
                role: updatedUser.role
            }
        });
    } catch (error) {
        console.error("Kullanıcı bilgileri güncellenirken hata:", error);
        res.status(500).json({ error: "Bir hata oluştu." });
    }
});

// Kullanıcı oluşturma
router.post('/create', async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone } = req.body;

        // Email kontrolü
        const existingUser = await userService.getUserByEmail(email.toLowerCase());
        if (existingUser) {
            return res.status(400).json({ error: 'Bu e-posta adresi zaten kullanımda' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Kullanıcı oluştur
        const newUser = await userService.createUser({
            first_name: firstName,
            last_name: lastName,
            email: email.toLowerCase(),
            password: hashedPassword,
            phone,
            role: 'user',
            created_at: new Date(),
            updated_at: new Date()
        });

        res.status(201).json({
            message: "Kullanıcı başarıyla oluşturuldu.",
            user: {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.first_name,
                lastName: newUser.last_name,
                phone: newUser.phone
            }
        });
    } catch (err) {
        console.error("Kullanıcı oluşturulurken hata:", err);
        res.status(500).json({ error: 'Kullanıcı oluşturulamadı', details: err.message });
    }
});

// Kullanıcı giriş
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log("Giriş yapılan email:", email);

        // Kullanıcıyı bul
        const user = await userService.getUserByEmail(email.trim().toLowerCase());

        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }

        // Şifreyi doğrula
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Geçersiz kimlik bilgileri' });
        }

        // JWT oluştur
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Yenileme tokeni oluştur
        const refreshToken = uuidv4();
        
        // Oturum oluştur
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 gün geçerli
        
        await sessionService.createSession({
            user_id: user.id,
            refresh_token: refreshToken,
            is_active: true,
            expires_at: expiresAt.toISOString(),
            created_at: new Date(),
            updated_at: new Date()
        });

        console.log("JWT Token oluşturuldu");

        res.status(200).json({
            token,
            refreshToken,
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone,
            role: user.role,
        });
    } catch (err) {
        console.error("Giriş hatası:", err);
        res.status(500).json({ error: 'Giriş başarısız', details: err.message });
    }
});

// Kullanıcı listeleme (şifre hariç) - Sadece Admin erişebilir
router.get('/list', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        
        // Şifreleri kaldır
        const usersWithoutPasswords = users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                phone: user.phone,
                role: user.role,
                createdAt: user.created_at,
                updatedAt: user.updated_at
            };
        });
        
        res.status(200).json(usersWithoutPasswords);
    } catch (err) {
        console.error("Kullanıcılar listelenirken hata:", err);
        res.status(500).json({ error: 'Kullanıcılar getirilemedi', details: err.message });
    }
});

// Token yenileme
router.post('/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(400).json({ error: 'Yenileme tokeni gerekli' });
        }
        
        // Yenileme tokenine sahip aktif oturumu bul
        const session = await sessionService.getSessionByRefreshToken(refreshToken);
        
        if (!session) {
            return res.status(401).json({ error: 'Geçersiz yenileme tokeni' });
        }
        
        // Kullanıcıyı al
        const user = await userService.getUserById(session.user_id);
        
        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }
        
        // Yeni JWT oluştur
        const newToken = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
        
        res.status(200).json({
            token: newToken,
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone,
            role: user.role
        });
    } catch (err) {
        console.error("Token yenileme hatası:", err);
        res.status(500).json({ error: 'Token yenilenemedi', details: err.message });
    }
});

// Çıkış yap
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (refreshToken) {
            // Mevcut oturumu devre dışı bırak
            await sessionService.deactivateSession(refreshToken);
        }
        
        res.status(200).json({ message: 'Başarıyla çıkış yapıldı' });
    } catch (err) {
        console.error("Çıkış hatası:", err);
        res.status(500).json({ error: 'Çıkış yapılamadı', details: err.message });
    }
});

// Token doğrulama endpoint'i
router.post('/verify', authenticateToken, async (req, res) => {
    try {
        console.log('Verify endpoint çağrıldı');
        console.log('Kullanıcı ID:', req.user.id);

        // Kullanıcı bilgileri zaten req.user'da bulunuyor (authMiddleware'den geliyor)
        const { password, ...userWithoutPassword } = req.user;

        console.log('Kullanıcı bilgileri gönderiliyor');

        res.json({
            valid: true,
            userData: {
                id: req.user.id,
                email: req.user.email,
                firstName: req.user.first_name,
                lastName: req.user.last_name,
                phone: req.user.phone,
                role: req.user.role,
                subscription_status: req.user.subscription_status,
                subscription_plan: req.user.subscription_plan,
                has_used_trial: req.user.has_used_trial,
                trial_start_date: req.user.trial_start_date,
                trial_end_date: req.user.trial_end_date
            }
        });
    } catch (error) {
        console.error('Verify endpoint hatası:', error);
        res.status(500).json({ 
            valid: false,
            message: 'Sunucu hatası: ' + error.message
        });
    }
});

// Deneme süreci başlatma
router.post('/start-trial', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Kullanıcı bilgilerini al
        const user = await userService.getUserById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }
        
        // Kullanıcının daha önce deneme süreci kullanıp kullanmadığını kontrol et
        if (user.has_used_trial) {
            return res.status(400).json({ error: 'Deneme süreci daha önce kullanılmış' });
        }
        
        // Tarih hesaplamaları
        const now = new Date();
        const trialEndDate = new Date();
        trialEndDate.setDate(now.getDate() + 7); // 7 günlük deneme süresi
        
        // Kullanıcı bilgilerini güncelle
        const updatedUser = await userService.updateUser(userId, {
            subscription_status: 'trial',
            has_used_trial: true,
            trial_start_date: now,
            trial_end_date: trialEndDate,
            updated_at: now
        });
        
        res.status(200).json({
            message: 'Deneme süreci başarıyla başlatıldı',
            subscription_status: 'trial',
            trial_start_date: now,
            trial_end_date: trialEndDate
        });
    } catch (error) {
        console.error('Deneme süreci başlatma hatası:', error);
        res.status(500).json({ error: 'Deneme süreci başlatılamadı', details: error.message });
    }
});

// Abonelik başlatma
router.post('/subscribe', authenticateToken, async (req, res) => {
    try {
        const { plan } = req.body;
        const userId = req.user.id;
        
        if (!plan || !['standart', 'premium'].includes(plan)) {
            return res.status(400).json({ error: 'Geçersiz abonelik planı' });
        }
        
        // Kullanıcı bilgilerini güncelle
        const now = new Date();
        const updatedUser = await userService.updateUser(userId, {
            subscription_status: 'active',
            subscription_plan: plan,
            updated_at: now
        });
        
        res.status(200).json({
            message: 'Abonelik başarıyla başlatıldı',
            subscription_status: 'active',
            subscription_plan: plan
        });
    } catch (error) {
        console.error('Abonelik başlatma hatası:', error);
        res.status(500).json({ error: 'Abonelik başlatılamadı', details: error.message });
    }
});

module.exports = router;
