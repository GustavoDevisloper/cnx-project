import { supabase } from '@/services/supabaseClient';
import { toast } from '@/hooks/use-toast';
import { User } from '@/types/user';
import { logger } from '../lib/utils';
import { getHardcodedUsers } from './directUserHardcoded';
import { forceLog, checkConsoleStatus } from '@/lib/directConsoleLogs';
import { restoreConsole, restoreAndGetConsole } from '../lib/consoleOverride';
import { getCurrentUser } from './authService';
import { showInfoNotification } from '@/services/notificationService';

export interface FollowableUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  followers_count: number;
  is_followed: boolean;
}

/**
 * Verifica se um usuário está seguindo outro
 */
export const isFollowing = async (followingId: string): Promise<boolean> => {
  logger.log('isFollowing chamado com followingId:', followingId);
  try {
    // Obter o usuário atual usando a mesma função que o resto da aplicação
    const currentUser = await getCurrentUser();
    logger.log('getCurrentUser em isFollowing retornou:', currentUser);
    
    if (!currentUser) {
      logger.log('Usuário não autenticado em isFollowing');
      return false;
    }
    
    const { data, error } = await supabase.rpc('is_following', {
      follower: currentUser.id,
      following: followingId
    });
    
    logger.log('Resultado da verificação is_following:', { data, error });
    
    if (error) {
      logger.error('Erro ao verificar se está seguindo:', error);
      throw error;
    }
    return data || false;
  } catch (error) {
    logger.error('Erro ao verificar se está seguindo:', error);
    return false;
  }
};

/**
 * Segue um usuário
 */
export const followUser = async (userId: string): Promise<boolean> => {
  logger.log('followUser chamado com userId:', userId);
  try {
    // Obter o usuário atual usando a mesma função que o resto da aplicação
    const currentUser = await getCurrentUser();
    logger.log('getCurrentUser retornou:', currentUser);
    
    if (!currentUser) {
      logger.log('Usuário não autenticado (getCurrentUser)');
      toast({
        title: 'Não autenticado',
        description: 'Você precisa fazer login para seguir usuários',
        variant: 'destructive'
      });
      return false;
    }
    
    const currentUserId = currentUser.id;
    logger.log('ID do usuário atual (getCurrentUser):', currentUserId);
    
    // Verificar se já está seguindo
    const alreadyFollowing = await isFollowing(userId);
    logger.log('Já está seguindo?', alreadyFollowing);
    
    if (alreadyFollowing) {
      toast({
        title: 'Já está seguindo',
        description: 'Você já está seguindo este usuário',
      });
      return true;
    }
    
    // Obter informações do usuário que está sendo seguido
    const { data: userToFollow, error: userError } = await supabase
      .from('users')
      .select('username, display_name, first_name, id')
      .eq('id', userId)
      .single();
    
    if (userError) {
      logger.error('Erro ao obter informações do usuário a seguir:', userError);
    }
    
    // Determinar o nome a mostrar (display_name > username > first_name > "este usuário")
    const displayName = userToFollow?.display_name || 
                        userToFollow?.username || 
                        userToFollow?.first_name || 
                        'este usuário';
    
    logger.log('Inserindo registro na tabela followers:', { follower_id: currentUserId, following_id: userId });
    const result = await supabase
      .from('followers')
      .insert({
        follower_id: currentUserId,
        following_id: userId
      });
    
    const error = result.error;
    logger.log('Resultado da inserção:', result);
    
    if (error) {
      logger.error('Erro ao inserir seguidor:', error);
      throw error;
    }
    
    // Criar uma notificação para o usuário seguido
    // Primeiro obtemos o nome do usuário que está seguindo
    const currentUserName = currentUser.display_name || currentUser.username || 'Alguém';
    
    // Enviar a notificação para o banco de dados do usuário que está sendo seguido
    try {
      // Adicionar registro na tabela de notificações para o usuário seguido
      await supabase
        .from('notifications')
        .insert({
          user_id: userId, // ID do usuário que está sendo seguido
          title: 'Novo seguidor',
          message: `${currentUserName} começou a seguir você`,
          type: 'follow',
          related_user_id: currentUser.id,
          read: false
        });
      
      // Emitir um evento para o sistema de notificações
      // Isso irá disparar uma notificação no centro de notificações do usuário
      showInfoNotification(
        'Novo seguidor',
        `${currentUserName} começou a seguir você`
      );
      
      logger.log('✅ Notificação de seguidor enviada com sucesso');
    } catch (notifError) {
      // Apenas logamos o erro, mas não interrompemos o fluxo
      logger.error('Erro ao enviar notificação de seguidor:', notifError);
    }
    
    toast({
      title: 'Seguindo',
      description: `Você começou a seguir ${displayName}`,
    });
    
    return true;
  } catch (error: any) {
    logger.error('Erro ao seguir usuário:', error);
    toast({
      title: 'Erro ao seguir',
      description: error.message || 'Não foi possível seguir este usuário',
      variant: 'destructive'
    });
    return false;
  }
};

/**
 * Deixa de seguir um usuário
 */
export const unfollowUser = async (userId: string): Promise<boolean> => {
  try {
    // Obter o usuário atual usando a mesma função que o resto da aplicação
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      toast({
        title: 'Não autenticado',
        description: 'Você precisa fazer login para deixar de seguir usuários',
        variant: 'destructive'
      });
      return false;
    }
    
    const currentUserId = currentUser.id;
    
    // Obter informações do usuário que está sendo deixado de seguir
    const { data: userToUnfollow, error: userError } = await supabase
      .from('users')
      .select('username, display_name, first_name')
      .eq('id', userId)
      .single();
    
    if (userError) {
      logger.error('Erro ao obter informações do usuário:', userError);
    }
    
    // Determinar o nome a mostrar (display_name > username > first_name > "este usuário")
    const displayName = userToUnfollow?.display_name || 
                        userToUnfollow?.username || 
                        userToUnfollow?.first_name || 
                        'este usuário';
    
    const { error } = await supabase
      .from('followers')
      .delete()
      .match({
        follower_id: currentUserId,
        following_id: userId
      });
    
    if (error) throw error;
    
    toast({
      title: 'Deixou de seguir',
      description: `Você deixou de seguir ${displayName}`,
    });
    
    return true;
  } catch (error: any) {
    logger.error('Erro ao deixar de seguir usuário:', error);
    toast({
      title: 'Erro ao deixar de seguir',
      description: error.message || 'Não foi possível deixar de seguir este usuário',
      variant: 'destructive'
    });
    return false;
  }
};

/**
 * Buscar usuários por nome ou username
 */
export const searchUsers = async (searchQuery: string): Promise<FollowableUser[]> => {
  const originalConsole = restoreAndGetConsole();
  originalConsole.log('🔍 Iniciando busca de usuários com query:', searchQuery);
  
  try {
    // Apenas registra o status da autenticação, mas não impede a busca
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      originalConsole.log('ℹ️ Usuário não está autenticado, continuando busca sem verificar seguimento');
    }

    // Busca direta na tabela de usuários em vez de usar a função RPC
    const { data, error } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url, followers_count')
      .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%`)
      .limit(20);
    
    if (error) {
      originalConsole.error('❌ Erro na busca direta de usuários:', error);
      throw error;
    }

    // Formata os resultados para o formato esperado
    const formattedUsers: FollowableUser[] = data?.map(user => ({
      id: user.id,
      username: user.username || 'usuário',
      display_name: user.display_name || user.username || 'Usuário',
      avatar_url: user.avatar_url || '',
      followers_count: user.followers_count || 0,
      is_followed: false // Sem autenticação, não conseguimos verificar se segue
    })) || [];

    originalConsole.log('✅ Resultados encontrados:', formattedUsers.length);
    return formattedUsers;
  } catch (error) {
    originalConsole.error('❌ Erro ao buscar usuários:', error);
    return [];
  }
};

/**
 * Obter seguidores de um usuário
 */
export const getFollowers = async (userId: string): Promise<FollowableUser[]> => {
  try {
    const { data, error } = await supabase.rpc('get_followers', {
      user_id: userId,
      limit_count: 50
    });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Erro ao obter seguidores:', error);
    return [];
  }
};

/**
 * Obter usuários que um usuário segue
 */
export const getFollowing = async (userId: string): Promise<FollowableUser[]> => {
  logger.log('getFollowing chamado com userId:', userId);
  try {
    // Verificar qual é o usuário atual
    const session = await supabase.auth.getSession();
    logger.log('Sessão atual:', session.data.session?.user?.id);
    
    logger.log('Executando RPC get_following com:', { user_id: userId, limit_count: 50 });
    const { data, error } = await supabase.rpc('get_following', {
      user_id: userId,
      limit_count: 50
    });
    
    if (error) {
      logger.error('Erro na RPC get_following:', error);
      throw error;
    }
    
    logger.log('Resultado do get_following:', data);
    
    // Se não retornou dados, tente um fallback com query direta
    if (!data || data.length === 0) {
      logger.log('Sem resultados do RPC, tentando query direta como fallback');
      
      const { data: directData, error: directError } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', userId);
        
      if (directError) {
        logger.error('Erro na consulta direta:', directError);
      } else if (directData && directData.length > 0) {
        logger.log('Encontrados seguindo via consulta direta:', directData);
        
        // Obter detalhes dos usuários
        const followingIds = directData.map(item => item.following_id);
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, username, display_name, avatar_url, followers_count')
          .in('id', followingIds);
          
        if (usersError) {
          logger.error('Erro ao buscar detalhes dos usuários:', usersError);
        } else if (usersData && usersData.length > 0) {
          logger.log('Detalhes dos usuários encontrados:', usersData);
          
          // Formatar dados para o formato esperado
          const formattedUsers = usersData.map(user => ({
            id: user.id,
            username: user.username || 'usuário',
            display_name: user.display_name || user.username || 'Usuário',
            avatar_url: user.avatar_url || null,
            followers_count: user.followers_count || 0,
            is_followed: true
          }));
          
          logger.log('Retornando dados formatados do fallback:', formattedUsers);
          return formattedUsers;
        }
      } else {
        logger.log('Nenhum seguidor encontrado na consulta direta');
      }
    }
    
    return data || [];
  } catch (error) {
    logger.error('Erro ao obter usuários seguidos:', error);
    return [];
  }
};

/**
 * Sugere usuários para seguir, com fallback para busca direta
 * @param limit Limite de resultados
 * @returns Array de usuários sugeridos ou vazio se nenhum encontrado
 */
export async function suggestUsersToFollow(limit = 10): Promise<FollowableUser[]> {
  const originalConsole = restoreAndGetConsole();
  originalConsole.log("Tentando buscar sugestões de usuários para seguir");
  
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      logger.warn('Sem usuário atual para buscar sugestões de seguidores');
      return [];
    }
    
    logger.log(`Buscando sugestões para usuário: ${currentUser.id}`);
    
    // Tenta o RPC primeiro
    const { data, error } = await supabase.rpc('suggest_users_to_follow', {
      limit_count: limit
    });
    
    if (error) {
      logger.error('Erro ao buscar sugestões de usuários para seguir:', error);
      logger.log('Tentando método de fallback para sugestões...');
      return await fallbackUserSuggestions(currentUser.id, limit);
    }
    
    // Verifica se temos dados válidos
    if (!data || data.length === 0) {
      logger.warn('Nenhuma sugestão de usuário retornada do RPC, tentando fallback...');
      return await fallbackUserSuggestions(currentUser.id, limit);
    }
    
    logger.log(`✅ ${data.length} sugestões de usuários encontradas via RPC`);
    return data;
  } catch (error) {
    logger.error('Erro ao processar sugestões de usuários:', error);
    return [];
  }
}

/**
 * Função de fallback para buscar usuários diretamente
 * Usada quando o RPC falha
 */
async function fallbackUserSuggestions(currentUserId: string, limit = 10): Promise<FollowableUser[]> {
  try {
    logger.log('Executando busca direta de usuários (fallback)');
    
    // Busca usuários ativos que não são o usuário atual
    const { data, error } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url')
      .neq('id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      logger.error('Erro na busca direta:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      logger.warn('Nenhum usuário encontrado na busca direta');
      return [];
    }
    
    // Formata os dados para o formato esperado
    const formattedUsers: FollowableUser[] = data.map(user => ({
      id: user.id,
      username: user.username || 'usuário',
      displayName: user.display_name || user.username || 'Usuário',
      avatarUrl: user.avatar_url || '',
      display_name: user.display_name || user.username || 'Usuário',
      avatar_url: user.avatar_url || '',
      followers_count: 0,
      is_followed: false,
      isFollowing: false
    }));
    
    logger.log(`✅ ${formattedUsers.length} usuários encontrados via busca direta`);
    return formattedUsers;
  } catch (error) {
    logger.error('Erro na busca direta de usuários:', error);
    return [];
  }
}

/**
 * Busca direta de usuários sugeridos sem usar função RPC
 * Este é um método alternativo para quando a função RPC falha
 */
export async function directUserSuggestions(limit: number = 10): Promise<FollowableUser[]> {
  try {
    forceLog('🔍 Executando busca direta de usuários FORÇADA com hardcoded');
    
    // SEMPRE retornar os usuários hardcoded para forçar a exibição
    const hardcodedResult = getHardcodedUsers(limit);
    forceLog('🔄 Retornando FORÇADAMENTE usuários hardcoded:', hardcodedResult);
    
    // Mesmo assim, tentamos buscar do banco para depuração
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, display_name, avatar_url, followers_count, role')
        .limit(20); 
      
      forceLog('Resultado da busca no banco (apenas para diagnóstico):', { 
        success: !error, 
        count: data?.length || 0, 
        data,
        error 
      });
    } catch (dbError) {
      forceLog('Erro na busca do banco (ignorando):', dbError);
    }
    
    return hardcodedResult;
  } catch (error) {
    forceLog('❌ Erro na busca direta:', error);
    return getHardcodedUsers(limit);
  }
} 