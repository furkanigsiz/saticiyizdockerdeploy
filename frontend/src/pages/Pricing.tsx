import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { PricingSection } from "../components/ui/pricing-section";
import { FaSignOutAlt } from 'react-icons/fa';

function Pricing() {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Ödeme sıklıkları
  const PAYMENT_FREQUENCIES = ["monthly", "yearly"];

  // Paketler
  const TIERS = [
    {
      id: "free",
      name: "7 Günlük Deneme",
      price: {
        monthly: "Ücretsiz",
        yearly: "Ücretsiz",
      },
      description: "Sistemi risk almadan deneyin",
      features: [
        "Tam erişim",
        "E-posta desteği",
        "7 günlük süre",
        "10 ürün izleme",
        "3 kullanıcıya kadar",
      ],
      cta: "Ücretsiz Deneyin",
    },
    {
      id: "pro",
      name: "Pro",
      price: {
        monthly: 79,
        yearly: 52,
      },
      description: "Küçük işletmeler için harika",
      features: [
        "Beş çalışma alanı",
        "E-posta desteği",
        "7 günlük veri saklama",
        "20 ürün izleme",
        "6 kullanıcıya kadar",
      ],
      cta: "Başlayın",
      popular: true,
    },
    {
      id: "business",
      name: "İşletme",
      price: {
        monthly: 149,
        yearly: 97,
      },
      description: "Büyük işletmeler için ideal",
      features: [
        "Sınırsız çalışma alanı",
        "E-posta desteği", 
        "30 günlük veri saklama",
        "50 ürün izleme",
        "10 kullanıcıya kadar",
      ],
      cta: "Başlayın",
    },
    {
      id: "enterprise",
      name: "Kurumsal",
      price: {
        monthly: "Özel",
        yearly: "Özel",
      },
      description: "Çoklu ekipler için",
      features: [
        "İşletme paketinin tüm özellikleri",
        "5 ekip üyesine kadar",
        "100 ürün izleme",
        "15 durum sayfası",
        "200+ entegrasyon",
      ],
      cta: "İletişime Geçin",
      highlighted: true,
    },
  ];

  useEffect(() => {
    // Eğer kullanıcı oturum açmamışsa, login sayfasına yönlendir
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Kullanıcı zaten aktif aboneliğe sahipse (trial değil) dashboard'a yönlendir
    if (user?.subscription_status === 'active') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const handleTierSelect = async (tierId: string) => {
    if (tierId === "free") {
      handleTrialSelect();
    } else if (tierId === "pro") {
      handleStandardSelect();
    } else if (tierId === "business") {
      handlePremiumSelect();
    } else if (tierId === "enterprise") {
      toast.info('Kurumsal paket için lütfen bizimle iletişime geçin.');
    }
  };

  const handleTrialSelect = async () => {
    // Eğer kullanıcı daha önce deneme hakkını kullanmışsa
    if (user?.has_used_trial) {
      toast.error('Deneme sürenizi daha önce kullandınız!');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/users/start-trial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Deneme süreci başlatılamadı');
      }

      // Kullanıcı bilgisini localStorage'da güncelle
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...currentUser,
        subscription_status: 'trial',
        has_used_trial: true,
        trial_start_date: new Date().toISOString(),
        trial_end_date: data.trial_end_date
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      toast.success('7 günlük deneme süreciniz başlatıldı!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePremiumSelect = () => {
    toast.info('Premium paket yakında aktif olacak. Şimdilik deneme sürümünü kullanabilirsiniz.');
  };

  const handleStandardSelect = () => {
    toast.info('Standart paket yakında aktif olacak. Şimdilik deneme sürümünü kullanabilirsiniz.');
  };

  // Deneme süresi bitmiş mi kontrol et
  const isTrialExpired = () => {
    if (user?.subscription_status === 'trial' && user?.trial_end_date) {
      const trialEndDate = new Date(user.trial_end_date);
      const now = new Date();
      if (now > trialEndDate) {
        return true;
      }
    }
    return false;
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const handleLogout = () => {
    toast.info('Çıkış yapılıyor...');
    logout();
  };

  return (
    <section className="bg-black text-white min-h-screen relative">
      {/* Çıkış Yap Butonu */}
      <div className="absolute top-4 right-4 z-10">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors duration-200"
        >
          <FaSignOutAlt />
          <span>Çıkış Yap</span>
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {isTrialExpired() && (
          <div className="pt-10">
            <div className="bg-red-900/20 border border-red-800 p-6 rounded-lg shadow-sm text-center mb-6">
              <h2 className="text-2xl font-semibold text-red-400 mb-3">Deneme Süreniz Sona Erdi</h2>
              <p className="text-gray-300 mb-4">
                7 günlük ücretsiz deneme süreniz sona erdi. Hizmetlerimize erişmeye devam etmek için lütfen bir abonelik planı seçin.
              </p>
              <p className="text-sm text-gray-400">
                Not: Ödeme sistemimiz yakında aktif olacaktır. Deneme süreniz sona erdiğinden sistemi kullanabilmek için abonelik almanız gerekmektedir.
              </p>
            </div>
          </div>
        )}

        <div className="relative flex justify-center items-center w-full mt-10">
          <div className="absolute inset-0 -z-10">
            <div className="h-full w-full bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:35px_35px] opacity-30 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
          </div>
          <PricingSection
            title="Basit Fiyatlandırma"
            subtitle="İhtiyaçlarınıza en uygun planı seçin"
            frequencies={PAYMENT_FREQUENCIES}
            tiers={TIERS}
            onSelectTier={handleTierSelect}
            hasUsedTrial={user?.has_used_trial}
          />
        </div>
      </div>
    </section>
  );
}

export default Pricing; 