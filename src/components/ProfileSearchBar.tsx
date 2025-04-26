import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { searchUsers, FollowableUser } from '@/services/followService';
import { Search, UserPlus, UserCheck, Users, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { debounce } from 'lodash';

interface ProfileSearchBarProps {
  placeholder?: string;
  onUserSelect?: (userId: string) => void;
  className?: string;
  autoFocus?: boolean;
  showSearchIcon?: boolean;
  showResults?: boolean;
  maxResults?: number;
}

const ProfileSearchBar: React.FC<ProfileSearchBarProps> = ({
  placeholder = 'Buscar usuários...',
  onUserSelect,
  className = '',
  autoFocus = false,
  showSearchIcon = true,
  showResults = true,
  maxResults = 5
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FollowableUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Pesquisa de usuários com debounce
  const debouncedSearch = debounce(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchUsers(query);
      setSearchResults(results.slice(0, maxResults));
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setIsLoading(false);
    }
  }, 300);

  // Atualizar a busca quando a consulta mudar
  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery]);

  // Lidar com cliques fora do componente para fechar os resultados
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current && 
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Manipular seleção de usuário
  const handleUserClick = (userId: string) => {
    setSearchQuery('');
    setSearchResults([]);
    setIsFocused(false);
    
    if (onUserSelect) {
      onUserSelect(userId);
    } else {
      navigate(`/profile/${userId}`);
    }
  };

  // Obter iniciais para o avatar
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Limpar a busca
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {showSearchIcon && (
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        )}
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className={`${showSearchIcon ? 'pl-9' : 'pl-3'} pr-8`}
          autoFocus={autoFocus}
        />
        {searchQuery && (
          <button
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Resultados da pesquisa */}
      {showResults && isFocused && searchQuery.trim().length >= 2 && (
        <div 
          ref={resultsRef} 
          className="absolute z-50 mt-1 w-full bg-background rounded-md border shadow-lg overflow-hidden"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="ml-2 text-sm">Buscando...</span>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="max-h-[300px] overflow-y-auto">
              {searchResults.map(user => (
                <div 
                  key={user.id}
                  className="px-3 py-2 hover:bg-muted/50 cursor-pointer flex items-center justify-between border-b last:border-0"
                  onClick={() => handleUserClick(user.id)}
                >
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || undefined} alt={user.display_name || user.username} />
                      <AvatarFallback>
                        {getInitials(user.display_name || user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <p className="font-medium text-sm">{user.display_name || user.username}</p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                  
                  {user.followers_count > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {user.followers_count}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              Nenhum usuário encontrado com "{searchQuery}"
            </div>
          )}
          
          {/* Link para busca avançada */}
          {searchResults.length > 0 && (
            <div className="px-3 py-2 bg-muted/30 border-t">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => {
                  navigate(`/user-search?q=${encodeURIComponent(searchQuery)}`);
                  setIsFocused(false);
                }}
              >
                <Search className="h-3 w-3 mr-1" />
                Ver todos os resultados
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileSearchBar; 