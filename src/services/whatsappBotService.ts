import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { User } from '@/types/user';
import { logger } from '@/lib/utils';

interface WhatsAppMessageConfig {
  phoneNumber: string;
  message: string;
}

interface WhatsAppBotConfig {
  apiKey: string;
  apiSecret: string;
  fromNumber: string;
}

/**
 * Configuração padrão para o caso de não conseguir carregar do banco
 */
const DEFAULT_BOT_CONFIG: WhatsAppBotConfig = {
  apiKey: "demo_key",
  apiSecret: "demo_secret",
  fromNumber: "5511999999999"
};

/**
 * Configuração do serviço de WhatsApp
 * Esta configuração deve ser carregada do Supabase para manter os dados sensíveis seguros
 */
let botConfig: WhatsAppBotConfig | null = null;

/**
 * Carrega a configuração do WhatsApp do banco de dados
 */
export const loadWhatsAppBotConfig = async (): Promise<WhatsAppBotConfig> => {
  try {
    // Se já temos a configuração em cache, retornamos ela
    if (botConfig) {
      return botConfig;
    }

    // Tenta acessar diretamente a tabela app_config
    try {
      const { data, error } = await supabase
        .from('app_config')
        .select('*')
        .eq('key', 'whatsapp_bot_config')
        .maybeSingle();

      if (!error && data && data.value) {
        botConfig = data.value as WhatsAppBotConfig;
        return botConfig;
      }
    } catch (tableError) {
      logger.warn('Erro ao acessar app_config:', tableError);
    }

    // Se não encontrou configuração, usa a padrão
    logger.warn('Configuração do WhatsApp não encontrada. Usando configuração padrão');
    botConfig = DEFAULT_BOT_CONFIG;
    return botConfig;
    
  } catch (error) {
    logger.error('Erro ao carregar configuração do WhatsApp:', error);
    logger.warn('Usando configuração padrão do WhatsApp');
    botConfig = DEFAULT_BOT_CONFIG;
    return botConfig;
  }
};

/**
 * Formata o número de telefone para o formato internacional
 * @param phoneNumber Número de telefone para formatar
 * @returns Número formatado para padrão internacional (ex: 5511999999999)
 */
export const formatPhoneNumber = (phoneNumber?: string): string | null => {
  if (!phoneNumber) return null;
  
  try {
    // Remove todos os caracteres não numéricos
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Se estiver vazio após limpeza, retorna null
    if (!cleaned || cleaned.length < 8) {
      logger.warn('Número de telefone inválido (muito curto):', phoneNumber);
      return null;
    }
    
    // Se já começa com 55 (Brasil) e tem pelo menos 12 dígitos (55 + DDD + número)
    if (cleaned.startsWith('55') && cleaned.length >= 12) {
      logger.log('Número já em formato internacional:', cleaned);
      return cleaned;
    }
    
    // Se começa com 0, remove o zero
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // Se tem 8-9 dígitos, assume que é um número sem DDD e não pode ser usado
    if (cleaned.length < 10) {
      logger.warn('Número sem DDD detectado:', phoneNumber);
      return null;
    }
    
    // Adiciona o código do país Brasil (55) se não tiver
    return cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
  } catch (error) {
    logger.error('Erro ao formatar número de telefone:', phoneNumber, error);
    return null;
  }
};

/**
 * Função de demonstração para quando estiver em modo de desenvolvimento
 * Simula o envio de mensagem sem realmente chamar a API externa
 */
const sendDemoMessage = async (config: WhatsAppMessageConfig): Promise<boolean> => {
  logger.log('🔵 [DEMO] Enviando mensagem via WhatsApp:');
  logger.log('📱 Para:', config.phoneNumber);
  logger.log('💬 Mensagem:', config.message);
  
  // Simula um pequeno atraso como se estivesse realmente enviando
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simula uma chance de falha de 10% para demonstrar tratamento de erros
  if (Math.random() < 0.1) {
    logger.error('❌ [DEMO] Falha simulada no envio da mensagem');
    return false;
  }
  
  logger.log('✅ [DEMO] Mensagem enviada com sucesso');
  return true;
};

/**
 * Envia uma mensagem para o WhatsApp usando a API da Vonage
 */
export const sendWhatsAppMessage = async (config: WhatsAppMessageConfig): Promise<boolean> => {
  try {
    // Carrega a configuração se ainda não foi carregada
    if (!botConfig) {
      botConfig = await loadWhatsAppBotConfig();
    }

    // Formata o número de telefone
    const formattedPhone = formatPhoneNumber(config.phoneNumber);
    if (!formattedPhone) {
      throw new Error('Número de telefone inválido');
    }

    // Verificar se estamos em modo de demonstração
    if (
      botConfig.apiKey === "demo_key" || 
      botConfig.apiSecret === "demo_secret" || 
      import.meta.env.DEV
    ) {
      return sendDemoMessage(config);
    }

    // Mensagem direta
    const messagePayload = {
      from: botConfig.fromNumber,
      to: formattedPhone,
      message_type: "text",
      text: config.message,
      channel: "whatsapp"
    };

    // Envia a mensagem para a API da Vonage
    const response = await fetch('https://messages-sandbox.nexmo.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${btoa(`${botConfig.apiKey}:${botConfig.apiSecret}`)}`
      },
      body: JSON.stringify(messagePayload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro ao enviar mensagem: ${JSON.stringify(errorData)}`);
    }

    logger.log('Mensagem enviada com sucesso para', formattedPhone);
    return true;
  } catch (error) {
    logger.error('Erro ao enviar mensagem via WhatsApp:', error);
    toast({
      title: 'Erro ao enviar mensagem via WhatsApp',
      description: error instanceof Error ? error.message : 'Ocorreu um erro ao enviar a mensagem',
      variant: 'destructive'
    });
    return false;
  }
};

/**
 * Obtém um link de WhatsApp para conversa direta com um número
 */
export const getWhatsAppLink = (phoneNumber?: string, message: string = ''): string | null => {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  if (!formattedPhone) return null;
  
  // Se não houver mensagem, retorna apenas o link para o número
  if (!message) {
    return `https://wa.me/${formattedPhone}`;
  }
  
  try {
    // Limita a mensagem para não exceder o limite de URL (cerca de 2000 caracteres é seguro)
    const limitedMessage = message.length > 1000 ? message.substring(0, 1000) + '...' : message;
    const encodedMessage = encodeURIComponent(limitedMessage);
    
    // Verifica se o link completo não é muito grande
    const fullLink = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    if (fullLink.length > 2000) {
      // Se for muito grande, retorna um link mais simples com uma mensagem mais curta
      logger.warn('Link do WhatsApp muito longo, reduzindo mensagem');
      const shorterMessage = 'Olá! Tenho informações para compartilhar com você. Iniciando conversa...';
      return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(shorterMessage)}`;
    }
    
    return fullLink;
  } catch (error) {
    logger.error('Erro ao gerar link do WhatsApp:', error);
    // Em caso de erro, retorna apenas o link do número sem mensagem
    return `https://wa.me/${formattedPhone}`;
  }
}; 