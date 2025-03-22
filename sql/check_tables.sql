-- Script para verificar tabelas relacionadas a devocionais

-- Verificar tabelas no esquema public
SELECT 
    table_name, 
    table_type
FROM 
    information_schema.tables
WHERE 
    table_schema = 'public' 
    AND table_name IN ('devotionals', 'devotional_likes', 'devotional_comments')
ORDER BY 
    table_name;

-- Verificar colunas da tabela devotionals
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'devotionals'
ORDER BY 
    ordinal_position;

-- Verificar funções relacionadas a devocionais
SELECT 
    proname AS function_name,
    pg_get_function_result(oid) AS result_type
FROM 
    pg_proc 
WHERE 
    pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND proname IN (
        'get_daily_devotional', 
        'get_latest_devotional', 
        'count_devotional_likes', 
        'has_user_liked_devotional'
    )
ORDER BY 
    proname; 