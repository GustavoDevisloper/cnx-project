-- Função para criar um devocional mesmo quando há problemas de RLS
CREATE OR REPLACE FUNCTION create_devotional(devotional_data JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
  author_name TEXT;
  debug_info TEXT;
  required_fields TEXT[];
  missing_fields TEXT[];
  devotional_date DATE;
BEGIN
  -- Log inicial
  RAISE NOTICE 'Iniciando create_devotional com dados: %', devotional_data;

  -- Verificar se o usuário tem permissão
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'leader')
  ) THEN
    RAISE EXCEPTION 'Usuário não tem permissão para criar devocionais';
  END IF;

  -- Lista de campos obrigatórios na tabela
  required_fields := ARRAY['title', 'verse', 'content'];
  missing_fields := ARRAY[]::TEXT[];

  -- Verificar todos os campos obrigatórios
  FOREACH debug_info IN ARRAY required_fields LOOP
    IF devotional_data->>debug_info IS NULL OR devotional_data->>debug_info = '' THEN
      missing_fields := missing_fields || debug_info;
    END IF;
  END LOOP;

  -- Verificar se está faltando campos obrigatórios
  IF array_length(missing_fields, 1) > 0 THEN
    RAISE NOTICE 'Campos obrigatórios faltando: %', array_to_string(missing_fields, ', ');
    RAISE EXCEPTION 'Campos obrigatórios faltando: %', array_to_string(missing_fields, ', ');
  END IF;

  -- Processar a data
  IF devotional_data->>'date' IS NOT NULL AND devotional_data->>'date' != '' THEN
    BEGIN
      devotional_date := (devotional_data->>'date')::DATE;
      RAISE NOTICE 'Data fornecida: %', devotional_date;
    EXCEPTION WHEN OTHERS THEN
      devotional_date := CURRENT_DATE;
      RAISE NOTICE 'Erro ao processar data fornecida, usando data atual: %', devotional_date;
    END;
  ELSE
    devotional_date := CURRENT_DATE;
    RAISE NOTICE 'Nenhuma data fornecida, usando data atual: %', devotional_date;
  END IF;

  -- Log dos campos principais
  RAISE NOTICE 'Campos validados: title=%, verse=%, content=%, date=%, theme=%', 
    devotional_data->>'title', 
    devotional_data->>'verse',
    devotional_data->>'content',
    devotional_date,
    COALESCE(devotional_data->>'theme', 'reflexão');

  -- Usar o campo author fornecido ou buscar o nome do autor pelo ID
  IF devotional_data->>'author' IS NOT NULL AND devotional_data->>'author' != '' THEN
    author_name := devotional_data->>'author';
    RAISE NOTICE 'Usando autor fornecido: %', author_name;
  ELSE
    -- Tentar buscar o nome do autor
    SELECT COALESCE(first_name, username, 'Autor Desconhecido')
    INTO author_name
    FROM users
    WHERE id = auth.uid();

    RAISE NOTICE 'Autor buscado do banco: %', author_name;
  END IF;

  -- Se ainda não tiver autor, usar valor padrão
  IF author_name IS NULL OR author_name = '' THEN
    author_name := 'Autor Desconhecido';
    RAISE NOTICE 'Usando autor padrão: %', author_name;
  END IF;

  -- Inserir o devocional com tratamento de erros mais robusto
  BEGIN
    RAISE NOTICE 'Tentando inserir devocional na tabela...';
    
    INSERT INTO devotionals (
      title,
      content,
      verse,
      verse_text,
      author,
      author_id,
      date,
      theme,
      is_generated,
      "references",
      image_url,
      transmission_link,
      created_at,
      updated_at
    ) VALUES (
      devotional_data->>'title',
      COALESCE(devotional_data->>'content', 'Sem conteúdo'),
      devotional_data->>'verse',
      COALESCE(devotional_data->>'verse_text', ''),
      author_name,
      auth.uid(),
      devotional_date,
      COALESCE(devotional_data->>'theme', 'reflexão'),
      false,
      ARRAY[]::TEXT[],
      '',
      '',
      NOW(),
      NOW()
    )
    RETURNING id INTO new_id;
    
    IF new_id IS NULL THEN
      RAISE NOTICE 'Inserção falhou: nenhum ID retornado';
      RAISE EXCEPTION 'Falha ao criar devocional: nenhum ID retornado';
    END IF;
    
    RAISE NOTICE 'Devocional criado com sucesso, ID: %', new_id;
    RETURN new_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Erro ao inserir devocional: % | Estado SQL: % | Detalhe: % | Dica: %', 
        SQLERRM, 
        SQLSTATE,
        SQLERRM,
        sql_error_hint();
      RAISE EXCEPTION '%', SQLERRM;
  END;
END;
$$;

-- Revogar todas as permissões existentes
REVOKE ALL ON FUNCTION create_devotional(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION create_devotional(JSONB) FROM authenticated;

-- Conceder permissão apenas para usuários autenticados
GRANT EXECUTE ON FUNCTION create_devotional(JSONB) TO authenticated;

-- Comentário para o administrador
COMMENT ON FUNCTION create_devotional(JSONB) IS 
'Função para criar devotionals com validação de permissões.
Recebe um objeto JSON com os dados do devocional e retorna o ID gerado.
Campos obrigatórios: title, verse, content
Requer autenticação e role admin/leader.';

-- Função auxiliar para testar se a função está acessível
CREATE OR REPLACE FUNCTION test_create_devotional_access()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN 'Função create_devotional está acessível';
END;
$$;

GRANT EXECUTE ON FUNCTION test_create_devotional_access() TO authenticated;

-- Instruções para o administrador
/*
Para executar esta função via API do Supabase:

const { data, error } = await supabase.rpc('create_devotional', {
  devotional_data: {
    title: "Título do devocional",
    verse: "Referência do versículo",
    content: "Conteúdo do devocional",
    author_id: "UUID do autor",
    theme: "Tema opcional"
  }
})

Se a função retornar um UUID, o devocional foi criado com sucesso.
Se retornar NULL, houve um erro na criação do devocional.
*/

-- Função para buscar o devocional do dia
CREATE OR REPLACE FUNCTION get_daily_devotional()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Buscar o devocional do dia atual
  SELECT row_to_json(d)::JSONB
  INTO result
  FROM (
    SELECT 
      d.*,
      u.first_name as author_name,
      u.avatar_url as author_avatar,
      (
        SELECT COUNT(*)
        FROM devotional_likes dl
        WHERE dl.devotional_id = d.id
      ) as likes_count,
      (
        SELECT COUNT(*)
        FROM devotional_comments dc
        WHERE dc.devotional_id = d.id
      ) as comments_count
    FROM devotionals d
    LEFT JOIN users u ON u.id = d.author_id
    WHERE d.date = CURRENT_DATE
    ORDER BY d.created_at DESC
    LIMIT 1
  ) d;

  -- Se não encontrar devocional para hoje, buscar o mais recente
  IF result IS NULL THEN
    SELECT row_to_json(d)::JSONB
    INTO result
    FROM (
      SELECT 
        d.*,
        u.first_name as author_name,
        u.avatar_url as author_avatar,
        (
          SELECT COUNT(*)
          FROM devotional_likes dl
          WHERE dl.devotional_id = d.id
        ) as likes_count,
        (
          SELECT COUNT(*)
          FROM devotional_comments dc
          WHERE dc.devotional_id = d.id
        ) as comments_count
      FROM devotionals d
      LEFT JOIN users u ON u.id = d.author_id
      ORDER BY d.date DESC, d.created_at DESC
      LIMIT 1
    ) d;
  END IF;

  RETURN result;
END;
$$;

-- Conceder permissão de execução para todos os usuários
GRANT EXECUTE ON FUNCTION get_daily_devotional() TO authenticated, anon;

-- Comentário para o administrador
COMMENT ON FUNCTION get_daily_devotional() IS 
'Função para buscar o devocional do dia atual.
Se não encontrar um devocional para hoje, retorna o mais recente.
Retorna um objeto JSONB com os dados do devocional e informações adicionais.'; 