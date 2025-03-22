-- Esta tabela não é mais necessária, mas mantemos o código como referência
/*
-- Tabela para armazenar usuários temporários durante o processo de magic link
CREATE TABLE IF NOT EXISTS public.temp_users (
  temp_id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  phone_number TEXT,
  username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Configurar RLS para a tabela temp_users
ALTER TABLE public.temp_users ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso anônimo para inserção
CREATE POLICY temp_users_insert_policy ON public.temp_users 
  FOR INSERT TO anon 
  WITH CHECK (true);

-- Política para leitura por usuário autenticado baseado no email  
CREATE POLICY temp_users_select_policy ON public.temp_users 
  FOR SELECT TO authenticated 
  USING (auth.uid() IN (SELECT auth.uid() FROM auth.users WHERE email = temp_users.email));

-- Política para permitir que operações administrativas sejam realizadas
CREATE POLICY temp_users_admin_policy ON public.temp_users 
  FOR ALL TO service_role 
  USING (true);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_temp_users_email ON public.temp_users(email);
CREATE INDEX IF NOT EXISTS idx_temp_users_username ON public.temp_users(username);
CREATE INDEX IF NOT EXISTS idx_temp_users_status ON public.temp_users(status);

-- Comentários para documentação
COMMENT ON TABLE public.temp_users IS 'Tabela para armazenar dados de usuários temporários durante o fluxo de confirmação por email';
COMMENT ON COLUMN public.temp_users.temp_id IS 'ID temporário até que o auth.user seja criado';
COMMENT ON COLUMN public.temp_users.status IS 'Status do usuário: pending, confirmed, expired';
*/ 