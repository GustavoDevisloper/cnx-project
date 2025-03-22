-- Script para corrigir problemas com a tabela "users" e políticas RLS

-- 1. Primeiro, desativar RLS para permitir as operações
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas existentes que possam estar causando recursão infinita
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;
DROP POLICY IF EXISTS "Leaders can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can update any profile" ON users;
DROP POLICY IF EXISTS "Allow insert during signup" ON users;
DROP POLICY IF EXISTS "enable_read_access" ON users;
DROP POLICY IF EXISTS "enable_insert_access" ON users;
DROP POLICY IF EXISTS "enable_update_access" ON users;
DROP POLICY IF EXISTS "enable_all_authenticated_read" ON users;
DROP POLICY IF EXISTS "enable_self_insert" ON users;
DROP POLICY IF EXISTS "enable_self_update" ON users;

-- 3. Remover e recriar a trigger para garantir que esteja correta
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 4. Recriar a função handle_new_user de forma mais segura
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER SECURITY DEFINER
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

-- 5. Recriar a trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Verificar e atualizar a tabela users se necessário
DO $$
BEGIN
  -- Adicionar colunas que possam estar faltando
  BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao adicionar coluna phone_number: %', SQLERRM;
  END;
  
  BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao adicionar coluna first_name: %', SQLERRM;
  END;
END
$$;

-- 7. Reativar RLS com políticas simplificadas e seguras
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 8. Criar políticas não-recursivas simples
CREATE POLICY "users_read_policy"
ON users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "users_insert_policy"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_policy"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "users_delete_policy"
ON users FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- 9. Garantir permissões adequadas
GRANT ALL ON public.users TO authenticated, anon, service_role; 