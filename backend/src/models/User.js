/**
 * User Model - Supabase Uyumlu
 * 
 * Bu dosya, Supabase'de bulunan 'users' tablosu için model tanımını içerir.
 * Artık Sequelize yerine Supabase kullanılmaktadır.
 */

const { userService } = require('../services/supabaseService');

// User modeli şema tanımı
const userSchema = {
  id: 'integer',
  email: 'string',
  password: 'string',
  first_name: 'string',
  last_name: 'string',
  phone: 'string',
  role: 'string',
  created_at: 'timestamp',
  updated_at: 'timestamp'
};

// Kullanıcı işlemleri için yardımcı fonksiyonlar
const User = {
  // Tüm kullanıcıları getir
  findAll: async () => {
    return await userService.getAllUsers();
  },
  
  // ID'ye göre kullanıcı bul
  findByPk: async (id) => {
    return await userService.getUserById(id);
  },
  
  // E-postaya göre kullanıcı bul
  findOne: async (options) => {
    if (options && options.where && options.where.email) {
      return await userService.getUserByEmail(options.where.email);
    }
    return null;
  },
  
  // Yeni kullanıcı oluştur
  create: async (userData) => {
    return await userService.createUser(userData);
  },
  
  // Kullanıcı güncelle
  update: async (data, options) => {
    if (options && options.where && options.where.id) {
      return await userService.updateUser(options.where.id, data);
    }
    return null;
  },
  
  // Kullanıcı sil
  destroy: async (options) => {
    if (options && options.where && options.where.id) {
      return await userService.deleteUser(options.where.id);
    }
    return null;
  }
};

module.exports = User;
