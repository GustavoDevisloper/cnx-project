import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, getCurrentUser, getUserById, updateUserProfile } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { User as UserIcon, Edit, Save, Calendar, MessageSquare, Upload, Link as LinkIcon, Camera, Check, X, PencilLine, Info, Image, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/services/supabaseClient';
import { useAuth } from '@/hooks/auth';
import useDebounce from '@/hooks/useDebounce';

interface ExtendedUser extends User {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt?: string;
  profileViews?: number;
  username?: string;
}

// We'll try multiple bucket names - many Supabase projects start with 'public' bucket
const POTENTIAL_BUCKETS = ['public', 'avatars', 'profiles', 'users'];

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
  
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    avatarUrl: '',
    username: ''
  });

  const { checkAuth } = useAuth();
  const debouncedFormData = useDebounce(formData, 2000);

  // Check what buckets exist in the Supabase project
  useEffect(() => {
    const checkAvailableBuckets = async () => {
      try {
        console.log("Checking available Supabase storage buckets...");
        const { data: buckets, error } = await supabase.storage.listBuckets();
        
        if (error) {
          console.error("Error listing buckets:", error);
          return;
        }
        
        if (buckets && buckets.length > 0) {
          console.log("Available buckets:", buckets.map(b => b.name).join(', '));
          
          // Try to find one of our potential buckets
          for (const potentialBucket of POTENTIAL_BUCKETS) {
            if (buckets.some(b => b.name === potentialBucket)) {
              console.log(`Using existing bucket: ${potentialBucket}`);
              setStorageBucket(potentialBucket);
              return;
            }
          }
          
          // If none of our preferred buckets exist, use the first available one
          console.log(`Using first available bucket: ${buckets[0].name}`);
          setStorageBucket(buckets[0].name);
        } else {
          console.warn("No storage buckets found in Supabase project");
        }
      } catch (err) {
        console.error("Error checking buckets:", err);
      }
    };
    
    checkAvailableBuckets();
  }, []);

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

  // New function for image upload
  const handleUploadImage = async () => {
    if (!selectedFile || !user) return;
    
    // Validate file type
    const fileExt = selectedFile.name.split('.').pop();
    const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    if (!fileExt || !allowedTypes.includes(fileExt.toLowerCase())) {
      toast({
        title: 'Tipo de arquivo não permitido',
        description: 'Use JPG, PNG, GIF ou WebP.',
        variant: 'destructive'
      });
      return;
    }
    
    // Validate file size (max 2MB)
    if (selectedFile.size > 2 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo é 2MB.',
        variant: 'destructive'
      });
      return;
    }
    
    // Check if we have a valid bucket to use
    if (!storageBucket) {
      toast({
        title: 'Erro de armazenamento',
        description: 'Nenhum bucket de armazenamento disponível. Entre em contato com o administrador.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Generate a unique filename
      const timestamp = new Date().getTime();
      const filePath = `${user.id}/${timestamp}.${fileExt}`;
      
      console.log(`Uploading to bucket: ${storageBucket}, path: ${filePath}`);
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(storageBucket)
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true, // Set to true to overwrite existing files
        });
      
      if (error) {
        console.error('Storage upload error:', error);
        
        // Provide more specific error messages based on error code
        if (error.message?.includes('bucket not found')) {
          throw new Error(`O bucket de armazenamento "${storageBucket}" não existe. Entre em contato com o administrador.`);
        }
        
        if (error.statusCode === '403') {
          throw new Error(`Permissão negada ao fazer upload. Verifique se você está logado corretamente.`);
        }
        
        throw error;
      }
      
      if (!data) {
        throw new Error('Upload falhou, nenhum dado retornado');
      }
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(storageBucket)
        .getPublicUrl(filePath);
      
      if (!urlData?.publicUrl) {
        throw new Error('Falha ao obter URL pública para imagem carregada');
      }
      
      // Update user profile with new avatar URL
      const avatarUrl = urlData.publicUrl;
      
      // Forçar o recarregamento da imagem removendo-a temporariamente
      setShouldShowAvatar(false);
      
      setFormData((prev) => ({ ...prev, avatarUrl }));
      
      // Save to database
      const updateData = { avatar_url: avatarUrl };
      
      try {
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
            
            console.log('Avatar atualizado para:', avatarUrl);
            
            // Continuar tentando usar o sistema de toast normal
            toast({
              title: 'Foto de perfil atualizada',
              description: 'Sua foto foi atualizada com sucesso. Para visualizar em todos os lugares, pode ser necessário recarregar a página.',
              duration: 8000,
            });
            
            // Criar um container para a notificação personalizada
            const notificationContainer = document.createElement('div');
            notificationContainer.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2 items-end max-w-sm';
            notificationContainer.id = 'profile-notification-container';
            
            // Criar a notificação
            const notification = document.createElement('div');
            notification.className = 'bg-background border border-border shadow-lg rounded-lg p-4 animate-in slide-in-from-right';
            notification.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
            
            // Título da notificação
            const title = document.createElement('div');
            title.className = 'font-medium text-foreground flex items-center gap-2 mb-1';
            title.innerHTML = '<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.49991 0.876892C3.84222 0.876892 0.877075 3.84204 0.877075 7.49972C0.877075 11.1574 3.84222 14.1226 7.49991 14.1226C11.1576 14.1226 14.1227 11.1574 14.1227 7.49972C14.1227 3.84204 11.1576 0.876892 7.49991 0.876892ZM1.82707 7.49972C1.82707 4.36671 4.36689 1.82689 7.49991 1.82689C10.6329 1.82689 13.1727 4.36671 13.1727 7.49972C13.1727 10.6327 10.6329 13.1726 7.49991 13.1726C4.36689 13.1726 1.82707 10.6327 1.82707 7.49972ZM7.50003 4C7.77617 4 8.00003 4.22386 8.00003 4.5V8.5C8.00003 8.77614 7.77617 9 7.50003 9C7.22389 9 7.00003 8.77614 7.00003 8.5V4.5C7.00003 4.22386 7.22389 4 7.50003 4ZM7.5 10C7.22386 10 7 10.2239 7 10.5C7 10.7761 7.22386 11 7.5 11C7.77614 11 8 10.7761 8 10.5C8 10.2239 7.77614 10 7.5 10Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>Foto de perfil atualizada';
            
            // Conteúdo da notificação
            const content = document.createElement('div');
            content.className = 'text-sm text-muted-foreground';
            content.textContent = 'Sua foto foi atualizada com sucesso. Para visualizar em todos os lugares, pode ser necessário recarregar a página.';
            
            // Adicionar título e conteúdo à notificação
            notification.appendChild(title);
            notification.appendChild(content);
            
            // Adicionar notificação ao container
            notificationContainer.appendChild(notification);
            
            // Adicionar container ao body
            document.body.appendChild(notificationContainer);
            
            // Adicionar um botão de recarregamento
            const reloadButton = document.createElement('button');
            reloadButton.innerText = 'Recarregar página';
            reloadButton.className = 'bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-md flex items-center gap-2 animate-in slide-in-from-right';
            reloadButton.style.animationDelay = '150ms';
            reloadButton.onclick = () => window.location.reload();
            
            // Adicionar ícone de refresh
            const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            iconSvg.setAttribute('viewBox', '0 0 24 24');
            iconSvg.setAttribute('width', '16');
            iconSvg.setAttribute('height', '16');
            iconSvg.setAttribute('fill', 'none');
            iconSvg.setAttribute('stroke', 'currentColor');
            iconSvg.setAttribute('stroke-width', '2');
            iconSvg.setAttribute('stroke-linecap', 'round');
            iconSvg.setAttribute('stroke-linejoin', 'round');
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15');
            
            iconSvg.appendChild(path);
            reloadButton.prepend(iconSvg);
            
            // Adicionar botão ao container de notificação
            notificationContainer.appendChild(reloadButton);
            
            // Remover a notificação após 10 segundos
            setTimeout(() => {
              if (document.body.contains(notificationContainer)) {
                // Adicionar classe de fade-out
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(10px)';
                notification.style.transition = 'opacity 0.5s, transform 0.5s';
                reloadButton.style.opacity = '0';
                reloadButton.style.transform = 'translateX(10px)';
                reloadButton.style.transition = 'opacity 0.5s, transform 0.5s';
                
                // Remover após a animação
                setTimeout(() => {
                  if (document.body.contains(notificationContainer)) {
                    document.body.removeChild(notificationContainer);
                  }
                }, 500);
              }
            }, 10000);
          }, 100);
        }
      } catch (dbError: any) {
        console.error('Error updating user profile in database:', dbError);
        
        // If database update fails, try to delete the uploaded file to avoid orphaned files
        await supabase.storage.from(storageBucket).remove([filePath]);
        
        throw new Error(`Falha ao atualizar perfil: ${dbError.message || 'Erro no banco de dados'}`);
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Erro ao fazer upload da imagem',
        description: error.message || 'Ocorreu um erro ao fazer upload da imagem.',
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
                      src={forceImageReload(user.avatarUrl)} 
                      alt={user.displayName || 'User'} 
                      onError={() => {
                        console.log('Erro ao carregar imagem de perfil, tentando novamente...');
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
                    
                    {avatarMode === 'link' ? (
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
                    </div>
                    ) : (
                    <div className="flex flex-col gap-4 mb-4">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleFileChange}
                          ref={fileInputRef}
                          className="hidden"
                          id="avatar-file-input"
                        />
                        {!storageBucket ? (
                          <div className="text-center p-4 bg-red-50 text-red-800 rounded-md">
                            <Info className="h-5 w-5 mx-auto mb-2" />
                            <p className="text-sm">Armazenamento não disponível. Contate o administrador.</p>
                          </div>
                        ) : (
                          <>
                            <div>
                              <Label className="font-medium mb-1.5 block">Selecione uma imagem do seu computador</Label>
                              <Button 
                                variant="outline" 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading || !storageBucket}
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
                                  disabled={isUploading || !storageBucket}
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
                          </>
                        )}
                    </div>
                    )}
                  
                  <AlertDialogFooter className="flex items-center justify-between">
                    <AlertDialogCancel className="dialog-close">Cancelar</AlertDialogCancel>
                    {avatarMode === 'link' && (
                      <AlertDialogAction 
                        onClick={() => {
                          // Forçar recarregamento removendo temporariamente
                          setShouldShowAvatar(false);
                          
                          handleSaveField('avatarUrl');
                          // Atualizar o key da imagem para forçar o recarregamento
                          setAvatarKey(Date.now());
                          
                          // Pequeno atraso para garantir que o componente seja remontado
                          setTimeout(() => {
                            // Mostrar a imagem novamente
                            setShouldShowAvatar(true);
                            
                            // Disparar evento de mudança de avatar
                            if (user) {
                              window.dispatchEvent(new CustomEvent('user-avatar-changed', { 
                                detail: { 
                                  userId: user.id, 
                                  avatarUrl: formData.avatarUrl,
                                  timestamp: Date.now() 
                                }
                              }));
                              
                              // Tentar mostrar notificação com o sistema de toast
                              toast({
                                title: 'Foto de perfil atualizada',
                                description: 'Sua foto foi atualizada com sucesso. Para visualizar em todos os lugares, pode ser necessário recarregar a página.',
                                duration: 8000,
                              });
                              
                              // Criar um container para a notificação personalizada
                              const notificationContainer = document.createElement('div');
                              notificationContainer.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2 items-end max-w-sm';
                              notificationContainer.id = 'profile-notification-container';
                              
                              // Criar a notificação
                              const notification = document.createElement('div');
                              notification.className = 'bg-background border border-border shadow-lg rounded-lg p-4 animate-in slide-in-from-right';
                              notification.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                              
                              // Título da notificação
                              const title = document.createElement('div');
                              title.className = 'font-medium text-foreground flex items-center gap-2 mb-1';
                              title.innerHTML = '<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.49991 0.876892C3.84222 0.876892 0.877075 3.84204 0.877075 7.49972C0.877075 11.1574 3.84222 14.1226 7.49991 14.1226C11.1576 14.1226 14.1227 11.1574 14.1227 7.49972C14.1227 3.84204 11.1576 0.876892 7.49991 0.876892ZM1.82707 7.49972C1.82707 4.36671 4.36689 1.82689 7.49991 1.82689C10.6329 1.82689 13.1727 4.36671 13.1727 7.49972C13.1727 10.6327 10.6329 13.1726 7.49991 13.1726C4.36689 13.1726 1.82707 10.6327 1.82707 7.49972ZM7.50003 4C7.77617 4 8.00003 4.22386 8.00003 4.5V8.5C8.00003 8.77614 7.77617 9 7.50003 9C7.22389 9 7.00003 8.77614 7.00003 8.5V4.5C7.00003 4.22386 7.22389 4 7.50003 4ZM7.5 10C7.22386 10 7 10.2239 7 10.5C7 10.7761 7.22386 11 7.5 11C7.77614 11 8 10.7761 8 10.5C8 10.2239 7.77614 10 7.5 10Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>Foto de perfil atualizada';
                              
                              // Conteúdo da notificação
                              const content = document.createElement('div');
                              content.className = 'text-sm text-muted-foreground';
                              content.textContent = 'Sua foto foi atualizada com sucesso. Para visualizar em todos os lugares, pode ser necessário recarregar a página.';
                              
                              // Adicionar título e conteúdo à notificação
                              notification.appendChild(title);
                              notification.appendChild(content);
                              
                              // Adicionar notificação ao container
                              notificationContainer.appendChild(notification);
                              
                              // Adicionar container ao body
                              document.body.appendChild(notificationContainer);
                              
                              // Adicionar um botão de recarregamento
                              const reloadButton = document.createElement('button');
                              reloadButton.innerText = 'Recarregar página';
                              reloadButton.className = 'bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-md flex items-center gap-2 animate-in slide-in-from-right';
                              reloadButton.style.animationDelay = '150ms';
                              reloadButton.onclick = () => window.location.reload();
                              
                              // Adicionar ícone de refresh
                              const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                              iconSvg.setAttribute('viewBox', '0 0 24 24');
                              iconSvg.setAttribute('width', '16');
                              iconSvg.setAttribute('height', '16');
                              iconSvg.setAttribute('fill', 'none');
                              iconSvg.setAttribute('stroke', 'currentColor');
                              iconSvg.setAttribute('stroke-width', '2');
                              iconSvg.setAttribute('stroke-linecap', 'round');
                              iconSvg.setAttribute('stroke-linejoin', 'round');
                              
                              const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                              path.setAttribute('d', 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15');
                              
                              iconSvg.appendChild(path);
                              reloadButton.prepend(iconSvg);
                              
                              // Adicionar botão ao container de notificação
                              notificationContainer.appendChild(reloadButton);
                              
                              // Remover a notificação após 10 segundos
                              setTimeout(() => {
                                if (document.body.contains(notificationContainer)) {
                                  // Adicionar classe de fade-out
                                  notification.style.opacity = '0';
                                  notification.style.transform = 'translateX(10px)';
                                  notification.style.transition = 'opacity 0.5s, transform 0.5s';
                                  reloadButton.style.opacity = '0';
                                  reloadButton.style.transform = 'translateX(10px)';
                                  reloadButton.style.transition = 'opacity 0.5s, transform 0.5s';
                                  
                                  // Remover após a animação
                                  setTimeout(() => {
                                    if (document.body.contains(notificationContainer)) {
                                      document.body.removeChild(notificationContainer);
                                    }
                                  }, 500);
                                }
                              }, 10000);
                            }
                          }, 100);
                        }}
                        disabled={!formData.avatarUrl}
                      >
                        Salvar
                      </AlertDialogAction>
                    )}
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