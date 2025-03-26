/**
 * API Entegrasyon Model - Supabase Uyumlu
 * 
 * Bu dosya, Supabase'de bulunan 'api_integrations' tablosu için model tanımını içerir.
 * Artık Sequelize yerine Supabase kullanılmaktadır.
 */

const { integrationService } = require('../services/supabaseService');

// ApiIntegration modeli şema tanımı
const apiIntegrationSchema = {
  id: 'integer',
  user_id: 'integer',
  seller_id: 'string',
  api_key: 'string',
  api_secret: 'string',
  created_at: 'timestamp',
  updated_at: 'timestamp'
};

// API Entegrasyon işlemleri için yardımcı fonksiyonlar
const ApiIntegration = {
  // Kullanıcının API entegrasyonunu getir
  findOne: async (options) => {
    if (options && options.where && options.where.user_id) {
      return await integrationService.getUserIntegration(options.where.user_id);
    }
    return null;
  },
  
  // Yeni API entegrasyonu oluştur
  create: async (data) => {
    return await integrationService.createIntegration(data);
  },
  
  // API entegrasyonunu güncelle
  update: async (data, options) => {
    if (options && options.where && options.where.user_id) {
      return await integrationService.updateIntegration(options.where.user_id, data);
    }
    return null;
  },
  
  // API entegrasyonunu sil
  destroy: async (options) => {
    if (options && options.where && options.where.user_id) {
      return await integrationService.deleteIntegration(options.where.user_id);
    }
    return null;
  }
};

module.exports = ApiIntegration;
