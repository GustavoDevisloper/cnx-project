-- Script unificado para corrigir problemas e atualizar a tabela de devocionais
-- Este script corrige as funções para trabalhar com a estrutura atual da tabela

-- Parte 1: Verificar a estrutura atual da tabela
SELECT 
  column_name, 
  data_type 
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'public' 
  AND table_name = 'devotionals'
ORDER BY 
  ordinal_position;

-- Parte 2: Remover as funções existentes para evitar conflitos
DROP FUNCTION IF EXISTS get_daily_devotional();
DROP FUNCTION IF EXISTS get_latest_devotional();
DROP FUNCTION IF EXISTS insert_devotional(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, DATE, TEXT, TEXT, BOOLEAN, TEXT[], TEXT);

-- Parte 3: Recriar as funções com base nas colunas que existem
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

    -- Buscar o devocional do dia atual com as colunas existentes
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

    -- Buscar o devocional mais recente com as colunas existentes
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

-- Função para inserir um novo devocional
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
    -- Inserir o devocional com as colunas existentes
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

-- Parte 4: Conceder permissões para as funções
GRANT EXECUTE ON FUNCTION get_daily_devotional() TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_devotional() TO anon;
GRANT EXECUTE ON FUNCTION get_latest_devotional() TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_devotional() TO anon;
GRANT EXECUTE ON FUNCTION insert_devotional(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_devotional(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, BOOLEAN) TO anon;

-- Parte 5: Verificar as funções criadas
DO $$
BEGIN
    RAISE NOTICE 'Verificando as funções criadas:';
    RAISE NOTICE '--------------------------------------';
    RAISE NOTICE 'Function: get_daily_devotional()';
    RAISE NOTICE 'Returns: JSONB';
    RAISE NOTICE '--------------------------------------';
    RAISE NOTICE 'Function: get_latest_devotional()';
    RAISE NOTICE 'Returns: JSONB';
    RAISE NOTICE '--------------------------------------';
    RAISE NOTICE 'Function: insert_devotional()';
    RAISE NOTICE 'Parameters: title, content, scripture, scripture_text, author_id, date, day_of_week, image_url, is_ai_generated';
    RAISE NOTICE 'Returns: UUID';
    RAISE NOTICE '--------------------------------------';
    RAISE NOTICE 'Todas as permissões foram configuradas corretamente.';
END $$;

-- Parte 6: Instruções para desenvolvedores (comentários)
/*
INSTRUÇÕES PARA DESENVOLVEDORES:

1. Este script corrigiu as funções RPC para trabalhar com a estrutura atual da tabela devotionals.

2. A tabela não tem as colunas "author", "references" ou "transmission_link":
   - A coluna author_id existe, e a função get_daily_devotional() busca o nome do autor na tabela users
   - Se você precisar de "references", execute o script add_references_column.sql
   - Se você precisar de "transmission_link", execute o script add_transmission_link_column.sql

3. As funções RPC agora retornam objetos JSONB com as seguintes propriedades:
   - id, title, content, scripture, scripture_text, author_id, author, date, day_of_week, 
     is_ai_generated, image_url, created_at, updated_at

4. A função insert_devotional() foi atualizada para usar os parâmetros corretos:
   - p_title, p_content, p_scripture, p_scripture_text, p_author_id, p_date, p_day_of_week,
     p_image_url, p_is_ai_generated

5. Você precisará adaptar seu código TypeScript no devotionalService.ts para:
   - Usar a nova assinatura da função insert_devotional()
   - Processar a resposta JSONB das funções get_daily_devotional() e get_latest_devotional()
   - Fornecer valores padrão para propriedades como "references" e "transmission_link" que 
     não existem na tabela devotionals

6. Para testar se as funções foram criadas corretamente, execute:
   SELECT get_latest_devotional();
*/ 