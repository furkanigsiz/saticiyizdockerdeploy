import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-red-500 mb-4">Erişim Reddedildi</h1>
                <p>Bu sayfaya erişim izniniz yok.</p>
                <Link to="/dashboard" className="text-blue-500 underline">
                    Anasayfaya Dön
                </Link>
            </div>
        </div>
    );
};

export default Unauthorized;
