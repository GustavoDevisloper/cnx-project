/**
 * Este arquivo fornece acesso direto às funções originais do console
 * independentemente de qualquer sobreposição que possa ter ocorrido.
 * 
 * Use estas funções quando precisar garantir que as mensagens de log
 * sejam exibidas, mesmo em ambientes onde o console possa estar sendo
 * suprimido ou modificado.
 */

import { restoreAndGetConsole } from './consoleOverride';

// Obtém referências diretas para as funções originais do console
const directConsole = restoreAndGetConsole();

/**
 * Conjunto de funções para logar diretamente, ignorando qualquer substituição do console
 */
export const directLogger = {
  log: (...args: any[]) => {
    directConsole.log.apply(console, args);
  },
  
  error: (...args: any[]) => {
    directConsole.error.apply(console, args);
  },
  
  warn: (...args: any[]) => {
    directConsole.warn.apply(console, args);
  },
  
  info: (...args: any[]) => {
    directConsole.info.apply(console, args);
  },
  
  debug: (...args: any[]) => {
    if (typeof directConsole.debug === 'function') {
      directConsole.debug.apply(console, args);
    } else {
      // Fallback para log se debug não existir
      directConsole.log.apply(console, args);
    }
  },
  
  // Fornece informações sobre o estado do console
  getConsoleState: () => {
    return {
      isModified: directConsole.isModified,
      isSuppressed: directConsole.isSuppressed
    };
  }
};

/**
 * Força um log direto, ignorando qualquer substituição ou supressão do console.
 * Útil para depuração em ambientes onde o console pode estar sendo bloqueado.
 */
export function forceLog(...args: any[]) {
  directConsole.log.apply(console, args);
  
  // Em casos extremos, podemos tentar outros métodos para garantir que o log apareça
  try {
    if (directConsole.isSuppressed) {
      // Tenta outras abordagens se detectarmos que o console está suprimido
      setTimeout(() => directConsole.log.apply(console, ['[RETRY]', ...args]), 0);
    }
  } catch (e) {
    // Ignora erros internos da função para evitar quebrar a aplicação
  }
}

/**
 * Verifica o status atual do console e retorna informações relevantes
 */
export function checkConsoleStatus() {
  const state = directLogger.getConsoleState();
  directLogger.log('Estado do console:', state);
  return state;
}

/**
 * Use esta função para verificar se o console está funcionando corretamente
 */
export function testDirectLogger() {
  const state = directLogger.getConsoleState();
  
  directLogger.log('📋 Teste do directLogger.log');
  directLogger.info('ℹ️ Teste do directLogger.info');
  directLogger.warn('⚠️ Teste do directLogger.warn');
  directLogger.error('❌ Teste do directLogger.error');
  directLogger.debug('🔍 Teste do directLogger.debug');
  
  directLogger.log('Estado do console:', state);
  
  return state;
}

// Exporta o directLogger como padrão para facilitar o uso
export default directLogger; 