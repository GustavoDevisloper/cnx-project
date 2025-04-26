-- Script para testar e diagnosticar a estrutura das tabelas de usuários
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a tabela users existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
) AS users_table_exists;

-- 2. Verificar a estrutura da tabela users
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

-- 3. Verificar quantos usuários existem na tabela
SELECT count(*) FROM users;

-- 4. Verificar os primeiros 5 usuários 
SELECT 
    id, 
    username, 
    display_name, 
    avatar_url, 
    followers_count,
    role,
    created_at
FROM 
    users
LIMIT 5;

-- 5. Verificar se a tabela followers existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'followers'
) AS followers_table_exists;

-- 6. Verificar a estrutura da tabela followers, se existir
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'followers'
ORDER BY 
    ordinal_position;

-- 7. Verificar se a função is_following existe
SELECT 
    routine_name, 
    routine_type
FROM 
    information_schema.routines
WHERE 
    routine_schema = 'public' 
    AND routine_name = 'is_following';

-- 8. Verificar se a função suggest_users_to_follow existe
SELECT 
    routine_name, 
    routine_type
FROM 
    information_schema.routines
WHERE 
    routine_schema = 'public' 
    AND routine_name = 'suggest_users_to_follow';

-- 9. Ver os argumentos e tipo de retorno da função suggest_users_to_follow
SELECT
    p.proname AS function_name,
    pg_get_function_result(p.oid) AS result_type,
    pg_get_function_arguments(p.oid) AS argument_types
FROM
    pg_proc p
JOIN
    pg_namespace n ON p.pronamespace = n.oid
WHERE
    n.nspname = 'public'
    AND p.proname = 'suggest_users_to_follow';

-- 10. Verificar os papéis (roles) disponíveis para usuários
SELECT DISTINCT role FROM users; 