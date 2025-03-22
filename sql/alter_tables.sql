-- Adicionar uma coluna para armazenar a senha criptografada
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Comentário para a coluna
COMMENT ON COLUMN public.users.password_hash IS 'Hash da senha do usuário para autenticação';

-- Remover a restrição de chave única que está causando problemas (se existir)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS freefire_username_key;

-- Garantir que as políticas de segurança estão corretas
-- Remover as políticas existentes primeiro para evitar duplicação
DROP POLICY IF EXISTS users_insert_policy ON public.users;
DROP POLICY IF EXISTS users_select_policy ON public.users;
DROP POLICY IF EXISTS users_update_policy ON public.users;

-- Criar as políticas novamente
CREATE POLICY users_insert_policy 
  ON public.users 
  FOR INSERT 
  TO anon 
  WITH CHECK (true);
  
-- Política para permitir leitura de dados públicos
CREATE POLICY users_select_policy
  ON public.users
  FOR SELECT
  USING (true);

-- Política para permitir que os usuários editem seus próprios dados
CREATE POLICY users_update_policy
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

-- Garantir que a tabela tem RLS ativado
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY; 