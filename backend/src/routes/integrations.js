const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const { PrismaClient } = require('../services/prismaShim');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const authenticateToken = require('../middleware/authMiddleware');
const { supabase } = require('../config/supabase');

// Google OAuth2 yapılandırması
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Google OAuth2 yetkilendirme URL'sini al
router.get('/google/auth-url', authenticateToken, async (req, res) => {
    try {
        const scopes = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.file'
        ];

        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent',
            state: req.user.id.toString() // Kullanıcı ID'sini state parametresinde sakla
        });

        res.json({ authUrl });
    } catch (error) {
        console.error('Auth URL oluşturma hatası:', error);
        res.status(500).json({ 
            message: 'Auth URL oluşturulurken bir hata oluştu',
            error: error.message 
        });
    }
});

// Google OAuth callback endpoint - kimlik doğrulama middleware'i yok
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    console.log('Callback received - code:', code ? 'present' : 'missing');
    console.log('Callback received - state:', state);
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is missing' });
    }
    
    if (!state) {
      return res.status(400).json({ error: 'State parameter is missing' });
    }
    
    // State parametresinden kullanıcı ID'sini al
    const userId = parseInt(state);
    console.log('User ID from state:', userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid state parameter' });
    }
    
    // Google OAuth token'ı al
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Received tokens from Google:', tokens ? 'present' : 'missing');
    oauth2Client.setCredentials(tokens);
    
    // Sheets API'yi başlat
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    
    // Yeni spreadsheet oluştur
    console.log('Creating new spreadsheet...');
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: 'Saticiyiz - Ürün Verileri'
        },
        sheets: [
          {
            properties: {
              title: 'Ürünler',
              gridProperties: {
                rowCount: 1000,
                columnCount: 10
              }
            }
          }
        ]
      }
    });
    
    const spreadsheetId = spreadsheet.data.spreadsheetId;
    console.log('Created spreadsheet with ID:', spreadsheetId);
    
    // Başlık satırını ekle
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Ürünler!A1:J1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          'Barkod',
          'Ürün Adı',
          'Marka',
          'Kategori',
          'Açıklama',
          'Liste Fiyatı',
          'Satış Fiyatı',
          'Stok Kodu',
          'Miktar',
          'Son Güncelleme'
        ]]
      }
    });
    
    // Kullanıcının entegrasyon ayarlarını güncelle
    console.log('Updating integration settings for user:', userId);
    const { data, error } = await supabase
      .from('integration_settings')
      .upsert([
        {
          user_id: userId,
          service: 'google',
          credentials: {
            ...tokens,
            spreadsheetId
          }
        }
      ]);

    if (error) throw error;
    
    console.log('Integration settings updated successfully');
    
    // Başarılı entegrasyon sonrası kullanıcıyı yönlendir
    // Tam URL kullanarak yönlendirme yapalım
    const redirectUrl = 'http://localhost:3000/integrations?status=success&service=google';
    console.log('Redirecting to:', redirectUrl);
    
    // HTML ile yönlendirme yapalım
    res.send(`
      <html>
        <head>
          <meta http-equiv="refresh" content="0;url=${redirectUrl}">
          <script>window.location.href = "${redirectUrl}";</script>
        </head>
        <body>
          <p>Google hesabı başarıyla bağlandı. Yönlendiriliyorsunuz...</p>
          <p>Otomatik olarak yönlendirilmezseniz, <a href="${redirectUrl}">buraya tıklayın</a>.</p>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Google callback hatası:', error);
    const errorUrl = 'http://localhost:3000/integrations?status=error&service=google&message=' + encodeURIComponent(error.message);
    
    // HTML ile hata sayfasına yönlendirme yapalım
    res.send(`
      <html>
        <head>
          <meta http-equiv="refresh" content="0;url=${errorUrl}">
          <script>window.location.href = "${errorUrl}";</script>
        </head>
        <body>
          <p>Google hesabı bağlanırken bir hata oluştu. Yönlendiriliyorsunuz...</p>
          <p>Otomatik olarak yönlendirilmezseniz, <a href="${errorUrl}">buraya tıklayın</a>.</p>
        </body>
      </html>
    `);
  }
});

// Google OAuth başlatma endpoint'i - kimlik doğrulama middleware'i yok
router.get('/google/auth', (req, res) => {
  try {
    const { state } = req.query;
    
    if (!state) {
      return res.status(400).json({ error: 'State parameter is required' });
    }
    
    console.log('Received state (token):', state);
    
    // Token'ı doğrula ve kullanıcı ID'sini al
    let userId;
    try {
      const decoded = jwt.verify(state, 'secretKey');
      userId = decoded.id;
      console.log('Token doğrulandı, kullanıcı ID:', userId);
    } catch (error) {
      console.error('Token doğrulama hatası:', error);
      return res.status(401).json({ error: 'Geçersiz token. Lütfen tekrar giriş yapın.' });
    }
    
    // OAuth URL'sini oluştur
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file'
      ],
      state: userId.toString() // Kullanıcı ID'sini state parametresi olarak gönder
    });
    
    console.log('Redirecting to Google OAuth URL:', authUrl);
    
    // Kullanıcıyı Google OAuth sayfasına yönlendir
    res.redirect(authUrl);
    
  } catch (error) {
    console.error('Google auth hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Entegrasyon durumunu kontrol et
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Tüm entegrasyonları al
    const integrations = await prisma.integration_settings.findMany({
      where: {
        user_id: userId
      }
    });
    
    // Entegrasyon durumlarını hazırla
    const status = {
      integrations: {
        google: {
          connected: false,
          spreadsheetId: null
        },
        email: {
          connected: false,
          email: null
        }
      }
    };
    
    // Entegrasyon durumlarını güncelle
    integrations.forEach(integration => {
      if (integration.service === 'google') {
        status.integrations.google.connected = true;
        status.integrations.google.spreadsheetId = integration.credentials.spreadsheetId;
      } else if (integration.service === 'email') {
        status.integrations.email.connected = true;
        status.integrations.email.email = integration.credentials.email;
      }
    });
    
    res.json(status);
    
  } catch (error) {
    console.error('Entegrasyon durumu hatası:', error);
    res.status(500).json({ message: 'Entegrasyon durumu alınırken bir hata oluştu' });
  }
});

// Email hesabını bağla
router.post('/connect/email', authenticateToken, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Test email bağlantısı
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: email,
                pass: password
            }
        });

        await transporter.verify();

        await prisma.integration_settings.upsert({
            where: {
                user_id_service: {
                    user_id: req.user.id,
                    service: 'email'
                }
            },
            update: {
                credentials: { email, password }
            },
            create: {
                user_id: req.user.id,
                service: 'email',
                credentials: { email, password }
            }
        });

        res.json({ message: 'Email hesabı başarıyla bağlandı' });
    } catch (error) {
        res.status(500).json({ message: 'Email bilgileri geçersiz' });
    }
});

// Ürün bilgilerini Google Sheets'e aktar ve mail gönder
router.post('/export-product', authenticateToken, async (req, res) => {
  try {
    const { barcode, email, spreadsheetId, skipEmail } = req.body;
    const userId = req.user.id;
    
    if (!barcode || !spreadsheetId) {
      return res.status(400).json({ message: 'Barkod ve spreadsheetId gereklidir' });
    }
    
    // E-posta gönderilecekse e-posta adresi gereklidir
    if (!skipEmail && !email) {
      return res.status(400).json({ message: 'E-posta adresi gereklidir' });
    }
    
    // Google entegrasyonunu kontrol et
    const googleIntegration = await prisma.integration_settings.findUnique({
      where: {
        user_id_service: {
          user_id: userId,
          service: 'google'
        }
      }
    });
    
    if (!googleIntegration) {
      return res.status(404).json({ message: 'Google entegrasyonu bulunamadı' });
    }
    
    // E-posta gönderilecekse e-posta entegrasyonunu kontrol et
    let emailIntegration = null;
    if (!skipEmail) {
      emailIntegration = await prisma.integration_settings.findUnique({
        where: {
          user_id_service: {
            user_id: userId,
            service: 'email'
          }
        }
      });
      
      if (!emailIntegration) {
        return res.status(404).json({ message: 'E-posta entegrasyonu bulunamadı' });
      }
    }
    
    // Ürün bilgilerini al
    const product = await prisma.product_settings.findFirst({
      where: {
        user_id: userId,
        barcode: barcode
      }
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }
    
    // Google OAuth client'ı yapılandır
    oauth2Client.setCredentials(googleIntegration.credentials);
    
    // Sheets API'yi başlat
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    
    // Ürün bilgilerini Google Sheets'e ekle
    const values = [[
      product.barcode,
      product.title,
      product.brand,
      product.category_name,
      product.description || '',
      product.list_price?.toString() || '',
      product.sale_price?.toString() || '',
      product.stock_code || '',
      product.quantity?.toString() || '',
      new Date().toLocaleString('tr-TR')
    ]];
    
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Ürünler!A2:J2',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values
      }
    });
    
    // Spreadsheet URL'sini oluştur
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    
    // E-posta gönderme isteği varsa gönder
    if (!skipEmail && emailIntegration) {
      const transporter = nodemailer.createTransport({
        host: emailIntegration.credentials.host,
        port: parseInt(emailIntegration.credentials.port),
        secure: emailIntegration.credentials.secure,
        auth: {
          user: emailIntegration.credentials.email,
          pass: emailIntegration.credentials.password
        },
        tls: {
          // SSL/TLS sorunlarını önlemek için
          rejectUnauthorized: false,
          minVersion: 'TLSv1'
        }
      });
      
      console.log('E-posta gönderiliyor:', email);
      
      await transporter.sendMail({
        from: emailIntegration.credentials.email,
        to: email,
        subject: 'Saticiyiz - Ürün Bilgileri',
        html: `
          <h1>Ürün Bilgileri</h1>
          <p>Aşağıdaki ürün bilgileri Google Sheets'e aktarılmıştır:</p>
          <table border="1" cellpadding="5" style="border-collapse: collapse;">
            <tr>
              <th>Barkod</th>
              <td>${product.barcode}</td>
            </tr>
            <tr>
              <th>Ürün Adı</th>
              <td>${product.title}</td>
            </tr>
            <tr>
              <th>Marka</th>
              <td>${product.brand || '-'}</td>
            </tr>
            <tr>
              <th>Kategori</th>
              <td>${product.category_name || '-'}</td>
            </tr>
            <tr>
              <th>Satış Fiyatı</th>
              <td>${product.sale_price || '-'} TL</td>
            </tr>
            <tr>
              <th>Stok</th>
              <td>${product.quantity || '-'}</td>
            </tr>
          </table>
          <p>Google Sheets'e erişmek için <a href="${spreadsheetUrl}">tıklayın</a>.</p>
        `
      });
      
      res.json({
        message: 'Ürün bilgileri başarıyla aktarıldı ve e-posta gönderildi',
        spreadsheetUrl
      });
    } else {
      // E-posta gönderilmeyecekse sadece başarı mesajı döndür
      res.json({
        message: 'Ürün bilgileri başarıyla Google Sheets\'e aktarıldı',
        spreadsheetUrl
      });
    }
    
  } catch (error) {
    console.error('Excel export hatası:', error);
    res.status(500).json({ message: 'Ürün bilgileri aktarılırken bir hata oluştu: ' + error.message });
  }
});

// Google hesabı bağlantısını kes
router.post('/disconnect/google', authenticateToken, async (req, res) => {
    try {
        await prisma.integration_settings.delete({
            where: {
                user_id_service: {
                    user_id: req.user.id,
                    service: 'google'
                }
            }
        });

        res.json({ message: 'Google hesabı bağlantısı başarıyla kesildi' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Email hesabı bağlantısını kes
router.post('/disconnect/email', authenticateToken, async (req, res) => {
    try {
        await prisma.integration_settings.delete({
            where: {
                user_id_service: {
                    user_id: req.user.id,
                    service: 'email'
                }
            }
        });

        res.json({ message: 'Email hesabı bağlantısı başarıyla kesildi' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// E-posta bağlantı endpoint'i
router.post('/email/connect', authenticateToken, async (req, res) => {
  try {
    const { email, password, host, port, secure } = req.body;
    const userId = req.user.id;
    
    if (!email || !password || !host || !port) {
      return res.status(400).json({ message: 'Tüm alanlar gereklidir' });
    }
    
    // E-posta bağlantısını test et
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: secure === true,
      auth: {
        user: email,
        pass: password
      },
      tls: {
        // SSL/TLS sorunlarını önlemek için
        rejectUnauthorized: false,
        minVersion: 'TLSv1'
      }
    });
    
    console.log('E-posta bağlantısı test ediliyor:', { host, port, secure });
    
    // Bağlantıyı doğrula
    await transporter.verify();
    console.log('E-posta bağlantısı başarılı');
    
    // Veritabanına kaydet
    await prisma.integration_settings.upsert({
      where: {
        user_id_service: {
          user_id: userId,
          service: 'email'
        }
      },
      update: {
        credentials: {
          email,
          password,
          host,
          port: parseInt(port),
          secure
        }
      },
      create: {
        user_id: userId,
        service: 'email',
        credentials: {
          email,
          password,
          host,
          port: parseInt(port),
          secure
        }
      }
    });
    
    res.json({ message: 'E-posta hesabı başarıyla bağlandı' });
    
  } catch (error) {
    console.error('E-posta bağlantı hatası:', error);
    res.status(500).json({ message: 'E-posta hesabı bağlanırken bir hata oluştu: ' + error.message });
  }
});

// E-posta bağlantısını kaldır
router.delete('/email/disconnect', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Veritabanından sil
    await prisma.integration_settings.deleteMany({
      where: {
        user_id: userId,
        service: 'email'
      }
    });
    
    res.json({ message: 'E-posta hesabı bağlantısı başarıyla kaldırıldı' });
    
  } catch (error) {
    console.error('E-posta bağlantı kaldırma hatası:', error);
    res.status(500).json({ message: 'E-posta hesabı bağlantısı kaldırılırken bir hata oluştu' });
  }
});

module.exports = router; 