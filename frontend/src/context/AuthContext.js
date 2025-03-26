import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    const checkAuthStatus = useCallback(async (token) => {
        if (!token) {
            console.log('Token bulunamadı');
            return false;
        }

        try {
            console.log('Token doğrulanıyor:', token.substring(0, 20) + '...');
            const response = await fetch('http://localhost:5000/users/verify', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            console.log('Doğrulama yanıtı:', data);

            if (!response.ok) {
                throw new Error(data.message || 'Token doğrulama başarısız');
            }

            return data.valid && data.userData ? data.userData : false;
        } catch (error) {
            console.error('Token doğrulama hatası:', error.message);
            return false;
        }
    }, []);

    const initAuth = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            console.log('Mevcut token:', token ? 'Var' : 'Yok');

            if (!token) {
                console.log('Token bulunamadı, çıkış yapılıyor');
                return;
            }

            let currentUser = null;
            try {
                const savedUserStr = localStorage.getItem('user');
                currentUser = savedUserStr ? JSON.parse(savedUserStr) : null;
                console.log('Kaydedilmiş kullanıcı:', currentUser ? 'Var' : 'Yok');
            } catch (e) {
                console.error('Kullanıcı bilgisi parse hatası:', e);
            }

            if (currentUser) {
                if (currentUser.subscription_status === 'trial' && currentUser.trial_end_date) {
                    const trialEndDate = new Date(currentUser.trial_end_date);
                    const now = new Date();
                    
                    if (now > trialEndDate) {
                        console.log('Deneme süresi sona ermiş');
                        
                        if (!location.pathname.includes('/pricing')) {
                            navigate('/pricing', { replace: true });
                            
                            import('react-toastify').then(({ toast }) => {
                                toast.error('Deneme süreniz sona erdi. Hizmetlerimize erişmek için lütfen bir abonelik planı seçin.');
                            });
                        }
                    }
                }
                
                setIsAuthenticated(true);
                setUser(currentUser);
                console.log('Mevcut kullanıcı bilgileri yüklendi');
            }

            const userData = await checkAuthStatus(token);
            console.log('Token doğrulama sonucu:', userData ? 'Başarılı' : 'Başarısız');

            if (userData) {
                setIsAuthenticated(true);
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));

                if (location.pathname === '/login' || location.pathname === '/') {
                    const defaultPath = userData.role === 'admin' ? '/admin' : '/dashboard';
                    console.log('Yönlendiriliyor:', defaultPath);
                    navigate(defaultPath, { replace: true });
                }
            } else {
                throw new Error('Token doğrulanamadı');
            }
        } catch (error) {
            console.error('Kimlik doğrulama hatası:', error.message);
            setIsAuthenticated(false);
            setUser(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        } finally {
            setLoading(false);
        }
    }, [checkAuthStatus, navigate, location.pathname]);

    useEffect(() => {
        console.log('AuthContext başlatılıyor');
        initAuth();
    }, [initAuth]);

    const login = useCallback((token, userData) => {
        console.log('Login işlemi başlatıldı');
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setIsAuthenticated(true);
        setUser(userData);
        console.log('Login işlemi tamamlandı');
    }, []);

    const logout = useCallback(() => {
        console.log('Logout işlemi başlatıldı');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
        navigate('/login', { replace: true });
        console.log('Logout işlemi tamamlandı');
    }, [navigate]);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const contextValue = {
        isAuthenticated,
        user,
        login,
        logout,
        checkAuthStatus
    };

    console.log('AuthContext durumu:', { isAuthenticated, hasUser: !!user });

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
