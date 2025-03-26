import React, { useState, useEffect } from 'react';
import { FaDownload, FaUpload, FaSync, FaSearch } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const ProductSettings = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [modifiedProducts, setModifiedProducts] = useState({});
  const [saveStatus, setSaveStatus] = useState({
    saving: false,
    message: '',
    error: false
  });
  // Sayfalama için gerekli state'ler
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const navigate = useNavigate();

  // Arama terimi değiştiğinde filtreleme yap
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
      setTotalElements(products.length);
      const calculatedTotalPages = Math.ceil(products.length / size);
      setTotalPages(calculatedTotalPages);
      setHasNext(page < calculatedTotalPages - 1);
      return;
    }

    const lowercasedFilter = searchTerm.toLowerCase().trim();
    const filtered = products.filter(item => {
      return (
        (item.barcode && typeof item.barcode === 'string' && item.barcode.toLowerCase().includes(lowercasedFilter)) ||
        (item.title && typeof item.title === 'string' && item.title.toLowerCase().includes(lowercasedFilter)) ||
        (item.brand && typeof item.brand === 'string' && item.brand.toLowerCase().includes(lowercasedFilter)) ||
        (item.stock_code && typeof item.stock_code === 'string' && item.stock_code.toLowerCase().includes(lowercasedFilter)) ||
        (item.productCode && typeof item.productCode === 'string' && item.productCode.toLowerCase().includes(lowercasedFilter))
      );
    });
    setFilteredProducts(filtered);
    setTotalElements(filtered.length);
    const calculatedTotalPages = Math.ceil(filtered.length / size);
    setTotalPages(calculatedTotalPages);
    setHasNext(page < calculatedTotalPages - 1);
  }, [searchTerm, products, page, size]);

  // Değişiklik fonksiyonları
  const handleCostChange = (productId, value) => {
    setProducts(prevProducts =>
      prevProducts.map(product =>
        product.id === productId ? { ...product, cost: value } : product
      )
    );
    setModifiedProducts(prev => ({
      ...prev,
      [productId]: true
    }));
  };

  const handleDesiChange = (productId, value) => {
    setProducts(prevProducts =>
      prevProducts.map(product =>
        product.id === productId ? { ...product, dimensionalWeight: value } : product
      )
    );
    setModifiedProducts(prev => ({
      ...prev,
      [productId]: true
    }));
  };

  const handleListPriceChange = (productId, value) => {
    setProducts(prevProducts =>
      prevProducts.map(product =>
        product.id === productId ? { ...product, listPrice: value } : product
      )
    );
    setModifiedProducts(prev => ({
      ...prev,
      [productId]: true
    }));
  };

  const handleSalePriceChange = (productId, value) => {
    setProducts(prevProducts =>
      prevProducts.map(product =>
        product.id === productId ? { ...product, salePrice: value } : product
      )
    );
    setModifiedProducts(prev => ({
      ...prev,
      [productId]: true
    }));
  };

  const handleQuantityChange = (productId, value) => {
    setProducts(prevProducts =>
      prevProducts.map(product =>
        product.id === productId ? { ...product, quantity: value } : product
      )
    );
    setModifiedProducts(prev => ({
      ...prev,
      [productId]: true
    }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  // Sayfa değiştirme fonksiyonu
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const fetchProducts = async (isRetry = false) => {
    try {
      setLoading(true);
      // Değişiklik kaydını sıfırla
      setModifiedProducts({});
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Trendyol API'sinden ürünleri getir
      const response = await fetch('http://localhost:5000/api/trendyol/product-settings-sync', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ürünler yüklenirken bir hata oluştu');
      }

      if (data.products) {
        // Mevcut ürün ayarlarını getir ve birleştir
        const settingsResponse = await fetch('http://localhost:5000/api/trendyol/product-settings', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const settingsData = await settingsResponse.json();
        
        if (settingsResponse.ok && settingsData.products && settingsData.products.length > 0) {
          // Ayarları barcode'a göre eşleştirip birleştir
          const productSettings = {};
          
          settingsData.products.forEach(setting => {
            productSettings[setting.barcode] = setting;
          });
          
          console.log('Veritabanı ayarları:', productSettings);
          
          // API'den gelen ürünlere ayarları ekle
          const mergedProducts = data.products.map(product => {
            const settings = productSettings[product.barcode] || {};
            console.log(`Ürün birleştiriliyor: ${product.barcode}, Ayarlar:`, settings);
            
            // Integer alanların güvenli şekilde birleştirilmesi
            let trendyolId = null;
            if (product.trendyolId !== undefined && product.trendyolId !== null) {
              const idValue = parseInt(product.trendyolId, 10);
              if (!isNaN(idValue) && isFinite(idValue)) {
                trendyolId = idValue;
              }
            }
            
            let dimensionalWeight = null;
            // Önce ayarlardaki desi değerini kontrol et
            if (settings.dimensional_weight !== undefined && settings.dimensional_weight !== null) {
              const desiValue = parseFloat(settings.dimensional_weight);
              if (!isNaN(desiValue) && isFinite(desiValue)) {
                dimensionalWeight = desiValue;
              }
            } 
            // Ayarlarda yoksa ürün değerini kullan
            else if (product.dimensionalWeight !== undefined && product.dimensionalWeight !== null) {
              const desiValue = parseFloat(product.dimensionalWeight);
              if (!isNaN(desiValue) && isFinite(desiValue)) {
                dimensionalWeight = desiValue;
              }
            }
            
            // Maliyet değeri güvenli şekilde al
            let cost = null;
            if (settings.cost !== undefined && settings.cost !== null) {
              const costValue = parseFloat(settings.cost);
              if (!isNaN(costValue) && isFinite(costValue)) {
                cost = costValue;
              }
            }
            
            return {
              ...product,
              id: product.id || settings.id,
              cost: cost,
              dimensionalWeight: dimensionalWeight,
              trendyolId: trendyolId,
              stockCode: product.stockCode || product.stock_code || settings.stock_code,
              barcode: product.barcode || settings.barcode,
              images: product.images || []
            };
          });
          
          setProducts(mergedProducts);
          setFilteredProducts(mergedProducts);
          setTotalElements(mergedProducts.length);
          const calculatedTotalPages = Math.ceil(mergedProducts.length / size);
          setTotalPages(calculatedTotalPages);
          setHasNext(page < calculatedTotalPages - 1);
        } else {
          // Ayarlar yoksa sadece ürünleri kullan
          setProducts(data.products);
          setFilteredProducts(data.products);
          setTotalElements(data.products.length);
          const calculatedTotalPages = Math.ceil(data.products.length / size);
          setTotalPages(calculatedTotalPages);
          setHasNext(page < calculatedTotalPages - 1);
        }
      }
    } catch (error) {
      console.error('Ürün yükleme hatası:', error);
      toast.error(error.message || 'Ürünler yüklenirken bir hata oluştu');
      
      // Eğer ilk kez ürünler yüklenirken hata olduysa
      if (isInitialLoad) {
        // Yeniden deneme
        if (!isRetry) {
          console.log('Ürünleri yükleme yeniden deneniyor...');
          setTimeout(() => fetchProducts(true), 3000);
        } else {
          // Yeniden deneme de başarısız oldu, kullanıcıya bilgi ver
          toast.error('Ürünler yüklenemedi. Lütfen daha sonra tekrar deneyiniz.');
        }
      }
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  const handleExportExcel = () => {
    try {
      // Excel için veriyi hazırla
      const excelData = products.map(product => ({
        'Barkod': product.barcode || '',
        'Ürün Adı': product.title || '',
        'Marka': product.brand || '',
        'Model Kodu': product.productCode || '',
        'Stok Kodu': product.stockCode || '',
        'KDV Oranı (%)': product.vatRate || '',
        'Maliyet (KDV Dahil)': product.cost || '',
        'Desi': product.dimensionalWeight || '',
        'Liste Fiyatı': product.listPrice || '', 
        'Satış Fiyatı': product.salePrice || '',
        'Stok Adedi': product.quantity || ''
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Ürünler');

      // Sütun genişliklerini ayarla
      const colWidths = [
        { wch: 15 }, // Barkod
        { wch: 40 }, // Ürün Adı
        { wch: 15 }, // Marka
        { wch: 15 }, // Model Kodu
        { wch: 15 }, // Stok Kodu
        { wch: 10 }, // KDV Oranı
        { wch: 15 }, // Maliyet
        { wch: 10 }, // Desi
        { wch: 15 }, // Liste Fiyatı
        { wch: 15 }, // Satış Fiyatı
        { wch: 10 }, // Stok Adedi
      ];

      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, 'urun-maliyetleri.xlsx');
      toast.success('Excel dosyası başarıyla indirildi.');
    } catch (error) {
      toast.error('Excel dosyası oluşturulurken bir hata oluştu.');
      console.error('Excel oluşturma hatası:', error);
    }
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      toast.error('Lütfen bir Excel dosyası seçin.');
      return;
    }
    
    // Input değerini sıfırla (aynı dosyayı tekrar seçebilmek için)
    e.target.value = null;
    
    setLoading(true);
    setSaveStatus({ saving: false, message: 'Excel dosyası işleniyor...', error: false });
    
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (!data || data.length === 0) {
          throw new Error('Excel dosyasında işlenebilir veri bulunamadı.');
        }

        console.log('Excel verisi:', data); 

        // Excel verilerini barkoda göre map'le
        const excelDataByBarcode = {};
        const problemRows = []; // Sorunlu satırları takip et
        
        // Excel verilerini ön işleme
        data.forEach((row, index) => {
          // Barkod kontrolü
          if (!row.Barkod) {
            problemRows.push(`Satır ${index + 2}: Barkod bulunamadı`);
            return;
          }
          
          const barcode = String(row.Barkod).trim();
          if (!barcode) {
            problemRows.push(`Satır ${index + 2}: Barkod boş`);
            return;
          }
          
          let cost = null;
          let desi = null;
          
          // Maliyet değerini işle
          if (row['Maliyet (KDV Dahil)'] !== undefined && 
              row['Maliyet (KDV Dahil)'] !== null && 
              row['Maliyet (KDV Dahil)'] !== '') {
            
            // Boşlukları kaldır ve sayıya çevir
            const costStr = String(row['Maliyet (KDV Dahil)'])
              .replace(/\s+/g, '') // Tüm boşlukları kaldır
              .replace(/[^0-9.,]/g, '') // Sayı olmayan karakterleri kaldır
              .replace(',', '.'); // Virgülü noktaya çevir
              
            const costVal = parseFloat(costStr);
            if (!isNaN(costVal) && isFinite(costVal) && costVal > 0) {
              cost = costVal;
            } else if (costStr && costStr !== '') {
              problemRows.push(`Satır ${index + 2}: Maliyet değeri geçersiz (${row['Maliyet (KDV Dahil)']})`);
            }
          }
          
          // Desi değerini işle
          if (row['Desi'] !== undefined && 
              row['Desi'] !== null && 
              row['Desi'] !== '') {
            
            // Boşlukları kaldır ve sayıya çevir
            const desiStr = String(row['Desi'])
              .replace(/\s+/g, '') // Tüm boşlukları kaldır
              .replace(/[^0-9.,]/g, '') // Sayı olmayan karakterleri kaldır
              .replace(',', '.'); // Virgülü noktaya çevir
              
            const desiVal = parseFloat(desiStr);
            if (!isNaN(desiVal) && isFinite(desiVal) && desiVal > 0) {
              desi = desiVal;
            } else if (desiStr && desiStr !== '') {
              problemRows.push(`Satır ${index + 2}: Desi değeri geçersiz (${row['Desi']})`);
            }
          }
          
          // Sadece geçerli değerleri kaydet
          excelDataByBarcode[barcode] = {
            cost: cost,
            dimensionalWeight: desi
          };
        });

        console.log('İşlenmiş Excel verileri:', excelDataByBarcode);
        
        if (Object.keys(excelDataByBarcode).length === 0) {
          throw new Error('Excel dosyasından geçerli ürün verisi çıkarılamadı. Lütfen dosyayı kontrol edin.');
        }
        
        // Ürünleri excel değerleriyle güncelle
        const updatedProducts = products.map(product => {
          // Barkod kontrolü
          if (!product.barcode) return product;
          
          // Excel'de bu barkoda sahip bir ürün var mı kontrol et
          const excelData = excelDataByBarcode[product.barcode];
          
          if (excelData) {
            // Excel'den gelen değeri kullan
            return {
              ...product,
              cost: excelData.cost !== null ? excelData.cost : product.cost,
              dimensionalWeight: excelData.dimensionalWeight !== null ? excelData.dimensionalWeight : product.dimensionalWeight
            };
          }
          
          // Excel'de yoksa ürünü olduğu gibi bırak
          return product;
        });
        
        // Ürün state'ini güncelle
        setProducts(updatedProducts);
        
        // Değiştirilen ürünleri işaretle
        const newModifiedProducts = {};
        updatedProducts.forEach(product => {
          const excelData = excelDataByBarcode[product.barcode];
          if (excelData) {
            newModifiedProducts[product.id] = true;
          }
        });
        
        setModifiedProducts(prev => ({
          ...prev,
          ...newModifiedProducts
        }));
        
        // Değişiklikleri UI'da göster ve kullanıcıyı bilgilendir
        const changedCount = Object.keys(excelDataByBarcode).length;
        
        if (problemRows.length > 0) {
          // Sorunlu satırlar hakkında uyarı ver
          console.warn('Sorunlu Excel satırları:', problemRows);
          const warningMsg = problemRows.slice(0, 3).join('; ') + (problemRows.length > 3 ? ` ve ${problemRows.length - 3} satır daha` : '');
          toast.warning(`Bazı satırlar işlenemedi: ${warningMsg}`);
        }
        
        setSaveStatus({ 
          saving: false, 
          message: `Excel dosyası işlendi. ${changedCount} ürün için veriler güncellendi. Değişiklikleri kaydetmek için "Değişiklikleri Kaydet" düğmesine tıklayın.`, 
          error: false 
        });
        
        toast.success(`Excel dosyası işlendi. ${changedCount} ürün için veriler güncellendi.`);
        
      } catch (error) {
        console.error('Excel işleme hatası:', error);
        setSaveStatus({ saving: false, message: error.message, error: true });
        toast.error(error.message || 'Excel dosyası işlenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = (error) => {
      console.error('Dosya okuma hatası:', error);
      setSaveStatus({ saving: false, message: 'Dosya okunurken bir hata oluştu.', error: true });
      toast.error('Dosya okunurken bir hata oluştu.');
      setLoading(false);
    };

    reader.readAsBinaryString(file);
  };

  const formatPrice = (price) => {
    return price?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) || '0 TL';
  };

  // Google Sheets'e aktarma fonksiyonu
  const handleExportToSheets = async (product) => {
    try {
      setLoading(true);
      
      // E-posta göndermeden devam etmek için kullanıcıya sor
      const sendEmail = window.confirm('Ürün bilgilerini Google Sheets\'e aktarmak istiyor musunuz? "Tamam" seçeneği ile sadece Sheets\'e aktarılacak, "İptal" seçeneği ile işlem iptal edilecektir.');
      
      if (!sendEmail) {
        setLoading(false);
        return; // Kullanıcı iptal etti
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
        setLoading(false);
        return;
      }
      
      // Entegrasyon durumunu kontrol et
      const statusResponse = await fetch('http://localhost:5000/api/integrations/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const statusData = await statusResponse.json();
      
      if (!statusData.integrations.google.connected) {
        toast.error('Google Sheets entegrasyonu bulunamadı. Lütfen önce entegrasyonu tamamlayın.');
        setLoading(false);
        return;
      }
      
      // Ürün bilgilerini Google Sheets'e aktar (e-posta göndermeden)
      const response = await fetch('http://localhost:5000/api/integrations/export-product', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          barcode: product.barcode,
          skipEmail: true, // E-posta göndermeyi atla
          spreadsheetId: statusData.integrations.google.spreadsheetId
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Ürün bilgileri aktarılırken bir hata oluştu');
      }
      
      toast.success('Ürün bilgileri başarıyla Google Sheets\'e aktarıldı.');
      
      // Spreadsheet URL'sini yeni sekmede aç
      if (data.spreadsheetUrl) {
        window.open(data.spreadsheetUrl, '_blank');
      }
    } catch (error) {
      console.error('Sheets export hatası:', error);
      toast.error(error.message || 'Ürün bilgileri aktarılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Değişiklikleri kaydet
  const saveChanges = async () => {
    try {
      setSaveStatus({ saving: true, message: 'Değişiklikler kaydediliyor...', error: false });
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      // Değiştirilmiş ürünleri filtrele
      const modifiedProductIds = Object.keys(modifiedProducts);
      
      if (modifiedProductIds.length === 0) {
        toast.info('Kaydedilecek değişiklik bulunamadı.');
        setSaveStatus({ saving: false, message: '', error: false });
        return;
      }
      
      console.log('Değiştirilen ürün ID\'leri:', modifiedProductIds);
      
      // Sadece değiştirilen ürünleri al
      const updatedProducts = products
        .filter(product => {
          // Sadece değiştirilmiş ve geçerli barkodu olan ürünleri al
          return modifiedProductIds.includes(product.id) && 
                 product.barcode && 
                 typeof product.barcode === 'string' && 
                 product.barcode.trim() !== '';
        })
        .map(product => {
          // Güvenli değer dönüşümleri
          let cost = null;
          if (product.cost !== undefined && product.cost !== null && product.cost !== '') {
            // Temizlenmiş cost değerini al
            const costStr = typeof product.cost === 'string' 
              ? product.cost.replace(/\s+/g, '').replace(/[^0-9.,]/g, '').replace(',', '.')
              : String(product.cost).replace(/\s+/g, '').replace(/[^0-9.,]/g, '').replace(',', '.');
            
            const costValue = parseFloat(costStr);
            if (!isNaN(costValue) && isFinite(costValue) && costValue > 0) {
              cost = costValue;
            }
          }
          
          let dimensionalWeight = null;
          if (product.dimensionalWeight !== undefined && product.dimensionalWeight !== null && product.dimensionalWeight !== '') {
            // Temizlenmiş desi değerini al
            const desiStr = typeof product.dimensionalWeight === 'string'
              ? product.dimensionalWeight.replace(/\s+/g, '').replace(/[^0-9.,]/g, '').replace(',', '.')
              : String(product.dimensionalWeight).replace(/\s+/g, '').replace(/[^0-9.,]/g, '').replace(',', '.');
            
            const desiValue = parseFloat(desiStr);
            if (!isNaN(desiValue) && isFinite(desiValue) && desiValue > 0) {
              dimensionalWeight = desiValue;
            }
          }

          // Integer olması gereken alanları güvenli şekilde işle
          let trendyolId = null;
          if (product.trendyolId !== undefined && product.trendyolId !== null && product.trendyolId !== '') {
            const idValue = parseInt(product.trendyolId, 10);
            if (!isNaN(idValue) && isFinite(idValue)) {
              trendyolId = idValue;
            }
          }
          
          let quantity = null;
          if (product.quantity !== undefined && product.quantity !== null && product.quantity !== '') {
            const qtyValue = parseInt(product.quantity, 10);
            if (!isNaN(qtyValue) && isFinite(qtyValue)) {
              quantity = qtyValue;
            }
          }
          
          // Her ürün için sadece gerekli bilgileri gönder
          const result = {
            barcode: product.barcode.trim(),
            cost: cost,
            dimensionalWeight: dimensionalWeight
          };
          
          // Integer alanları sadece geçerli değerleri varsa ekle
          if (trendyolId !== null) {
            result.trendyol_id = trendyolId;
          }
          
          if (quantity !== null) {
            result.quantity = quantity;
          }
          
          return result;
        });
      
      console.log('Güncellenecek ürünler:', updatedProducts);
      
      if (updatedProducts.length === 0) {
        toast.warning('Güncellenecek geçerli ürün bulunamadı.');
        setSaveStatus({ saving: false, message: '', error: false });
        return;
      }
      
      // Veri gönderirken tüm undefined değerleri null'a çevir
      const cleanPayload = JSON.parse(JSON.stringify({
        products: updatedProducts
      }));

      // Toplu API çağrısı ile ürünleri güncelle
      const response = await fetch('http://localhost:5000/api/trendyol/update-product-costs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cleanPayload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ürün ayarları kaydedilemedi');
      }
      
      const result = await response.json();
      
      if (result.errors?.length > 0) {
        console.warn('Güncelleme hataları:', result.errors);
        const errorSummary = result.errors.slice(0, 3).map(e => `${e.barcode}: ${e.message}`).join(', ');
        toast.warning(`${result.updatedCount} ürün güncellendi, ${result.errors.length} ürün güncellenemedi. İlk hatalar: ${errorSummary}`);
      } else {
        toast.success(`${result.updatedCount} ürün başarıyla güncellendi.`);
      }
      
      setSaveStatus({ saving: false, message: 'Değişiklikler başarıyla kaydedildi', error: false });
      
      // Değişiklik kaydını temizle
      setModifiedProducts({});
      
      // Kısa bir süre sonra durum mesajını temizle
      setTimeout(() => {
        setSaveStatus({ saving: false, message: '', error: false });
      }, 3000);
      
      // Ürünleri tekrar yükle
      await fetchProducts();
      
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      setSaveStatus({ saving: false, message: error.message, error: true });
      toast.error(error.message || 'Değişiklikler kaydedilirken bir hata oluştu');
      
      // Hata durumunda da mesajı temizle
      setTimeout(() => {
        setSaveStatus({ saving: false, message: '', error: false });
      }, 5000);
    } finally {
      // Yükleme durumunu kapat
      if (loading) setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchProducts();
  }, []);

  return (
    <Layout>
      <div className="p-4">
        <div className="mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Ürün Ayarları</h1>
              <p className="mt-1 text-sm text-gray-600">
                Trendyol ürünlerinizin maliyet ve diğer ayarlarını bu sayfadan yönetebilirsiniz
              </p>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                onClick={handleExportExcel}
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
              <button
                onClick={saveChanges}
                disabled={loading || saveStatus.saving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveStatus.saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Değişiklikleri Kaydet
                  </>
                )}
              </button>
            </div>
          </div>
          {saveStatus.message && (
            <div className={`mt-2 p-2 text-sm rounded ${saveStatus.error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {saveStatus.message}
            </div>
          )}
          
          <div className="mt-4 relative">
            <div className="relative">
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Barkod, ürün adı veya marka ile arama..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              {searchTerm && (
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={clearSearch}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              )}
            </div>
            {searchTerm && (
              <div className="mt-2 text-sm text-gray-600">
                {totalElements} ürün bulundu
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white shadow-sm rounded-lg p-6 text-center">
            <p className="text-gray-500">Henüz ürün bulunmuyor.</p>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ürün Bilgisi
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Barkod / Marka
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Maliyet (KDV Dahil)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Desi
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Satış Fiyatı
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stok
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                        {searchTerm ? 'Arama kriterlerine uygun ürün bulunamadı' : 'Ürün bulunamadı'}
                      </td>
                    </tr>
                  ) : (
                    // Sayfalama için slice işlemi ekledik
                    filteredProducts.slice(page * size, (page + 1) * size).map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {product.images && product.images[0] && (
                              <div className="flex-shrink-0 h-10 w-10 mr-4">
                                <img 
                                  className="h-10 w-10 rounded-full object-cover" 
                                  src={product.images[0]?.url || 'https://placehold.co/100/eee/999?text=Ürün'} 
                                  alt={product.title} 
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://placehold.co/100/eee/999?text=Ürün';
                                  }}
                                />
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                {product.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {product.stock_code || 'Stok kodu yok'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.barcode}</div>
                          <div className="text-sm text-gray-500">{product.brand}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={product.cost || ''}
                            onChange={(e) => handleCostChange(product.id, e.target.value)}
                            className="w-24 p-1 text-sm border rounded-md"
                            placeholder="Maliyet"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={product.dimensionalWeight || ''}
                            onChange={(e) => handleDesiChange(product.id, e.target.value)}
                            className="w-24 p-1 text-sm border rounded-md"
                            placeholder="Desi"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatPrice(product.salePrice || product.sale_price || 0)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.quantity || 0} adet
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleExportToSheets(product)}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              title="Google Sheets'e Aktar"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1.6 16H6.6c-.9 0-1.6-.7-1.6-1.6V6.6C5 5.7 5.7 5 6.6 5h10.8c.9 0 1.6.7 1.6 1.6v10.8c0 .9-.7 1.6-1.6 1.6z"/>
                                <path d="M9 17h2v-4h4v-2h-4V7H9v4H5v2h4z"/>
                              </svg>
                              Sheets
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Sayfalama */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{page * size + 1}</span>
                    {' '}-{' '}
                    <span className="font-medium">{Math.min((page + 1) * size, totalElements)}</span>
                    {' '}/ {' '}
                    <span className="font-medium">{totalElements}</span>
                    {' '}ürün gösteriliyor
                  </p>
                </div>
                <div className="mt-3 sm:mt-0">
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(0)}
                      disabled={page === 0}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">İlk Sayfa</span>
                      ««
                    </button>
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 0}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Önceki</span>
                      «
                    </button>
                    {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = idx;
                      } else if (page < 3) {
                        pageNumber = idx;
                      } else if (page > totalPages - 4) {
                        pageNumber = totalPages - 5 + idx;
                      } else {
                        pageNumber = page - 2 + idx;
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border ${
                            page === pageNumber 
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' 
                            : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                          } text-sm font-medium`}
                        >
                          {pageNumber + 1}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={!hasNext}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Sonraki</span>
                      »
                    </button>
                    <button
                      onClick={() => handlePageChange(totalPages - 1)}
                      disabled={page === totalPages - 1 || totalPages === 0}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Son Sayfa</span>
                      »»
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductSettings; 