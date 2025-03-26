import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Stock = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stockFilter, setStockFilter] = useState('all'); // all, low, high
    const [sortBy, setSortBy] = useState('stock'); // stock, name, price
    const [syncing, setSyncing] = useState(false);
    const [lastSync, setLastSync] = useState(null);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [itemsPerPage] = useState(10);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProducts();
        const interval = setInterval(fetchProducts, 5 * 60 * 1000); // 5 dakika
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let filtered = [...products];

        // Stok filtreleme
        switch (stockFilter) {
            case 'low':
                filtered = filtered.filter(product => {
                    const quantity = parseInt(product.quantity) || 0;
                    return quantity > 0 && quantity < 10;
                });
                break;
            case 'high':
                filtered = filtered.filter(product => {
                    const quantity = parseInt(product.quantity) || 0;
                    return quantity >= 10;
                });
                break;
            default:
                break;
        }

        // Sıralama
        filtered.sort((a, b) => {
            const quantityA = parseInt(a.quantity) || 0;
            const quantityB = parseInt(b.quantity) || 0;

            switch (sortBy) {
                case 'stock':
                    return quantityA - quantityB;
                case 'name':
                    return a.title.localeCompare(b.title);
                case 'price':
                    const priceA = parseFloat(a.salePrice) || 0;
                    const priceB = parseFloat(b.salePrice) || 0;
                    return priceA - priceB;
                default:
                    return 0;
            }
        });

        setFilteredProducts(filtered);
        setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    }, [products, stockFilter, sortBy, itemsPerPage]);

    const fetchProducts = async () => {
        try {
            setError(null);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch('http://localhost:5000/api/trendyol/products', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ürünler yüklenirken bir hata oluştu');
            }

            const data = await response.json();
            if (Array.isArray(data.products)) {
                setProducts(data.products);
                setLastSync(new Date());
            } else {
                throw new Error('Geçersiz veri formatı');
            }
        } catch (error) {
            console.error('Ürünler yüklenirken hata oluştu:', error);
            setError(error.message);
            toast.error(error.message || 'Ürünler yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const syncProducts = async () => {
        try {
            setSyncing(true);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch('http://localhost:5000/api/trendyol/sync', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Ürünler senkronize edilirken bir hata oluştu');
            }

            const data = await response.json();
            toast.success(`${data.totalSynced} ürün başarıyla senkronize edildi`);
            await fetchProducts();
        } catch (error) {
            console.error('Senkronizasyon hatası:', error);
            toast.error('Ürünler senkronize edilirken bir hata oluştu');
        } finally {
            setSyncing(false);
        }
    };

    const getPageProducts = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredProducts.slice(startIndex, endIndex);
    };

    // Sayfa değiştirme fonksiyonu
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo(0, 0);
    };

    // Sayfalama butonları komponenti
    const Pagination = () => {
        return (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                            <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                            {' '}-{' '}
                            <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span>
                            {' '}/ {' '}
                            <span className="font-medium">{filteredProducts.length}</span>
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
                                disabled={currentPage === totalPages || totalPages === 0}
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

    const getStockStatus = (stock) => {
        if (stock === 0) return { text: 'Stokta Yok', color: 'bg-red-100 text-red-800' };
        if (stock < 10) return { text: 'Düşük Stok', color: 'bg-yellow-100 text-yellow-800' };
        return { text: 'Stok Yeterli', color: 'bg-green-100 text-green-800' };
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-6">
                <div className="mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">Stok Yönetimi</h1>
                            <p className="mt-2 text-sm text-gray-600">
                                Toplam {products.length} ürün bulunmaktadır
                                {lastSync && (
                                    <span className="ml-2 text-gray-400">
                                        (Son güncelleme: {formatDate(lastSync)})
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={fetchProducts}
                                disabled={loading}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Yenile
                            </button>
                            <button
                                onClick={syncProducts}
                                disabled={syncing}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {syncing ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Senkronize Ediliyor...
                                    </>
                                ) : (
                                    <>
                                        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                        </svg>
                                        Trendyol ile Senkronize Et
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 mb-6">
                    <select
                        value={stockFilter}
                        onChange={(e) => setStockFilter(e.target.value)}
                        className="block w-48 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="all">Tüm Stoklar</option>
                        <option value="low">Düşük Stok</option>
                        <option value="high">Yeterli Stok</option>
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="block w-48 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="stock">Stok Miktarına Göre</option>
                        <option value="name">İsme Göre</option>
                        <option value="price">Fiyata Göre</option>
                    </select>
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
                                                Stok Durumu
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Barkod
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
                                        {getPageProducts().map((product) => {
                                            const stockStatus = getStockStatus(product.quantity);
                                            return (
                                                <tr key={product.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                <img 
                                                                    className="h-10 w-10 rounded-md object-cover" 
                                                                    src={product.images && product.images[0] ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url) : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNFRUVFRUUiLz48cGF0aCBkPSJNMjAgMTJDMTcuNzkgMTIgMTYgMTMuNzkgMTYgMTZDMTYgMTguMjEgMTcuNzkgMjAgMjAgMjBDMjIuMjEgMjAgMjQgMTguMjEgMjQgMTZDMjQgMTMuNzkgMjIuMjEgMTIgMjAgMTJaTTIwIDE4QzE4LjkgMTggMTggMTcuMSAxOCAxNkMxOCAxNC45IDE4LjkgMTQgMjAgMTRDMjEuMSAxNCAyMiAxNC45IDIyIDE2QzIyIDE3LjEgMjEuMSAxOCAyMCAxOFoiIGZpbGw9IiM5OTk5OTkiLz48cGF0aCBkPSJNMjAgMjJDMTYuNjcgMjIgMTQgMjQuNjcgMTQgMjhIMTZDMTYgMjUuNzkgMTcuNzkgMjQgMjAgMjRDMjIuMjEgMjQgMjQgMjUuNzkgMjQgMjhIMjZDMjYgMjQuNjcgMjMuMzMgMjIgMjAgMjJaIiBmaWxsPSIjOTk5OTk5Ii8+PC9zdmc+'} 
                                                                    alt={product.title}
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNFRUVFRUUiLz48cGF0aCBkPSJNMjAgMTJDMTcuNzkgMTIgMTYgMTMuNzkgMTYgMTZDMTYgMTguMjEgMTcuNzkgMjAgMjAgMjBDMjIuMjEgMjAgMjQgMTguMjEgMjQgMTZDMjQgMTMuNzkgMjIuMjEgMTIgMjAgMTJaTTIwIDE4QzE4LjkgMTggMTggMTcuMSAxOCAxNkMxOCAxNC45IDE4LjkgMTQgMjAgMTRDMjEuMSAxNCAyMiAxNC45IDIyIDE2QzIyIDE3LjEgMjEuMSAxOCAyMCAxOFoiIGZpbGw9IiM5OTk5OTkiLz48cGF0aCBkPSJNMjAgMjJDMTYuNjcgMjIgMTQgMjQuNjcgMTQgMjhIMTZDMTYgMjUuNzkgMTcuNzkgMjQgMjAgMjRDMjIuMjEgMjQgMjQgMjUuNzkgMjQgMjhIMjZDMjYgMjQuNjcgMjMuMzMgMjIgMjAgMjJaIiBmaWxsPSIjOTk5OTk5Ii8+PC9zdmc+';
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
                                                        <div className="mb-1">
                                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                                                                {stockStatus.text}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {product.quantity} {product.stockUnitType}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            Kargo Ağırlığı: {product.dimensionalWeight} kg
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{product.barcode}</div>
                                                        <div className="text-xs text-gray-500">Stok Kodu: {product.stockCode}</div>
                                                        <div className="text-xs text-gray-500">Ürün Kodu: {product.productCode}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            Liste: {product.listPrice?.toFixed(2)} TL
                                                        </div>
                                                        <div className="text-sm text-green-600">
                                                            Satış: {product.salePrice?.toFixed(2)} TL
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
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Sayfalama */}
                            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                                            {' '}-{' '}
                                            <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span>
                                            {' '}/ {' '}
                                            <span className="font-medium">{filteredProducts.length}</span>
                                            {' '}ürün gösteriliyor
                                        </p>
                                    </div>
                                    <div className="mt-3 sm:mt-0">
                                        <Pagination />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
};

export default Stock; 