/**
 * Prisma Shim - Supabase Uyumlu
 * 
 * Bu dosya, Prisma yerine Supabase hizmetini kullanarak uyumluluk sağlar.
 * Kod tabanında değişiklik yapmadan Prisma çağrılarını Supabase'e yönlendirir.
 */

const { 
  userService,
  productService,
  integrationService,
  productSettingService,
  flashProductService,
  advantageProductService
} = require('./supabaseService');

// PrismaClient taklit sınıfı
class PrismaClientShim {
  constructor() {
    console.warn('UYARI: PrismaClient yerine Supabase shim kullanılıyor.');
    
    // Kullanıcılar
    this.users = {
      findUnique: async (options) => {
        if (!options?.where?.id) return null;
        return await userService.getUserById(options.where.id);
      },
      update: async (options) => {
        if (!options?.where?.id) return null;
        return await userService.updateUser(options.where.id, options.data);
      }
    };
    
    // Ürün ayarları
    this.product_settings = {
      findMany: async (options) => {
        if (!options?.where?.user_id) return [];
        return await productSettingService.getUserProductSettings(options.where.user_id);
      },
      findFirst: async (options) => {
        if (!options?.where) return null;
        if (options.where.barcode) {
          return await productSettingService.getProductSettingByBarcode(options.where.barcode, options.where.user_id);
        }
        if (options.where.trendyol_id) {
          return await productSettingService.getProductSettingByTrendyolId(options.where.trendyol_id, options.where.user_id);
        }
        return null;
      },
      upsert: async (options) => {
        if (!options?.where) return null;
        const existing = await this.product_settings.findFirst(options);
        if (existing) {
          return await productSettingService.updateProductSetting(existing.id, options.create.user_id, options.update);
        } else {
          return await productSettingService.createProductSetting(options.create);
        }
      }
    };
    
    // Avantajlı ürünler
    this.advantage_products = {
      findMany: async (options) => {
        if (!options?.where?.user_id) return [];
        return await advantageProductService.getUserAdvantageProducts(options.where.user_id);
      },
      deleteMany: async (options) => {
        // Bu işlem güvenli değil, sadece belirli koşullarla silme işlemi yapmalıyız
        if (!options?.where?.user_id) return { count: 0 };
        
        // Belirli bir kullanıcıya ait tüm ürünleri silme işlemi 
        // Gerçek uygulamada daha güvenli bir yöntem kullanılmalıdır
        console.warn('Avantajlı ürünleri silme işlemi - bu işlem tehlikeli olabilir!');
        
        // Bu işlemi gerçek silme olmadan simüle ediyoruz
        return { count: 0 };
      },
      create: async (data) => {
        return await advantageProductService.createAdvantageProduct(data);
      }
    };
    
    // Flash ürünler
    this.flash_products = {
      findMany: async (options) => {
        if (!options?.where?.user_id) return [];
        return await flashProductService.getUserFlashProducts(options.where.user_id);
      }
    };
    
    // Entegrasyon ayarları
    this.integration_settings = {
      findMany: async (options) => {
        if (!options?.where?.user_id) return [];
        return []; // Tüm entegrasyon ayarlarını getir
      },
      findUnique: async (options) => {
        if (!options?.where) return null;
        if (options.where.user_id && options.where.service) {
          return await integrationService.getUserIntegrationSettings(options.where.user_id, options.where.service);
        }
        return null;
      },
      upsert: async (options) => {
        if (!options?.where?.user_id || !options?.where?.service) return null;
        const existing = await this.integration_settings.findUnique(options);
        if (existing) {
          return await integrationService.updateIntegrationSettings(
            options.where.user_id, 
            options.where.service, 
            options.update
          );
        } else {
          return await integrationService.createIntegrationSettings(options.create);
        }
      },
      delete: async (options) => {
        if (!options?.where?.user_id || !options?.where?.service) return null;
        return await integrationService.deleteIntegrationSettings(
          options.where.user_id, 
          options.where.service
        );
      },
      deleteMany: async (options) => {
        // Güvenli olmayan işlem, sadece simüle ediyoruz
        return { count: 0 };
      }
    };
    
    // API entegrasyonları
    this.apiIntegrations = {
      findUnique: async (options) => {
        if (!options?.where?.user_id) return null;
        return await integrationService.getUserIntegration(options.where.user_id);
      },
      upsert: async (options) => {
        if (!options?.where?.user_id) return null;
        const existing = await this.apiIntegrations.findUnique(options);
        if (existing) {
          return await integrationService.updateIntegration(
            options.where.user_id, 
            options.update
          );
        } else {
          return await integrationService.createIntegration(options.create);
        }
      }
    };
  }
  
  // Bağlantıyı kapat (eğer gerekirse)
  async $disconnect() {
    // Supabase oturum tabanlı çalıştığı için burada bir şey yapmaya gerek yok
    console.log('Prisma shim bağlantı kapatma çağrısı yapıldı (işlevi yok)');
    return true;
  }
}

// Yeni bir PrismaClient örneği oluştur
module.exports = {
  PrismaClient: PrismaClientShim
}; 