import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ProfileSearchBar from '@/components/ProfileSearchBar';
import { FollowableUser, suggestUsersToFollow } from '@/services/followService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, UserCheck, Users, ArrowRight, Loader2 } from 'lucide-react';
import { isAuthenticated, getCurrentUser } from '@/services/authService';
import { useNavigate } from 'react-router-dom';

const HomeComponent = () => {
  const [suggestedUsers, setSuggestedUsers] = useState<FollowableUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await isAuthenticated();
      setIsAuthenticated(authStatus);
      
      if (authStatus) {
        loadSuggestions();
      }
    };
    
    checkAuth();
  }, []);

  const loadSuggestions = async () => {
    setIsLoading(true);
    try {
      const users = await suggestUsersToFollow(5);
      setSuggestedUsers(users);
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna principal */}
        <div className="md:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-primary/80 to-primary p-6 text-white">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Bem-vindo à Conexão Jovem
              </h1>
              <p className="opacity-90">
                Conecte-se com outros jovens, compartilhe experiências e cresça na fé
              </p>
            </div>
            
            <CardContent className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium mb-3">Encontre pessoas para seguir</h2>
                <ProfileSearchBar 
                  placeholder="Busque por nome, username ou e-mail..."
                  className="w-full"
                  autoFocus={false}
                />
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm">Atividades recentes</h3>
                <Button variant="link" size="sm" className="h-auto p-0">
                  Ver tudo
                </Button>
              </div>
              
              <div className="bg-muted/30 rounded-md py-6 px-4 text-center text-muted-foreground">
                <p>Acompanhe as atividades dos usuários que você segue</p>
                {isAuthenticated ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => navigate('/user-search')}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Encontrar pessoas para seguir
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => navigate('/login')}
                  >
                    Faça login para começar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Eventos e devocionais recentes podem ser adicionados aqui */}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {isAuthenticated && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Sugestões para seguir
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : suggestedUsers.length > 0 ? (
                  <div className="space-y-3">
                    {suggestedUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div 
                          className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                          onClick={() => navigate(`/profile/${user.id}`)}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || undefined} alt={user.display_name || user.username} />
                            <AvatarFallback>
                              {getInitials(user.display_name || user.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {user.display_name || user.username}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => navigate(`/profile/${user.id}`)}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <Button 
                      variant="outline" 
                      className="w-full mt-2 text-xs" 
                      size="sm"
                      onClick={() => navigate('/user-search?tab=suggestions')}
                    >
                      Ver mais sugestões
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-3 text-muted-foreground text-sm">
                    Nenhuma sugestão disponível no momento
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Mais cards para a sidebar */}
        </div>
      </div>
    </div>
  );
};

export default HomeComponent; 