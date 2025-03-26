import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showApiWarning, setShowApiWarning] = useState(false);

    useEffect(() => {
        const checkApiSettings = async () => {
            try {
                const response = await fetch('http://localhost:5000/settings/api', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await response.json();
                
                // API bilgileri eksikse uyarıyı göster
                setShowApiWarning(!data.seller_id);
            } catch (error) {
                console.error('API ayarları kontrol edilirken hata:', error);
            }
        };

        checkApiSettings();
    }, []);

    return (
        <div className="min-h-screen bg-gray-100">
            <Sidebar isMenuOpen={isMenuOpen} />
            
            <div className="lg:pl-64">
                <Header setIsMenuOpen={setIsMenuOpen} isMenuOpen={isMenuOpen} />
                
                <main className="p-6">
                    {/* API Uyarı Bildirimi */}
                    {showApiWarning && (
                        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-yellow-800">
                                        API Bilgileri Eksik
                                    </h3>
                                    <div className="mt-2 text-sm text-yellow-700">
                                        <p>
                                            Trendyol entegrasyonu için API bilgilerinizi henüz girmediniz. 
                                            <Link to="/settings" className="ml-1 font-medium text-yellow-800 underline">
                                                Ayarlar sayfasından API bilgilerinizi ekleyebilirsiniz.
                                            </Link>
                                        </p>
                                    </div>
                                    <div className="mt-4">
                                        <div className="-mx-2 -my-1.5 flex">
                                            <button
                                                onClick={() => setShowApiWarning(false)}
                                                className="ml-3 bg-yellow-50 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
                                            >
                                                Kapat
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout; 