import { useEffect, useState } from "react";
import { Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { isAdmin, isLeader, getCurrentUser, isAuthenticated } from "@/services/authService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UsersList from "@/components/UsersList";
import LeaderManagement from "@/components/LeaderManagement";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Users, Calendar, MessageCircleQuestion, Music, Settings, FileText, BarChart } from "lucide-react";
import EventsList from "@/components/EventsList";
import QuestionsList from "@/components/QuestionsList";
import { toast } from "@/hooks/use-toast";

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const defaultTab = searchParams.get('tab') || 'dashboard';
  
  useEffect(() => {
    document.title = "Conexão Jovem | Administração";
    
    const checkAccess = async () => {
      try {
        const authStatus = await isAuthenticated();
        
        if (!authStatus) {
          console.log("Usuário não está autenticado");
          setIsLoggedIn(false);
          setLoading(false);
          return;
        }
        
        setIsLoggedIn(true);
        
        const user = await getCurrentUser();
        console.log("Dados do usuário:", user);
        
        if (!user) {
          console.log("Dados do usuário não encontrados");
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
        
        console.log("É admin:", isUserAdmin);
        console.log("É líder:", isUserLeader);
        console.log("Tem permissão:", hasPermission);
        
        setIsAdminUser(isUserAdmin);
        setHasAccess(hasPermission);
        
        if (!hasPermission) {
          toast({
            title: "Acesso negado",
            description: "Você não possui permissões para acessar esta área",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Erro ao verificar permissões:", error);
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
      console.log("🔄 Estado de autenticação mudou, verificando permissões");
      checkAccess();
    };

    window.addEventListener('auth-state-changed', handleAuthChanged);
    
    checkAccess();
    
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthChanged);
    };
  }, []);

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
    console.log("Redirecionando para login com URL de retorno");
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
      
      <Tabs defaultValue={defaultTab} value={defaultTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="events">Eventos</TabsTrigger>
          <TabsTrigger value="questions">Dúvidas</TabsTrigger>
          {isAdminUser && <TabsTrigger value="users">Usuários</TabsTrigger>}
          <TabsTrigger value="leaders">Líderes</TabsTrigger>
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Usuários</span>
                    <span className="font-medium">24</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Eventos</span>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Devocionais</span>
                    <span className="font-medium">45</span>
                  </div>
                </div>
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
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/devotional/new')}>
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
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Usuários</CardTitle>
                <CardDescription>
                  Visualize todos os usuários cadastrados no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UsersList />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="leaders">
          <div className="space-y-6">
            <LeaderManagement />
            
            <Card>
              <CardHeader>
                <CardTitle>Lista de Líderes</CardTitle>
                <CardDescription>
                  Visualize todos os líderes atuais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UsersList filterRole="leader" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Devocionais</CardTitle>
                  <Button size="sm" onClick={() => navigate('/devotional/new')}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Novo
                  </Button>
                </div>
                <CardDescription>
                  Gerencie os devocionais e planos de leitura
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Total de devocionais: 45
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Playlists</CardTitle>
                  <Button size="sm" onClick={() => navigate('/playlists')}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nova
                  </Button>
                </div>
                <CardDescription>
                  Gerencie as playlists de música
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Gerencie as playlists para cultos e eventos
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
