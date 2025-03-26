import React, { useState, useEffect, useContext } from 'react';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [size] = useState(10); // 10 ürün göster
    const [totalProducts, setTotalProducts] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [retryTimeout, setRetryTimeout] = useState(null);
    const navigate = useNavigate();
    const { isAuthenticated } = useContext(AuthContext);

    const fetchProducts = async (isRetry = false) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            // Eğer retry timeout varsa temizle
            if (retryTimeout) {
                clearTimeout(retryTimeout);
                setRetryTimeout(null);
            }

            // Sadece ilk yüklemede API bilgilerini kontrol et
            if (isInitialLoad) {
                const apiResponse = await fetch('http://localhost:5000/settings/api', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!apiResponse.ok) {
                    if (apiResponse.status === 401) {
                        localStorage.removeItem('token');
                        navigate('/login');
                        return;
                    }
                    const errorData = await apiResponse.json();
                    throw new Error(errorData.message || 'API bilgileri alınamadı');
                }

                const apiData = await apiResponse.json();
                if (!apiData.seller_id || !apiData.api_key || !apiData.api_secret) {
                    toast.error('Lütfen önce API bilgilerinizi ayarlayın!');
                    navigate('/settings');
                    return;
                }
                setIsInitialLoad(false);
            }

            // Ürünleri getir
            const response = await fetch(`http://localhost:5000/api/trendyol/products?page=${page}&size=${size}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    if (data.error === 'CLIENT_API_BUSINESS_EXCEPTION') {
                        toast.error('API bilgileriniz geçersiz. Lütfen kontrol edin.');
                        navigate('/settings');
                        return;
                    }
                    localStorage.removeItem('token');
                    navigate('/login');
                    return;
                }

                if (response.status === 429) {
                    const retryAfter = data.retryAfter || 60;
                    
                    if (!isRetry) {
                        toast.warning(`İstek limiti aşıldı. ${retryAfter} saniye sonra otomatik olarak tekrar denenecek.`);
                        
                        // Otomatik yeniden deneme için timeout ayarla
                        const timeout = setTimeout(() => {
                            fetchProducts(true);
                        }, retryAfter * 1000);
                        
                        setRetryTimeout(timeout);
                    }
                    return;
                }

                throw new Error(data.message || 'Ürünler yüklenirken bir hata oluştu');
            }

            handleResponse(data);

        } catch (error) {
            console.error('Ürünler yüklenirken hata:', error);
            toast.error(error.message || 'Ürünler yüklenirken bir hata oluştu');
            
            // API bilgileri hatası durumunda ayarlar sayfasına yönlendir
            if (error.message?.includes('API bilgileri')) {
                navigate('/settings');
            }
        } finally {
            setLoading(false);
        }
    };

    // Yanıt işleme
    const handleResponse = (data) => {
        setProducts(data.products || []);
        setTotalProducts(data.totalElements || 0);
        setTotalPages(data.totalPages || 0);
        setHasNext(data.hasNext || false);
    };

    // Sayfa yüklendiğinde ve auth durumu değiştiğinde çalışır
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        // Temizleme fonksiyonu
        return () => {
            if (retryTimeout) {
                clearTimeout(retryTimeout);
            }
        };
    }, [isAuthenticated, navigate]);

    // Sadece sayfa yüklendiğinde ve sayfa/boyut değiştiğinde ürünleri getir
    useEffect(() => {
        if (isAuthenticated) {
            fetchProducts();
        }
    }, [page, size]);

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleString('tr-TR');
    };

    const formatPrice = (price) => {
        return price?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) || '0 TL';
    };

    // Sayfa numaralarını oluştur
    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxVisiblePages = 5; // Görünecek maksimum sayfa sayısı
        let startPage = Math.max(0, Math.min(page - Math.floor(maxVisiblePages / 2), totalPages - maxVisiblePages));
        let endPage = Math.min(startPage + maxVisiblePages, totalPages);

        if (endPage - startPage < maxVisiblePages) {
            startPage = Math.max(0, endPage - maxVisiblePages);
        }

        for (let i = startPage; i < endPage; i++) {
            pageNumbers.push(i);
        }

        return pageNumbers;
    };

    return (
        <Layout>
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Ürünler</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Toplam {totalProducts} ürün | Sayfa {page + 1} / {totalPages}
                        </p>
                    </div>
                    <button
                        onClick={() => fetchProducts()}
                        disabled={loading || retryTimeout !== null}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {retryTimeout !== null ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Yeniden Deneniyor...
                            </>
                        ) : (
                            <>
                                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Yenile
                            </>
                        )}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">Henüz ürün bulunmuyor.</p>
                </div>
            ) : (
                <>
                    {/* Ürün Tablosu */}
                    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ürün
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Barkod
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Stok
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Fiyatlar
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Durum
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Son Güncelleme
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {products.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <img 
                                                            className="h-10 w-10 rounded-md object-cover" 
                                                            src={product.images[0]?.url || 'https://placehold.co/100x100/eee/999?text=Ürün'} 
                                                            alt={product.title} 
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = 'https://placehold.co/100x100/eee/999?text=Ürün';
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {product.title}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {product.brand} - {product.categoryName}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            {product.gender} | {product.color} | {product.size}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{product.barcode}</div>
                                                <div className="text-xs text-gray-500">Stok Kodu: {product.stockCode}</div>
                                                <div className="text-xs text-gray-500">Ürün Kodu: {product.productCode}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{product.quantity} {product.stockUnitType}</div>
                                                {product.quantity < 10 && (
                                                    <div className="text-xs text-red-500">Düşük Stok</div>
                                                )}
                                                <div className="text-xs text-gray-500">
                                                    Kargo Ağırlığı: {product.dimensionalWeight} kg
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    Liste: {formatPrice(product.listPrice)}
                                                </div>
                                                <div className="text-sm text-green-600">
                                                    Satış: {formatPrice(product.salePrice)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    KDV: %{product.vatRate}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="space-y-1">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        product.approved 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {product.approved ? 'Onaylı' : 'Onay Bekliyor'}
                                                    </span>
                                                    {product.onSale && (
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                            Satışta
                                                        </span>
                                                    )}
                                                    {product.hasActiveCampaign && (
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                            Kampanyalı
                                                        </span>
                                                    )}
                                                    {product.archived && (
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                            Arşivlenmiş
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div>{formatDate(product.lastUpdateDate)}</div>
                                                <div className="text-xs text-gray-400">
                                                    Oluşturma: {formatDate(product.createDateTime)}
                                                </div>
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
                                        <span className="font-medium">{Math.min((page + 1) * size, totalProducts)}</span>
                                        {' '}/ {' '}
                                        <span className="font-medium">{totalProducts}</span>
                                        {' '}ürün gösteriliyor
                                    </p>
                                </div>
                                <div className="mt-3 sm:mt-0">
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                        <button
                                            onClick={() => setPage(0)}
                                            disabled={page === 0 || loading}
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">İlk Sayfa</span>
                                            ««
                                        </button>
                                        <button
                                            onClick={() => setPage(Math.max(0, page - 1))}
                                            disabled={page === 0 || loading}
                                            className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Önceki</span>
                                            «
                                        </button>
                                        {getPageNumbers().map((pageNum) => (
                                            <button
                                                key={pageNum}
                                                onClick={() => setPage(pageNum)}
                                                disabled={loading}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                    page === pageNum
                                                        ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                }`}
                                            >
                                                {pageNum + 1}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setPage(page + 1)}
                                            disabled={!hasNext || loading}
                                            className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Sonraki</span>
                                            »
                                        </button>
                                        <button
                                            onClick={() => setPage(totalPages - 1)}
                                            disabled={page === totalPages - 1 || loading}
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Son Sayfa</span>
                                            »»
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </Layout>
    );
};

export default Products; 