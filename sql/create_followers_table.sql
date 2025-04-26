-- Script para criar e configurar a tabela de seguidores no Supabase
-- Execute este script no SQL Editor do Supabase

-- Verificar se a extensão uuid-ossp está habilitada (necessária para uuid_generate_v4)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar a tabela followers se ela não existir
CREATE TABLE IF NOT EXISTS followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL,
    following_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Chaves estrangeiras
    CONSTRAINT fk_follower_id FOREIGN KEY (follower_id) 
        REFERENCES public.users (id) ON DELETE CASCADE,
    CONSTRAINT fk_following_id FOREIGN KEY (following_id) 
        REFERENCES public.users (id) ON DELETE CASCADE,
    
    -- Garantir que um usuário não possa seguir a mesma pessoa duas vezes
    CONSTRAINT unique_follower_pair UNIQUE (follower_id, following_id),
    
    -- Impedir que um usuário siga a si mesmo
    CONSTRAINT check_not_self_follow CHECK (follower_id <> following_id)
);

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers (follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers (following_id);
CREATE INDEX IF NOT EXISTS idx_followers_created_at ON followers (created_at);

-- Adicionar política RLS para segurança
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança em nível de linha (RLS)
-- Excluir políticas existentes se houver
DROP POLICY IF EXISTS followers_select ON followers;
DROP POLICY IF EXISTS followers_insert ON followers;
DROP POLICY IF EXISTS followers_delete ON followers;

-- Permitir leitura de seguidores por qualquer usuário autenticado
CREATE POLICY followers_select ON followers 
    FOR SELECT USING (true);

-- Permitir que usuários autenticados sigam outros usuários
CREATE POLICY followers_insert ON followers 
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Permitir que usuários autenticados deixem de seguir outros usuários
CREATE POLICY followers_delete ON followers 
    FOR DELETE USING (auth.uid() = follower_id);

-- Adicionar colunas de contagem de seguidores e seguindo na tabela de usuários (se não existirem)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'followers_count') THEN
        ALTER TABLE users ADD COLUMN followers_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'following_count') THEN
        ALTER TABLE users ADD COLUMN following_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Função para atualizar contadores quando um usuário segue outro
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Incrementar contador de seguidores do usuário que está sendo seguido
        UPDATE users 
        SET followers_count = COALESCE(followers_count, 0) + 1 
        WHERE id = NEW.following_id;
        
        -- Incrementar contador de "seguindo" do usuário que está seguindo
        UPDATE users 
        SET following_count = COALESCE(following_count, 0) + 1 
        WHERE id = NEW.follower_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrementar contador de seguidores do usuário que estava sendo seguido
        UPDATE users 
        SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0)
        WHERE id = OLD.following_id;
        
        -- Decrementar contador de "seguindo" do usuário que estava seguindo
        UPDATE users 
        SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0)
        WHERE id = OLD.follower_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover os triggers existentes se houver
DROP TRIGGER IF EXISTS after_follow_insert_or_delete ON followers;

-- Criar o trigger para atualizar contadores automaticamente
CREATE TRIGGER after_follow_insert_or_delete
AFTER INSERT OR DELETE ON followers
FOR EACH ROW
EXECUTE FUNCTION update_follow_counts();

-- Função para verificar se um usuário segue outro
CREATE OR REPLACE FUNCTION is_following(follower UUID, following UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM followers 
        WHERE follower_id = follower 
        AND following_id = following
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar usuários por nome ou username
CREATE OR REPLACE FUNCTION search_users(search_query TEXT, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
    id UUID,
    username TEXT,
    display_name TEXT,
    avatar_url TEXT,
    followers_count INTEGER,
    is_followed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.display_name,
        u.avatar_url,
        u.followers_count,
        is_following(auth.uid(), u.id) AS is_followed
    FROM 
        users u
    WHERE 
        u.id <> auth.uid() AND
        (
            u.display_name ILIKE '%' || search_query || '%' OR
            u.username ILIKE '%' || search_query || '%' OR
            u.first_name ILIKE '%' || search_query || '%'
        )
    ORDER BY
        u.followers_count DESC, u.username
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter os seguidores de um usuário
CREATE OR REPLACE FUNCTION get_followers(user_id UUID, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
    id UUID,
    username TEXT,
    display_name TEXT,
    avatar_url TEXT,
    followers_count INTEGER,
    is_followed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.display_name,
        u.avatar_url,
        u.followers_count,
        is_following(auth.uid(), u.id) AS is_followed
    FROM 
        followers f
    JOIN 
        users u ON f.follower_id = u.id
    WHERE 
        f.following_id = user_id
    ORDER BY
        f.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter os usuários que um usuário segue
CREATE OR REPLACE FUNCTION get_following(user_id UUID, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
    id UUID,
    username TEXT,
    display_name TEXT,
    avatar_url TEXT,
    followers_count INTEGER,
    is_followed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.display_name,
        u.avatar_url,
        u.followers_count,
        is_following(auth.uid(), u.id) AS is_followed
    FROM 
        followers f
    JOIN 
        users u ON f.following_id = u.id
    WHERE 
        f.follower_id = user_id
    ORDER BY
        f.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para sugerir usuários para seguir (usuários que o usuário atual não segue)
CREATE OR REPLACE FUNCTION public.suggest_users_to_follow(limit_count integer DEFAULT 10)
RETURNS SETOF public.users
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.* FROM users u
  WHERE u.id <> auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM followers f 
    WHERE f.follower_id = auth.uid() 
    AND f.following_id = u.id
  )
  ORDER BY u.role DESC, u.profile_views DESC, u.created_at ASC
  LIMIT limit_count;
END;
$$;

-- Garantir que as funções podem ser executadas pelos usuários
GRANT EXECUTE ON FUNCTION is_following TO authenticated;
GRANT EXECUTE ON FUNCTION search_users TO authenticated;
GRANT EXECUTE ON FUNCTION get_followers TO authenticated;
GRANT EXECUTE ON FUNCTION get_following TO authenticated;
GRANT EXECUTE ON FUNCTION suggest_users_to_follow TO authenticated; 