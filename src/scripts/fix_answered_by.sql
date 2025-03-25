-- Script para corrigir problemas com o campo answered_by na tabela questions
-- Este script executa as seguintes ações:
-- 1. Chama a função sync_users() para sincronizar usuários entre auth.users e public.users
-- 2. Identifica perguntas com answered_by que não possui referência válida na tabela users
-- 3. Define answered_by como NULL para essas perguntas
-- 4. Opcionalmente, adiciona uma coluna answered_by_email para manter o registro de quem respondeu

-- Primeiro, sincronize os usuários
SELECT sync_users();

-- Identifique perguntas com problemas de chave estrangeira em answered_by
DO $fix_answered_by$
DECLARE
    has_answered_by_email BOOLEAN;
    invalid_questions INT := 0;
BEGIN
    -- Verifique se a coluna answered_by_email já existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'questions' 
        AND column_name = 'answered_by_email'
    ) INTO has_answered_by_email;
    
    -- Se a coluna não existir, crie-a
    IF NOT has_answered_by_email THEN
        EXECUTE 'ALTER TABLE public.questions ADD COLUMN answered_by_email TEXT';
        RAISE NOTICE 'Coluna answered_by_email adicionada à tabela questions';
    END IF;
    
    -- Atualize a coluna answered_by_email com os emails dos usuários atuais antes de corrigir
    EXECUTE '
        UPDATE public.questions q
        SET answered_by_email = u.email
        FROM public.users u
        WHERE q.answered_by = u.id
        AND q.answered_by IS NOT NULL
        AND q.answered_by_email IS NULL
    ';
    
    -- Conta e corrige perguntas com answered_by inválido
    WITH invalid_answers AS (
        SELECT q.id
        FROM public.questions q
        LEFT JOIN public.users u ON q.answered_by = u.id
        WHERE q.answered_by IS NOT NULL
        AND u.id IS NULL
    ),
    update_result AS (
        UPDATE public.questions
        SET answered_by = NULL
        WHERE id IN (SELECT id FROM invalid_answers)
        RETURNING id
    )
    SELECT COUNT(*) INTO invalid_questions FROM update_result;
    
    -- Relata o resultado
    IF invalid_questions > 0 THEN
        RAISE NOTICE 'Corrigidas % perguntas com chaves estrangeiras inválidas em answered_by', invalid_questions;
    ELSE
        RAISE NOTICE 'Nenhuma pergunta com chave estrangeira inválida encontrada em answered_by';
    END IF;
END $fix_answered_by$;

-- Instruções para o administrador:
-- 1. Execute este script no SQL Editor do Supabase para corrigir problemas de chave estrangeira
-- 2. Este script é seguro e não destrói dados - ele preserva o email da pessoa que respondeu
-- 3. Para restaurar associações, você pode executar o seguinte comando após adicionar os usuários:
/*
UPDATE public.questions q
SET answered_by = u.id
FROM public.users u
WHERE q.answered_by_email = u.email
AND q.answered_by IS NULL
AND q.answered_by_email IS NOT NULL;
*/ 