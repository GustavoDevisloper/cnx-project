import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FollowableUser, 
  searchUsers, 
  followUser, 
  unfollowUser, 
  suggestUsersToFollow,
  directUserSuggestions
} from '@/services/followService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, UserCheck, Users, Loader2 } from 'lucide-react';
import { debounce } from 'lodash';
import { toast } from '@/hooks/use-toast';
import { testSupabaseConnection } from '@/services/supabaseClient';
import { getHardcodedUsers } from '@/services/directUserHardcoded';
import { forceLog, checkConsoleStatus } from '@/lib/directConsoleLogs';
import { logger } from '@/lib/utils';
import { restoreConsole } from '../lib/consoleOverride';

interface UserSearchAndFollowProps {
  className?: string;
  onUserClick?: (userId: string) => void;
  showSuggestions?: boolean;
  compact?: boolean;
  initialResults?: FollowableUser[];
  initialQuery?: string;
}

const UserSearchAndFollow: React.FC<UserSearchAndFollowProps> = ({
  className = '',
  onUserClick,
  showSuggestions = true,
  compact = false,
  initialResults = [],
  initialQuery = ''
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<FollowableUser[]>(initialResults);
  const [suggestions, setSuggestions] = useState<FollowableUser[]>([]);
  const [isSearching, setIsSearching] = useState(Boolean(initialQuery));
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<{connected: boolean, error?: any} | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Restaura o console para garantir que os logs funcionem
    restoreConsole();
    
    // Força um log direto para diagnosticar se o console está funcionando
    window.console.log('%c DIAGNÓSTICO: UserSearchAndFollow montado ', 'background: #6200ee; color: white; padding: 2px 4px;');
    
    // Tente carregar as sugestões
    const loadInitialSuggestions = async () => {
      try {
        // Força mensagem de log para verificar funcionamento
        window.console.log('%c Carregando sugestões de usuários... ', 'background: #03a9f4; color: white;');
        
        // Carrega sugestões
        const suggestedUsers = await suggestUsersToFollow();
        
        // Log direto dos resultados
        window.console.log('Sugestões recebidas:', suggestedUsers);
        
        if (!suggestedUsers || suggestedUsers.length === 0) {
          // Se não houver sugestões, use dados simulados para debug
          window.console.log('%c Sem sugestões reais, usando dados simulados', 'background: orange; color: black;');
          
          setSuggestions([
            {
              id: '1',
              username: 'usuario_teste1',
              displayName: 'Usuário de Teste 1',
              avatarUrl: 'https://ui-avatars.com/api/?name=Teste&background=random',
              isFollowing: false
            },
            {
              id: '2',
              username: 'usuario_teste2',
              displayName: 'Usuário de Teste 2',
              avatarUrl: 'https://ui-avatars.com/api/?name=Teste2&background=random',
              isFollowing: false
            }
          ]);
        } else {
          // Use as sugestões reais
          window.console.log('%c Usando sugestões reais ', 'background: green; color: white;');
          setSuggestions(suggestedUsers);
        }
      } catch (error) {
        // Força log direto para o erro
        window.console.error('Erro ao carregar sugestões:', error);
        window.alert('Erro ao carregar sugestões: ' + String(error));
        
        // Use dados simulados em caso de erro
        setSuggestions([
          {
            id: 'error1',
            username: 'usuario_fallback',
            displayName: 'Usuário Fallback',
            avatarUrl: 'https://ui-avatars.com/api/?name=Error&background=red',
            isFollowing: false
          }
        ]);
      }
    };

    loadInitialSuggestions();
  }, []);

  // Pesquisa usuários quando a consulta muda
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      debouncedSearch(searchQuery);
      setIsSearching(true);
    } else {
      setSearchResults(initialResults);
      setIsSearching(Boolean(initialResults.length > 0));
    }
  }, [searchQuery]);

  // Função de pesquisa com debounce
  const debouncedSearch = debounce(async (query: string) => {
    setIsLoading(true);
    const results = await searchUsers(query);
    setSearchResults(results);
    setIsLoading(false);
  }, 300);

  // Manipula o clique para seguir um usuário
  const handleFollowClick = async (userId: string, isFollowed: boolean) => {
    if (isFollowed) {
      const success = await unfollowUser(userId);
      if (success) {
        // Atualiza usuário nos resultados da pesquisa
        setSearchResults(prev => 
          prev.map(user => 
            user.id === userId ? { ...user, is_followed: false } : user
          )
        );
        // Atualiza usuário nas sugestões
        setSuggestions(prev => 
          prev.map(user => 
            user.id === userId ? { ...user, is_followed: false } : user
          )
        );
      }
    } else {
      const success = await followUser(userId);
      if (success) {
        // Atualiza usuário nos resultados da pesquisa
        setSearchResults(prev => 
          prev.map(user => 
            user.id === userId ? { ...user, is_followed: true } : user
          )
        );
        // Atualiza usuário nas sugestões
        setSuggestions(prev => 
          prev.map(user => 
            user.id === userId ? { ...user, is_followed: true } : user
          )
        );
      }
    }
  };

  // Manipula o clique para visualizar o perfil
  const handleUserClick = (userId: string) => {
    if (onUserClick) {
      onUserClick(userId);
    } else {
      navigate(`/profile/${userId}`);
    }
  };

  // Obtém as iniciais do nome para o avatar fallback
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Renderiza um item de usuário
  const renderUserItem = (user: FollowableUser) => (
    <div 
      key={user.id} 
      className={`flex items-center justify-between ${compact ? 'py-2' : 'py-3'}`}
    >
      <div 
        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0" 
        onClick={() => handleUserClick(user.id)}
      >
        <Avatar className={compact ? "h-8 w-8" : "h-10 w-10"}>
          <AvatarImage src={user.avatar_url || undefined} alt={user.display_name || user.username} />
          <AvatarFallback>
            {getInitials(user.display_name || user.username)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className={`font-medium truncate ${compact ? 'text-sm' : ''}`}>
            {user.display_name || user.username}
          </p>
          <p className={`text-muted-foreground truncate ${compact ? 'text-xs' : 'text-sm'}`}>
            @{user.username}
            {user.followers_count > 0 && (
              <span className="ml-2">
                {user.followers_count} {user.followers_count === 1 ? 'seguidor' : 'seguidores'}
              </span>
            )}
          </p>
        </div>
      </div>
      
      <Button 
        variant={user.is_followed ? "outline" : "default"} 
        size={compact ? "sm" : "default"}
        onClick={(e) => {
          e.stopPropagation();
          handleFollowClick(user.id, user.is_followed);
        }}
        className="ml-2"
      >
        {user.is_followed ? (
          <>
            <UserCheck className={`${compact ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
            {compact ? 'Seguindo' : 'Seguindo'}
          </>
        ) : (
          <>
            <UserPlus className={`${compact ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
            {compact ? 'Seguir' : 'Seguir'}
          </>
        )}
      </Button>
    </div>
  );

  // Adicionar função de teste de conexão
  const testConnection = async () => {
    try {
      setIsLoading(true);
      const result = await testSupabaseConnection();
      setConnectionStatus(result);
      
      toast({
        title: result.connected ? 'Conexão bem-sucedida' : 'Falha na conexão',
        description: result.connected 
          ? 'Conexão com o Supabase está funcionando' 
          : `Erro: ${result.error?.message || 'Desconhecido'}`,
        variant: result.connected ? 'default' : 'destructive'
      });
      
      if (result.connected) {
        console.log('✅ Conexão com Supabase OK. Tentando carregar sugestões novamente...');
        loadInitialSuggestions();
      }
    } catch (error) {
      console.error('❌ Erro ao testar conexão:', error);
      setConnectionStatus({ connected: false, error });
      
      toast({
        title: 'Erro ao testar conexão',
        description: String(error),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  console.log('🖼️ Renderizando UserSearchAndFollow com:', {
    isLoading,
    isSearching,
    showSuggestions,
    suggestionsLength: suggestions.length,
    suggestions
  });

  return (
    <div className={`${className}`}>
      {!initialResults.length && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuários..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      <Card>
        <CardContent className={compact ? "p-3" : "p-6"}>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : isSearching ? (
            searchResults.length > 0 ? (
              <div className="space-y-2">
                <h3 className={`font-medium mb-3 ${compact ? 'text-sm' : ''}`}>
                  {initialResults.length > 0 
                    ? 'Resultados encontrados'
                    : 'Resultados da busca'
                  }
                </h3>
                <div className="space-y-2 divide-y divide-muted/30">
                  {searchResults.map(renderUserItem)}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum usuário encontrado com "{searchQuery}"
              </div>
            )
          ) : showSuggestions && suggestions.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-medium ${compact ? 'text-sm' : ''}`}>Sugestões para seguir</h3>
                <Badge variant="secondary" className="flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  {suggestions.length}
                </Badge>
              </div>
              <div className="space-y-2 divide-y divide-muted/30">
                {suggestions.map(renderUserItem)}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-4 text-muted-foreground">
                {showSuggestions ? 
                  "Nenhuma sugestão disponível no momento" : 
                  "Digite para buscar usuários"}
              </div>
              
              {/* Área de depuração - mostrar detalhes do erro ou resultado vazio */}
              {(debugInfo || connectionStatus) && (
                <div className="bg-muted/30 p-3 rounded-md text-xs">
                  <div className="font-medium mb-2 flex justify-between items-center">
                    <span>Informações de depuração:</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs h-7"
                      onClick={() => testConnection()}
                    >
                      Testar conexão
                    </Button>
                  </div>
                  
                  {connectionStatus && (
                    <div className={`mb-3 p-2 rounded ${connectionStatus.connected ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                      <div className="font-medium">
                        Status da conexão: {connectionStatus.connected ? '✅ Conectado' : '❌ Desconectado'}
                      </div>
                      {connectionStatus.error && (
                        <div className="mt-1">
                          Erro: {connectionStatus.error.message || JSON.stringify(connectionStatus.error)}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {debugInfo && (
                    <pre className="whitespace-pre-wrap overflow-auto max-h-40 p-2 bg-slate-100 dark:bg-slate-900 rounded">
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                  )}
                  
                  <div className="flex space-x-2 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs flex-1"
                      onClick={() => loadInitialSuggestions()}
                    >
                      Recarregar sugestões
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs flex-1"
                      onClick={() => {
                        setDebugInfo(null);
                        setConnectionStatus(null);
                      }}
                    >
                      Limpar logs
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {!isLoading && !isSearching && suggestions.length === 0 && (
        <div className="text-center py-8">
          <h3 className="font-medium text-lg mb-4">Teste de Renderização</h3>
          <Button 
            onClick={() => {
              // Tenta força a exibição de dados hardcoded
              const hardcoded = getHardcodedUsers();
              console.log('🔄 Forçando exibição hardcoded via botão:', hardcoded);
              setSuggestions(hardcoded);
            }}
          >
            Forçar Exibição de Usuários
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserSearchAndFollow; 