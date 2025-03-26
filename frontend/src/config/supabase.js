/**
 * Supabase Konfigürasyon Dosyası - Frontend
 * 
 * Bu dosya, frontend tarafında Supabase ile bağlantı kurmak için gereken konfigürasyonu sağlar.
 */

import { createClient } from '@supabase/supabase-js';

// Supabase ayarları
const supabaseUrl = "https://jglcldzchyrbkaggbefs.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnbGNsZHpjaHlyYmthZ2diZWZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0OTk3NzcsImV4cCI6MjA1ODA3NTc3N30.BLNoBeNPfF2o-XmDa9IOOg2HQRMM_oZ6ZbJGWrDzeVo";

// Ayarları doğrula
if (!supabaseUrl || !supabaseKey) {
  console.error('HATA: Supabase URL veya Anahtar eksik.');
}

// Supabase istemcisini oluştur
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: localStorage
  }
});

/**
 * Kullanıcı tablosundan veri seçer
 * @param {object} options - Seçenekler (where, order, limit, offset)
 * @returns {Promise<Array>} - Sonuçlar
 */
export const selectUsers = async (options = {}) => {
  try {
    let query = supabase.from('users').select(options.columns || '*');

    // Where koşulları
    if (options.where) {
      Object.entries(options.where).forEach(([column, value]) => {
        query = query.eq(column, value);
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

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Kullanıcı verisi seçme hatası:', error.message);
    throw error;
  }
};

/**
 * Ürün tablosundan veri seçer
 * @param {object} options - Seçenekler (where, order, limit, offset)
 * @returns {Promise<Array>} - Sonuçlar
 */
export const selectProducts = async (options = {}) => {
  try {
    const userId = localStorage.getItem('userId');
    if (!userId) throw new Error('Kullanıcı ID bulunamadı');

    let query = supabase.from('products').select(options.columns || '*');

    // Kullanıcı ID'ye göre filtrele
    query = query.eq('user_id', userId);

    // Where koşulları
    if (options.where) {
      Object.entries(options.where).forEach(([column, value]) => {
        query = query.eq(column, value);
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

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Ürün verisi seçme hatası:', error.message);
    throw error;
  }
};

/**
 * Sipariş tablosundan veri seçer
 * @param {object} options - Seçenekler (where, order, limit, offset)
 * @returns {Promise<Array>} - Sonuçlar
 */
export const selectOrders = async (options = {}) => {
  try {
    const userId = localStorage.getItem('userId');
    if (!userId) throw new Error('Kullanıcı ID bulunamadı');

    let query = supabase.from('orders').select(options.columns || '*');

    // Kullanıcı ID'ye göre filtrele
    query = query.eq('user_id', userId);

    // Where koşulları
    if (options.where) {
      Object.entries(options.where).forEach(([column, value]) => {
        query = query.eq(column, value);
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

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Sipariş verisi seçme hatası:', error.message);
    throw error;
  }
};

export default supabase; 