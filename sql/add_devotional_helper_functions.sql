-- Script para adicionar funções auxiliares para manipulação de devocionais
-- Este script cria funções para obter e inserir devocionais tratando a coluna "references" corretamente

-- Função para obter devocional com referencias carregadas corretamente
CREATE OR REPLACE FUNCTION get_devotional_with_references(p_devotional_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_result JSONB;
BEGIN
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
        'transmission_link', d.transmission_link,
        'created_at', d.created_at,
        'updated_at', d.updated_at,
        'likes', (SELECT COUNT(*) FROM devotional_likes WHERE devotional_id = d.id)
    ) INTO v_result
    FROM public.devotionals d
    WHERE d.id = p_devotional_id;
    
    RETURN v_result;
END;
$$;

-- Função para inserir um novo devocional incluindo referências
CREATE OR REPLACE FUNCTION insert_devotional(
    p_title TEXT,
    p_content TEXT,
    p_scripture TEXT,
    p_scripture_text TEXT,
    p_author TEXT,
    p_author_id UUID,
    p_date DATE,
    p_day_of_week TEXT,
    p_image_url TEXT,
    p_is_ai_generated BOOLEAN,
    p_references TEXT[],
    p_transmission_link TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Inserir o devocional com a coluna references entre aspas
    INSERT INTO public.devotionals (
        id,
        title,
        content,
        scripture,
        scripture_text,
        author,
        author_id,
        date,
        day_of_week,
        image_url,
        is_ai_generated,
        "references",
        transmission_link,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        p_title,
        p_content,
        p_scripture,
        p_scripture_text,
        p_author,
        p_author_id,
        p_date,
        p_day_of_week,
        p_image_url,
        p_is_ai_generated,
        p_references,
        p_transmission_link,
        NOW(),
        NOW()
    ) RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$;

-- Conceder permissões para as funções
GRANT EXECUTE ON FUNCTION get_devotional_with_references(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_devotional_with_references(UUID) TO anon;
GRANT EXECUTE ON FUNCTION insert_devotional(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, DATE, TEXT, TEXT, BOOLEAN, TEXT[], TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_devotional(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, DATE, TEXT, TEXT, BOOLEAN, TEXT[], TEXT) TO anon;

-- Verificar a definição das funções
SELECT pg_get_functiondef('get_devotional_with_references(UUID)'::regprocedure);
SELECT pg_get_functiondef('insert_devotional(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, DATE, TEXT, TEXT, BOOLEAN, TEXT[], TEXT)'::regprocedure); 