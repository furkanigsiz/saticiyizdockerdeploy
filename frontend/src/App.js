import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import PrivateRoute from './components/PrivateRoute';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import Search from './pages/Search';
import Terms from './pages/Terms';
import { AuthProvider } from './context/AuthContext';
import Settings from './pages/Settings';
import Products from './pages/Products';
import Stock from './pages/Stock';
import Orders from './pages/Orders';
import Analytics from './pages/Analytics';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProductSettings from './pages/ProductSettings';
import ProductPricing from './pages/ProductPricing';
import ProductProfit from './pages/ProductProfit';
import Integrations from './pages/Integrations';
import Assistant from './pages/Assistant';
import FlashProducts from './pages/FlashProducts';
import AdvantageProducts from './pages/AdvantageProducts';
import HeroDemo from './pages/HeroDemo';
import Pricing from './pages/Pricing';

const App = () => {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/hero-demo" element={<HeroDemo />} />
                    <Route
                        path="/pricing"
                        element={
                            <PrivateRoute>
                                <Pricing />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/dashboard"
                        element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/products"
                        element={
                            <PrivateRoute>
                                <Products />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/stock"
                        element={
                            <PrivateRoute>
                                <Stock />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/orders"
                        element={
                            <PrivateRoute>
                                <Orders />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/analytics"
                        element={
                            <PrivateRoute>
                                <Analytics />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/admin"
                        element={
                            <PrivateRoute requiredRole="admin">
                                <AdminDashboard />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <PrivateRoute>
                                <Settings />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/product-settings"
                        element={
                            <PrivateRoute>
                                <ProductSettings />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/product-pricing"
                        element={
                            <PrivateRoute>
                                <ProductPricing />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/product-profit"
                        element={
                            <PrivateRoute>
                                <ProductProfit />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/integrations"
                        element={
                            <PrivateRoute>
                                <Integrations />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/assistant"
                        element={
                            <PrivateRoute>
                                <Assistant />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/flash-products"
                        element={
                            <PrivateRoute>
                                <FlashProducts />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/advantage-products"
                        element={
                            <PrivateRoute>
                                <AdvantageProducts />
                            </PrivateRoute>
                        }
                    />
                    <Route path="/unauthorized" element={<Unauthorized />} />
                    <Route path="/" element={<HeroDemo />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Terms />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
                <ToastContainer
                    position="top-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="light"
                />
            </AuthProvider>
        </Router>
    );
};

export default App;
