import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const navigate = useNavigate();

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 5 * 60 * 1000); // 5 dakika
        return () => clearInterval(interval);
    }, [page, size, selectedStatus]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(
                `http://localhost:5000/api/orders?page=${page}&size=${size}${selectedStatus !== 'all' ? `&status=${selectedStatus}` : ''}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Siparişler alınırken bir hata oluştu');
            }

            const data = await response.json();
            setOrders(data.orders);
            setTotalElements(data.totalElements);
            setTotalPages(data.totalPages);
            setHasNext(data.hasNext);
        } catch (error) {
            console.error('Siparişler alınırken hata:', error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderNumbers, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch('http://localhost:5000/api/orders/status', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderNumbers: [orderNumbers],
                    status: newStatus
                })
            });

            if (!response.ok) {
                throw new Error('Sipariş durumu güncellenirken bir hata oluştu');
            }

            toast.success('Sipariş durumu başarıyla güncellendi');
            fetchOrders();
        } catch (error) {
            console.error('Sipariş durumu güncellenirken hata:', error);
            toast.error(error.message);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('tr-TR');
    };

    const formatPrice = (price) => {
        return parseFloat(price).toLocaleString('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        });
    };

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'Created':
                return 'bg-blue-100 text-blue-800';
            case 'Picking':
                return 'bg-yellow-100 text-yellow-800';
            case 'Shipped':
                return 'bg-green-100 text-green-800';
            case 'Cancelled':
                return 'bg-red-100 text-red-800';
            case 'Delivered':
                return 'bg-emerald-100 text-emerald-800';
            case 'UnDelivered':
                return 'bg-orange-100 text-orange-800';
            case 'Returned':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'Created':
                return 'Yeni';
            case 'Picking':
                return 'Hazırlanıyor';
            case 'Shipped':
                return 'Kargoya Verildi';
            case 'Cancelled':
                return 'İptal Edildi';
            case 'Delivered':
                return 'Teslim Edildi';
            case 'UnDelivered':
                return 'Teslim Edilemedi';
            case 'Returned':
                return 'İade Edildi';
            default:
                return status || 'Bilinmiyor';
        }
    };

    return (
        <Layout>
            <div className="p-6">
                <div className="mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">Siparişler</h1>
                            <p className="mt-2 text-sm text-gray-600">
                                Toplam {totalElements} sipariş bulunmaktadır
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="block w-48 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="all">Tüm Siparişler</option>
                                <option value="Created">Yeni</option>
                                <option value="Picking">Hazırlanıyor</option>
                                <option value="Shipped">Kargoya Verildi</option>
                                <option value="Cancelled">İptal Edildi</option>
                                <option value="Delivered">Teslim Edildi</option>
                                <option value="UnDelivered">Teslim Edilemedi</option>
                                <option value="Returned">İade Edildi</option>
                            </select>
                            <button
                                onClick={fetchOrders}
                                disabled={loading}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Yenile
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Henüz sipariş bulunmuyor.</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Sipariş No
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Müşteri
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Ürünler
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Toplam
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Durum
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                İşlemler
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {orders.map((order) => (
                                            <tr key={order.orderNumber} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                                                        #{order.orderNumber}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        <div className="flex items-center">
                                                            <svg className="h-4 w-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            {formatDate(order.orderDate)}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                                                            <svg className="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {order.customerFirstName} {order.customerLastName}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                <div className="flex items-center">
                                                                    <svg className="h-4 w-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                    </svg>
                                                                    {order.customerEmail}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">
                                                        {order.lines && order.lines.map((item, index) => (
                                                            <div key={index} className="flex items-center mb-2 bg-gray-50 rounded-lg p-2">
                                                                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-md text-xs font-medium">
                                                                    {item.quantity}
                                                                </span>
                                                                <span className="ml-2 text-sm font-medium text-gray-700">
                                                                    {item.productName || item.productId}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        <div className="flex items-center">
                                                            <svg className="h-4 w-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            {formatPrice(order.totalPrice)}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                                                            {getStatusText(order.status)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => updateOrderStatus(order.orderNumber, e.target.value)}
                                                        className="block w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                                    >
                                                        <option value="Created">Yeni</option>
                                                        <option value="Picking">Hazırlanıyor</option>
                                                        <option value="Shipped">Kargoya Verildi</option>
                                                        <option value="Cancelled">İptal Edildi</option>
                                                        <option value="Delivered">Teslim Edildi</option>
                                                        <option value="UnDelivered">Teslim Edilemedi</option>
                                                        <option value="Returned">İade Edildi</option>
                                                    </select>
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
                                            {' '}sipariş gösteriliyor
                                        </p>
                                    </div>
                                    <div className="mt-3 sm:mt-0">
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                            <button
                                                onClick={() => setPage(0)}
                                                disabled={page === 0}
                                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                <span className="sr-only">İlk Sayfa</span>
                                                ««
                                            </button>
                                            <button
                                                onClick={() => setPage(page - 1)}
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
                                                        onClick={() => setPage(pageNumber)}
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
                                                onClick={() => setPage(page + 1)}
                                                disabled={!hasNext}
                                                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                <span className="sr-only">Sonraki</span>
                                                »
                                            </button>
                                            <button
                                                onClick={() => setPage(totalPages - 1)}
                                                disabled={page === totalPages - 1}
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
                    </>
                )}
            </div>
        </Layout>
    );
};

export default Orders; 