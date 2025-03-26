import React, { useState, useEffect } from 'react';
import { FaSync, FaSearch, FaArrowUp, FaArrowDown, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const ProductProfit = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'profit', direction: 'desc' });
  const [stats, setStats] = useState({
    totalProducts: 0,
    profitableProducts: 0,
    unprofitableProducts: 0,
    averageProfitMargin: 0,
    totalProfit: 0
  });
  // Kar/Zarar Filtresi - "all", "profit", "loss"
  const [profitFilter, setProfitFilter] = useState('all');
  // Sayfalama için gerekli state'ler
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  
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

      const response = await fetch('http://localhost:5000/api/trendyol/product-profit', {
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
        setProducts(data.products);
        setTotalElements(data.products.length);
        const calculatedTotalPages = Math.ceil(data.products.length / size);
        setTotalPages(calculatedTotalPages);
        setHasNext(page < calculatedTotalPages - 1);
        calculateStats(data.products);
      }
    } catch (error) {
      console.error('Ürün yükleme hatası:', error);
      toast.error(error.message || 'Ürünler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // İstatistikleri hesapla
  const calculateStats = (productList) => {
    const totalProducts = productList.length;
    const profitableProducts = productList.filter(p => p.profit > 0).length;
    const unprofitableProducts = totalProducts - profitableProducts;
    
    const totalProfit = productList.reduce((sum, product) => sum + product.profit, 0);
    const averageProfitMargin = totalProducts > 0 
      ? productList.reduce((sum, product) => sum + product.profitMargin, 0) / totalProducts 
      : 0;

    setStats({
      totalProducts,
      profitableProducts,
      unprofitableProducts,
      averageProfitMargin: parseFloat(averageProfitMargin.toFixed(2)),
      totalProfit: parseFloat(totalProfit.toFixed(2))
    });
  };

  // Kar/Zarar filtreleme işlevi
  const handleProfitFilterChange = (filter) => {
    setProfitFilter(filter);
    // Filtre değiştiğinde sayfalamayı da sıfırla
    setPage(0);
  };

  // Sıralama işlevi
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sayfa değiştirme işlevi
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Filtreleme işlevi
  const filteredProducts = products.filter(product => {
    // Önce metin araması yap
    const textMatch = (
      product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Sonra kar/zarar filtresi uygula
    let profitMatch = true;
    if (profitFilter === 'profit') {
      profitMatch = product.profit > 0;
    } else if (profitFilter === 'loss') {
      profitMatch = product.profit <= 0;
    }
    
    return textMatch && profitMatch;
  });

  // Sıralama işlevi
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Fiyat formatı
  const formatPrice = (price) => {
    return price?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) || '0 TL';
  };

  // Yüzde formatı
  const formatPercent = (value) => {
    return `${(value * 100).toFixed(2)}%`;
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

  useEffect(() => {
    fetchProducts();
  }, []);

  // Sayfalama sonrası gösterilecek ürünleri hesapla
  const currentPageProducts = sortedProducts.slice(page * size, (page + 1) * size);

  // Sayfalama bilgilerini güncelle
  useEffect(() => {
    setTotalElements(filteredProducts.length);
    const calculatedTotalPages = Math.ceil(filteredProducts.length / size);
    setTotalPages(calculatedTotalPages);
    setHasNext(page < calculatedTotalPages - 1);
    
    // Eğer mevcut sayfa, toplam sayfa sayısından büyükse, son sayfaya git
    if (calculatedTotalPages > 0 && page >= calculatedTotalPages) {
      setPage(calculatedTotalPages - 1);
    }
  }, [filteredProducts, size, page]);

  return (
    <Layout>
      <div className="p-4 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ürün Kar Analizi</h1>
              <p className="mt-1 text-sm text-gray-600">
                Satıştaki ürünlerin kar/zarar durumu ve detaylı analizi
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchProducts}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <FaSync className={`mr-2 h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                Yenile
              </button>
            </div>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-sm font-medium text-gray-500">Toplam Ürün</div>
            <div className="mt-1 text-2xl font-semibold">{stats.totalProducts}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm cursor-pointer" 
               onClick={() => handleProfitFilterChange('profit')}
               title="Karlı ürünleri filtrele">
            <div className="text-sm font-medium text-gray-500">Karlı Ürün</div>
            <div className="mt-1 text-2xl font-semibold text-green-600">{stats.profitableProducts}</div>
            {profitFilter === 'profit' && <div className="mt-1 text-xs text-green-600">✓ Filtrelenmiş</div>}
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm cursor-pointer"
               onClick={() => handleProfitFilterChange('loss')}
               title="Zarar eden ürünleri filtrele">
            <div className="text-sm font-medium text-gray-500">Zarardaki Ürün</div>
            <div className="mt-1 text-2xl font-semibold text-red-600">{stats.unprofitableProducts}</div>
            {profitFilter === 'loss' && <div className="mt-1 text-xs text-red-600">✓ Filtrelenmiş</div>}
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-sm font-medium text-gray-500">Ort. Kar Marjı</div>
            <div className="mt-1 text-2xl font-semibold">{formatPercent(stats.averageProfitMargin / 100)}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-sm font-medium text-gray-500">Toplam Kar</div>
            <div className="mt-1 text-2xl font-semibold">{formatPrice(stats.totalProfit)}</div>
          </div>
        </div>

        {/* Arama ve Filtreler */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-grow">
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Barkod, ürün adı veya marka ile arama yapın..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            <div className="flex-shrink-0">
              <select
                value={profitFilter}
                onChange={(e) => handleProfitFilterChange(e.target.value)}
                className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">Tüm Ürünler</option>
                <option value="profit">Sadece Kar Eden</option>
                <option value="loss">Sadece Zarar Eden</option>
              </select>
            </div>
          </div>
          
          {profitFilter !== 'all' && (
            <div className="mt-2 flex items-center">
              <span className={`text-sm ${profitFilter === 'profit' ? 'text-green-600' : 'text-red-600'}`}>
                {profitFilter === 'profit' ? 'Kar eden ürünler gösteriliyor' : 'Zarar eden ürünler gösteriliyor'}
              </span>
              <button 
                className="ml-2 text-gray-600 hover:text-gray-800" 
                onClick={() => handleProfitFilterChange('all')}
                title="Filtreyi kaldır"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm text-center">
            <p className="text-gray-500">Henüz ürün bulunmuyor.</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm text-center">
            <p className="text-gray-500">Arama kriterlerine uygun ürün bulunamadı.</p>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('title')}
                    >
                      <div className="flex items-center">
                        Ürün Bilgisi
                        {sortConfig.key === 'title' && (
                          sortConfig.direction === 'asc' ? <FaArrowUp className="ml-1" /> : <FaArrowDown className="ml-1" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('salePrice')}
                    >
                      <div className="flex items-center">
                        Satış Fiyatı
                        {sortConfig.key === 'salePrice' && (
                          sortConfig.direction === 'asc' ? <FaArrowUp className="ml-1" /> : <FaArrowDown className="ml-1" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('originalPrice')}
                    >
                      <div className="flex items-center">
                        Maliyet
                        {sortConfig.key === 'originalPrice' && (
                          sortConfig.direction === 'asc' ? <FaArrowUp className="ml-1" /> : <FaArrowDown className="ml-1" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('profit')}
                    >
                      <div className="flex items-center">
                        Kar
                        {sortConfig.key === 'profit' && (
                          sortConfig.direction === 'asc' ? <FaArrowUp className="ml-1" /> : <FaArrowDown className="ml-1" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('profitMargin')}
                    >
                      <div className="flex items-center">
                        Kar Marjı
                        {sortConfig.key === 'profitMargin' && (
                          sortConfig.direction === 'asc' ? <FaArrowUp className="ml-1" /> : <FaArrowDown className="ml-1" />
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentPageProducts.map((product) => (
                    <tr key={product.id || product.barcode} className={`hover:bg-gray-50 ${product.profit < 0 ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {(product.image || (product.images && product.images[0])) && (
                            <div className="flex-shrink-0 h-10 w-10 mr-4">
                              <img 
                                className="h-10 w-10 rounded-full object-cover" 
                                src={product.image || (typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.url)}
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
                              {product.barcode}
                            </div>
                            <div className="text-xs text-gray-500">
                              {product.brand || 'Marka Bilgisi Yok'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatPrice(product.salePrice || product.sale_price)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatPrice(product.originalPrice || product.cost || product.original_price)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${product.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPrice(product.profit)}
                          {product.profit < 0 && (
                            <FaExclamationTriangle className="inline-block ml-1 text-red-500" title="Bu ürünün satışı zararda!" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${product.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(product.profitMargin)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleExportToSheets(product)}
                          className="text-indigo-600 hover:text-indigo-900 hover:underline"
                        >
                          Detaylı Analiz
                        </button>
                      </td>
                    </tr>
                  ))}
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

        {/* Bilgi Kutusu */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-medium text-blue-800 mb-2">Kar Hesaplama Formülü</h3>
          <p className="text-sm text-blue-700">
            Kar = Satış Fiyatı - Ürün Maliyeti - Komisyon - Kargo Ücreti - Platform Hizmet Bedeli - Net KDV
          </p>
          <p className="text-sm text-blue-700 mt-2">
            <strong>Not:</strong> Ürünün maliyeti, yapılan ayarlar sayfasında girdiğiniz değerlerden alınmaktadır. Maliyeti ayarlanmamış ürünler için kar hesabı yapılamaz.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default ProductProfit; 