import React, { useState, useEffect } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Helmet } from 'react-helmet';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);

  // URL'den arama sorgusunu al
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, []);

  const performSearch = (query) => {
    setIsLoading(true);
    setNoResults(false);
    
    // Bu örnekte, gerçek bir API çağrısı yerine simüle ediyoruz
    // Gerçek bir projede bu kısım backend ile entegre edilmelidir
    setTimeout(() => {
      // Satıcıyız için örnek sonuçlar
      const dummyResults = [
        { 
          id: 1, 
          title: 'Trendyol Entegrasyonu', 
          url: '/integrations/trendyol', 
          description: 'Trendyol mağazanızı bağlayın ve ürünlerinizi senkronize edin.' 
        },
        { 
          id: 2, 
          title: 'Ürün Yönetimi', 
          url: '/products', 
          description: 'Tüm pazaryerlerindeki ürünlerinizi tek bir yerden yönetin.' 
        },
        { 
          id: 3, 
          title: 'Sipariş Takibi', 
          url: '/orders', 
          description: 'Siparişlerinizi takip edin ve yönetin.' 
        },
        { 
          id: 4, 
          title: 'Fiyatlandırma Stratejileri', 
          url: '/pricing-strategies', 
          description: 'Ürünleriniz için otomatik fiyatlandırma stratejileri oluşturun.' 
        },
        { 
          id: 5, 
          title: 'Satış Analizleri', 
          url: '/analytics', 
          description: 'Satış performansınızı analiz edin ve raporlar oluşturun.' 
        },
      ].filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) || 
        item.description.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(dummyResults);
      setNoResults(dummyResults.length === 0);
      setIsLoading(false);
    }, 500);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // URL'i güncelle
    const url = new URL(window.location);
    url.searchParams.set('q', searchQuery);
    window.history.pushState({}, '', url);
    
    performSearch(searchQuery);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>{searchQuery ? `"${searchQuery}" için Arama Sonuçları` : 'Arama'} - Saticiyiz.com</title>
        <meta name="description" content="Satıcıyız.com içerisinde arama yapın ve ihtiyacınız olan bilgilere hızlıca ulaşın." />
      </Helmet>
      
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Arama Sonuçları</h1>
        
        <form onSubmit={handleSearch} className="mb-8 flex gap-2">
          <div className="relative flex-grow">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ne aramak istersiniz?"
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Arama sorgusu"
            />
          </div>
          <Button type="submit" aria-label="Ara">Ara</Button>
        </form>
        
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : noResults ? (
          <div className="text-center py-10 space-y-4">
            <h2 className="text-xl font-semibold mb-2">Sonuç bulunamadı</h2>
            <p className="text-muted-foreground">
              "{searchQuery}" araması için hiçbir sonuç bulunamadı. Lütfen farklı anahtar kelimelerle tekrar deneyin.
            </p>
            <div className="pt-4">
              <h3 className="font-medium text-primary mb-2">Arama İpuçları:</h3>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                <li>Farklı anahtar kelimeler kullanmayı deneyin</li>
                <li>Daha genel terimlerle arama yapın</li>
                <li>Yazım hatalarını kontrol edin</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              "{searchQuery}" için {searchResults.length} sonuç bulundu
            </p>
            
            {searchResults.map((result) => (
              <div key={result.id} className="border border-border rounded-lg p-4 hover:bg-accent/30 transition-colors">
                <a 
                  href={result.url} 
                  className="block"
                  tabIndex={0}
                  aria-label={`${result.title} - ${result.description}`}
                >
                  <h2 className="text-lg font-medium text-primary mb-1">{result.title}</h2>
                  <p className="text-muted-foreground">{result.description}</p>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search; 