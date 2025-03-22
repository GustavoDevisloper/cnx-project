import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, Database, FileCode, CheckCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function QuestionsDatabaseFix() {
  // Função para copiar o caminho do arquivo para a área de transferência
  const copyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    alert(`Caminho copiado: ${path}`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" /> 
          Problemas no Banco de Dados de Perguntas
        </CardTitle>
        <CardDescription>
          Foi detectado um problema na estrutura da tabela de perguntas ou nas permissões de acesso.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao criar perguntas</AlertTitle>
          <AlertDescription>
            O sistema detectou um dos seguintes problemas:
            <ul className="list-disc ml-6 mt-2">
              <li>A coluna <code>title</code> não existe na tabela <code>questions</code></li>
              <li>As políticas de segurança (RLS) estão impedindo inserções na tabela</li>
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
                Opção 1: Executar Script de Correção Automática
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
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyPath('src/scripts/fix_questions_table_schema.sql')}
                    >
                      Copiar caminho do arquivo
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>
                Opção 2: Criar Função RPC para Contornar Políticas
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <p>Execute o script SQL para criar uma função RPC que contorne as políticas RLS:</p>
                  <ol className="list-decimal ml-6">
                    <li>Acesse o painel do Supabase</li>
                    <li>Navegue até o Editor SQL</li>
                    <li>Crie um novo script</li>
                    <li>Cole o conteúdo do arquivo <code>create_question_function.sql</code></li>
                    <li>Execute o script</li>
                  </ol>
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyPath('src/scripts/create_question_function.sql')}
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
      </CardContent>
      <CardFooter>
        <div className="flex items-center text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4 mr-2" />
          Após executar um dos scripts de correção, tente adicionar uma pergunta novamente.
        </div>
      </CardFooter>
    </Card>
  );
} 