import { getScriptureByTheme, generateThemeMessage } from './bibleService';
import { supabase } from '@/lib/supabase';
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
      
      // Tentar buscar o mais recente como fallback
      console.log('Tentando buscar o devocional mais recente...');
      const { data: latestData, error: latestError } = await supabase
        .rpc('get_latest_devotional');
      
      if (latestError) {
        console.error('Erro ao buscar devocional mais recente:', latestError);
        return null;
      }
      
      if (!latestData) {
        console.log('Nenhum devocional encontrado.');
        return null;
      }
      
      // A função agora retorna diretamente um objeto JSONB, não um array
      return await enrichDevotionalData(latestData);
    }
    
    if (!data) {
      console.log('Nenhum devocional encontrado para hoje.');
      return null;
    }
    
    // A função agora retorna diretamente um objeto JSONB, não um array
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
    const user = await getCurrentUser();
    
    if (!user) {
      toast({
        title: "Não autenticado",
        description: "Você precisa estar logado para comentar",
        variant: "destructive"
      });
      return null;
    }
    
    const { data, error } = await supabase
      .from('devotional_comments')
      .insert({
        devotional_id: devotionalId,
        user_id: user.id,
        content: text
      })
      .select(`
        id,
        content,
        created_at,
        user_id,
        users:user_id (
          username,
          first_name,
          avatar_url
        )
      `)
      .single();
      
    if (error) {
      console.error("Erro ao adicionar comentário:", error);
      toast({
        title: "Erro ao comentar",
        description: "Não foi possível adicionar seu comentário",
        variant: "destructive"
      });
      return null;
    }
    
    toast({
      title: "Comentário adicionado",
      description: "Seu comentário foi adicionado com sucesso"
    });
          
          return {
      id: data.id,
      text: data.content,
      author: data.users?.first_name || data.users?.username || 'Usuário',
      authorId: data.user_id,
      authorAvatar: data.users?.avatar_url,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error("Erro ao adicionar comentário:", error);
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
    
    // Verificar se já existe um devocional para hoje
    const { data: existingDevotional } = await supabase
      .from('devotionals')
      .select('*')
      .eq('date', today)
      .single();
    
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
 * Função para criar um novo devocional, com formato simplificado
 */
export const createDevotional = async (devotional: Partial<Devotional>): Promise<string | null> => {
  try {
    // Verificar autenticação tanto pelo Supabase quanto pelo localStorage
    let authorId = null;
    
    // Primeiro, tenta obter da sessão do Supabase
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user?.id) {
      authorId = sessionData.session.user.id;
      console.log('ID do usuário obtido da sessão Supabase:', authorId);
    } 
    // Se não conseguiu, tenta obter do localStorage
    else {
      authorId = localStorage.getItem('current_user_id');
      console.log('ID do usuário obtido do localStorage:', authorId);
    }
    
    if (!authorId) {
      console.error('Usuário não autenticado');
      toast({
        title: "Acesso negado",
        description: "Você precisa estar autenticado para criar um devocional",
        variant: "destructive"
      });
      return null;
    }
    
    // Verificar permissões (apenas administradores podem criar)
    // Primeiro, tente buscar do localStorage
    let isUserAuthorized = false;
    const userStr = localStorage.getItem('current_user');
    
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        if (userData.role === 'admin' || userData.role === 'leader') {
          console.log('Permissões verificadas via localStorage:', userData.role);
          isUserAuthorized = true;
        }
      } catch (e) {
        console.error('Erro ao ler usuário do localStorage:', e);
      }
    }
    
    // Se não conseguiu verificar pelo localStorage, tenta o banco de dados
    if (!isUserAuthorized) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', authorId)
        .single();
        
      if (userError) {
        console.error('Erro ao verificar permissões:', userError);
      } else if (userData && (userData.role === 'admin' || userData.role === 'leader')) {
        console.log('Permissões verificadas via banco de dados:', userData.role);
        isUserAuthorized = true;
      }
    }
    
    if (!isUserAuthorized) {
      console.error('Usuário não tem permissão para criar devocionais');
      toast({
        title: "Permissão negada",
        description: "Apenas administradores podem criar devocionais",
        variant: "destructive"
      });
      return null;
    }
    
    // Validar campos obrigatórios
    if (!devotional.title || !devotional.scripture) {
      toast({
        title: "Campos incompletos",
        description: "Título e versículo são obrigatórios",
        variant: "destructive"
      });
      return null;
    }
    
    // Mapear os dados para o formato correto da tabela
    const devotionalData = {
      title: devotional.title,
      content: devotional.content || '',  // Conteúdo é opcional
      verse: devotional.scripture,
      verse_text: devotional.scriptureText || '', // Texto do versículo
      theme: devotional.theme || 'reflexão',
      author_id: authorId,
      author: 'Autor Manual',  // Valor padrão para garantir que o campo NOT NULL seja preenchido
      date: devotional.date || new Date().toISOString().split('T')[0],
      is_generated: false,  // Nunca será gerado automaticamente
      "references": devotional.references || [],
      image_url: devotional.imageSrc || '',
      transmission_link: devotional.transmissionLink || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log("Criando devocional:", devotionalData);
    
    let devotionalId = null;
    
    // Usar diretamente o método RPC para evitar problemas com RLS
    console.log('Criando devocional via RPC...');
    
    // Tratar problema de timeout ou resposta vazia
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('create_devotional', {
        devotional_data: devotionalData
      });
      
      // Log adicional para depurar resultado completo da chamada RPC
      console.log('Resposta completa da RPC:', { rpcResult, rpcError, status: rpcError ? 'erro' : rpcResult ? 'sucesso' : 'indefinido' });
      
      if (rpcError) {
        console.error('Erro ao criar devocional via RPC:', rpcError);
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar o devocional. Tente novamente mais tarde.",
          variant: "destructive"
        });
        return null;
      } 
      
      // Verificar se o resultado está vindo como null ou undefined
      if (rpcResult === null || rpcResult === undefined) {
        console.error('Função RPC retornou valor nulo ou indefinido. Verifique a implementação da função no banco de dados.');
        
        // Log mais detalhado para depuração
        console.log('Detalhes da sessão:', await supabase.auth.getSession());
        console.log('Detalhes do usuário:', await getCurrentUser());
        
        toast({
          title: "Erro ao salvar",
          description: "A função do banco de dados não retornou um ID válido. Contate o administrador.",
          variant: "destructive"
        });
        return null;
      }
      
      if (rpcResult) {
        devotionalId = rpcResult;
        console.log('Devocional criado com sucesso via RPC:', devotionalId);
        
        toast({
          title: "Devocional criado",
          description: "O devocional foi criado com sucesso",
        });
        
        return devotionalId;
      }
    } catch (rpcCallError) {
      console.error('Erro ao chamar a função RPC:', rpcCallError);
      toast({
        title: "Erro de comunicação",
        description: "Problema ao comunicar com o banco de dados: " + rpcCallError.message,
        variant: "destructive"
      });
      return null;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao criar devocional:', error);
    toast({
      title: "Erro inesperado",
      description: "Ocorreu um erro ao criar o devocional. Tente novamente mais tarde.",
      variant: "destructive"
    });
    return null;
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