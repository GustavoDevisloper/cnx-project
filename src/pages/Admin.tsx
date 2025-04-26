import { useEffect, useState } from "react";
import { Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { isAdmin, isLeader, getCurrentUser, isAuthenticated, getAllUsers, User } from "@/services/authService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UsersList from "@/components/UsersList";
import LeaderManagement from "@/components/LeaderManagement";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Users, Calendar, MessageCircleQuestion, Music, Settings, FileText, BarChart, RefreshCw, MessageSquare } from "lucide-react";
import EventsList from "@/components/EventsList";
import QuestionsList from "@/components/QuestionsList";
import { toast } from "@/hooks/use-toast";
import { DashboardStats, getDashboardStats } from "@/services/statsService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getWhatsAppLink } from "@/services/whatsappBotService";
import { logger } from "@/lib/utils";
import WhatsAppPage from './admin/WhatsApp';

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const defaultTab = searchParams.get('tab') || 'dashboard';
  
  // Estado para as estatísticas
  const [stats, setStats] = useState<DashboardStats>({
    usersCount: 0,
    eventsCount: 0,
    devotionalsCount: 0,
    loading: true,
    error: null
  });
  
  // Estado para a lista de usuários
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Função para carregar usuários
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      logger.error("Erro ao carregar lista de usuários:", error);
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível obter a lista de usuários",
        variant: "destructive"
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  // Função para abrir chat no WhatsApp
  const openWhatsAppChat = (phoneNumber: string | undefined, userName?: string) => {
    if (!phoneNumber) {
      toast({
        title: "Número não disponível",
        description: "Este usuário não cadastrou um número de telefone",
        variant: "destructive"
      });
      return;
    }
    
    logger.log(`Tentando abrir WhatsApp para: ${userName || 'usuário'} - Número: ${phoneNumber}`);
    
    // Usar a função do serviço para criar o link apenas com o número (sem mensagem)
    const whatsappLink = getWhatsAppLink(phoneNumber);
    
    if (whatsappLink) {
      logger.log(`Link do WhatsApp gerado com sucesso: ${whatsappLink}`);
      window.open(whatsappLink, '_blank');
    } else {
      logger.error(`Erro ao gerar link do WhatsApp para o número: ${phoneNumber}`);
      toast({
        title: "Erro ao gerar link do WhatsApp",
        description: "O número de telefone pode estar em um formato inválido. Por favor, verifique se o formato está correto (ex: (11) 99999-9999)",
        variant: "destructive"
      });
    }
  };
  
  // Função para carregar as estatísticas
  const loadStats = async () => {
    setStats(prev => ({ ...prev, loading: true, error: null }));
    try {
      const dashboardStats = await getDashboardStats();
      setStats(dashboardStats);
    } catch (error: any) {
      logger.error("Erro ao carregar estatísticas:", error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error.message || "Erro ao carregar estatísticas"
      }));
      toast({
        title: "Erro ao carregar estatísticas",
        description: "Não foi possível obter os dados do servidor",
        variant: "destructive"
      });
    }
  };
  
  useEffect(() => {
    document.title = "Conexão Jovem | Administração";
    
    const checkAccess = async () => {
      try {
        const authStatus = await isAuthenticated();
        
        if (!authStatus) {
          logger.log("Usuário não está autenticado");
          setIsLoggedIn(false);
          setLoading(false);
          return;
        }
        
        setIsLoggedIn(true);
        
        const user = await getCurrentUser();
        logger.log("Dados do usuário:", user);
        
        if (!user) {
          logger.log("Dados do usuário não encontrados");
          toast({
            title: "Erro de permissão",
            description: "Não foi possível carregar os dados do usuário",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
        
        const isUserAdmin = user.role === 'admin';
        const isUserLeader = user.role === 'leader';
        
        const hasPermission = isUserAdmin || isUserLeader;
        
        logger.log("É admin:", isUserAdmin);
        logger.log("É líder:", isUserLeader);
        logger.log("Tem permissão:", hasPermission);
        
        setIsAdminUser(isUserAdmin);
        setHasAccess(hasPermission);
        
        if (!hasPermission) {
          toast({
            title: "Acesso negado",
            description: "Você não possui permissões para acessar esta área",
            variant: "destructive"
          });
        } else {
          // Se tem permissão, carrega as estatísticas
          loadStats();
        }
      } catch (error) {
        logger.error("Erro ao verificar permissões:", error);
        toast({
          title: "Erro ao verificar permissões",
          description: "Por favor, tente novamente ou entre em contato com o suporte",
          variant: "destructive"
        });
        setIsLoggedIn(false);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    const handleAuthChanged = () => {
      logger.log("🔄 Estado de autenticação mudou, verificando permissões");
      checkAccess();
    };

    window.addEventListener('auth-state-changed', handleAuthChanged);
    
    checkAccess();
    
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthChanged);
    };
  }, []);

  // Efeito para carregar estatísticas quando a aba do dashboard é selecionada
  useEffect(() => {
    if (defaultTab === 'dashboard' && hasAccess && !loading) {
      loadStats();
    }
  }, [defaultTab, hasAccess, loading]);

  // Efeito para carregar usuários quando a aba WhatsApp é selecionada
  useEffect(() => {
    if (defaultTab === 'whatsapp' && hasAccess && !loading) {
      loadUsers();
    }
  }, [defaultTab, hasAccess, loading]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    logger.log("Redirecionando para login com URL de retorno");
    return <Navigate to={`/login?redirect=${encodeURIComponent('/admin')}`} replace />;
  }

  if (!hasAccess) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-3xl font-bold mb-6">Acesso Negado</h1>
        <p className="mb-6">Você não tem permissão para acessar esta área.</p>
        <Button onClick={() => navigate('/')}>Voltar para a Página Inicial</Button>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Painel Administrativo</h1>
      
      <Tabs defaultValue={defaultTab} value={defaultTab} onValueChange={(value) => {
        navigate(`/admin?tab=${value}`, { replace: true });
      }}>
        <TabsList className="mb-4">
          <TabsTrigger 
            value="dashboard" 
            onClick={() => navigate('/admin?tab=dashboard', { replace: true })}
          >
            <BarChart className="h-4 w-4 mr-1.5" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger 
            value="events" 
            onClick={() => navigate('/admin?tab=events', { replace: true })}
          >
            <Calendar className="h-4 w-4 mr-1.5" />
            Eventos
          </TabsTrigger>
          <TabsTrigger 
            value="questions" 
            onClick={() => navigate('/admin?tab=questions', { replace: true })}
          >
            <MessageCircleQuestion className="h-4 w-4 mr-1.5" />
            Dúvidas
          </TabsTrigger>
          {isAdminUser && (
            <>
            <TabsTrigger 
              value="users" 
              onClick={() => navigate('/admin?tab=users', { replace: true })}
            >
              <Users className="h-4 w-4 mr-1.5" />
              Usuários
            </TabsTrigger>
              <TabsTrigger 
                value="whatsapp" 
                onClick={() => navigate('/admin?tab=whatsapp', { replace: true })}
              >
                <MessageSquare className="h-4 w-4 mr-1.5" />
                WhatsApp
              </TabsTrigger>
            </>
          )}
          <TabsTrigger 
            value="content" 
            onClick={() => navigate('/admin?tab=content', { replace: true })}
          >
            <FileText className="h-4 w-4 mr-1.5" />
            Conteúdo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Estatísticas</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={loadStats} 
                    disabled={stats.loading}
                    className="h-8 w-8 p-0"
                    title="Atualizar estatísticas"
                  >
                    <RefreshCw className={`h-4 w-4 ${stats.loading ? 'animate-spin' : ''}`} />
                    <span className="sr-only">Atualizar estatísticas</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {stats.error ? (
                  <div className="py-2 text-center text-sm text-destructive">
                    <p>Erro ao carregar estatísticas.</p>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-sm" 
                      onClick={loadStats}
                    >
                      Tentar novamente
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Usuários</span>
                      {stats.loading ? (
                        <div className="h-4 w-8 bg-muted animate-pulse rounded"></div>
                      ) : (
                        <span className="font-medium">{stats.usersCount}</span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Eventos</span>
                      {stats.loading ? (
                        <div className="h-4 w-8 bg-muted animate-pulse rounded"></div>
                      ) : (
                        <span className="font-medium">{stats.eventsCount}</span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Devocionais</span>
                      {stats.loading ? (
                        <div className="h-4 w-8 bg-muted animate-pulse rounded"></div>
                      ) : (
                        <span className="font-medium">{stats.devotionalsCount}</span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Funcionalidade em desenvolvimento.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => {
                    logger.log("Navegando para /devotional/new");
                    navigate('/devotional/new');
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Novo Devocional
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/playlists')}>
                  <Music className="mr-2 h-4 w-4" />
                  Gerenciar Playlists
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/events/new')}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Criar Evento
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Eventos</CardTitle>
                  <CardDescription>
                    Gerencie os eventos da igreja
                  </CardDescription>
                </div>
                <Button onClick={() => navigate('/events/new')}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Novo Evento
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <EventsList />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Dúvidas Pendentes</CardTitle>
                  <CardDescription>
                    Responda às dúvidas dos membros
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => navigate('/questions')}>
                  <MessageCircleQuestion className="mr-2 h-4 w-4" />
                  Ver Todas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <QuestionsList />
            </CardContent>
          </Card>
        </TabsContent>
        
        {isAdminUser && (
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gerenciar Usuários</CardTitle>
                    <CardDescription>
                      Visualize todos os usuários cadastrados no sistema
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <UsersList />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="whatsapp" className="space-y-4">
          <WhatsAppPage />
        </TabsContent>
        
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gerenciar Conteúdo</CardTitle>
                  <CardDescription>
                    Administre o conteúdo do site (devocionais, playlists, etc.)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Devocionais</CardTitle>
                      <CardDescription>Gerenciar conteúdo devocional</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start" 
                        onClick={() => {
                          logger.log("Navegando para /devotional/new");
                          navigate('/devotional/new');
                        }}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Novo Devocional
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Playlists</CardTitle>
                      <CardDescription>Gerenciar playlists de música</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button onClick={() => navigate('/playlists')}>
                        <Music className="mr-2 h-4 w-4" />
                        Gerenciar Playlists
                      </Button>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="text-center py-4 text-muted-foreground">
                  <p>Mais opções de gerenciamento de conteúdo serão adicionadas em breve.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
