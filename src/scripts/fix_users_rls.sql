-- Script para corrigir as políticas RLS da tabela users
-- Execute este script no SQL Editor do Supabase

-- 1. Desabilitar temporariamente RLS para permitir a criação de usuário sem restrições
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. Limpar todas as políticas existentes que podem estar causando conflitos
DO $$
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END
$$;

-- 3. Criar novas políticas simples e sem recursão

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

-- 4. Habilitar RLS novamente com as novas políticas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 5. Garantir que as permissões do schema estão corretas
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- 6. Verificar se existe a função trigger e corrigir se necessário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- 7. Verificar se existe o trigger e corrigir se necessário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 