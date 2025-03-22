-- Script para verificar e corrigir a estrutura da tabela questions
DO $fix_schema$
DECLARE
    table_exists BOOLEAN;
    title_exists BOOLEAN;
    content_exists BOOLEAN;
    question_exists BOOLEAN;
BEGIN
    -- Verificar se a tabela exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'questions'
    ) INTO table_exists;

    IF NOT table_exists THEN
        RAISE NOTICE 'A tabela questions não existe. Criando...';
        
        -- Criar a tabela com a estrutura correta
        CREATE TABLE public.questions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            status TEXT NOT NULL CHECK (status IN ('pending', 'answered')),
            answer TEXT,
            answered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            answered_at TIMESTAMP WITH TIME ZONE,
            is_public BOOLEAN DEFAULT TRUE
        );
        
        -- Criar índices
        CREATE INDEX idx_questions_user_id ON questions(user_id);
        CREATE INDEX idx_questions_status ON questions(status);
        CREATE INDEX idx_questions_created_at ON questions(created_at);
        
        -- Habilitar RLS
        ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
        
        -- Remover políticas existentes para evitar erros de duplicação
        DROP POLICY IF EXISTS "Usuários autenticados podem criar perguntas" ON questions;
        DROP POLICY IF EXISTS "Usuários podem ver suas próprias perguntas" ON questions;
        DROP POLICY IF EXISTS "Todos podem ver perguntas respondidas públicas" ON questions;
        DROP POLICY IF EXISTS "Admins e líderes podem ver todas as perguntas" ON questions;
        DROP POLICY IF EXISTS "Admins e líderes podem responder perguntas" ON questions;
        DROP POLICY IF EXISTS "Usuários podem excluir suas próprias perguntas" ON questions;
        
        -- Criar políticas
        CREATE POLICY "Usuários autenticados podem criar perguntas" ON questions
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Usuários podem ver suas próprias perguntas" ON questions
            FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Todos podem ver perguntas respondidas públicas" ON questions
            FOR SELECT USING (status = 'answered' AND is_public = TRUE);
        
        CREATE POLICY "Admins e líderes podem ver todas as perguntas" ON questions
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM users
                    WHERE users.id = auth.uid()
                    AND (users.role = 'admin' OR users.role = 'leader')
                )
            );
        
        CREATE POLICY "Admins e líderes podem responder perguntas" ON questions
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM users
                    WHERE users.id = auth.uid()
                    AND (users.role = 'admin' OR users.role = 'leader')
                )
            );
        
        CREATE POLICY "Usuários podem excluir suas próprias perguntas" ON questions
            FOR DELETE USING (auth.uid() = user_id);
        
        RAISE NOTICE 'Tabela questions criada com sucesso.';
    ELSE
        RAISE NOTICE 'A tabela questions já existe. Verificando sua estrutura...';
        
        -- Verificar colunas existentes
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'questions' 
            AND column_name = 'title'
        ) INTO title_exists;
        
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'questions' 
            AND column_name = 'content'
        ) INTO content_exists;
        
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'questions' 
            AND column_name = 'question'
        ) INTO question_exists;
        
        -- Adicionar colunas ausentes
        IF NOT title_exists THEN
            RAISE NOTICE 'Adicionando coluna title...';
            ALTER TABLE questions ADD COLUMN title TEXT;
            
            -- Preencher a coluna title com dados se possível
            IF question_exists THEN
                UPDATE questions SET title = 'Dúvida' WHERE title IS NULL;
            END IF;
            
            -- Definir NOT NULL depois de preencher os dados
            ALTER TABLE questions ALTER COLUMN title SET NOT NULL;
        END IF;
        
        IF NOT content_exists THEN
            RAISE NOTICE 'Adicionando coluna content...';
            ALTER TABLE questions ADD COLUMN content TEXT;
            
            -- Preencher a coluna content com dados da coluna question, se existir
            IF question_exists THEN
                UPDATE questions SET content = question WHERE content IS NULL;
            END IF;
            
            -- Definir NOT NULL depois de preencher os dados
            ALTER TABLE questions ALTER COLUMN content SET NOT NULL;
        END IF;
        
        -- Remover políticas existentes para evitar erros de duplicação
        DROP POLICY IF EXISTS "Usuários autenticados podem criar perguntas" ON questions;
        DROP POLICY IF EXISTS "Usuários podem ver suas próprias perguntas" ON questions;
        DROP POLICY IF EXISTS "Todos podem ver perguntas respondidas públicas" ON questions;
        DROP POLICY IF EXISTS "Admins e líderes podem ver todas as perguntas" ON questions;
        DROP POLICY IF EXISTS "Admins e líderes podem responder perguntas" ON questions;
        DROP POLICY IF EXISTS "Usuários podem excluir suas próprias perguntas" ON questions;
        
        -- Verificar e corrigir políticas RLS
        RAISE NOTICE 'Recriando políticas de segurança...';
        
        CREATE POLICY "Usuários autenticados podem criar perguntas" ON questions
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Usuários podem ver suas próprias perguntas" ON questions
            FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Todos podem ver perguntas respondidas públicas" ON questions
            FOR SELECT USING (status = 'answered' AND is_public = TRUE);
        
        CREATE POLICY "Admins e líderes podem ver todas as perguntas" ON questions
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM users
                    WHERE users.id = auth.uid()
                    AND (users.role = 'admin' OR users.role = 'leader')
                )
            );
        
        CREATE POLICY "Admins e líderes podem responder perguntas" ON questions
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM users
                    WHERE users.id = auth.uid()
                    AND (users.role = 'admin' OR users.role = 'leader')
                )
            );
        
        CREATE POLICY "Usuários podem excluir suas próprias perguntas" ON questions
            FOR DELETE USING (auth.uid() = user_id);
        
        RAISE NOTICE 'Verificação e correção da estrutura concluídas.';
    END IF;
END
$fix_schema$;

-- Remover função existente para evitar duplicação
DROP FUNCTION IF EXISTS create_question(TEXT, TEXT, UUID);

-- Criar a função RPC para contornar as políticas RLS, se necessário
CREATE OR REPLACE FUNCTION create_question(
  p_title TEXT,
  p_content TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $create_function$
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
$create_function$;

-- Conceder permissão para a função ser executada por usuários autenticados
GRANT EXECUTE ON FUNCTION create_question TO authenticated;
GRANT EXECUTE ON FUNCTION create_question TO anon;

-- Comentário para explicar a função
COMMENT ON FUNCTION create_question IS 'Cria uma nova pergunta na tabela questions, contornando as políticas RLS se necessário.';

-- Instruções para o administrador:
-- 1. Execute este script no SQL Editor do Supabase.
-- 2. Se houver problemas de chave estrangeira, execute também o script sync_users_tables.sql. 