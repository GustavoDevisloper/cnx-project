import { getScriptureByTheme, generateThemeMessage } from './bibleService';
import { supabase, checkSupabaseConnectivity } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { format, addDays, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { searchVersesByTheme, getVerseByReference, getVerseExplanation, BibleVersion, BibleVerse } from './bibleService';
import { getCurrentUser } from './authService';

// Add these type definitions after the imports
interface DevotionalGenerationResponse {
  devotionals: Devotional[];
  success: boolean;
  error?: string;
}

interface VerseExplanation {
  explanation: string;
  // Add other properties if needed
}

const bibleVersions: Record<BibleVersion, string> = {
  'NVI': 'Nova Versão Internacional',
  'ACF': 'Almeida Corrigida Fiel',
  'ARA': 'Almeida Revista e Atualizada',
  'NTLH': 'Nova Tradução na Linguagem de Hoje',
  'NVT': 'Nova Versão Transformadora',
  'KJV': 'King James Atualizada'
};

// Função para gerar IDs únicos sem dependência externa
function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Interface para o modelo de devocional
export interface Devotional {
  id: string;
  title: string;
  content?: string;        // Conteúdo é opcional agora
  scripture: string;       // O versículo é obrigatório
  scriptureText?: string;  // Texto do versículo, pode ser preenchido pelo cliente
  author: string;          // Nome do autor (admin)
  authorId: string;        // ID do autor (admin)
  date: string;            // Data de publicação
  dayOfWeek?: string;      // Dia da semana opcional
  imageSrc?: string;       // Caminho para imagem ilustrativa (opcional)
  likes?: number;          // Contador de curtidas
  hasLiked?: boolean;      // Se o usuário atual curtiu
  comments?: DevotionalComment[]; // Comentários dos usuários
  commentsCount?: number;  // Contador de comentários
  theme?: string;          // Tema do devocional
  references?: string[];   // Versículos adicionais para referência
  transmissionLink?: string; // Link para transmissão, se houver
}

// Interface para comentários
export interface DevotionalComment {
  id: string;
  text: string;            // O comentário do usuário é onde estará a interpretação pessoal
  author: string;
  authorId: string;
  authorAvatar?: string;
  createdAt: string;
}

// Dias da semana
export const DAYS_OF_WEEK = [
  "Domingo", "Segunda-feira", "Terça-feira", 
  "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"
];

/**
 * Busca o devocional do dia atual
 */
export const getTodayDevotional = async (): Promise<Devotional | null> => {
  try {
    console.log('Buscando devocional do dia...');
    
    // Chamar a função RPC atualizada
    const { data, error } = await supabase
      .rpc('get_daily_devotional');
    
    if (error) {
      console.error('Erro ao buscar devocional do dia:', error);
      
      // Tentar buscar o mais recente como fallback usando a tabela diretamente
      console.log('Tentando buscar o devocional mais recente...');
      const today = new Date().toISOString().split('T')[0];
      
      const { data: latestData, error: latestError } = await supabase
        .from('devotionals')
        .select(`
          *,
          author:author_id (
            first_name,
            username,
            avatar_url
          )
        `)
        .lte('date', today)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (latestError) {
        console.error('Erro ao buscar devocional mais recente:', latestError);
        return null;
      }
      
      if (!latestData) {
        console.log('Nenhum devocional encontrado.');
        return null;
      }
      
      return await enrichDevotionalData(latestData);
    }
    
    if (!data) {
      console.log('Nenhum devocional encontrado para hoje.');
      return null;
    }
    
    return await enrichDevotionalData(data);
  } catch (error) {
    console.error('Erro ao processar devocional:', error);
    return null;
  }
};

/**
 * Busca todos os devocionais
 */
export const getDevotionals = async (): Promise<Devotional[]> => {
  try {
    const { data, error } = await supabase
      .from('devotionals')
      .select('*')
      .order('date', { ascending: false });
      
    if (error) {
      console.error("Erro ao buscar devocionais:", error);
      return [];
    }
    
    // Enriquece cada devocional com contagem de curtidas e comentários
    const enrichedDevotionals = await Promise.all(
      data.map(devotional => enrichDevotionalData(devotional))
    );
    
    return enrichedDevotionals;
  } catch (error) {
    console.error("Erro ao buscar devocionais:", error);
    return [];
  }
};

/**
 * Busca um devocional específico pelo ID
 */
export const getDevotionalById = async (id: string): Promise<Devotional | null> => {
  try {
    const { data, error } = await supabase
      .from('devotionals')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error("Erro ao buscar devocional:", error);
      return null;
    }
    
    return await enrichDevotionalData(data);
  } catch (error) {
    console.error("Erro ao buscar devocional:", error);
    return null;
  }
};

/**
 * Adiciona informações adicionais ao devocional (curtidas, comentários)
 */
async function enrichDevotionalData(devotionalData: any): Promise<Devotional> {
  if (!devotionalData) return null;
  
  try {
    console.log("Enriquecendo dados do devocional:", devotionalData.id);
    // Verificar se já existem likes para este devocional
    let likes = 0;
    let hasLiked = false;
    
    try {
      const { count: likesCount, error: likesError } = await supabase
        .from('devotional_likes')
        .select('*', { count: 'exact', head: true })
        .eq('devotional_id', devotionalData.id);
      
      if (likesError) {
        console.error("Erro ao contar curtidas:", likesError);
      } else if (likesCount !== null) {
        likes = likesCount;
      }
    } catch (e) {
      console.error("Erro ao buscar curtidas:", e);
    }
    
    // Verificar se o usuário atual curtiu este devocional
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (userId) {
      try {
        const { data: userLike, error: likeError } = await supabase
          .from('devotional_likes')
          .select('id')
          .eq('devotional_id', devotionalData.id)
          .eq('user_id', userId)
          .maybeSingle();
        
        if (likeError) {
          console.error("Erro ao verificar curtida:", likeError);
        } else {
          hasLiked = !!userLike;
        }
      } catch (e) {
        console.error("Erro ao verificar se o usuário curtiu:", e);
      }
    }
    
    // Contar comentários
    let commentsCount = 0;
    try {
      const { count: commentCount, error: commentError } = await supabase
        .from('devotional_comments')
        .select('*', { count: 'exact', head: true })
        .eq('devotional_id', devotionalData.id);
      
      if (commentError) {
        console.error("Erro ao contar comentários:", commentError);
      } else if (commentCount !== null) {
        commentsCount = commentCount;
      }
    } catch (e) {
      console.error("Erro ao buscar comentários:", e);
    }
    
    // Criar o objeto Devotional a partir dos dados
    const enrichedDevotional: Devotional = {
      id: devotionalData.id,
      title: devotionalData.title,
      content: devotionalData.content,
      scripture: devotionalData.scripture,
      scriptureText: devotionalData.scripture_text,
      author: 'Autor Desconhecido', // Valor padrão
      authorId: devotionalData.author_id,
      date: devotionalData.date,
      dayOfWeek: devotionalData.day_of_week,
      imageSrc: devotionalData.image_url,
      isAIGenerated: devotionalData.is_ai_generated,
      likes,
      hasLiked,
      commentsCount,
      references: devotionalData.references || [],
      transmissionLink: devotionalData.transmission_link || '',
      theme: devotionalData.theme || ''
    };
    
    // Buscar informações do autor se houver author_id
    if (devotionalData.author_id) {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('first_name, username')
          .eq('id', devotionalData.author_id)
          .single();
        
        if (!userError && userData) {
          enrichedDevotional.author = userData.first_name || userData.username || 'Autor Desconhecido';
        }
      } catch (e) {
        console.error("Erro ao buscar informações do autor:", e);
      }
    }
    
    return enrichedDevotional;
  } catch (error) {
    console.error('Erro ao enriquecer dados do devocional:', error);
    // Retornar os dados originais se houver erro no enriquecimento
    return {
      id: devotionalData.id,
      title: devotionalData.title,
      content: devotionalData.content,
      scripture: devotionalData.scripture,
      scriptureText: devotionalData.scripture_text || '',
      author: 'Autor Desconhecido',
      authorId: devotionalData.author_id,
      date: devotionalData.date,
      dayOfWeek: devotionalData.day_of_week || '',
      isAIGenerated: devotionalData.is_ai_generated || false,
      references: devotionalData.references || [],
      transmissionLink: devotionalData.transmission_link || '',
      likes: 0,
      commentsCount: 0,
      theme: devotionalData.theme || ''
    };
  }
}

/**
 * Busca comentários de um devocional específico
 */
export const getDevotionalComments = async (devotionalId: string): Promise<DevotionalComment[]> => {
  try {
    console.log("Buscando comentários para o devocional:", devotionalId);
    
    const { data, error } = await supabase
      .from('devotional_comments')
      .select(`
        id,
        content,
        created_at,
        user_id,
        users(
          username,
          first_name,
          avatar_url
        )
      `)
      .eq('devotional_id', devotionalId)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error("Erro ao buscar comentários:", error);
      return [];
    }
    
    return data.map(comment => ({
      id: comment.id,
      text: comment.content,
      author: comment.users?.first_name || comment.users?.username || 'Usuário',
      authorId: comment.user_id,
      authorAvatar: comment.users?.avatar_url,
      createdAt: comment.created_at
    }));
  } catch (error) {
    console.error("Erro ao buscar comentários:", error);
    return [];
  }
};

/**
 * Adiciona um comentário a um devocional
 */
export const addDevotionalComment = async (devotionalId: string, text: string): Promise<DevotionalComment | null> => {
  try {
    // Verificar o usuário usando nosso sistema próprio de autenticação
    const user = await getCurrentUser();
    
    if (!user) {
      console.log('Usuário não está autenticado');
      toast({
        title: "Não autenticado",
        description: "Você precisa estar logado para comentar",
        variant: "destructive"
      });
      return null;
    }

    const userId = user.id;
    console.log('ID do usuário autenticado:', userId);

    // Já temos os dados do usuário pelo getCurrentUser, não precisamos verificar na tabela users

    console.log('Tentando adicionar comentário para o devocional:', devotionalId);
    
    const commentData = {
      devotional_id: devotionalId,
      user_id: userId,
      content: text,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Dados do comentário:', commentData);
    
    // Verificar conectividade antes de tentar postar o comentário
    const isSupabaseAvailable = await checkSupabaseConnectivity();
    
    if (!isSupabaseAvailable) {
      console.warn("⚠️ Supabase não está acessível. Salvando comentário localmente.");
      
      // Implementar lógica para salvar comentário localmente para sincronização posterior
      // Podemos usar a mesma abordagem que usamos para os devocionais
      const offlineCommentId = `offline_comment_${Date.now().toString(36)}${Math.random().toString(36).substring(2)}`;
      
      // Salvar em localStorage para sincronização futura
      const pendingComments = JSON.parse(localStorage.getItem('pending_comments') || '[]');
      pendingComments.push({
        ...commentData,
        id: offlineCommentId,
        pendingCreation: true,
        pendingTimestamp: Date.now()
      });
      localStorage.setItem('pending_comments', JSON.stringify(pendingComments));
      
      toast({
        title: "Comentário salvo localmente",
        description: "O comentário foi salvo no seu dispositivo e será sincronizado quando houver conexão"
      });
      
      // Retornar dados temporários para mostrar na interface
      return {
        id: offlineCommentId,
        text: text,
        author: user.first_name || user.username || user.email || 'Usuário',
        authorId: userId,
        authorAvatar: user.avatar_url,
        createdAt: new Date().toISOString()
      };
    }
    
    // Se o Supabase estiver disponível, prosseguir com a inserção online
    const { data, error } = await supabase
      .from('devotional_comments')
      .insert(commentData)
      .select(`
        id,
        content,
        created_at,
        user_id
      `)
      .single();
      
    if (error) {
      console.error("Erro ao adicionar comentário:", error);
      
      // Se for erro de conectividade, tentar salvar localmente
      if (error.message && (
        error.message.includes('Failed to fetch') ||
        error.message.includes('ERR_NAME_NOT_RESOLVED') ||
        error.message.includes('NetworkError')
      )) {
        console.warn("⚠️ Problema de conectividade detectado, salvando comentário localmente");
        
        // Salvar em localStorage para sincronização futura
        const offlineCommentId = `offline_comment_${Date.now().toString(36)}${Math.random().toString(36).substring(2)}`;
        const pendingComments = JSON.parse(localStorage.getItem('pending_comments') || '[]');
        pendingComments.push({
          ...commentData,
          id: offlineCommentId,
          pendingCreation: true,
          pendingTimestamp: Date.now()
        });
        localStorage.setItem('pending_comments', JSON.stringify(pendingComments));
        
        toast({
          title: "Comentário salvo localmente",
          description: "O comentário foi salvo no seu dispositivo e será sincronizado quando houver conexão"
        });
        
        // Retornar dados temporários para mostrar na interface
        return {
          id: offlineCommentId,
          text: text,
          author: user.first_name || user.username || user.email || 'Usuário',
          authorId: userId,
          authorAvatar: user.avatar_url,
          createdAt: new Date().toISOString()
        };
      }
      
      toast({
        title: "Erro ao comentar",
        description: error.message || "Não foi possível adicionar seu comentário",
        variant: "destructive"
      });
      return null;
    }
    
    console.log('Comentário adicionado com sucesso:', data);
    
    toast({
      title: "Comentário adicionado",
      description: "Seu comentário foi adicionado com sucesso"
    });
          
    return {
      id: data.id,
      text: data.content,
      author: user.first_name || user.username || user.email || 'Usuário',
      authorId: data.user_id,
      authorAvatar: user.avatar_url,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error("Erro ao adicionar comentário:", error);
    toast({
      title: "Erro ao comentar",
      description: "Ocorreu um erro ao tentar adicionar seu comentário",
      variant: "destructive"
    });
    return null;
  }
};

/**
 * Curtir/descurtir um devocional
 */
export const toggleDevotionalLike = async (devotionalId: string): Promise<{ success: boolean, isLiked: boolean }> => {
  try {
    console.log("Processando curtida para o devocional:", devotionalId);
    const user = await getCurrentUser();
    
    if (!user) {
      toast({
        title: "Não autenticado",
        description: "Você precisa estar logado para curtir",
        variant: "destructive"
      });
      return { success: false, isLiked: false };
    }
    
    // Verificar se já curtiu
    const { data: existingLike, error: checkError } = await supabase
      .from('devotional_likes')
      .select('id')
      .eq('devotional_id', devotionalId)
      .eq('user_id', user.id)
      .maybeSingle();
      
    if (checkError) {
      console.error("Erro ao verificar curtida:", checkError);
      return { success: false, isLiked: false };
    }
    
    let isLiked = false;
    
    // Se já curtiu, remover curtida
    if (existingLike) {
      const { error: deleteError } = await supabase
        .from('devotional_likes')
        .delete()
        .eq('id', existingLike.id);
        
      if (deleteError) {
        console.error("Erro ao remover curtida:", deleteError);
        return { success: false, isLiked: true };
      }
    } else {
      // Se não curtiu, adicionar curtida
      const { error: insertError } = await supabase
        .from('devotional_likes')
        .insert({
          devotional_id: devotionalId,
          user_id: user.id
        });
        
      if (insertError) {
        console.error("Erro ao adicionar curtida:", insertError);
        return { success: false, isLiked: false };
      }
      
      isLiked = true;
    }
    
    return { success: true, isLiked };
  } catch (error) {
    console.error("Erro ao processar curtida:", error);
    return { success: false, isLiked: false };
  }
};

/**
 * Verifica e publica automaticamente o devocional diário se necessário
 * Função removida - não haverá mais geração automática de devocionais
 */
export const checkAndPublishDailyDevotional = async (): Promise<Devotional | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    console.log('Buscando devocional para a data:', today);
    
    // Verificar se já existe um devocional para hoje
    const { data: existingDevotional, error } = await supabase
      .from('devotionals')
      .select(`
        *,
        author:author_id (
          first_name,
          username,
          avatar_url
        )
      `)
      .eq('date', today)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      console.error('Erro ao buscar devocional do dia:', error);
      return null;
    }
    
    if (existingDevotional) {
      console.log('Devocional encontrado para hoje:', existingDevotional.id);
      return await enrichDevotionalData(existingDevotional);
    }
    
    // Não gerar automaticamente, apenas retornar null
    console.log('Nenhum devocional encontrado para hoje e nenhum será gerado automaticamente.');
    return null;
  } catch (error) {
    console.error('Erro ao verificar devocional diário:', error);
    return null;
  }
};

/**
 * Função para criar um novo devocional, com suporte para modo offline
 */
export const createDevotional = async (devotional: Partial<Devotional>): Promise<string | null> => {
  try {
    console.log('Iniciando criação do devocional...');
    
    const user = await getCurrentUser();
    
    if (!user) {
      console.error('Usuário não autenticado');
      throw new Error('Você precisa estar logado para criar um devocional');
    }
    
    console.log('Usuário autenticado:', user.id);

    // Verificar se é admin/leader usando o role do próprio user
    if (!user.role || !['admin', 'leader'].includes(user.role)) {
      console.error('Usuário não tem permissão:', user.role);
      throw new Error('Você não tem permissão para criar devocionais');
    }
    
    console.log('Usuário tem permissão:', user.role);

    // Validar campos obrigatórios
    if (!devotional.title || !devotional.scripture) {
      console.error('Campos obrigatórios faltando:', { title: devotional.title, scripture: devotional.scripture });
      throw new Error('Título e versículo são obrigatórios');
    }

    // Mapear os dados para o formato correto da tabela
    // Não incluir o ID, deixar o Supabase gerar automaticamente
    const devotionalData = {
      title: devotional.title.trim(),
      content: (devotional.content || '').trim() || 'Sem conteúdo',
      scripture: devotional.scripture.trim(),
      author_id: user.id,
      date: devotional.date || new Date().toISOString().split('T')[0],
      theme: (devotional.theme || 'reflexão').trim(),
      is_generated: false,
      references: devotional.references || [],
      image_url: devotional.imageSrc || '',
      transmission_link: devotional.transmissionLink || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Dados do devocional mapeados:', devotionalData);

    // Verificar conectividade com o Supabase antes de tentar criar o devocional
    const isSupabaseAvailable = await checkSupabaseConnectivity();
    
    if (!isSupabaseAvailable) {
      console.warn("⚠️ Supabase não está acessível. Salvando devocional localmente.");
      // Salvar devocional pendente no localStorage
      try {
        // Gerar um ID temporário para uso offline apenas
        const offlineId = `offline_${Date.now().toString(36)}${Math.random().toString(36).substring(2)}`;
        
        // Obter devocionais pendentes ou inicializar array vazio
        const pendingDevotionals = JSON.parse(localStorage.getItem('pending_devotionals') || '[]');
        
        // Adicionar novo devocional à lista de pendentes
        pendingDevotionals.push({
          ...devotionalData,
          id: offlineId, // ID temporário apenas para armazenamento local
          author: user.first_name || user.username || user.email,
          authorId: user.id,
          pendingCreation: true,
          pendingTimestamp: Date.now()
        });
        
        // Salvar de volta no localStorage
        localStorage.setItem('pending_devotionals', JSON.stringify(pendingDevotionals));
        
        // Notificar usuário
        toast({
          title: "Devocional salvo localmente",
          description: "O devocional foi salvo no seu dispositivo e será sincronizado quando houver conexão"
        });
        
        return offlineId;
      } catch (localError) {
        console.error('❌ Erro ao salvar devocional localmente:', localError);
        throw new Error('Não foi possível salvar o devocional localmente: ' + (localError.message || 'Erro desconhecido'));
      }
    }

    // Se chegou aqui, temos conectividade, então vamos tentar criar o devocional no servidor
    try {
      // Tentar inserir diretamente na tabela
      console.log('Inserindo devocional na tabela...');
      const { data: insertData, error: insertError } = await supabase
        .from('devotionals')
        .insert(devotionalData)
        .select()
        .single();

      if (insertError) {
        console.error('Erro ao inserir devocional:', insertError);
        
        // Se o erro for de conectividade, salvar localmente
        if (insertError.message && (
            insertError.message.includes('Failed to fetch') ||
            insertError.message.includes('ERR_NAME_NOT_RESOLVED') ||
            insertError.message.includes('NetworkError')
        )) {
          console.warn("⚠️ Erro de conectividade detectado, salvando localmente");
          
          // Gerar um ID temporário para uso offline apenas
          const offlineId = `offline_${Date.now().toString(36)}${Math.random().toString(36).substring(2)}`;
          
          // Salvar devocional pendente no localStorage
          const pendingDevotionals = JSON.parse(localStorage.getItem('pending_devotionals') || '[]');
          pendingDevotionals.push({
            ...devotionalData,
            id: offlineId, // ID temporário apenas para armazenamento local
            author: user.first_name || user.username || user.email,
            authorId: user.id,
            pendingCreation: true,
            pendingTimestamp: Date.now()
          });
          localStorage.setItem('pending_devotionals', JSON.stringify(pendingDevotionals));
          
          toast({
            title: "Devocional salvo localmente",
            description: "O devocional foi salvo no seu dispositivo e será sincronizado quando houver conexão"
          });
          
          return offlineId;
        }
        
        throw new Error('Não foi possível salvar o devocional: ' + insertError.message);
      }

      if (!insertData) {
        throw new Error('Erro interno ao criar devocional');
      }

      console.log('Devocional criado com sucesso:', insertData);
      toast({
        title: "Devocional criado",
        description: "O devocional foi criado com sucesso"
      });

      return insertData.id;
    } catch (dbError) {
      console.error('Erro ao acessar banco de dados:', dbError);
      
      // Se for um erro de rede/conectividade, salvar localmente
      if (dbError?.message && (
          dbError.message.includes('Failed to fetch') ||
          dbError.message.includes('ERR_NAME_NOT_RESOLVED') ||
          dbError.message.includes('NetworkError') ||
          dbError.message.includes('network')
      )) {
        console.warn("⚠️ Problema de conectividade ao salvar no banco, salvando localmente");
        
        // Gerar um ID temporário para uso offline apenas
        const offlineId = `offline_${Date.now().toString(36)}${Math.random().toString(36).substring(2)}`;
        
        // Salvar devocional pendente no localStorage
        const pendingDevotionals = JSON.parse(localStorage.getItem('pending_devotionals') || '[]');
        pendingDevotionals.push({
          ...devotionalData,
          id: offlineId, // ID temporário apenas para armazenamento local
          author: user.first_name || user.username || user.email,
          authorId: user.id,
          pendingCreation: true,
          pendingTimestamp: Date.now()
        });
        localStorage.setItem('pending_devotionals', JSON.stringify(pendingDevotionals));
        
        toast({
          title: "Devocional salvo localmente",
          description: "O devocional foi salvo no seu dispositivo e será sincronizado quando houver conexão"
        });
        
        return offlineId;
      }
      
      throw dbError;
    }
  } catch (error) {
    console.error('Erro ao criar devocional:', error);
    throw error;
  }
};

/**
 * Função para testar a RPC de criação de devocional
 */
export const testCreateDevotionalRPC = async (): Promise<{success: boolean, message: string}> => {
  try {
    // Tenta apenas verificar se a função existe
    const { data, error } = await supabase
      .rpc('rpc_test', {message: 'test'})
      .maybeSingle();
      
    if (error) {
      // Se der erro com essa função genérica, vamos testar outra abordagem
      console.log('Erro ao testar função genérica, tentando verificar diretamente');
      
      // Tentar obter lista de funções disponíveis
      const { data: funcData, error: funcError } = await supabase
        .from('pg_proc')
        .select('proname')
        .eq('proname', 'create_devotional')
        .maybeSingle();
        
      if (funcError) {
        console.error('Não foi possível verificar se a função create_devotional existe:', funcError);
        return {
          success: false,
          message: `Erro ao verificar função RPC: ${funcError.message}`
        };
      }
      
      return {
        success: !!funcData,
        message: funcData 
          ? 'Função create_devotional está disponível no banco de dados'
          : 'Função create_devotional NÃO foi encontrada no banco de dados'
      };
    }
    
    return {
      success: true,
      message: 'Teste de RPC bem-sucedido: as funções RPC estão acessíveis'
    };
  } catch (e) {
    console.error('Erro ao testar RPC:', e);
    return {
      success: false,
      message: `Erro ao testar RPC: ${e.message}`
    };
  }
};

/**
 * Função para diagnosticar a estrutura da tabela devotionals
 */
export const diagnoseDevotionalsTable = async (): Promise<{success: boolean, message: string, structure?: any}> => {
  try {
    console.log('Executando diagnóstico da tabela devotionals...');
    
    const { data, error } = await supabase.rpc('diagnose_devotionals_table');
    
    if (error) {
      console.error('Erro ao executar diagnóstico:', error);
      return {
        success: false,
        message: `Erro ao diagnosticar tabela: ${error.message}`
      };
    }
    
    if (!data) {
      return {
        success: false,
        message: 'Não foi possível obter informações da tabela'
      };
    }
    
    console.log('Estrutura da tabela devotionals:', data);
    
    // Verificar campos obrigatórios
    const requiredFields = ['author', 'title', 'scripture', 'content'];
    const missingFields = [];
    
    if (Array.isArray(data)) {
      const columns = data.map(col => col.column_name);
      requiredFields.forEach(field => {
        if (!columns.includes(field)) {
          missingFields.push(field);
        }
      });
    }
    
    if (missingFields.length > 0) {
      return {
        success: false,
        message: `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
        structure: data
      };
    }
    
    return {
      success: true,
      message: 'Estrutura da tabela OK',
      structure: data
    };
  } catch (e) {
    console.error('Erro ao diagnosticar tabela:', e);
    return {
      success: false,
      message: `Erro ao diagnosticar tabela: ${e.message}`
    };
  }
};

/**
 * Função para testar inserção na tabela devotionals
 */
export const testInsertDevotional = async (): Promise<{success: boolean, message: string}> => {
  try {
    console.log('Executando teste de inserção na tabela devotionals...');
    
    const { data, error } = await supabase.rpc('test_insert_devotional');
    
    if (error) {
      console.error('Erro ao executar teste de inserção:', error);
      return {
        success: false,
        message: `Erro no teste de inserção: ${error.message}`
      };
    }
    
    console.log('Resultado do teste de inserção:', data);
    
    if (typeof data === 'string' && data.startsWith('Sucesso')) {
      return {
        success: true,
        message: data
      };
    }
    
    return {
      success: false,
      message: data || 'Falha no teste de inserção (sem detalhes)'
    };
  } catch (e) {
    console.error('Erro ao testar inserção:', e);
    return {
      success: false,
      message: `Erro ao testar inserção: ${e.message}`
    };
  }
};

/**
 * Sincroniza devocionais pendentes quando o usuário ficar online
 */
export const syncPendingDevotionals = async (): Promise<boolean> => {
  try {
    // Verificar se há conexão
    if (!window.navigator.onLine) {
      console.log("🔄 Tentativa de sincronização de devocionais ignorada: usuário offline");
      return false;
    }
    
    // Verificar se o serviço Supabase está disponível
    const isSupabaseAvailable = await checkSupabaseConnectivity();
    if (!isSupabaseAvailable) {
      console.log("🔄 Serviço Supabase indisponível, adiando sincronização de devocionais");
      return false;
    }
    
    // Verificar se há devocionais pendentes
    const pendingDevotionalsStr = localStorage.getItem('pending_devotionals');
    if (!pendingDevotionalsStr) return false;
    
    const pendingDevotionals = JSON.parse(pendingDevotionalsStr);
    if (pendingDevotionals.length === 0) {
      localStorage.removeItem('pending_devotionals');
      return false;
    }
    
    console.log(`🔄 Sincronizando ${pendingDevotionals.length} devocionais pendentes...`);
    
    let successCount = 0;
    const failedDevotionals = [];
    
    // Processar cada devocional pendente
    for (const devotionalData of pendingDevotionals) {
      try {
        // Remover campos que não fazem parte da tabela
        const { pendingCreation, pendingTimestamp, author, authorId, ...dataToSave } = devotionalData;
        
        // Aplicar no servidor
        const { data, error } = await supabase
          .from('devotionals')
          .insert(dataToSave)
          .select()
          .single();
          
        if (error) {
          console.error(`❌ Falha ao sincronizar devocional ${devotionalData.id}:`, error.message);
          failedDevotionals.push(devotionalData);
          continue;
        }
        
        console.log(`✅ Devocional ${data.id} sincronizado com sucesso`);
        successCount++;
      } catch (error) {
        console.error(`❌ Erro ao sincronizar devocional ${devotionalData.id}:`, error);
        failedDevotionals.push(devotionalData);
      }
    }
    
    // Atualizar lista de pendentes com apenas os que falharam
    if (failedDevotionals.length > 0) {
      localStorage.setItem('pending_devotionals', JSON.stringify(failedDevotionals));
    } else {
      localStorage.removeItem('pending_devotionals');
    }
    
    // Notificar o usuário sobre a sincronização
    if (successCount > 0) {
      toast({
        title: "Devocionais sincronizados",
        description: `${successCount} devocionais foram sincronizados com sucesso`
      });
      
      // Avisar aplicação que dados foram sincronizados
      window.dispatchEvent(new Event('devotionals-sync-completed'));
    }
    
    return successCount > 0;
  } catch (error) {
    console.error('❌ Erro ao sincronizar devocionais:', error);
    return false;
  }
};

// Configurar sincronização automática quando ficar online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🌐 Conexão restaurada, sincronizando devocionais pendentes...');
    syncPendingDevotionals();
  });
}

/**
 * Obtém devocionais pendentes de sincronização
 */
export const getPendingDevotionals = (): Devotional[] => {
  try {
    const pendingDevotionalsStr = localStorage.getItem('pending_devotionals');
    if (!pendingDevotionalsStr) return [];
    
    const pendingDevotionals = JSON.parse(pendingDevotionalsStr);
    return pendingDevotionals;
  } catch (error) {
    console.error('Erro ao buscar devocionais pendentes:', error);
    return [];
  }
};

/**
 * Sincroniza comentários pendentes quando o usuário ficar online
 */
export const syncPendingComments = async (): Promise<boolean> => {
  try {
    // Verificar se há conexão
    if (!window.navigator.onLine) {
      console.log("🔄 Tentativa de sincronização de comentários ignorada: usuário offline");
      return false;
    }
    
    // Verificar se o serviço Supabase está disponível
    const isSupabaseAvailable = await checkSupabaseConnectivity();
    if (!isSupabaseAvailable) {
      console.log("🔄 Serviço Supabase indisponível, adiando sincronização de comentários");
      return false;
    }
    
    // Verificar se há comentários pendentes
    const pendingCommentsStr = localStorage.getItem('pending_comments');
    if (!pendingCommentsStr) return false;
    
    const pendingComments = JSON.parse(pendingCommentsStr);
    if (pendingComments.length === 0) {
      localStorage.removeItem('pending_comments');
      return false;
    }
    
    console.log(`🔄 Sincronizando ${pendingComments.length} comentários pendentes...`);
    
    let successCount = 0;
    const failedComments = [];
    
    // Processar cada comentário pendente
    for (const commentData of pendingComments) {
      try {
        // Remover campos que não fazem parte da tabela
        const { id, pendingCreation, pendingTimestamp, ...dataToSave } = commentData;
        
        // Aplicar no servidor
        const { data, error } = await supabase
          .from('devotional_comments')
          .insert(dataToSave)
          .select()
          .single();
          
        if (error) {
          console.error(`❌ Falha ao sincronizar comentário ${commentData.id}:`, error.message);
          failedComments.push(commentData);
          continue;
        }
        
        console.log(`✅ Comentário ${data.id} sincronizado com sucesso`);
        successCount++;
      } catch (error) {
        console.error(`❌ Erro ao sincronizar comentário ${commentData.id}:`, error);
        failedComments.push(commentData);
      }
    }
    
    // Atualizar lista de pendentes com apenas os que falharam
    if (failedComments.length > 0) {
      localStorage.setItem('pending_comments', JSON.stringify(failedComments));
    } else {
      localStorage.removeItem('pending_comments');
    }
    
    // Notificar o usuário sobre a sincronização
    if (successCount > 0) {
      toast({
        title: "Comentários sincronizados",
        description: `${successCount} comentários foram sincronizados com sucesso`
      });
      
      // Avisar aplicação que dados foram sincronizados
      window.dispatchEvent(new Event('comments-sync-completed'));
    }
    
    return successCount > 0;
  } catch (error) {
    console.error('❌ Erro ao sincronizar comentários:', error);
    return false;
  }
};

/**
 * Obtém comentários pendentes de sincronização
 */
export const getPendingComments = (): DevotionalComment[] => {
  try {
    const pendingCommentsStr = localStorage.getItem('pending_comments');
    if (!pendingCommentsStr) return [];
    
    const pendingComments = JSON.parse(pendingCommentsStr);
    return pendingComments.map(comment => ({
      id: comment.id,
      text: comment.content,
      author: 'Você (pendente)',
      authorId: comment.user_id,
      createdAt: comment.created_at
    }));
  } catch (error) {
    console.error('Erro ao buscar comentários pendentes:', error);
    return [];
  }
}; 