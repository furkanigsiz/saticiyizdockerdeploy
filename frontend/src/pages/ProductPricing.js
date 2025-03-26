import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';
import { FaCalculator, FaInfoCircle, FaCaretUp, FaCaretDown, FaTags, FaMoneyBillWave, FaTruck, FaPercentage } from 'react-icons/fa';

const ProductPricing = () => {
  const [productCost, setProductCost] = useState('');
  const [profitType, setProfitType] = useState('percentage');
  const [profitValue, setProfitValue] = useState('');
  const [profitCalculationType, setProfitCalculationType] = useState('profitRate');
  const [shippingCost, setShippingCost] = useState('');
  const [vatRate, setVatRate] = useState('20');
  const [customVatRate, setCustomVatRate] = useState('');
  const [useCustomVatRate, setUseCustomVatRate] = useState(false);
  const [category, setCategory] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [calculationDetails, setCalculationDetails] = useState(null);
  const [animateResult, setAnimateResult] = useState(false);
  const [platformServiceFee, setPlatformServiceFee] = useState(6.99); // 2025 platform hizmet bedeli

  const vatRates = [
    { value: '20', label: '%20' },
    { value: '10', label: '%10' },
    { value: '1', label: '%1' },
    { value: '0', label: '%0' },
  ];

  const categories = [
    { id: 1, name: 'Altın (İşlenmemiş)', commission: 9.00, range: false },
    { id: 2, name: 'Aksesuar', commission: 21.50, range: true, maxCommission: 22.50, brandCommission: '14.50-18.50' },
    { id: 3, name: 'Ayakkabı Çanta', commission: 21.50, range: true, maxCommission: 23.50, brandCommission: '14.50-20.50' },
    { id: 4, name: 'Bahçe ve Yapı Market', commission: 11.00, range: true, maxCommission: 21.50, brandCommission: '11.00-13.00' },
    { id: 5, name: 'Çocuk', commission: 3.50, range: true, maxCommission: 18.00, brandCommission: '8.00-13.50' },
    { id: 6, name: 'Dijital Kod & Ürünleri', commission: 11.00, range: true, maxCommission: 18.00 },
    { id: 7, name: 'Elektronik', commission: 5.00, range: true, maxCommission: 28.00, brandCommission: '5.00-22.50' },
    { id: 8, name: 'Ev', commission: 11.00, range: true, maxCommission: 21.00, brandCommission: '19.00-20.00' },
    { id: 9, name: 'Giyim', commission: 21.50, range: false, brandCommission: '14.50-17.50' },
    { id: 10, name: 'Hobi & Eğlence', commission: 11.00, range: true, maxCommission: 20.50 },
    { id: 11, name: 'Kitap', commission: 14.00, range: true, maxCommission: 22.00 },
    { id: 12, name: 'Kırtasiye & Ofis Malzemeleri', commission: 8.50, range: true, maxCommission: 18.50, brandCommission: '18.00' },
    { id: 13, name: 'Kozmetik ve Kişisel Bakım', commission: 15.00, range: true, maxCommission: 18.00, brandCommission: '7.00-13.50' },
    { id: 14, name: 'Mobilya', commission: 19.00, range: true, maxCommission: 21.00 },
    { id: 15, name: 'Otomobil & Motosiklet', commission: 9.00, range: true, maxCommission: 20.00, brandCommission: '5.00-8.50' },
    { id: 16, name: 'Spor', commission: 10.00, range: true, maxCommission: 16.50, brandCommission: '8.00-13.00' },
    { id: 17, name: 'Süpermarket', commission: 12.00, range: true, maxCommission: 20.00, brandCommission: '5.00-15.50' },
    { id: 18, name: 'Anne & Bebek', commission: 8.00, range: true, maxCommission: 18.50, brandCommission: '8.00-13.50' },
    { id: 19, name: 'Beyaz Eşya', commission: 5.00, range: true, maxCommission: 15.00, brandCommission: '5.00-8.00' },
    { id: 20, name: 'Ev Tekstili', commission: 19.00, range: true, maxCommission: 21.50, brandCommission: '19.00-20.00' },
    { id: 21, name: 'Gıda', commission: 12.00, range: true, maxCommission: 20.00, brandCommission: '5.00-15.50' },
    { id: 22, name: 'İç Giyim', commission: 21.50, range: true, maxCommission: 23.50, brandCommission: '14.50-17.50' },
    { id: 23, name: 'Mücevher & Saat', commission: 9.00, range: true, maxCommission: 20.00, brandCommission: '9.00-15.00' },
    { id: 24, name: 'Outdoor', commission: 10.00, range: true, maxCommission: 16.50, brandCommission: '8.00-13.00' },
    { id: 25, name: 'Pet Shop', commission: 11.00, range: true, maxCommission: 20.50, brandCommission: '11.00-15.00' },
    { id: 26, name: 'Sağlık & Medikal', commission: 15.00, range: true, maxCommission: 18.00, brandCommission: '7.00-13.50' },
    { id: 27, name: 'Takı & Aksesuar', commission: 21.50, range: true, maxCommission: 22.50, brandCommission: '14.50-18.50' },
    { id: 28, name: 'Telefon & Aksesuarları', commission: 5.00, range: true, maxCommission: 28.00, brandCommission: '5.00-22.50' },
    { id: 29, name: 'Yapı Market', commission: 11.00, range: true, maxCommission: 21.50, brandCommission: '11.00-13.00' },
    { id: 30, name: 'Züccaciye', commission: 11.00, range: true, maxCommission: 21.00, brandCommission: '19.00-20.00' }
  ];

  const handleCategoryChange = (e) => {
    const selectedCategory = categories.find(cat => cat.name === e.target.value);
    setCategory(e.target.value);
    setCommissionRate(selectedCategory ? selectedCategory.commission.toString() : '');
  };

  const calculatePrice = () => {
    try {
      // Temel değerleri kontrol et
      if (!productCost || !commissionRate || !profitValue) {
        toast.warning('Lütfen gerekli tüm alanları doldurun');
        return;
      }

      // Değerleri sayıya çevir
      const cost = parseFloat(productCost) || 0;
      const profit = parseFloat(profitValue) || 0;
      const shipping = parseFloat(shippingCost) || 0;
      
      // KDV değerini belirle (özel veya standart)
      const vat = useCustomVatRate 
        ? (parseFloat(customVatRate) || 0) 
        : (parseFloat(vatRate) || 0);
      
      const commission = parseFloat(commissionRate) || 0;
      const platformFee = parseFloat(platformServiceFee) || 0; // Platform hizmet bedeli

      // Temel maliyet (ürün + kargo)
      const baseCost = cost + shipping;

      // KDV oranını 0-1 aralığına çevir
      const vatRateDecimal = vat / 100;
      
      // Ürün maliyetini KDV'siz değere çevirme (eğer KDV dahil geldiyse)
      const costWithoutVAT = vatRateDecimal > 0 ? cost / (1 + vatRateDecimal) : cost;
      const vatOnCost = cost - costWithoutVAT;

      // Kâr hesaplama
      let priceWithProfit;
      let profitAmount;
      
      if (profitType === 'percentage') {
        if (profitCalculationType === 'profitRate') {
          // Kar Oranı = (Kar / Maliyet) x 100
          // Satış Fiyatı = Maliyet x (1 + (Kar Oranı / 100))
          priceWithProfit = baseCost * (1 + (profit / 100));
          profitAmount = baseCost * (profit / 100);
        } else {
          // Kar Marjı = (Kar / Satış Fiyatı) x 100
          // Satış Fiyatı = Maliyet / (1 - (Kar Marjı / 100))
          // Sıfıra bölünmeyi önleyelim
          const profitRatio = profit / 100;
          priceWithProfit = profitRatio >= 1 ? baseCost * 100 : baseCost / (1 - profitRatio);
          profitAmount = priceWithProfit - baseCost;
        }
      } else {
        // Sabit tutar olarak kâr
        priceWithProfit = baseCost + profit;
        profitAmount = profit;
      }

      // KDV'siz fiyat hesaplaması
      const priceWithoutVAT = vatRateDecimal > 0 ? priceWithProfit / (1 + vatRateDecimal) : priceWithProfit;
      
      // Komisyon hesaplama (KDV'siz fiyat üzerinden)
      const commissionAmount = priceWithoutVAT * (commission / 100);
      const commissionVAT = commissionAmount * 0.18; // Komisyon KDV'si %18
      
      // Komisyonla birlikte fiyat (KDV'siz)
      const priceWithCommission = priceWithoutVAT + commissionAmount;
      
      // Platform hizmet bedeli (KDV hariç)
      const platformServiceVAT = platformFee * 0.18; // Platform hizmet bedeli KDV'si %18
      
      // KDV'li son fiyat
      // 1. Ürün KDV'si
      const vatOnPrice = priceWithoutVAT * vatRateDecimal;
      
      // 2. Toplam KDV
      const totalVAT = vatOnPrice;
      
      // 3. Son fiyat (KDV dahil)
      const finalPrice = priceWithCommission + totalVAT + platformFee + platformServiceVAT;

      // 4. Kargo desteği (150 TL ve üzeri siparişlerde)
      const shippingSupport = finalPrice >= 150 ? shipping : 0;
      
      // 5. Net kar
      const netProfit = priceWithoutVAT - costWithoutVAT - commissionAmount - (shipping - shippingSupport) - platformFee;

      // Sıfıra bölünme kontrolü yaparak oranları hesaplayalım
      const profitRate = baseCost > 0 ? (profitAmount / baseCost) * 100 : 0;
      const profitMargin = priceWithProfit > 0 ? (profitAmount / priceWithProfit) * 100 : 0;
      const netProfitRate = costWithoutVAT > 0 ? (netProfit / costWithoutVAT) * 100 : 0;
      const totalTax = finalPrice > 0 ? ((finalPrice - baseCost) / finalPrice) * 100 : 0;

      // Görselleştirme değerleri için sıfıra bölünme kontrolü
      const total = finalPrice || 1; // Sıfıra bölünmeyi önlemek için
      const costPercent = (baseCost / total) * 100;
      const profitPercent = (profitAmount / total) * 100;
      const commissionPercent = ((commissionAmount + commissionVAT) / total) * 100;
      const platformPercent = ((platformFee + platformServiceVAT) / total) * 100;
      const vatPercent = (totalVAT / total) * 100;

      // Detaylı hesaplama sonuçları
      const details = {
        baseCost: baseCost,
        baseCostWithoutVAT: costWithoutVAT,
        vatOnCost: vatOnCost,
        profitAmount: profitAmount,
        profitRate: profitRate,
        profitMargin: profitMargin,
        priceWithoutVAT: priceWithoutVAT,
        commissionAmount: commissionAmount,
        commissionVAT: commissionVAT,
        platformFee: platformFee,
        platformServiceVAT: platformServiceVAT,
        vatAmount: totalVAT,
        shippingSupport: shippingSupport,
        netProfit: netProfit,
        netProfitRate: netProfitRate,
        finalPrice: finalPrice,
        totalTax: totalTax,
        // Görselleştirme için oransal değerler
        breakdown: [
          { name: "Maliyet", value: costPercent, color: "bg-blue-500" },
          { name: "Kâr", value: profitPercent, color: "bg-green-500" },
          { name: "Komisyon", value: commissionPercent, color: "bg-red-500" },
          { name: "Platform Bedeli", value: platformPercent, color: "bg-yellow-500" },
          { name: "KDV", value: vatPercent, color: "bg-purple-500" }
        ]
      };

      setCalculationDetails(details);
      setAnimateResult(true);
      setTimeout(() => setAnimateResult(false), 1000);
    } catch (error) {
      toast.error('Hesaplama yapılırken bir hata oluştu');
    }
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) return '0,00 ₺';
    return price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
  };

  const formatPercentage = (value) => {
    if (value === undefined || value === null || isNaN(value)) return '%0,00';
    return `%${value.toFixed(2)}`.replace('.', ',');
  };

  // Bilgi kartlarını oluştur
  const InfoCard = ({ title, value, icon, color, subtext }) => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 transition-all duration-300 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className={`mt-1 text-xl font-semibold ${color}`}>{value}</p>
          {subtext && <p className="mt-1 text-xs text-gray-500">{subtext}</p>}
        </div>
        <div className={`p-2 rounded-full ${color.replace('text', 'bg').replace('-600', '-100')}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="p-4 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FaCalculator className="mr-2" />
            Ürün Fiyatlandırma Hesaplayıcı
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Yeni ürünler için detaylı fiyat ve kâr marjı hesaplama aracı
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Giriş Formu */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
              <div className="space-y-6">
                {/* Ürün Maliyeti ve İstenilen Kâr */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Ürün Maliyeti */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <FaMoneyBillWave className="mr-2 text-indigo-500" />
                      Ürün Maliyeti
                      <div className="group relative ml-2">
                        <FaInfoCircle className="text-gray-400 hover:text-gray-500" />
                        <div className="hidden group-hover:block absolute z-10 w-48 p-2 mt-1 text-xs bg-gray-900 text-white rounded shadow-lg">
                          Ürünün KDV dahil alış fiyatı
                        </div>
                      </div>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₺</span>
                      </div>
                      <input
                        type="number"
                        value={productCost}
                        onChange={(e) => setProductCost(e.target.value)}
                        className="block w-full pl-8 pr-4 py-3 text-gray-900 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* İstenilen Kâr */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <FaCaretUp className="mr-2 text-green-500" />
                      İstenilen Kâr
                      <div className="group relative ml-2">
                        <FaInfoCircle className="text-gray-400 hover:text-gray-500" />
                        <div className="hidden group-hover:block absolute z-10 w-48 p-2 mt-1 text-xs bg-gray-900 text-white rounded shadow-lg">
                          Yüzde, kar oranı, kar marjı veya sabit tutar olarak kâr miktarı
                        </div>
                      </div>
                    </label>
                    <div className="space-y-3">
                      {/* Kar Tipi Seçimi (Oran veya Tutar) - Toggle Buton Şeklinde */}
                      <div className="flex p-1 bg-gray-100 rounded-lg shadow-inner">
                        <button
                          type="button"
                          onClick={() => setProfitType('percentage')}
                          className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                            profitType === 'percentage'
                              ? 'bg-white text-green-700 shadow-sm'
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          Orana Göre
                        </button>
                        <button
                          type="button"
                          onClick={() => setProfitType('amount')}
                          className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                            profitType === 'amount'
                              ? 'bg-white text-green-700 shadow-sm'
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          Tutar (₺)
                        </button>
                      </div>

                      {/* Değer Girişi */}
                      <div className="relative">
                        <input
                          type="number"
                          value={profitValue}
                          onChange={(e) => setProfitValue(e.target.value)}
                          className="block w-full px-4 py-3 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                          placeholder={profitType === 'percentage' ? 'Örn: 25' : 'Örn: 100'}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">
                            {profitType === 'percentage' ? '%' : '₺'}
                          </span>
                        </div>
                      </div>

                      {/* Oran türü seçimi (sadece yüzde seçili ise) */}
                      {profitType === 'percentage' && (
                        <div className="grid grid-cols-2 gap-2">
                          <label
                            className={`flex items-center justify-center px-4 py-2 rounded-lg border ${
                              profitCalculationType === 'profitRate'
                                ? 'bg-green-50 border-green-500 text-green-700 font-medium shadow-sm'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            } cursor-pointer transition-colors duration-200`}
                          >
                            <input
                              type="radio"
                              value="profitRate"
                              checked={profitCalculationType === 'profitRate'}
                              onChange={(e) => setProfitCalculationType(e.target.value)}
                              className="sr-only"
                            />
                            <span className="text-sm">Kar Oranı (%)</span>
                          </label>
                          <label
                            className={`flex items-center justify-center px-4 py-2 rounded-lg border ${
                              profitCalculationType === 'profitMargin'
                                ? 'bg-green-50 border-green-500 text-green-700 font-medium shadow-sm'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            } cursor-pointer transition-colors duration-200`}
                          >
                            <input
                              type="radio"
                              value="profitMargin"
                              checked={profitCalculationType === 'profitMargin'}
                              onChange={(e) => setProfitCalculationType(e.target.value)}
                              className="sr-only"
                            />
                            <span className="text-sm">Kar Marjı (%)</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Kargo Ücreti */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaTruck className="mr-2 text-blue-500" />
                    Kargo Ücreti
                    <div className="group relative ml-2">
                      <FaInfoCircle className="text-gray-400 hover:text-gray-500" />
                      <div className="hidden group-hover:block absolute z-10 w-48 p-2 mt-1 text-xs bg-gray-900 text-white rounded shadow-lg">
                        Ürün başına düşen kargo maliyeti
                      </div>
                    </div>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">₺</span>
                    </div>
                    <input
                      type="number"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(e.target.value)}
                      className="block w-full pl-8 pr-4 py-3 text-gray-900 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* KDV */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaPercentage className="mr-2 text-purple-500" />
                    KDV
                  </label>
                  <div className="space-y-3">
                    {/* KDV Seçimi */}
                    {!useCustomVatRate ? (
                      <div className="grid grid-cols-4 gap-3">
                        {vatRates.map((rate) => (
                          <label
                            key={rate.value}
                            className={`flex items-center justify-center px-4 py-3 rounded-lg border ${
                              vatRate === rate.value
                                ? 'bg-purple-50 border-purple-300 text-purple-700 font-medium shadow-sm'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            } cursor-pointer transition-colors duration-200`}
                          >
                            <input
                              type="radio"
                              value={rate.value}
                              checked={vatRate === rate.value}
                              onChange={(e) => setVatRate(e.target.value)}
                              className="sr-only"
                            />
                            <span className="text-sm">{rate.label}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="number"
                          value={customVatRate}
                          onChange={(e) => setCustomVatRate(e.target.value)}
                          className="block w-full pr-12 pl-4 py-3 rounded-lg text-gray-900 border-purple-300 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Özel KDV Oranı"
                          min="0"
                          max="100"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">%</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Özel KDV Değeri Seçim Toggle */}
                    <div className="flex items-center">
                      <button 
                        type="button" 
                        onClick={() => setUseCustomVatRate(!useCustomVatRate)}
                        className="text-sm text-purple-600 hover:text-purple-800 focus:outline-none underline"
                      >
                        {useCustomVatRate ? "Standart KDV oranlarını kullan" : "Özel KDV oranı gir"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Kategori */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaTags className="mr-2 text-yellow-500" />
                    Kategori
                  </label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={handleCategoryChange}
                      className="block w-full pl-3 pr-10 py-3 text-gray-900 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
                    >
                      <option value="">Kategori Seçin</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name} (Komisyon: {cat.range ? `%${cat.commission}-${cat.maxCommission}` : `%${cat.commission}`}
                          {cat.brandCommission ? ` | Marka: %${cat.brandCommission}` : ''})
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Komisyon Oranı */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaCaretDown className="mr-2 text-red-500" />
                    Komisyon Oranı
                    <div className="group relative ml-2">
                      <FaInfoCircle className="text-gray-400 hover:text-gray-500" />
                      <div className="hidden group-hover:block absolute z-10 w-48 p-2 mt-1 text-xs bg-gray-900 text-white rounded shadow-lg">
                        Platform komisyon oranı
                      </div>
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(e.target.value)}
                      className="block w-full pr-12 pl-4 py-3 text-gray-900 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Özel komisyon oranı"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </div>

                {/* Hesapla Butonu */}
                <div className="pt-4">
                  <button
                    onClick={calculatePrice}
                    className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:-translate-y-1"
                  >
                    <FaCalculator className="mr-2" />
                    Fiyat Hesapla
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sonuç Paneli */}
          <div className="lg:col-span-1">
            {calculationDetails ? (
              <div className={`bg-white shadow rounded-lg overflow-hidden sticky top-4 border border-gray-100 transition-transform duration-500 ${animateResult ? 'transform scale-105' : ''}`}>
                <div className="p-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                  <h3 className="text-lg font-medium opacity-90">Hesaplanan Satış Fiyatı</h3>
                  <p className="mt-2 text-3xl font-bold">
                    {formatPrice(calculationDetails.finalPrice)}
                  </p>
                  <p className="text-sm mt-1 opacity-75">
                    KDV Hariç: {formatPrice(calculationDetails.priceWithoutVAT)}
                  </p>
                </div>

                {/* Görsel Fiyat Kırılımı */}
                <div className="px-6 py-4">
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Fiyat Kırılımı</h4>
                  <div className="w-full h-6 rounded-full overflow-hidden bg-gray-200">
                    {calculationDetails.breakdown.map((item, index) => (
                      <div 
                        key={index}
                        style={{ width: `${item.value}%` }} 
                        className={`h-full ${item.color} inline-block`}
                        title={`${item.name}: ${item.value.toFixed(1)}%`}
                      ></div>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {calculationDetails.breakdown.map((item, index) => (
                      <div key={index} className="flex items-center text-xs">
                        <div className={`w-3 h-3 rounded-full mr-1 ${item.color}`}></div>
                        <span>{item.name}: {item.value.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InfoCard 
                      title="Temel Maliyet" 
                      value={formatPrice(calculationDetails.baseCost)} 
                      icon={<FaMoneyBillWave className="text-blue-500" />} 
                      color="text-blue-600"
                      subtext={`KDV Hariç: ${formatPrice(calculationDetails.baseCostWithoutVAT)}`}
                    />
                    <InfoCard 
                      title="Kâr Tutarı" 
                      value={formatPrice(calculationDetails.profitAmount)} 
                      icon={<FaCaretUp className="text-green-500" />} 
                      color="text-green-600"
                      subtext={`Net Kâr: ${formatPrice(calculationDetails.netProfit)}`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <InfoCard 
                      title="Komisyon Tutarı" 
                      value={formatPrice(calculationDetails.commissionAmount)} 
                      icon={<FaCaretDown className="text-red-500" />} 
                      color="text-red-600"
                      subtext={`KDV Dahil: ${formatPrice(calculationDetails.commissionAmount + calculationDetails.commissionVAT)}`}
                    />
                    <InfoCard 
                      title="Platform Hizmet Bedeli" 
                      value={formatPrice(calculationDetails.platformFee)} 
                      icon={<FaTags className="text-yellow-500" />} 
                      color="text-yellow-600"
                      subtext={`KDV Dahil: ${formatPrice(calculationDetails.platformFee + calculationDetails.platformServiceVAT)}`}
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Oransal Detaylar</h4>
                    <div className="mt-3 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Kâr Oranı</span>
                        <span className="text-sm font-medium text-green-600">{formatPercentage(calculationDetails.profitRate)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Kâr Marjı</span>
                        <span className="text-sm font-medium text-green-600">{formatPercentage(calculationDetails.profitMargin)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Net Kâr Oranı</span>
                        <span className="text-sm font-medium text-blue-600">{formatPercentage(calculationDetails.netProfitRate)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Kargo Desteği</span>
                        <span className="text-sm font-medium text-blue-600">{formatPrice(calculationDetails.shippingSupport)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">KDV Tutarı</span>
                        <span className="text-sm font-medium text-purple-600">{formatPrice(calculationDetails.vatAmount)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 text-xs text-gray-500">
                    <p className="mb-1">* Kar oranı, karın maliyete oranıdır (Kar/Maliyet)</p>
                    <p className="mb-1">* Kar marjı, karın satış fiyatına oranıdır (Kar/Satış Fiyatı)</p>
                    <p>* Hesaplamalar Trendyol 2025 tarifelerine göre yapılmıştır</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100 p-8 flex flex-col items-center justify-center text-center h-full">
                <FaCalculator className="text-5xl text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-400">Hesaplama Yapılmadı</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Hesaplama yapmak için gerekli alanları doldurun ve "Fiyat Hesapla" butonuna tıklayın.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductPricing; 