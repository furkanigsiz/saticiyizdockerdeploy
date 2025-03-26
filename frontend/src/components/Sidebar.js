import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    FaHome, 
    FaBox, 
    FaChartBar, 
    FaCog, 
    FaShoppingCart, 
    FaWarehouse,
    FaChevronDown,
    FaChevronRight,
    FaCalculator,
    FaSignOutAlt,
    FaTachometerAlt,
    FaRobot,
    FaBolt,
    FaTag
} from 'react-icons/fa';

const MenuItem = ({ icon: Icon, title, to, active, onClick, hasSubmenu, isOpen, children }) => {
    return (
        <div className="mb-1">
            {to ? (
                <Link
                    to={to}
                    className={`flex items-center px-4 py-3 text-sm rounded-lg transition-colors duration-200 ${
                        active ? 'bg-indigo-800 text-white' : 'text-indigo-100 hover:bg-indigo-800'
                    }`}
                >
                    <Icon className="w-5 h-5 mr-3" />
                    <span>{title}</span>
                    {hasSubmenu && (
                        <div className="ml-auto">
                            {isOpen ? <FaChevronDown className="w-4 h-4" /> : <FaChevronRight className="w-4 h-4" />}
                        </div>
                    )}
                </Link>
            ) : (
                <button
                    onClick={onClick}
                    className={`w-full flex items-center px-4 py-3 text-sm rounded-lg transition-colors duration-200 ${
                        active ? 'bg-indigo-800 text-white' : 'text-indigo-100 hover:bg-indigo-800'
                    }`}
                >
                    <Icon className="w-5 h-5 mr-3" />
                    <span>{title}</span>
                    {hasSubmenu && (
                        <div className="ml-auto">
                            {isOpen ? <FaChevronDown className="w-4 h-4" /> : <FaChevronRight className="w-4 h-4" />}
                        </div>
                    )}
                </button>
            )}
            {hasSubmenu && isOpen && (
                <div className="ml-4 mt-1 space-y-1">
                    {children}
                </div>
            )}
        </div>
    );
};

const Sidebar = ({ isMenuOpen }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [openMenus, setOpenMenus] = useState({
        products: false,
        analytics: false,
        settings: false,
        specialProducts: false
    });

    const toggleMenu = (menu) => {
        setOpenMenus(prev => ({
            ...prev,
            [menu]: !prev[menu]
        }));
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const isActiveRoute = (path) => {
        return location.pathname === path;
    };

    return (
        <div className={`fixed inset-y-0 left-0 w-64 bg-indigo-700 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-200 ease-in-out z-30`}>
            <div className="flex items-center justify-between h-16 px-6 bg-indigo-800">
                <div className="flex items-center space-x-2">
                    <div className="bg-white rounded-full p-1">
                        <span className="text-indigo-600 text-xl font-bold">S</span>
                    </div>
                    <span className="text-white text-lg font-semibold">Saticiyiz</span>
                </div>
            </div>
            <nav className="mt-4 px-4">
                <div className="space-y-1">
                    <MenuItem
                        icon={FaTachometerAlt}
                        title="Genel Bakış"
                        to="/dashboard"
                        active={isActiveRoute('/dashboard')}
                    />

                    <MenuItem
                        icon={FaRobot}
                        title="Satıcıyız Asistan"
                        to="/assistant"
                        active={isActiveRoute('/assistant')}
                    />

                    <MenuItem
                        icon={FaBox}
                        title="Ürün Yönetimi"
                        hasSubmenu={true}
                        isOpen={openMenus.products}
                        onClick={() => toggleMenu('products')}
                        active={['/products', '/product-settings', '/product-pricing', '/product-profit'].includes(location.pathname)}
                    >
                        <MenuItem
                            icon={FaBox}
                            title="Ürünler"
                            to="/products"
                            active={isActiveRoute('/products')}
                        />
                        <MenuItem
                            icon={FaCog}
                            title="Ürün Ayarları"
                            to="/product-settings"
                            active={isActiveRoute('/product-settings')}
                        />
                        <MenuItem
                            icon={FaCalculator}
                            title="Fiyat Hesaplama"
                            to="/product-pricing"
                            active={isActiveRoute('/product-pricing')}
                        />
                        <MenuItem
                            icon={FaChartBar}
                            title="Kar Hesaplama"
                            to="/product-profit"
                            active={isActiveRoute('/product-profit')}
                        />
                    </MenuItem>

                    <MenuItem
                        icon={FaTag}
                        title="Özel Ürünler"
                        hasSubmenu={true}
                        isOpen={openMenus.specialProducts}
                        onClick={() => toggleMenu('specialProducts')}
                        active={['/flash-products', '/advantage-products'].includes(location.pathname)}
                    >
                        <MenuItem
                            icon={FaBolt}
                            title="Flash Ürünler"
                            to="/flash-products"
                            active={isActiveRoute('/flash-products')}
                        />
                        <MenuItem
                            icon={FaTag}
                            title="Avantajlı Ürünler"
                            to="/advantage-products"
                            active={isActiveRoute('/advantage-products')}
                        />
                    </MenuItem>

                    <MenuItem
                        icon={FaShoppingCart}
                        title="Siparişler"
                        to="/orders"
                        active={isActiveRoute('/orders')}
                    />

                    <MenuItem
                        icon={FaWarehouse}
                        title="Stok Yönetimi"
                        to="/stock"
                        active={isActiveRoute('/stock')}
                    />

                    <MenuItem
                        icon={FaChartBar}
                        title="Analitik"
                        hasSubmenu={true}
                        isOpen={openMenus.analytics}
                        onClick={() => toggleMenu('analytics')}
                        active={['/analytics', '/reports'].includes(location.pathname)}
                    >
                        <MenuItem
                            icon={FaChartBar}
                            title="Genel Analiz"
                            to="/analytics"
                            active={isActiveRoute('/analytics')}
                        />
                        <MenuItem
                            icon={FaChartBar}
                            title="Raporlar"
                            to="/reports"
                            active={isActiveRoute('/reports')}
                        />
                    </MenuItem>

                    <MenuItem
                        icon={FaCog}
                        title="Ayarlar"
                        hasSubmenu={true}
                        isOpen={openMenus.settings}
                        onClick={() => toggleMenu('settings')}
                        active={['/settings', '/integrations'].includes(location.pathname)}
                    >
                        <MenuItem
                            icon={FaCog}
                            title="Genel Ayarlar"
                            to="/settings"
                            active={isActiveRoute('/settings')}
                        />
                        <MenuItem
                            icon={FaCog}
                            title="Entegrasyonlar"
                            to="/integrations"
                            active={isActiveRoute('/integrations')}
                        />
                    </MenuItem>

                    <div className="pt-4 mt-4 border-t border-indigo-600">
                        <MenuItem
                            icon={FaSignOutAlt}
                            title="Çıkış Yap"
                            onClick={handleLogout}
                        />
                    </div>
                </div>
            </nav>
        </div>
    );
};

export default Sidebar; 