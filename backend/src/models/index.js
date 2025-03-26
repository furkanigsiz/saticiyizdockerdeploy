/**
 * Model İndeks Dosyası - Supabase Uyumlu
 * 
 * Bu dosya, modelleri bir arada dışa aktarır.
 * Artık Sequelize ilişkileri yerine Supabase tablo ilişkileri kullanılmaktadır.
 */

const User = require("./User");
const ApiIntegration = require("./ApiIntegration");
const Order = require("./Order");
const Product = require("./Product");

// Not: Supabase'de ilişkiler veritabanı seviyesinde tanımlanmıştır.
// Burada ilişkiler belirtilmese de sorgular, foreign key'ler yoluyla 
// ilişkisel verileri çekebilir.

module.exports = { 
    User, 
    ApiIntegration,
    Order,
    Product
};
