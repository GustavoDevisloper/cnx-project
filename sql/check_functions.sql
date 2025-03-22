-- Script para verificar as funções do sistema de devocionais
-- Este script verifica a existência e a estrutura das funções

-- 1. Verificar as funções existentes
SELECT 
    routine_name,
    routine_type,
    data_type AS return_type,
    pg_get_functiondef(pg_proc.oid) AS function_definition
FROM 
    information_schema.routines
JOIN 
    pg_proc ON routines.routine_name = pg_proc.proname
WHERE 
    routine_schema = 'public'
    AND routine_name IN (
        'count_devotional_likes', 
        'has_user_liked_devotional', 
        'add_devotional_comment'
    );

-- 2. Verificar as permissões das funções
SELECT 
    p.proname AS function_name,
    pg_get_userbyid(p.proowner) AS function_owner,
    CASE WHEN has_function_privilege('anon', p.oid, 'execute') 
         THEN 'sim' ELSE 'não' END AS anon_execute,
    CASE WHEN has_function_privilege('authenticated', p.oid, 'execute') 
         THEN 'sim' ELSE 'não' END AS auth_execute,
    CASE WHEN has_function_privilege('service_role', p.oid, 'execute') 
         THEN 'sim' ELSE 'não' END AS service_execute
FROM 
    pg_proc p
WHERE 
    p.proname IN (
        'count_devotional_likes', 
        'has_user_liked_devotional', 
        'add_devotional_comment'
    )
    AND pg_function_is_visible(p.oid);

-- 3. Verificar as tabelas relacionadas
SELECT 
    table_name, 
    table_type
FROM 
    information_schema.tables
WHERE 
    table_schema = 'public' 
    AND table_name IN ('devotional_likes', 'devotional_comments')
ORDER BY 
    table_name;

-- 4. Testar as funções com valores simulados
DO $$
DECLARE
    v_devotional_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID;
    v_user_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'::UUID;
    v_result INTEGER;
    v_bool_result BOOLEAN;
BEGIN
    RAISE NOTICE 'Testando a função count_devotional_likes...';
    v_result := count_devotional_likes(v_devotional_id);
    RAISE NOTICE 'count_devotional_likes retornou: %', v_result;
    
    RAISE NOTICE 'Testando a função has_user_liked_devotional...';
    v_bool_result := has_user_liked_devotional(v_devotional_id, v_user_id);
    RAISE NOTICE 'has_user_liked_devotional retornou: %', v_bool_result;
    
    -- Não testamos add_devotional_comment para evitar inserir dados
    
    RAISE NOTICE 'Testes concluídos!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao testar funções: %', SQLERRM;
END $$; 