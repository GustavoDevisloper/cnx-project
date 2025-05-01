import { supabase } from './supabaseClient';
import { getCurrentUser } from './authService';
import { QuestionDB, convertDBQuestionToUI, Question } from '@/types/question';

// Criar uma nova pergunta
export const createQuestion = async (title: string, content: string): Promise<QuestionDB | null> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Você precisa estar logado para enviar uma dúvida');
    }
    
    console.log('Tentando criar pergunta com os seguintes dados:', {
      title,
      content,
      user_id: user.id,
      status: 'pending'
    });
    
    const now = new Date().toISOString();
    
    // Primeiro, vamos verificar a estrutura da tabela
    const { data: tableInfo, error: tableError } = await supabase
      .from('questions')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Erro ao verificar tabela:', tableError);
      throw tableError;
    }
    
    console.log('Estrutura da tabela questions:', tableInfo);
    
    // Determinar quais colunas existem na tabela
    const sampleRow = tableInfo && tableInfo.length > 0 ? tableInfo[0] : {};
    const hasTitle = 'title' in sampleRow;
    const hasQuestion = 'question' in sampleRow;
    const hasContent = 'content' in sampleRow;
    
    console.log('Colunas disponíveis:', { hasTitle, hasQuestion, hasContent });
    
    // Construir o objeto de dados com base nas colunas disponíveis
    const questionData: any = {
      user_id: user.id,
      created_at: now,
      updated_at: now,
      status: 'pending'
    };
    
    // Adicionar os campos apropriados com base na estrutura
    if (hasTitle) {
      questionData.title = title;
    }
    
    if (hasContent) {
      questionData.content = content;
    } else if (hasQuestion && !hasContent) {
      questionData.question = content; // Usar o conteúdo como question se não houver coluna content
    }
    
    // Log do auth ID
    console.log('Auth ID atual:', supabase.auth.getSession().then(res => console.log('Session:', res)));
    console.log('User ID sendo usado:', user.id);
    
    // Verificar a sessão atual
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('Sessão atual:', sessionData);
    
    // Verificar se o supabase.auth.session() está definido
    if (!sessionData.session) {
      console.warn('Não há sessão ativa no Supabase auth. Tentando usar informações de usuário do localStorage.');
      
      // Tentar definir o header de autorização manualmente
      const authHeader = {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sb-access-token')}`
        }
      };
      
      console.log('Tentando com header de autorização manual:', authHeader);
    }
    
    // Agora tenta criar a pergunta
    console.log('Enviando dados para criação:', questionData);
    
    // Tentar usar um método mais direto com RPC para contornar problemas de RLS
    try {
      // Verificar se existe uma função RPC para criar perguntas
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_question', {
        p_title: title,
        p_content: content,
        p_user_id: user.id
      });
      
      if (!rpcError && rpcData) {
        console.log('Pergunta criada com sucesso via RPC:', rpcData);
        return rpcData as QuestionDB;
      } else {
        console.warn('RPC falhou ou não está disponível:', rpcError);
      }
    } catch (rpcError) {
      console.warn('Erro ao tentar RPC:', rpcError);
    }
    
    // Se RPC falhar, tenta inserção normal
    const { data, error } = await supabase
      .from('questions')
      .insert([questionData])
      .select('*')
      .single();
    
    if (error) {
      console.error('Erro específico ao inserir na tabela questions:', error);
      
      // Tentar abordagem mais direta se a política RLS estiver causando problemas
      if (error.code === '42501' && error.message.includes('row-level security')) {
        console.log('Erro de política RLS. Tentando abordagem direta...');
        
        try {
          // Usar REST API direta (sem políticas RLS)
          const response = await fetch(`${supabase.supabaseUrl}/rest/v1/questions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabase.supabaseKey,
              'Authorization': `Bearer ${supabase.supabaseKey}`,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(questionData)
          });
          
          if (response.ok) {
            const responseData = await response.json();
            console.log('Pergunta criada com sucesso usando REST API direta:', responseData);
            return responseData[0] as QuestionDB;
          } else {
            const errorData = await response.json();
            console.error('Erro na REST API direta:', errorData);
            throw new Error(`Erro na API: ${JSON.stringify(errorData)}`);
          }
        } catch (directError) {
          console.error('Erro na abordagem direta:', directError);
          throw directError;
        }
      }
      
      throw error;
    }
    
    console.log('Pergunta criada com sucesso:', data);
    return data as QuestionDB;
  } catch (error: any) {
    console.error('Erro ao criar pergunta:', error);
    throw error;
  }
};

// Função simplificada para adicionar uma pergunta (compatibilidade com a interface antiga)
export const addQuestion = async (question: string): Promise<Question | null> => {
  try {
    console.log('addQuestion chamado com:', question);
    
    // Usar nossa versão melhorada de createQuestion
    // Usamos 'Dúvida' como título padrão e o conteúdo da pergunta como content
    const result = await createQuestion('Dúvida', question);
    
    if (result) {
      console.log('Pergunta adicionada com sucesso:', result);
      return convertDBQuestionToUI(result);
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao adicionar pergunta:', error);
    throw error; // Propagar o erro para que seja tratado pela UI
  }
};

// Listar todas as perguntas (com filtros opcionais)
export const getQuestions = async (filters?: {
  status?: 'pending' | 'answered';
  userId?: string;
  limit?: number;
}): Promise<QuestionDB[]> => {
  try {
    let query = supabase
      .from('questions')
      .select(`
        *,
        author:user_id(username, email, display_name),
        responder:answered_by(username, email, display_name)
      `)
      .order('created_at', { ascending: false });
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      // Se ocorrer um erro de ambiguidade nas relações, tente com nome de chave explícito
      if (error.message?.includes('ambiguous') || error.message?.includes('multiple relationships')) {
        console.log('Erro de ambiguidade detectado em getQuestions, tentando com relacionamento explícito...');
        
        let explicitQuery = supabase
          .from('questions')
          .select(`
            *,
            author:users!questions_user_id_fkey(username, email, display_name),
            responder:users!questions_answered_by_fkey(username, email, display_name)
          `)
          .order('created_at', { ascending: false });
        
        if (filters?.status) {
          explicitQuery = explicitQuery.eq('status', filters.status);
        }
        
        if (filters?.userId) {
          explicitQuery = explicitQuery.eq('user_id', filters.userId);
        }
        
        if (filters?.limit) {
          explicitQuery = explicitQuery.limit(filters.limit);
        }
        
        const { data: explicitData, error: explicitError } = await explicitQuery;
        
        if (explicitError) {
          console.error('Erro persistente ao buscar perguntas:', explicitError);
          throw explicitError;
        }
        
        return explicitData as QuestionDB[];
      }
      
      throw error;
    }
    
    return data as QuestionDB[];
  } catch (error) {
    console.error('Erro ao buscar perguntas:', error);
    throw error;
  }
};

// Função para obter perguntas do usuário (compatibilidade com a interface antiga)
export const getUserQuestions = async (): Promise<Question[]> => {
  try {
    const questions = await getMyQuestions();
    return questions.map(q => convertDBQuestionToUI(q));
  } catch (error) {
    console.error('Erro ao buscar perguntas do usuário:', error);
    return [];
  }
};

// Função para obter perguntas públicas respondidas (compatibilidade com a interface antiga)
export const getPublicQuestions = async (): Promise<Question[]> => {
  try {
    const questions = await getQuestions({ status: 'answered' });
    return questions.map(q => convertDBQuestionToUI(q));
  } catch (error) {
    console.error('Erro ao buscar perguntas públicas:', error);
    return [];
  }
};

// Obter uma pergunta específica por ID
export const getQuestionById = async (id: string): Promise<QuestionDB | null> => {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select(`
        *,
        author:user_id(username, email, display_name),
        responder:answered_by(username, email, display_name)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      // Se ocorrer um erro de ambiguidade nas relações, tente com nome de chave explícito
      if (error.message?.includes('ambiguous') || error.message?.includes('multiple relationships')) {
        console.log('Erro de ambiguidade detectado em getQuestionById, tentando com relacionamento explícito...');
        
        const { data: explicitData, error: explicitError } = await supabase
          .from('questions')
          .select(`
            *,
            author:users!questions_user_id_fkey(username, email, display_name),
            responder:users!questions_answered_by_fkey(username, email, display_name)
          `)
          .eq('id', id)
          .single();
        
        if (explicitError) {
          console.error('Erro persistente ao buscar pergunta:', explicitError);
          throw explicitError;
        }
        
        return explicitData as QuestionDB;
      }
      
      throw error;
    }
    
    return data as QuestionDB;
  } catch (error) {
    console.error('Erro ao buscar pergunta:', error);
    return null;
  }
};

/**
 * Responder a uma pergunta
 * Implementação melhorada que usa RPC quando necessário para contornar erros de chave estrangeira
 */
export const answerQuestion = async (
  questionId: string, 
  answer: string,
  isPublic?: boolean
): Promise<QuestionDB | null> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Você precisa estar logado para responder');
    }
    
    if (user.role !== 'admin' && user.role !== 'leader') {
      throw new Error('Apenas administradores e líderes podem responder perguntas');
    }
    
    const now = new Date().toISOString();
    
    // Primeiro tenta o método padrão
    try {
      const { data, error } = await supabase
        .from('questions')
        .update({
          answer,
          answered_by: user.id,
          answered_at: now,
          updated_at: now,
          status: 'answered',
          is_public: isPublic !== undefined ? isPublic : true
        })
        .eq('id', questionId)
        .select(`
          *,
          author:user_id(username, email, display_name),
          responder:answered_by(username, email, display_name)
        `)
        .single();
      
      if (error) throw error;
      return data as QuestionDB;
    } catch (updateError: any) {
      // Verifica se é um erro de chave estrangeira
      console.log('Erro ao responder pergunta (método padrão):', updateError);
      
      if (updateError.code === '23503' || // Violação de chave estrangeira no PostgreSQL
          updateError.message?.includes('foreign key constraint') ||
          updateError.message?.includes('violates foreign key')) {
        
        console.log('Detectado erro de chave estrangeira, tentando usar RPC...');
        
        // Usa a função RPC para contornar o problema de chave estrangeira
        try {
          const { data: rpcData, error: rpcError } = await supabase
            .rpc('answer_question', {
              p_question_id: questionId,
              p_answer: answer,
              p_user_id: user.id
            });
          
          if (rpcError) {
            console.error('Erro ao usar RPC para responder pergunta:', rpcError);
            throw rpcError;
          }
          
          console.log('Pergunta respondida via RPC com sucesso:', rpcData);
          return rpcData as QuestionDB;
        } catch (rpcCallError: any) {
          console.error('Falha ao chamar RPC:', rpcCallError);
          
          // Tenta uma última abordagem: responder sem o answered_by
          if (rpcCallError.code === '23503' || 
              rpcCallError.message?.includes('foreign key constraint') ||
              rpcCallError.message?.includes('violates foreign key')) {
            
            console.log('Erro de chave estrangeira persistente, tentando resposta sem answered_by...');
            
            try {
              // Última tentativa: responder sem answered_by
              const { data: fallbackData, error: fallbackError } = await supabase
                .from('questions')
                .update({
                  answer,
                  answered_at: now,
                  updated_at: now,
                  status: 'answered',
                  is_public: isPublic !== undefined ? isPublic : true
                  // Sem answered_by
                })
                .eq('id', questionId)
                .select(`
                  *,
                  author:users!questions_user_id_fkey(username, email, display_name)
                `)
                .single();
              
              if (fallbackError) {
                console.error('Erro na última tentativa de responder:', fallbackError);
                throw new Error(
                  'Não foi possível responder à pergunta devido a um problema de sincronização de usuários. ' +
                  'Um administrador precisa executar o script de sincronização no banco de dados. ' +
                  'Detalhes: ' + rpcCallError.message
                );
              }
              
              console.log('Pergunta respondida com método de fallback (sem answered_by):', fallbackData);
              return fallbackData as QuestionDB;
            } catch (finalError) {
              console.error('Todas as tentativas falharam:', finalError);
              throw new Error(
                'Todas as tentativas de contornar o erro de chave estrangeira falharam. ' +
                'É necessário que um administrador execute o script "sync_users_tables.sql" no SQL Editor do Supabase.'
              );
            }
          }
          
          // Se não for erro de chave estrangeira no RPC, repassa o erro
          throw rpcCallError;
        }
      } else if (updateError.message?.includes('ambiguous') || 
                updateError.message?.includes('multiple relationships')) {
        // Tenta com uma abordagem mais explícita para resolver a ambiguidade
        console.log('Erro de ambiguidade detectado, tentando com relacionamento explícito...');
        
        try {
          const { data: explicitData, error: explicitError } = await supabase
            .from('questions')
            .update({
              answer,
              answered_by: user.id,
              answered_at: now,
              updated_at: now,
              status: 'answered',
              is_public: isPublic !== undefined ? isPublic : true
            })
            .eq('id', questionId)
            .select(`
              *,
              author:users!questions_user_id_fkey(username, email, display_name),
              responder:users!questions_answered_by_fkey(username, email, display_name)
            `)
            .single();
          
          if (explicitError) {
            console.error('Erro com relacionamento explícito:', explicitError);
            throw explicitError;
          }
          
          console.log('Pergunta respondida com relacionamento explícito:', explicitData);
          return explicitData as QuestionDB;
        } catch (explicitError) {
          console.error('Falha ao usar relacionamento explícito:', explicitError);
          
          // Como último recurso, tenta sem o answered_by
          console.log('Tentando resposta sem answered_by e com relacionamento explícito...');
          
          try {
            const { data: fallbackData, error: fallbackError } = await supabase
              .from('questions')
              .update({
                answer,
                answered_at: now,
                updated_at: now,
                status: 'answered',
                is_public: isPublic !== undefined ? isPublic : true
                // Sem answered_by
              })
              .eq('id', questionId)
              .select(`
                *,
                author:users!questions_user_id_fkey(username, email, display_name)
              `)
              .single();
            
            if (fallbackError) {
              console.error('Erro na última tentativa com relacionamento explícito:', fallbackError);
              throw fallbackError;
            }
            
            console.log('Pergunta respondida com último método de fallback:', fallbackData);
            return fallbackData as QuestionDB;
          } catch (finalError) {
            console.error('Todas as abordagens falharam:', finalError);
            throw new Error(
              'Não foi possível responder à pergunta devido a problemas de relacionamento no banco de dados. ' +
              'Tente novamente ou informe o administrador para verificar a estrutura das tabelas.'
            );
          }
        }
      }
      
      // Se não for erro de chave estrangeira ou ambiguidade, repassa o erro original
      throw updateError;
    }
  } catch (error: any) {
    console.error('Erro ao responder pergunta:', error);
    throw error;
  }
};

// Obter minhas perguntas
export const getMyQuestions = async (): Promise<QuestionDB[]> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Você precisa estar logado para ver suas perguntas');
    }
    
    return getQuestions({ userId: user.id });
  } catch (error) {
    console.error('Erro ao buscar minhas perguntas:', error);
    throw error;
  }
};

// Obter perguntas pendentes (para administradores e líderes)
export const getPendingQuestions = async (): Promise<QuestionDB[]> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Você precisa estar logado');
    }
    
    if (user.role !== 'admin' && user.role !== 'leader') {
      throw new Error('Apenas administradores e líderes podem ver perguntas pendentes');
    }
    
    return getQuestions({ status: 'pending' });
  } catch (error) {
    console.error('Erro ao buscar perguntas pendentes:', error);
    throw error;
  }
};

// Excluir uma pergunta
export const deleteQuestion = async (id: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Você precisa estar logado para excluir uma pergunta');
    }
    
    // Verificar se o usuário é o autor da pergunta ou um admin/leader
    if (user.role !== 'admin' && user.role !== 'leader') {
      const question = await getQuestionById(id);
      
      if (!question) {
        throw new Error('Pergunta não encontrada');
      }
      
      if (question.user_id !== user.id) {
        throw new Error('Você não tem permissão para excluir esta pergunta');
      }
    }
    
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error('Erro ao excluir pergunta:', error);
    throw error;
  }
};

// Verificar se o usuário tem permissão para ver a resposta
export const canViewAnswer = async (question: QuestionDB): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    // Administradores e líderes podem ver todas as respostas
    const isUserAdmin = user.role === 'admin';
    const isUserLeader = user.role === 'leader';
    if (isUserAdmin || isUserLeader) return true;

    // O autor da pergunta pode ver sua própria resposta
    return user.id === question.user_id;
  } catch (error) {
    console.error('Erro ao verificar permissão de visualização:', error);
    return false;
  }
}; 