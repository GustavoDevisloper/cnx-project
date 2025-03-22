import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Database, Code, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { AlertTriangle } from "lucide-react";

interface EventsDatabaseFixProps {
  errorCode?: string;
  errorMessage?: string;
}

export function EventsDatabaseFix({ errorCode, errorMessage }: EventsDatabaseFixProps) {
  const [scriptCopied, setScriptCopied] = useState(false);
  
  useEffect(() => {
    if (scriptCopied) {
      const timer = setTimeout(() => {
        setScriptCopied(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [scriptCopied]);
  
  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path)
      .then(() => {
        setScriptCopied(true);
        toast({
          title: "Caminho copiado",
          description: "O caminho do arquivo foi copiado para a área de transferência",
        });
      })
      .catch(() => {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o caminho. Por favor, selecione-o manualmente.",
          variant: "destructive"
        });
      });
  };

  return (
    <Card className="mb-6">
      <CardHeader className="bg-muted/50">
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Configuração do Banco de Dados de Eventos Necessária
        </CardTitle>
        <CardDescription>
          Foi detectado um problema com as tabelas de eventos no banco de dados
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao criar evento</AlertTitle>
          <AlertDescription>
            <p>
              {errorMessage || 
                "A tabela 'events' não existe no banco de dados ou há um problema de configuração."
              }
            </p>
            {errorCode && <span className="block mt-1 text-xs opacity-70">Código: {errorCode}</span>}
            <p className="mt-2 text-sm">
              Este erro ocorre quando o banco de dados não possui as tabelas necessárias para o sistema de eventos ou quando há um problema de tipagem nas consultas.
            </p>
          </AlertDescription>
        </Alert>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">O problema:</h3>
          <p>
            O sistema de eventos requer um conjunto de tabelas no banco de dados para funcionar corretamente:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>events</strong>: Tabela principal que armazena informações sobre os eventos
            </li>
            <li>
              <strong>event_attendances</strong>: Armazena confirmações de presença em eventos
            </li>
            <li>
              <strong>event_items</strong>: Itens que os participantes levarão para os eventos
            </li>
            <li>
              <strong>event_messages</strong>: Mensagens no chat do evento
            </li>
          </ul>
          <p className="mt-2">
            Uma ou mais dessas tabelas não existe no banco de dados, ou existe um problema de tipagem nas consultas (comparação entre datas e textos).
          </p>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-md mt-4">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Solução:</h3>
            <p className="text-yellow-700 dark:text-yellow-400">
              Execute o script SQL que cria todas as tabelas e funções necessárias para o sistema de eventos:
            </p>
            
            <ol className="list-decimal pl-5 mt-2 space-y-1 text-yellow-600 dark:text-yellow-400">
              <li>Acesse o painel do Supabase do projeto</li>
              <li>Navegue até "SQL Editor"</li>
              <li>Crie um novo script</li>
              <li>Abra o arquivo <code>src/scripts/create_events_tables.sql</code> do projeto</li>
              <li>Copie todo o conteúdo do arquivo e cole no editor SQL do Supabase</li>
              <li>Execute o script</li>
              <li>Retorne a esta página e tente criar o evento novamente</li>
            </ol>
            
            <div className="mt-4">
              <Alert variant="warning" className="bg-yellow-100 dark:bg-yellow-900/50 border-yellow-300 dark:border-yellow-700">
                <AlertCircle className="h-4 w-4 text-yellow-800 dark:text-yellow-300" />
                <AlertTitle className="text-yellow-800 dark:text-yellow-300">Possíveis erros durante a execução do script</AlertTitle>
                <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                  <p>
                    Se você encontrar um erro como <code>policy already exists</code>, não se preocupe. O script foi atualizado para lidar com políticas duplicadas. Certifique-se de usar a versão mais recente do script que remove políticas existentes antes de criá-las novamente.
                  </p>
                  <p className="mt-2">
                    Se encontrar um erro como <code>unterminated dollar-quoted string</code>, você está usando uma versão desatualizada do script. Os scripts foram atualizados para usar identificadores específicos nas strings dollar-quoted (como <code>$create_event_function$</code> ao invés de <code>$function$</code>) para evitar conflitos com os metadados inseridos pelo Supabase SQL Editor.
                  </p>
                  <p className="mt-2">
                    Se o erro persistir, baixe novamente os scripts atualizados ou modifique manualmente os delimitadores <code>$function$</code> para um identificador mais específico como <code>$custom_identifier_create_event$</code>. Certifique-se de que o mesmo identificador seja usado tanto na abertura quanto no fechamento da string.
                  </p>
                </AlertDescription>
              </Alert>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleCopyPath('src/scripts/create_events_tables.sql')}
                className="text-yellow-700 border-yellow-400 hover:bg-yellow-100 hover:text-yellow-800 dark:text-yellow-400 dark:hover:bg-yellow-900/50"
              >
                <Code className="h-4 w-4 mr-1" />
                {scriptCopied ? "Caminho copiado!" : "Copiar caminho do arquivo"}
              </Button>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md mt-4">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">Problemas de tipo de dados?</h3>
            <p className="text-blue-700 dark:text-blue-400">
              Se você está vendo o erro <code>operator does not exist: text &lt; timestamp with time zone</code>, você precisa executar o script de correção de tipos de dados:
            </p>
            
            <ol className="list-decimal pl-5 mt-2 space-y-1 text-blue-600 dark:text-blue-400">
              <li>Acesse o painel do Supabase do projeto</li>
              <li>Navegue até "SQL Editor"</li>
              <li>Crie um novo script</li>
              <li>Abra o arquivo <code>src/scripts/fix_events_date_format.sql</code> do projeto</li>
              <li>Copie todo o conteúdo do arquivo e cole no editor SQL do Supabase</li>
              <li>Execute o script</li>
              <li>Retorne a esta página e tente criar o evento novamente</li>
            </ol>
            
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleCopyPath('src/scripts/fix_events_date_format.sql')}
                className="text-blue-700 border-blue-400 hover:bg-blue-100 hover:text-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/50"
              >
                <Code className="h-4 w-4 mr-1" />
                Copiar caminho do script de correção de tipos
              </Button>
            </div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-md mt-4">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Erro de tipo de retorno da função?</h3>
            <p className="text-yellow-700 dark:text-yellow-400">
              Se você encontrar um erro como <code>cannot change return type of existing function</code>, isso significa que uma versão anterior da função <code>create_event</code> já existe com um tipo de retorno diferente. Para resolver:
            </p>
            
            <ol className="list-decimal pl-5 mt-2 space-y-1 text-yellow-600 dark:text-yellow-400">
              <li>Remova manualmente a função existente usando o comando:</li>
              <li><code className="bg-yellow-100 dark:bg-yellow-900 p-1 rounded">DROP FUNCTION IF EXISTS create_event(text, text, timestamp with time zone, timestamp with time zone, text, text, uuid);</code></li>
              <li>Em seguida, execute o script <code>fix_events_date_format.sql</code> novamente</li>
            </ol>
            
            <div className="mt-2">
              <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                <strong>Nota:</strong> A versão mais recente dos scripts já inclui comandos para remover todas as versões da função antes de criar a nova.
              </p>
            </div>
          </div>
          
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md text-sm mt-4">
            <p className="font-medium text-blue-700 dark:text-blue-300">
              Nota para administradores:
            </p>
            <p className="mt-1 text-blue-600 dark:text-blue-400">
              O script criará todas as tabelas necessárias para o sistema de eventos, incluindo índices, 
              políticas de segurança (RLS) e funções RPC para contornar problemas de tipagem e permissões.
            </p>
            <p className="mt-1 text-blue-600 dark:text-blue-400">
              Depois de executar o script, o sistema de eventos funcionará normalmente e os usuários poderão 
              criar, participar e interagir com eventos.
            </p>
          </div>
        </div>

        <div className="mt-6 py-4 px-6 rounded-md bg-yellow-50 border border-yellow-200">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Problema: Erro de tipo de retorno em funções
          </h3>
          <p className="mb-4">
            Se você encontrar o erro <code>cannot change return type of existing function</code>,
            isso significa que uma versão existente da função já existe com um tipo de retorno 
            diferente. Você precisará remover manualmente a função existente antes de executar 
            o script novamente.
          </p>
          <ol className="list-decimal list-inside mb-4 ml-4">
            <li className="mb-1">Acesse o painel do Supabase e vá para o Editor SQL</li>
            <li className="mb-1">Execute o comando SQL para remover a função existente:</li>
          </ol>
          <div className="bg-gray-800 rounded-md p-3 mb-4">
            <code className="text-white text-sm">
              DROP FUNCTION IF EXISTS create_event;
            </code>
          </div>
          <p className="mb-2">
            <strong>Nota:</strong> A versão mais recente dos scripts já inclui comandos para 
            remover todas as versões anteriores da função antes de criar uma nova.
          </p>
        </div>

        <div className="mt-6 py-4 px-6 rounded-md bg-purple-50 border border-purple-200">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">
            Problema: Erro ao buscar relacionamentos automáticos com a tabela users
          </h3>
          <p className="mb-4">
            Se você encontrar erros como <code>Could not find a relationship between 'event_attendances' and 'user_id'</code> ou
            <code>Could not find a relationship between 'event_messages' and 'user_id'</code>, isso significa que 
            o PostgREST não consegue identificar corretamente as relações entre as tabelas.
          </p>
          <ol className="list-decimal list-inside mb-4 ml-4">
            <li className="mb-1">Acesse o painel do Supabase e vá para o Editor SQL</li>
            <li className="mb-1">Execute o script para corrigir as relações de chave estrangeira:</li>
          </ol>
          <div className="relative">
            <div className="bg-gray-800 rounded-md p-3 mb-4">
              <code className="text-white text-sm">
                src/scripts/fix_foreign_key_relationships.sql
              </code>
            </div>
            <button 
              className="absolute top-3 right-3 bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded-md text-xs"
              onClick={() => {
                handleCopyPath('src/scripts/fix_foreign_key_relationships.sql');
              }}
            >
              Copiar
            </button>
          </div>
          <p className="mb-2">
            Este script irá:
          </p>
          <ul className="list-disc list-inside mb-4 ml-4">
            <li className="mb-1">Criar uma view <code>users_view</code> para facilitar consultas</li>
            <li className="mb-1">Adicionar comentários para o PostgREST entender as relações</li>
            <li className="mb-1">Configurar corretamente as chaves estrangeiras nas tabelas</li>
            <li className="mb-1">Adicionar índices para melhorar a performance</li>
          </ul>
          <p className="mb-2">
            <strong>Nota:</strong> Após executar o script, você pode precisar atualizar a página
            ou reiniciar a aplicação para que as mudanças sejam percebidas.
          </p>
        </div>
        
        <div className="mt-6 py-4 px-6 rounded-md bg-green-50 border border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Problema: Erro de restrição na coluna status da tabela event_attendances
          </h3>
          <p className="mb-4">
            Se você encontrar o erro <code>violates check constraint "event_attendances_status_check"</code>,
            isso significa que os valores utilizados para o status da confirmação de presença 
            ('confirmed', 'declined', 'maybe') não são permitidos pela restrição atual da tabela.
          </p>
          <ol className="list-decimal list-inside mb-4 ml-4">
            <li className="mb-1">Acesse o painel do Supabase e vá para o Editor SQL</li>
            <li className="mb-1">Execute o script para ajustar a restrição do campo status:</li>
          </ol>
          <div className="relative">
            <div className="bg-gray-800 rounded-md p-3 mb-4">
              <code className="text-white text-sm">
                src/scripts/check_event_attendances_constraint.sql
              </code>
            </div>
            <button 
              className="absolute top-3 right-3 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-md text-xs"
              onClick={() => {
                handleCopyPath('src/scripts/check_event_attendances_constraint.sql');
              }}
            >
              Copiar
            </button>
          </div>
          <p className="mb-2">
            Este script irá:
          </p>
          <ul className="list-disc list-inside mb-4 ml-4">
            <li className="mb-1">Verificar a restrição atual do campo <code>status</code></li>
            <li className="mb-1">Remover a restrição existente</li>
            <li className="mb-1">Criar uma nova restrição que permite todos os valores necessários ('confirmed', 'declined', 'maybe', 'pending', 'cancelled')</li>
          </ul>
          <p className="mb-2">
            <strong>Alternativa manual:</strong> Se preferir, você pode executar diretamente estes comandos SQL:
          </p>
          <div className="bg-gray-800 rounded-md p-3 mb-4">
            <code className="text-white text-sm">
              ALTER TABLE public.event_attendances<br/>
              DROP CONSTRAINT IF EXISTS event_attendances_status_check;<br/><br/>
              
              ALTER TABLE public.event_attendances<br/>
              ADD CONSTRAINT event_attendances_status_check<br/>
              CHECK (status IN ('confirmed', 'declined', 'maybe', 'pending', 'cancelled'));
            </code>
          </div>
        </div>

        <Accordion type="single" collapsible>
          <AccordionItem value="foreign-key-error">
            <AccordionTrigger>
              Erro de Chave Estrangeira (user_id not present in table "users")
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <p>Este erro ocorre quando um usuário autenticado tenta confirmar presença, mas seu ID não existe na tabela <code>public.users</code>:</p>
                <Alert variant="destructive" className="my-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Erro de Chave Estrangeira</AlertTitle>
                  <AlertDescription>
                    Key (user_id) is not present in table "users". Violates foreign key constraint "event_attendances_user_id_fkey"
                  </AlertDescription>
                </Alert>
                
                <p className="font-semibold mt-2">Para resolver:</p>
                <p className="text-sm mb-2">Escolha uma das opções abaixo:</p>

                <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 mb-3">
                  <p className="font-medium text-yellow-800 mb-2">Opção 1: Sincronização Rápida (apenas o usuário atual)</p>
                  <ol className="list-decimal ml-6 text-sm">
                    <li>Acesse o painel do Supabase</li>
                    <li>Navegue até o Editor SQL</li>
                    <li>Crie um novo script</li>
                    <li>Cole o conteúdo do arquivo <code>src/scripts/sync_current_user.sql</code></li>
                    <li>Substitua o valor do ID de usuário pela sua ID (mostrada no erro)</li>
                    <li>Execute o script</li>
                  </ol>
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCopyPath('src/scripts/sync_current_user.sql')}
                      className="bg-yellow-100 border-yellow-300 text-yellow-800"
                    >
                      Copiar caminho do arquivo
                    </Button>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                  <p className="font-medium text-blue-800 mb-2">Opção 2: Sincronização Completa (todos os usuários)</p>
                  <ol className="list-decimal ml-6 text-sm">
                    <li>Acesse o painel do Supabase</li>
                    <li>Navegue até o Editor SQL</li>
                    <li>Crie um novo script</li>
                    <li>Cole o conteúdo do arquivo <code>src/scripts/sync_users_tables.sql</code></li>
                    <li>Execute o script</li>
                    <li>Execute o comando <code>SELECT sync_users();</code> para sincronizar os usuários</li>
                  </ol>
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCopyPath('src/scripts/sync_users_tables.sql')}
                      className="bg-blue-100 border-blue-300 text-blue-800"
                    >
                      Copiar caminho do arquivo
                    </Button>
                  </div>
                </div>
                
                <p className="mt-2 text-sm text-muted-foreground">
                  Estes scripts sincronizarão os usuários da tabela <code>auth.users</code> para a tabela <code>public.users</code>, 
                  corrigindo o problema de chave estrangeira.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
} 