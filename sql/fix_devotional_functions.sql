-- Script para corrigir funções de devocionais conforme a estrutura atual da tabela
-- A tabela não tem as colunas: author, references ou transmission_link

-- Remover as funções existentes para evitar conflitos
DROP FUNCTION IF EXISTS get_daily_devotional();
DROP FUNCTION IF EXISTS get_latest_devotional();
DROP FUNCTION IF EXISTS insert_devotional(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, DATE, TEXT, TEXT, BOOLEAN, TEXT[], TEXT);

-- Recriar a função get_daily_devotional com base nas colunas reais
CREATE OR REPLACE FUNCTION get_daily_devotional()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_devotional JSONB;
    v_author_name TEXT;
BEGIN
    -- Buscar o nome do autor a partir do ID
    SELECT COALESCE(u.first_name, u.username, 'Autor Desconhecido')
    INTO v_author_name
    FROM public.devotionals d
    LEFT JOIN public.users u ON d.author_id = u.id
    WHERE d.date = CURRENT_DATE::TEXT
    LIMIT 1;

    -- Buscar o devocional do dia atual com as colunas que existem
    SELECT jsonb_build_object(
        'id', d.id,
        'title', d.title,
        'content', d.content,
        'scripture', d.scripture,
        'scripture_text', d.scripture_text,
        'author_id', d.author_id,
        'author', v_author_name,
        'date', d.date,
        'day_of_week', d.day_of_week,
        'is_ai_generated', d.is_ai_generated,
        'image_url', d.image_url,
        'created_at', d.created_at,
        'updated_at', d.updated_at
    )
    INTO v_devotional
    FROM public.devotionals d
    WHERE d.date = CURRENT_DATE::TEXT
    LIMIT 1;
    
    -- Se não encontrou para o dia atual, retorna NULL
    IF v_devotional IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN v_devotional;
END;
$$;

-- Recriar a função get_latest_devotional com base nas colunas reais
CREATE OR REPLACE FUNCTION get_latest_devotional()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_devotional JSONB;
    v_author_name TEXT;
BEGIN
    -- Buscar o nome do autor a partir do ID para o devocional mais recente
    SELECT COALESCE(u.first_name, u.username, 'Autor Desconhecido')
    INTO v_author_name
    FROM public.devotionals d
    LEFT JOIN public.users u ON d.author_id = u.id
    ORDER BY d.created_at DESC
    LIMIT 1;

    -- Buscar o devocional mais recente com as colunas que existem
    SELECT jsonb_build_object(
        'id', d.id,
        'title', d.title,
        'content', d.content,
        'scripture', d.scripture,
        'scripture_text', d.scripture_text,
        'author_id', d.author_id,
        'author', v_author_name,
        'date', d.date,
        'day_of_week', d.day_of_week,
        'is_ai_generated', d.is_ai_generated,
        'image_url', d.image_url,
        'created_at', d.created_at,
        'updated_at', d.updated_at
    )
    INTO v_devotional
    FROM public.devotionals d
    ORDER BY d.created_at DESC
    LIMIT 1;
    
    RETURN v_devotional;
END;
$$;

-- Criar uma função para inserir devotionals com base nas colunas existentes
CREATE OR REPLACE FUNCTION insert_devotional(
    p_title TEXT,
    p_content TEXT,
    p_scripture TEXT,
    p_scripture_text TEXT,
    p_author_id UUID,
    p_date TEXT,
    p_day_of_week TEXT,
    p_image_url TEXT,
    p_is_ai_generated BOOLEAN
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Inserir o devocional apenas com as colunas que existem
    INSERT INTO public.devotionals (
        id,
        title,
        content,
        scripture,
        scripture_text,
        author_id,
        date,
        day_of_week,
        image_url,
        is_ai_generated,
        created_at,
        updated_at,
        published,
        publish_date
    ) VALUES (
        gen_random_uuid(),
        p_title,
        p_content,
        p_scripture,
        p_scripture_text,
        p_author_id,
        p_date,
        p_day_of_week,
        p_image_url,
        p_is_ai_generated,
        NOW(),
        NOW(),
        TRUE,
        NOW()
    ) RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$;

-- Conceder permissão para executar as funções
GRANT EXECUTE ON FUNCTION get_daily_devotional() TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_devotional() TO anon;
GRANT EXECUTE ON FUNCTION get_latest_devotional() TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_devotional() TO anon;
GRANT EXECUTE ON FUNCTION insert_devotional(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_devotional(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, BOOLEAN) TO anon;

-- Execute isso para testar se a função funciona corretamente
SELECT get_latest_devotional(); 