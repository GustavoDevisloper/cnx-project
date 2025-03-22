import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, getCurrentUser, getUserById, updateUserProfile } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { User as UserIcon, Edit, Save, Calendar, MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';

interface ExtendedUser extends User {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt?: string;
  profileViews?: number;
}

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    avatarUrl: ''
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        
        // If no userId provided, show current user profile
        let profileUser;
        if (!userId) {
          if (!currentUser) {
            navigate('/login?redirect=/profile');
            return;
          }
          profileUser = currentUser;
          setIsCurrentUser(true);
        } else {
          profileUser = await getUserById(userId);
          setIsCurrentUser(currentUser?.id === userId);
        }
        
        if (!profileUser) {
          navigate('/not-found');
          return;
        }
        
        // Set default values if not present
        const enhancedUser: ExtendedUser = {
          ...profileUser,
          displayName: profileUser.displayName || profileUser.username,
          bio: profileUser.bio || 'Nenhuma biografia disponível.',
          avatarUrl: profileUser.avatarUrl || '',
          createdAt: profileUser.createdAt || new Date().toISOString(),
          profileViews: profileUser.profileViews || 0
        };
        
        setUser(enhancedUser);
        setFormData({
          displayName: enhancedUser.displayName,
          bio: enhancedUser.bio,
          avatarUrl: enhancedUser.avatarUrl
        });
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        toast({
          title: 'Erro ao carregar perfil',
          description: 'Não foi possível carregar as informações do perfil.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [userId, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      const updatedUser = await updateUserProfile(user.id, {
        displayName: formData.displayName,
        bio: formData.bio,
        avatarUrl: formData.avatarUrl
      });
      
      if (updatedUser) {
        setUser({
          ...user,
          displayName: formData.displayName,
          bio: formData.bio,
          avatarUrl: formData.avatarUrl
        });
        setIsEditing(false);
        toast({
          title: 'Perfil atualizado',
          description: 'Suas informações foram atualizadas com sucesso.'
        });
      }
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: 'Erro ao atualizar',
        description: error.message || 'Não foi possível salvar as alterações.',
        variant: 'destructive'
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <div className="container py-10 flex justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-10">
        <Card>
          <CardContent className="pt-6 text-center">
            <p>Usuário não encontrado.</p>
            <Button 
              className="mt-4" 
              variant="outline" 
              onClick={() => navigate('/')}
            >
              Voltar para a página inicial
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader className="relative">
            <div className="absolute top-4 right-4">
              {isCurrentUser && (
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                </Button>
              )}
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              {isEditing ? (
                <div className="space-y-2">
                  <Avatar className="w-24 h-24">
                    {formData.avatarUrl ? (
                      <AvatarImage src={formData.avatarUrl} alt={formData.displayName} />
                    ) : (
                      <AvatarFallback>{getInitials(formData.displayName)}</AvatarFallback>
                    )}
                  </Avatar>
                  <Input
                    name="avatarUrl"
                    value={formData.avatarUrl}
                    onChange={handleInputChange}
                    placeholder="URL da imagem de perfil"
                    className="mt-2"
                  />
                </div>
              ) : (
                <Avatar className="w-24 h-24">
                  {user.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                  ) : (
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                  )}
                </Avatar>
              )}
              
              <div className="flex-1 text-center md:text-left">
                {isEditing ? (
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Nome de exibição</Label>
                    <Input
                      id="displayName"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      placeholder="Nome de exibição"
                    />
                  </div>
                ) : (
                  <CardTitle className="text-2xl">{user.displayName}</CardTitle>
                )}
                
                <CardDescription className="flex items-center mt-1">
                  <UserIcon className="w-4 h-4 mr-1" />
                  @{user.username}
                </CardDescription>
                
                <div className="flex flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Membro desde {new Date(user.createdAt || '').toLocaleDateString('pt-BR')}
                  </div>
                  
                  <div className="flex items-center ml-4">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    {user.profileViews || 0} visualizações
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="about" className="mt-4">
              <TabsList>
                <TabsTrigger value="about">Sobre</TabsTrigger>
                <TabsTrigger value="activity">Atividade</TabsTrigger>
              </TabsList>
              
              <TabsContent value="about" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Biografia</h3>
                    {isEditing ? (
                      <Textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Conte algo sobre você..."
                        rows={5}
                      />
                    ) : (
                      <p className="text-muted-foreground whitespace-pre-line">
                        {user.bio}
                      </p>
                    )}
                  </div>
                  
                  {isEditing && (
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveProfile}>
                        Salvar alterações
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="activity" className="mt-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-2">Atividade recente</h3>
                  <div className="text-muted-foreground">
                    <p>Nenhuma atividade recente para mostrar.</p>
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