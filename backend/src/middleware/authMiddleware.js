/**
 * Yetkilendirme Middleware'i - Supabase Uyumlu
 * 
 * Bu middleware, JWT tokeni doğrular ve kullanıcı bilgisini talebe ekler.
 * Supabase'in oturum yönetimi ile uyumlu çalışır.
 */

const jwt = require('jsonwebtoken');
const { sessionService, userService } = require('../services/supabaseService');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'saticiyz_jwt_secret_key_2024';

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];

    // Bearer token
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Erişim Reddedildi: Token sağlanmadı' });
    }

    try {
        // JWT token'ı doğrula
        console.log('Token doğrulanıyor...');
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Token başarıyla doğrulandı. Decoded:', decoded);
        
        // Kullanıcı ID'sini al
        const userId = decoded.userId || decoded.user_id || decoded.sub;
        console.log('Token içinden çıkarılan kullanıcı ID:', userId);
        
        if (!userId) {
            console.error('Token içinde kullanıcı ID bulunamadı. Token yapısı:', decoded);
            return res.status(403).json({ error: 'Geçersiz token: Kullanıcı ID bulunamadı' });
        }
        
        // Kullanıcıyı veritabanından al
        const user = await userService.getUserById(userId);
        
        if (!user) {
            return res.status(403).json({ error: 'Geçersiz token: Kullanıcı bulunamadı' });
        }
        
        // Kullanıcı bilgisini talebe ekle (şifre hariç)
        const { password, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;
        
        next();
    } catch (err) {
        console.error('Token doğrulama hatası:', err.message);
        console.error('Hata detayları:', err);
        return res.status(403).json({ error: 'Geçersiz token' });
    }
};

module.exports = authenticateToken;
