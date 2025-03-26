export const initialMessage = {
    role: 'assistant',
    content: `Merhaba! 👋 Ben Satıcıyız Asistanı.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Size aşağıdaki konularda yardımcı olabilirim:

📊 FİYATLANDIRMA VE KÂR
• Ürün maliyeti ve kâr marjı hesaplamaları
• Kategori bazlı komisyon hesaplamaları
• Rekabetçi fiyatlandırma stratejileri

📦 STOK YÖNETİMİ
• Stok ve envanter analizi
• Minimum stok seviyesi önerileri
• Stok rotasyonu optimizasyonu

🎯 PAZARYERI OPTİMİZASYONU
• Ürün açıklamalarını iyileştirme
• SEO ve görünürlük önerileri
• Performans analizi

💡 SATIŞ STRATEJİLERİ
• Kategori bazlı satış taktikleri
• Sezonsal fırsat önerileri
• Kampanya planlaması

Nasıl yardımcı olabilirim?`
};

export const createSystemMessage = (userData) => {
    return {
        role: 'system',
        content: `📢 **Sen, Satıcıyız platformunun gelişmiş yapay zeka asistanısın!**  
📌 **Uzmanlık Alanın:** E-ticaret, Trendyol satış optimizasyonu, fiyat analizi ve stok yönetimi.  
📌 **Amacın:** Kullanıcının satışlarını artırmasına, stok yönetimini iyileştirmesine ve maksimum kâr elde etmesine yardımcı olmak.  

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
👤 **KULLANICI BİLGİLERİ:**  
• **Kullanıcı ID:** ${userData?.id}  
• **Toplam Ürün:** ${userData?.analytics?.totalProducts || 0}  
• **Düşük Stoklu Ürün:** ${userData?.analytics?.lowStockProducts || 0}  

${userData?.analytics?.lowStockItems ? 
`📦 **DÜŞÜK STOKLU ÜRÜNLER:**  
${userData.analytics.lowStockItems.map(p => 
`• **${p.title}**  
  ◦ 🏷 **Stok:** ${p.quantity}  
  ◦ 🔖 **Barkod:** ${p.barcode}  
  ◦ 💰 **Satış Fiyatı:** ${p.sale_price} TL`  
).join('\n')}`
: '⚠ **Şu an düşük stoklu ürün bulunmuyor.** Ancak, stok takibini ihmal etmeyelim!'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
🚀 **GÖREVLERİN:**  

📊 **FİYATLANDIRMA VE KÂR HESAPLAMALARI**  
✔ Ürün maliyet analizi ve **kâr marjı hesaplamaları**  
✔ Trendyol komisyon hesaplamaları  
✔ KDV ve vergi hesaplamaları  

📦 **STOK YÖNETİMİ**  
✔ Stok seviyesi takibi (**10 ve altı kritik**)  
✔ **Minimum stok önerileri**  
✔ **Stok devir hızı analizleri**  

🎯 **TRENDYOL OPTİMİZASYONU**  
✔ **SEO uyumlu ürün açıklamaları** öner  
✔ Rekabet analizi yap  
✔ Ürün listeleme iyileştirmeleri sun  

💡 **SATIŞ STRATEJİLERİ**  
✔ Sezonsal ve kategori bazlı öneriler sun  
✔ Kampanya planlamalarında yardımcı ol  
✔ **Rekabet avantajı için fiyat önerileri** ver  

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
⚠ **KURALLARIN:**  
✔ **Doğru ve güncel bilgiler sun** 📢  
✔ **Veriye dayalı analizler yap** 📊  
✔ **Stok seviyelerini düzenli kontrol et ve kullanıcıyı uyar** ⚠  
✔ **Yanıtlarını Türkçe ver** 🇹🇷  

Kullanıcıya her zaman değer kat, etkili öneriler sun ve veriye dayalı konuş! 🚀  
    `};
};

// Fiyat optimizasyonu prompt'u
export const createPriceOptimizationPrompt = (product) => {
    return {
        role: 'system',
        content: `🔍 **ÜRÜN FİYAT OPTİMİZASYONU ANALİZİ**

📦 **ÜRÜN BİLGİLERİ:**
• Ürün: ${product.title}
• Barkod: ${product.barcode}
• Kategori: ${product.category_name}
• Mevcut Fiyat: ${product.sale_price} TL
• Maliyet: ${product.cost || 'Belirtilmemiş'} TL
• KDV: %${product.vat_rate}

💰 **FİYAT ANALİZİ VE ÖNERİLER:**
1. Kategori Bazlı Komisyon: %${product.commission_rate}
2. Platform Hizmet Bedeli: 6.99 TL
3. Kargo Maliyeti: ${product.shipping_cost} TL

📈 **REKABET ANALİZİ:**
• Minimum Satış Fiyatı: ${product.min_sale_price} TL
• Önerilen Fiyat Aralığı: ${product.suggested_price_range}
• Rekabetçi Fiyat Önerisi: ${product.competitive_price} TL

⚡ **STRATEJİK ÖNERİLER:**
• Fiyat Konumlandırma: ${product.price_positioning}
• Kâr Marjı İyileştirme: ${product.margin_improvement}
• Kampanya Potansiyeli: ${product.campaign_potential}

🎯 **HEDEF:**
Kategori ortalamasına göre rekabetçi bir fiyat belirlerken, kâr marjını optimize et ve satış potansiyelini artır.`
    };
};

// Ürün açıklaması iyileştirme prompt'u
export const createDescriptionOptimizationPrompt = (product) => {
    // Kategori bazlı SEO ve içerik önerileri
    const categorySpecificTips = getCategorySpecificTips(product.category_name);
    
    return {
        role: 'system',
        content: `📝 **GELİŞMİŞ ÜRÜN AÇIKLAMASI OPTİMİZASYONU**

📦 **ÜRÜN BİLGİLERİ:**
• Ürün: ${product.title}
• Kategori: ${product.category_name}
• Marka: ${product.brand}

🎯 **KATEGORİ BAZLI SEO OPTİMİZASYONU:**
${categorySpecificTips.seo}

✨ **DÖNÜŞÜM ORANI YÜKSEK AÇIKLAMA ŞABLONU:**
${categorySpecificTips.template}

👥 **HEDEF KİTLEYE GÖRE DİL KULLANIMI:**
${categorySpecificTips.targetAudience}

📋 **TRENDYOL KATEGORİ POLİTİKALARI UYUMU:**
${categorySpecificTips.policies}

🔍 **SEO ODAKLI İYİLEŞTİRME HEDEFLERİ:**
1. Anahtar Kelime Optimizasyonu: Ürün başlığı ve açıklamasında kategori bazlı anahtar kelimelerin doğru kullanımı
2. Okunabilirlik ve Düzen: Kısa paragraflar, madde işaretleri ve alt başlıklar kullanarak içeriği düzenle
3. Öne Çıkan Özelliklerin Vurgulanması: Ürünün en çekici özelliklerini öne çıkar
4. Satın Alma Motivasyonu: Ürünün faydalarını ve değerini vurgula
5. Teknik Detayların Netliği: Boyut, malzeme, kullanım şekli gibi detayları eksiksiz belirt

📊 **KONTROL LİSTESİ:**
✓ Doğru ve eksiksiz ürün bilgileri
✓ SEO dostu anahtar kelimeler
✓ Satış odaklı içerik yapısı
✓ Trendyol kurallarına uygunluk
✓ Hedef kitle odaklı dil kullanımı
✓ Mobil uyumlu içerik düzeni
✓ Emoji ve özel karakterlerin doğru kullanımı`
    };
};

// Kategori bazlı SEO ve içerik önerileri
const getCategorySpecificTips = (categoryName) => {
    const category = categoryName ? categoryName.toLowerCase() : '';
    
    // Varsayılan öneriler
    let tips = {
        seo: `• Ürün başlığında marka, model ve ana özellikler bulunmalı
• Açıklamada ürün tipi, kullanım alanı ve temel özelliklere yer verilmeli
• Arama hacmi yüksek anahtar kelimeleri doğal bir şekilde kullan`,
        
        template: `• Kısa ve çarpıcı bir giriş paragrafı
• Madde işaretleriyle listelenmiş özellikler
• Kullanım alanları ve faydalar
• Teknik özellikler tablosu
• Paket içeriği
• Garanti ve iade bilgileri`,
        
        targetAudience: `• Genel hedef kitleye uygun, anlaşılır bir dil kullan
• Teknik terimleri gerektiğinde açıkla
• Samimi ancak profesyonel bir ton kullan
• İkna edici ama abartısız ifadeler tercih et`,
        
        policies: `• Yanıltıcı bilgilerden kaçın
• Rakip marka isimleri kullanma
• Trendyol'un yasakladığı ifadelerden kaçın (en iyi, en ucuz, vb.)
• Gerçek dışı indirim oranları belirtme
• Ürün görselleriyle uyumlu açıklamalar kullan`
    };
    
    // Giyim kategorisi
    if (category.includes('giyim') || category.includes('ayakkabı') || category.includes('çanta') || 
        category.includes('aksesuar') || category.includes('tekstil')) {
        tips.seo = `• Ürün başlığında marka, model, renk ve beden bilgisi bulunmalı
• Kumaş türü, desen, sezon gibi anahtar kelimeleri kullan
• "Şık", "rahat", "günlük", "spor" gibi stil tanımlayıcıları ekle`;
        
        tips.template = `• Stil ve tasarım özellikleri
• Kumaş ve malzeme bilgisi
• Bakım ve yıkama talimatları
• Kombinleme önerileri
• Beden tablosu ve ölçü bilgileri
• Mevsimsel kullanım önerileri`;
        
        tips.targetAudience = `• Moda bilincine sahip tüketicilere hitap eden dil kullan
• Stil ve trend vurgusu yap
• Görsel tanımlamalara yer ver (kesim, dikiş, doku)
• Kullanım rahatlığı ve şıklık dengesi vurgula`;
        
        tips.policies = `• Sahte markalardan kaçın
• Kumaş içeriğini doğru belirt
• Beden ölçülerini standartlara uygun ver
• Renk farklılıkları konusunda uyarı ekle
• Gerçek ürün fotoğrafları kullandığını belirt`;
    }
    
    // Elektronik kategorisi
    else if (category.includes('elektronik') || category.includes('bilgisayar') || 
             category.includes('telefon') || category.includes('tablet')) {
        tips.seo = `• Ürün başlığında marka, model, teknik özellikler (RAM, depolama, işlemci) bulunmalı
• Teknik terimleri doğru kullan (Hz, MP, GB, GHz)
• Garanti süresi ve resmi distribütör bilgisini vurgula`;
        
        tips.template = `• Teknik özellikler tablosu (öncelikli)
• Performans değerlendirmesi
• Kutu içeriği
• Bağlantı özellikleri
• Garanti ve servis bilgileri
• Enerji tüketimi ve verimlilik`;
        
        tips.targetAudience = `• Teknik detaylara önem veren kullanıcılara hitap et
• Performans ve özellik karşılaştırmalarına yer ver
• Kullanım kolaylığı ve teknolojik yenilikleri vurgula
• Teknik terimleri açıkla ama uzmanlık dilini koru`;
        
        tips.policies = `• Teknik özellikleri doğru belirt
• Garanti şartlarını net olarak açıkla
• İthalatçı/distribütör bilgilerini ekle
• Enerji sınıfı ve tüketim değerlerini doğru ver
• Yazılım sürümü ve uyumluluk bilgilerini belirt`;
    }
    
    // Ev ve Yaşam kategorisi
    else if (category.includes('ev') || category.includes('mobilya') || 
             category.includes('dekorasyon') || category.includes('mutfak')) {
        tips.seo = `• Ürün başlığında ürün tipi, malzeme, boyut bilgisi bulunmalı
• "Dekoratif", "fonksiyonel", "modern", "klasik" gibi stil tanımlayıcıları kullan
• Kullanım alanı ve amacını belirt`;
        
        tips.template = `• Tasarım ve stil özellikleri
• Malzeme ve dayanıklılık bilgileri
• Boyut ve ölçü tablosu
• Montaj gereksinimleri
• Bakım ve temizlik önerileri
• Dekorasyon ve kullanım önerileri`;
        
        tips.targetAudience = `• Ev dekorasyonuna önem veren kullanıcılara hitap et
• Estetik ve fonksiyonellik dengesi vurgula
• Yaşam alanlarına katacağı değeri anlat
• Sıcak ve samimi bir dil kullan`;
        
        tips.policies = `• Malzeme içeriğini doğru belirt
• Boyut ve ölçüleri standart birimlerde ver
• Montaj gerektiren ürünlerde kurulum bilgisi ekle
• Garanti ve iade koşullarını belirt
• Üretim yeri bilgisini ekle`;
    }
    
    // Kozmetik ve Kişisel Bakım
    else if (category.includes('kozmetik') || category.includes('bakım') || 
             category.includes('parfüm') || category.includes('makyaj')) {
        tips.seo = `• Ürün başlığında marka, ürün tipi, hacim/miktar bilgisi bulunmalı
• Cilt tipi, etki, içerik gibi anahtar kelimeleri kullan
• "Nemlendirici", "canlandırıcı", "besleyici" gibi etki tanımlayıcıları ekle`;
        
        tips.template = `• İçerik ve formül bilgileri
• Cilt tipi uygunluğu
• Kullanım talimatları
• Faydalar ve etkiler
• İçerik listesi ve alerjik uyarılar
• Üretim ve son kullanma tarihi bilgisi`;
        
        tips.targetAudience = `• Kişisel bakımına önem veren kullanıcılara hitap et
• Güzellik ve bakım sonuçlarını vurgula
• Doğal ve sağlıklı içerikleri öne çıkar
• Güven verici ve uzman bir dil kullan`;
        
        tips.policies = `• İçerik listesini tam ve doğru ver
• Sağlık iddialarından kaçın
• Dermatolojik test bilgilerini doğru belirt
• Hayvan testleri konusunda şeffaf ol
• Son kullanma tarihini belirt`;
    }
    
    return tips;
};

// Excel aktarım prompt'u
export const createExcelExportPrompt = (product, email) => {
    return {
        role: 'system',
        content: `📊 **EXCEL AKTARIM VE MAİL BİLGİLERİ**

📦 **ÜRÜN BİLGİLERİ:**
• Barkod: ${product.barcode}
• Ürün: ${product.title}
• Kategori: ${product.category_name}

📧 **MAİL BİLGİLERİ:**
• Gönderilecek Adres: ${email}
• Format: Excel (.xlsx)
• İçerik: Ürün detayları ve analiz raporu

📋 **RAPOR İÇERİĞİ:**
1. Ürün Temel Bilgileri
2. Satış ve Stok Verileri
3. Fiyatlandırma Analizi
4. Performans Metrikleri
5. Optimizasyon Önerileri`
    };
};

// Satış stratejisi önerisi prompt'u
export const createSalesStrategyContext = (userData) => {
    // Stok durumu analizi
    const lowStockCount = userData?.analytics?.lowStockProducts || 0;
    const totalProducts = userData?.analytics?.totalProducts || 0;
    const lowStockPercentage = totalProducts > 0 ? Math.round((lowStockCount / totalProducts) * 100) : 0;
    
    // Kategori dağılımı analizi
    const categoryDistribution = analyzeCategoryDistribution(userData?.products || []);
    
    // Mevcut ay ve sezon bilgisi
    const currentMonth = new Date().getMonth() + 1; // 1-12 arası
    const currentSeason = getSeason(currentMonth);
    const upcomingSeason = getUpcomingSeason(currentMonth);
    
    // Sezonsal kampanya önerileri
    const seasonalCampaigns = getSeasonalCampaignSuggestions(currentMonth);
    
    return `🚀 **KİŞİSELLEŞTİRİLMİŞ SATIŞ STRATEJİSİ ANALİZİ**

📊 **MEVCUT DURUM ANALİZİ:**
• Toplam Ürün: ${totalProducts} ürün
• Düşük Stoklu Ürün: ${lowStockCount} ürün (${lowStockPercentage}%)
• Kategori Dağılımı: ${categoryDistribution}

🔍 **GÜÇLÜ VE ZAYIF YÖNLER:**
${getStrengthsAndWeaknesses(userData, categoryDistribution)}

📅 **SEZONSAL FIRSATLAR:**
• Mevcut Sezon: ${currentSeason}
• Yaklaşan Sezon: ${upcomingSeason}
• Önerilen Kampanyalar: ${seasonalCampaigns}

📈 **BÜYÜME STRATEJİSİ ÖNERİLERİ:**
${getGrowthStrategies(userData, categoryDistribution)}

🎯 **TRENDYOL KAMPANYA FIRSATLARI:**
${getTrendyolCampaignOpportunities(currentMonth)}

⚡ **AKSİYON PLANI:**
1. Stok Yönetimi: ${getStockManagementAction(lowStockPercentage)}
2. Fiyatlandırma: ${getPricingAction(userData)}
3. Ürün Çeşitlendirme: ${getProductDiversificationAction(categoryDistribution)}
4. Pazarlama: ${getMarketingAction(currentSeason)}
5. Müşteri Deneyimi: Ürün açıklamalarını ve görselleri optimize et, hızlı kargo seçenekleri sun`;
};

// Yardımcı fonksiyonlar
const analyzeCategoryDistribution = (products) => {
    if (!products || products.length === 0) return "Yeterli veri yok";
    
    const categories = {};
    products.forEach(product => {
        const category = product.category_name || "Diğer";
        categories[category] = (categories[category] || 0) + 1;
    });
    
    // En çok ürüne sahip 3 kategoriyi bul
    const topCategories = Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category, count]) => {
            const percentage = Math.round((count / products.length) * 100);
            return `${category} (${percentage}%)`;
        });
    
    return topCategories.join(', ');
};

const getSeason = (month) => {
    if (month >= 3 && month <= 5) return "İlkbahar";
    if (month >= 6 && month <= 8) return "Yaz";
    if (month >= 9 && month <= 11) return "Sonbahar";
    return "Kış";
};

const getUpcomingSeason = (month) => {
    if (month >= 1 && month <= 2) return "İlkbahar";
    if (month >= 3 && month <= 5) return "Yaz";
    if (month >= 6 && month <= 8) return "Sonbahar";
    if (month >= 9 && month <= 11) return "Kış";
    return "İlkbahar";
};

const getSeasonalCampaignSuggestions = (month) => {
    const campaigns = {
        1: "Kış İndirimleri, Yeni Yıl Fırsatları, Sevgililer Günü Hazırlık",
        2: "Sevgililer Günü, Kış Sonu İndirimleri, Erken İlkbahar Koleksiyonu",
        3: "İlkbahar Koleksiyonu, 8 Mart Kadınlar Günü, Bahar Temizliği",
        4: "Paskalya, 23 Nisan, Bahar Fırsatları",
        5: "Anneler Günü, Yaz Hazırlık, Bayram Alışverişi",
        6: "Babalar Günü, Yaz Koleksiyonu, Tatil Hazırlıkları",
        7: "Yaz İndirimleri, Plaj Ürünleri, Okula Dönüş Erken Alışveriş",
        8: "Yaz Sonu İndirimleri, Okula Dönüş, Sonbahar Hazırlık",
        9: "Sonbahar Koleksiyonu, Okul Dönemi, Ev Dekorasyon",
        10: "Cadılar Bayramı, Sonbahar Fırsatları, Kış Hazırlık",
        11: "Black Friday, Efsane Cuma, Kış Koleksiyonu, Yılbaşı Hazırlık",
        12: "Yılbaşı Alışverişi, Kış İndirimleri, Yıl Sonu Fırsatları"
    };
    
    return campaigns[month] || "Mevsimsel kampanyalar";
};

const getStrengthsAndWeaknesses = (userData, categoryDistribution) => {
    const products = userData?.products || [];
    if (products.length === 0) return "Yeterli veri yok";
    
    // Güçlü yönler analizi
    const strengths = [];
    const weaknesses = [];
    
    // Ürün çeşitliliği
    if (products.length > 50) {
        strengths.push("Geniş ürün yelpazesi");
    } else if (products.length < 20) {
        weaknesses.push("Sınırlı ürün çeşitliliği");
    }
    
    // Stok durumu
    const lowStockPercentage = userData?.analytics?.lowStockProducts / products.length * 100 || 0;
    if (lowStockPercentage < 10) {
        strengths.push("İyi stok yönetimi");
    } else if (lowStockPercentage > 30) {
        weaknesses.push("Stok yönetimi iyileştirilmeli");
    }
    
    // Kategori odağı
    if (categoryDistribution.includes('(') && parseInt(categoryDistribution.match(/\((\d+)%\)/)[1]) > 60) {
        strengths.push("Güçlü kategori odağı");
    } else if (!categoryDistribution.includes('Yeterli veri yok')) {
        strengths.push("Çeşitlendirilmiş kategori dağılımı");
    }
    
    return `**Güçlü Yönler:**
• ${strengths.length > 0 ? strengths.join('\n• ') : 'Yeterli veri yok'}

**Geliştirilmesi Gereken Alanlar:**
• ${weaknesses.length > 0 ? weaknesses.join('\n• ') : 'Belirgin bir zayıf yön tespit edilmedi'}`;
};

const getGrowthStrategies = (userData, categoryDistribution) => {
    const products = userData?.products || [];
    if (products.length === 0) return "Yeterli veri yok";
    
    const strategies = [];
    
    // Ürün çeşitliliği stratejisi
    if (products.length < 30) {
        strategies.push("Ürün çeşitliliğini artır: Mevcut kategorilerde tamamlayıcı ürünler ekle");
    } else if (categoryDistribution.includes('(') && parseInt(categoryDistribution.match(/\((\d+)%\)/)[1]) > 70) {
        strategies.push("Kategori çeşitlendirme: Mevcut uzmanlık alanınızı tamamlayıcı kategorilere genişletin");
    }
    
    // Stok stratejisi
    const lowStockPercentage = userData?.analytics?.lowStockProducts / products.length * 100 || 0;
    if (lowStockPercentage > 20) {
        strategies.push("Stok optimizasyonu: Düşük stoklu ürünleri tamamlayarak satış kaybını önleyin");
    }
    
    // Genel stratejiler
    strategies.push("Ürün açıklamalarını ve görselleri optimize ederek dönüşüm oranını artırın");
    strategies.push("Trendyol kampanyalarına aktif katılım ile görünürlüğü artırın");
    
    return strategies.join('\n• ');
};

const getTrendyolCampaignOpportunities = (month) => {
    const campaigns = {
        1: ["Yılbaşı İndirimleri", "Kış Fırsatları", "Sevgililer Günü Ön Hazırlık"],
        2: ["Sevgililer Günü", "Şubat Fırsatları", "Sezon Sonu İndirimleri"],
        3: ["8 Mart Kadınlar Günü", "Bahar Kampanyası", "Yeni Sezon Fırsatları"],
        4: ["23 Nisan Özel", "Bahar İndirimleri", "Ramazan/Bayram Hazırlık"],
        5: ["Anneler Günü", "Mayıs Fırsatları", "Yaz Hazırlık"],
        6: ["Babalar Günü", "Yaz Kampanyası", "Tatil Sezonu"],
        7: ["Temmuz Fırsatları", "Yaz İndirimleri", "Bayram Özel"],
        8: ["Ağustos Fırsatları", "Okula Dönüş", "Yaz Sonu"],
        9: ["Sonbahar Kampanyası", "Eylül Fırsatları", "Okul Zamanı"],
        10: ["Ekim Fırsatları", "Sonbahar İndirimleri", "Cadılar Bayramı"],
        11: ["Black Friday", "Kasım Fırsatları", "Efsane Günler"],
        12: ["Aralık Fırsatları", "Yılbaşı Özel", "Yıl Sonu İndirimleri"]
    };
    
    const currentCampaigns = campaigns[month] || ["Mevsimsel Kampanyalar"];
    
    return `• ${currentCampaigns.join('\n• ')}

**Kampanya Katılım Stratejisi:**
• Kampanyalara en az 1 hafta önceden hazırlanın
• Stok durumunuzu kampanya öncesi kontrol edin
• Rekabetçi fiyatlandırma yapın ancak kâr marjınızı koruyun
• Kampanya ürünlerinizi öne çıkarmak için açıklamaları ve görselleri optimize edin`;
};

const getStockManagementAction = (lowStockPercentage) => {
    if (lowStockPercentage > 30) {
        return "ACİL: Düşük stoklu ürünleri hemen tamamlayın";
    } else if (lowStockPercentage > 15) {
        return "Düşük stoklu ürünleri 1 hafta içinde tamamlayın";
    } else {
        return "Stok seviyelerini haftalık olarak kontrol edin";
    }
};

const getPricingAction = (userData) => {
    return "Rekabet analizi yaparak fiyatlarınızı haftalık olarak gözden geçirin";
};

const getProductDiversificationAction = (categoryDistribution) => {
    if (categoryDistribution.includes('(') && parseInt(categoryDistribution.match(/\((\d+)%\)/)[1]) > 70) {
        return "Ana kategorinizi tamamlayıcı ürünlerle çeşitlendirin";
    } else {
        return "En çok satan kategorilerinize odaklanarak ürün çeşitliliğini artırın";
    }
};

const getMarketingAction = (currentSeason) => {
    return `${currentSeason} sezonuna özel kampanyalar oluşturun ve Trendyol kampanyalarına aktif katılım sağlayın`;
};

// Stok yönetimi tavsiyesi prompt'u
export const createStockManagementContext = (userData) => {
    // Stok durumu analizi
    const products = userData?.products || [];
    const lowStockThreshold = 10;
    const criticalStockThreshold = 5;
    
    if (products.length === 0) {
        return `📦 **STOK YÖNETİMİ TAVSİYELERİ**

⚠️ Henüz yeterli ürün verisi bulunmuyor. Stok yönetimi tavsiyeleri için ürünlerinizi sisteme eklemeniz gerekmektedir.`;
    }
    
    // Stok durumu kategorileri
    const lowStockProducts = products.filter(p => p.quantity <= lowStockThreshold && p.quantity > criticalStockThreshold);
    const criticalStockProducts = products.filter(p => p.quantity <= criticalStockThreshold && p.quantity > 0);
    const outOfStockProducts = products.filter(p => p.quantity <= 0);
    const healthyStockProducts = products.filter(p => p.quantity > lowStockThreshold);
    
    // Stok devir hızı analizi (basit yaklaşım)
    // Not: Gerçek stok devir hızı için satış verileri gereklidir
    const stockTurnoverAnalysis = analyzeStockTurnover(products);
    
    // Stok optimizasyon önerileri
    const stockOptimizationTips = getStockOptimizationTips(products, lowStockProducts, criticalStockProducts, outOfStockProducts);
    
    return `📦 **STOK YÖNETİMİ TAVSİYELERİ**

📊 **MEVCUT STOK DURUMU:**
• Toplam Ürün: ${products.length} ürün
• Sağlıklı Stok: ${healthyStockProducts.length} ürün (${Math.round(healthyStockProducts.length / products.length * 100)}%)
• Düşük Stok (6-10): ${lowStockProducts.length} ürün (${Math.round(lowStockProducts.length / products.length * 100)}%)
• Kritik Stok (1-5): ${criticalStockProducts.length} ürün (${Math.round(criticalStockProducts.length / products.length * 100)}%)
• Stokta Yok: ${outOfStockProducts.length} ürün (${Math.round(outOfStockProducts.length / products.length * 100)}%)

${criticalStockProducts.length > 0 ? `
⚠️ **ACİL STOK TAMAMLAMA GEREKLİ ÜRÜNLER:**
${criticalStockProducts.slice(0, 5).map(p => `• ${p.title} (Stok: ${p.quantity})`).join('\n')}
${criticalStockProducts.length > 5 ? `• ... ve ${criticalStockProducts.length - 5} ürün daha` : ''}` : ''}

${lowStockProducts.length > 0 ? `
🔍 **DÜŞÜK STOKLU ÜRÜNLER:**
${lowStockProducts.slice(0, 5).map(p => `• ${p.title} (Stok: ${p.quantity})`).join('\n')}
${lowStockProducts.length > 5 ? `• ... ve ${lowStockProducts.length - 5} ürün daha` : ''}` : ''}

📈 **STOK DEVİR HIZI ANALİZİ:**
${stockTurnoverAnalysis}

💡 **STOK OPTİMİZASYON ÖNERİLERİ:**
${stockOptimizationTips}

⚡ **AKSİYON PLANI:**
1. Kritik stoklu ürünleri hemen sipariş edin
2. Düşük stoklu ürünleri 1 hafta içinde tamamlayın
3. Stok seviyelerini haftalık olarak kontrol edin
4. Mevsimsel talep değişikliklerine göre stok planlaması yapın
5. Stok devir hızını düzenli olarak analiz edin`;
};

// Stok devir hızı analizi
const analyzeStockTurnover = (products) => {
    // Gerçek bir uygulamada, bu analiz satış verileri ve stok geçmişine dayanmalıdır
    // Burada basit bir yaklaşım kullanıyoruz
    
    // Ürünleri kategorilere göre grupla
    const categories = {};
    products.forEach(product => {
        const category = product.category_name || "Diğer";
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push(product);
    });
    
    // Her kategori için ortalama stok seviyesi
    const categoryAverages = Object.entries(categories).map(([category, prods]) => {
        const avgStock = prods.reduce((sum, p) => sum + (p.quantity || 0), 0) / prods.length;
        return { category, avgStock, count: prods.length };
    });
    
    // En düşük ortalama stoka sahip kategoriler (potansiyel olarak daha hızlı dönen)
    const fastMovingCategories = categoryAverages
        .filter(c => c.count >= 3) // En az 3 ürün olan kategorileri al
        .sort((a, b) => a.avgStock - b.avgStock)
        .slice(0, 2);
    
    // En yüksek ortalama stoka sahip kategoriler (potansiyel olarak daha yavaş dönen)
    const slowMovingCategories = categoryAverages
        .filter(c => c.count >= 3)
        .sort((a, b) => b.avgStock - a.avgStock)
        .slice(0, 2);
    
    let analysis = '';
    
    if (fastMovingCategories.length > 0) {
        analysis += `• Hızlı Dönen Kategoriler: ${fastMovingCategories.map(c => c.category).join(', ')}\n`;
    }
    
    if (slowMovingCategories.length > 0) {
        analysis += `• Yavaş Dönen Kategoriler: ${slowMovingCategories.map(c => c.category).join(', ')}\n`;
    }
    
    analysis += `• Stok devir hızını artırmak için yavaş dönen kategorilerde promosyon ve kampanya düzenleyin\n`;
    analysis += `• Hızlı dönen kategorilerde stok seviyelerini daha sık kontrol edin`;
    
    return analysis;
};

// Stok optimizasyon önerileri
const getStockOptimizationTips = (products, lowStockProducts, criticalStockProducts, outOfStockProducts) => {
    const tips = [];
    
    // Kritik stok durumu varsa
    if (criticalStockProducts.length > 0 || outOfStockProducts.length > 0) {
        tips.push("ACİL: Kritik stoklu ve stokta olmayan ürünleri hemen sipariş edin");
    }
    
    // Düşük stok durumu varsa
    if (lowStockProducts.length > 0) {
        tips.push("Düşük stoklu ürünleri 1 hafta içinde tamamlayın");
    }
    
    // Genel öneriler
    tips.push("Minimum stok seviyesi belirleyin (önerilen: 10 adet)");
    tips.push("Stok maliyetlerini düşürmek için toplu sipariş vermeyi değerlendirin");
    tips.push("Mevsimsel talep değişikliklerine göre stok planlaması yapın");
    tips.push("Stok takibi için otomatik bildirim sistemi kurun");
    
    return tips.join('\n• ');
};
