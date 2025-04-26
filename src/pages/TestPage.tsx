import React, { useEffect, useState } from 'react';
import TestConsole from '@/components/TestConsole';

/**
 * Página de teste isolada para diagnosticar problemas
 */
export default function TestPage() {
  const [showDebug, setShowDebug] = useState(true);
  
  useEffect(() => {
    // Log direto no addEventListener, que é difícil de ser sobrescrito
    const originalConsoleLog = window.console.log;
    window.addEventListener('DOMContentLoaded', () => {
      originalConsoleLog('🚨 TESTE DE LOG NO EVENT LISTENER');
    });
    
    // Teste direto via documento
    document.title = 'Página de Teste - ' + new Date().toLocaleTimeString();
    
    // Usar a técnica mais drástica possível - document.write
    const debugDiv = document.createElement('div');
    debugDiv.innerHTML = '<strong>Debug via DOM:</strong> Console sobrescrito? Verifique o código-fonte.';
    debugDiv.style.padding = '10px';
    debugDiv.style.margin = '10px';
    debugDiv.style.border = '1px solid red';
    debugDiv.style.backgroundColor = '#ffeeee';
    
    if (showDebug) {
      try {
        // Tentar escrever diretamente no documento sem usar React
        const bodyElement = document.getElementsByTagName('body')[0];
        if (bodyElement) {
          bodyElement.appendChild(debugDiv);
        }
      } catch (error) {
        // Se falhar, mostramos via alert
        window.alert('Erro ao escrever no DOM: ' + String(error));
      }
    }
    
    // Testes de console mais extremos
    try {
      // Técnica 1: usar iframe para isolar o console
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      if (iframe.contentWindow) {
        iframe.contentWindow.console.log('🚨 TESTE DE LOG VIA IFRAME');
      }
    } catch (e) {
      // ignorar
    }
    
    // Técnica 2: usar o alert
    if (showDebug) {
      setTimeout(() => {
        window.alert('TESTE DE ALERTA: Verifique se está vendo este alerta e se os logs aparecem no console.');
      }, 2000);
    }
    
    // Usar try/catch direto para avaliar o console
    try {
      // Usando eval para evitar manipulação do console
      const evalResult = eval('console.log("🚨 TESTE DE LOG VIA EVAL")');
    } catch (error) {
      // Se falhar, mostramos via alert
      window.alert('Erro ao usar eval: ' + String(error));
    }
    
    return () => {
      // Limpar se necessário
      if (debugDiv.parentNode) {
        debugDiv.parentNode.removeChild(debugDiv);
      }
    };
  }, [showDebug]);
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-8">Página de Diagnóstico</h1>
      
      <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-md mb-8">
        <p className="font-medium">
          Esta página é para diagnosticar problemas com logs e renderização.
          Verifique o console do navegador (F12) para ver se os logs estão aparecendo.
        </p>
        <p className="text-sm mt-2">
          Se você não estiver vendo logs, tente abrir as Ferramentas do Desenvolvedor (F12) e verifique se os filtros do console estão desativados.
          Também tente recarregar a página com o console aberto.
        </p>
      </div>
      
      <div className="space-y-8">
        <TestConsole />
        
        <div className="flex justify-end">
          <button 
            className="px-4 py-2 bg-red-500 text-white rounded-md"
            onClick={() => setShowDebug(!showDebug)}
          >
            {showDebug ? 'Esconder Debug' : 'Mostrar Debug'}
          </button>
        </div>
      </div>
    </div>
  );
} 