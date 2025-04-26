/**
 * Este arquivo implementa uma verificação de sobreposição do console
 * e restaura as funções originais do console caso estejam sendo
 * bloqueadas por algum outro código.
 */

// Armazena referências às funções originais do console
const originalConsole = {
  log: window.console.log,
  error: window.console.error,
  warn: window.console.warn,
  info: window.console.info
};

// Função para restaurar o console original
export function restoreConsole() {
  // Verifica se o console atual não é o original
  const isModified = (
    window.console.log !== originalConsole.log ||
    window.console.error !== originalConsole.error ||
    window.console.warn !== originalConsole.warn ||
    window.console.info !== originalConsole.info
  );
  
  if (isModified) {
    try {
      // Sobrescreve o console atual com as funções originais
      window.console.log = originalConsole.log;
      window.console.error = originalConsole.error;
      window.console.warn = originalConsole.warn;
      window.console.info = originalConsole.info;
      
      // Tenta registrar a restauração
      window.console.log('%c Console restaurado! ', 'background: green; color: white; padding: 2px 4px;');
      
      return true;
    } catch (error) {
      // Em caso de erro, tenta registrar o erro de alguma forma
      try {
        originalConsole.log('Erro ao restaurar console:', error);
      } catch (e) {
        // Último recurso - usar o alert
        window.alert('Erro ao restaurar o console: ' + String(error));
      }
    }
  }
  
  return false;
}

// Função para restaurar o console e retornar referências às funções originais
export function restoreAndGetConsole() {
  // Primeiro restaura o console se necessário
  restoreConsole();
  
  // Retorna as referências originais do console
  return {
    ...originalConsole,
    // Adiciona informação sobre o estado do console
    isModified: window.console.log !== originalConsole.log ||
                window.console.error !== originalConsole.error ||
                window.console.warn !== originalConsole.warn ||
                window.console.info !== originalConsole.info,
    isSuppressed: isConsoleSuppressed()
  };
}

// Função para verificar se o console está bloqueado
export function isConsoleSuppressed() {
  try {
    // Tenta registrar uma mensagem com um timestamp único
    const testValue = Date.now();
    const testMessage = `Teste de console ${testValue}`;
    
    // Execute manualmente a função original e verifique se ela está sendo chamada
    let executed = false;
    const originalLog = originalConsole.log;
    
    const testFn = function() {
      executed = true;
    };
    
    // Teste de substituição temporária
    window.console.log = testFn;
    window.console.log(testMessage);
    window.console.log = originalLog;
    
    return !executed;
  } catch (error) {
    return true; // Assume que há bloqueio se ocorrer um erro
  }
}

// Auto-executa a restauração
(function() {
  // Adiciona listener para DOMContentLoaded para garantir que isso execute cedo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restoreConsole);
  } else {
    restoreConsole();
  }
  
  // Verifica periodicamente se o console foi modificado e restaura se necessário
  setInterval(restoreConsole, 5000);
})(); 