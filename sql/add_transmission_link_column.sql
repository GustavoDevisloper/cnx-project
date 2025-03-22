-- Script para adicionar a coluna transmission_link à tabela devotionals
-- Execute este script se quiser usar a funcionalidade de links de transmissão em devocionais

DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Verificar se a coluna já existe
    SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'devotionals' 
        AND column_name = 'transmission_link'
    ) INTO column_exists;
    
    -- Se a coluna não existir, adicionar
    IF NOT column_exists THEN
        -- Adicionar a coluna transmission_link
        ALTER TABLE public.devotionals ADD COLUMN transmission_link TEXT DEFAULT NULL;
        
        RAISE NOTICE 'Coluna transmission_link adicionada com sucesso à tabela devotionals';
    ELSE
        RAISE NOTICE 'A coluna transmission_link já existe na tabela devotionals';
    END IF;
END $$;

-- Verificar se a tabela agora tem a coluna
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'devotionals' 
AND column_name = 'transmission_link';

-- Exemplo de como atualizar uma linha para usar a nova coluna
/*
UPDATE public.devotionals
SET transmission_link = 'https://youtube.com/watch?v=exemplo'
WHERE id = 'ID_DO_DEVOCIONAL_AQUI';
*/

-- Atualizar as funções RPC para incluir a nova coluna
-- Atualize get_daily_devotional e get_latest_devotional com estas linhas no jsonb_build_object:
/*
'transmission_link', d.transmission_link,
*/ 