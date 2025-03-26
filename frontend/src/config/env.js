/**
 * Ortam Değişkenleri Konfigürasyonu
 * 
 * Bu dosya, uygulamanın .env dosyasındaki değişkenlere kolay erişim sağlar.
 */

// API temel URL'si
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Supabase yapılandırması
export const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
export const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY;

// Ortam
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PROD = NODE_ENV === 'production';
export const IS_DEV = NODE_ENV === 'development';

// API Endpoints
export const API_ENDPOINTS = {
  // Kullanıcı ile ilgili endpointler
  AUTH: {
    LOGIN: `${API_URL}/users/login`,
    REGISTER: `${API_URL}/users/register`,
    VERIFY: `${API_URL}/users/verify`,
  },
  
  // Ürünler ile ilgili endpointler
  PRODUCTS: {
    BASE: `${API_URL}/api/trendyol/products`,
    SYNC: `${API_URL}/api/trendyol/products/sync`,
    DETAIL: (id) => `${API_URL}/api/trendyol/products/${id}`,
  },
  
  // Siparişler ile ilgili endpointler
  ORDERS: {
    BASE: `${API_URL}/api/orders`,
    SYNC: `${API_URL}/api/orders/sync`,
    DETAIL: (id) => `${API_URL}/api/orders/${id}`,
  },
  
  // Entegrasyonlar ile ilgili endpointler
  INTEGRATIONS: {
    BASE: `${API_URL}/api/integrations`,
    TRENDYOL: `${API_URL}/api/integrations/trendyol`,
  },
  
  // Dashboard ile ilgili endpointler
  DASHBOARD: {
    BASE: `${API_URL}/api/dashboard`,
    STATS: `${API_URL}/api/dashboard/stats`,
  },

  // Avantajlı ürünler ile ilgili endpointler
  ADVANTAGE_PRODUCTS: {
    BASE: `${API_URL}/api/trendyol/advantage-products`,
    DETAIL: (id) => `${API_URL}/api/trendyol/advantage-products/${id}`,
  },
  
  // Flash ürünler ile ilgili endpointler
  FLASH_PRODUCTS: {
    BASE: `${API_URL}/api/trendyol/flash-products`,
    DETAIL: (id) => `${API_URL}/api/trendyol/flash-products/${id}`,
  },
  
  // Ayarlar ile ilgili endpointler
  SETTINGS: {
    BASE: `${API_URL}/settings`,
    PROFILE: `${API_URL}/settings/profile`,
    INTEGRATION: `${API_URL}/settings/integration`,
  },
};

/**
 * API endpoint'leri için yardımcı fonksiyon
 * @param {string} baseUrl - Temel URL
 * @param {string} endpoint - Endpoint adı
 * @returns {string} - Tam endpoint URL'si
 */
export const getApiUrl = (baseUrl, endpoint = '') => {
  return `${baseUrl}${endpoint}`;
}; 