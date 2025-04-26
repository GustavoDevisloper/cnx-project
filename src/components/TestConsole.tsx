import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { forceLog, checkConsoleStatus } from '@/lib/directConsoleLogs';
import { getHardcodedUsers } from '@/services/directUserHardcoded';
import { logger } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

/**
 * Componente para diagnosticar problemas de logs e renderização
 */
export default function TestConsole() {
  const [consoleStatus, setConsoleStatus] = useState<any>(null);
  const [testCount, setTestCount] = useState(0);
  const [hardcodedUsers, setHardcodedUsers] = useState<any[]>([]);
  
  useEffect(() => {
    // Verificar console ao montar
    runConsoleTest();
    
    // Obter usuários hardcoded
    const users = getHardcodedUsers();
    setHardcodedUsers(users);
    forceLog('TestConsole - Usuários hardcoded:', users);
  }, []);
  
  const runConsoleTest = () => {
    setTestCount(prev => prev + 1);
    
    // Registrar teste com timestamp
    const now = new Date();
    const timestamp = now.toISOString();
    const testValue = `teste_${now.getTime()}`;
    
    // Testar diferentes métodos de log
    try {
      forceLog(`[${timestamp}] Teste forçado #${testCount+1}: ${testValue}`);
      console.log(`[${timestamp}] Teste console.log #${testCount+1}: ${testValue}`);
      logger.log(`[${timestamp}] Teste logger.log #${testCount+1}: ${testValue}`);
    } catch (error) {
      forceLog('❌ Erro ao testar logs:', error);
    }
    
    // Verificar status do console
    const status = checkConsoleStatus();
    setConsoleStatus(status);
    forceLog('📋 Status do console:', status);
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Teste de Console e Renderização</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4">
          <Button onClick={runConsoleTest}>
            Executar Teste de Console #{testCount + 1}
          </Button>
          
          {consoleStatus && (
            <div className="text-sm bg-muted p-4 rounded-md">
              <h3 className="font-bold mb-2">Status do Console:</h3>
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(consoleStatus, null, 2)}
              </pre>
            </div>
          )}
          
          <div>
            <h3 className="font-bold mb-2">Usuários Hardcoded ({hardcodedUsers.length}):</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {hardcodedUsers.map(user => (
                <div 
                  key={user.id}
                  className="flex items-center gap-2 p-2 border rounded-md"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>
                      {user.display_name?.[0] || user.username?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.display_name || user.username}</div>
                    <div className="text-xs text-muted-foreground">@{user.username}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 