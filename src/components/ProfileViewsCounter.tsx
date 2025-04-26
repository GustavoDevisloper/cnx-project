import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Eye, Users, TrendingUp, Calendar } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { toast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProfileViewsCounterProps {
  userId: string;
  isCurrentUser: boolean;
  profileViews?: number;
  showDetailed?: boolean;
  className?: string;
}

interface ViewsStats {
  total: number;
  unique: number;
  weekly: number;
  monthly: number;
}

const ProfileViewsCounter = ({
  userId,
  isCurrentUser,
  profileViews = 0,
  showDetailed = false,
  className = '',
}: ProfileViewsCounterProps) => {
  const [viewsCount, setViewsCount] = useState(profileViews);
  const [stats, setStats] = useState<ViewsStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Puxar o valor atual do banco quando o componente for montado
  useEffect(() => {
    if (showDetailed) {
      fetchDetailedStats();
    } else {
      // Sempre usar o valor mais atualizado do prop
      setViewsCount(profileViews);
    }
  }, [profileViews, userId, showDetailed]);

  const fetchDetailedStats = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      // Primeiro tentar usar a função de estatísticas, se estiver disponível
      const { data: statsData, error: statsError } = await supabase.rpc(
        'get_profile_views_stats',
        { user_id: userId }
      );

      if (statsError) {
        console.error('Erro ao obter estatísticas de visualizações:', statsError);
        
        // Fallback: obter apenas a contagem total da tabela de usuários
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('profile_views')
          .eq('id', userId)
          .single();
          
        if (userError) {
          console.error('Erro ao obter visualizações do usuário:', userError);
          throw userError;
        }
        
        // Definir estatísticas básicas
        setStats({
          total: userData.profile_views || 0,
          unique: userData.profile_views || 0, // Não temos essa informação
          weekly: 0, // Não temos essa informação
          monthly: 0, // Não temos essa informação
        });
        
        setViewsCount(userData.profile_views || 0);
      } else {
        // Se a função RPC funcionou, usar seus dados
        setStats({
          total: statsData.total_views,
          unique: statsData.unique_viewers,
          weekly: statsData.weekly_views,
          monthly: statsData.monthly_views,
        });
        
        setViewsCount(statsData.total_views);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas de visualizações:', error);
      toast({
        title: 'Erro ao carregar visualizações',
        description: 'Não foi possível obter as estatísticas de visualizações do perfil.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Versão simples (apenas contador)
  if (!showDetailed) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Eye className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{viewsCount} visualizações</span>
        {isCurrentUser && viewsCount > 0 && (
          <Badge variant="outline" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            Seu perfil tem interesse!
          </Badge>
        )}
      </div>
    );
  }

  // Versão detalhada (com estatísticas)
  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Visualizações do perfil
        </h3>
        {isLoading ? (
          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchDetailedStats}
            className="h-8 px-2"
          >
            <TrendingUp className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-muted rounded-md p-3 flex flex-col items-center">
                <span className="text-sm text-muted-foreground mb-1">Total</span>
                <span className="text-2xl font-bold">{stats?.total || viewsCount}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Total de visualizações do seu perfil</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-muted rounded-md p-3 flex flex-col items-center">
                <span className="text-sm text-muted-foreground mb-1">Únicos</span>
                <span className="text-2xl font-bold">{stats?.unique || '-'}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Visitantes únicos que viram seu perfil</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-muted rounded-md p-3 flex flex-col items-center">
                <span className="text-sm text-muted-foreground mb-1">Semanal</span>
                <span className="text-2xl font-bold">{stats?.weekly || '-'}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Visualizações nos últimos 7 dias</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-muted rounded-md p-3 flex flex-col items-center">
                <span className="text-sm text-muted-foreground mb-1">Mensal</span>
                <span className="text-2xl font-bold">{stats?.monthly || '-'}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Visualizações nos últimos 30 dias</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {isCurrentUser && (
        <p className="mt-3 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 inline mr-1" />
          Esta métrica ajuda a entender a popularidade do seu perfil.
        </p>
      )}
    </Card>
  );
};

export default ProfileViewsCounter; 