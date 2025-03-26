/**
 * Ürün Model - Supabase Uyumlu
 * 
 * Bu dosya, Supabase'de bulunan 'products' tablosu için model tanımını içerir.
 * Artık Sequelize yerine Supabase kullanılmaktadır.
 */

const { productService } = require('../services/supabaseService');

// Product modeli şema tanımı
const productSchema = {
  id: 'integer',
  user_id: 'integer',
  trendyol_id: 'integer',
  title: 'string',
  barcode: 'string',
  stock_code: 'string',
  product_code: 'string',
  brand: 'string',
  category_name: 'string',
  quantity: 'integer',
  stock_unit_type: 'string',
  dimensional_weight: 'float',
  description: 'text',
  list_price: 'decimal',
  sale_price: 'decimal',
  vat_rate: 'float',
  images: 'jsonb',
  gender: 'string',
  color: 'string',
  size: 'string',
  approved: 'boolean',
  on_sale: 'boolean',
  has_active_campaign: 'boolean',
  archived: 'boolean',
  last_update_date: 'timestamp',
  created_at: 'timestamp',
  updated_at: 'timestamp'
};

// Ürün işlemleri için yardımcı fonksiyonlar
const Product = {
  // Kullanıcıya ait tüm ürünleri getir
  findAll: async (options) => {
    if (options && options.where && options.where.user_id) {
      return await productService.getUserProducts(options.where.user_id);
    }
    return [];
  },
  
  // ID'ye göre ürün getir
  findByPk: async (id, options) => {
    if (options && options.user_id) {
      return await productService.getProductById(id, options.user_id);
    }
    return null;
  },
  
  // Trendyol ID'sine göre ürün getir
  findOne: async (options) => {
    if (options && options.where) {
      const { trendyolId, user_id } = options.where;
      if (trendyolId && user_id) {
        return await productService.getProductByTrendyolId(trendyolId, user_id);
      }
    }
    return null;
  },
  
  // Yeni ürün oluştur
  create: async (data) => {
    return await productService.createProduct(data);
  },
  
  // Toplu ürün oluştur
  bulkCreate: async (dataArray) => {
    return await productService.bulkCreateProducts(dataArray);
  },
  
  // Ürün güncelle
  update: async (data, options) => {
    if (options && options.where && options.where.id && options.where.user_id) {
      return await productService.updateProduct(options.where.id, options.where.user_id, data);
    }
    return null;
  },
  
  // Ürün sil
  destroy: async (options) => {
    if (options && options.where && options.where.id && options.where.user_id) {
      return await productService.deleteProduct(options.where.id, options.where.user_id);
    }
    return null;
  }
};

module.exports = Product; 