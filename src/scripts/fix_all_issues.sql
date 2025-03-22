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

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE 'Script de correção concluído!';
END
$$; 