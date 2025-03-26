import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Header = ({ setIsMenuOpen, isMenuOpen }) => {
    const { user } = useContext(AuthContext);

    return (
        <div className="sticky top-0 z-20">
            <div className="flex items-center justify-between h-16 px-6 bg-white shadow-sm">
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="lg:hidden text-gray-600 hover:text-gray-900"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <div className="flex items-center space-x-4">
                    <button className="flex items-center space-x-2">
                        <img 
                            src={`https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=indigo&color=fff`} 
                            alt="Profile" 
                            className="w-8 h-8 rounded-full" 
                        />
                        <span className="text-sm font-medium text-gray-700">
                            {user?.firstName} {user?.lastName}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Header; 