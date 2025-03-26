import React, { useState, useEffect, useContext } from 'react';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const [stats, setStats] = useState({
        orders: {
            total: 0,
            new: 0,
            preparing: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0
        },
        products: {
            total: 0,
            active: 0,
            lowStock: 0,
            outOfStock: 0
        },
        revenue: {
            today: 0,
            thisWeek: 0,
            thisMonth: 0,
            lastMonth: 0,
            total: 0,
            averageOrder: 0,
            monthlyGrowth: 0,
            totalProfit: 0,
            deliveredOrdersCount: 0
        },
        topProducts: []
    });

    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        fetchDashboardStats();
        const interval = setInterval(fetchDashboardStats, 5 * 60 * 1000); // 5 dakika
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                logout();
                navigate('/login');
                return;
            }

            const response = await fetch('http://localhost:5000/api/dashboard/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                logout();
                navigate('/login');
                return;
            }

            if (!response.ok) {
                throw new Error('İstatistikler alınırken bir hata oluştu');
            }

            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('İstatistikler alınırken hata:', error);
            toast.error(error.message);
        }
    };

    const formatPrice = (price) => {
        return parseFloat(price).toLocaleString('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        });
    };

    return (
        <Layout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                    <div className="text-sm text-gray-500">
                        Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}
                    </div>
                </div>

                {/* Özet Kartları */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Toplam Gelir</h3>
                        <p className="text-3xl font-bold text-indigo-600">{formatPrice(stats.revenue.total)}</p>
                        <div className="mt-2 text-sm flex items-center">
                            <span className="text-gray-500 mr-1">Aylık Büyüme:</span>
                            <div className={`flex items-center ${stats.revenue.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {stats.revenue.monthlyGrowth >= 0 ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                                <span className="font-medium">{Math.abs(stats.revenue.monthlyGrowth)}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Toplam Kar</h3>
                        <p className={`text-3xl font-bold ${stats.revenue.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPrice(stats.revenue.totalProfit || 0)}
                        </p>
                        <div className="mt-2 text-sm text-gray-500">
                            Teslim Edilen: {stats.revenue.deliveredOrdersCount || 0} sipariş
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Toplam Sipariş</h3>
                        <p className="text-3xl font-bold text-blue-600">{stats.orders.total}</p>
                        <div className="mt-2 text-sm text-gray-500">
                            Ortalama Sipariş: {formatPrice(stats.revenue.averageOrder)}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Aktif Ürünler</h3>
                        <p className="text-3xl font-bold text-green-600">{stats.products.active}</p>
                        <div className="mt-2 text-sm text-gray-500">
                            Stok Uyarısı: {stats.products.lowStock} ürün
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Bu Ay</h3>
                        <p className="text-3xl font-bold text-purple-600">{formatPrice(stats.revenue.thisMonth)}</p>
                        <div className="mt-2 text-sm text-gray-500">
                            Geçen Ay: {formatPrice(stats.revenue.lastMonth)}
                        </div>
                    </div>
                </div>

                {/* Sipariş Durumu */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Sipariş Durumu</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Yeni</span>
                                <span className="font-semibold">{stats.orders.new}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Hazırlanıyor</span>
                                <span className="font-semibold">{stats.orders.preparing}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Kargoda</span>
                                <span className="font-semibold">{stats.orders.shipped}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Teslim Edildi</span>
                                <span className="font-semibold">{stats.orders.delivered}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">İptal Edildi</span>
                                <span className="font-semibold text-red-500">{stats.orders.cancelled}</span>
                            </div>
                        </div>
                    </div>

                    {/* En Çok Satan Ürünler */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">En Çok Satan Ürünler</h2>
                        <div className="space-y-4">
                            {stats.topProducts.map((product, index) => (
                                <div key={product.productCode} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                                    <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
                                    <div className="mt-1 flex justify-between items-center">
                                        <div className="flex items-center space-x-4">
                                            <span className="text-sm text-gray-600">
                                                Stok: {product.currentStock}
                                            </span>
                                            <span className="text-sm font-medium text-indigo-600">
                                                ₺{new Intl.NumberFormat('tr-TR').format(product.totalRevenue)}
                                            </span>
                                        </div>
                                        {product.salesCount > 0 && (
                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                                {product.salesCount} satış
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Stok Durumu */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Stok Durumu</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="p-4 border rounded-lg">
                            <div className="text-sm text-gray-500">Toplam Ürün</div>
                            <div className="text-xl font-semibold">{stats.products.total}</div>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <div className="text-sm text-gray-500">Aktif Ürün</div>
                            <div className="text-xl font-semibold text-green-600">{stats.products.active}</div>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <div className="text-sm text-gray-500">Düşük Stok</div>
                            <div className="text-xl font-semibold text-yellow-600">{stats.products.lowStock}</div>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <div className="text-sm text-gray-500">Stokta Yok</div>
                            <div className="text-xl font-semibold text-red-600">{stats.products.outOfStock}</div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;
