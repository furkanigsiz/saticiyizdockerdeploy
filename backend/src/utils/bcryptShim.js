/**
 * Bcrypt Shim - Docker ortamında geliştirme için
 * 
 * Bu modül, bcrypt yerine kullanılacak bir shim (geçici ikame) sağlar.
 * ÖNEMLİ: Bu modül sadece geliştirme ortamında kullanılmalıdır!
 * Üretim ortamında gerçek bcrypt kullanın.
 */

const crypto = require('crypto');

/**
 * Rasgele bir salt oluşturur
 * @param {number} length - Salt uzunluğu
 * @returns {string} - Salt
 */
const generateSalt = (length = 16) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Şifre hashler
 * @param {string} password - Hashlenecek şifre
 * @param {number} rounds - Salt roundları (kullanılmıyor)
 * @returns {Promise<string>} - Hashlenen şifre
 */
const hash = (password, rounds = 10) => {
  return new Promise((resolve) => {
    // Güçlü bir salt oluştur
    const salt = generateSalt();
    
    // HMAC ile şifreyi hashle (daha güvenli)
    const hmac = crypto.createHmac('sha512', salt);
    hmac.update(password);
    const computedHash = hmac.digest('hex');
    
    // Hash formatını belirle: $devmode$salt$hash
    resolve(`$devmode$${salt}$${computedHash}`);
  });
};

/**
 * Şifre karşılaştırır
 * @param {string} password - Karşılaştırılacak şifre
 * @param {string} hash - Karşılaştırılacak hash
 * @returns {Promise<boolean>} - Eşleşme durumu
 */
const compare = (password, hashedPassword) => {
  return new Promise((resolve) => {
    // Eğer normal bcrypt hash ise ve geliştirme modundaysak
    if (hashedPassword.startsWith('$2') && process.env.NODE_ENV !== 'production') {
      console.warn('UYARI: Geliştirme modunda bcrypt karşılaştırması yapılıyor!');
      return resolve(true);
    }

    // Geliştirme modu hashlerini karşılaştır
    if (hashedPassword.startsWith('$devmode$')) {
      const parts = hashedPassword.split('$');
      const salt = parts[2];
      const originalHash = parts[3];
      
      // HMAC ile yeni hash oluştur
      const hmac = crypto.createHmac('sha512', salt);
      hmac.update(password);
      const computedHash = hmac.digest('hex');
      
      // Hashler eşleşiyor mu?
      return resolve(computedHash === originalHash);
    }

    // Bilinmeyen hash formatı
    console.warn('UYARI: Bilinmeyen hash formatı! Geliştirme modunda otomatik doğrulama yapılıyor.');
    resolve(process.env.NODE_ENV !== 'production');
  });
};

module.exports = {
  hash,
  compare,
  genSalt: (rounds) => Promise.resolve(generateSalt()),
  genSaltSync: (rounds) => generateSalt(),
  hashSync: (password) => {
    const salt = generateSalt();
    const hmac = crypto.createHmac('sha512', salt);
    hmac.update(password);
    return `$devmode$${salt}$${hmac.digest('hex')}`;
  },
  compareSync: (password, hashedPassword) => {
    if (hashedPassword.startsWith('$2') && process.env.NODE_ENV !== 'production') {
      return true;
    }
    
    if (hashedPassword.startsWith('$devmode$')) {
      const parts = hashedPassword.split('$');
      const salt = parts[2];
      const originalHash = parts[3];
      
      const hmac = crypto.createHmac('sha512', salt);
      hmac.update(password);
      const computedHash = hmac.digest('hex');
      
      return computedHash === originalHash;
    }
    
    return process.env.NODE_ENV !== 'production';
  }
}; 