import React, { useState, useEffect } from 'react';
import { FaDownload, FaUpload, FaSync, FaChevronDown, FaChevronUp, FaCheck, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const FlashProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [selectedVisibilityOption, setSelectedVisibilityOption] = useState(null);
  const [originalExcelData, setOriginalExcelData] = useState(null);
  const [selectedPrices, setSelectedPrices] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const navigate = useNavigate();

  // Ürünleri getir
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/trendyol/flash-products', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Flash ürünler yüklenirken bir hata oluştu');
      }

      if (data.products) {
        // Ürünlere görünürlük artışı ve kar/zarar hesaplamalarını ekle
        const productsWithVisibility = data.products.map(product => {
          const salePrice = parseFloat(product.sale_price) || 0;
          
          // Ürün maliyeti - backend'den gelen original_price değerini kullan
          // Eğer original_price yoksa veya 0 ise, sale_price'ın %70'ini varsayılan maliyet olarak kullan
          const originalPrice = parseFloat(product.original_price) || (salePrice * 0.7);
          
          // Komisyon oranı (ürünün kendi komisyon değerini kullan, yoksa varsayılan %21)
          const commissionRate = parseFloat(product.commission) || 21;
          
          // KDV oranı (varsayılan %18)
          const vatRate = 18;
          
          // Platform hizmet bedeli (sabit değer)
          const platformServiceFee = 6.99;
          
          // Kargo ücreti (desi bazlı hesaplama)
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
          // Satış fiyatı KDV dahil olarak gelir, KDV hariç fiyatı hesaplayalım
          const salePriceWithoutVAT = salePrice / (1 + (vatRate / 100));
          const saleVAT = salePrice - salePriceWithoutVAT;
          
          // Maliyet KDV dahil olarak gelir, KDV hariç maliyeti hesaplayalım
          const originalPriceWithoutVAT = originalPrice / (1 + (vatRate / 100));
          const costVAT = originalPrice - originalPriceWithoutVAT;
          
          // Komisyon tutarı (KDV hariç satış fiyatı üzerinden hesaplanır)
          const commissionAmount = (salePriceWithoutVAT * commissionRate) / 100;
          const commissionVAT = (commissionAmount * 18) / 100; // Komisyon KDV'si %18
          
          // Kargo KDV'si (Kargo ücreti KDV hariç olarak gelir)
          const shippingVAT = (shippingCost * 18) / 100;
          
          // Platform hizmet bedeli KDV'si (Platform hizmet bedeli KDV hariç olarak gelir)
          const platformServiceVAT = (platformServiceFee * 18) / 100;
          
          // Net KDV
          const netVAT = saleVAT - costVAT - commissionVAT - shippingVAT - platformServiceVAT;
          
          // Mevcut fiyat için kar/zarar hesaplaması
          // Kar tutarı = Satış fiyatı - Ürün Maliyeti - Komisyon Tutarı - Kargo Ücreti - Platform Hizmet Bedeli - Net KDV
          const currentProfit = Math.round((salePrice - originalPrice - commissionAmount - shippingCost + shippingSupport - platformServiceFee - netVAT) * 100) / 100;
          
          // 5 kata kadar görünürlük artışı için fiyat ve kar/zarar hesaplaması
          // Fiyat artışı: Excel'den gelen değer veya hesaplanan değer
          const visibility5xPrice = product.option1_price || Math.round(salePrice * 1.4);
          
          // 5x için KDV hesaplamaları
          const visibility5xPriceWithoutVAT = visibility5xPrice / (1 + (vatRate / 100));
          const visibility5xSaleVAT = visibility5xPrice - visibility5xPriceWithoutVAT;
          
          // 5x için komisyon tutarı (KDV hariç fiyat üzerinden)
          const visibility5xCommission = (visibility5xPriceWithoutVAT * commissionRate) / 100;
          const visibility5xCommissionVAT = (visibility5xCommission * 18) / 100;
          
          // 5x için kargo desteği
          const visibility5xShippingSupport = visibility5xPrice >= 150 ? shippingCost : 0;
          
          // 5x için net KDV
          const visibility5xNetVAT = visibility5xSaleVAT - costVAT - visibility5xCommissionVAT - shippingVAT - platformServiceVAT;
          
          // 5x için kar hesaplama
          const visibility5xProfit = Math.round((visibility5xPrice - originalPrice - visibility5xCommission - shippingCost + visibility5xShippingSupport - platformServiceFee - visibility5xNetVAT) * 100) / 100;
          
          // Kar farkı: Görünürlük artışı karı - mevcut kar
          const visibility5xProfitDiff = Math.round((visibility5xProfit - currentProfit) * 100) / 100;
          
          // 8 kata kadar görünürlük artışı için fiyat ve kar/zarar hesaplaması
          // Fiyat artışı: Excel'den gelen değer veya hesaplanan değer
          const visibility8xPrice = product.option2_price || Math.round(salePrice * 1.8);
          
          // 8x için KDV hesaplamaları
          const visibility8xPriceWithoutVAT = visibility8xPrice / (1 + (vatRate / 100));
          const visibility8xSaleVAT = visibility8xPrice - visibility8xPriceWithoutVAT;
          
          // 8x için komisyon tutarı (KDV hariç fiyat üzerinden)
          const visibility8xCommission = (visibility8xPriceWithoutVAT * commissionRate) / 100;
          const visibility8xCommissionVAT = (visibility8xCommission * 18) / 100;
          
          // 8x için kargo desteği
          const visibility8xShippingSupport = visibility8xPrice >= 150 ? shippingCost : 0;
          
          // 8x için net KDV
          const visibility8xNetVAT = visibility8xSaleVAT - costVAT - visibility8xCommissionVAT - shippingVAT - platformServiceVAT;
          
          // 8x için kar hesaplama
          const visibility8xProfit = Math.round((visibility8xPrice - originalPrice - visibility8xCommission - shippingCost + visibility8xShippingSupport - platformServiceFee - visibility8xNetVAT) * 100) / 100;
          
          // Kar farkı: Görünürlük artışı karı - mevcut kar
          const visibility8xProfitDiff = Math.round((visibility8xProfit - currentProfit) * 100) / 100;
          
          return {
            ...product,
            currentProfit,
            visibility5x: {
              price: visibility5xPrice,
              profit: visibility5xProfit,
              profitDiff: visibility5xProfitDiff,
              profitDiffPercent: salePrice > 0 ? (visibility5xProfitDiff / salePrice) * 100 : 0,
              isProfitable: visibility5xProfit > 0
            },
            visibility8x: {
              price: visibility8xPrice,
              profit: visibility8xProfit,
              profitDiff: visibility8xProfitDiff,
              profitDiffPercent: salePrice > 0 ? (visibility8xProfitDiff / salePrice) * 100 : 0,
              isProfitable: visibility8xProfit > 0
            },
            commission: commissionRate,
            option1_price: product.option1_price || visibility5xPrice,
            option2_price: product.option2_price || visibility8xPrice,
            selected_flash_price: product.selected_flash_price || 0
          };
        });
        
        setProducts(productsWithVisibility);
      }
    } catch (error) {
      console.error('Flash ürün yükleme hatası:', error);
      toast.error(error.message || 'Flash ürünler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    try {
      // Seçili ürünler veya tüm ürünler
      const productsToExport = selectedProducts.length > 0 
        ? products.filter(p => selectedProducts.includes(p.id))
        : products;
      
      // Orijinal Excel verisi yoksa standart dışa aktarma yap
      if (!originalExcelData) {
        // Bugünün tarihini al
        const today = new Date().toISOString().split('T')[0];
        // 30 gün sonrasını hesapla
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        const futureDateStr = futureDate.toISOString().split('T')[0];
        
        const excelData = productsToExport.map(product => {
          return {
            'Model Kodu': product.product_code || '',
            'Barkod': product.barcode || '',
            'Ürün Adı': product.title || '',
            'Kategori': product.category || '',
            'Marka': product.brand || '',
            'Stok': product.quantity || 0,
            'Mevcut Fiyat': product.sale_price || 0,
            'Mevcut Komisyon': product.commission || 0,
            'Güncellenecek Fiyat': product.sale_price || 0,
            'Seçenek 1 - Fiyat': product.option1_price || product.visibility5x.price || 0,
            'Seçenek 2 - Fiyat': product.option2_price || product.visibility8x.price || 0,
            'Senin Belirlediğin Flaş Fiyatı': selectedPrices[product.id] || 0,
            'Flaş Başlangıç Tarihi': today,
            'Flaş Bitiş Tarihi': product.flash_end_date ? new Date(product.flash_end_date).toISOString().split('T')[0] : futureDateStr,
            'Ürün Komisyon Tarife Seçeneği': '',
            'Kampanyalı Ürün': 'Evet'
          };
        });
        
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Flash Ürünler');
        
        // Sütun genişliklerini ayarla
        const colWidths = [
          { wch: 15 }, // Model Kodu
          { wch: 15 }, // Barkod
          { wch: 40 }, // Ürün Adı
          { wch: 15 }, // Kategori
          { wch: 15 }, // Marka
          { wch: 10 }, // Stok
          { wch: 15 }, // Mevcut Fiyat
          { wch: 15 }, // Mevcut Komisyon
          { wch: 15 }, // Güncellenecek Fiyat
          { wch: 15 }, // Seçenek 1 - Fiyat
          { wch: 15 }, // Seçenek 2 - Fiyat
          { wch: 20 }, // Senin Belirlediğin Flaş Fiyatı
          { wch: 20 }, // Flaş Başlangıç Tarihi
          { wch: 20 }, // Flaş Bitiş Tarihi
          { wch: 25 }, // Ürün Komisyon Tarife Seçeneği
          { wch: 15 }  // Kampanyalı Ürün
        ];
        
        ws['!cols'] = colWidths;
        
        // Dosya adını oluştur
        const fileName = `Flash_Urunler_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        XLSX.writeFile(wb, fileName);
        toast.success('Excel dosyası başarıyla indirildi.');
        return;
      }
      
      // Orijinal Excel verisi varsa, kullanıcı seçimlerini ekleyerek dışa aktar
      const updatedExcelData = originalExcelData.map(row => {
        // Barkod eşleşmesine göre ürünü bul
        const matchedProduct = productsToExport.find(p => {
          // Barkod karşılaştırması - virgülle ayrılmış barkodları da kontrol et
          const rowBarkod = row['Barkod'] || '';
          const productBarkod = p.barcode || '';
          
          if (rowBarkod === productBarkod) {
            return true;
          }
          
          // Virgülle ayrılmış barkodları kontrol et
          if (rowBarkod.includes(',')) {
            const barkodList = rowBarkod.split(',').map(b => b.trim());
            return barkodList.includes(productBarkod);
          }
          
          return false;
        });
        
        if (matchedProduct && selectedPrices[matchedProduct.id]) {
          // Kullanıcının seçtiği fiyatı "Senin Belirlediğin Flaş Fiyatı" sütununa ekle
          return {
            ...row,
            'Senin Belirlediğin Flaş Fiyatı': selectedPrices[matchedProduct.id]
          };
        }
        
        return row;
      });
      
      const ws = XLSX.utils.json_to_sheet(updatedExcelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Flash Ürünler');
      
      // Sütun genişliklerini ayarla
      const colWidths = [];
      // Orijinal Excel'deki sütun sayısına göre genişlikleri ayarla
      if (updatedExcelData.length > 0) {
        const firstRow = updatedExcelData[0];
        Object.keys(firstRow).forEach(key => {
          colWidths.push({ wch: Math.max(15, key.length) });
        });
      }
      
      if (colWidths.length > 0) {
        ws['!cols'] = colWidths;
      }
      
      // Dosya adını oluştur
      const fileName = `Flash_Urunler_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      XLSX.writeFile(wb, fileName);
      toast.success('Excel dosyası başarıyla indirildi.');
    } catch (error) {
      console.error('Excel oluşturma hatası:', error);
      toast.error('Excel dosyası oluşturulurken bir hata oluştu.');
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

        // Veri doğrulama ve temizleme
        const cleanedData = jsonData.map((row, index) => {
          // Tüm alanları string'e çevir ve boş değerleri temizle
          const cleanedRow = {};
          Object.keys(row).forEach(key => {
            cleanedRow[key] = row[key] !== null && row[key] !== undefined ? String(row[key]) : '';
          });
          
          // Barkod temizleme - virgülle ayrılmış barkodları işle
          let barcode = cleanedRow['Barkod'] || '';
          // Eğer birden fazla barkod varsa (virgülle ayrılmış), ilkini al
          if (barcode.includes(',')) {
            barcode = barcode.split(',')[0].trim();
          }
          
          // Tarih formatını düzeltme
          let flashStartDate = '';
          let flashEndDate = '';
          
          try {
            if (cleanedRow['Flaş Başlangıç Tarihi']) {
              // Excel tarih formatını kontrol et
              const startDateValue = cleanedRow['Flaş Başlangıç Tarihi'];
              if (!isNaN(startDateValue) && typeof startDateValue === 'string') {
                // Excel sayısal tarih formatı
                const excelDate = parseInt(startDateValue);
                if (!isNaN(excelDate)) {
                  const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
                  flashStartDate = jsDate.toISOString().split('T')[0];
                }
              } else {
                // Normal tarih string'i
                const tempDate = new Date(startDateValue);
                if (!isNaN(tempDate.getTime())) {
                  flashStartDate = tempDate.toISOString().split('T')[0];
                }
              }
            }
            
            if (cleanedRow['Flaş Bitiş Tarihi']) {
              // Excel tarih formatını kontrol et
              const endDateValue = cleanedRow['Flaş Bitiş Tarihi'];
              if (!isNaN(endDateValue) && typeof endDateValue === 'string') {
                // Excel sayısal tarih formatı
                const excelDate = parseInt(endDateValue);
                if (!isNaN(excelDate)) {
                  const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
                  flashEndDate = jsDate.toISOString().split('T')[0];
                }
              } else {
                // Normal tarih string'i
                const tempDate = new Date(endDateValue);
                if (!isNaN(tempDate.getTime())) {
                  flashEndDate = tempDate.toISOString().split('T')[0];
                }
              }
            }
          } catch (error) {
            console.error('Tarih dönüştürme hatası:', error);
          }
          
          // Varsayılan tarihler
          if (!flashStartDate) {
            flashStartDate = new Date().toISOString().split('T')[0];
          }
          
          if (!flashEndDate) {
            const defaultEndDate = new Date();
            defaultEndDate.setDate(defaultEndDate.getDate() + 30);
            flashEndDate = defaultEndDate.toISOString().split('T')[0];
          }
          
          // Gerekli alanları dönüştür
          return {
            id: `tmp_${Date.now()}_${index}`, // Geçici ID oluştur
            barcode: barcode,
            title: cleanedRow['Ürün Adı'] || '',
            brand: cleanedRow['Marka'] || '',
            category: cleanedRow['Kategori'] || '',
            quantity: parseInt(cleanedRow['Stok'] || '0'),
            sale_price: parseFloat(cleanedRow['Mevcut Fiyat'] || '0'),
            commission: parseFloat(cleanedRow['Mevcut Komisyon'] || '0'),
            option1_price: parseFloat(cleanedRow['Seçenek 1 - Fiyat'] || '0'),
            option2_price: parseFloat(cleanedRow['Seçenek 2 - Fiyat'] || '0'),
            selected_flash_price: parseFloat(cleanedRow['Senin Belirlediğin Flaş Fiyatı'] || '0'),
            flash_start_date: flashStartDate,
            flash_end_date: flashEndDate,
            product_code: cleanedRow['Model Kodu'] || ''
          };
        });

        // Geçici olarak backend'e veri gönderme işlemini atlayıp doğrudan state'e kaydet
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        console.log('Excel verilerini işleniyor:', cleanedData.length, 'ürün');
        
        // Veritabanına kaydetmek yerine doğrudan state'e ekle
        setProducts(prevProducts => {
          // Excel'den gelen ürünleri mevcut ürünlere ekle
          const updatedProducts = [...prevProducts];
          
          // Yeni ürünleri ekle
          cleanedData.forEach(newProduct => {
            // Eğer aynı barkodlu ürün varsa güncelle, yoksa ekle
            const existingIndex = updatedProducts.findIndex(p => p.barcode === newProduct.barcode);
            
            if (existingIndex >= 0) {
              updatedProducts[existingIndex] = {
                ...updatedProducts[existingIndex],
                ...newProduct
              };
            } else {
              updatedProducts.push(newProduct);
            }
          });
          
          return updatedProducts;
        });

        toast.success(`${cleanedData.length} flash ürün başarıyla işlendi ve tabloda gösterildi. (Veritabanına kaydedilmedi)`);
        
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

  // Ürün için fiyat seçimi
  const handleSelectPrice = (productId, price) => {
    setSelectedPrices(prev => ({
      ...prev,
      [productId]: price
    }));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const formatPrice = (price) => {
    return price?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) || '0 TL';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR');
  };

  const formatPercent = (value) => {
    if (!value && value !== 0) return '';
    return `%${value.toFixed(2)}`;
  };

  const getDiscountBadgeClass = (discountRate) => {
    if (discountRate >= 50) return 'bg-red-100 text-red-800';
    if (discountRate >= 30) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  const getProfitDiffClass = (diff) => {
    if (diff > 0) return 'bg-green-100 text-green-800';
    if (diff < 0) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const handleSelectVisibilityOption = (option) => {
    setSelectedVisibilityOption(prev => prev === option ? null : option);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sıralama işlevi
  const sortedProducts = React.useMemo(() => {
    let sortableProducts = [...products];
    if (sortConfig.key) {
      sortableProducts.sort((a, b) => {
        // Nested property için (örn: visibility5x.price)
        if (sortConfig.key.includes('.')) {
          const [parent, child] = sortConfig.key.split('.');
          if (!a[parent] || !b[parent]) return 0;
          
          if (a[parent][child] < b[parent][child]) {
            return sortConfig.direction === 'asc' ? -1 : 1;
          }
          if (a[parent][child] > b[parent][child]) {
            return sortConfig.direction === 'asc' ? 1 : -1;
          }
          return 0;
        }
        
        // Normal property için
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableProducts;
  }, [products, sortConfig]);

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <FaSort className="ml-1 text-gray-400" />;
    }
    
    return sortConfig.direction === 'asc' ? <FaSortUp className="ml-1 text-indigo-600" /> : <FaSortDown className="ml-1 text-indigo-600" />;
  };

  // Sayfalama işlevleri
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Sayfa sonunda görünmesi gereken sayfalama bileşeni
  const PaginationComponent = () => {
    const totalPages = Math.ceil(sortedProducts.length / pageSize);
    const hasNext = currentPage < totalPages;
    const totalElements = sortedProducts.length;

    return (
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>
              {' '}-{' '}
              <span className="font-medium">{Math.min(currentPage * pageSize, totalElements)}</span>
              {' '}/ {' '}
              <span className="font-medium">{totalElements}</span>
              {' '}ürün gösteriliyor
            </p>
          </div>
          <div className="mt-3 sm:mt-0">
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
              <h1 className="text-2xl font-bold text-gray-900">Flash Ürünler Görünürlük Analizi</h1>
              <p className="mt-1 text-sm text-gray-600">
                Trendyol'daki flash ürünlerinizin görünürlük artışı ve kar analizini yapın
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
                {selectedProducts.length > 0 && ` (${selectedProducts.length})`}
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
            <p className="text-gray-500">Henüz flash ürün bulunmuyor. Excel dosyası yükleyerek başlayabilirsiniz.</p>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={selectedProducts.length === products.length && products.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th 
                      scope="col" 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('title')}
                    >
                      <div className="flex items-center">
                        Ürün Bilgisi
                        {getSortIcon('title')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('quantity')}
                    >
                      <div className="flex items-center">
                        Stok
                        {getSortIcon('quantity')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('sale_price')}
                    >
                      <div className="flex items-center">
                        Mevcut Fiyat
                        {getSortIcon('sale_price')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center">
                        Güncellenecek Fiyat
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : sortedProducts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                        Ürün bulunamadı
                      </td>
                    </tr>
                  ) : (
                    // Sayfalama için slice işlemi
                    sortedProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((product) => (
                      <React.Fragment key={product.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-2 py-4">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              checked={selectedProducts.includes(product.id)}
                              onChange={() => handleSelectProduct(product.id)}
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img
                                  className="h-10 w-10 rounded-md object-cover"
                                  src={product.image_url || 'https://placehold.co/100x100/eee/999?text=Ürün'}
                                  alt={product.title}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://placehold.co/100x100/eee/999?text=Ürün';
                                  }}
                                />
                              </div>
                              <div className="ml-4 max-w-xs">
                                <div className="text-sm font-medium text-gray-900 truncate">{product.title}</div>
                                <div className="text-sm text-gray-500">
                                  {product.brand && <span>{product.brand}</span>}
                                  {product.category && <span> • {product.category}</span>}
                                </div>
                                <div className="text-xs text-gray-400">
                                  Barkod: {product.barcode}
                                  {product.product_code && <span> • Model Kodu: {product.product_code}</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-900">{product.quantity}</div>
                            {product.quantity < 10 && (
                              <div className="text-xs text-red-500">Düşük Stok</div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900">{formatPrice(product.sale_price)}</div>
                            <div className="text-xs text-gray-500">Komisyon {product.commission}%</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {selectedPrices[product.id] ? formatPrice(selectedPrices[product.id]) : 'Seçilmedi'}
                            </div>
                          </td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td></td>
                          <td colSpan="4" className="px-4 py-2">
                            <div className="flex space-x-4">
                              <button
                                onClick={() => handleSelectPrice(product.id, product.option1_price || 0)}
                                className={`px-4 py-2 text-xs rounded-lg flex-1 ${selectedPrices[product.id] === (product.option1_price || 0) ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}
                              >
                                <div className="flex flex-col items-center">
                                  <span className="text-sm font-medium mb-1">5 Kata Kadar Görünürlük Artışı</span>
                                  <span className="text-base font-bold">{formatPrice(product.option1_price || 0)}</span>
                                  {product.visibility5x ? (
                                    <span className={`text-xs mt-2 px-2 py-0.5 rounded-full ${product.visibility5x.isProfitable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                      {product.visibility5x.isProfitable ? `Kar: ${formatPrice(product.visibility5x.profit)}` : `Zarar: ${formatPrice(Math.abs(product.visibility5x.profit))}`}
                                    </span>
                                  ) : (
                                    <span className="text-xs mt-2 px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">
                                      Kar/Zarar hesaplanamadı
                                    </span>
                                  )}
                                </div>
                              </button>
                              <button
                                onClick={() => handleSelectPrice(product.id, product.option2_price || 0)}
                                className={`px-4 py-2 text-xs rounded-lg flex-1 ${selectedPrices[product.id] === (product.option2_price || 0) ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}
                              >
                                <div className="flex flex-col items-center">
                                  <span className="text-sm font-medium mb-1">8 Kata Kadar Görünürlük Artışı</span>
                                  <span className="text-base font-bold">{formatPrice(product.option2_price || 0)}</span>
                                  {product.visibility8x ? (
                                    <span className={`text-xs mt-2 px-2 py-0.5 rounded-full ${product.visibility8x.isProfitable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                      {product.visibility8x.isProfitable ? `Kar: ${formatPrice(product.visibility8x.profit)}` : `Zarar: ${formatPrice(Math.abs(product.visibility8x.profit))}`}
                                    </span>
                                  ) : (
                                    <span className="text-xs mt-2 px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">
                                      Kar/Zarar hesaplanamadı
                                    </span>
                                  )}
                                </div>
                              </button>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Sayfalama bileşeni */}
            {sortedProducts.length > 0 && <PaginationComponent />}
          </div>
        )}

        {/* Bilgi Notu */}
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-blue-800 mb-2">Flash Ürün Excel Formatı</h3>
          <p className="text-sm text-blue-700">
            Excel dosyasında aşağıdaki sütunlar bulunmalıdır:
          </p>
          <ul className="text-sm text-blue-700 list-disc pl-5 mt-2">
            <li>Model Kodu</li>
            <li>Barkod</li>
            <li>Ürün Adı</li>
            <li>Kategori</li>
            <li>Marka</li>
            <li>Stok</li>
            <li>Mevcut Fiyat</li>
            <li>Mevcut Komisyon</li>
            <li>Güncellenecek Fiyat</li>
            <li>Seçenek 1 - Fiyat</li>
            <li>Seçenek 2 - Fiyat</li>
            <li>Senin Belirlediğin Flaş Fiyatı</li>
            <li>Flaş Başlangıç Tarihi</li>
            <li>Flaş Bitiş Tarihi</li>
            <li>Ürün Komisyon Tarife Seçeneği</li>
            <li>Kampanyalı Ürün</li>
          </ul>
          <p className="text-sm text-blue-700 mt-2">
            <strong>Not:</strong> Ürünler için fiyat seçeneklerinden birini seçtikten sonra Excel'i indirdiğinizde, seçtiğiniz fiyatlar "Senin Belirlediğin Flaş Fiyatı" sütununa kaydedilecektir.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default FlashProducts; 