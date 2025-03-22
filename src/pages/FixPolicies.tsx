import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { fixUserPolicies, executeSqlBatch } from '@/services/databaseService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Script SQL para corrigir políticas RLS
const sqlScript = `
-- Desabilitar temporariamente RLS para permitir a criação de usuário sem restrições
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Limpar todas as políticas existentes que podem estar causando conflitos
DO $$
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', pol.policyname);
    END LOOP;
END
$$;

-- Criar novas políticas simples e sem recursão
CREATE POLICY "users_read_policy"
ON users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "users_insert_policy"
ON users FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "users_update_policy"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
`;

// Script completo para corrigir todos os problemas
const completeFixScript = `
-- Script para corrigir todos os problemas de RLS e restrições no banco de dados
-- Execute este script no SQL Editor do Supabase

-------------------------
-- 1. Corrigir a tabela users
-------------------------

-- Verificar e corrigir a constraint freefire_username_key
DO $$
DECLARE
  constraint_exists boolean;
BEGIN
  -- Verificar se a constraint existe
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'freefire_username_key'
  ) INTO constraint_exists;
  
  -- Se a constraint existir, removê-la
  IF constraint_exists THEN
    EXECUTE 'ALTER TABLE users DROP CONSTRAINT IF EXISTS freefire_username_key';
    RAISE NOTICE 'Constraint freefire_username_key removida';
  ELSE
    RAISE NOTICE 'Constraint freefire_username_key não existe';
  END IF;
END
$$;

-------------------------
-- 2. Corrigir as políticas RLS
-------------------------

-- Desabilitar temporariamente RLS para permitir a criação de usuário sem restrições
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Limpar todas as políticas existentes que podem estar causando conflitos
DO $$
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', pol.policyname);
        RAISE NOTICE 'Política removida: %', pol.policyname;
    END LOOP;
END
$$;

-- Criar novas políticas simples e sem recursão

-- Política de leitura para todos os usuários autenticados
CREATE POLICY "users_read_policy"
ON users FOR SELECT
TO authenticated
USING (true);

-- Política de inserção para qualquer um (anônimo ou autenticado)
-- Isso é crucial para permitir a criação de conta durante o registro
CREATE POLICY "users_insert_policy"
ON users FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Política de atualização apenas para o próprio usuário
CREATE POLICY "users_update_policy"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Política de exclusão apenas para admins
CREATE POLICY "users_delete_policy"
ON users FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Habilitar RLS novamente com as novas políticas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-------------------------
-- 3. Garantir permissões corretas do schema
-------------------------

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-------------------------
-- 4. Verificar e corrigir a função trigger para novos usuários
-------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  has_freefire_column boolean;
BEGIN
  -- Verificar se a coluna freefire_username existe
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'freefire_username'
  ) INTO has_freefire_column;

  -- Inserir novo usuário com segurança (evitando problemas com freefire_username)
  IF has_freefire_column THEN
    EXECUTE format('
      INSERT INTO public.users (id, email, role, freefire_username)
      VALUES (%L, %L, %L, NULL)
      ON CONFLICT (id) DO NOTHING',
      new.id, new.email, 'user'
    );
  ELSE
    INSERT INTO public.users (id, email, role)
    VALUES (new.id, new.email, 'user')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN new;
END;
$$;

-- Recriar o trigger para garantir que está funcionando
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;

export default function FixPolicies() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<{ command: string, status: string }>>([]);
  const [activeTab, setActiveTab] = useState('basic');

  const runSqlFix = async (script: string, isComprehensive: boolean) => {
    setLoading(true);
    setResults([]);
    
    try {
      // Use the service depending on the type of fix
      let result;
      
      if (!isComprehensive) {
        // Use existing fix for simple RLS fixes
        result = await fixUserPolicies();
      } else {
        // For comprehensive fix, split the script and execute each command
        const commands = script
          .split(';')
          .map(cmd => cmd.trim())
          .filter(cmd => cmd.length > 0)
          .map(cmd => cmd + ';');
        
        const manualResults = await executeSqlBatch(commands);
        
        // Determine overall success
        const failedCommands = manualResults.filter(r => !r.success);
        
        result = {
          success: failedCommands.length === 0,
          message: failedCommands.length === 0 
            ? `Todos os ${manualResults.length} comandos executados com sucesso` 
            : `${failedCommands.length} de ${manualResults.length} comandos falharam`
        };
        
        // Transform for UI display
        setResults(manualResults.map(r => ({
          command: r.command,
          status: r.success ? "Sucesso" : `Erro: ${r.message}`
        })));
        
        // Return early as we've already set the results
        setLoading(false);
        
        toast({
          title: result.success ? "Correção completa executada com sucesso" : "Alguns comandos falharam",
          description: result.message,
          variant: result.success ? "default" : "destructive"
        });
        
        return;
      }
      
      if (result.success) {
        toast({
          title: "Políticas corrigidas",
          description: result.message,
        });
        
        // Transformar para o formato exibido na UI
        setResults([{
          command: "Script RLS concluído",
          status: "Sucesso"
        }]);
      } else {
        toast({
          title: "Alguns comandos falharam",
          description: result.message,
          variant: "destructive"
        });
        
        // Executar manualmente se a versão automatizada falhar
        const commands = sqlScript
          .split(';')
          .map(cmd => cmd.trim())
          .filter(cmd => cmd.length > 0)
          .map(cmd => cmd + ';');
        
        const manualResults = await executeSqlBatch(commands);
        
        // Transformar para o formato exibido na UI
        setResults(manualResults.map(r => ({
          command: r.command,
          status: r.success ? "Sucesso" : `Erro: ${r.message}`
        })));
      }
    } catch (error: any) {
      toast({
        title: "Erro ao executar script SQL",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Corrigir Banco de Dados</h1>
      
      <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">Correção RLS Básica</TabsTrigger>
          <TabsTrigger value="comprehensive">Correção Completa</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Corrigir Políticas RLS</CardTitle>
              <CardDescription>
                Execute este script para resolver problemas básicos de permissão no registro de usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-md">
                  <pre className="text-xs overflow-auto whitespace-pre-wrap">
                    {sqlScript}
                  </pre>
                </div>
                
                <Button 
                  onClick={() => runSqlFix(sqlScript, false)} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Executando script..." : "Executar correção RLS"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="comprehensive">
          <Card>
            <CardHeader>
              <CardTitle>Correção Completa de Banco de Dados</CardTitle>
              <CardDescription>
                Executar script completo para resolver todos os problemas (RLS, constraints, triggers)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-md max-h-96 overflow-auto">
                  <pre className="text-xs whitespace-pre-wrap">
                    {completeFixScript}
                  </pre>
                </div>
                
                <Button 
                  onClick={() => runSqlFix(completeFixScript, true)} 
                  disabled={loading}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  {loading ? "Executando script completo..." : "Executar correção completa"}
                </Button>
                
                <p className="text-xs text-muted-foreground mt-2">
                  ⚠️ Este script realiza mudanças significativas no banco de dados, incluindo remoção de constraints
                  e recriação de triggers. Use apenas quando os métodos mais simples não funcionarem.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left">Comando</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2 font-mono text-xs">
                        {result.command}
                      </td>
                      <td className={`px-4 py-2 ${result.status === 'Sucesso' ? 'text-green-500' : 'text-red-500'}`}>
                        {result.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 