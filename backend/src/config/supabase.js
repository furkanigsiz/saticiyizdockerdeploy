/**
 * Supabase Konfigürasyon Dosyası
 * 
 * Bu dosya, Supabase ile bağlantı kurmak için gereken konfigürasyonu sağlar.
 * Hem normal kullanıcı hem de admin (servis) rolü için istemciler oluşturulur.
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// .env dosyasındaki ayarları yükle
dotenv.config();

// Supabase ayarlarını kontrol et
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Ayarları doğrula
if (!supabaseUrl || !supabaseKey) {
  console.error('HATA: Supabase URL veya Anahtar eksik. Lütfen .env dosyasını kontrol edin.');
  process.exit(1);
}

// Servis anahtarını kontrol et
if (!supabaseServiceKey) {
  console.warn('UYARI: Supabase Servis Anahtarı eksik. Admin işlemleri sınırlı olabilir.');
}

// Anonim anahtar ile istemci (genel işlemler için)
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Servis rolü anahtarı ile istemci (yönetici işlemleri için)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Supabase istemcilerinin durumunu kontrol et
const checkSupabaseStatus = async () => {
  try {
    // Basit bir sorgu ile bağlantıyı test et
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase bağlantı hatası:', error.message);
      return false;
    }
    
    console.log('Supabase bağlantısı başarılı');
    return true;
  } catch (err) {
    console.error('Supabase istemcisi oluşturulurken hata:', err.message);
    return false;
  }
};

// İlk başlangıçta durumu kontrol et
checkSupabaseStatus()
  .then(status => {
    if (!status) {
      console.warn('Supabase bağlantısı kurulamadı. Lütfen ayarlarınızı kontrol edin.');
    }
  })
  .catch(err => {
    console.error('Supabase durum kontrolü sırasında hata:', err.message);
  });

module.exports = { 
  supabase, 
  supabaseAdmin,
  checkSupabaseStatus 
}; 