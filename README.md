# Saticiyiz - E-ticaret Yönetim Platformu

![Saticiyiz Logo](frontend/public/logo192.png)

## 📝 Proje Hakkında

Saticiyiz, e-ticaret satıcıları için geliştirilmiş kapsamlı bir yönetim platformudur. Bu platform, satıcıların Trendyol gibi çeşitli pazaryerlerindeki ürünlerini, siparişlerini ve stok durumlarını tek bir yerden yönetmelerini sağlar. Supabase altyapısı ile güçlendirilmiş, modern ve güvenli bir çözüm sunar.

## 🚀 Özellikler

- 📦 Trendyol entegrasyonu
- 📊 Detaylı satış ve stok analizi
- 💰 Otomatik kar hesaplama
- 📈 Fiyat ve komisyon optimizasyonu
- 🏷️ Toplu ürün yönetimi
- 📱 Mobil uyumlu arayüz
- 🔒 JWT tabanlı güvenli kimlik doğrulama
- 📧 E-posta entegrasyonu
- 📑 Google Sheets entegrasyonu ile veri dışa aktarımı
- 🌐 Gerçek zamanlı veritabanı güncellemeleri

## 🛠️ Teknolojiler

### Frontend
- React.js
- Tailwind CSS
- Context API
- Axios
- Supabase Client SDK

### Backend
- Node.js
- Express.js
- Supabase
- JWT Authentication
- Nodemailer
- Google API

### Veritabanı
- Supabase (PostgreSQL tabanlı)

### Altyapı
- Docker
- Docker Compose

## 💻 Kurulum

### Gereksinimler
- Node.js (v18 veya üzeri)
- npm veya yarn
- Docker ve Docker Compose
- Supabase hesabı

### Adımlar

1. Projeyi klonlayın:
```bash
git clone https://github.com/your-username/saticiyz.git
cd saticiyz
```

2. Ortam değişkenlerini ayarlayın:
   
   Ana dizinde `.env` dosyası oluşturun:
```
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

3. Backend için `.env` dosyası oluşturun:
```bash
cp .env backend/.env
```

4. Frontend için `.env` dosyası oluşturun:
```bash
cd frontend
cp ../.env .env
# Dosyayı düzenleyerek REACT_APP_ öneki ekleyin
```

5. Docker ile uygulamayı başlatın:
```bash
cd ..
docker-compose up -d
```

6. Veritabanı şemasını ve başlangıç verilerini yükleyin:
```bash
docker exec -it saticiyz-backend npm run migrate
```

Uygulama başarıyla kurulduktan sonra:
- Backend API: http://localhost:5000
- Frontend: http://localhost:3000

## 🏗️ Proje Yapısı

```
saticiyz/
├── backend/                # Node.js API
│   ├── src/
│   │   ├── config/         # Yapılandırma dosyaları
│   │   ├── middleware/     # Express middleware'leri
│   │   ├── models/         # Supabase model tanımları
│   │   ├── routes/         # API endpoint'leri
│   │   ├── services/       # Supabase servis fonksiyonları
│   │   ├── utils/          # Yardımcı fonksiyonlar
│   │   └── app.js          # Express uygulaması
│   ├── supabase/
│   │   └── migrations/     # Veritabanı migrasyon dosyaları
│   └── Dockerfile          # Backend Docker yapılandırması
├── frontend/               # React uygulaması
│   ├── public/             # Statik dosyalar
│   ├── src/
│   │   ├── components/     # React bileşenleri
│   │   ├── config/         # Yapılandırma dosyaları
│   │   ├── context/        # React context'leri
│   │   ├── hooks/          # Özel React hook'ları
│   │   ├── pages/          # Sayfa bileşenleri
│   │   ├── services/       # API servis fonksiyonları
│   │   └── utils/          # Yardımcı fonksiyonlar
│   └── Dockerfile          # Frontend Docker yapılandırması
└── docker-compose.yml      # Docker Compose yapılandırması
```

## 📚 API Dokümantasyonu

### Kullanıcı Endpoint'leri
- `POST /users/login` - Kullanıcı girişi
- `POST /users/register` - Yeni kullanıcı kaydı
- `GET /users/me` - Mevcut kullanıcı bilgilerini getir
- `PUT /users/update` - Kullanıcı bilgilerini güncelle

### Trendyol Endpoint'leri
- `GET /api/trendyol/products` - Trendyol ürünlerini listele
- `GET /api/trendyol/products/:id` - Belirli bir ürünün detaylarını getir
- `POST /api/trendyol/products/sync` - Ürünleri senkronize et

### Entegrasyon Endpoint'leri
- `GET /api/integrations/status` - Entegrasyon durumlarını kontrol et
- `POST /api/integrations/google/auth-url` - Google OAuth URL'si al
- `POST /api/integrations/email/connect` - E-posta hesabı bağla

### Dashboard Endpoint'leri
- `GET /api/dashboard/stats` - Dashboard istatistiklerini getir

## 🔐 Güvenlik Özellikleri

- JWT tabanlı kimlik doğrulama
- Şifrelerin güvenli bir şekilde hashlenmesi
- CORS koruması
- Rate limiting
- Supabase'in RLS (Row Level Security) korumalarından yararlanma

## 🤝 Katkıda Bulunma

1. Bu repository'yi fork edin
2. Feature branch'i oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'inizi push edin (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje özel mülkiyettedir ve tüm hakları saklıdır. Kullanım için yazılı izin alınması zorunludur.

## 📧 İletişim

Furkan İğsiz - [@furkanigsiz](https://github.com/furkanigsiz)

Proje Linki: [https://github.com/furkanigsiz/saticiyz](https://github.com/furkanigsiz/saticiyz)

## 📋 Sürüm Geçmişi

### v1.0.0 (2025)
- İlk sürüm
- Supabase entegrasyonu
- Trendyol API entegrasyonu
- Temel dashboard özellikleri

### v1.1.0 (Yakında)
- Çoklu pazaryeri desteği
- Gelişmiş analitik özellikleri
- Otomatik fiyatlandırma asistanı

## 🙏 Teşekkürler

- [Supabase](https://supabase.io/)
- [React](https://reactjs.org/)
- [Node.js](https://nodejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Docker](https://www.docker.com/)
