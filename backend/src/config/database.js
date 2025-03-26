/**
 * Veritabanı Konfigürasyon Dosyası - Sadece Supabase
 * 
 * Bu dosya, Supabase veritabanı bağlantısı ve işlemlerini yönetir.
 * Tüm veritabanı işlemleri sadece Supabase üzerinden gerçekleştirilir.
 */

const { supabase, supabaseAdmin, checkSupabaseStatus } = require('./supabase');
const dotenv = require('dotenv');

// .env dosyasındaki ayarları yükle
dotenv.config();

// Veritabanı bağlantısını test et
const testConnection = async () => {
  try {
    const isConnected = await checkSupabaseStatus();
    
    if (isConnected) {
      console.log('Supabase veritabanına başarıyla bağlandı');
      return true;
    }
    
    throw new Error('Supabase bağlantı testi başarısız');
  } catch (err) {
    console.error('Supabase veritabanına bağlanırken hata:', err.message);
    return false;
  }
};

// DB Operasyonları için Yardımcı Fonksiyonlar

/**
 * Veritabanı tablosundan veri seçer
 * @param {string} table - Tablo adı
 * @param {object} options - Seçenekler (where, order, limit, offset)
 * @returns {Promise<Array>} - Sonuçlar
 */
const select = async (table, options = {}) => {
  try {
    let query = supabase.from(table).select(options.columns || '*');

    // Where koşulları
    if (options.where) {
      Object.entries(options.where).forEach(([column, value]) => {
        if (typeof value === 'object' && value !== null) {
          // Özel operatörler (gt, lt, gte, lte, vb.)
          const [operator, val] = Object.entries(value)[0];
          query = query[operator](column, val);
        } else {
          // Eşitlik operatörü
          query = query.eq(column, value);
        }
      });
    }

    // Sıralama
    if (options.order) {
      const { column, ascending = true } = options.order;
      query = query.order(column, { ascending });
    }

    // Limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    // Offset
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Veri seçme hatası (${table}):`, error.message);
    throw error;
  }
};

/**
 * Veritabanı tablosuna veri ekler
 * @param {string} table - Tablo adı
 * @param {object|array} data - Eklenecek veri veya veriler
 * @returns {Promise<object|array>} - Eklenen veri
 */
const insert = async (table, data) => {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select();

    if (error) throw error;
    return result;
  } catch (error) {
    console.error(`Veri ekleme hatası (${table}):`, error.message);
    throw error;
  }
};

/**
 * Veritabanı tablosundaki veriyi günceller
 * @param {string} table - Tablo adı
 * @param {object} data - Güncellenecek veri
 * @param {object} conditions - Güncelleme koşulları
 * @returns {Promise<object>} - Güncellenen veri
 */
const update = async (table, data, conditions) => {
  try {
    let query = supabase.from(table).update(data);

    // Koşulları ekle
    Object.entries(conditions).forEach(([column, value]) => {
      query = query.eq(column, value);
    });

    const { data: result, error } = await query.select();
    if (error) throw error;
    return result;
  } catch (error) {
    console.error(`Veri güncelleme hatası (${table}):`, error.message);
    throw error;
  }
};

/**
 * Veritabanı tablosundan veri siler
 * @param {string} table - Tablo adı
 * @param {object} conditions - Silme koşulları
 * @returns {Promise<boolean>} - Başarı durumu
 */
const remove = async (table, conditions) => {
  try {
    let query = supabase.from(table).delete();

    // Koşulları ekle
    Object.entries(conditions).forEach(([column, value]) => {
      query = query.eq(column, value);
    });

    const { error } = await query;
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Veri silme hatası (${table}):`, error.message);
    throw error;
  }
};

/**
 * Ham SQL sorgusu çalıştırır (admin hakları gerekir)
 * @param {string} sql - SQL sorgusu
 * @param {Array} params - Sorgu parametreleri
 * @returns {Promise<object>} - Sorgu sonucu
 */
const executeRawSql = async (sql, params = []) => {
  try {
    const { data, error } = await supabaseAdmin.rpc('pg_sql_raw', { 
      sql,
      params
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('SQL sorgusu hatası:', error.message);
    throw error;
  }
};

module.exports = { 
  supabase, 
  supabaseAdmin, 
  testConnection,
  select,
  insert,
  update,
  remove,
  executeRawSql
};
