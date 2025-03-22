-- Script de diagnóstico para problemas de sincronização de usuários
-- Este script ajudará a identificar e resolver problemas comuns
-- relacionados à sincronização de usuários entre auth.users e public.users

-- Parte 1: Verificar tabela public.users
DO $$
DECLARE
    table_exists BOOLEAN;
    fk_constraint TEXT;
BEGIN
    RAISE NOTICE '== 🔍 DIAGNÓSTICO DE SINCRONIZAÇÃO DE USUÁRIOS ==';
    
    -- 1.1 Verificar se a tabela public.users existe
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE '❌ ERRO: A tabela public.users não existe!';
        RAISE NOTICE '   Solução: Execute o script sync_users_tables.sql para criar a tabela.';
        RETURN;
    ELSE
        RAISE NOTICE '✅ Tabela public.users existe';
    END IF;
    
    -- 1.2 Verificar estrutura da tabela
    RAISE NOTICE '📋 Estrutura da tabela public.users:';
    RAISE NOTICE '-----------------------------------';
END $$;

-- Lista estrutura da tabela users
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' 
    AND table_name = 'users'
ORDER BY 
    ordinal_position;

-- Parte 2: Verificar políticas RLS
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📜 Políticas RLS para a tabela public.users:';
    RAISE NOTICE '-----------------------------------';
END $$;

SELECT
    polname AS policy_name,
    polcmd AS command,
    polpermissive AS permissive,
    polroles::text AS roles,
    pg_get_expr(polqual, polrelid) AS using_expression
FROM
    pg_policy
WHERE
    polrelid = 'public.users'::regclass;

-- Parte 3: Verificar o usuário específico
DO $$
DECLARE
    -- Substitua pelo ID do usuário que está tendo problemas
    v_user_id UUID := '194a340a-0dc1-49e8-aa0d-85e732247442';
    v_auth_exists BOOLEAN;
    v_public_exists BOOLEAN;
    v_auth_email TEXT;
    v_public_email TEXT;
    v_role TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '👤 Verificação do usuário específico:';
    RAISE NOTICE '-----------------------------------';
    
    -- Verificar existência em auth.users
    SELECT 
        EXISTS(SELECT 1 FROM auth.users WHERE id = v_user_id),
        email
    INTO 
        v_auth_exists,
        v_auth_email
    FROM 
        auth.users 
    WHERE 
        id = v_user_id;
    
    -- Verificar existência em public.users
    SELECT 
        EXISTS(SELECT 1 FROM public.users WHERE id = v_user_id),
        email,
        role
    INTO 
        v_public_exists,
        v_public_email,
        v_role
    FROM 
        public.users 
    WHERE 
        id = v_user_id;
    
    IF v_auth_exists THEN
        RAISE NOTICE '✅ Usuário existe em auth.users';
        RAISE NOTICE '   Email: %', v_auth_email;
    ELSE
        RAISE NOTICE '❌ Usuário NÃO existe em auth.users!';
        RAISE NOTICE '   Solução: Verifique se o ID de usuário está correto.';
    END IF;
    
    IF v_public_exists THEN
        RAISE NOTICE '✅ Usuário existe em public.users';
        RAISE NOTICE '   Email: %', v_public_email;
        RAISE NOTICE '   Role: %', v_role;
    ELSE
        RAISE NOTICE '❌ Usuário NÃO existe em public.users!';
        IF v_auth_exists THEN
            RAISE NOTICE '   Solução: Execute o script sync_current_user.sql.';
        ELSE
            RAISE NOTICE '   Solução: Primeiro, verifique se o ID está correto.';
        END IF;
    END IF;
END $$;

-- Parte 4: Verificar restrições de chave estrangeira
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔑 Restrições de chave estrangeira relevantes:';
    RAISE NOTICE '-----------------------------------';
END $$;

SELECT 
    conrelid::regclass AS table_name,
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM 
    pg_constraint
WHERE 
    contype = 'f' 
    AND (conrelid = 'public.event_attendances'::regclass 
         OR conrelid = 'public.event_messages'::regclass)
    AND pg_get_constraintdef(oid) LIKE '%users%';

-- Parte 5: Verificar RLS nas tabelas relacionadas
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔒 RLS nas tabelas relacionadas:';
    RAISE NOTICE '-----------------------------------';
END $$;

SELECT
    c.relname AS table_name,
    c.relrowsecurity AS rls_enabled
FROM
    pg_class c
JOIN
    pg_namespace n ON n.oid = c.relnamespace
WHERE
    n.nspname = 'public'
    AND c.relname IN ('event_attendances', 'event_messages', 'users');

-- Parte 6: Status da execução
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Diagnóstico concluído!';
    RAISE NOTICE 'Use as informações acima para resolver problemas de sincronização de usuários.';
    RAISE NOTICE 'Se o usuário não existir em public.users, execute o script sync_current_user.sql.';
END $$;
