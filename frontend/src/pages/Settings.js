import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from '../components/Layout';

const Settings = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showApiInfo, setShowApiInfo] = useState(false);
    const { user } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        notifications: {
            email: true,
            push: false,
            sms: true
        },
        api_settings: {
            seller_id: '',
            api_key: '',
            api_secret: ''
        }
    });

    // Profil ve API bilgilerini yükle
    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            try {
                console.log('Kullanıcı bilgileri alınıyor...');
                const response = await fetch('http://localhost:5000/settings/user-info', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                console.log('API yanıtı:', response.status, response.statusText);
                
                if (!response.ok) {
                    throw new Error(`Bilgiler alınamadı. Hata: ${response.status}`);
                }

                const data = await response.json();
                console.log('Alınan kullanıcı bilgileri:', data);

                setFormData(prev => ({
                    ...prev,
                    first_name: data.first_name || '',
                    last_name: data.last_name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    api_settings: {
                        seller_id: data.api_settings?.seller_id || '',
                        api_key: data.api_settings?.api_key || '',
                        api_secret: data.api_settings?.api_secret || ''
                    }
                }));
            } catch (error) {
                console.error('Bilgi yükleme hatası:', error);
                toast.error('Bilgiler yüklenirken bir hata oluştu');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchUserData();
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({
                ...prev,
                notifications: {
                    ...prev.notifications,
                    [name]: checked
                }
            }));
        } else if (name.startsWith('api_')) {
            const apiField = name.replace('api_', '');
            setFormData(prev => ({
                ...prev,
                api_settings: {
                    ...prev.api_settings,
                    [apiField === 'seller_id' ? 'seller_id' : 
                     apiField === 'key' ? 'api_key' : 
                     apiField === 'secret' ? 'api_secret' : apiField]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // Profil bilgilerini güncelle
            const profileResponse = await fetch('http://localhost:5000/settings/user-info', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email,
                    phone: formData.phone
                })
            });

            if (!profileResponse.ok) {
                throw new Error('Profil güncellenirken hata oluştu');
            }

            // API ayarlarını güncelle
            if (activeTab === 'api') {
                const apiResponse = await fetch('http://localhost:5000/settings/api-settings', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        seller_id: formData.api_settings.seller_id,
                        api_key: formData.api_settings.api_key,
                        api_secret: formData.api_settings.api_secret
                    })
                });

                if (!apiResponse.ok) {
                    throw new Error('API ayarları güncellenirken hata oluştu');
                }
            }

            toast.success('✅ Değişiklikler başarıyla kaydedildi!');
        } catch (error) {
            console.error('Güncelleme hatası:', error);
            toast.error('❌ ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Layout>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
                <p className="mt-1 text-sm text-gray-600">Hesap ve uygulama ayarlarınızı buradan yönetebilirsiniz</p>
            </div>

            {/* Ayarlar Sekmeler */}
            <div className="bg-white rounded-lg shadow-sm">
                <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`px-6 py-4 text-sm font-medium ${
                                activeTab === 'profile'
                                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Profil Bilgileri
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`px-6 py-4 text-sm font-medium ${
                                activeTab === 'security'
                                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Güvenlik
                        </button>
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`px-6 py-4 text-sm font-medium ${
                                activeTab === 'notifications'
                                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Bildirimler
                        </button>
                        <button
                            onClick={() => setActiveTab('api')}
                            className={`px-6 py-4 text-sm font-medium ${
                                activeTab === 'api'
                                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            API Ayarları
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {/* Profil Bilgileri */}
                    {activeTab === 'profile' && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Ad</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Soyad</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">E-posta</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Telefon</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </form>
                    )}

                    {/* Güvenlik */}
                    {activeTab === 'security' && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mevcut Şifre</label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={formData.currentPassword}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Yeni Şifre</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Yeni Şifre Tekrar</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </form>
                    )}

                    {/* Bildirimler */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900">E-posta Bildirimleri</h3>
                                        <p className="text-sm text-gray-500">Yeni siparişler ve güncellemeler hakkında e-posta alın</p>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="email"
                                            checked={formData.notifications.email}
                                            onChange={handleChange}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900">Push Bildirimleri</h3>
                                        <p className="text-sm text-gray-500">Anlık bildirimler alın</p>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="push"
                                            checked={formData.notifications.push}
                                            onChange={handleChange}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900">SMS Bildirimleri</h3>
                                        <p className="text-sm text-gray-500">Önemli güncellemeler için SMS alın</p>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="sms"
                                            checked={formData.notifications.sms}
                                            onChange={handleChange}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* API Ayarları */}
                    {activeTab === 'api' && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Trendyol Satıcı ID</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="api_seller_id"
                                        value={showApiInfo ? (formData.api_settings.seller_id || '') : '••••••••'}
                                        onChange={handleChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Trendyol Satıcı ID'nizi girin"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowApiInfo(!showApiInfo)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        {showApiInfo ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">API Key</label>
                                <div className="relative">
                                    <input
                                        type={showApiInfo ? "text" : "password"}
                                        name="api_key"
                                        value={showApiInfo ? (formData.api_settings.api_key || '') : '••••••••'}
                                        onChange={handleChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="API Key'inizi girin"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">API Secret</label>
                                <div className="relative">
                                    <input
                                        type={showApiInfo ? "text" : "password"}
                                        name="api_secret"
                                        value={showApiInfo ? (formData.api_settings.api_secret || '') : '••••••••'}
                                        onChange={handleChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="API Secret'ınızı girin"
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <p className="text-sm text-gray-500">
                                    Bu bilgileri Trendyol Satıcı Panelinden alabilirsiniz. API bilgilerinizi kimseyle paylaşmayın.
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                    Bilgileri görüntülemek veya düzenlemek için göz ikonuna tıklayın.
                                </p>
                            </div>
                        </form>
                    )}

                    {/* Kaydet Butonu */}
                    <div className="mt-6 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSaving}
                            onClick={handleSubmit}
                            className={`inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                                isSaving ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                        >
                            {isSaving ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Kaydediliyor...
                                </>
                            ) : (
                                'Değişiklikleri Kaydet'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Settings;
