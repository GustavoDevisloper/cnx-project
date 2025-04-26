-- Função para ser executada pelo job cron no PostgreSQL/Supabase
-- Esta função será chamada a cada minuto para processar mensagens agendadas

-- Função para processar mensagens agendadas
CREATE OR REPLACE FUNCTION public.process_scheduled_messages()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _processed_count INTEGER := 0;
    _message RECORD;
    _now TIMESTAMPTZ := now();
BEGIN
    -- Registra o início da execução
    INSERT INTO public.system_logs (action, details)
    VALUES ('process_scheduled_messages', json_build_object('started_at', _now));
    
    -- Percorre todas as mensagens pendentes que já deveriam ter sido enviadas
    FOR _message IN 
        SELECT * FROM public.scheduled_messages 
        WHERE status = 'pending' 
        AND scheduled_time <= _now
        ORDER BY scheduled_time ASC
        LIMIT 50
    LOOP
        BEGIN
            -- Atualiza status para "processing" para evitar processamento concorrente
            UPDATE public.scheduled_messages
            SET status = 'processing',
                updated_at = _now
            WHERE id = _message.id;
            
            -- Aqui seria o código que envia a mensagem via WhatsApp API
            -- Como não temos acesso direto à API do WhatsApp de dentro do PostgreSQL,
            -- vamos apenas marcar como "sent" e a aplicação React irá processar de fato
            
            -- Atualiza status para "ready_to_send" para ser processado pela aplicação
            UPDATE public.scheduled_messages
            SET status = 'ready_to_send',
                updated_at = _now
            WHERE id = _message.id;
            
            _processed_count := _processed_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            -- Em caso de erro, registra e marca como falha
            UPDATE public.scheduled_messages
            SET status = 'failed',
                error_message = SQLERRM,
                updated_at = _now
            WHERE id = _message.id;
        END;
    END LOOP;
    
    -- Registra o fim da execução
    INSERT INTO public.system_logs (action, details)
    VALUES ('process_scheduled_messages', json_build_object(
        'completed_at', now(),
        'processed_count', _processed_count,
        'duration_ms', extract(epoch from now() - _now) * 1000
    ));
    
    RETURN _processed_count;
END;
$$;

-- Função empacotadora para uso em cron jobs
CREATE OR REPLACE FUNCTION public.whatsapp_scheduler_job()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM process_scheduled_messages();
END;
$$;

-- Tabela de logs do sistema (caso não exista)
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Permissões
GRANT EXECUTE ON FUNCTION public.process_scheduled_messages() TO service_role;
GRANT EXECUTE ON FUNCTION public.whatsapp_scheduler_job() TO postgres;
GRANT INSERT ON public.system_logs TO service_role;

-- Comentário para configuração
COMMENT ON FUNCTION public.whatsapp_scheduler_job() IS 
'Função a ser executada pelo cron job do Supabase. Configure-o para rodar a cada minuto:
SELECT cron.schedule(
  ''process-whatsapp-scheduled-messages'',  -- nome único do job
  ''* * * * *'',                           -- expressão cron: a cada minuto
  $$SELECT whatsapp_scheduler_job()$$      -- consulta SQL a ser executada
);'; 