export interface Question {
  id: string;
  question: string;
  userId: string;
  username: string;  // Apenas líderes podem ver
  answer?: string;
  answeredBy?: string;
  answeredByName?: string;
  createdAt: string;
  answered: boolean;
  isPublic: boolean;
}

// Interface compatível com o questionService
export interface QuestionDB {
  id: string;
  // Possíveis variações do nome da coluna de título
  title?: string;
  question?: string;
  // Possíveis variações do nome da coluna de conteúdo
  content?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'answered';
  answer?: string;
  answered_by?: string;
  answered_at?: string;
  author?: {
    username: string;
    email: string;
    display_name?: string;
  };
  // Adicionar outros campos possíveis que possam existir no banco
  is_public?: boolean;
}

// Função para converter QuestionDB para Question
export const convertDBQuestionToUI = (dbQuestion: QuestionDB): Question => {
  return {
    id: dbQuestion.id,
    // Use qualquer um dos campos de título/conteúdo disponíveis
    question: dbQuestion.content || dbQuestion.question || dbQuestion.title || '',
    userId: dbQuestion.user_id,
    username: dbQuestion.author?.username || 'Usuário',
    answer: dbQuestion.answer,
    answeredBy: dbQuestion.answered_by,
    answeredByName: dbQuestion.author?.display_name || dbQuestion.author?.username || 'Líder',
    createdAt: dbQuestion.created_at,
    answered: dbQuestion.status === 'answered',
    isPublic: dbQuestion.is_public !== undefined ? dbQuestion.is_public : true // Por padrão, todas as perguntas são públicas no novo sistema
  };
}; 