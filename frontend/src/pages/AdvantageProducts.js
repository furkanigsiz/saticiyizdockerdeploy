import React, { useState, useEffect } from 'react';
import { FaDownload, FaUpload, FaSync, FaTag, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const AdvantageProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState({});
  const [originalExcelData, setOriginalExcelData] = useState(null);
  const [selectedPrices, setSelectedPrices] = useState({});
  const [applyUntilEnd, setApplyUntilEnd] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const navigate = useNavigate();

  // Kar/zarar hesaplama fonksiyonu
  const calculateProfit = (product, selectedPrice) => {
    const salePrice = selectedPrice || 0;
    const originalPrice = parseFloat(product.original_price) || (salePrice * 0.7);
    const commissionRate = parseFloat(product.current_commission) || 21;
    const vatRate = 18;
    const platformServiceFee = 6.99;
    
    // Kargo ücreti hesaplama
    const dimensionalWeight = product.dimensional_weight || 1;
    let shippingCost = 0;
    
    // Desi bazlı kargo ücreti hesaplama (2025 güncel değerler)
    if (dimensionalWeight <= 1) {
      shippingCost = 35.99;
    } else if (dimensionalWeight <= 2) {
      shippingCost = 39.99;
    } else if (dimensionalWeight <= 3) {
      shippingCost = 43.99;
    } else if (dimensionalWeight <= 4) {
      shippingCost = 47.99;
    } else if (dimensionalWeight <= 5) {
      shippingCost = 51.99;
    } else if (dimensionalWeight <= 6) {
      shippingCost = 55.99;
    } else if (dimensionalWeight <= 7) {
      shippingCost = 59.99;
    } else if (dimensionalWeight <= 8) {
      shippingCost = 63.99;
    } else if (dimensionalWeight <= 9) {
      shippingCost = 67.99;
    } else if (dimensionalWeight <= 10) {
      shippingCost = 71.99;
    } else if (dimensionalWeight <= 15) {
      shippingCost = 93.99;
    } else if (dimensionalWeight <= 20) {
      shippingCost = 123.99;
    } else if (dimensionalWeight <= 25) {
      shippingCost = 153.99;
    } else if (dimensionalWeight <= 30) {
      shippingCost = 173.99;
    } else {
      shippingCost = 209.99;
    }
    
    // Kargo desteği (150 TL üzeri siparişlerde)
    const shippingSupport = salePrice >= 150 ? shippingCost : 0;
    
    // KDV hesaplamaları
    const salePriceWithoutVAT = salePrice / (1 + (vatRate / 100));
    const saleVAT = salePrice - salePriceWithoutVAT;
    
    const originalPriceWithoutVAT = originalPrice / (1 + (vatRate / 100));
    const costVAT = originalPrice - originalPriceWithoutVAT;
    
    const commissionAmount = (salePriceWithoutVAT * commissionRate) / 100;
    const commissionVAT = (commissionAmount * 18) / 100;
    
    const shippingVAT = (shippingCost * 18) / 100;
    const platformServiceVAT = (platformServiceFee * 18) / 100;
    
    const netVAT = saleVAT - costVAT - commissionVAT - shippingVAT - platformServiceVAT;
    
    // Kar hesaplama
    const profit = Math.round((salePrice - originalPrice - commissionAmount - shippingCost + shippingSupport - platformServiceFee - netVAT) * 100) / 100;
    
    return {
      profit,
      isProfitable: profit > 0
    };
  };

  // Ürünleri getir
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/trendyol/advantage-products', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Avantajlı ürünler yüklenirken bir hata oluştu');
      }

      if (data.products) {
        // Ürünlere avantaj etiketlerini ekle
        const productsWithLabels = data.products.map(product => {
          // Avantaj etiketi belirleme
          let advantageLabel = '';
          if (product.price_3_lower > 0 && product.price_4_upper > 0) {
            advantageLabel = 'Süper Fiyat';
          } else if (product.price_2_lower > 0 && product.price_3_upper > 0) {
            advantageLabel = 'Çok Avantajlı';
          } else if (product.price_2_lower > 0 && product.price_2_upper > 0) {
            advantageLabel = 'Avantajlı';
          }

          return {
            ...product,
            advantage_label: advantageLabel || product.advantage_label
          };
        });
        
        setProducts(productsWithLabels);
      }
    } catch (error) {
      console.error('Avantajlı ürün yükleme hatası:', error);
      toast.error(error.message || 'Avantajlı ürünler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPrice = (productId, price) => {
    setSelectedPrices(prev => ({
      ...prev,
      [productId]: price
    }));
    // Fiyat seçildiğinde otomatik olarak "Tarife Sonuna Kadar Uygula" seçeneğini evet yap
    setApplyUntilEnd(prev => ({
      ...prev,
      [productId]: true
    }));
  };

  const handleExportExcel = () => {
    try {
      // Orijinal Excel verisi yoksa standart dışa aktarma yap
      if (!originalExcelData) {
        // Excel için veriyi hazırla
        const excelData = products.map(product => ({
          'ÜRÜN İSMİ': product.title || '',
          'BARKOD': product.barcode || '',
          'SATICI STOK KODU': product.stock_code || '',
          'BEDEN': product.size || '',
          'MODEL KODU': product.product_code || '',
          'KATEGORİ': product.category || '',
          'MARKA': product.brand || '',
          'STOK': product.quantity || 0,
          '2.Fiyat Üst Limiti': product.price_2_upper || 0,
          '2.Fiyat Alt Limit': product.price_2_lower || 0,
          '3.Fiyat Üst Limiti': product.price_3_upper || 0,
          '3.Fiyat Alt Limit': product.price_3_lower || 0,
          '4.Fiyat Üst Limiti': product.price_4_upper || 0,
          '1.KOMİSYON': product.commission_1 || 0,
          '2.KOMİSYON': product.commission_2 || 0,
          '3.KOMİSYON': product.commission_3 || 0,
          '4.KOMİSYON': product.commission_4 || 0,
          'KOMİSYONA ESAS FİYAT': product.commission_base || 0,
          'GÜNCEL KOMİSYON': product.current_commission || 0,
          'GÜNCEL TSF': product.current_tsf || product.sale_price || 0,
          'YENİ TSF (FİYAT GÜNCELLE)': selectedPrices[product.id] || 0,
          'Hesaplanan Komisyon': product.calculated_commission || 0,
          'Tarife Sonuna Kadar Uygula': applyUntilEnd[product.id] ? 'Evet' : 'Hayır'
        }));

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Avantajlı Ürünler');

        // Sütun genişliklerini ayarla
        const colWidths = [
          { wch: 40 }, // ÜRÜN İSMİ
          { wch: 15 }, // BARKOD
          { wch: 15 }, // SATICI STOK KODU
          { wch: 10 }, // BEDEN
          { wch: 15 }, // MODEL KODU
          { wch: 20 }, // KATEGORİ
          { wch: 15 }, // MARKA
          { wch: 10 }, // STOK
          { wch: 15 }, // 2.Fiyat Üst Limiti
          { wch: 15 }, // 2.Fiyat Alt Limit
          { wch: 15 }, // 3.Fiyat Üst Limiti
          { wch: 15 }, // 3.Fiyat Alt Limit
          { wch: 15 }, // 4.Fiyat Üst Limiti
          { wch: 15 }, // 1.KOMİSYON
          { wch: 15 }, // 2.KOMİSYON
          { wch: 15 }, // 3.KOMİSYON
          { wch: 15 }, // 4.KOMİSYON
          { wch: 20 }, // KOMİSYONA ESAS FİYAT
          { wch: 15 }, // GÜNCEL KOMİSYON
          { wch: 15 }, // GÜNCEL TSF
          { wch: 20 }, // YENİ TSF (FİYAT GÜNCELLE)
          { wch: 20 }, // Hesaplanan Komisyon
          { wch: 20 }  // Tarife Sonuna Kadar Uygula
        ];

        ws['!cols'] = colWidths;

        // Dosya adını oluştur
        const fileName = `Avantajli_Urunler_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        XLSX.writeFile(wb, fileName);
        toast.success('Excel dosyası başarıyla indirildi.');
        return;
      }
      
      // Orijinal Excel verisini kullanıcı seçimleriyle güncelle
      const updatedExcelData = originalExcelData.map(row => {
        // Barkod eşleşmesine göre ürünü bul
        const matchedProduct = products.find(p => {
          const rowBarkod = row['BARKOD'] || '';
          const productBarkod = p.barcode || '';
          return rowBarkod === productBarkod;
        });

        if (matchedProduct && selectedPrices[matchedProduct.id]) {
          return {
            ...row,
            'YENİ TSF (FİYAT GÜNCELLE)': selectedPrices[matchedProduct.id],
            'Tarife Sonuna Kadar Uygula': 'Evet'
          };
        }
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(updatedExcelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Avantajlı Ürünler');
      
      // Dosya adını oluştur
      const fileName = `Avantajli_Urunler_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      XLSX.writeFile(wb, fileName);
      toast.success('Excel dosyası başarıyla indirildi.');
    } catch (error) {
      toast.error('Excel dosyası oluşturulurken bir hata oluştu.');
      console.error('Excel oluşturma hatası:', error);
    }
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    setUploading(true);

    reader.onload = async (event) => {
      try {
        // Excel veri tipi kontrolü
        let excelData;
        let workbook;
        
        try {
          // İlk olarak binary string olarak okumayı dene
          excelData = event.target.result;
          workbook = XLSX.read(excelData, { type: 'binary', WTF: true });
        } catch (binaryError) {
          console.warn('Binary olarak okuma hatası, arraybuffer olarak deneniyor:', binaryError);
          
          // Eğer binary okuma başarısız olursa ArrayBuffer'a çevir ve tekrar dene
          try {
            // ArrayBuffer'a çevir
            const arrayBuffer = new Uint8Array(event.target.result).buffer;
            workbook = XLSX.read(arrayBuffer, { type: 'array', WTF: true });
          } catch (arrayError) {
            console.error('ArrayBuffer olarak okuma hatası:', arrayError);
            throw new Error('Excel dosyası okunurken bir hata oluştu. Dosya formatını kontrol edin.');
          }
        }
        
        if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('Excel dosyası geçerli sayfalar içermiyor.');
        }
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Sheet_to_json options ile daha güvenli hale getir
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          defval: "", 
          raw: false,
          dateNF: 'yyyy-mm-dd'
        });

        if (jsonData.length === 0) {
          throw new Error('Excel dosyasında veri bulunamadı.');
        }

        // Orijinal Excel verisini sakla
        setOriginalExcelData(jsonData);
        
        // Excel verilerini kontrol et - sütun isimlerini görmek için
        console.log('Orijinal Excel verisi (ilk satır):', jsonData[0]);
        console.log('Excel sütun isimleri:', Object.keys(jsonData[0]));
        console.log('Toplam Excel veri sayısı:', jsonData.length);

        // Veri doğrulama ve temizleme
        const cleanedData = jsonData.map((row, index) => {
          // Tüm alanları string'e çevir ve boş değerleri temizle
          const cleanedRow = {};
          Object.keys(row).forEach(key => {
            cleanedRow[key] = row[key] !== null && row[key] !== undefined ? String(row[key]) : '';
          });
          
          // Normal fiyat (1.Fiyat Alt Limit) kaldırıldı - sadece avantajlı fiyatları tutuyoruz
          const normalPrice = parseFloat(cleanedRow['Normal Fiyat'] || cleanedRow['GÜNCEL TSF'] || '0');
          const advantagePrice = parseFloat(cleanedRow['Avantajlı Fiyat'] || cleanedRow['YENİ TSF (FİYAT GÜNCELLE)'] || '0');
          
          // Avantaj tipini belirle
          let advantageLabel = cleanedRow['Avantaj Türü'] || '';
          let price_2_upper = 0, price_2_lower = 0, price_3_upper = 0, price_3_lower = 0, price_4_upper = 0;
          
          // Fiyat aralıkları (şimdilik Excel'den gelene göre belirle, yoksa tahmin et)
          price_2_upper = parseFloat(cleanedRow['2.Fiyat Üst Limiti'] || normalPrice * 0.95 || 0);
          price_2_lower = parseFloat(cleanedRow['2.Fiyat Alt Limit'] || normalPrice * 0.9 || 0);
          price_3_upper = parseFloat(cleanedRow['3.Fiyat Üst Limiti'] || normalPrice * 0.85 || 0);
          price_3_lower = parseFloat(cleanedRow['3.Fiyat Alt Limit'] || normalPrice * 0.8 || 0);
          price_4_upper = parseFloat(cleanedRow['4.Fiyat Üst Limiti'] || normalPrice * 0.75 || 0);
          
          // Avantaj türüne göre avantaj fiyatını belirle
          if (advantageLabel.includes('Süper') || advantageLabel.includes('Super')) {
            // Süper fiyatsa, süper fiyat üst limitini ayarla
            price_4_upper = advantagePrice;
          } else if (advantageLabel.includes('Çok') || advantageLabel.includes('Cok')) {
            // Çok avantajlıysa, çok avantajlı alt limitini ayarla
            price_3_lower = advantagePrice;
          } else {
            // Normal avantajlıysa, avantajlı alt limitini ayarla
            price_2_lower = advantagePrice;
          }
          
          // Fiyat aralıklarının tutarlı olmasını sağla
          if (price_4_upper > price_3_lower) price_3_lower = price_4_upper;
          if (price_3_upper < price_3_lower) price_3_upper = price_3_lower * 1.05;
          if (price_3_upper > price_2_lower) price_2_lower = price_3_upper;
          if (price_2_upper < price_2_lower) price_2_upper = price_2_lower * 1.05;
          
          // Komisyon oranı
          const commissionRate = parseFloat(cleanedRow['Komisyon Oranı'] || cleanedRow['GÜNCEL KOMİSYON'] || 
                                        cleanedRow['1.KOMİSYON'] || '21');
          const commission_1 = parseFloat(cleanedRow['1.KOMİSYON'] || commissionRate || 21);
          const commission_2 = parseFloat(cleanedRow['2.KOMİSYON'] || commission_1 - 1 || 20);
          const commission_3 = parseFloat(cleanedRow['3.KOMİSYON'] || commission_2 - 1 || 19);
          
          // Benzersiz ID oluştur
          const uniqueId = `tmp_${Date.now()}_${index}`;
          
          return {
            id: uniqueId, // Geçici ID oluştur
            barcode: cleanedRow['Barkod'] || cleanedRow['BARKOD'] || '',
            title: cleanedRow['Ürün Adı'] || cleanedRow['ÜRÜN İSMİ'] || '',
            brand: cleanedRow['Marka'] || cleanedRow['MARKA'] || '',
            category: cleanedRow['Kategori'] || cleanedRow['KATEGORİ'] || '',
            stock_code: cleanedRow['Stok Kodu'] || cleanedRow['SATICI STOK KODU'] || '',
            product_code: cleanedRow['Model Kodu'] || cleanedRow['MODEL KODU'] || '',
            quantity: parseInt(cleanedRow['Stok'] || cleanedRow['STOK'] || '0'),
            sale_price: normalPrice,
            original_price: normalPrice * 0.7, // Tahmini maliyet
            current_price: normalPrice,
            advantage_price: advantagePrice,
            dimensional_weight: parseFloat(cleanedRow['Desi'] || '1'),
            current_commission: commissionRate,
            commission_1: commission_1,
            commission_2: commission_2,
            commission_3: commission_3,
            price_2_upper: price_2_upper,
            price_2_lower: price_2_lower,
            price_3_upper: price_3_upper,
            price_3_lower: price_3_lower,
            price_4_upper: price_4_upper,
            advantage_label: advantageLabel,
            advantage_type: advantageLabel,
            start_date: cleanedRow['Başlangıç Tarihi'] || new Date().toISOString().split('T')[0],
            end_date: cleanedRow['Bitiş Tarihi'] || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
          };
        });

        console.log('Excel verilerini işleniyor:', cleanedData.length, 'ürün');
        console.log('İlk temizlenmiş ürün:', cleanedData[0]);
        
        // Excel verilerini doğrudan state'e ayarla (mevcut ürünleri sil)
        setProducts(cleanedData);
        
        // Sayfalamayı sıfırla - böylece yeni yüklenen ürünlerin ilk sayfası görüntülenir
        setCurrentPage(1);

        toast.success(`${cleanedData.length} avantajlı ürün başarıyla işlendi ve tabloda gösterildi. (Veritabanına kaydedilmedi)`);
        
      } catch (error) {
        console.error('Excel işleme hatası:', error);
        toast.error(error.message || 'Excel dosyası işlenirken bir hata oluştu');
      } finally {
        setUploading(false);
        // Input değerini sıfırla ki aynı dosyayı tekrar seçebilsin
        e.target.value = null;
      }
    };

    // İlk olarak binary string olarak oku
    reader.readAsBinaryString(file);
  };

  // Ürün detaylarını genişlet/daralt
  const toggleProductDetails = (productId) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  // Sayfalama için gerekli değişkenler
  const totalPages = Math.ceil(products.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentProducts = products.slice(startIndex, endIndex);

  // Debug logları
  console.log("Toplam ürün sayısı:", products.length);
  console.log("Sayfa boyutu:", pageSize);
  console.log("Mevcut sayfa:", currentPage);
  console.log("Başlangıç indeksi:", startIndex);
  console.log("Bitiş indeksi:", endIndex);
  console.log("Gösterilen ürün sayısı:", currentProducts.length);
  if (currentProducts.length > 0) {
    console.log("İlk ürün:", currentProducts[0]);
  } else {
    console.log("Hiç ürün bulunmuyor veya sayfalama dışında kalıyor");
  }

  useEffect(() => {
    // Sayfalama değiştiğinde, ürünlerin doğru şekilde dilimlendiğinden emin ol
    const newStartIndex = (currentPage - 1) * pageSize;
    
    // Mevcut sayfa geçersiz hale geldiyse (ör. son üründen sonra) ilk sayfaya dön
    if (products.length > 0 && newStartIndex >= products.length) {
      setCurrentPage(1);
    }
    
    // Geçici console log ekle
    console.log('Sayfalama durumu - Sayfa:', currentPage, 'Boyut:', pageSize, 'Toplam ürün:', products.length);
  }, [currentPage, pageSize, products.length]);

  // İlk yükleme için
  useEffect(() => {
    fetchProducts();
  }, []);

  const formatPrice = (price) => {
    if (!price && price !== 0) return '0 TL';
    return parseFloat(price).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR');
  };

  const getAdvantageTagClass = (label) => {
    if (!label) return '';
    
    if (label.includes('Süper Fiyat')) return 'bg-red-100 text-red-800';
    if (label.includes('Çok Avantajlı')) return 'bg-orange-100 text-orange-800';
    if (label.includes('Avantajlı')) return 'bg-green-100 text-green-800';
    
    return 'bg-gray-100 text-gray-800';
  };

  // Sayfa değiştirme fonksiyonu
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  // Sayfa başına ürün sayısını değiştirme fonksiyonu
  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1); // Sayfa boyutu değiştiğinde ilk sayfaya dön
  };

  // Sayfalama bileşeni
  const PaginationComponent = () => {
    const totalProducts = products.length;
    const totalPages = Math.ceil(totalProducts / pageSize);
    const hasNext = currentPage < totalPages;

    return (
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>
              {' '}-{' '}
              <span className="font-medium">{Math.min(currentPage * pageSize, totalProducts)}</span>
              {' '}/ {' '}
              <span className="font-medium">{totalProducts}</span>
              {' '}ürün gösteriliyor
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-3 sm:mt-0">
            <div>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="form-select rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="sr-only">İlk Sayfa</span>
                ««
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="sr-only">Önceki</span>
                «
              </button>
              {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = idx + 1;
                } else if (currentPage < 4) {
                  pageNumber = idx + 1;
                } else if (currentPage > totalPages - 3) {
                  pageNumber = totalPages - 4 + idx;
                } else {
                  pageNumber = currentPage - 2 + idx;
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`relative inline-flex items-center px-4 py-2 border ${
                      currentPage === pageNumber 
                      ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' 
                      : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                    } text-sm font-medium`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasNext}
                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="sr-only">Sonraki</span>
                »
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="sr-only">Son Sayfa</span>
                »»
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="p-4 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Avantajlı Ürünler</h1>
              <p className="mt-1 text-sm text-gray-600">
                Trendyol'daki avantajlı etiketli ürünlerinizi yönetin
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                onClick={handleExportExcel}
                disabled={products.length === 0}
              >
                <FaDownload className="mr-2 -ml-1 h-5 w-5" />
                Excel İndir
              </button>
              <label className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
                <FaUpload className="mr-2 -ml-1 h-5 w-5" />
                Excel Yükle
                <input
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls"
                  onChange={handleImportExcel}
                  disabled={uploading}
                />
              </label>
              <button
                onClick={fetchProducts}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaSync className={`-ml-1 mr-2 h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                Yenile
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white shadow-sm rounded-lg p-6 text-center">
            <p className="text-gray-500">Henüz avantajlı ürün bulunmuyor. Excel dosyası yükleyerek başlayabilirsiniz.</p>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            {/* Sayfa başına ürün sayısı seçimi ve tablo container */}
            <div className="flex flex-col h-[600px]"> {/* Sabit yükseklik */}
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">Sayfa başına:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="form-select rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <div className="text-sm text-gray-700">
                    Toplam {products.length} üründen {startIndex + 1} - {Math.min(endIndex, products.length)} arası gösteriliyor
                  </div>
                </div>
              </div>

              {/* Tablo Container - Kaydırılabilir Alan */}
              <div className="flex-1 overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ürün Bilgisi
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Barkod / Model Kodu
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fiyat / Komisyon
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stok
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Detaylar
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentProducts && currentProducts.length > 0 ? (
                      currentProducts.map((product) => {
                        if (!product || !product.id) {
                          console.error("Hatalı ürün verisi:", product);
                          return null; // Hatalı ürünleri atla
                        }
                        
                        return (
                          <React.Fragment key={product.id}>
                            <tr className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <img
                                      className="h-10 w-10 rounded-md object-cover"
                                      src={product.image_url || 'https://placehold.co/100x100/eee/999?text=Ürün'}
                                      alt={product.title || 'Ürün'}
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://placehold.co/100x100/eee/999?text=Ürün';
                                      }}
                                    />
                                  </div>
                                  <div className="ml-4 max-w-xs">
                                    <div className="text-sm font-medium text-gray-900 truncate">{product.title || 'İsimsiz Ürün'}</div>
                                    <div className="text-sm text-gray-500">{product.brand || '-'}</div>
                                    <div className="text-xs text-gray-400">{product.category || '-'}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">{product.barcode || '-'}</div>
                                {product.product_code && (
                                  <div className="text-xs text-gray-500">Model: {product.product_code}</div>
                                )}
                                {product.stock_code && (
                                  <div className="text-xs text-gray-500">Stok Kodu: {product.stock_code}</div>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">{formatPrice(product.sale_price || 0)}</div>
                                <div className="text-xs text-gray-500">Komisyon: %{product.current_commission || 0}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">{product.quantity || 0}</div>
                                {(product.quantity < 10 || !product.quantity) && (
                                  <div className="text-xs text-red-500">Düşük Stok</div>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => toggleProductDetails(product.id)}
                                  className="text-indigo-600 hover:text-indigo-900 focus:outline-none"
                                >
                                  {expandedProducts[product.id] ? (
                                    <FaChevronUp className="h-5 w-5" />
                                  ) : (
                                    <FaChevronDown className="h-5 w-5" />
                                  )}
                                </button>
                              </td>
                            </tr>
                            {expandedProducts[product.id] && (
                              <tr className="bg-gray-50">
                                <td colSpan="5" className="px-6 py-4">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Avantajlı Fiyat Aralığı */}
                                    {product.price_2_upper > 0 && product.price_2_lower > 0 && (
                                      <div className="bg-green-50 p-3 rounded-lg">
                                        <h3 className="text-sm font-medium text-green-800 mb-2">Avantajlı Fiyat Aralığı</h3>
                                        <div className="flex justify-between text-xs text-green-700">
                                          <span>Alt Limit: {formatPrice(product.price_2_lower)}</span>
                                          <span>Üst Limit: {formatPrice(product.price_2_upper)}</span>
                                        </div>
                                        <div className="mt-2 text-xs text-green-700">
                                          <span>Komisyon: %{product.commission_1 || 0}</span>
                                          <span className={`ml-2 px-2 py-0.5 rounded-full ${
                                            calculateProfit(product, product.price_2_lower).isProfitable
                                              ? 'bg-green-200 text-green-800'
                                              : 'bg-red-200 text-red-800'
                                          }`}>
                                            {calculateProfit(product, product.price_2_lower).isProfitable
                                              ? `Kar: ${formatPrice(calculateProfit(product, product.price_2_lower).profit)}`
                                              : `Zarar: ${formatPrice(Math.abs(calculateProfit(product, product.price_2_lower).profit))}`}
                                          </span>
                                        </div>
                                        <button
                                          onClick={() => handleSelectPrice(product.id, product.price_2_lower)}
                                          className={`mt-2 w-full px-3 py-1 text-xs rounded-lg ${
                                            selectedPrices[product.id] === product.price_2_lower
                                              ? 'bg-green-600 text-white'
                                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                                          }`}
                                        >
                                          Bu Fiyatı Seç
                                        </button>
                                      </div>
                                    )}
                                    
                                    {/* Çok Avantajlı Fiyat Aralığı */}
                                    {product.price_3_upper > 0 && product.price_3_lower > 0 && (
                                      <div className="bg-orange-50 p-3 rounded-lg">
                                        <h3 className="text-sm font-medium text-orange-800 mb-2">Çok Avantajlı Fiyat Aralığı</h3>
                                        <div className="flex justify-between text-xs text-orange-700">
                                          <span>Alt Limit: {formatPrice(product.price_3_lower)}</span>
                                          <span>Üst Limit: {formatPrice(product.price_3_upper)}</span>
                                        </div>
                                        <div className="mt-2 text-xs text-orange-700">
                                          <span>Komisyon: %{product.commission_2 || 0}</span>
                                          <span className={`ml-2 px-2 py-0.5 rounded-full ${
                                            calculateProfit(product, product.price_3_lower).isProfitable
                                              ? 'bg-green-200 text-green-800'
                                              : 'bg-red-200 text-red-800'
                                          }`}>
                                            {calculateProfit(product, product.price_3_lower).isProfitable
                                              ? `Kar: ${formatPrice(calculateProfit(product, product.price_3_lower).profit)}`
                                              : `Zarar: ${formatPrice(Math.abs(calculateProfit(product, product.price_3_lower).profit))}`}
                                          </span>
                                        </div>
                                        <button
                                          onClick={() => handleSelectPrice(product.id, product.price_3_lower)}
                                          className={`mt-2 w-full px-3 py-1 text-xs rounded-lg ${
                                            selectedPrices[product.id] === product.price_3_lower
                                              ? 'bg-orange-600 text-white'
                                              : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                                          }`}
                                        >
                                          Bu Fiyatı Seç
                                        </button>
                                      </div>
                                    )}
                                    
                                    {/* Süper Fiyat Aralığı */}
                                    {product.price_4_upper > 0 && product.price_3_lower > 0 && (
                                      <div className="bg-red-50 p-3 rounded-lg">
                                        <h3 className="text-sm font-medium text-red-800 mb-2">Süper Fiyat Aralığı</h3>
                                        <div className="flex justify-between text-xs text-red-700">
                                          <span>Alt Limit: {formatPrice(product.price_3_lower)}</span>
                                          <span>Üst Limit: {formatPrice(product.price_4_upper)}</span>
                                        </div>
                                        <div className="mt-2 text-xs text-red-700">
                                          <span>Komisyon: %{product.commission_3 || 0}</span>
                                          <span className={`ml-2 px-2 py-0.5 rounded-full ${
                                            calculateProfit(product, product.price_4_upper).isProfitable
                                              ? 'bg-green-200 text-green-800'
                                              : 'bg-red-200 text-red-800'
                                          }`}>
                                            {calculateProfit(product, product.price_4_upper).isProfitable
                                              ? `Kar: ${formatPrice(calculateProfit(product, product.price_4_upper).profit)}`
                                              : `Zarar: ${formatPrice(Math.abs(calculateProfit(product, product.price_4_upper).profit))}`}
                                          </span>
                                        </div>
                                        <button
                                          onClick={() => handleSelectPrice(product.id, product.price_4_upper)}
                                          className={`mt-2 w-full px-3 py-1 text-xs rounded-lg ${
                                            selectedPrices[product.id] === product.price_4_upper
                                              ? 'bg-red-600 text-white'
                                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                                          }`}
                                        >
                                          Bu Fiyatı Seç
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Seçilen Fiyat Gösterimi */}
                                  {selectedPrices[product.id] && (
                                    <div className="mt-4 bg-indigo-50 p-3 rounded-lg">
                                      <h3 className="text-sm font-medium text-indigo-800 mb-2">Seçilen Fiyat</h3>
                                      <div className="flex justify-between items-center">
                                        <div className="text-sm text-indigo-700">
                                          <span className="font-medium">{formatPrice(selectedPrices[product.id])}</span>
                                          {selectedPrices[product.id] && (
                                            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                                              calculateProfit(product, selectedPrices[product.id]).isProfitable
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                              {calculateProfit(product, selectedPrices[product.id]).isProfitable
                                                ? `Kar: ${formatPrice(calculateProfit(product, selectedPrices[product.id]).profit)}`
                                                : `Zarar: ${formatPrice(Math.abs(calculateProfit(product, selectedPrices[product.id]).profit))}`}
                                            </span>
                                          )}
                                        </div>
                                        <button
                                          onClick={() => {
                                            setSelectedPrices(prev => {
                                              const newPrices = { ...prev };
                                              delete newPrices[product.id];
                                              return newPrices;
                                            });
                                            setApplyUntilEnd(prev => {
                                              const newApply = { ...prev };
                                              delete newApply[product.id];
                                              return newApply;
                                            });
                                          }}
                                          className="text-xs text-indigo-600 hover:text-indigo-800"
                                        >
                                          Seçimi Kaldır
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Ek Bilgiler */}
                                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-100 p-3 rounded-lg">
                                      <h3 className="text-sm font-medium text-gray-800 mb-2">Fiyat Bilgileri</h3>
                                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                                        <div>Güncel TSF: {formatPrice(product.current_tsf || product.sale_price)}</div>
                                        <div>Yeni TSF: {formatPrice(product.new_tsf || 0)}</div>
                                        <div>Komisyona Esas Fiyat: {formatPrice(product.commission_base || 0)}</div>
                                        <div>Hesaplanan Komisyon: %{product.calculated_commission || 0}</div>
                                      </div>
                                    </div>
                                    
                                    <div className="bg-gray-100 p-3 rounded-lg">
                                      <h3 className="text-sm font-medium text-gray-800 mb-2">Diğer Bilgiler</h3>
                                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                                        <div>Beden: {product.size || '-'}</div>
                                        <div>Tarife Sonuna Kadar Uygula: {applyUntilEnd[product.id] ? 'Evet' : 'Hayır'}</div>
                                        <div>Etiket Bitiş: {formatDate(product.end_date) || '-'}</div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                          Gösterilecek ürün bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* PaginationComponent ile değiştir */}
              <PaginationComponent />
            </div>
          </div>
        )}

        {/* Bilgi Notu */}
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-blue-800 mb-2">Avantajlı Ürünler Hakkında</h3>
          <p className="text-sm text-blue-700">
            Avantajlı ürünler, Trendyol'da özel etiketlerle öne çıkarılan ürünlerdir. Bu etiketler arasında "Avantajlı", "Çok Avantajlı" ve "Süper Fiyat" gibi etiketler bulunur.
          </p>
          <p className="text-sm text-blue-700 mt-2">
            <strong>Fiyat Aralıkları:</strong>
          </p>
          <ul className="text-sm text-blue-700 list-disc pl-5 mt-1">
            <li><strong>Avantajlı:</strong> 1. Fiyat Alt Limit - 2. Fiyat Üst Limiti arasındaki ürünler</li>
            <li><strong>Çok Avantajlı:</strong> 2. Fiyat Alt Limit - 3. Fiyat Üst Limiti arasındaki ürünler</li>
            <li><strong>Süper Fiyat:</strong> 3. Fiyat Alt Limit - 4. Fiyat Üst Limiti arasındaki ürünler</li>
          </ul>
          <p className="text-sm text-blue-700 mt-2">
            <strong>Not:</strong> Avantajlı ürün listesini güncellemek için Trendyol'dan aldığınız Excel dosyasını yükleyebilirsiniz.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default AdvantageProducts; 