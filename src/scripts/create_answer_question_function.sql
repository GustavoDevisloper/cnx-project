-- Função para responder perguntas (contorna políticas RLS e verifica restrições de chave estrangeira)
-- Remover função existente para evitar duplicação
DROP FUNCTION IF EXISTS answer_question(UUID, TEXT, UUID);

-- Função que contorna as políticas RLS para responder perguntas
CREATE OR REPLACE FUNCTION answer_question(
  p_question_id UUID,
  p_answer TEXT,
  p_user_id UUID
) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios do criador da função, não do usuário chamador
AS $answer_function$
DECLARE
  v_question_exists BOOLEAN;
  v_user_role TEXT;
  v_result JSONB;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Verificar se a pergunta existe
  SELECT EXISTS (
    SELECT 1 FROM questions WHERE id = p_question_id
  ) INTO v_question_exists;
  
  IF NOT v_question_exists THEN
    RAISE EXCEPTION 'A pergunta especificada não existe';
  END IF;
  
  -- Verificar a função do usuário
  SELECT role INTO v_user_role FROM users WHERE id = p_user_id;
  
  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'O usuário especificado não existe';
  END IF;
  
  -- Apenas admins ou líderes podem responder perguntas
  IF v_user_role NOT IN ('admin', 'leader') THEN
    RAISE EXCEPTION 'Apenas administradores ou líderes podem responder perguntas';
  END IF;
  
  -- Atualizar a pergunta com a resposta
  UPDATE questions 
  SET 
    answer = p_answer,
    answered_by = p_user_id,
    answered_at = v_now,
    status = 'answered',
    updated_at = v_now
  WHERE id = p_question_id;
  
  -- Recuperar os dados atualizados
  SELECT row_to_json(q)::JSONB INTO v_result
  FROM (
    SELECT * FROM questions WHERE id = p_question_id
  ) q;
  
  RETURN v_result;
END;
$answer_function$;

-- Conceder permissão para a função ser executada por usuários autenticados
GRANT EXECUTE ON FUNCTION answer_question TO authenticated;
GRANT EXECUTE ON FUNCTION answer_question TO anon;

-- Comentário para explicar a função
COMMENT ON FUNCTION answer_question IS 'Responde a uma pergunta na tabela questions, contornando as políticas RLS. Verifica permissões de admin/líder.';

-- Instruções para o administrador do banco:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Verifique se a função foi criada com sucesso
-- 3. Teste a função com:
--    SELECT answer_question('ID_DA_PERGUNTA_AQUI', 'Conteúdo da resposta', 'ID_DO_USUÁRIO_RESPONDENDO');
-- 4. Se ainda houver problemas, execute o script sync_users_tables.sql para sincronizar todos os usuários 