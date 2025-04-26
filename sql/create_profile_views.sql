-- Script para criar e configurar a tabela de visualizações de perfil no Supabase
-- Execute este script no SQL Editor do Supabase

-- Verificar se a extensão uuid-ossp está habilitada (necessária para uuid_generate_v4)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar a tabela profile_views se ela não existir
CREATE TABLE IF NOT EXISTS profile_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL,
    viewer_id UUID,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_anonymous BOOLEAN DEFAULT FALSE,
    
    -- Chaves estrangeiras
    CONSTRAINT fk_profile_id FOREIGN KEY (profile_id) 
        REFERENCES auth.users (id) ON DELETE CASCADE,
    CONSTRAINT fk_viewer_id FOREIGN KEY (viewer_id) 
        REFERENCES auth.users (id) ON DELETE SET NULL
);

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id ON profile_views (profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer_id ON profile_views (viewer_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON profile_views (viewed_at);

-- Adicionar política RLS para segurança
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança em nível de linha (RLS)
-- Excluir políticas existentes se houver
DROP POLICY IF EXISTS profile_views_select ON profile_views;
DROP POLICY IF EXISTS profile_views_insert ON profile_views;

-- Permitir leitura de visualizações pelos donos dos perfis
CREATE POLICY profile_views_select ON profile_views 
    FOR SELECT USING (
        profile_id = auth.uid() OR 
        viewer_id = auth.uid() OR
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
    );

-- Permitir inserção por qualquer usuário autenticado ou anônimo
CREATE POLICY profile_views_insert ON profile_views 
    FOR INSERT WITH CHECK (true);

-- Garantir que a coluna profile_views exista na tabela users
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profile_views') THEN
        ALTER TABLE users ADD COLUMN profile_views INTEGER DEFAULT 0;
    END IF;
END $$;

-- Criar ou atualizar a função para incrementar o contador
CREATE OR REPLACE FUNCTION increment_profile_views()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se não é uma visualização do próprio usuário
    IF NEW.profile_id <> NEW.viewer_id OR NEW.viewer_id IS NULL THEN
        -- Atualizar o contador na tabela users
        UPDATE users 
        SET profile_views = COALESCE(profile_views, 0) + 1 
        WHERE id = NEW.profile_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover o trigger existente se houver
DROP TRIGGER IF EXISTS after_profile_view_insert ON profile_views;

-- Criar o trigger para executar a função automaticamente
CREATE TRIGGER after_profile_view_insert
AFTER INSERT ON profile_views
FOR EACH ROW
EXECUTE FUNCTION increment_profile_views();

-- Função para obter estatísticas de visualizações
CREATE OR REPLACE FUNCTION get_profile_views_stats(user_id UUID)
RETURNS TABLE (
    total_views BIGINT,
    unique_viewers BIGINT,
    weekly_views BIGINT,
    monthly_views BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT AS total_views,
        COUNT(DISTINCT viewer_id)::BIGINT AS unique_viewers,
        COUNT(*) FILTER (WHERE viewed_at > NOW() - INTERVAL '7 days')::BIGINT AS weekly_views,
        COUNT(*) FILTER (WHERE viewed_at > NOW() - INTERVAL '30 days')::BIGINT AS monthly_views
    FROM profile_views
    WHERE profile_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 