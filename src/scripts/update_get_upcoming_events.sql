-- Script para atualizar a função get_upcoming_events para incluir eventos com status 'ongoing'
-- Use este script para garantir que eventos 'ongoing' também apareçam na interface

-- Primeiro, verificar a definição atual da função
SELECT pg_get_functiondef('get_upcoming_events()'::regprocedure) AS current_definition;

-- Remover a função existente
DROP FUNCTION IF EXISTS get_upcoming_events();

-- Recriar a função para incluir eventos com status 'upcoming' OU 'ongoing'
CREATE OR REPLACE FUNCTION get_upcoming_events()
RETURNS SETOF public.events
LANGUAGE plpgsql
AS $get_upcoming_events_function$
BEGIN
    RETURN QUERY 
    SELECT * FROM public.events
    WHERE status IN ('upcoming', 'ongoing')  -- Modificado para incluir 'ongoing'
    AND date >= NOW()
    ORDER BY date ASC;
END;
$get_upcoming_events_function$;

-- Conceder permissão para acessar a função
GRANT EXECUTE ON FUNCTION get_upcoming_events() TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_events() TO anon;

-- Verificar a nova definição da função
SELECT pg_get_functiondef('get_upcoming_events()'::regprocedure) AS new_definition;

-- Realizar um teste para verificar os eventos retornados
SELECT id, title, status, date 
FROM get_upcoming_events() 
LIMIT 10; 