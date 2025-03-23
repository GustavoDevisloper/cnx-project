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
  content: string;
  scripture: string;
  scriptureText?: string;
  author: string;
  authorId?: string;
  date: string;
  dayOfWeek: string;
  imageSrc?: string;
  likes?: number;
  hasLiked?: boolean;
  comments?: DevotionalComment[];
  commentsCount?: number;
  isAIGenerated?: boolean;
  references?: string[];
  transmissionLink?: string;
}

// Interface para comentários
export interface DevotionalComment {
  id: string;
  text: string;
  author: string;
  authorId: string;
  authorAvatar?: string;
  createdAt: string;
}

// Interface para solicitação de devocional
export interface DevotionalRequest {
  theme: string;
  customScripture?: string;
  customTitle?: string;
  targetDate?: Date;
  authorId?: string;
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
        console.log('Nenhum devocional encontrado. Tentando gerar um automaticamente...');
        return await checkAndPublishDailyDevotional();
      }
      
      // A função agora retorna diretamente um objeto JSONB, não um array
      return await enrichDevotionalData(latestData);
    }
    
    if (!data) {
      console.log('Nenhum devocional encontrado para hoje. Tentando gerar um automaticamente...');
      return await checkAndPublishDailyDevotional();
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
      transmissionLink: devotionalData.transmission_link || ''
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
      commentsCount: 0
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
      console.log('Já existe um devocional para hoje:', existingDevotional.id);
      return await enrichDevotionalData(existingDevotional);
    }
    
    // Não há devocional para hoje, vamos tentar gerar um automaticamente
    const theme = "sabedoria"; // Tema padrão
    console.log('Gerando devocional com tema:', theme);
    
    // Tentar gerar um novo devocional
    const generatedDevotional = await generateDevotionalByTheme(theme);
    
    if (!generatedDevotional) {
      console.log('Não foi possível gerar um devocional automático');
      return null;
    }
    
    return generatedDevotional;
  } catch (error) {
    console.error('Erro ao verificar/publicar devocional diário:', error);
    return null;
  }
};

/**
 * Gera um devocional baseado em um tema específico
 */
export const generateDevotionalByTheme = async (
  request: DevotionalRequest | string
): Promise<Devotional | null> => {
  // Permitir passar apenas uma string como parâmetro (para backwards compatibility)
  const themeRequest: DevotionalRequest = typeof request === 'string' 
    ? { theme: request } 
    : request;
  
  try {
    // Validar a entrada
    if (!themeRequest.theme || themeRequest.theme.trim() === "") {
      toast({
        title: "Tema obrigatório",
        description: "Por favor, forneça um tema para gerar o devocional",
        variant: "destructive"
      });
      return null;
    }

    // 1. Buscar versículos relacionados ao tema
    let verses: BibleVerse[];
    let mainScripture: BibleVerse;
    
    if (themeRequest.customScripture) {
      // Se um versículo específico foi fornecido, use-o
      const verse = await getVerseByReference(themeRequest.customScripture);
      if (!verse) {
        toast({
          title: "Versículo não encontrado",
          description: `Não conseguimos encontrar o versículo "${themeRequest.customScripture}"`,
          variant: "destructive"
        });
        return null;
      }
      mainScripture = verse;
      verses = [mainScripture];
    } else {
      // Caso contrário, busque versículos relacionados ao tema
      verses = await searchVersesByTheme(themeRequest.theme);
      
      if (verses.length === 0) {
        toast({
          title: "Nenhum versículo encontrado",
          description: `Não encontramos versículos relacionados ao tema "${themeRequest.theme}"`,
          variant: "destructive"
        });
        return null;
      }
      
      // Seleciona um versículo principal aleatoriamente
      mainScripture = verses[Math.floor(Math.random() * verses.length)];
    }

    // 2. Obter explicação do versículo principal
    const explanation = await getVerseExplanation(mainScripture.reference);
    
    // 3. Criar o conteúdo do devocional
    const title = themeRequest.customTitle || generateTitleFromTheme(themeRequest.theme, mainScripture.reference);
    
    // 4. Determinar a data de publicação
    const targetDate = themeRequest.targetDate || new Date();
    const formattedDate = format(targetDate, 'yyyy-MM-dd');
    const dayOfWeek = DAYS_OF_WEEK[targetDate.getDay()];
    
    // 5. Gerar conteúdo devocional baseado no tema e no versículo
    const content = generateDevotionalContent(themeRequest.theme, mainScripture, explanation);
    
    // 6. Criar o objeto de devocional
    const devotional: Devotional = {
      id: generateUniqueId(),
      title,
      content,
      scripture: mainScripture.reference,
      scriptureText: mainScripture.text,
      author: "Sistema Conexão Jovem",
      authorId: themeRequest.authorId,
      date: formattedDate,
      dayOfWeek,
      isAIGenerated: true,
      references: verses.map(v => v.reference),
      imageSrc: await getThemeImage(themeRequest.theme)
    };
    
    // 7. Salvar no Supabase
    const { error } = await supabase
      .from('devotionals')
      .insert([{
        id: devotional.id,
        title: devotional.title,
        content: devotional.content,
        scripture: devotional.scripture,
        scripture_text: devotional.scriptureText,
        author: devotional.author,
        author_id: themeRequest.authorId,
        date: devotional.date,
        day_of_week: devotional.dayOfWeek,
        is_ai_generated: devotional.isAIGenerated,
        "references": devotional.references,
        image_url: devotional.imageSrc,
        transmission_link: devotional.transmissionLink
      }]);
      
    if (error) {
      console.error("Erro ao salvar devocional:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o devocional no banco de dados",
        variant: "destructive"
      });
      return null;
    }
    
    toast({
      title: "Devocional criado",
      description: `O devocional "${title}" foi criado com sucesso para ${format(targetDate, 'dd/MM/yyyy')}`,
    });
    
    return devotional;
    
  } catch (error) {
    console.error("Erro ao gerar devocional:", error);
    toast({
      title: "Erro ao gerar devocional",
      description: "Ocorreu um erro ao gerar o devocional. Tente novamente.",
      variant: "destructive"
    });
    return null;
  }
};

/**
 * Gera um título criativo baseado no tema e no versículo
 */
const generateTitleFromTheme = (theme: string, reference: string): string => {
  const capitalizedTheme = capitalizeFirstLetter(theme);
  
  const titleTemplates = [
    `${capitalizedTheme}: O Caminho para uma Vida Plena`,
    `Descobrindo o Poder do ${capitalizedTheme} em ${reference}`,
    `${capitalizedTheme}: Uma Perspectiva Bíblica`,
    `Vivendo ${capitalizedTheme} no Dia a Dia`,
    `A Importância do ${capitalizedTheme} na Vida Cristã`,
    `${capitalizedTheme}: Princípios para o Crescimento Espiritual`,
    `Transformados pelo ${capitalizedTheme}`,
    `${reference} e a Verdade sobre ${capitalizedTheme}`,
    `O Segredo do ${capitalizedTheme} Revelado em ${reference}`,
    `${capitalizedTheme}: Da Teoria à Prática`
  ];
  
  return titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
};

/**
 * Capitaliza a primeira letra de uma string
 */
const capitalizeFirstLetter = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

/**
 * Gera uma imagem relacionada ao tema
 */
const getThemeImage = async (theme: string): Promise<string> => {
  // Implementação básica - em produção, você poderia integrar com APIs como Unsplash, Pexels, etc.
  const defaultImages = [
    "/images/devotional/faith.jpg",
    "/images/devotional/hope.jpg",
    "/images/devotional/love.jpg",
    "/images/devotional/prayer.jpg",
    "/images/devotional/bible.jpg",
  ];
  
  return defaultImages[Math.floor(Math.random() * defaultImages.length)];
};

/**
 * Gera conteúdo para o devocional baseado no tema e no versículo
 */
const generateDevotionalContent = (
  theme: string,
  scripture: BibleVerse,
  explanation?: VerseExplanation
): string => {
  const intro = `Hoje vamos refletir sobre ${theme}, um tema importante para nossa caminhada cristã. A Bíblia nos fala sobre isso em ${scripture.reference}.`;
  
  const scriptureQuote = `"${scripture.text}" (${scripture.reference}, ${bibleVersions[scripture.version]})`;
  
  let explanationText = "";
  if (explanation) {
    explanationText = `\n\nEste versículo nos ensina que: ${explanation.explanation}`;
  }
  
  const application = `\n\nComo podemos aplicar isso em nossa vida hoje? ${theme} deve ser mais do que um conceito abstrato. Precisamos viver isso diariamente em nossas decisões e relacionamentos.`;
  
  const conclusion = `\n\nQue o Espírito Santo nos ajude a entender profundamente o significado de ${theme} e a aplicá-lo em nossa vida. Que sejamos transformados pela Palavra de Deus e que possamos ser luz para aqueles ao nosso redor.`;
  
  const prayer = `\n\nOração: Senhor Deus, obrigado pela Tua Palavra que nos orienta e transforma. Ajuda-nos a viver ${theme} em nossa vida diária. Que possamos ser testemunhas vivas do Teu amor e da Tua verdade. Em nome de Jesus, amém.`;
  
  return `${intro}\n\n${scriptureQuote}${explanationText}${application}${conclusion}${prayer}`;
};

// Função para criar um novo devocional, atualizando a chamada correta ao insert_devotional
export const createDevotional = async (devotional: Partial<Devotional>): Promise<string | null> => {
  try {
    // Obter o ID do usuário atual
    const { data: sessionData } = await supabase.auth.getSession();
    const authorId = sessionData?.session?.user?.id;
    
    if (!authorId) {
      console.error('Usuário não autenticado');
      return null;
    }
    
    // Preparar os dados para inserção usando apenas as colunas existentes
    const { data, error } = await supabase.rpc('insert_devotional', {
      p_title: devotional.title || 'Devocional sem título',
      p_content: devotional.content || '',
      p_scripture: devotional.scripture || '',
      p_scripture_text: devotional.scriptureText || '',
      p_author_id: authorId,
      p_date: devotional.date || new Date().toISOString().split('T')[0],
      p_day_of_week: devotional.dayOfWeek || getCurrentDayOfWeek(),
      p_image_url: devotional.imageSrc || '',
      p_is_ai_generated: devotional.isAIGenerated || false
    });
    
    if (error) {
      console.error('Erro ao salvar devocional:', error);
      return null;
    }
    
    // A função deve retornar o UUID do novo devocional
    return data;
  } catch (error) {
    console.error('Erro ao criar devocional:', error);
    return null;
  }
};

// Atualizar a função para salvar devocionais gerados automaticamente 
const saveGeneratedDevotional = async (devotional: Devotional): Promise<string | null> => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const authorId = sessionData?.session?.user?.id || '00000000-0000-0000-0000-000000000000'; // ID anônimo se não houver usuário
    
    // Preparar os dados para inserção usando apenas as colunas existentes
    const devotionalData = {
      title: devotional.title,
      content: devotional.content,
      scripture: devotional.scripture,
      scriptureText: devotional.scriptureText || '',
      date: devotional.date || new Date().toISOString().split('T')[0],
      dayOfWeek: devotional.dayOfWeek || getCurrentDayOfWeek(),
      imageSrc: devotional.imageSrc || '',
      isAIGenerated: true,
      authorId
    };
    
    // Usar a versão atualizada da função para criar devotional
    const id = await createDevotional(devotionalData);
    
    if (!id) {
      throw new Error('Falha ao salvar o devocional gerado');
    }
    
    return id;
  } catch (error) {
    console.error('Erro ao salvar devocional:', error);
    return null;
  }
}; 