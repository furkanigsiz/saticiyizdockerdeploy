/**
 * Veritabanı Migrasyon Scripti
 * 
 * Bu script, Supabase veritabanı şemasını oluşturur ve başlangıç verilerini yükler.
 */

const fs = require('fs');
const path = require('path');
const { supabaseAdmin } = require('../src/config/supabase');
const dotenv = require('dotenv');

// .env dosyasındaki ayarları yükle
dotenv.config();

/**
 * SQL dosyasını okur ve içeriğini döndürür
 * @param {string} filePath - SQL dosyasının yolu
 * @returns {string} - SQL dosyasının içeriği
 */
const readSqlFile = (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`SQL dosyası okunamadı: ${filePath}`, error);
    throw error;
  }
};

/**
 * Veritabanı şemasını oluşturur
 * @returns {Promise<void>}
 */
const createSchema = async () => {
  try {
    console.log('Veritabanı şeması oluşturuluyor...');
    
    // SQL dosyasını oku
    const sqlPath = path.join(__dirname, '../supabase/migrations/initial_migration.sql');
    const sql = readSqlFile(sqlPath);
    
    // SQL komutlarını çalıştır
    const { error } = await supabaseAdmin.rpc('pg_sql_raw', { sql });
    
    if (error) {
      console.error('Şema oluşturma hatası:', error);
      throw error;
    }
    
    console.log('Veritabanı şeması başarıyla oluşturuldu.');
  } catch (error) {
    console.error('Şema oluşturulurken bir hata oluştu:', error);
    throw error;
  }
};

/**
 * Başlangıç verilerini yükler
 * @returns {Promise<void>}
 */
const seedDatabase = async () => {
  try {
    console.log('Başlangıç verileri yükleniyor...');
    
    // Admin kullanıcısı oluştur
    const adminUser = {
      email: 'admin@saticiyz.com',
      password: '$2b$10$P9HqQz.O1g3rRQZxJMAf2.KcUDfmf8RXaYUwWI/GiYnujiTa1t7gm', // 'admin123'
      first_name: 'Admin',
      last_name: 'Kullanıcı',
      role: 'admin',
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Kullanıcıyı kontrol et ve oluştur
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', adminUser.email)
      .single();
    
    if (!existingUser) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert([adminUser])
        .select();
      
      if (error) {
        console.error('Admin kullanıcısı oluşturma hatası:', error);
        throw error;
      }
      
      console.log('Admin kullanıcısı oluşturuldu:', data[0].id);
    } else {
      console.log('Admin kullanıcısı zaten var:', existingUser.id);
    }
    
    console.log('Başlangıç verileri başarıyla yüklendi.');
  } catch (error) {
    console.error('Veri yüklenirken bir hata oluştu:', error);
    throw error;
  }
};

/**
 * Ana fonksiyon
 */
const main = async () => {
  try {
    // Şemayı oluştur
    await createSchema();
    
    // Verileri yükle
    await seedDatabase();
    
    console.log('Veritabanı migrasyon işlemi başarıyla tamamlandı.');
    process.exit(0);
  } catch (error) {
    console.error('Migrasyon işlemi başarısız oldu:', error);
    process.exit(1);
  }
};

// Scripti çalıştır
main(); 