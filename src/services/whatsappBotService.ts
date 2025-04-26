import { logger } from '@/lib/utils';

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

/**
 * Envia uma mensagem para o WhatsApp (versão simulada)
 * @param phoneNumberOrConfig Número de telefone ou configuração
 * @param message Mensagem a ser enviada (opcional se phoneNumberOrConfig for um objeto)
 * @returns Resultado da operação
 */
export const sendWhatsAppMessage = async (
  phoneNumberOrConfig: string | { phoneNumber: string; message: string },
  message?: string
): Promise<{success: boolean, error?: string}> => {
  try {
    let phoneNumber: string;
    let messageText: string;
    
    if (typeof phoneNumberOrConfig === 'string') {
      if (!message) {
        throw new Error('Mensagem é obrigatória quando o primeiro parâmetro é um número de telefone');
      }
      phoneNumber = phoneNumberOrConfig;
      messageText = message;
    } else {
      phoneNumber = phoneNumberOrConfig.phoneNumber;
      messageText = phoneNumberOrConfig.message;
    }

    // Formata o número de telefone
    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
      throw new Error('Número de telefone inválido');
    }

    // Simula o envio da mensagem
    logger.log('🔵 [SIMULAÇÃO] Enviando mensagem via WhatsApp:');
    logger.log('📱 Para:', formattedPhone);
    logger.log('💬 Mensagem:', messageText);
    
    // Simula um pequeno atraso
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simula uma chance de falha de 5% para demonstrar tratamento de erros
    if (Math.random() < 0.05) {
      logger.error('❌ [SIMULAÇÃO] Falha simulada no envio da mensagem');
      return { success: false, error: 'Falha simulada no envio da mensagem' };
    }
    
    logger.log('✅ [SIMULAÇÃO] Mensagem enviada com sucesso');
    return { success: true };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro ao enviar a mensagem';
    logger.error('Erro ao enviar mensagem via WhatsApp:', error);
    return { success: false, error: errorMessage };
  }
}; 