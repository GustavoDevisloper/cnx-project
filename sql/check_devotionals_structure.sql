-- Script para verificar a estrutura da tabela devotionals
-- Este script não faz alterações, apenas mostra informações

-- Parte 1: Verificar colunas da tabela
DO $$
BEGIN
    RAISE NOTICE '🔍 Verificando estrutura da tabela devotionals...';
END $$;

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

-- Parte 2: Verificar a existência das colunas especiais
DO $$
DECLARE
    has_references BOOLEAN;
    has_transmission_link BOOLEAN;
BEGIN
    -- Verificar coluna references
    SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'devotionals' 
        AND column_name = 'references'
    ) INTO has_references;
    
    -- Verificar coluna transmission_link
    SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'devotionals' 
        AND column_name = 'transmission_link'
    ) INTO has_transmission_link;
    
    -- Exibir resultados
    RAISE NOTICE '';
    RAISE NOTICE 'Colunas especiais:';
    RAISE NOTICE '- Coluna "references": %', CASE WHEN has_references THEN 'Presente ✅' ELSE 'Ausente ❌' END;
    RAISE NOTICE '- Coluna transmission_link: %', CASE WHEN has_transmission_link THEN 'Presente ✅' ELSE 'Ausente ❌' END;
    RAISE NOTICE '';
END $$;

-- Parte 3: Verificar funções RPC
DO $$
BEGIN
    RAISE NOTICE 'Funções RPC:';
END $$;

SELECT 
    routine_name,
    data_type AS return_type,
    routine_definition
FROM 
    information_schema.routines
WHERE 
    routine_schema = 'public'
    AND routine_name IN ('get_daily_devotional', 'get_latest_devotional', 'insert_devotional', 'get_devotional_by_id');

-- Parte 4: Verificar a definição detalhada de cada função
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Definição completa das funções:';
    RAISE NOTICE '--------------------------------------';
END $$;

-- Para ver a definição completa da função get_daily_devotional
SELECT 
    'get_daily_devotional()' AS function_name,
    pg_get_functiondef('get_daily_devotional()'::regprocedure) AS function_definition;

-- Para ver a definição completa da função get_latest_devotional
SELECT 
    'get_latest_devotional()' AS function_name,
    pg_get_functiondef('get_latest_devotional()'::regprocedure) AS function_definition;

-- Para ver a definição completa da função insert_devotional
SELECT 
    'insert_devotional()' AS function_name,
    pg_get_functiondef(oid) AS function_definition
FROM 
    pg_proc 
WHERE 
    proname = 'insert_devotional'
    AND prokind = 'f'
    AND pronamespace = 'public'::regnamespace
LIMIT 1;

-- Verificar permissões das funções
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Verificando permissões das funções...';
END $$;

SELECT 
    r.routine_name,
    p.grantee,
    p.privilege_type
FROM 
    information_schema.routines r
JOIN 
    information_schema.routine_privileges p 
    ON r.specific_name = p.specific_name
WHERE 
    r.routine_schema = 'public'
    AND r.routine_name IN ('get_daily_devotional', 'get_latest_devotional', 'insert_devotional', 'get_devotional_by_id')
ORDER BY 
    r.routine_name, 
    p.grantee;

-- Resumo final
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Verificação completa!';
    RAISE NOTICE 'Para testar o funcionamento completo, execute:';
    RAISE NOTICE 'SELECT get_latest_devotional();';
    RAISE NOTICE '';
END $$; 