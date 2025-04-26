import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isAuthenticated } from '@/services/authService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Users, UserCheck, UserPlus, Loader2 } from 'lucide-react';
import UserSearchAndFollow from '@/components/UserSearchAndFollow';
import ProfileSearchBar from '@/components/ProfileSearchBar';
import { FollowableUser, searchUsers } from '@/services/followService';

export default function UserSearch() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<FollowableUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialQuery ? 'search' : 'suggestions');

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await isAuthenticated();
      if (!isAuth) {
        navigate('/login?redirect=/user-search');
      }
    };

    checkAuth();
    document.title = 'Buscar usuários | Conexão Jovem';
  }, [navigate]);

  // Executar pesquisa quando há um termo de busca na URL
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  // Realizar pesquisa de usuários
  const performSearch = async (query: string) => {
    if (!query || query.trim().length < 2) return;
    
    setIsLoading(true);
    try {
      const results = await searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar a URL quando o usuário pesquisa
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSearchParams({ q: query });
    performSearch(query);
    setActiveTab('search');
  };

  return (
    <div className="container py-10 max-w-4xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <Users className="mr-3 h-7 w-7" />
          Buscar e conectar
        </h1>
        <p className="text-muted-foreground">
          Encontre outros usuários, siga perfis e expanda sua rede na Conexão Jovem
        </p>
      </header>

      <div className="mb-6">
        <ProfileSearchBar 
          placeholder="Busque por nome, username ou e-mail..."
          className="w-full"
          showResults={false}
          autoFocus={!initialQuery}
          onUserSelect={(userId) => navigate(`/profile/${userId}`)}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </TabsTrigger>
          <TabsTrigger value="suggestions">
            <UserPlus className="h-4 w-4 mr-2" />
            Sugestões
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resultados da busca</CardTitle>
              <CardDescription>
                {initialQuery 
                  ? `Mostrando resultados para "${initialQuery}"`
                  : "Use a barra de pesquisa acima para encontrar usuários"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3">Buscando usuários...</span>
                </div>
              ) : initialQuery ? (
                searchResults.length > 0 ? (
                  <UserSearchAndFollow 
                    showSuggestions={false} 
                    initialResults={searchResults}
                    initialQuery={initialQuery}
                  />
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <p>Nenhum usuário encontrado com "{initialQuery}"</p>
                    <p className="text-sm mt-2">Tente outros termos ou verifique se o nome está correto</p>
                  </div>
                )
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <p>Digite um nome ou username para buscar</p>
                  <p className="text-sm mt-2">Use a barra de pesquisa acima para encontrar usuários</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sugestões para seguir</CardTitle>
              <CardDescription>
                Usuários que você pode querer conhecer e seguir
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserSearchAndFollow showSuggestions={true} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <UserCheck className="h-5 w-5 mr-2" />
            Dicas para conectar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-6 space-y-2">
            <li>Siga outros usuários para ver atualizações e comentários</li>
            <li>Quanto mais conexões você tiver, mais visibilidade seu perfil terá</li>
            <li>Mantenha seu perfil atualizado para atrair mais seguidores</li>
            <li>Você pode buscar por nome, username ou parte do email</li>
            <li>Compartilhe conteúdos e playlists para aumentar seu engajamento</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
} 