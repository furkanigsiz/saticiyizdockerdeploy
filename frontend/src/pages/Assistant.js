import React, { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import { FaRobot, FaPaperPlane, FaInfoCircle, FaSearch, FaChartLine, FaBoxOpen, FaShoppingCart, FaFileAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { initialMessage, createSystemMessage, createPriceOptimizationPrompt, createDescriptionOptimizationPrompt, createExcelExportPrompt, createSalesStrategyContext, createStockManagementContext } from '../config/assistantPrompts';

// Stil tanımlamaları
const styles = {
    typingIndicator: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
    },
    typingDot: {
        width: '8px',
        height: '8px',
        backgroundColor: '#818cf8',
        borderRadius: '50%',
        animation: 'bounce 1.4s infinite ease-in-out'
    },
    typingDot1: {
        animationDelay: '-0.32s'
    },
    typingDot2: {
        animationDelay: '-0.16s'
    }
};

// Keyframe animasyonu için stil etiketi
const createKeyframeStyle = () => {
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }
    `;
    return style;
};

const Assistant = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState(null);
    const [showExamples, setShowExamples] = useState(false);
    const [activeCategory, setActiveCategory] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Keyframe animasyonu için stil etiketini ekle
        const keyframeStyle = createKeyframeStyle();
        document.head.appendChild(keyframeStyle);

        // Kullanıcı verilerini ve ürün bilgilerini yükle
        fetchUserData();
        // Başlangıç mesajını ayarla
        if (messages.length === 0) {
            setMessages([initialMessage]);
        }

        // Temizleme fonksiyonu
        return () => {
            document.head.removeChild(keyframeStyle);
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
                return;
            }

            // Kullanıcı bilgilerini JWT token'dan çöz
            const tokenData = JSON.parse(atob(token.split('.')[1]));
            const userId = tokenData.id;

            console.log('Ürün bilgileri alınıyor...');
            // Ürün bilgilerini al - Tüm ürünleri getir (satışta olan ve olmayan)
            const productsResponse = await fetch('http://localhost:5000/api/trendyol/product-settings?size=2000&onSale=false', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!productsResponse.ok) {
                const errorData = await productsResponse.json();
                console.error('Ürün API Hata detayı:', errorData);
                throw new Error('Ürün bilgileri alınamadı');
            }

            const productsData = await productsResponse.json();
            console.log('Alınan ürün verileri:', productsData);
            console.log('Toplam ürün sayısı:', productsData.products?.length || 0);

            // Stok durumu analizi
            const products = productsData.products || [];
            const lowStockThreshold = 10; // Düşük stok eşiği
            const lowStockProducts = products.filter(product => 
                product.quantity <= lowStockThreshold && product.on_sale
            );
            
            setUserData({
                id: userId,
                products: products,
                analytics: {
                    totalProducts: products.length,
                    lowStockProducts: lowStockProducts.length,
                    lowStockItems: lowStockProducts.map(p => ({
                        title: p.title,
                        quantity: p.quantity,
                        barcode: p.barcode,
                        stock_code: p.stock_code,
                        sale_price: p.sale_price
                    }))
                }
            });

            console.log('UserData güncellendi:', {
                totalProducts: products.length,
                sampleProduct: products[0]
            });

        } catch (error) {
            console.error('Veri yükleme hatası:', error);
            toast.error('Ürün bilgileri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
        }
    };

    const fetchProductDetails = async (identifier) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return null;

            // Debug logları
            console.log('Aranan barkod/ürün:', identifier);
            console.log('Mevcut ürünler:', userData?.products);

            // Önce ürünü bul (barkod veya isim ile)
            const products = userData?.products || [];
            let product = products.find(p => {
                console.log('Karşılaştırılan ürün:', p.barcode, p.title);
                return p.barcode === identifier || 
                       p.title.toLowerCase().includes(identifier.toLowerCase());
            });

            if (!product) {
                throw new Error(`Ürün bulunamadı (Barkod: ${identifier}). Lütfen ürünün sistemde kayıtlı olduğundan emin olun.`);
            }

            console.log('Bulunan ürün:', product);

            // API entegrasyon bilgilerini al
            const apiResponse = await fetch('http://localhost:5000/settings/api', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!apiResponse.ok) {
                throw new Error('API bilgileri alınamadı');
            }

            const apiData = await apiResponse.json();
            const seller_id = apiData.seller_id;

            // Trendyol'dan ürün detaylarını al
            const response = await fetch(`http://localhost:5000/api/trendyol/products/details/${product.barcode}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Hata detayı:', errorData);
                throw new Error(`Ürün detayları alınamadı. Hata: ${response.status} ${response.statusText}`);
            }

            const productDetails = await response.json();
            console.log('Alınan ürün detayları:', productDetails);

            // Eğer ürün detayları zaten varsa onları kullan
            if (product.description) {
                return {
                    ...productDetails,
                    description: product.description,
                    title: product.title,
                    brand: product.brand,
                    categoryName: product.category_name
                };
            }

            return productDetails;
        } catch (error) {
            console.error('Ürün detayı hatası:', error);
            throw error;
        }
    };

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = {
            role: 'user',
            content: input
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Ürün bilgilerini Google Sheets'e aktarma ve mail gönderme isteği kontrolü
            const exportRegex = /(?:sheets[e']?|excel[e']?).*(?:aktar|ekle|gönder).*(?:barkod[u]?:?\s*([0-9]+))(?:.*mail:?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}))?/i;
            const exportMatch = input.match(exportRegex);

            // Ürün açıklaması iyileştirme isteği kontrolü
            const improveDescriptionRegex = /(?:açıklama.*geliştir|açıklama.*iyileştir|açıklama.*düzenle).*?(?:barkod[u]?:?\s*([0-9]+)|ürün:?\s*([^,\.]+))/i;
            const descriptionMatch = input.match(improveDescriptionRegex);

            // Fiyat optimizasyonu isteği kontrolü
            const priceOptimizationRegex = /(?:fiyat.*optimizasyon|fiyat.*öneri|fiyat.*analiz|fiyat.*strateji|rekabetçi.*fiyat).*?(?:barkod[u]?:?\s*([0-9]+)|ürün:?\s*([^,\.]+))/i;
            const priceOptMatch = input.match(priceOptimizationRegex);

            // Satış stratejisi önerisi isteği kontrolü
            const salesStrategyRegex = /(?:satış.*strateji|satış.*öneri|satış.*taktik|satış.*plan|pazarlama.*strateji|büyüme.*strateji|kampanya.*öneri)/i;
            const salesStrategyMatch = input.match(salesStrategyRegex);

            // Stok yönetimi tavsiyesi isteği kontrolü
            const stockManagementRegex = /(?:stok.*yönetim|stok.*analiz|stok.*öneri|stok.*tavsiye|envanter.*yönetim|stok.*seviye)/i;
            const stockManagementMatch = input.match(stockManagementRegex);

            let systemMessage = createSystemMessage(userData);
            let productContext = '';

            if (exportMatch) {
                const [_, barcode, email] = exportMatch;
                try {
                    // Entegrasyon durumunu kontrol et
                    const statusResponse = await fetch('http://localhost:5000/api/integrations/status', {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    const statusData = await statusResponse.json();
                    
                    if (!statusData.integrations?.google?.connected) {
                        throw new Error('Lütfen önce Entegrasyonlar sayfasından Google hesabınızı bağlayın.');
                    }
                    
                    // E-posta gönderilecekse e-posta entegrasyonunu kontrol et
                    if (email && !statusData.integrations?.email?.connected) {
                        throw new Error('E-posta göndermek için önce Entegrasyonlar sayfasından Email hesabınızı bağlayın.');
                    }

                    const productDetails = await fetchProductDetails(barcode);
                    if (productDetails) {
                        systemMessage = {
                            ...systemMessage,
                            content: systemMessage.content + '\n\n' + createExcelExportPrompt(productDetails, email).content
                        };
                    }

                    // Ürün bilgilerini Google Sheets'e aktar
                    const response = await fetch('http://localhost:5000/api/integrations/export-product', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            barcode,
                            email: email || undefined,
                            skipEmail: !email, // E-posta adresi yoksa e-posta göndermeyi atla
                            spreadsheetId: statusData.integrations.google.spreadsheetId
                        })
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.message);
                    }

                    const result = await response.json();
                    
                    let successMessage = `✅ İşlem başarıyla tamamlandı!\n\n📊 Ürün bilgileri Google Sheets'e eklendi\n`;
                    
                    if (email) {
                        successMessage += `📧 Bilgilendirme maili ${email} adresine gönderildi\n\n`;
                    }
                    
                    successMessage += `🔗 Google Sheets bağlantısı:\n${result.spreadsheetUrl}`;
                    
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: successMessage
                    }]);
                    setIsLoading(false);
                    return;
                } catch (error) {
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: `❌ Üzgünüm, bir hata oluştu: ${error.message}`
                    }]);
                    setIsLoading(false);
                    return;
                }
            }

            if (descriptionMatch) {
                const identifier = descriptionMatch[1] || descriptionMatch[2];
                try {
                    const productDetails = await fetchProductDetails(identifier);
                    if (productDetails) {
                        systemMessage = {
                            ...systemMessage,
                            content: systemMessage.content + '\n\n' + createDescriptionOptimizationPrompt(productDetails).content
                        };
                    }
                } catch (error) {
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: `Üzgünüm, ${error.message}`
                    }]);
                    setIsLoading(false);
                    return;
                }
            }

            if (priceOptMatch) {
                const identifier = priceOptMatch[1] || priceOptMatch[2];
                try {
                    const productDetails = await fetchProductDetails(identifier);
                    if (productDetails) {
                        systemMessage = {
                            ...systemMessage,
                            content: systemMessage.content + '\n\n' + createPriceOptimizationPrompt(productDetails).content
                        };
                    }
                } catch (error) {
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: `Üzgünüm, ürün bilgilerini alırken bir hata oluştu: ${error.message}`
                    }]);
                    setIsLoading(false);
                    return;
                }
            }

            // Satış stratejisi önerisi isteği işleme
            if (salesStrategyMatch) {
                try {
                    // Kullanıcı verilerini analiz et
                    const salesStrategyContext = createSalesStrategyContext(userData);
                    
                    systemMessage = {
                        ...systemMessage,
                        content: systemMessage.content + '\n\n' + salesStrategyContext
                    };
                } catch (error) {
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: `Üzgünüm, satış stratejisi oluştururken bir hata oluştu: ${error.message}`
                    }]);
                    setIsLoading(false);
                    return;
                }
            }

            // Stok yönetimi tavsiyesi isteği işleme
            if (stockManagementMatch) {
                try {
                    // Stok yönetimi tavsiyesi oluştur
                    const stockManagementContext = createStockManagementContext(userData);
                    
                    systemMessage = {
                        ...systemMessage,
                        content: systemMessage.content + '\n\n' + stockManagementContext
                    };
                } catch (error) {
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: `Üzgünüm, stok yönetimi tavsiyesi oluştururken bir hata oluştu: ${error.message}`
                    }]);
                    setIsLoading(false);
                    return;
                }
            }

            const allMessages = [systemMessage, ...messages, userMessage];

            const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer sk-adc07045d9274c51967e7772c02bb871'
                },
                body: JSON.stringify({
                    model: 'qwen-plus',
                    messages: allMessages,
                    temperature: 0.3,
                    max_tokens: 1000
                })
            });

            if (!response.ok) {
                throw new Error('AI yanıt vermedi');
            }

            const data = await response.json();
            
            if (data.choices && data.choices[0]) {
                setMessages(prev => [...prev, data.choices[0].message]);
            } else {
                throw new Error('API yanıtı geçersiz');
            }
        } catch (error) {
            console.error('Hata:', error);
            toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.'
            }]);
        }

        setIsLoading(false);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Hazır prompt kategorileri ve örnekleri
    const promptExamples = {
        seo: [
            { title: "Ürün Açıklaması Optimizasyonu", prompt: "Ürün açıklamasını geliştir barkod: 123456789" },
            { title: "Kategori Bazlı SEO İpuçları", prompt: "Elektronik kategorisi için SEO ipuçları ver" },
            { title: "Başlık Optimizasyonu", prompt: "Ürün başlığını optimize et barkod: 123456789" }
        ],
        pricing: [
            { title: "Fiyat Optimizasyonu", prompt: "Fiyat optimizasyonu önerisi ver ürün: Akıllı Telefon X" },
            { title: "Kâr Marjı Analizi", prompt: "Kâr marjı analizi yap barkod: 123456789" },
            { title: "Rekabetçi Fiyatlandırma", prompt: "Rekabetçi fiyatlandırma stratejisi öner" }
        ],
        stock: [
            { title: "Stok Yönetimi Tavsiyeleri", prompt: "Stok yönetimi tavsiyeleri ver" },
            { title: "Düşük Stok Analizi", prompt: "Düşük stoklu ürünler için öneri ver" },
            { title: "Stok Devir Hızı", prompt: "Stok devir hızını nasıl artırabilirim?" }
        ],
        sales: [
            { title: "Satış Stratejisi", prompt: "Satış stratejisi önerileri ver" },
            { title: "Kampanya Planlaması", prompt: "Bu ay için kampanya önerileri ver" },
            { title: "Büyüme Stratejisi", prompt: "Satışları artırmak için büyüme stratejisi öner" }
        ],
        export: [
            { title: "Google Sheets'e Aktar", prompt: "Ürünü Google Sheets'e aktar barkod: 123456789" },
            { title: "E-posta ile Gönder", prompt: "Ürünü Google Sheets'e aktar ve mail gönder barkod: 123456789 mail: ornek@mail.com" }
        ]
    };

    // Hazır prompt kategorileri
    const promptCategories = [
        { id: 'seo', title: 'SEO Optimizasyonu', icon: FaSearch, color: 'bg-blue-600' },
        { id: 'pricing', title: 'Fiyatlandırma', icon: FaChartLine, color: 'bg-green-600' },
        { id: 'stock', title: 'Stok Yönetimi', icon: FaBoxOpen, color: 'bg-yellow-600' },
        { id: 'sales', title: 'Satış Stratejisi', icon: FaShoppingCart, color: 'bg-purple-600' },
        { id: 'export', title: 'Veri Aktarımı', icon: FaFileAlt, color: 'bg-red-600' }
    ];

    // Hazır prompt seçildiğinde
    const handlePromptSelect = (prompt) => {
        setInput(prompt);
        setShowExamples(false);
        setActiveCategory(null);
    };

    // Kategori seçildiğinde
    const handleCategorySelect = (categoryId) => {
        if (activeCategory === categoryId) {
            setActiveCategory(null);
            setShowExamples(false);
        } else {
            setActiveCategory(categoryId);
            setShowExamples(true);
        }
    };

    return (
        <Layout>
            <div className="flex flex-col h-[calc(100vh-64px)]">
                {/* Üst Bilgi Çubuğu */}
                <div className="bg-white border-b p-4">
                    <div className="max-w-3xl mx-auto flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <FaRobot className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-gray-900">Satıcıyız Asistan</h1>
                                <p className="text-sm text-gray-500">E-ticaret ve Trendyol uzmanınız</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <div className="group relative">
                                <FaInfoCircle className="w-5 h-5 text-gray-400 hover:text-gray-500 cursor-help" />
                                <div className="hidden group-hover:block absolute right-0 w-72 p-3 mt-2 bg-white rounded-lg shadow-lg border text-sm text-gray-600 z-10">
                                    <p className="font-medium mb-2">Asistan Özellikleri:</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                        <li>Fiyatlandırma ve kâr hesaplamaları</li>
                                        <li>Stok ve envanter yönetimi</li>
                                        <li>Pazaryeri optimizasyonu</li>
                                        <li>Satış stratejileri</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hızlı Erişim Butonları */}
                <div className="bg-white border-b p-4">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex flex-wrap gap-2">
                            {promptCategories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => handleCategorySelect(category.id)}
                                    className={`flex items-center px-3 py-2 rounded-lg text-white text-sm font-medium transition-colors ${category.color} hover:opacity-90 ${activeCategory === category.id ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                                >
                                    <category.icon className="w-4 h-4 mr-2" />
                                    {category.title}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Örnek Promptlar */}
                {showExamples && activeCategory && (
                    <div className="bg-gray-50 border-b p-4">
                        <div className="max-w-3xl mx-auto">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Örnek Sorular:</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                {promptExamples[activeCategory].map((example, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handlePromptSelect(example.prompt)}
                                        className="bg-white p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm cursor-pointer transition-all"
                                    >
                                        <p className="text-sm font-medium text-gray-800">{example.title}</p>
                                        <p className="text-xs text-gray-500 mt-1 truncate">{example.prompt}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Mesajlaşma Alanı */}
                <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
                    <div className="max-w-3xl mx-auto space-y-4">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] p-4 rounded-lg ${
                                        message.role === 'user'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white text-gray-800 shadow-sm'
                                    }`}
                                >
                                    <div className="flex items-start space-x-2">
                                        {message.role === 'assistant' && (
                                            <FaRobot className="w-5 h-5 mt-1 text-indigo-600 flex-shrink-0" />
                                        )}
                                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="max-w-[80%] p-4 rounded-lg bg-white shadow-sm">
                                    <div className="flex items-center space-x-2">
                                        <FaRobot className="w-5 h-5 text-indigo-600" />
                                        <div style={styles.typingIndicator} className="typing-indicator">
                                            <span style={{...styles.typingDot, ...styles.typingDot1}}></span>
                                            <span style={{...styles.typingDot, ...styles.typingDot2}}></span>
                                            <span style={styles.typingDot}></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Mesaj Gönderme Alanı */}
                <div className="border-t bg-white p-4">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex space-x-4">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                                placeholder="Örnek: Trendyol'da Elektronik kategorisi için optimum kâr marjı nedir?"
                                className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                                disabled={isLoading}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={isLoading || !input.trim()}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                <FaPaperPlane className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Assistant; 