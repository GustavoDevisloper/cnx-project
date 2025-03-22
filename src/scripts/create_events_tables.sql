-- Script para criar e configurar tabelas de eventos
-- Execução: Copie este código e execute no Console SQL do Supabase

-- Verificar se a extensão uuid-ossp está disponível
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela principal de eventos
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    location TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    image_url TEXT
);

-- Tabela para confirmações de presença
CREATE TABLE IF NOT EXISTS public.event_attendances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('confirmed', 'declined', 'maybe')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    UNIQUE(event_id, user_id)
);

-- Tabela para itens que os participantes levarão
CREATE TABLE IF NOT EXISTS public.event_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attendance_id UUID NOT NULL REFERENCES public.event_attendances(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para mensagens no chat do evento
CREATE TABLE IF NOT EXISTS public.event_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);

CREATE INDEX IF NOT EXISTS idx_event_attendances_event_id ON public.event_attendances(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendances_user_id ON public.event_attendances(user_id);
CREATE INDEX IF NOT EXISTS idx_event_attendances_status ON public.event_attendances(status);

CREATE INDEX IF NOT EXISTS idx_event_items_attendance_id ON public.event_items(attendance_id);

CREATE INDEX IF NOT EXISTS idx_event_messages_event_id ON public.event_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_event_messages_user_id ON public.event_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_event_messages_created_at ON public.event_messages(created_at);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_messages ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar erros de duplicação
-- Tabela events
DROP POLICY IF EXISTS "Eventos visíveis para todos" ON public.events;
DROP POLICY IF EXISTS "Apenas admins podem criar eventos" ON public.events;
DROP POLICY IF EXISTS "Apenas admins podem atualizar eventos" ON public.events;
DROP POLICY IF EXISTS "Apenas admins podem excluir eventos" ON public.events;

-- Tabela event_attendances
DROP POLICY IF EXISTS "Confirmações visíveis para todos" ON public.event_attendances;
DROP POLICY IF EXISTS "Usuários autenticados podem confirmar presença" ON public.event_attendances;
DROP POLICY IF EXISTS "Usuários podem atualizar sua própria confirmação" ON public.event_attendances;
DROP POLICY IF EXISTS "Admins podem atualizar qualquer confirmação" ON public.event_attendances;

-- Tabela event_items
DROP POLICY IF EXISTS "Itens visíveis para todos" ON public.event_items;
DROP POLICY IF EXISTS "Usuários podem adicionar itens às suas confirmações" ON public.event_items;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios itens" ON public.event_items;
DROP POLICY IF EXISTS "Usuários podem excluir seus próprios itens" ON public.event_items;

-- Tabela event_messages
DROP POLICY IF EXISTS "Mensagens visíveis para todos" ON public.event_messages;
DROP POLICY IF EXISTS "Usuários autenticados podem enviar mensagens" ON public.event_messages;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias mensagens" ON public.event_messages;
DROP POLICY IF EXISTS "Usuários podem excluir suas próprias mensagens" ON public.event_messages;
DROP POLICY IF EXISTS "Admins podem gerenciar qualquer mensagem" ON public.event_messages;

-- Políticas para tabela events
CREATE POLICY "Eventos visíveis para todos" ON public.events
    FOR SELECT USING (true);

CREATE POLICY "Apenas admins podem criar eventos" ON public.events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Apenas admins podem atualizar eventos" ON public.events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Apenas admins podem excluir eventos" ON public.events
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas para tabela event_attendances
CREATE POLICY "Confirmações visíveis para todos" ON public.event_attendances
    FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem confirmar presença" ON public.event_attendances
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar sua própria confirmação" ON public.event_attendances
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins podem atualizar qualquer confirmação" ON public.event_attendances
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas para tabela event_items
CREATE POLICY "Itens visíveis para todos" ON public.event_items
    FOR SELECT USING (true);

CREATE POLICY "Usuários podem adicionar itens às suas confirmações" ON public.event_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.event_attendances
            WHERE id = event_items.attendance_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem atualizar seus próprios itens" ON public.event_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.event_attendances
            WHERE id = event_items.attendance_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem excluir seus próprios itens" ON public.event_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.event_attendances
            WHERE id = event_items.attendance_id AND user_id = auth.uid()
        )
    );

-- Políticas para tabela event_messages
CREATE POLICY "Mensagens visíveis para todos" ON public.event_messages
    FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem enviar mensagens" ON public.event_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias mensagens" ON public.event_messages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir suas próprias mensagens" ON public.event_messages
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins podem gerenciar qualquer mensagem" ON public.event_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas para a tabela de mensagens
CREATE POLICY event_messages_insert_policy ON public.event_messages
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY event_messages_select_policy ON public.event_messages
    FOR SELECT USING (TRUE);

CREATE POLICY event_messages_update_policy ON public.event_messages
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'))
    WITH CHECK (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE POLICY event_messages_delete_policy ON public.event_messages
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

-- Remover funções existentes para evitar conflitos
DROP FUNCTION IF EXISTS get_upcoming_events();
-- Remover todas as possíveis versões da função create_event para evitar conflitos de tipo de retorno
DROP FUNCTION IF EXISTS create_event(text, text, text, text, text, text, uuid);
DROP FUNCTION IF EXISTS create_event(text, text, timestamp with time zone, timestamp with time zone, text, text, uuid);
DROP FUNCTION IF EXISTS create_event(text, text, timestamp with time zone, text, text, text, uuid);
DROP FUNCTION IF EXISTS create_event(text, text, text, timestamp with time zone, text, text, uuid);

-- Função para obter eventos futuros
CREATE OR REPLACE FUNCTION get_upcoming_events()
RETURNS SETOF public.events
LANGUAGE plpgsql
AS $get_upcoming_events_function$
BEGIN
    RETURN QUERY 
    SELECT * FROM public.events
    WHERE status = 'upcoming' 
    AND date >= NOW()
    ORDER BY date ASC;
END;
$get_upcoming_events_function$;

-- Conceder permissão para acessar a função
GRANT EXECUTE ON FUNCTION get_upcoming_events() TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_events() TO anon;

-- Função para criar evento (contorna políticas RLS)
CREATE OR REPLACE FUNCTION create_event(
    p_title TEXT,
    p_description TEXT,
    p_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE,
    p_location TEXT,
    p_status TEXT,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios do criador da função, não do usuário chamador
AS $create_event_function$
DECLARE
    v_result JSONB;
    v_event_id UUID;
    v_user_role TEXT;
    v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- Verificar se o usuário existe e é admin
    SELECT role INTO v_user_role FROM users WHERE id = p_user_id;
    
    IF v_user_role IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado';
    END IF;
    
    IF v_user_role != 'admin' THEN
        RAISE EXCEPTION 'Apenas administradores podem criar eventos';
    END IF;
    
    -- Inserir o evento
    INSERT INTO events (
        title,
        description,
        date,
        end_date,
        location,
        status,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        p_title,
        p_description,
        p_date,
        p_end_date,
        p_location,
        COALESCE(p_status, 'upcoming'),
        p_user_id,
        v_now,
        v_now
    )
    RETURNING id INTO v_event_id;
    
    -- Recuperar o evento criado
    SELECT row_to_json(e)::JSONB INTO v_result
    FROM (
        SELECT 
            e.*,
            u.username as creator_name
        FROM 
            events e
            LEFT JOIN users u ON e.created_by = u.id
        WHERE 
            e.id = v_event_id
    ) e;
    
    RETURN v_result;
END;
$create_event_function$;

-- Conceder permissão para a função ser executada por usuários autenticados
GRANT EXECUTE ON FUNCTION create_event TO authenticated;

-- Instruções para o administrador
COMMENT ON TABLE public.events IS 'Tabela principal de eventos';
COMMENT ON TABLE public.event_attendances IS 'Confirmações de presença em eventos';
COMMENT ON TABLE public.event_items IS 'Itens que os participantes levarão para os eventos';
COMMENT ON TABLE public.event_messages IS 'Mensagens no chat do evento';
COMMENT ON FUNCTION get_upcoming_events IS 'Busca eventos futuros com tipagem correta';
COMMENT ON FUNCTION create_event IS 'Cria um novo evento com permissões elevadas';

-- Mensagem de conclusão
DO $do$
BEGIN
    RAISE NOTICE 'Tabelas e configurações de eventos criadas com sucesso!';
END
$do$; 