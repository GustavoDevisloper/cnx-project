-- Adicionar o campo last_login à tabela users
ALTER TABLE public.users 
ADD COLUMN last_login TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.users.last_login IS 'Data e hora do último login do usuário';

-- Atualizar políticas RLS para permitir atualização do campo last_login
CREATE POLICY "Permitir atualizar last_login" ON public.users 
FOR UPDATE TO authenticated 
USING (id = auth.uid()) 
WITH CHECK (id = auth.uid());

-- Exemplo de atualização para testar
-- UPDATE public.users SET last_login = NOW() WHERE id = 'id-do-usuario'; 