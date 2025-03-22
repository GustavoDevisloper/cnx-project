-- Este script corrige problemas de tipo de dados nas tabelas e funções relacionadas a eventos
-- Especificamente, trata problemas de comparação entre texto e timestamps

DO $$
DECLARE
    column_type TEXT;
BEGIN
    -- Verificar se a tabela events existe
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'events') THEN
        -- Verificar o tipo das colunas date e end_date
        SELECT data_type INTO column_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'date';
        
        -- Se a coluna date não for do tipo timestamp with time zone, alterá-la
        IF column_type != 'timestamp with time zone' THEN
            BEGIN
                RAISE NOTICE 'Alterando tipo da coluna date para timestamp with time zone';
                ALTER TABLE public.events 
                ALTER COLUMN date TYPE timestamp with time zone 
                USING date::timestamp with time zone;
                
                -- Verificar se end_date também precisa ser alterada
                SELECT data_type INTO column_type 
                FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'end_date';
                
                IF column_type != 'timestamp with time zone' THEN
                    ALTER TABLE public.events 
                    ALTER COLUMN end_date TYPE timestamp with time zone 
                    USING end_date::timestamp with time zone;
                END IF;
                
                RAISE NOTICE 'Tipos de coluna corrigidos com sucesso.';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Erro ao converter colunas: %', SQLERRM;
                RAISE NOTICE 'É possível que os dados existentes não possam ser convertidos. Considere recriar a tabela se necessário.';
            END;
        ELSE
            RAISE NOTICE 'As colunas já possuem o tipo correto (timestamp with time zone).';
        END IF;
    ELSE
        RAISE NOTICE 'Tabela events não encontrada. Execute o script create_events_tables.sql primeiro.';
    END IF;
    
    -- Remover e recriar as funções com tipos de dados corretos
    DROP FUNCTION IF EXISTS get_upcoming_events();
    
    -- Remover todas as possíveis versões da função create_event para evitar conflitos de tipo de retorno
    DROP FUNCTION IF EXISTS create_event(text, text, text, text, text, text, uuid);
    DROP FUNCTION IF EXISTS create_event(text, text, timestamp with time zone, timestamp with time zone, text, text, uuid);
    DROP FUNCTION IF EXISTS create_event(text, text, timestamp with time zone, text, text, text, uuid);
    DROP FUNCTION IF EXISTS create_event(text, text, text, timestamp with time zone, text, text, uuid);
    
    -- Recriar a função get_upcoming_events com tipos corretos
    CREATE OR REPLACE FUNCTION get_upcoming_events()
    RETURNS SETOF public.events
    LANGUAGE sql
    SECURITY DEFINER
    AS $get_upcoming_events_fix_function$
      SELECT *
      FROM public.events
      WHERE status = 'upcoming'
      AND date >= CURRENT_TIMESTAMP
      ORDER BY date ASC;
    $get_upcoming_events_fix_function$;
    
    -- Recriar a função create_event com parâmetros explicitamente definidos como timestamp
    CREATE OR REPLACE FUNCTION create_event(
        p_title TEXT,
        p_description TEXT,
        p_date TIMESTAMP WITH TIME ZONE,
        p_end_date TIMESTAMP WITH TIME ZONE,
        p_location TEXT,
        p_status TEXT,
        p_user_id UUID
    )
    RETURNS UUID
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $create_event_fix_function$
    DECLARE
        v_user_role TEXT;
        v_event_id UUID;
    BEGIN
        -- Verificar se o usuário existe e é admin
        SELECT role INTO v_user_role FROM public.users WHERE id = p_user_id;
        
        IF v_user_role IS NULL THEN
            RAISE EXCEPTION 'Usuário não encontrado';
        END IF;
        
        IF v_user_role != 'admin' THEN
            RAISE EXCEPTION 'Apenas administradores podem criar eventos';
        END IF;
        
        -- Criar o evento
        INSERT INTO public.events (
            title, 
            description, 
            date, 
            end_date, 
            location, 
            status, 
            created_by
        ) VALUES (
            p_title,
            p_description,
            p_date,
            p_end_date,
            p_location,
            p_status,
            p_user_id
        )
        RETURNING id INTO v_event_id;
        
        RETURN v_event_id;
    END;
    $create_event_fix_function$;
    
    -- Conceder permissões
    GRANT EXECUTE ON FUNCTION public.get_upcoming_events() TO authenticated;
    GRANT EXECUTE ON FUNCTION public.create_event(TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, TEXT, TEXT, UUID) TO authenticated;
    
    RAISE NOTICE 'Script executado com sucesso! Certifique-se de enviar timestamps no formato correto (ISO 8601)';
END;
$$; 