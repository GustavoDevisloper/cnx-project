import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Função para formatar datas em formato amigável
 */
export function formatDate(date: string | Date) {
  try {
    if (!date) return "Data não disponível";
    const parsedDate = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(parsedDate.getTime())) return "Data inválida";
    
    return parsedDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return "Data inválida";
  }
}

/**
 * Logger para melhor gerenciamento de logs na aplicação
 */
export const logger = {
  /**
   * Log normal
   */
  log: (...args: any[]) => {
    if (import.meta.env.DEV || localStorage.getItem('enableDebugLogs') === 'true') {
      console.log(...args);
    }
  },
  
  /**
   * Log de erro - sempre exibido
   */
  error: (...args: any[]) => {
    // Adicionando timestamp nos logs de erro para facilitar o diagnóstico
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR:`, ...args);
    
    // Em desenvolvimento, podemos adicionar mais detalhes para facilitar a depuração
    if (import.meta.env.DEV) {
      try {
        // Capturar stack trace para facilitar diagnóstico
        const stack = new Error().stack;
        if (stack) {
          const stackLines = stack.split('\n').slice(2, 5); // Pegar apenas algumas linhas relevantes
          console.error(`Stack trace:\n${stackLines.join('\n')}`);
        }
      } catch (e) {
        // Ignorar erros na captura de stack trace
      }
    }
  },
  
  /**
   * Log de aviso - sempre exibido
   */
  warn: (...args: any[]) => {
    // Adicionando timestamp nos logs de aviso para facilitar o diagnóstico
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] WARN:`, ...args);
    
    // Se quisermos registrar erros em um serviço de monitoramento, poderíamos adicionar código aqui
    // Exemplo: sentryClient.captureWarning(args[0]);
  },
  
  /**
   * Log para depuração - apenas em desenvolvimento ou quando debug está ativado
   */
  debug: (...args: any[]) => {
    if (import.meta.env.DEV || localStorage.getItem('enableDebugLogs') === 'true') {
      console.debug('[DEBUG]', ...args);
    }
  },
  
  /**
   * Log para informações importantes - sempre exibido
   */
  info: (...args: any[]) => {
    console.info('[INFO]', ...args);
  },
  
  /**
   * Ativa os logs de debug mesmo em produção (via localStorage)
   */
  enableDebugLogs: () => {
    localStorage.setItem('enableDebugLogs', 'true');
    console.log('Logs de debug ativados');
  },
  
  /**
   * Desativa os logs de debug em produção
   */
  disableDebugLogs: () => {
    localStorage.removeItem('enableDebugLogs');
    console.log('Logs de debug desativados');
  }
};
