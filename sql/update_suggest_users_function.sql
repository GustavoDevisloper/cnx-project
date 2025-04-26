-- Script para atualizar a função suggest_users_to_follow
-- Execute este script no SQL Editor do Supabase

-- Primeiro, remover a função existente
DROP FUNCTION IF EXISTS public.suggest_users_to_follow(integer);

-- Agora, criar a nova versão da função com o tipo de retorno correto
CREATE OR REPLACE FUNCTION public.suggest_users_to_follow(limit_count integer DEFAULT 10)
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
        u.id <> auth.uid()
        AND NOT EXISTS (
            SELECT 1 FROM followers f 
            WHERE f.follower_id = auth.uid() 
            AND f.following_id = u.id
        )
    ORDER BY 
        u.role DESC, u.profile_views DESC, u.created_at ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que a função pode ser executada pelos usuários autenticados
GRANT EXECUTE ON FUNCTION suggest_users_to_follow TO authenticated; 