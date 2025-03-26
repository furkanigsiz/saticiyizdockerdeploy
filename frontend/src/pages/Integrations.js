import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { FaPlug, FaShoppingCart, FaTruck, FaCalculator, FaCreditCard, FaGoogle, FaEnvelope } from 'react-icons/fa';
import { toast } from 'react-toastify';

const IntegrationCard = ({ title, description, icon: Icon, connected, onConnect, onDisconnect, additionalInfo }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${connected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>
        </div>
        <button
          onClick={connected ? onDisconnect : onConnect}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            connected
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
          }`}
        >
          {connected ? 'Bağlantıyı Kes' : 'Bağlan'}
        </button>
      </div>
      {connected && additionalInfo && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            {additionalInfo}
          </div>
        </div>
      )}
    </div>
  );
};

const Integrations = () => {
  const [integrations, setIntegrations] = useState({
    marketplaces: [
      { id: 1, title: 'Trendyol', description: 'Trendyol mağaza entegrasyonu', connected: true },
      { id: 2, title: 'HepsiBurada', description: 'HepsiBurada mağaza entegrasyonu', connected: false },
      { id: 3, title: 'Amazon', description: 'Amazon mağaza entegrasyonu', connected: false },
      { id: 4, title: 'N11', description: 'N11 mağaza entegrasyonu', connected: false },
    ],
    shipping: [
      { id: 1, title: 'Yurtiçi Kargo', description: 'Yurtiçi Kargo entegrasyonu', connected: false },
      { id: 2, title: 'Aras Kargo', description: 'Aras Kargo entegrasyonu', connected: false },
      { id: 3, title: 'MNG Kargo', description: 'MNG Kargo entegrasyonu', connected: false },
      { id: 4, title: 'PTT Kargo', description: 'PTT Kargo entegrasyonu', connected: false },
    ],
    accounting: [
      { id: 1, title: 'Paraşüt', description: 'Paraşüt muhasebe yazılımı entegrasyonu', connected: false },
      { id: 2, title: 'Logo', description: 'Logo muhasebe yazılımı entegrasyonu', connected: false },
      { id: 3, title: 'Mikro', description: 'Mikro muhasebe yazılımı entegrasyonu', connected: false },
    ],
    payment: [
      { id: 1, title: 'iyzico', description: 'iyzico ödeme sistemi entegrasyonu', connected: false },
      { id: 2, title: 'PayTR', description: 'PayTR ödeme sistemi entegrasyonu', connected: false },
    ],
    google: { connected: false, spreadsheetId: null },
    email: { connected: false }
  });

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailData, setEmailData] = useState({
    email: '',
    password: '',
    host: '',
    port: '',
    secure: true
  });

  const [emailLoading, setEmailLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(true);

  useEffect(() => {
    fetchIntegrationStatus();

    // URL parametrelerini kontrol et
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const success = urlParams.get('success');

    if (error) {
      toast.error(decodeURIComponent(error));
    } else if (success) {
      toast.success('Google hesabı başarıyla bağlandı');
      fetchIntegrationStatus(); // Durumu güncelle
    }
  }, []);

  const fetchIntegrationStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }

      console.log('Entegrasyon durumu alınıyor...');
      const response = await fetch('http://localhost:5000/api/integrations/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('API Hata detayı:', data);
        throw new Error(data.message || 'Entegrasyon durumu alınamadı');
      }

      console.log('Alınan entegrasyon durumu:', data);
      if (data.integrations) {
        setIntegrations(prev => ({
          ...prev,
          ...data.integrations
        }));
      } else {
        console.warn('Entegrasyon verisi bulunamadı:', data);
      }
    } catch (error) {
      console.error('Entegrasyon durumu hatası:', error);
      toast.error(error.message || 'Entegrasyon durumu kontrol edilirken bir hata oluştu');
    }
  };

  const handleConnect = (section, id) => {
    setIntegrations(prev => ({
      ...prev,
      [section]: prev[section].map(item =>
        item.id === id ? { ...item, connected: !item.connected } : item
      ),
    }));
  };

  const handleGoogleAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        toast.error('Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
        return;
    }
    
    try {
      console.log('Google yetkilendirme başlatılıyor...');
      
      // Önce backend'den auth URL'ini alalım
      const response = await fetch('http://localhost:5000/api/integrations/google/auth-url', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Google yetkilendirme URL\'i alınamadı');
      }
      
      const data = await response.json();
      console.log('Auth URL alındı:', data.authUrl);
      
      // Alınan URL'e yönlendirelim
      window.location.href = data.authUrl; // Yeni sekmede açmak yerine doğrudan yönlendir
    } catch (error) {
      console.error('Google yetkilendirme hatası:', error);
      toast.error(error.message || 'Google hesabı bağlanırken bir hata oluştu');
    }
  };

  const handleEmailConnect = async () => {
    try {
        setEmailModalOpen(true);
    } catch (error) {
        console.error('E-posta bağlantı hatası:', error);
        toast.error(error.message || 'E-posta hesabı bağlanırken bir hata oluştu');
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/integrations/email/connect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: emailData.email,
          password: emailData.password,
          host: emailData.host,
          port: emailData.port,
          secure: emailData.secure
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'E-posta hesabı bağlanırken bir hata oluştu');
      }

      toast.success('E-posta hesabı başarıyla bağlandı');
      setShowEmailForm(false);
      fetchIntegrationStatus();
    } catch (error) {
      console.error('E-posta bağlantı hatası:', error);
      toast.error(error.message);
    } finally {
      setEmailLoading(false);
    }
  };

  // Gmail için önerilen ayarları doldur
  const fillGmailSettings = () => {
    setEmailData({
      ...emailData,
      host: 'smtp.gmail.com',
      port: '587',
      secure: false
    });
    toast.info('Gmail için önerilen ayarlar dolduruldu. Lütfen e-posta ve şifre bilgilerinizi girin.');
  };

  // Outlook için önerilen ayarları doldur
  const fillOutlookSettings = () => {
    setEmailData({
      ...emailData,
      host: 'smtp.office365.com',
      port: '587',
      secure: false
    });
    toast.info('Outlook için önerilen ayarlar dolduruldu. Lütfen e-posta ve şifre bilgilerinizi girin.');
  };

  // Yahoo için önerilen ayarları doldur
  const fillYahooSettings = () => {
    setEmailData({
      ...emailData,
      host: 'smtp.mail.yahoo.com',
      port: '587',
      secure: false
    });
    toast.info('Yahoo için önerilen ayarlar dolduruldu. Lütfen e-posta ve şifre bilgilerinizi girin.');
  };

  const handleGoogleDisconnect = async () => {
    // Google bağlantısını kes
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/integrations/disconnect/google', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Google hesabı bağlantısı kesilemedi');
      }

      toast.success('Google hesabı bağlantısı kesildi');
      fetchIntegrationStatus();
    } catch (error) {
      console.error('Google bağlantı kesme hatası:', error);
      toast.error('Google hesabı bağlantısı kesilirken bir hata oluştu');
    }
  };

  const handleEmailDisconnect = async () => {
    // Email bağlantısını kes
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/integrations/disconnect/email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Email hesabı bağlantısı kesilemedi');
      }

      toast.success('Email hesabı bağlantısı kesildi');
      fetchIntegrationStatus();
    } catch (error) {
      console.error('Email bağlantı kesme hatası:', error);
      toast.error('Email hesabı bağlantısı kesilirken bir hata oluştu');
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Entegrasyonlar</h1>
        
        {/* Entegrasyon Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <IntegrationCard
            title="Google Sheets"
            description="Ürün verilerinizi Google Sheets'e aktarın ve analiz edin."
            icon={FaGoogle}
            connected={integrations.google.connected}
            onConnect={handleGoogleAuth}
            onDisconnect={handleGoogleDisconnect}
            additionalInfo={
              integrations.google.connected && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>Spreadsheet ID: {integrations.google.spreadsheetId}</p>
                </div>
              )
            }
          />
          
          <IntegrationCard
            title="E-posta"
            description="Ürün raporlarını e-posta olarak gönderin."
            icon={FaEnvelope}
            connected={integrations.email.connected}
            onConnect={handleEmailConnect}
            onDisconnect={handleEmailDisconnect}
            additionalInfo={
              integrations.email.connected && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>E-posta: {integrations.email.email}</p>
                </div>
              )
            }
          />
        </div>
        
        {/* E-posta Modal */}
        {emailModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">E-posta Hesabı Bağla</h2>
              
              {/* Hızlı Ayarlar */}
              <div className="mb-4 bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700 mb-2">Popüler e-posta servisleri için hızlı ayarlar:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={fillGmailSettings}
                    className="px-3 py-1 text-xs bg-white border border-blue-300 rounded-md hover:bg-blue-100"
                  >
                    Gmail
                  </button>
                  <button
                    type="button"
                    onClick={fillOutlookSettings}
                    className="px-3 py-1 text-xs bg-white border border-blue-300 rounded-md hover:bg-blue-100"
                  >
                    Outlook
                  </button>
                  <button
                    type="button"
                    onClick={fillYahooSettings}
                    className="px-3 py-1 text-xs bg-white border border-blue-300 rounded-md hover:bg-blue-100"
                  >
                    Yahoo
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleEmailSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-posta Adresi
                  </label>
                  <input
                    type="email"
                    value={emailData.email}
                    onChange={(e) => setEmailData({...emailData, email: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Şifre / Uygulama Şifresi
                  </label>
                  <input
                    type="password"
                    value={emailData.password}
                    onChange={(e) => setEmailData({...emailData, password: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Gmail için "Uygulama Şifresi" oluşturmanız gerekebilir. 
                    <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                      Nasıl yapılır?
                    </a>
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Sunucu
                  </label>
                  <input
                    type="text"
                    value={emailData.host}
                    onChange={(e) => setEmailData({...emailData, host: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    placeholder="örn: smtp.gmail.com"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Port
                  </label>
                  <input
                    type="text"
                    value={emailData.port}
                    onChange={(e) => setEmailData({...emailData, port: e.target.value})}
                    className="w-full p-2 border rounded-md"
                    placeholder="örn: 587"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Önerilen: SSL kapalıyken 587, SSL açıkken 465
                  </p>
                </div>
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={emailData.secure}
                      onChange={(e) => setEmailData({...emailData, secure: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">SSL Kullan</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    Bağlantı sorunu yaşarsanız bu seçeneği değiştirmeyi deneyin
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setEmailModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={emailLoading}
                  >
                    {emailLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Bağlanıyor...
                      </span>
                    ) : 'Bağlan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Bilgi Kartı */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-blue-800 mb-2">Entegrasyonlar Hakkında</h3>
          <p className="text-sm text-blue-700">
            Google Sheets entegrasyonu ile ürün verilerinizi otomatik olarak Google Sheets'e aktarabilir ve analiz edebilirsiniz.
            E-posta entegrasyonu ile ürün raporlarını belirttiğiniz e-posta adresine gönderebilirsiniz.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Integrations; 