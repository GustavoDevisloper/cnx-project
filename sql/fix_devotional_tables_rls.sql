-- Script para adicionar políticas RLS (Row-Level Security) às tabelas de interação com devocionais
-- Este script corrige o erro 42501 (violação de políticas RLS) ao tentar inserir curtidas ou comentários

-- 1. Configurar RLS para a tabela de curtidas (devotional_likes)
-- Primeiro garantir que RLS está habilitado
ALTER TABLE public.devotional_likes ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS devotional_likes_insert_policy ON public.devotional_likes;
DROP POLICY IF EXISTS devotional_likes_select_policy ON public.devotional_likes;
DROP POLICY IF EXISTS devotional_likes_delete_policy ON public.devotional_likes;

-- Criar política para permitir que usuários autenticados insiram curtidas
CREATE POLICY devotional_likes_insert_policy
  ON public.devotional_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Criar política para permitir leitura de todas as curtidas
CREATE POLICY devotional_likes_select_policy
  ON public.devotional_likes
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Criar política para permitir que usuários removam suas próprias curtidas
CREATE POLICY devotional_likes_delete_policy
  ON public.devotional_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Configurar RLS para a tabela de comentários (devotional_comments)
-- Primeiro garantir que RLS está habilitado
ALTER TABLE public.devotional_comments ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS devotional_comments_insert_policy ON public.devotional_comments;
DROP POLICY IF EXISTS devotional_comments_select_policy ON public.devotional_comments;
DROP POLICY IF EXISTS devotional_comments_delete_policy ON public.devotional_comments;
DROP POLICY IF EXISTS devotional_comments_update_policy ON public.devotional_comments;

-- Criar política para permitir que usuários autenticados insiram comentários
CREATE POLICY devotional_comments_insert_policy
  ON public.devotional_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Criar política para permitir leitura de todos os comentários
CREATE POLICY devotional_comments_select_policy
  ON public.devotional_comments
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Criar política para permitir que usuários editem seus próprios comentários
CREATE POLICY devotional_comments_update_policy
  ON public.devotional_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Criar política para permitir que usuários removam seus próprios comentários
CREATE POLICY devotional_comments_delete_policy
  ON public.devotional_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Criar política para permitir que administradores gerenciem todos os registros
DO $$
BEGIN
  -- Política para administradores gerenciarem curtidas
  EXECUTE 'CREATE POLICY devotional_likes_admin_policy
    ON public.devotional_likes
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (SELECT id FROM public.users WHERE role = ''admin''))';

  -- Política para administradores gerenciarem comentários
  EXECUTE 'CREATE POLICY devotional_comments_admin_policy
    ON public.devotional_comments
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (SELECT id FROM public.users WHERE role = ''admin''))';
END $$;

-- Verificar políticas criadas
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual
FROM 
    pg_policies
WHERE 
    tablename IN ('devotional_likes', 'devotional_comments')
ORDER BY 
    tablename, cmd; 