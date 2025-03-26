import React, { useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ children, requiredRole }) => {
    const { isAuthenticated, user, checkAuthStatus } = useContext(AuthContext);
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(true);
    const [isValid, setIsValid] = useState(false);

    useEffect(() => {
        const verifyAuth = async () => {
            try {
                if (!isAuthenticated) {
                    const userData = await checkAuthStatus();
                    setIsValid(!!userData);
                } else {
                    setIsValid(true);
                }
            } catch (error) {
                console.error('Doğrulama hatası:', error);
                setIsValid(false);
            } finally {
                setIsChecking(false);
            }
        };

        verifyAuth();
    }, [isAuthenticated, checkAuthStatus]);

    if (isChecking) {
        return (
            <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!isValid) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredRole && user?.role !== requiredRole) {
        return <Navigate to="/unauthorized" replace />;
    }

    // Deneme süresi bitmiş mi kontrol et
    const isTrialExpired = () => {
        if (user?.subscription_status === 'trial' && user?.trial_end_date) {
            const trialEndDate = new Date(user.trial_end_date);
            const now = new Date();
            return now > trialEndDate;
        }
        return false;
    };

    // Kullanıcı yeni kayıt olmuş ve henüz abonelik seçmemişse pricing sayfasına yönlendir
    if (
        !location.pathname.includes('/pricing') && 
        !user?.subscription_status && 
        isAuthenticated
    ) {
        return <Navigate to="/pricing" replace />;
    }

    // Deneme süresi bitmiş ve kullanıcı pricing sayfasında değilse pricing sayfasına yönlendir
    if (isTrialExpired() && !location.pathname.includes('/pricing')) {
        return <Navigate to="/pricing" replace />;
    }

    return children;
};

export default PrivateRoute;
