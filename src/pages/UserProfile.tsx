import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, getUserById, isAdmin } from '@/services/authService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldCheck, User as UserIcon, Mail, Phone, Calendar, Info, ArrowLeft, Edit, Lock, MessageSquare } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDate, logger } from '@/lib/utils';
import WhatsAppContactOptions from '@/components/WhatsAppContactOptions';

interface ExtendedUser extends User {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt?: string;
  profileViews?: number;
  username?: string;
  phone?: string;
  lastLogin?: string;
  loginCount?: number;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Verificar se o usuário atual é administrador
        const adminStatus = await isAdmin();
        setIsAdminUser(adminStatus);
        
        if (!adminStatus) {
          toast({
            title: "Acesso restrito",
            description: "Você não tem permissão para acessar as informações detalhadas do usuário.",
            variant: "destructive"
          });
          
          navigate('/admin');
          return;
        }
        
        if (!userId) {
          navigate('/admin');
          return;
        }
        
        // Buscar dados do usuário
        const userData = await getUserById(userId);
        if (!userData) {
          toast({
            title: "Usuário não encontrado",
            description: "Não foi possível encontrar o usuário solicitado.",
            variant: "destructive"
          });
          navigate('/admin');
          return;
        }
        
        logger.log("Dados brutos do usuário:", userData);
        
        // Formatar dados do usuário
        const formattedUser: ExtendedUser = {
          ...userData,
          displayName: userData.display_name || userData.username,
          bio: userData.bio || 'Nenhuma biografia disponível.',
          avatarUrl: userData.avatar_url || '',
          createdAt: userData.created_at || new Date().toISOString(),
          profileViews: userData.profile_views || 0,
          username: userData.username || '',
          phone: userData.phone_number || 'Não informado',
          lastLogin: userData.last_login || 'Nunca',
          loginCount: userData.login_count || 0
        };
        
        logger.log("Dados formatados do usuário:", formattedUser);
        
        setUser(formattedUser);
        document.title = `Perfil de ${formattedUser.displayName || 'Usuário'}`;
      } catch (error) {
        logger.error('Erro ao carregar perfil:', error);
        toast({
          title: 'Erro ao carregar perfil',
          description: 'Não foi possível carregar as informações do perfil do usuário.',
          variant: 'destructive'
        });
        navigate('/admin');
      } finally {
        setLoading(false);
      }
    };
    
    checkPermissions();
  }, [userId, navigate]);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500">Administrador</Badge>;
      case 'leader':
        return <Badge className="bg-blue-500">Líder</Badge>;
      default:
        return <Badge className="bg-green-500">Usuário</Badge>;
    }
  };
  
  const handleEditUser = () => {
    // Implementar edição de usuário ou navegar para página de edição
    navigate(`/admin/users/edit/${userId}`);
  };
  
  const handleBackToUsers = () => {
    navigate('/admin?tab=users');
  };

  const handleWhatsAppRedirect = (phoneNumber: string | undefined) => {
    if (!phoneNumber || phoneNumber === 'Não informado') {
      toast({
        title: "Número não disponível",
        description: "Este usuário não cadastrou um número de telefone",
        variant: "destructive"
      });
      return;
    }
    
    // Formatar o número (remover caracteres especiais e espaços)
    const formattedNumber = phoneNumber.replace(/\D/g, "");
    
    // Verificar se o número está vazio após a formatação
    if (!formattedNumber) {
      toast({
        title: "Número inválido",
        description: "O formato do número de telefone não é válido",
        variant: "destructive"
      });
      return;
    }
    
    // Abrir URL do WhatsApp
    window.open(`https://wa.me/${formattedNumber}`, '_blank');
  };

  if (loading) {
    return (
      <div className="container py-10 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-10">
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Usuário não encontrado</AlertTitle>
          <AlertDescription>
            Não foi possível encontrar o usuário solicitado.
          </AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={handleBackToUsers}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a lista de usuários
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleBackToUsers}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Perfil do Usuário</h1>
        </div>
        {isAdminUser && (
          <Button onClick={handleEditUser}>
            <Edit className="mr-2 h-4 w-4" />
            Editar Usuário
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              <Avatar className="h-28 w-28 mb-4">
                <AvatarImage 
                  src={user.avatarUrl} 
                  alt={user.displayName} 
                />
                <AvatarFallback className="text-xl">
                  {getInitials(user.displayName || user.username || '')}
                </AvatarFallback>
              </Avatar>
              
              <h2 className="text-2xl font-bold mb-1">{user.displayName}</h2>
              <p className="text-muted-foreground mb-2">@{user.username}</p>
              
              <div className="flex gap-2 mb-4">
                {getRoleBadge(user.role)}
                {user.isVerified && (
                  <Badge variant="outline" className="bg-green-100 text-green-700">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Verificado
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground">
                Membro desde {formatDate(user.createdAt || '')}
              </p>
            </CardContent>
          </Card>

          {/* Adicionar opções de contato via WhatsApp */}
          {isAdminUser && user && (
            <WhatsAppContactOptions user={user} />
          )}
        </div>

        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="info">
                  <UserIcon className="h-4 w-4 mr-2" />
                  Informações
                </TabsTrigger>
                {isAdminUser && (
                  <TabsTrigger value="contact">
                    <Mail className="h-4 w-4 mr-2" />
                    Contato
                  </TabsTrigger>
                )}
                <TabsTrigger value="activity">
                  <Calendar className="h-4 w-4 mr-2" />
                  Atividade
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="info" className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Sobre</h3>
                  <p className="text-muted-foreground">{user.bio}</p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">ID do Usuário</h3>
                  <code className="bg-muted p-2 rounded-md block text-sm overflow-auto">
                    {user.id}
                  </code>
                </div>
              </TabsContent>
              
              {isAdminUser && (
                <TabsContent value="contact" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Email</h3>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <p>{user.email}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Telefone</h3>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        <p>{user.phone || 'Não informado'}</p>
                        
                        {user.phone && user.phone !== 'Não informado' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="ml-2"
                            onClick={() => handleWhatsAppRedirect(user.phone)}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Alert>
                    <Lock className="h-4 w-4" />
                    <AlertTitle>Informações Confidenciais</AlertTitle>
                    <AlertDescription>
                      Estas informações de contato são visíveis apenas para administradores.
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              )}
              
              <TabsContent value="activity" className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Estatísticas</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Último login</p>
                        <p className="text-xl font-semibold">{user.lastLogin === 'Nunca' ? 'Nunca' : formatDate(user.lastLogin || '')}</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Total de logins</p>
                        <p className="text-xl font-semibold">{user.loginCount}</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Visualizações de perfil</p>
                        <p className="text-xl font-semibold">{user.profileViews}</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Conta criada</p>
                        <p className="text-xl font-semibold">{formatDate(user.createdAt || '')}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 