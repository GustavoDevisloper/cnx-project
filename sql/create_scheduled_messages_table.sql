-- Script para criar a tabela de mensagens agendadas para o WhatsApp
-- Autor: Equipe Conexão Jovem
-- Data: 2023-10-31

-- Tabela para armazenar as mensagens agendadas para envio via WhatsApp
CREATE TABLE IF NOT EXISTS public.scheduled_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_phone TEXT NOT NULL,
    recipient_name TEXT,
    message_type TEXT NOT NULL,
    message_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    scheduled_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- Validação para o status
    CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'failed')),
    
    -- Validação para o tipo de mensagem
    CONSTRAINT valid_message_type CHECK (
        message_type IN ('devotional', 'event', 'welcome', 'birthday', 'reminder', 'announcement', 'custom')
    )
);

-- Índice para melhorar a performance da busca por mensagens pendentes
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_status_time 
ON public.scheduled_messages(status, scheduled_time)
WHERE status = 'pending';

-- Índice para melhorar a performance da busca por usuário criador
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_created_by
ON public.scheduled_messages(created_by);

-- Função para obter mensagens pendentes
CREATE OR REPLACE FUNCTION public.get_pending_messages(
    limit_param INTEGER DEFAULT 100
)
RETURNS SETOF public.scheduled_messages
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.scheduled_messages
    WHERE status = 'pending'
    AND scheduled_time <= now()
    ORDER BY scheduled_time ASC
    LIMIT limit_param;
END;
$$;

-- Função para cancelar mensagens pendentes
CREATE OR REPLACE FUNCTION public.cancel_scheduled_message(
    message_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _affected_rows INTEGER;
BEGIN
    DELETE FROM public.scheduled_messages
    WHERE id = message_id
    AND status = 'pending';
    
    GET DIAGNOSTICS _affected_rows = ROW_COUNT;
    
    RETURN _affected_rows > 0;
END;
$$;

-- Função para agendar uma mensagem
CREATE OR REPLACE FUNCTION public.schedule_message(
    recipient_phone TEXT,
    recipient_name TEXT,
    message_type TEXT,
    message_data JSONB,
    scheduled_time TIMESTAMPTZ,
    created_by UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _message_id UUID;
BEGIN
    -- Validação básica
    IF recipient_phone IS NULL OR message_type IS NULL OR scheduled_time IS NULL THEN
        RAISE EXCEPTION 'Parâmetros inválidos para agendar mensagem';
    END IF;
    
    -- Validação do tipo de mensagem
    IF message_type NOT IN ('devotional', 'event', 'welcome', 'birthday', 'reminder', 'announcement', 'custom') THEN
        RAISE EXCEPTION 'Tipo de mensagem inválido: %', message_type;
    END IF;
    
    -- Inserir a mensagem
    INSERT INTO public.scheduled_messages(
        recipient_phone,
        recipient_name,
        message_type,
        message_data,
        scheduled_time,
        created_by
    )
    VALUES (
        recipient_phone,
        recipient_name,
        message_type,
        message_data,
        scheduled_time,
        created_by
    )
    RETURNING id INTO _message_id;
    
    RETURN _message_id;
END;
$$;

-- Permissões para usuários autenticados
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.scheduled_messages TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_messages TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_scheduled_message TO authenticated;
GRANT EXECUTE ON FUNCTION public.schedule_message TO authenticated; 