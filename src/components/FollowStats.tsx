import React, { useState, useEffect } from 'react';
import { getFollowers, getFollowing, FollowableUser } from '@/services/followService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetClose
} from '@/components/ui/sheet';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  UserPlus, 
  UserCheck, 
  Users, 
  User, 
  Loader2, 
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useMediaQuery from '@/hooks/useMediaQuery';

interface FollowStatsProps {
  userId: string;
  isCurrentUser: boolean;
  followersCount?: number;
  followingCount?: number;
  className?: string;
  compact?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

const FollowStats: React.FC<FollowStatsProps> = ({
  userId,
  isCurrentUser,
  followersCount = 0,
  followingCount = 0,
  className = '',
  compact = false,
  orientation = 'horizontal'
}) => {
  const [followers, setFollowers] = useState<FollowableUser[]>([]);
  const [following, setFollowing] = useState<FollowableUser[]>([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(false);
  const [activeSheet, setActiveSheet] = useState<'followers' | 'following' | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'followers' | 'following' | null>(null);
  const [realFollowersCount, setRealFollowersCount] = useState(followersCount);
  const [realFollowingCount, setRealFollowingCount] = useState(followingCount);
  
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 640px)');

  useEffect(() => {
    const loadRealCounts = async () => {
      try {
        const followersData = await getFollowers(userId);
        const followingData = await getFollowing(userId);
        
        setRealFollowersCount(followersData.length);
        setRealFollowingCount(followingData.length);
        
        console.log(`FollowStats - Contagens reais carregadas para ${userId}:`, {
          seguidores: followersData.length,
          seguindo: followingData.length
        });
      } catch (error) {
        console.error('Erro ao carregar contagens reais:', error);
        setRealFollowersCount(followersCount);
        setRealFollowingCount(followingCount);
      }
    };
    
    if (userId) {
      loadRealCounts();
    }
  }, [userId, followersCount, followingCount]);

  const fetchFollowers = async () => {
    console.log('Buscando seguidores para userId:', userId);
    setIsLoadingFollowers(true);
    const data = await getFollowers(userId);
    console.log('Seguidores recebidos:', data);
    setFollowers(data);
    setRealFollowersCount(data.length);
    setIsLoadingFollowers(false);
  };

  const fetchFollowing = async () => {
    console.log('Buscando usuários seguidos para userId:', userId);
    setIsLoadingFollowing(true);
    const data = await getFollowing(userId);
    console.log('Usuários seguidos recebidos:', data);
    setFollowing(data);
    setRealFollowingCount(data.length);
    setIsLoadingFollowing(false);
  };

  const handleFollowersClick = () => {
    fetchFollowers();
    if (isMobile) {
      setActiveSheet('followers');
    } else {
      setDialogType('followers');
      setDialogOpen(true);
    }
  };

  const handleFollowingClick = () => {
    fetchFollowing();
    if (isMobile) {
      setActiveSheet('following');
    } else {
      setDialogType('following');
      setDialogOpen(true);
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

  const renderUserList = (users: FollowableUser[], isLoading: boolean, type: 'followers' | 'following') => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
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
        {users.map(user => (
          <div key={user.id} className="flex items-center justify-between pt-3">
            <div 
              className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
              onClick={() => navigate(`/profile/${user.id}`)}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar_url || undefined} alt={user.display_name || user.username} />
                <AvatarFallback>
                  {getInitials(user.display_name || user.username)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {user.display_name || user.username}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  @{user.username}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const statsContent = (
    <>
      <div 
        className={`flex items-center cursor-pointer ${orientation === 'vertical' ? 'justify-between' : 'mr-5'}`}
        onClick={handleFollowersClick}
        data-follow-type="followers"
      >
        <div className={`${orientation === 'vertical' ? '' : 'text-center'}`}>
          <span className="text-lg font-bold">{realFollowersCount}</span>
          <span className={`text-muted-foreground ${orientation === 'vertical' ? 'ml-2' : 'block text-sm'}`}>
            seguidores
          </span>
        </div>
        {orientation === 'vertical' && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </div>
      
      <div 
        className={`flex items-center cursor-pointer ${orientation === 'vertical' ? 'justify-between mt-3' : ''}`}
        onClick={handleFollowingClick}
        data-follow-type="following"
      >
        <div className={`${orientation === 'vertical' ? '' : 'text-center'}`}>
          <span className="text-lg font-bold">{realFollowingCount}</span>
          <span className={`text-muted-foreground ${orientation === 'vertical' ? 'ml-2' : 'block text-sm'}`}>
            seguindo
          </span>
        </div>
        {orientation === 'vertical' && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </div>
    </>
  );

  return (
    <>
      {compact ? (
        <div className={`flex gap-4 ${orientation === 'vertical' ? 'flex-col' : ''} ${className}`} data-followstats-id={userId}>
          {statsContent}
        </div>
      ) : (
        <Card className={className} data-followstats-id={userId}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Conexões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`flex ${orientation === 'vertical' ? 'flex-col' : 'justify-around'}`}>
              {statsContent}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sheet para mobile */}
      <Sheet open={activeSheet !== null} onOpenChange={() => setActiveSheet(null)}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader className="mb-6">
            <SheetTitle>
              {activeSheet === 'followers' ? 'Seguidores' : 'Seguindo'}
            </SheetTitle>
            <SheetDescription>
              {activeSheet === 'followers' 
                ? `${isCurrentUser ? 'Seus' : 'Os'} seguidores (${followers.length})`
                : `${isCurrentUser ? 'Você' : 'Este usuário'} segue (${following.length})`
              }
            </SheetDescription>
          </SheetHeader>
          
          {activeSheet === 'followers' 
            ? renderUserList(followers, isLoadingFollowers, 'followers')
            : renderUserList(following, isLoadingFollowing, 'following')
          }
          
          <div className="mt-4 flex justify-end">
            <SheetClose asChild>
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog para desktop */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'followers' ? 'Seguidores' : 'Seguindo'}
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'followers' 
                ? `${isCurrentUser ? 'Seus' : 'Os'} seguidores (${followers.length})`
                : `${isCurrentUser ? 'Você' : 'Este usuário'} segue (${following.length})`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto">
            {dialogType === 'followers' 
              ? renderUserList(followers, isLoadingFollowers, 'followers')
              : renderUserList(following, isLoadingFollowing, 'following')
            }
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FollowStats; 