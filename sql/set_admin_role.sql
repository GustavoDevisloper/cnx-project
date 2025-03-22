-- Script para definir o usuário developer@gmail.com como administrador
-- Execução: Copie este código e execute no Console SQL do Supabase

-- Primeiro verifica se o usuário existe
DO $$
DECLARE
    user_exists BOOLEAN;
BEGIN
    -- Verificar se o usuário existe
    SELECT EXISTS(SELECT 1 FROM public.users WHERE email = 'developer@gmail.com') INTO user_exists;
    
    IF user_exists THEN
        -- Atualiza o papel do usuário para administrador
        UPDATE public.users
        SET role = 'admin'
        WHERE email = 'developer@gmail.com';
        
        RAISE NOTICE 'Usuário developer@gmail.com foi promovido para administrador com sucesso!';
    ELSE
        RAISE NOTICE 'Usuário com email developer@gmail.com não foi encontrado.';
    END IF;
END $$;

-- Visualizar o resultado após a atualização
SELECT id, email, role, username, first_name 
FROM public.users 
WHERE email = 'developer@gmail.com'; 