/**
 * Sipariş Model - Supabase Uyumlu
 * 
 * Bu dosya, Supabase'de bulunan 'orders' tablosu için model tanımını içerir.
 * Artık Sequelize yerine Supabase kullanılmaktadır.
 */

const { orderService } = require('../services/supabaseService');

// Order modeli şema tanımı
const orderSchema = {
  id: 'integer',
  user_id: 'integer',
  order_number: 'string',
  customer_first_name: 'string',
  customer_last_name: 'string',
  customer_email: 'string',
  total_price: 'decimal',
  status: 'string',
  lines: 'jsonb',
  order_date: 'timestamp',
  last_update_date: 'timestamp',
  created_at: 'timestamp',
  updated_at: 'timestamp'
};

// Sipariş işlemleri için yardımcı fonksiyonlar
const Order = {
  // Kullanıcıya ait tüm siparişleri getir
  findAll: async (options) => {
    if (options && options.where && options.where.user_id) {
      return await orderService.getUserOrders(options.where.user_id);
    }
    return [];
  },
  
  // ID'ye göre sipariş getir
  findByPk: async (id, options) => {
    if (options && options.user_id) {
      return await orderService.getOrderById(id, options.user_id);
    }
    return null;
  },
  
  // Sipariş numarasına göre sipariş getir
  findOne: async (options) => {
    if (options && options.where) {
      const { orderNumber, user_id } = options.where;
      if (orderNumber && user_id) {
        return await orderService.getOrderByOrderNumber(orderNumber, user_id);
      }
    }
    return null;
  },
  
  // Yeni sipariş oluştur
  create: async (data) => {
    return await orderService.createOrder(data);
  },
  
  // Sipariş güncelle
  update: async (data, options) => {
    if (options && options.where && options.where.id && options.where.user_id) {
      return await orderService.updateOrder(options.where.id, options.where.user_id, data);
    }
    return null;
  },
  
  // Sipariş sil
  destroy: async (options) => {
    if (options && options.where && options.where.id && options.where.user_id) {
      return await orderService.deleteOrder(options.where.id, options.where.user_id);
    }
    return null;
  },
  
  // Yeni upsert fonksiyonu - sipariş numarasına göre günceller veya oluşturur
  upsert: async (data) => {
    try {
      console.log('Upsert işlemi başlatılıyor:', {
        order_number: data.order_number,
        user_id: data.user_id
      });

      // Önce siparişi bul
      const existingOrder = await orderService.getOrderByOrderNumber(data.order_number, data.user_id);
      
      console.log('Mevcut sipariş bulundu mu?', existingOrder ? 'Evet' : 'Hayır');
      
      if (existingOrder) {
        // Sipariş varsa güncelle
        console.log('Siparişi güncelliyorum, ID:', existingOrder.id);
        return await orderService.updateOrder(existingOrder.id, data.user_id, data);
      } else {
        // Sipariş yoksa oluştur
        console.log('Yeni sipariş oluşturuyorum');
        return await orderService.createOrder(data);
      }
    } catch (error) {
      console.error('Sipariş upsert hatası:', error);
      throw error;
    }
  }
};

module.exports = Order; 