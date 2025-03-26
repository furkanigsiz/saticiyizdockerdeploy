import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Search as SearchIcon } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const goToHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-svh bg-background p-6 md:p-10">
      <Helmet>
        <title>Sayfa Bulunamadı - Saticiyiz.com</title>
        <meta name="description" content="Aradığınız sayfa bulunamadı. Satıcıyız.com'a geri dönün." />
      </Helmet>
      
      <div className="max-w-xl mx-auto w-full text-center">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-2">Sayfa bulunamadı</h1>
        <p className="text-muted-foreground mb-6">Aradığınız sayfa taşınmış veya silinmiş olabilir. Lütfen tekrar kontrol edin.</p>
        
        <div className="flex justify-center my-6">
          <Button 
            variant="outline" 
            className="mx-auto py-2 px-6" 
            onClick={goToHome} 
            type="button"
          >
            Ana Sayfaya Dön
          </Button>
        </div>
        
        <div className="mt-12 max-w-md mx-auto">
          <h2 className="text-lg font-medium mb-4 text-center">Aradığınızı bulamadınız mı?</h2>
          <form onSubmit={handleSearch} className="flex gap-2">
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
            <Button 
              type="submit"
              variant="outline"
              aria-label="Ara"
            >
              Ara
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 