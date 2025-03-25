-- Função para obter o devocional do dia ou o mais recente
CREATE OR REPLACE FUNCTION get_daily_devotional()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  result_devotional JSONB;
  has_verse BOOLEAN;
BEGIN
  -- Verificar quais colunas existem na tabela
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='devotionals' AND column_name='verse'
  ) INTO has_verse;
  
  -- Tenta buscar o devocional para a data atual
  IF has_verse THEN
    SELECT jsonb_build_object(
      'id', d.id,
      'title', d.title,
      'content', d.content,
      'scripture', d.verse, -- Mapeando para o nome na aplicação
      'verse', d.verse,
      'verse_reference', d.verse_reference,
      'date', d.date,
      'author_id', d.author_id,
      'theme', COALESCE(d.theme, ''),
      'image_url', COALESCE(d.image_url, ''),
      'references', COALESCE(d."references", '{}'),
      'transmission_link', COALESCE(d.transmission_link, '')
    ) INTO result_devotional
    FROM devotionals d
    WHERE d.date = today_date
    ORDER BY d.created_at DESC
    LIMIT 1;
  ELSE
    -- Caso não encontre as colunas esperadas, usar uma query simples
    SELECT jsonb_build_object(
      'id', d.id,
      'title', d.title,
      'content', d.content,
      'date', d.date
    ) INTO result_devotional
    FROM devotionals d
    WHERE d.date = today_date
    ORDER BY d.created_at DESC
    LIMIT 1;
  END IF;
  
  -- Se não encontrou para hoje, retorna o mais recente
  IF result_devotional IS NULL THEN
    IF has_verse THEN
      SELECT jsonb_build_object(
        'id', d.id,
        'title', d.title,
        'content', d.content,
        'scripture', d.verse,
        'verse', d.verse,
        'verse_reference', d.verse_reference,
        'date', d.date,
        'author_id', d.author_id,
        'theme', COALESCE(d.theme, ''),
        'image_url', COALESCE(d.image_url, ''),
        'references', COALESCE(d."references", '{}'),
        'transmission_link', COALESCE(d.transmission_link, '')
      ) INTO result_devotional
      FROM devotionals d
      ORDER BY d.date DESC, d.created_at DESC
      LIMIT 1;
    ELSE
      -- Caso não encontre as colunas esperadas, usar uma query simples
      SELECT jsonb_build_object(
        'id', d.id,
        'title', d.title,
        'content', d.content,
        'date', d.date
      ) INTO result_devotional
      FROM devotionals d
      ORDER BY d.date DESC, d.created_at DESC
      LIMIT 1;
    END IF;
  END IF;
  
  RETURN result_devotional;
END;
$$;

-- Função para obter o devocional mais recente
CREATE OR REPLACE FUNCTION get_latest_devotional()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result_devotional JSONB;
  has_verse BOOLEAN;
BEGIN
  -- Verificar quais colunas existem na tabela
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='devotionals' AND column_name='verse'
  ) INTO has_verse;
  
  -- Adaptar a consulta com base nas colunas existentes
  IF has_verse THEN
    SELECT jsonb_build_object(
      'id', d.id,
      'title', d.title,
      'content', d.content,
      'scripture', d.verse,
      'verse', d.verse,
      'verse_reference', d.verse_reference,
      'date', d.date,
      'author_id', d.author_id,
      'theme', COALESCE(d.theme, ''),
      'image_url', COALESCE(d.image_url, ''),
      'references', COALESCE(d."references", '{}'),
      'transmission_link', COALESCE(d.transmission_link, '')
    ) INTO result_devotional
    FROM devotionals d
    ORDER BY d.date DESC, d.created_at DESC
    LIMIT 1;
  ELSE
    -- Caso não encontre as colunas esperadas, usar uma query simples
    SELECT jsonb_build_object(
      'id', d.id,
      'title', d.title,
      'content', d.content,
      'date', d.date
    ) INTO result_devotional
    FROM devotionals d
    ORDER BY d.date DESC, d.created_at DESC
    LIMIT 1;
  END IF;
  
  RETURN result_devotional;
END;
$$;

-- Função para listar devocionais por período
CREATE OR REPLACE FUNCTION get_devotionals_by_range(start_date DATE, end_date DATE)
RETURNS JSONB[]
LANGUAGE plpgsql
AS $$
DECLARE
  result_devotionals JSONB[];
  has_verse BOOLEAN;
BEGIN
  -- Verificar quais colunas existem na tabela
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='devotionals' AND column_name='verse'
  ) INTO has_verse;
  
  -- Buscar devocionais no intervalo de datas
  IF has_verse THEN
    SELECT array_agg(jsonb_build_object(
      'id', d.id,
      'title', d.title,
      'content', d.content,
      'scripture', d.verse,
      'verse', d.verse,
      'date', d.date,
      'author_id', d.author_id,
      'theme', COALESCE(d.theme, '')
    ))
    INTO result_devotionals
    FROM devotionals d
    WHERE d.date BETWEEN start_date AND end_date
    ORDER BY d.date DESC;
  ELSE
    -- Fallback para estrutura mais simples
    SELECT array_agg(jsonb_build_object(
      'id', d.id,
      'title', d.title,
      'date', d.date
    ))
    INTO result_devotionals
    FROM devotionals d
    WHERE d.date BETWEEN start_date AND end_date
    ORDER BY d.date DESC;
  END IF;
  
  RETURN COALESCE(result_devotionals, '{}');
END;
$$;

-- Garantir que as funções sejam acessíveis
GRANT EXECUTE ON FUNCTION get_daily_devotional() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_latest_devotional() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_devotionals_by_range(DATE, DATE) TO authenticated, anon; 