-- Script para sincronizar um usuário específico da tabela auth.users para public.users
-- Use este script quando encontrar o erro "Key (user_id) is not present in table users"

DO $$
DECLARE
    -- ⚠️ IMPORTANTE: Substitua este valor pelo seu ID de usuário (auth.uid) ⚠️
    v_user_id UUID := '194a340a-0dc1-49e8-aa0d-85e732247442';
    v_email TEXT;
    v_exists BOOLEAN;
    v_username TEXT;
    v_first_name TEXT;
    v_avatar_url TEXT;
    v_last_sign_in TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Verificar se o usuário existe em auth.users
    SELECT 
        email,
        raw_user_meta_data->>'first_name',
        raw_user_meta_data->>'avatar_url',
        last_sign_in_at,
        EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id)
    INTO 
        v_email,
        v_first_name,
        v_avatar_url,
        v_last_sign_in,
        v_exists
    FROM 
        auth.users 
    WHERE 
        id = v_user_id;
    
    IF v_email IS NULL THEN
        RAISE NOTICE '⛔ Erro: Usuário com ID % não existe em auth.users', v_user_id;
        RAISE EXCEPTION 'Usuário não encontrado em auth.users. Verifique se o ID está correto.';
    END IF;
    
    RAISE NOTICE '✅ Usuário encontrado em auth.users:';
    RAISE NOTICE '   ID: %', v_user_id;
    RAISE NOTICE '   Email: %', v_email;
    RAISE NOTICE '   First Name: %', COALESCE(v_first_name, '(não definido)');
    RAISE NOTICE '   Last Sign In: %', COALESCE(v_last_sign_in, NULL);
    
    -- Definir um nome de usuário (username) baseado no email
    v_username := SPLIT_PART(v_email, '@', 1);
    
    IF v_exists THEN
        RAISE NOTICE '🔄 Usuário já existe na tabela public.users. Atualizando...';
        
        -- Atualizar usuário existente
        UPDATE public.users
        SET 
            email = v_email,
            username = COALESCE(username, v_username),
            first_name = COALESCE(public.users.first_name, v_first_name),
            avatar_url = COALESCE(public.users.avatar_url, v_avatar_url),
            updated_at = NOW()
        WHERE 
            id = v_user_id;
            
        RAISE NOTICE '✅ Usuário % atualizado com sucesso', v_email;
    ELSE
        RAISE NOTICE '➕ Criando novo registro para o usuário % na tabela public.users', v_email;
        
        -- Inserir usuário
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
            v_user_id,
            v_email,
            v_username,
            v_first_name,
            v_avatar_url,
            'user',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Usuário % criado com sucesso', v_email;
    END IF;
    
    -- Verificar se o usuário agora existe na tabela public.users
    SELECT EXISTS (
        SELECT 1 FROM public.users WHERE id = v_user_id
    ) INTO v_exists;
    
    IF v_exists THEN
        RAISE NOTICE '✅ Verificação final: Usuário agora existe na tabela public.users';
    ELSE
        RAISE NOTICE '⛔ Erro: Mesmo após tentativa de sincronização, o usuário ainda não existe na tabela public.users';
        RAISE EXCEPTION 'Falha na sincronização. Verifique as políticas RLS da tabela public.users.';
    END IF;
END $$;

-- Verificar o resultado
SELECT 
    'Resultado da sincronização:' as info, 
    id, 
    email, 
    username, 
    role, 
    first_name,
    avatar_url,
    created_at
FROM 
    public.users 
WHERE 
    id = '194a340a-0dc1-49e8-aa0d-85e732247442'::uuid; 