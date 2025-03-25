-- Script para corrigir relações ambíguas na tabela questions
-- Este script identifica e corrige as relações entre questions e users, garantindo que
-- as chaves estrangeiras user_id e answered_by estejam claramente definidas.

-- Primeiro, verifique as chaves estrangeiras existentes
DO $check_constraints$
DECLARE
    user_id_constraint_count INT;
    answered_by_constraint_count INT;
BEGIN
    -- Verificar quantas constraints existem para user_id
    SELECT COUNT(*) INTO user_id_constraint_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'questions'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND ccu.column_name = 'user_id';
    
    -- Verificar quantas constraints existem para answered_by
    SELECT COUNT(*) INTO answered_by_constraint_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'questions'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND ccu.column_name = 'answered_by';
    
    RAISE NOTICE 'Constraints encontradas: % para user_id, % para answered_by', 
        user_id_constraint_count, answered_by_constraint_count;
END $check_constraints$;

-- Renomear as chaves estrangeiras para evitar ambiguidades
DO $rename_constraints$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Listar todas as constraints de chave estrangeira da tabela questions
    FOR constraint_record IN (
        SELECT tc.constraint_name, ccu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'questions'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND (ccu.column_name = 'user_id' OR ccu.column_name = 'answered_by')
    ) LOOP
        -- Identificar o tipo de constraint pelo nome da coluna
        IF constraint_record.column_name = 'user_id' THEN
            -- Renomear para algo mais descritivo
            EXECUTE format('ALTER TABLE public.questions RENAME CONSTRAINT %I TO questions_user_id_fkey', 
                constraint_record.constraint_name);
            
            RAISE NOTICE 'Constraint de user_id renomeada: % -> questions_user_id_fkey', 
                constraint_record.constraint_name;
        ELSIF constraint_record.column_name = 'answered_by' THEN
            -- Renomear para algo mais descritivo
            EXECUTE format('ALTER TABLE public.questions RENAME CONSTRAINT %I TO questions_answered_by_fkey', 
                constraint_record.constraint_name);
            
            RAISE NOTICE 'Constraint de answered_by renomeada: % -> questions_answered_by_fkey', 
                constraint_record.constraint_name;
        END IF;
    END LOOP;
END $rename_constraints$;

-- Verificar se há perguntas respondidas por usuários que não existem
DO $check_missing_users$
DECLARE
    missing_users INT;
BEGIN
    SELECT COUNT(*) INTO missing_users
    FROM public.questions q
    LEFT JOIN public.users u ON q.answered_by = u.id
    WHERE q.answered_by IS NOT NULL
      AND u.id IS NULL;
    
    IF missing_users > 0 THEN
        RAISE NOTICE 'Encontradas % perguntas respondidas por usuários que não existem na tabela users.', missing_users;
        RAISE NOTICE 'Execute o script fix_answered_by.sql para corrigir este problema.';
    ELSE
        RAISE NOTICE 'Todas as perguntas respondidas têm usuários válidos.';
    END IF;
END $check_missing_users$;

-- Instruções para uso:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Se forem encontradas perguntas com referências inválidas, execute o script fix_answered_by.sql
-- 3. Caso ainda ocorram erros de ambiguidade, verifique se há múltiplas chaves estrangeiras com o mesmo nome
--    e considere excluir e recriar as relações com nomes explícitos. 