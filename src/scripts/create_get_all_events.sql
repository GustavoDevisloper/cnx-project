-- Script para criar a função get_all_events para mostrar todos os eventos
-- Use este script para garantir que todos os eventos sejam visíveis na interface

-- Verificar se a função já existe de forma segura
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_all_events' 
        AND pg_function_is_visible(oid)
    ) THEN
        RAISE NOTICE 'A função get_all_events() já existe. Será recriada.';
    ELSE
        RAISE NOTICE 'A função get_all_events() não existe. Será criada.';
    END IF;
END $$;

-- Remover a função existente se necessário
DROP FUNCTION IF EXISTS get_all_events();

-- Criar a função para retornar todos os eventos sem filtros
CREATE OR REPLACE FUNCTION get_all_events()
RETURNS SETOF public.events
LANGUAGE plpgsql
AS $get_all_events_function$
BEGIN
    RETURN QUERY 
    SELECT * FROM public.events
    ORDER BY date ASC;
END;
$get_all_events_function$;

-- Conceder permissão para acessar a função
GRANT EXECUTE ON FUNCTION get_all_events() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_events() TO anon;

-- Verificar a nova definição da função (agora é seguro porque acabamos de criá-la)
SELECT pg_get_functiondef('get_all_events()'::regprocedure) AS new_definition;

-- Realizar um teste para verificar os eventos retornados
SELECT id, title, status, date 
FROM get_all_events() 
LIMIT 10;

-- Mostrar a contagem de eventos por status para verificação
SELECT status, count(*) 
FROM events 
GROUP BY status; 