import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';

const TermsSection = ({ title, children }) => (
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="mb-12"
  >
    <h2 className="text-2xl font-semibold text-primary mb-6" tabIndex="0">
      {title}
    </h2>
    <div className="prose prose-slate max-w-none space-y-4">
      {children}
    </div>
  </motion.section>
);

const Terms = () => {
  const lastUpdate = "26 Çarşamba 2025"; // Manuel olarak güncelleyin

  return (
    <>
      <Helmet>
        <title>Platform Kullanım Koşulları - Saticiyiz.com</title>
        <meta name="description" content="Saticiyiz.com platform kullanım koşulları, hizmet şartları ve yasal bilgiler." />
      </Helmet>

      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-card rounded-lg shadow-lg p-8 space-y-8">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-bold text-primary mb-8 text-center"
              tabIndex="0"
            >
              Platform Kullanım Koşulları
            </motion.h1>

            <div className="bg-muted p-4 rounded-md mb-8">
              <p className="text-muted-foreground text-sm">
                Son Güncelleme Tarihi: {lastUpdate}
              </p>
            </div>

            <TermsSection title="1. Şirket Bilgileri">
              <div className="bg-card border border-border rounded-md p-4">
                <p className="text-muted-foreground">
                  Ticari Unvan: Satıcıyız Teknoloji A.Ş.<br />
                  Mersis No: 0123456789012345<br />
                  Vergi Dairesi/No: Antalya / 1234567890<br />
                  Adres: Liman Mahallesi, Akdeniz Bulvarı, No: 1234, Konyaaltı/Antalya<br />
                  E-posta: info@saticiyiz.com<br />
                  Tel: +90 (242) 123 45 67
                </p>
              </div>
            </TermsSection>

            <TermsSection title="2. Tanımlar">
              <p className="text-muted-foreground">
                Platform: www.saticiyiz.com alan adı üzerinden sunulan e-ticaret entegrasyon hizmetleridir.
              </p>
              <p className="text-muted-foreground">
                Kullanıcı/Satıcı: Platformu kullanarak çeşitli pazaryerlerinde satış yapan gerçek veya tüzel kişilerdir.
              </p>
              <p className="text-muted-foreground">
                Hizmet: Platform üzerinden sunulan tüm e-ticaret entegrasyon, yönetim ve analiz araçlarıdır.
              </p>
              <p className="text-muted-foreground">
                Pazaryeri: Trendyol, Hepsiburada, Amazon, N11 gibi dijital satış platformlarıdır.
              </p>
            </TermsSection>

            <TermsSection title="3. Hizmet Kullanım Şartları">
              <p className="text-muted-foreground">
                Platform kullanımına ilişkin temel kurallar:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Kullanıcılar kendi pazaryeri hesaplarının güvenliğinden sorumludur</li>
                <li>API kullanım limitlerine uyulmalıdır</li>
                <li>Platformun kötüye kullanımı yasaktır</li>
                <li>Satış verilerinin doğruluğu kullanıcının sorumluluğundadır</li>
                <li>Trendyol API anahtarlarınızı başka kişilerle paylaşmayınız</li>
              </ul>
              <div className="mt-4 p-4 bg-muted rounded-md">
                <h3 className="text-lg font-medium text-primary mb-2">Önemli Bilgilendirme</h3>
                <p className="text-muted-foreground">
                  Platform, pazaryerleri ile yapılan entegrasyonlarda aracı konumundadır ve satış işlemlerinden doğrudan sorumlu değildir.
                </p>
              </div>
            </TermsSection>

            <TermsSection title="4. Ücretlendirme ve Ödeme Koşulları">
              <p className="text-muted-foreground">
                Hizmet kullanım bedelleri ve ödeme koşulları:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Aylık/yıllık abonelik ücretleri web sitesinde belirtilmiştir</li>
                <li>Ek API kullanım limitleri için ek ücret talep edilebilir</li>
                <li>Ödemeler kredi kartı veya havale/EFT ile yapılabilir</li>
                <li>Faturalar her ayın ilk günü elektronik olarak iletilir</li>
                <li>İptal durumunda ilgili ay için kısmi iade yapılmaz</li>
              </ul>
            </TermsSection>

            <TermsSection title="5. KVKK ve Veri Güvenliği">
              <p className="text-muted-foreground">
                6698 sayılı KVKK kapsamında veri işleme politikamız:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Kullanıcı verilerinin işlenme amacı ve kapsamı</li>
                <li>Pazaryeri entegrasyonlarında veri güvenliği</li>
                <li>Üçüncü taraf hizmet sağlayıcılarla veri paylaşımı</li>
                <li>Veri saklama ve silme politikaları</li>
              </ul>
              <div className="mt-4 p-4 bg-accent rounded-md">
                <h3 className="text-lg font-medium text-primary mb-2">Veri Güvenliği Taahhüdü</h3>
                <p className="text-muted-foreground">
                  Tüm veriler SSL şifreleme ile korunmakta ve düzenli olarak yedeklenmektedir. API anahtarları şifrelenmiş şekilde saklanır.
                </p>
              </div>
            </TermsSection>

            <TermsSection title="6. Hizmet Seviyesi Taahhüdü">
              <p className="text-muted-foreground">
                Platform hizmet kalitesi garantileri:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>%99.9 uptime garantisi</li>
                <li>Teknik destek yanıt süreleri (mesai saatleri içinde maksimum 4 saat)</li>
                <li>Pazaryeri API senkronizasyonu (her 1 saatte bir)</li>
                <li>Stok ve fiyat güncellemelerinde maksimum gecikme (15 dakika)</li>
              </ul>
            </TermsSection>

            <TermsSection title="7. Fikri Mülkiyet Hakları">
              <p className="text-muted-foreground">
                Platform ve sunulan hizmetlere ilişkin tüm haklar saklıdır.
              </p>
              <div className="mt-4 p-4 bg-muted rounded-md">
                <h3 className="text-lg font-medium text-primary mb-2">Lisans Bildirimi</h3>
                <p className="text-muted-foreground">
                  Platform kullanım hakkı, belirtilen şartlar dahilinde kullanıcılara lisanslanmıştır. Arayüz, kod ve içeriklerin izinsiz kullanımı ve kopyalanması yasaktır.
                </p>
              </div>
            </TermsSection>

            <TermsSection title="8. Uyuşmazlık Çözümü">
              <p className="text-muted-foreground">
                İşbu sözleşmeden doğan uyuşmazlıklarda Antalya Mahkemeleri ve İcra Daireleri yetkilidir.
              </p>
              <p className="text-muted-foreground mt-4">
                Anlaşmazlık durumunda:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Öncelikle destek ekibimizle iletişime geçilmelidir (support@saticiyiz.com)</li>
                <li>Teknik sorunlar için ticket sistemi kullanılmalıdır</li>
                <li>Hukuki süreçler için yasal departmanımız ile görüşülmelidir (legal@saticiyiz.com)</li>
              </ul>
            </TermsSection>
          </div>

          <div className="mt-8 text-center space-y-4">
            <p className="text-muted-foreground text-sm">
              Bu koşullar, platform kullanımının ayrılmaz bir parçasıdır ve kullanıcılar tarafından kabul edilmiş sayılır.
            </p>
            <p className="text-muted-foreground text-sm">
              Sorularınız için{' '}
              <a 
                href="/iletisim" 
                className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
                tabIndex="0"
              >
                iletişim sayfamızı
              </a>{' '}
              ziyaret edebilirsiniz.
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Terms; 