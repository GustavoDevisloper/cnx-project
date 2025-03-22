-- Script para corrigir o status dos eventos e verificar a função get_upcoming_events
-- Use este script para corrigir eventos que não aparecem na interface

-- Parte 1: Verificar a definição atual da função get_upcoming_events()
DO $$
BEGIN
    RAISE NOTICE '🔍 Verificando a função get_upcoming_events()...';
END $$;

SELECT pg_get_functiondef('get_upcoming_events()'::regprocedure) AS function_definition;

-- Parte 2: Verificar restrições de verificação na coluna status
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Verificando restrições da coluna status...';
END $$;

SELECT conname AS constraint_name, pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.events'::regclass 
AND conname = 'events_status_check';

-- Parte 3: Verificar eventos atuais e seus status
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📋 Status atual dos eventos:';
END $$;

SELECT status, COUNT(*) as quantidade
FROM public.events
GROUP BY status;

-- Parte 4: Atualizar o status dos eventos para "upcoming"
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Atualizando status dos eventos de "ongoing" para "upcoming"...';
    
    WITH updated AS (
        UPDATE public.events 
        SET status = 'upcoming' 
        WHERE status = 'ongoing' 
        AND date > NOW()
        RETURNING *
    )
    SELECT COUNT(*) INTO updated_count FROM updated;
    
    RAISE NOTICE '✅ %s eventos atualizados com sucesso!', updated_count;
END $$;

-- Parte 5: Verificar eventos após a atualização
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📋 Status dos eventos após atualização:';
END $$;

SELECT status, COUNT(*) as quantidade
FROM public.events
GROUP BY status;

-- Parte 6: Verificar a definição da função get_upcoming_events (opcional)
-- Se a função não estiver retornando os eventos corretos, você pode recriá-la
-- Descomente a seção abaixo se necessário

/*
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Recriando a função get_upcoming_events()...';
END $$;

-- Remover a função existente
DROP FUNCTION IF EXISTS get_upcoming_events();

-- Recriar com a definição correta
CREATE OR REPLACE FUNCTION get_upcoming_events()
RETURNS SETOF public.events
LANGUAGE sql
SECURITY DEFINER
AS $function$
  SELECT *
  FROM public.events
  WHERE status = 'upcoming'
  AND date >= CURRENT_TIMESTAMP
  ORDER BY date ASC;
$function$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_upcoming_events() TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_events() TO anon;
*/

-- Parte 7: Lista final de eventos que devem aparecer na interface
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📊 Eventos que devem aparecer na interface (status = upcoming e data futura):';
END $$;

SELECT id, title, date, status
FROM public.events
WHERE status = 'upcoming'
AND date > NOW()
ORDER BY date ASC; 