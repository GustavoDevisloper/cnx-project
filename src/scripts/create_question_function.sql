-- Função para criar perguntas (contorna políticas RLS)
CREATE OR REPLACE FUNCTION create_question(
  p_title TEXT,
  p_content TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios do criador da função, não do usuário chamador
AS $$
DECLARE
  v_result JSONB;
  v_table_exists BOOLEAN;
  v_title_exists BOOLEAN;
  v_content_exists BOOLEAN;
  v_question_exists BOOLEAN;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_user_exists BOOLEAN;
  v_question_id UUID;
BEGIN
  -- Verificar se a tabela questions existe
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'questions'
  ) INTO v_table_exists;
  
  IF NOT v_table_exists THEN
    RAISE EXCEPTION 'A tabela questions não existe';
  END IF;
  
  -- Verificar se o usuário existe
  SELECT EXISTS (
    SELECT FROM users WHERE id = p_user_id
  ) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RAISE EXCEPTION 'O usuário especificado não existe';
  END IF;
  
  -- Verificar quais colunas existem na tabela
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'title'
  ) INTO v_title_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'content'
  ) INTO v_content_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'question'
  ) INTO v_question_exists;
  
  -- Gerar um novo UUID para a pergunta
  v_question_id := uuid_generate_v4();
  
  -- Inserir na tabela com base nas colunas existentes
  IF v_title_exists AND v_content_exists THEN
    -- Caso: Tabela tem title e content
    INSERT INTO questions (
      id, title, content, user_id, created_at, updated_at, status
    ) VALUES (
      v_question_id, p_title, p_content, p_user_id, v_now, v_now, 'pending'
    );
  ELSIF NOT v_title_exists AND v_content_exists THEN
    -- Caso: Tabela tem apenas content
    INSERT INTO questions (
      id, content, user_id, created_at, updated_at, status
    ) VALUES (
      v_question_id, p_content, p_user_id, v_now, v_now, 'pending'
    );
  ELSIF v_title_exists AND NOT v_content_exists THEN
    -- Caso: Tabela tem apenas title
    INSERT INTO questions (
      id, title, user_id, created_at, updated_at, status
    ) VALUES (
      v_question_id, p_title, p_user_id, v_now, v_now, 'pending'
    );
  ELSIF v_question_exists THEN
    -- Caso: Tabela tem question em vez de title/content
    INSERT INTO questions (
      id, question, user_id, created_at, updated_at, status
    ) VALUES (
      v_question_id, p_content, p_user_id, v_now, v_now, 'pending'
    );
  ELSE
    RAISE EXCEPTION 'Estrutura da tabela questions não reconhecida';
  END IF;
  
  -- Recuperar os dados inseridos
  SELECT row_to_json(q)::JSONB INTO v_result
  FROM (
    SELECT * FROM questions WHERE id = v_question_id
  ) q;
  
  RETURN v_result;
END;
$$;

-- Conceder permissão para a função ser executada por usuários autenticados
GRANT EXECUTE ON FUNCTION create_question TO authenticated;
GRANT EXECUTE ON FUNCTION create_question TO anon;

-- Comentário para explicar a função
COMMENT ON FUNCTION create_question IS 'Cria uma nova pergunta na tabela questions, contornando as políticas RLS. Suporta diferentes estruturas de tabela.';

-- Instruções para o administrador do banco:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Verifique se a função foi criada com sucesso
-- 3. Teste a função com:
--    SELECT create_question('Título de teste', 'Conteúdo de teste', 'ID_DO_USUÁRIO_AQUI'); 