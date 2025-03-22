-- Script para adicionar a coluna references à tabela devotionals
-- Execute este script se quiser usar a funcionalidade de referências em devocionais

DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Verificar se a coluna já existe
    SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'devotionals' 
        AND column_name = 'references'
    ) INTO column_exists;
    
    -- Se a coluna não existir, adicionar
    IF NOT column_exists THEN
        -- Adicionar a coluna "references" com aspas duplas para evitar conflitos com palavras reservadas
        EXECUTE 'ALTER TABLE public.devotionals ADD COLUMN "references" TEXT[] DEFAULT NULL';
        
        RAISE NOTICE 'Coluna "references" adicionada com sucesso à tabela devotionals';
    ELSE
        RAISE NOTICE 'A coluna "references" já existe na tabela devotionals';
    END IF;
END $$;

-- Verificar se a tabela agora tem a coluna
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'devotionals' 
AND column_name = 'references';

-- Exemplo de como atualizar uma linha para usar a nova coluna
/*
UPDATE public.devotionals
SET "references" = ARRAY['João 1:1', 'Romanos 8:28', 'Salmos 23:1']
WHERE id = 'ID_DO_DEVOCIONAL_AQUI';
*/

-- Atualizar as funções RPC para incluir a nova coluna
-- Atualize get_daily_devotional e get_latest_devotional com estas linhas no jsonb_build_object:
/*
'references', d."references",
*/ 