import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, getCurrentUser, getUserById, updateUserProfile } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { User as UserIcon, Edit, Save, Calendar, MessageSquare, Upload, Link as LinkIcon, Camera, Check, X, PencilLine, Info, Image, RefreshCw, AlertTriangle, Users, UserPlus, UserCheck, ChevronRight, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { supabase } from '@/services/supabaseClient';
import { useAuth } from '@/hooks/auth';
import useDebounce from '@/hooks/useDebounce';
import { uploadImage, getAvailableBucket, fileToBase64 } from '@/services/storageService';
import { Badge } from '@/components/ui/badge';
import FollowStats from '@/components/FollowStats';
import { followUser, unfollowUser, isFollowing, getFollowers, getFollowing } from '@/services/followService';

interface ExtendedUser extends User {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt?: string;
  username?: string;
  last_login?: string;
  followersCount?: number;
  followingCount?: number;
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
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);
  
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    avatarUrl: '',
    username: ''
  });

  const { checkAuth } = useAuth();
  const debouncedFormData = useDebounce(formData, 2000);

  // useEffect(() => {
  //   console.log("Upload de imagens desativado - usando apenas URLs externas");
  //   setStorageBucket(null);
    
  //   if (showUploadDisabledMessage) {
  //     toast({
  //       title: 'Apenas URLs externas',
  //       description: 'O upload de imagens está desativado. Use uma URL de imagem existente.',
  //       variant: 'info',
  //       duration: 5000
  //     });
  //     setShowUploadDisabledMessage(false);
  //   }
  // }, [showUploadDisabledMessage]);

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
        
        // Atualizar contadores de seguidores e seguindo com dados do banco
        if (isCurrentUser || profileUser.id === currentUser?.id) {
          try {
            // Buscar contagem real de "seguindo"
            const following = await getFollowing(profileUser.id);
            const followingCount = following?.length || 0;
            
            // Buscar contagem real de seguidores
            const followers = await getFollowers(profileUser.id);
            const followersCount = followers?.length || 0;
            
            // Atualizar os contadores no objeto de usuário
            profileUser.followingCount = followingCount;
            profileUser.followersCount = followersCount;
            
            console.log('Contagens atualizadas do banco:', { followingCount, followersCount });
          } catch (countError) {
            console.error('Erro ao buscar contagens de seguidores:', countError);
          }
        }
        
        // Set default values if not present
        const enhancedUser: ExtendedUser = {
          ...profileUser,
          displayName: profileUser.display_name || profileUser.username,
          bio: profileUser.bio || 'Nenhuma biografia disponível.',
          avatarUrl: profileUser.avatar_url || '',
          createdAt: profileUser.created_at || new Date().toISOString(),
          username: profileUser.username || '',
          // Se o campo last_login ainda não existir no banco, usar a data atual para o usuário atual
          // ou uma data recente para outros usuários
          last_login: profileUser.last_login || (isCurrentUser ? new Date().toISOString() : new Date(Date.now() - 86400000).toISOString()),
          followersCount: profileUser.followersCount || 0,
          followingCount: profileUser.followingCount || 0
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

  // Verificar se o usuário atual está seguindo o perfil visualizado
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!isCurrentUser && user) {
        const followStatus = await isFollowing(user.id);
        setIsFollowingUser(followStatus);
      }
    };
    
    checkFollowStatus();
  }, [user, isCurrentUser]);

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
      // Tentar primeiro o upload diretamente
      let avatarUrl = null;
      
      try {
        // Tentar primeiro usar o serviço de armazenamento do Supabase
        avatarUrl = await uploadImageWithLocalFallback(selectedFile, user.id);
      } catch (uploadError) {
        console.error('Erro ao fazer upload para o Storage:', uploadError);
        // Se falhar, usar o base64 redimensionado
        avatarUrl = await fileToBase64(selectedFile, 300, 300, 0.9);
      }
      
      if (!avatarUrl) {
        throw new Error('Não foi possível processar a imagem');
      }
      
      console.log(`Imagem processada com sucesso: ${avatarUrl.substring(0, 30)}...`);
      
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
          
          console.log('Avatar atualizado com sucesso');
          
          toast({
            title: 'Foto de perfil atualizada',
            description: 'Sua foto foi atualizada com sucesso!',
            duration: 5000,
            variant: 'success'
          });
        }, 100);
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

  // Manipulador para seguir/deixar de seguir
  const handleFollowToggle = async () => {
    if (!user) return;
    
    console.log('Tentando seguir/deixar de seguir usuário:', user.id);
    setIsLoadingFollow(true);
    
    try {
      let success;
      
      if (isFollowingUser) {
        console.log('Tentando deixar de seguir usuário...');
        success = await unfollowUser(user.id);
        console.log('Resultado de deixar de seguir:', success);
        if (success) {
          setIsFollowingUser(false);
          // Decrementar contador de seguidores localmente
          setUser(prev => {
            if (!prev) return null;
            return {
              ...prev,
              followersCount: Math.max((prev.followersCount || 0) - 1, 0)
            };
          });
        }
      } else {
        console.log('Tentando seguir usuário...');
        success = await followUser(user.id);
        console.log('Resultado de seguir:', success);
        if (success) {
          setIsFollowingUser(true);
          // Incrementar contador de seguidores localmente
          setUser(prev => {
            if (!prev) return null;
            return {
              ...prev,
              followersCount: (prev.followersCount || 0) + 1
            };
          });
        }
      }
    } catch (error) {
      console.error('Erro ao alterar status de seguir:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingFollow(false);
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

  // Renderização principal do perfil de usuário
  return <ProfileTemplate user={user} isEditing={isEditing} setIsEditing={setIsEditing} isCurrentUser={isCurrentUser} formData={formData} handleInputChange={handleInputChange} handleCancel={handleCancel} avatarMode={avatarMode} setAvatarMode={setAvatarMode} fileInputRef={fileInputRef} handleFileChange={handleFileChange} selectedFile={selectedFile} isUploading={isUploading} handleUploadImage={handleUploadImage} handleUseExternalImage={handleUseExternalImage} avatarKey={avatarKey} shouldShowAvatar={shouldShowAvatar} setAvatarKey={setAvatarKey} getInitials={getInitials} isFollowingUser={isFollowingUser} isLoadingFollow={isLoadingFollow} handleFollowToggle={handleFollowToggle} navigate={navigate} handleSaveField={handleSaveField} />;
}

// Componente separado para renderizar o template do perfil
interface ProfileTemplateProps {
  user: ExtendedUser;
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  isCurrentUser: boolean;
  formData: {
    displayName: string;
    bio: string;
    avatarUrl: string;
    username: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleCancel: () => void;
  avatarMode: 'link' | 'upload';
  setAvatarMode: React.Dispatch<React.SetStateAction<'link' | 'upload'>>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedFile: File | null;
  isUploading: boolean;
  handleUploadImage: () => Promise<void>;
  handleUseExternalImage: () => Promise<void>;
  avatarKey: number;
  shouldShowAvatar: boolean;
  setAvatarKey: React.Dispatch<React.SetStateAction<number>>;
  getInitials: (name: string) => string;
  isFollowingUser: boolean;
  isLoadingFollow: boolean;
  handleFollowToggle: () => Promise<void>;
  navigate: (path: string) => void;
  handleSaveField: (field: string) => Promise<void>;
}

const ProfileTemplate = ({ 
  user, 
  isEditing, 
  setIsEditing, 
  isCurrentUser,
  formData,
  handleInputChange,
  handleCancel,
  avatarMode,
  setAvatarMode,
  fileInputRef,
  handleFileChange,
  selectedFile,
  isUploading,
  handleUploadImage,
  handleUseExternalImage,
  avatarKey,
  shouldShowAvatar,
  setAvatarKey,
  getInitials,
  isFollowingUser,
  isLoadingFollow,
  handleFollowToggle,
  navigate,
  handleSaveField
}: ProfileTemplateProps) => {
  // Estados para controlar os diálogos de seguidores e seguindo
  const [followersDialogOpen, setFollowersDialogOpen] = useState(false);
  const [followingDialogOpen, setFollowingDialogOpen] = useState(false);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(false);
  // Adiciona estados para armazenar as contagens reais
  const [realFollowersCount, setRealFollowersCount] = useState(user.followersCount || 0);
  const [realFollowingCount, setRealFollowingCount] = useState(user.followingCount || 0);
  const isMobile = window.innerWidth < 640;

  // Buscar contagens atualizadas ao renderizar
  useEffect(() => {
    const updateCounts = async () => {
      try {
        // Buscar seguindo
        const following = await getFollowing(user.id);
        setRealFollowingCount(following.length);
        
        // Buscar seguidores
        const followers = await getFollowers(user.id);
        setRealFollowersCount(followers.length);
        
        console.log('Contagens atualizadas:', { 
          following: following.length, 
          followers: followers.length 
        });
      } catch (error) {
        console.error('Erro ao atualizar contagens:', error);
      }
    };
    
    updateCounts();
  }, [user.id]);

  const handleFollowersClick = () => {
    setIsLoadingFollowers(true);
    setFollowersDialogOpen(true);
    
    getFollowers(user.id).then(followers => {
      console.log("Seguidores buscados diretamente:", followers);
      setFollowersList(followers);
      setRealFollowersCount(followers.length);
      setIsLoadingFollowers(false);
    }).catch(error => {
      console.error("Erro ao buscar seguidores:", error);
      setIsLoadingFollowers(false);
    });
  };

  const handleFollowingClick = () => {
    setIsLoadingFollowing(true);
    setFollowingDialogOpen(true);
    
    getFollowing(user.id).then(following => {
      console.log("Seguindo buscados diretamente:", following);
      setFollowingList(following);
      setRealFollowingCount(following.length);
      setIsLoadingFollowing(false);
    }).catch(error => {
      console.error("Erro ao buscar seguindo:", error);
      setIsLoadingFollowing(false);
    });
  };

  // Função para renderizar lista de usuários
  const renderUserList = (users: any[], isLoading: boolean, type: 'followers' | 'following') => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-10">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {type === 'followers' 
            ? (isCurrentUser ? 'Você ainda não tem seguidores' : 'Este usuário ainda não tem seguidores')
            : (isCurrentUser ? 'Você ainda não segue ninguém' : 'Este usuário ainda não segue ninguém')
          }
        </div>
      );
    }

    return (
      <div className="space-y-3 divide-y divide-muted/30">
        {users.map((userItem: any) => (
          <div key={userItem.id} className="flex items-center justify-between pt-3">
            <div 
              className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
              onClick={() => navigate(`/profile/${userItem.id}`)}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={userItem.avatar_url || undefined} alt={userItem.display_name || userItem.username} />
                <AvatarFallback>
                  {getInitials(userItem.display_name || userItem.username)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {userItem.display_name || userItem.username}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  @{userItem.username}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

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
                      className="image-rendering-high"
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
                      className="min-h-[100px] w-full resize-none mt-1"
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
                {!isCurrentUser && (
                  <Button 
                    variant={isFollowingUser ? "outline" : "default"}
                    onClick={() => {
                      console.log('Botão de seguir clicado!');
                      handleFollowToggle();
                    }}
                    disabled={isLoadingFollow}
                    className="w-full md:w-auto"
                  >
                    {isLoadingFollow ? (
                      <>
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></span>
                        {isFollowingUser ? 'Deixando de seguir...' : 'Seguindo...'}
                      </>
                    ) : (
                      <>
                        {isFollowingUser ? (
                          <>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Seguindo
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Seguir
                          </>
                        )}
                      </>
                    )}
                  </Button>
                )}
                
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
                
                {!isEditing && isCurrentUser && (
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Membro desde</h3>
                    <p>{new Date(user.created_at ?? '').toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Último login</h3>
                    <p>{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Desconhecido'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Card className="border border-muted/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center">
                          <Users className="h-5 w-5 mr-2" />
                          Conexões
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col gap-2">
                          <div 
                            className="flex items-center justify-between cursor-pointer hover:bg-muted/30 p-2 rounded" 
                            onClick={handleFollowersClick}
                          >
                            <div className="flex items-center">
                              <span className="font-medium mr-2">{realFollowersCount}</span>
                              <span className="text-muted-foreground">seguidores</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                          
                          <div 
                            className="flex items-center justify-between cursor-pointer hover:bg-muted/30 p-2 rounded" 
                            onClick={handleFollowingClick}
                          >
                            <div className="flex items-center">
                              <span className="font-medium mr-2">{realFollowingCount}</span>
                              <span className="text-muted-foreground">seguindo</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  {user.role === 'admin' && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">Função</h3>
                      <Badge variant="default" className="mt-1">Administrador</Badge>
                    </div>
                  )}
                  {user.role === 'leader' && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">Função</h3>
                      <Badge variant="secondary" className="mt-1">Líder</Badge>
                    </div>
                  )}
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

      {/* Diálogos para seguidores e seguindo */}
      {/* Dialog para desktop */}
      <Dialog open={followersDialogOpen} onOpenChange={setFollowersDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Seguidores</DialogTitle>
            <DialogDescription>
              {isCurrentUser ? 'Seus' : 'Os'} seguidores ({followersList.length})
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto">
            {renderUserList(followersList, isLoadingFollowers, 'followers')}
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={followingDialogOpen} onOpenChange={setFollowingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Seguindo</DialogTitle>
            <DialogDescription>
              {isCurrentUser ? 'Você' : 'Este usuário'} segue ({followingList.length})
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto">
            {renderUserList(followingList, isLoadingFollowing, 'following')}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Sheet para mobile */}
      {isMobile && (
        <>
          <Sheet open={followersDialogOpen} onOpenChange={setFollowersDialogOpen}>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader className="mb-6">
                <SheetTitle>Seguidores</SheetTitle>
                <SheetDescription>
                  {isCurrentUser ? 'Seus' : 'Os'} seguidores ({followersList.length})
                </SheetDescription>
              </SheetHeader>
              
              {renderUserList(followersList, isLoadingFollowers, 'followers')}
              
              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={() => setFollowersDialogOpen(false)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          
          <Sheet open={followingDialogOpen} onOpenChange={setFollowingDialogOpen}>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader className="mb-6">
                <SheetTitle>Seguindo</SheetTitle>
                <SheetDescription>
                  {isCurrentUser ? 'Você' : 'Este usuário'} segue ({followingList.length})
                </SheetDescription>
              </SheetHeader>
              
              {renderUserList(followingList, isLoadingFollowing, 'following')}
              
              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={() => setFollowingDialogOpen(false)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
}

export default Profile; 