/**
 * Supabase Servis Katmanı
 * 
 * Bu katman, Supabase ile etkileşimler için gerekli yardımcı fonksiyonları sağlar.
 */

const { supabase, supabaseAdmin } = require('../config/supabase');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Kullanıcı İşlemleri
const userService = {
  // Tüm kullanıcıları getir
  async getAllUsers() {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Kullanıcı getir
  async getUserById(id) {
    try {
      console.log(`getUserById çağrıldı. ID: ${id}`);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error(`getUserById hatası:`, error);
        throw error;
      }
      
      console.log(`Kullanıcı bulundu: ${data ? data.email : 'bulunamadı'}`);
      return data;
    } catch (err) {
      console.error(`getUserById - Beklenmeyen hata:`, err);
      throw err;
    }
  },

  // Kullanıcı oluştur
  async createUser(userData) {
    // Rastgele bir integer ID üretelim (gerçek uygulamada daha güvenli yöntemler kullanılmalı)
    const randomId = Math.floor(Math.random() * 1000000) + 1;
    
    const userWithId = {
      ...userData,
      id: randomId // Manuel olarak integer ID atıyoruz
    };
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([userWithId])
      .select();
    
    console.log('Kullanıcı ekleme isteği (INT ID ile):', userWithId);
    console.log('Kullanıcı ekleme cevabı:', { data, error });
    
    if (error) throw error;
    return data[0];
  },

  // Kullanıcı güncelle
  async updateUser(id, userData) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(userData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Kullanıcı sil
  async deleteUser(id) {
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // E-posta ile kullanıcı getir
  async getUserByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
};

// Ürün İşlemleri
const productService = {
  // Kullanıcının tüm ürünlerini getir
  async getUserProducts(userId) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Ürün getir
  async getProductById(id, userId) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Trendyol ID'sine göre ürün getir
  async getProductByTrendyolId(trendyolId, userId) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('trendyol_id', trendyolId)
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Ürün oluştur
  async createProduct(productData) {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Ürün güncelle
  async updateProduct(id, userId, productData) {
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .eq('user_id', userId)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Ürün sil
  async deleteProduct(id, userId) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
    return true;
  },

  // Toplu ürün oluştur
  async bulkCreateProducts(productsData) {
    const { data, error } = await supabase
      .from('products')
      .insert(productsData)
      .select();
    
    if (error) throw error;
    return data;
  }
};

// Sipariş İşlemleri
const orderService = {
  // Kullanıcının tüm siparişlerini getir
  async getUserOrders(userId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('order_date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Sipariş getir
  async getOrderById(id, userId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Sipariş numarası ile sipariş getir
  async getOrderByOrderNumber(orderNumber, userId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Sipariş oluştur
  async createOrder(orderData) {
    // Rastgele bir integer ID üretelim
    const randomId = Math.floor(Math.random() * 1000000000) + 1; // 1 ile 1 milyar arası
    
    const orderWithId = {
      ...orderData,
      id: randomId // Manuel olarak integer ID atıyoruz
    };
    
    console.log('Yeni sipariş oluşturma verileri:', orderWithId);
    
    const { data, error } = await supabase
      .from('orders')
      .insert([orderWithId])
      .select();
    
    if (error) {
      console.error('Sipariş oluşturma hatası:', error);
      throw error;
    }
    
    return data[0];
  },

  // Sipariş güncelle
  async updateOrder(id, userId, orderData) {
    const { data, error } = await supabase
      .from('orders')
      .update(orderData)
      .eq('id', id)
      .eq('user_id', userId)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Sipariş sil
  async deleteOrder(id, userId) {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
    return true;
  }
};

// API Entegrasyonları İşlemleri
const integrationService = {
  // Kullanıcının API entegrasyonunu getir
  async getUserIntegration(userId) {
    const { data, error } = await supabase
      .from('api_integrations')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // API entegrasyonu oluştur
  async createIntegration(integrationData) {
    const { data, error } = await supabase
      .from('api_integrations')
      .insert([integrationData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // API entegrasyonu güncelle
  async updateIntegration(userId, integrationData) {
    const { data, error } = await supabase
      .from('api_integrations')
      .update(integrationData)
      .eq('user_id', userId)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // API entegrasyonu sil
  async deleteIntegration(userId) {
    const { error } = await supabase
      .from('api_integrations')
      .delete()
      .eq('user_id', userId);
    
    if (error) throw error;
    return true;
  }
};

// Entegrasyon Ayarları İşlemleri
const integrationSettingsService = {
  // Kullanıcının entegrasyon ayarlarını getir
  async getUserIntegrationSettings(userId, service) {
    const { data, error } = await supabase
      .from('integration_settings')
      .select('*')
      .eq('user_id', userId)
      .eq('service', service)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Entegrasyon ayarları oluştur
  async createIntegrationSettings(settingsData) {
    const { data, error } = await supabase
      .from('integration_settings')
      .insert([settingsData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Entegrasyon ayarları güncelle
  async updateIntegrationSettings(userId, service, settingsData) {
    const { data, error } = await supabase
      .from('integration_settings')
      .update(settingsData)
      .eq('user_id', userId)
      .eq('service', service)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Entegrasyon ayarları sil
  async deleteIntegrationSettings(userId, service) {
    const { error } = await supabase
      .from('integration_settings')
      .delete()
      .eq('user_id', userId)
      .eq('service', service);
    
    if (error) throw error;
    return true;
  }
};

// Avantajlı Ürünler İşlemleri
const advantageProductService = {
  // Kullanıcının avantajlı ürünlerini getir
  async getUserAdvantageProducts(userId) {
    const { data, error } = await supabase
      .from('advantage_products')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Avantajlı ürün getir
  async getAdvantageProductById(id, userId) {
    const { data, error } = await supabase
      .from('advantage_products')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Barkoda göre avantajlı ürün getir
  async getAdvantageProductByBarcode(barcode, userId) {
    const { data, error } = await supabase
      .from('advantage_products')
      .select('*')
      .eq('barcode', barcode)
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Avantajlı ürün oluştur
  async createAdvantageProduct(productData) {
    const { data, error } = await supabase
      .from('advantage_products')
      .insert([productData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Avantajlı ürün güncelle
  async updateAdvantageProduct(id, userId, productData) {
    const { data, error } = await supabase
      .from('advantage_products')
      .update(productData)
      .eq('id', id)
      .eq('user_id', userId)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Avantajlı ürün sil
  async deleteAdvantageProduct(id, userId) {
    const { error } = await supabase
      .from('advantage_products')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
    return true;
  }
};

// Flash Ürünler İşlemleri
const flashProductService = {
  // Kullanıcının flash ürünlerini getir
  async getUserFlashProducts(userId) {
    const { data, error } = await supabase
      .from('flash_products')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Flash ürün getir
  async getFlashProductById(id, userId) {
    const { data, error } = await supabase
      .from('flash_products')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Barkoda göre flash ürün getir
  async getFlashProductByBarcode(barcode, userId) {
    const { data, error } = await supabase
      .from('flash_products')
      .select('*')
      .eq('barcode', barcode)
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Flash ürün oluştur
  async createFlashProduct(productData) {
    const { data, error } = await supabase
      .from('flash_products')
      .insert([productData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Flash ürün güncelle
  async updateFlashProduct(id, userId, productData) {
    const { data, error } = await supabase
      .from('flash_products')
      .update(productData)
      .eq('id', id)
      .eq('user_id', userId)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Flash ürün sil
  async deleteFlashProduct(id, userId) {
    const { error } = await supabase
      .from('flash_products')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
    return true;
  }
};

// Ürün Ayarları İşlemleri
const productSettingsService = {
  // Kullanıcının ürün ayarlarını getir
  async getUserProductSettings(userId) {
    const { data, error } = await supabase
      .from('product_settings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Ürün ayarı getir
  async getProductSettingById(id, userId) {
    const { data, error } = await supabase
      .from('product_settings')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Barkoda göre ürün ayarı getir
  async getProductSettingByBarcode(barcode, userId) {
    const { data, error } = await supabase
      .from('product_settings')
      .select('*')
      .eq('barcode', barcode)
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Trendyol ID'sine göre ürün ayarı getir
  async getProductSettingByTrendyolId(trendyolId, userId) {
    const { data, error } = await supabase
      .from('product_settings')
      .select('*')
      .eq('trendyol_id', trendyolId)
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Ürün ayarı oluştur
  async createProductSetting(settingData) {
    const { data, error } = await supabase
      .from('product_settings')
      .insert([settingData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Ürün ayarı güncelle
  async updateProductSetting(id, userId, settingData) {
    const { data, error } = await supabase
      .from('product_settings')
      .update(settingData)
      .eq('id', id)
      .eq('user_id', userId)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Ürün ayarı sil
  async deleteProductSetting(id, userId) {
    const { error } = await supabase
      .from('product_settings')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
    return true;
  }
};

// Oturum İşlemleri
const sessionService = {
  // Oturum oluştur
  async createSession(sessionData) {
    // Sessions tablosu için UUID ID ekleyelim (schema.sql dosyasında id alanı UUID tipinde)
    const sessionWithId = {
      ...sessionData,
      id: uuidv4() // UUID oluştur
    };
    
    const { data, error } = await supabase
      .from('sessions')
      .insert([sessionWithId])
      .select();
    
    console.log('Oturum ekleme isteği:', sessionWithId);
    console.log('Oturum ekleme cevabı:', { data, error });
    
    if (error) throw error;
    return data[0];
  },

  // Yenileme token'ına göre oturum getir
  async getSessionByRefreshToken(refreshToken) {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('refresh_token', refreshToken)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Oturumu devre dışı bırak
  async deactivateSession(refreshToken) {
    const { data, error } = await supabase
      .from('sessions')
      .update({ is_active: false })
      .eq('refresh_token', refreshToken)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Kullanıcının tüm oturumlarını devre dışı bırak
  async deactivateUserSessions(userId) {
    const { error } = await supabase
      .from('sessions')
      .update({ is_active: false })
      .eq('user_id', userId);
    
    if (error) throw error;
    return true;
  }
};

module.exports = {
  userService,
  productService,
  orderService,
  integrationService,
  integrationSettingsService,
  advantageProductService,
  flashProductService,
  productSettingsService,
  sessionService
}; 