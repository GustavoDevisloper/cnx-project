-- Script para corrigir problemas com a coluna "references" na tabela devotionals
-- Este script verifica a existência da coluna e a renomeia de forma segura,
-- bem como atualiza as funções relacionadas

DO $$
DECLARE
    column_exists_unquoted BOOLEAN;
    column_exists_quoted BOOLEAN;
BEGIN
    -- Verificar se a tabela existe
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'devotionals'
    ) THEN
        RAISE EXCEPTION 'A tabela devotionals não existe!';
    END IF;

    -- Verificar se a coluna 'references' existe (sem aspas)
    SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'devotionals' 
        AND column_name = 'references'
    ) INTO column_exists_unquoted;

    -- Verificar se a coluna "references" existe (com aspas)
    SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'devotionals' 
        AND column_name = '"references"'
    ) INTO column_exists_quoted;

    -- Se a coluna existe sem aspas, renomeá-la para usar aspas
    IF column_exists_unquoted THEN
        RAISE NOTICE 'Renomeando coluna references para "references"...';
        
        -- Usar a sintaxe correta para renomear a coluna
        EXECUTE 'ALTER TABLE public.devotionals RENAME COLUMN "references" TO "references"';
        
        RAISE NOTICE 'Coluna renomeada com sucesso.';
    ELSIF column_exists_quoted THEN
        RAISE NOTICE 'A coluna já está corretamente nomeada como "references".';
    ELSE
        RAISE NOTICE 'A coluna references não foi encontrada na tabela.';
    END IF;

END $$;

-- Remover as funções existentes para evitar conflitos
DROP FUNCTION IF EXISTS get_daily_devotional();
DROP FUNCTION IF EXISTS get_latest_devotional();

-- Recriar a função get_daily_devotional para trabalhar com a coluna references escapada
CREATE OR REPLACE FUNCTION get_daily_devotional()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_devotional JSONB;
BEGIN
    -- Buscar o devocional do dia atual
    SELECT jsonb_build_object(
        'id', d.id,
        'title', d.title,
        'content', d.content,
        'scripture', d.scripture,
        'scripture_text', d.scripture_text,
        'author', d.author,
        'author_id', d.author_id,
        'date', d.date,
        'day_of_week', d.day_of_week,
        'is_ai_generated', d.is_ai_generated,
        'references', d."references",
        'image_url', d.image_url,
        'transmission_link', d.transmission_link
    )
    INTO v_devotional
    FROM public.devotionals d
    WHERE d.date = CURRENT_DATE
    LIMIT 1;
    
    -- Se não encontrou para o dia atual, retorna NULL
    IF v_devotional IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN v_devotional;
END;
$$;

-- Recriar a função get_latest_devotional para trabalhar com a coluna references escapada
CREATE OR REPLACE FUNCTION get_latest_devotional()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_devotional JSONB;
BEGIN
    -- Buscar o devocional mais recente
    SELECT jsonb_build_object(
        'id', d.id,
        'title', d.title,
        'content', d.content,
        'scripture', d.scripture,
        'scripture_text', d.scripture_text,
        'author', d.author,
        'author_id', d.author_id,
        'date', d.date,
        'day_of_week', d.day_of_week,
        'is_ai_generated', d.is_ai_generated,
        'references', d."references",
        'image_url', d.image_url,
        'transmission_link', d.transmission_link
    )
    INTO v_devotional
    FROM public.devotionals d
    ORDER BY d.date DESC
    LIMIT 1;
    
    RETURN v_devotional;
END;
$$;

-- Conceder permissão para executar as funções
GRANT EXECUTE ON FUNCTION get_daily_devotional() TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_devotional() TO anon;
GRANT EXECUTE ON FUNCTION get_latest_devotional() TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_devotional() TO anon;

-- Verificar definições das funções
SELECT pg_get_functiondef('get_daily_devotional()'::regprocedure);
SELECT pg_get_functiondef('get_latest_devotional()'::regprocedure); 