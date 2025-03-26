import React from 'react';
import Layout from '../components/Layout';

const Analytics = () => {
    return (
        <Layout>
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Analizler</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Satış ve performans analizlerinizi buradan takip edebilirsiniz
                    </p>
                </div>

                <div className="bg-white shadow-md rounded-lg p-6">
                    <div className="text-center text-gray-500">
                        <svg 
                            className="mx-auto h-12 w-12 text-gray-400" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                            />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Henüz analiz verisi bulunmuyor</h3>
                        <p className="mt-1 text-sm text-gray-500">Satış ve performans verileriniz burada görüntülenecek</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Analytics; 