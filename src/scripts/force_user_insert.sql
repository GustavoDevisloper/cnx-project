-- Script para forçar a inserção de um usuário na tabela public.users
-- Use este script apenas quando outras tentativas falharem
-- Este script usa uma função SECURITY DEFINER para contornar políticas RLS

-- Remover a função caso já exista
DROP FUNCTION IF EXISTS force_user_insert(UUID);

-- Criar a função com privilégios elevados
CREATE OR REPLACE FUNCTION force_user_insert(
    p_user_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios do proprietário da função
AS $$
DECLARE
    v_email TEXT;
    v_username TEXT;
    v_first_name TEXT;
    v_avatar_url TEXT;
    v_result TEXT;
BEGIN
    -- Buscar dados do usuário em auth.users
    SELECT 
        email,
        raw_user_meta_data->>'first_name',
        raw_user_meta_data->>'avatar_url'
    INTO 
        v_email,
        v_first_name,
        v_avatar_url
    FROM 
        auth.users 
    WHERE 
        id = p_user_id;
        
    IF v_email IS NULL THEN
        RETURN 'Erro: Usuário não encontrado em auth.users';
    END IF;
    
    -- Gerar um nome de usuário a partir do email
    v_username := SPLIT_PART(v_email, '@', 1);
    
    -- Remover o usuário se já existir
    DELETE FROM public.users WHERE id = p_user_id;
    
    -- Inserir o usuário com privilégios elevados
    INSERT INTO public.users (
        id, 
        email, 
        username, 
        first_name,
        avatar_url,
        role, 
        created_at, 
        updated_at
    ) VALUES (
        p_user_id,
        v_email,
        v_username,
        v_first_name,
        v_avatar_url,
        'user',  -- Default role
        NOW(),
        NOW()
    );
    
    v_result := 'Usuário ' || v_email || ' inserido com sucesso usando privilégios elevados';
    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RETURN 'Erro ao inserir usuário: ' || SQLERRM;
END;
$$;

-- Conceder permissão para execução da função
GRANT EXECUTE ON FUNCTION force_user_insert TO authenticated;
GRANT EXECUTE ON FUNCTION force_user_insert TO anon;

-- Execute esta linha para forçar a inserção de um usuário específico
-- Substitua o UUID pelo ID do seu usuário
SELECT force_user_insert('194a340a-0dc1-49e8-aa0d-85e732247442') AS resultado;

-- Verificar se o usuário existe agora
SELECT 
    id, 
    email, 
    username, 
    role, 
    created_at
FROM 
    public.users 
WHERE 
    id = '194a340a-0dc1-49e8-aa0d-85e732247442'; 