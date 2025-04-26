-- Script para criar e configurar a tabela de notificações no Supabase
-- Execute este script no SQL Editor do Supabase

-- Verificar se a extensão uuid-ossp está habilitada (necessária para uuid_generate_v4)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar a tabela notifications se ela não existir
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    related_user_id UUID,
    related_content_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Chaves estrangeiras
    CONSTRAINT fk_user_id FOREIGN KEY (user_id) 
        REFERENCES public.users (id) ON DELETE CASCADE,
    CONSTRAINT fk_related_user_id FOREIGN KEY (related_user_id) 
        REFERENCES public.users (id) ON DELETE SET NULL
);

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications (read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_related_user_id ON notifications (related_user_id);

-- Adicionar política RLS para segurança
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança em nível de linha (RLS)
-- Excluir políticas existentes se houver
DROP POLICY IF EXISTS notifications_select ON notifications;
DROP POLICY IF EXISTS notifications_insert ON notifications;
DROP POLICY IF EXISTS notifications_update ON notifications;
DROP POLICY IF EXISTS notifications_delete ON notifications;

-- Permitir leitura de notificações apenas pelo usuário dono da notificação ou admin
CREATE POLICY notifications_select ON notifications 
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Permitir inserção por qualquer usuário autenticado
-- É necessário permitir que usuários criem notificações para outros (ex: quando seguem alguém)
CREATE POLICY notifications_insert ON notifications 
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- Permitir atualização apenas pelo usuário dono da notificação
CREATE POLICY notifications_update ON notifications 
    FOR UPDATE USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Permitir exclusão apenas pelo usuário dono da notificação ou admin
CREATE POLICY notifications_delete ON notifications 
    FOR DELETE USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Função para marcar todas as notificações de um usuário como lidas
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(user_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE notifications
    SET read = TRUE
    WHERE user_id = user_uuid AND read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter notificações não lidas de um usuário
CREATE OR REPLACE FUNCTION get_unread_notifications(user_uuid UUID)
RETURNS SETOF notifications AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM notifications
    WHERE user_id = user_uuid AND read = FALSE
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter total de notificações não lidas de um usuário
CREATE OR REPLACE FUNCTION count_unread_notifications(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    count_result INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_result
    FROM notifications
    WHERE user_id = user_uuid AND read = FALSE;
    
    RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões para as funções
GRANT EXECUTE ON FUNCTION mark_all_notifications_as_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION count_unread_notifications TO authenticated; 