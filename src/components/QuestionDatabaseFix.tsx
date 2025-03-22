import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, Database, FileCode, CheckCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface QuestionDatabaseFixProps {
  errorCode?: string;
  errorMessage?: string;
}

export function QuestionDatabaseFix({ errorCode, errorMessage }: QuestionDatabaseFixProps) {
  // Função para copiar o caminho do arquivo para a área de transferência
  const handleCopyScript = () => {
    navigator.clipboard.writeText('src/scripts/fix_questions_table_schema.sql');
    alert(`Caminho copiado: src/scripts/fix_questions_table_schema.sql`);
  };
  
  const handleCopySyncScript = () => {
    navigator.clipboard.writeText('src/scripts/sync_users_tables.sql');
    alert(`Caminho copiado: src/scripts/sync_users_tables.sql`);
  };

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" /> 
          Problemas no Banco de Dados de Perguntas
        </CardTitle>
        <CardDescription>
          {errorCode ? `Erro (${errorCode}): Foi detectado um problema na estrutura ou configuração do banco de dados.` : 
            "Foi detectado um problema na estrutura da tabela de perguntas ou nas permissões de acesso."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao manipular perguntas</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              {errorMessage || "Ocorreu um erro ao tentar acessar ou modificar a tabela de perguntas."}
            </p>
            O sistema detectou um dos seguintes problemas:
            <ul className="list-disc ml-6 mt-2">
              <li>A tabela <code>questions</code> não está configurada corretamente</li>
              <li>A coluna <code>title</code> ou <code>content</code> não existe na tabela</li>
              <li>As políticas de segurança (RLS) estão impedindo o acesso à tabela</li>
              <li>Há um problema de chave estrangeira entre <code>questions</code> e <code>users</code></li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="bg-muted p-4 rounded-md">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <FileCode className="h-5 w-5" /> 
            Instruções para Correção
          </h3>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>
                Opção 1: Executar Script de Correção da Tabela Questions
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <p>Execute o script SQL de correção automática no Editor SQL do Supabase:</p>
                  <ol className="list-decimal ml-6">
                    <li>Acesse o painel do Supabase</li>
                    <li>Navegue até o Editor SQL</li>
                    <li>Crie um novo script</li>
                    <li>Cole o conteúdo do arquivo <code>fix_questions_table_schema.sql</code></li>
                    <li>Execute o script</li>
                  </ol>
                  <div className="mt-2">
                    <Alert variant="warning" className="bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Nota sobre possíveis erros</AlertTitle>
                      <AlertDescription>
                        Se você encontrar um erro como <code>policy already exists</code>, não se preocupe. 
                        Os scripts foram atualizados para remover políticas existentes antes de criá-las novamente.
                        Certifique-se de estar usando a versão mais recente do script.
                        
                        <p className="mt-2">
                          Se encontrar um erro como <code>unterminated dollar-quoted string</code>, verifique se está usando a versão mais recente do script. Os scripts foram atualizados para usar identificadores únicos nas strings dollar-quoted (como <code>$function$</code> ao invés de apenas <code>$$</code>) para evitar conflitos com os metadados inseridos pelo Supabase SQL Editor.
                        </p>
                      </AlertDescription>
                    </Alert>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCopyScript}
                    >
                      Copiar caminho do arquivo
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>
                Opção 2: Sincronizar Tabelas de Usuários
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <p>Se o problema for relacionado à chave estrangeira entre <code>questions</code> e <code>users</code>, execute o script de sincronização:</p>
                  <ol className="list-decimal ml-6">
                    <li>Acesse o painel do Supabase</li>
                    <li>Navegue até o Editor SQL</li>
                    <li>Crie um novo script</li>
                    <li>Cole o conteúdo do arquivo <code>sync_users_tables.sql</code></li>
                    <li>Execute o script</li>
                  </ol>
                  <p className="text-sm mt-2">
                    Esse script cria registros na tabela <code>users</code> para todos os usuários presentes em <code>auth.users</code>, 
                    resolvendo problemas de chave estrangeira.
                  </p>
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCopySyncScript}
                    >
                      Copiar caminho do arquivo
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>
                Opção 3: Corrigir Manualmente Através do Painel
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <p>Você também pode corrigir manualmente através do painel do Supabase:</p>
                  <ol className="list-decimal ml-6">
                    <li>
                      Verificar a estrutura da tabela <code>questions</code>:
                      <ul className="list-disc ml-6">
                        <li>Acesse <strong>Table Editor</strong> → <code>questions</code></li>
                        <li>Verifique se existem as colunas <code>title</code> e <code>content</code></li>
                        <li>Caso não existam, adicione-as através do botão "Add Column"</li>
                      </ul>
                    </li>
                    <li>
                      Verificar as políticas RLS:
                      <ul className="list-disc ml-6">
                        <li>Acesse <strong>Authentication</strong> → <strong>Policies</strong></li>
                        <li>Selecione a tabela <code>questions</code></li>
                        <li>Certifique-se de que exista uma política para INSERT que permita usuários autenticados inserir dados</li>
                      </ul>
                    </li>
                  </ol>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Importante</AlertTitle>
          <AlertDescription>
            A correção requer acesso administrativo ao banco de dados Supabase. Caso não tenha acesso, 
            entre em contato com o administrador do sistema.
          </AlertDescription>
        </Alert>
        
        <p className="text-sm text-muted-foreground">
          <strong>Nota:</strong> A função RPC <code>answer_question</code> utilizada pelo sistema contorna as restrições de chave estrangeira, 
          permitindo que você responda a perguntas mesmo quando há problemas na tabela de usuários. Para resolver permanentemente, 
          execute o script <code>sync_users_tables.sql</code> que sincroniza os usuários entre <code>auth.users</code> e a tabela pública <code>users</code>.
        </p>
      </CardContent>
      <CardFooter>
        <div className="flex items-center text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4 mr-2" />
          Após executar um dos scripts de correção, tente a operação novamente.
        </div>
      </CardFooter>
    </Card>
  );
} 