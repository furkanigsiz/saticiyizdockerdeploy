const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../models');
const { authenticateToken } = require('../middleware/auth');

// ... existing routes ...

// Token doğrulama endpoint'i
router.post('/verify', authenticateToken, async (req, res) => {
    try {
        console.log('Verify endpoint çağrıldı');
        console.log('Kullanıcı ID:', req.user.id);

        const user = await db.User.findByPk(req.user.id, {
            attributes: ['id', 'email', 'firstName', 'lastName', 'phone', 'role']
        });

        if (!user) {
            console.log('Kullanıcı bulunamadı');
            return res.status(401).json({ 
                valid: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        console.log('Kullanıcı bulundu:', user.email);

        // Token'ın süresini kontrol et
        const token = req.headers.authorization.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                console.log('Token doğrulama hatası:', err.message);
                return res.status(401).json({ 
                    valid: false,
                    message: 'Token geçersiz veya süresi dolmuş'
                });
            }
            console.log('Token doğrulandı');
        });

        const userData = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            role: user.role
        };

        console.log('Kullanıcı bilgileri gönderiliyor');

        res.json({
            valid: true,
            userData
        });
    } catch (error) {
        console.error('Verify endpoint hatası:', error);
        res.status(500).json({ 
            valid: false,
            message: 'Sunucu hatası: ' + error.message
        });
    }
});

module.exports = router; 