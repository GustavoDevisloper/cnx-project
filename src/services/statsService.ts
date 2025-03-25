import { supabase } from './supabaseClient';

export interface DashboardStats {
  usersCount: number;
  eventsCount: number;
  devotionalsCount: number;
  loading: boolean;
  error: string | null;
}

/**
 * Busca a contagem de usuários no banco de dados
 */
export const getUsersCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Erro ao buscar contagem de usuários:', error);
      throw error;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Erro ao contar usuários:', error);
    return 0;
  }
};

/**
 * Busca a contagem de eventos no banco de dados
 */
export const getEventsCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Erro ao buscar contagem de eventos:', error);
      throw error;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Erro ao contar eventos:', error);
    return 0;
  }
};

/**
 * Busca a contagem de devocionais no banco de dados
 */
export const getDevotionalsCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('devotionals')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Erro ao buscar contagem de devocionais:', error);
      throw error;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Erro ao contar devocionais:', error);
    return 0;
  }
};

/**
 * Busca todas as estatísticas para o dashboard em paralelo
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const [usersCount, eventsCount, devotionalsCount] = await Promise.all([
      getUsersCount(),
      getEventsCount(),
      getDevotionalsCount()
    ]);
    
    return {
      usersCount,
      eventsCount,
      devotionalsCount,
      loading: false,
      error: null
    };
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    return {
      usersCount: 0,
      eventsCount: 0,
      devotionalsCount: 0,
      loading: false,
      error: error.message || 'Erro ao buscar estatísticas'
    };
  }
}; 