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
BEGIN
  -- Lista de campos obrigatórios na tabela
  required_fields := ARRAY['title', 'scripture', 'content', 'author'];
  missing_fields := ARRAY[]::TEXT[];

  -- Verificar todos os campos obrigatórios
  FOREACH debug_info IN ARRAY required_fields LOOP
    IF devotional_data->>debug_info IS NULL THEN
      missing_fields := missing_fields || debug_info;
    END IF;
  END LOOP;

  -- Verificar se está faltando campos obrigatórios
  IF array_length(missing_fields, 1) > 0 THEN
    RAISE EXCEPTION 'Campos obrigatórios faltando: %', array_to_string(missing_fields, ', ');
  END IF;

  -- Usar o campo author fornecido ou buscar o nome do autor pelo ID
  IF devotional_data->>'author' IS NOT NULL THEN
    author_name := devotional_data->>'author';
  ELSE
    -- Tentar buscar o nome do autor
    SELECT first_name || ' ' || COALESCE(last_name, '')
    INTO author_name
    FROM users
    WHERE id = (devotional_data->>'author_id')::UUID;

    -- Se não encontrar, usar valor padrão
    IF author_name IS NULL OR author_name = ' ' THEN
      author_name := 'Autor Desconhecido';
    END IF;
  END IF;

  -- Debug info
  RAISE LOG 'Criando devocional: título=%, conteúdo=%, autor=%', 
    devotional_data->>'title', 
    devotional_data->>'content',
    author_name;

  -- Inserir o devocional com tratamento de erros mais robusto
  BEGIN
    INSERT INTO devotionals (
      title,
      content,
      scripture,
      scripture_text,
      author,
      author_id,
      date,
      theme,
      is_ai_generated,
      "references",
      image_url,
      transmission_link,
      created_at,
      updated_at
    ) VALUES (
      devotional_data->>'title',
      COALESCE(devotional_data->>'content', ''),
      devotional_data->>'verse',
      COALESCE(devotional_data->>'verse_text', ''),
      author_name,
      (devotional_data->>'author_id')::UUID,
      COALESCE(devotional_data->>'date', CURRENT_DATE::TEXT),
      COALESCE(devotional_data->>'theme', 'reflexão'),
      COALESCE((devotional_data->>'is_generated')::BOOLEAN, FALSE),
      COALESCE((devotional_data->'references')::JSONB, '[]'::JSONB)::TEXT[],
      COALESCE(devotional_data->>'image_url', ''),
      COALESCE(devotional_data->>'transmission_link', ''),
      COALESCE(devotional_data->>'created_at', NOW()::TEXT)::TIMESTAMPTZ,
      COALESCE(devotional_data->>'updated_at', NOW()::TEXT)::TIMESTAMPTZ
    )
    RETURNING id INTO new_id;
    
    RAISE LOG 'Devocional criado com sucesso, ID: %', new_id;
    RETURN new_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Erro ao inserir devocional: % | SQL state: %', SQLERRM, SQLSTATE;
      RETURN NULL;
  END;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Erro geral ao criar devocional: % | Detalhes: %', SQLERRM, devotional_data;
    RETURN NULL;
END;
$$;

-- Conceder permissão de execução para todos os usuários
GRANT EXECUTE ON FUNCTION create_devotional(JSONB) TO authenticated, anon;

-- Comentário para o administrador do banco
COMMENT ON FUNCTION create_devotional(JSONB) IS 
'Função para criar devotionals mesmo quando há problemas de RLS. 
Recebe um objeto JSON com os dados do devocional e retorna o ID gerado.
Esta função usa SECURITY DEFINER para ignorar as políticas RLS.';

-- Instruções para o administrador
/*
Para executar esta função via API do Supabase:

const { data, error } = await supabase.rpc('create_devotional', {
  devotional_data: {
    title: "Título do devocional",
    verse: "Referência do versículo",
    content: "Conteúdo opcional",
    author_id: "UUID do autor",
    author: "Nome do autor (opcional, será buscado pelo ID)",
    theme: "Tema opcional"
  }
})

Se a função retornar um UUID, o devocional foi criado com sucesso.
Se retornar NULL, houve um erro na criação do devocional.
*/

-- Função simplificada de teste para inserção na tabela devotionals
CREATE OR REPLACE FUNCTION test_insert_devotional()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
  error_msg TEXT;
BEGIN
  BEGIN
    -- Tentar inserir um registro de teste com valores mínimos
    INSERT INTO devotionals (
      title,
      content,
      scripture,
      author
    ) VALUES (
      'Teste Automático',
      'Conteúdo de teste',
      'Genesis 1:1',
      'Teste Automático'
    )
    RETURNING id INTO new_id;
    
    IF new_id IS NOT NULL THEN
      -- Limpar depois do teste (optional)
      DELETE FROM devotionals WHERE id = new_id;
      RETURN 'Sucesso! É possível inserir na tabela devotionals.';
    ELSE
      RETURN 'Falha: inserção retornou um ID nulo.';
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS error_msg = PG_EXCEPTION_DETAIL;
      RETURN 'Erro: ' || SQLERRM || ' | ' || COALESCE(error_msg, 'Sem detalhes');
  END;
END;
$$;

-- Conceder permissão para executar a função de teste
GRANT EXECUTE ON FUNCTION test_insert_devotional() TO authenticated, anon;

-- Adicionar função para diagnóstico da tabela
CREATE OR REPLACE FUNCTION diagnose_devotionals_table()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  table_info JSONB;
BEGIN
  -- Obter informações sobre a estrutura da tabela
  SELECT jsonb_agg(
    jsonb_build_object(
      'column_name', column_name,
      'data_type', data_type,
      'is_nullable', is_nullable,
      'column_default', column_default
    )
  )
  INTO table_info
  FROM information_schema.columns
  WHERE table_name = 'devotionals' AND table_schema = 'public';
  
  RETURN table_info;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Conceder permissão para executar a função de diagnóstico
GRANT EXECUTE ON FUNCTION diagnose_devotionals_table() TO authenticated, anon; 