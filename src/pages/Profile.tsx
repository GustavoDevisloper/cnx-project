import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, getCurrentUser, getUserById, updateUserProfile } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { User as UserIcon, Edit, Save, Calendar, MessageSquare, Upload, Link as LinkIcon, Camera, Check, X, PencilLine, Info, Image, RefreshCw, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/services/supabaseClient';
import { useAuth } from '@/hooks/auth';
import useDebounce from '@/hooks/useDebounce';
import { uploadImage, getAvailableBucket, fileToBase64 } from '@/services/storageService';

interface ExtendedUser extends User {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt?: string;
  profileViews?: number;
  username?: string;
}

// We'll try multiple bucket names - many Supabase projects start with 'public' bucket
const POTENTIAL_BUCKETS = ['profile', 'avatars', 'profiles', 'users', 'public'];

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [avatarMode, setAvatarMode] = useState<'link' | 'upload'>('link');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarKey, setAvatarKey] = useState(Date.now());
  const [shouldShowAvatar, setShouldShowAvatar] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [storageBucket, setStorageBucket] = useState<string | null>(null);
  const [showUploadDisabledMessage, setShowUploadDisabledMessage] = useState(true);
  
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    avatarUrl: '',
    username: ''
  });

  const { checkAuth } = useAuth();
  const debouncedFormData = useDebounce(formData, 2000);

  useEffect(() => {
    console.log("Upload de imagens desativado - usando apenas URLs externas");
    setStorageBucket(null);
    
    if (showUploadDisabledMessage) {
      toast({
        title: 'Apenas URLs externas',
        description: 'O upload de imagens está desativado. Use uma URL de imagem existente.',
        variant: 'info',
        duration: 5000
      });
      setShowUploadDisabledMessage(false);
    }
  }, [showUploadDisabledMessage]);

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
          displayName: profileUser.display_name || profileUser.username,
          bio: profileUser.bio || 'Nenhuma biografia disponível.',
          avatarUrl: profileUser.avatar_url || '',
          createdAt: profileUser.created_at || new Date().toISOString(),
          profileViews: profileUser.profile_views || 0,
          username: profileUser.username || ''
        };
        
        setUser(enhancedUser);
        setFormData({
          displayName: enhancedUser.displayName || '',
          bio: enhancedUser.bio || '',
          avatarUrl: enhancedUser.avatarUrl || '',
          username: enhancedUser.username || ''
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

  useEffect(() => {
    if (user && Object.keys(debouncedFormData).length > 0) {
      // Don't run on the initial render
      const initialLoad = JSON.stringify(debouncedFormData) === JSON.stringify({
        displayName: user.displayName || '',
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || '',
        username: user.username || ''
      });
      
      if (!initialLoad) {
        handleSaveField('all');
      }
    }
  }, [debouncedFormData]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Quando o display name for alterado, atualizamos o username automaticamente
    // removendo acentos, espaços e caracteres especiais
    if (name === 'displayName') {
      const autoUsername = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')  // Remove acentos
        .replace(/[^a-z0-9]/g, '')         // Remove caracteres especiais 
        || user?.username  // Mantém o username atual se o resultado for vazio
        || '';
        
      setFormData(prev => ({
        ...prev,
        [name]: value,
        username: autoUsername
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Se não estiver no modo de edição, não atualize
    if (!isEditing) return;
    
    // Se houver alguma alteração no valor do campo, faça o debounce
    if (name === 'displayName' || name === 'bio') {
      // O debounce será tratado pelo useEffect com debouncedFormData
    }
  };

  const handleSaveField = async (field: string) => {
    if (!user) return;
    
    try {
      // Map field names from form to DB field names if needed
      const updateData: Partial<ExtendedUser> = {};
      
      if (field === 'all' || field === 'displayName') {
        updateData.display_name = formData.displayName;
      }
      
      if (field === 'all' || field === 'username') {
        updateData.username = formData.username;
      }
      
      if (field === 'all' || field === 'bio') {
        updateData.bio = formData.bio;
      }
      
      if (field === 'all' || field === 'avatarUrl') {
        updateData.avatar_url = formData.avatarUrl;
      }
      
      // Only call the API if we have data to update
      if (Object.keys(updateData).length > 0) {
        const updatedUser = await updateUserProfile(
          user.id,
          {
            ...updateData,
          }
        );
        
        if (updatedUser) {
          toast({
            title: 'Perfil atualizado',
            description: 'Suas informações foram atualizadas com sucesso.'
          });
          await checkAuth();
          
          // Atualiza o usuário local
          setUser(prev => {
            if (!prev) return null;
            return {
              ...prev,
              ...updateData
            };
          });
        }
      }
    } catch (error: any) {
      console.error(`Erro ao atualizar ${field}:`, error);
      toast({
        title: 'Erro ao atualizar',
        description: error.message || 'Ocorreu um erro ao atualizar suas informações.',
        variant: 'destructive'
      });
    }
  };

  // New function for handling file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Nova implementação do handleUploadImage utilizando o serviço de armazenamento
  const handleUploadImage = async () => {
    if (!selectedFile || !user) return;
    
    setIsUploading(true);
    
    try {
      // Usar abordagem com base64 redimensionado já que o Storage está com problemas de permissão
      console.log('Usando abordagem alternativa com base64 redimensionado');
      
      // Otimização: Verificar o tamanho do arquivo antes de processá-lo
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB
        throw new Error('A imagem é muito grande. Por favor, escolha uma imagem menor que 5MB.');
      }
      
      // Usar fileToBase64 do serviço de armazenamento para redimensionar a imagem
      try {
        // Importamos a função do storageService
        const avatarUrl = await fileToBase64(selectedFile, 100, 100, 0.3);
        
        if (!avatarUrl) {
          throw new Error('Não foi possível processar a imagem');
        }
        
        console.log(`Tamanho da string base64: ${avatarUrl.length} caracteres`);
        
        // Forçar o recarregamento da imagem removendo-a temporariamente
        setShouldShowAvatar(false);
        
        setFormData((prev) => ({ ...prev, avatarUrl }));
        
        // Salvar no perfil do usuário
        const updateData = { avatar_url: avatarUrl };
        
        const updatedUser = await updateUserProfile(
          user.id,
          {
            ...updateData,
          }
        );
        
        if (updatedUser) {
          // Atualizar o key da imagem para forçar o recarregamento
          setAvatarKey(Date.now());
          
          // Fechar o diálogo após upload bem-sucedido
          document.querySelector('.dialog-close')?.dispatchEvent(new MouseEvent('click'));
          
          // Atualiza o usuário local
          setUser(prev => {
            if (!prev) return null;
            return {
              ...prev,
              avatar_url: avatarUrl,
              avatarUrl: avatarUrl
            };
          });
          
          // Pequeno atraso para garantir que o componente seja remontado
          setTimeout(() => {
            // Mostrar a imagem novamente
            setShouldShowAvatar(true);
            
            // Disparar evento personalizado para notificar outros componentes sobre a mudança de avatar
            window.dispatchEvent(new CustomEvent('user-avatar-changed', { 
              detail: { 
                userId: user.id, 
                avatarUrl,
                timestamp: Date.now() 
              }
            }));
            
            console.log('Avatar atualizado com base64 de tamanho reduzido');
            
            toast({
              title: 'Foto de perfil atualizada',
              description: 'Sua foto foi atualizada com sucesso!',
              duration: 5000,
              variant: 'success'
            });
          }, 100);
        }
      } catch (resizeError) {
        console.error('Erro ao redimensionar imagem:', resizeError);
        throw new Error('Não foi possível processar a imagem. Por favor, tente novamente com uma imagem menor.');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Erro ao processar a imagem',
        description: error.message || 'Ocorreu um erro ao processar a imagem. Tente usar a opção de URL externa.',
        variant: 'destructive'
      });
      
      // Em caso de erro, garanta que a imagem seja exibida
      setShouldShowAvatar(true);
    } finally {
      setIsUploading(false);
    }
  };

  // Função para forçar o recarregamento da imagem
  const forceImageReload = (url: string) => {
    // Não adicione parâmetros em URLs base64, pois isso causa o erro ERR_INVALID_URL
    if (url && typeof url === 'string' && url.startsWith('data:')) {
      return url; // Retorna a URL base64 sem modificação
    }
    
    // Para URLs HTTP normais, adicione cache-busting
    // Adicionar um parâmetro de cache-busting se não existir ou atualizar o existente
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?t=${Date.now()}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to current user data
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || '',
        username: user.username || ''
      });
    }
  };

  // New function for using external image URLs
  const handleUseExternalImage = async () => {
    if (!user || !formData.avatarUrl) return;
    
    setIsUploading(true);
    
    try {
      // Validar se a URL é acessível
      try {
        const response = await fetch(formData.avatarUrl, { method: 'HEAD' });
        if (!response.ok) {
          throw new Error('URL inacessível');
        }
      } catch (urlError) {
        toast({
          title: 'URL inválida',
          description: 'Não foi possível acessar a URL da imagem. Verifique se o link está correto e acessível.',
          variant: 'destructive'
        });
        setIsUploading(false);
        return;
      }
      
      // Update user profile with new avatar URL
      const avatarUrl = formData.avatarUrl;
      
      // Forçar o recarregamento da imagem removendo-a temporariamente
      setShouldShowAvatar(false);
      
      // Save to database
      const updatedUser = await updateUserProfile(
        user.id,
        {
          avatarUrl: avatarUrl,
        }
      );
      
      if (updatedUser) {
        // Atualizar o key da imagem para forçar o recarregamento
        setAvatarKey(Date.now());
        
        // Fechar o diálogo após sucesso
        document.querySelector('.dialog-close')?.dispatchEvent(new MouseEvent('click'));
        
        // Atualiza o usuário local
        setUser(prev => {
          if (!prev) return null;
          return {
            ...prev,
            avatar_url: avatarUrl,
            avatarUrl: avatarUrl
          };
        });
        
        // Pequeno atraso para garantir que o componente seja remontado
        setTimeout(() => {
          // Mostrar a imagem novamente
          setShouldShowAvatar(true);
          
          // Disparar evento personalizado para notificar outros componentes sobre a mudança de avatar
          window.dispatchEvent(new CustomEvent('user-avatar-changed', { 
            detail: { 
              userId: user.id, 
              avatarUrl,
              timestamp: Date.now() 
            }
          }));
          
          console.log('Avatar atualizado para:', avatarUrl);
          
          toast({
            title: 'Foto de perfil atualizada',
            description: 'Sua foto foi atualizada com sucesso usando URL externa.',
            duration: 5000,
            variant: 'success'
          });
        }, 100);
      }
    } catch (error: any) {
      console.error('Erro ao atualizar imagem de perfil:', error);
      toast({
        title: 'Erro ao atualizar imagem',
        description: error.message || 'Ocorreu um erro ao atualizar sua foto de perfil.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
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
    <div className="container mx-auto pt-6 max-w-4xl">
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="w-32 h-32 border-2 border-primary/20">
                  {user.avatarUrl && shouldShowAvatar ? (
                    <AvatarImage 
                      src={user.avatarUrl} 
                      alt={user.displayName || 'User'} 
                      key={avatarKey}
                      onError={() => {
                        console.log('Erro ao carregar imagem de perfil');
                        setAvatarKey(Date.now());
                      }}
                    />
                  ) : (
                    <AvatarFallback className="text-2xl">
                      {getInitials(user.displayName || user.email || 'User')}
                    </AvatarFallback>
                  )}
                </Avatar>
                {isEditing && (
                <Button 
                  variant="outline" 
                  size="icon"
                    className="absolute bottom-0 right-0 rounded-full bg-background"
                    onClick={() => document.getElementById('avatar-dialog-trigger')?.click()}
                >
                    <Camera className="h-4 w-4" />
                </Button>
              )}
            </div>
            
              <AlertDialog>
                <AlertDialogTrigger id="avatar-dialog-trigger"></AlertDialogTrigger>
                <AlertDialogContent className="sm:max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Alterar imagem de perfil</AlertDialogTitle>
                    <AlertDialogDescription>
                      Escolha uma das opções abaixo para atualizar sua foto de perfil.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  
                  <div className="flex gap-2 mb-4">
                    <Button 
                      variant={avatarMode === 'link' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setAvatarMode('link')}
                      className="flex-1"
                    >
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Usar link
                    </Button>
                    <Button 
                      variant={avatarMode === 'upload' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setAvatarMode('upload')}
                      className="flex-1"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Fazer upload
                    </Button>
                  </div>
                  
                  {avatarMode === 'link' && (
                    <div className="mb-4 space-y-4">
                      <div>
                        <Label htmlFor="avatarUrl" className="font-medium mb-1.5 block">URL da imagem</Label>
                        <Input
                          id="avatarUrl"
                          name="avatarUrl"
                          value={formData.avatarUrl}
                          onChange={handleInputChange}
                          placeholder="https://exemplo.com/minha-foto.jpg"
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Cole o endereço de uma imagem já existente na internet
                        </p>
                      </div>
                      
                      {formData.avatarUrl && (
                        <div className="flex justify-center mt-3">
                          <div className="relative w-24 h-24 border-2 border-primary/20 rounded-full overflow-hidden">
                            <img 
                              src={formData.avatarUrl} 
                              alt="Prévia" 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Erro';
                                toast({
                                  title: "Erro ao carregar imagem",
                                  description: "Verifique se o link está correto e acessível",
                                  variant: "destructive"
                                });
                              }}
                            />
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        variant="default"
                        onClick={handleUseExternalImage}
                        disabled={isUploading || !formData.avatarUrl}
                        className="w-full"
                      >
                        {isUploading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                            Salvando...
                          </>
                        ) : 'Usar esta imagem'}
                      </Button>
                    </div>
                  )}
                  
                  {avatarMode === 'upload' && (
                    <div className="flex flex-col gap-4 mb-4">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        className="hidden"
                        id="avatar-file-input"
                      />
                      <div>
                        <Label className="font-medium mb-1.5 block">Selecione uma imagem do seu computador</Label>
                        <Button 
                          variant="outline" 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="w-full"
                        >
                          <Image className="h-4 w-4 mr-2" />
                          {selectedFile ? 'Alterar imagem' : 'Selecionar imagem'}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Formatos permitidos: JPG, PNG, GIF, WebP (máx. 2MB)
                        </p>
                      </div>
                      
                      {selectedFile && (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3 p-2 border border-border rounded-md bg-muted/30">
                            <div className="relative w-12 h-12 overflow-hidden rounded-md">
                              <img 
                                src={URL.createObjectURL(selectedFile)} 
                                alt="Prévia" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium truncate block">
                                {selectedFile.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {(selectedFile.size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                          </div>
                          
                          <Button 
                            variant="default"
                            onClick={handleUploadImage}
                            disabled={isUploading}
                            className="w-full"
                          >
                            {isUploading ? (
                              <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                Enviando...
                              </>
                            ) : 'Enviar imagem'}
                          </Button>
                        </div>
                      )}
                      
                      <div className="bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded p-3 text-sm flex items-start">
                        <Info className="h-4 w-4 mr-2 mt-0.5" />
                        <span>Se o upload falhar, a imagem será armazenada localmente como alternativa. Você ainda poderá usá-la como sua foto de perfil.</span>
                      </div>
                    </div>
                  )}
                  
                  <AlertDialogFooter className="flex items-center justify-between">
                    <AlertDialogCancel className="dialog-close">Cancelar</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
              
              <div className="flex-1 text-center md:text-left">
                {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="displayName">Nome</Label>
                    <Input
                      id="displayName"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      placeholder="Nome de exibição"
                      className="text-xl"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="bio">Biografia</Label>
                      <Textarea
                      id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                      placeholder="Conte um pouco sobre você..."
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-2xl font-bold">{user.displayName || user.email}</h1>
                  <div className="mt-1 text-muted-foreground text-sm">
                    {user.email}
                  </div>
                  <div className="mt-4 bg-muted/50 p-4 rounded-md whitespace-pre-line">
                    {user.bio || 'Sem biografia.'}
                  </div>
                </div>
              )}
                  
              <div className="mt-6 flex flex-wrap gap-2">
                  {isEditing && (
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={handleCancel}>
                        Cancelar
                      </Button>
                    <Button onClick={() => setIsEditing(false)}>
                      <Save className="h-4 w-4 mr-2" />
                      Concluir edição
                      </Button>
                    </div>
                  )}
                
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar perfil
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="about" className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="about">
            <UserIcon className="h-4 w-4 mr-2" />
            Sobre
          </TabsTrigger>
          <TabsTrigger value="activity">
            <MessageSquare className="h-4 w-4 mr-2" />
            Atividade
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
              <CardDescription>
                Informações básicas sobre {user.displayName || 'você'}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Membro desde</h3>
                  <p>{new Date(user.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Função</h3>
                  <div className="mt-1">
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
              </TabsContent>
              
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Atividade recente</CardTitle>
              <CardDescription>
                As atividades recentes de {user.displayName || 'você'} na plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                <div className="flex flex-col gap-4">
                  <div className="text-muted-foreground text-center py-8">
                    Nenhuma atividade recente para exibir.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
              </TabsContent>
            </Tabs>
    </div>
  );
};

export default Profile; 