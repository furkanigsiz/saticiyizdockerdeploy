const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { supabase, testConnection } = require('./config/database');
const userRoutes = require('./routes/userRoutes'); // Kullanıcı rotaları
const settingsRoutes = require("./routes/settings");
const trendyolRoutes = require("./routes/trendyol");
const authenticateToken = require('./middleware/authMiddleware');
const ordersRouter = require('./routes/orders');
const dashboardRoutes = require('./routes/dashboard');
const integrationsRouter = require('./routes/integrations');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
// Body parser limit artırıldı - büyük Excel dosyaları için
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Temel Endpoint
app.get('/', (req, res) => {
    res.send('Saticiyiz API çalışıyor - Supabase ile güçlendirildi!');
});

// Sağlık kontrolü endpoint'i
app.get('/health', async (req, res) => {
    try {
        // Veritabanı bağlantısını test et
        const dbConnected = await testConnection();
        
        // Sistem durumu
        const healthStatus = {
            status: dbConnected ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            services: {
                database: {
                    status: dbConnected ? 'connected' : 'disconnected',
                    type: 'supabase'
                },
                api: {
                    status: 'running',
                    uptime: process.uptime()
                }
            },
            version: '1.0.0'
        };
        
        const statusCode = dbConnected ? 200 : 503;
        res.status(statusCode).json(healthStatus);
    } catch (error) {
        console.error('Sağlık kontrolü hatası:', error);
        res.status(500).json({
            status: 'error',
            message: 'Sağlık kontrolü başarısız',
            error: error.message
        });
    }
});

// Uygulama başlangıcında Supabase bağlantısını kontrol et
(async () => {
    try {
        const connected = await testConnection();
        if (connected) {
            console.log('📦 Supabase veritabanına başarıyla bağlandı');
        } else {
            console.error('⚠️ Supabase veritabanına bağlanılamadı!');
        }
    } catch (err) {
        console.error('⚠️ Supabase bağlantı hatası:', err.message);
    }
})();

// Kullanıcı Rotası
app.use('/users', userRoutes);

app.use("/settings", settingsRoutes);

app.use("/api/trendyol", trendyolRoutes);

app.use('/api/orders', ordersRouter);

app.use('/api/dashboard', authenticateToken, dashboardRoutes);

// Entegrasyon rotaları - kimlik doğrulama middleware'ini kaldırıyoruz
app.use('/api/integrations', integrationsRouter);

// Global hata yakalama middleware'i
app.use((err, req, res, next) => {
    console.error('Sunucu hatası:', err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Sunucu hatası',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Bir hata oluştu'
    });
});

// Sunucuyu Başlat
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`🚀 Sunucu ${PORT} portunda çalışıyor`));

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM alındı, sunucu kapatılıyor...');
    server.close(() => {
        console.log('Sunucu kapatıldı');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT alındı, sunucu kapatılıyor...');
    server.close(() => {
        console.log('Sunucu kapatıldı');
        process.exit(0);
    });
});


