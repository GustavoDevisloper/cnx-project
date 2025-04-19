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
 * Logger seguro que só exibe logs em ambiente de desenvolvimento
 * Substitui as funções nativas console.log, console.error, console.warn
 * em produção, os logs são silenciados
 */
export const logger = (() => {
  // Função interna para verificar se estamos em ambiente de desenvolvimento
  const isDevEnvironment = () => {
    try {
      // Verifica ambiente Vite/Vercel
      const isViteDev = typeof import.meta.env.DEV !== 'undefined' && import.meta.env.DEV === true;
      const isNotProd = typeof import.meta.env.PROD !== 'undefined' && !import.meta.env.PROD;
      const devMode = typeof import.meta.env.MODE !== 'undefined' && import.meta.env.MODE !== 'production';
      
      // Verifica Node.js env
      const notNodeProd = typeof process !== 'undefined' && 
                          typeof process.env !== 'undefined' && 
                          process.env.NODE_ENV !== 'production';
      
      // Verifica se está em ambiente Vercel pela URL
      const notVercel = typeof window !== 'undefined' && 
                       window.location && 
                       !window.location.hostname.includes('vercel.app');
                       
      // Ambiente local de desenvolvimento (localhost)
      const isLocalhost = typeof window !== 'undefined' && 
                         window.location && 
                         (window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1');
      
      // Retorna true apenas se estiver realmente em desenvolvimento
      return (isViteDev || isLocalhost) && notVercel;
    } catch (e) {
      // Em caso de erro nas verificações, aja com segurança e não exiba logs
      return false;
    }
  };
  
  // Retorna o objeto logger com funções que verificam o ambiente
  return {
    log: (...args: any[]) => {
      if (isDevEnvironment()) {
        console.log(...args);
      }
    },
    
    error: (...args: any[]) => {
      if (isDevEnvironment()) {
        console.error(...args);
      }
    },
    
    warn: (...args: any[]) => {
      if (isDevEnvironment()) {
        console.warn(...args);
      }
    },
    
    info: (...args: any[]) => {
      if (isDevEnvironment()) {
        console.info(...args);
      }
    },
    
    debug: (...args: any[]) => {
      if (isDevEnvironment()) {
        console.debug(...args);
      }
    }
  };
})();
