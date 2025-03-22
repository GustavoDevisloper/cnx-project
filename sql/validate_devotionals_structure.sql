-- Script para validar e garantir a estrutura completa da tabela devotionals
-- Baseado na estrutura fornecida pelo usuário

DO $$
DECLARE
    column_exists BOOLEAN;
    array_type_exists BOOLEAN;
BEGIN
    RAISE NOTICE '🔍 Iniciando validação da estrutura da tabela devotionals...';
    
    -- Verificar se a tabela existe
    IF NOT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'devotionals'
    ) THEN
        RAISE EXCEPTION 'A tabela devotionals não existe. Execute primeiro o script de criação da tabela.';
    END IF;
    
    -- Verificar e adicionar a coluna "references" se não existir
    SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'devotionals' 
        AND column_name = 'references'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adicionando coluna "references" (TEXT[]) à tabela...';
        EXECUTE 'ALTER TABLE public.devotionals ADD COLUMN "references" TEXT[] DEFAULT NULL';
    ELSE
        RAISE NOTICE 'Coluna "references" já existe.';
    END IF;
    
    -- Verificar e adicionar a coluna transmission_link se não existir
    SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'devotionals' 
        AND column_name = 'transmission_link'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adicionando coluna transmission_link (TEXT) à tabela...';
        ALTER TABLE public.devotionals ADD COLUMN transmission_link TEXT DEFAULT NULL;
    ELSE
        RAISE NOTICE 'Coluna transmission_link já existe.';
    END IF;
    
    -- Listar todas as colunas para verificação
    RAISE NOTICE 'Estrutura atual da tabela devotionals:';
END $$;

-- Mostrar estrutura atualizada da tabela
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

-- Atualizar as funções RPC para garantir que usem todas as colunas
DROP FUNCTION IF EXISTS get_daily_devotional();
DROP FUNCTION IF EXISTS get_latest_devotional();
DROP FUNCTION IF EXISTS insert_devotional(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, BOOLEAN);

-- Função para obter o devocional do dia atual
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

    -- Buscar o devocional do dia atual com todas as colunas
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
        'updated_at', d.updated_at,
        'references', d."references",
        'transmission_link', d.transmission_link
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

-- Função para obter o devocional mais recente
CREATE OR REPLACE FUNCTION get_latest_devotional()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_devotional JSONB;
    v_author_name TEXT;
BEGIN
    -- Buscar o nome do autor para o devocional mais recente
    SELECT COALESCE(u.first_name, u.username, 'Autor Desconhecido')
    INTO v_author_name
    FROM public.devotionals d
    LEFT JOIN public.users u ON d.author_id = u.id
    ORDER BY d.created_at DESC
    LIMIT 1;

    -- Buscar o devocional mais recente com todas as colunas
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
        'updated_at', d.updated_at,
        'references', d."references",
        'transmission_link', d.transmission_link
    )
    INTO v_devotional
    FROM public.devotionals d
    ORDER BY d.created_at DESC
    LIMIT 1;
    
    RETURN v_devotional;
END;
$$;

-- Função para inserir um novo devocional com todas as colunas
CREATE OR REPLACE FUNCTION insert_devotional(
    p_title TEXT,
    p_content TEXT,
    p_scripture TEXT,
    p_scripture_text TEXT,
    p_author_id UUID,
    p_date TEXT,
    p_day_of_week TEXT,
    p_image_url TEXT,
    p_is_ai_generated BOOLEAN,
    p_references TEXT[] DEFAULT NULL,
    p_transmission_link TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Inserir o devocional com todas as colunas
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
        publish_date,
        "references",
        transmission_link
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
        NOW(),
        p_references,
        p_transmission_link
    ) RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$;

-- Conceder permissões para as funções
GRANT EXECUTE ON FUNCTION get_daily_devotional() TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_devotional() TO anon;
GRANT EXECUTE ON FUNCTION get_latest_devotional() TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_devotional() TO anon;
GRANT EXECUTE ON FUNCTION insert_devotional(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, BOOLEAN, TEXT[], TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_devotional(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, BOOLEAN, TEXT[], TEXT) TO anon;

-- Função auxiliar para obter um devocional com todas as colunas
CREATE OR REPLACE FUNCTION get_devotional_by_id(p_devotional_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_devotional JSONB;
    v_author_name TEXT;
BEGIN
    -- Buscar o nome do autor
    SELECT COALESCE(u.first_name, u.username, 'Autor Desconhecido')
    INTO v_author_name
    FROM public.devotionals d
    LEFT JOIN public.users u ON d.author_id = u.id
    WHERE d.id = p_devotional_id
    LIMIT 1;

    -- Buscar o devocional completo
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
        'updated_at', d.updated_at,
        'references', d."references",
        'transmission_link', d.transmission_link
    )
    INTO v_devotional
    FROM public.devotionals d
    WHERE d.id = p_devotional_id;
    
    RETURN v_devotional;
END;
$$;

GRANT EXECUTE ON FUNCTION get_devotional_by_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_devotional_by_id(UUID) TO anon;

-- Informações sobre o script
DO $$
BEGIN
    RAISE NOTICE '
✅ Script de validação executado com sucesso!

Este script garantiu que:
1. A tabela devotionals tem todas as colunas necessárias:
   - Colunas originais (id, title, content, etc.)
   - Coluna "references" (TEXT[])
   - Coluna transmission_link (TEXT)

2. Funções RPC foram atualizadas para trabalhar com todas as colunas:
   - get_daily_devotional()
   - get_latest_devotional()
   - insert_devotional()
   - get_devotional_by_id() (função auxiliar)

Para testar o funcionamento, execute:
SELECT get_latest_devotional();
';
END $$; 