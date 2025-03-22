-- Script para limpar e recriar políticas de segurança para devocionais
-- Este script remove todas as políticas existentes e cria um conjunto consistente

-- 1. Remover TODAS as políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "devotional_comments_insert_policy" ON public.devotional_comments;
DROP POLICY IF EXISTS "devotional_comments_select_policy" ON public.devotional_comments;
DROP POLICY IF EXISTS "devotional_comments_delete_policy" ON public.devotional_comments;
DROP POLICY IF EXISTS "devotional_comments_update_policy" ON public.devotional_comments;
DROP POLICY IF EXISTS "devotional_comments_admin_policy" ON public.devotional_comments;
DROP POLICY IF EXISTS "Usuários autenticados podem comentar" ON public.devotional_comments;
DROP POLICY IF EXISTS "Qualquer pessoa pode ver comentários" ON public.devotional_comments;
DROP POLICY IF EXISTS "Usuários podem excluir seus próprios comentários" ON public.devotional_comments;
DROP POLICY IF EXISTS "Usuários podem editar seus próprios comentários" ON public.devotional_comments;
DROP POLICY IF EXISTS "Admins podem gerenciar qualquer comentário" ON public.devotional_comments;

DROP POLICY IF EXISTS "devotional_likes_insert_policy" ON public.devotional_likes;
DROP POLICY IF EXISTS "devotional_likes_select_policy" ON public.devotional_likes;
DROP POLICY IF EXISTS "devotional_likes_delete_policy" ON public.devotional_likes;
DROP POLICY IF EXISTS "devotional_likes_admin_policy" ON public.devotional_likes;
DROP POLICY IF EXISTS "Usuários autenticados podem curtir" ON public.devotional_likes;
DROP POLICY IF EXISTS "Qualquer pessoa pode ver curtidas" ON public.devotional_likes;
DROP POLICY IF EXISTS "Usuários podem remover suas próprias curtidas" ON public.devotional_likes;

-- 2. Garantir que RLS está habilitado
ALTER TABLE public.devotional_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devotional_comments ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas consistentes para a tabela devotional_likes
-- Política para permitir que usuários autenticados insiram curtidas
CREATE POLICY insert_devotional_likes
  ON public.devotional_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política para permitir leitura de curtidas por todos
CREATE POLICY select_devotional_likes
  ON public.devotional_likes
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Política para permitir que usuários removam suas próprias curtidas
CREATE POLICY delete_devotional_likes
  ON public.devotional_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Criar políticas consistentes para a tabela devotional_comments
-- Política para permitir que usuários autenticados insiram comentários
CREATE POLICY insert_devotional_comments
  ON public.devotional_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política para permitir leitura de comentários por todos
CREATE POLICY select_devotional_comments
  ON public.devotional_comments
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Política para permitir que usuários editem seus próprios comentários
CREATE POLICY update_devotional_comments
  ON public.devotional_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Política para permitir que usuários removam seus próprios comentários
CREATE POLICY delete_devotional_comments
  ON public.devotional_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Adicionar políticas para administradores
-- Política para permitir que administradores gerenciem curtidas
CREATE POLICY admin_devotional_likes
  ON public.devotional_likes
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Política para permitir que administradores gerenciem comentários
CREATE POLICY admin_devotional_comments
  ON public.devotional_comments
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- 6. Verificar as políticas criadas
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