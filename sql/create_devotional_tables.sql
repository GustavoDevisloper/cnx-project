-- Script para criar as tabelas relacionadas aos devocionais
-- Execute este script no console SQL do Supabase

-- Tabela de devocionais
CREATE TABLE IF NOT EXISTS public.devotionals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    scripture TEXT NOT NULL,
    scripture_text TEXT,
    author TEXT NOT NULL,
    author_id UUID REFERENCES public.users(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    day_of_week TEXT,
    image_url TEXT,
    is_ai_generated BOOLEAN DEFAULT false,
    "references" TEXT[],
    transmission_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de curtidas em devocionais
CREATE TABLE IF NOT EXISTS public.devotional_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    devotional_id UUID NOT NULL REFERENCES public.devotionals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(devotional_id, user_id)
);

-- Tabela de comentários em devocionais
CREATE TABLE IF NOT EXISTS public.devotional_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    devotional_id UUID NOT NULL REFERENCES public.devotionals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_devotionals_date ON public.devotionals(date);
CREATE INDEX IF NOT EXISTS idx_devotionals_author_id ON public.devotionals(author_id);
CREATE INDEX IF NOT EXISTS idx_devotional_likes_devotional_id ON public.devotional_likes(devotional_id);
CREATE INDEX IF NOT EXISTS idx_devotional_likes_user_id ON public.devotional_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_devotional_comments_devotional_id ON public.devotional_comments(devotional_id);
CREATE INDEX IF NOT EXISTS idx_devotional_comments_user_id ON public.devotional_comments(user_id);

-- Função para obter o devocional do dia
CREATE OR REPLACE FUNCTION get_daily_devotional()
RETURNS SETOF public.devotionals
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY 
    SELECT * FROM public.devotionals
    WHERE date = CURRENT_DATE
    ORDER BY created_at DESC
    LIMIT 1;
END;
$$;

-- Se não houver um devocional para o dia atual, retorne o mais recente
CREATE OR REPLACE FUNCTION get_latest_devotional()
RETURNS SETOF public.devotionals
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY 
    SELECT * FROM public.devotionals
    ORDER BY date DESC, created_at DESC
    LIMIT 1;
END;
$$;

-- Função para contar curtidas de um devocional
CREATE OR REPLACE FUNCTION count_devotional_likes(p_devotional_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.devotional_likes
    WHERE devotional_id = p_devotional_id;
    
    RETURN v_count;
END;
$$;

-- Função para verificar se um usuário curtiu um devocional
CREATE OR REPLACE FUNCTION has_user_liked_devotional(p_devotional_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_liked BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM public.devotional_likes
        WHERE devotional_id = p_devotional_id AND user_id = p_user_id
    ) INTO v_liked;
    
    RETURN v_liked;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_daily_devotional() TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_devotional() TO anon;
GRANT EXECUTE ON FUNCTION get_latest_devotional() TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_devotional() TO anon;
GRANT EXECUTE ON FUNCTION count_devotional_likes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION count_devotional_likes(UUID) TO anon;
GRANT EXECUTE ON FUNCTION has_user_liked_devotional(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_user_liked_devotional(UUID, UUID) TO anon;

-- RLS policies para devocionais (todos podem ver, apenas admin/autenticados podem criar)
ALTER TABLE public.devotionals ENABLE ROW LEVEL SECURITY;

-- Políticas para devocionais
CREATE POLICY devotionals_select_policy ON public.devotionals
    FOR SELECT USING (true);
    
CREATE POLICY devotionals_insert_policy ON public.devotionals
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'leader'))
    );
    
CREATE POLICY devotionals_update_policy ON public.devotionals
    FOR UPDATE USING (
        auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'leader'))
    );
    
CREATE POLICY devotionals_delete_policy ON public.devotionals
    FOR DELETE USING (
        auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'leader'))
    );

-- RLS policies para curtidas (todos podem ver, usuários autenticados podem criar/deletar suas próprias)
ALTER TABLE public.devotional_likes ENABLE ROW LEVEL SECURITY;

-- Políticas para curtidas
CREATE POLICY devotional_likes_select_policy ON public.devotional_likes
    FOR SELECT USING (true);
    
CREATE POLICY devotional_likes_insert_policy ON public.devotional_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
CREATE POLICY devotional_likes_delete_policy ON public.devotional_likes
    FOR DELETE USING (auth.uid() = user_id);

-- RLS policies para comentários (todos podem ver, usuários autenticados podem criar seus próprios)
ALTER TABLE public.devotional_comments ENABLE ROW LEVEL SECURITY;

-- Políticas para comentários
CREATE POLICY devotional_comments_select_policy ON public.devotional_comments
    FOR SELECT USING (true);
    
CREATE POLICY devotional_comments_insert_policy ON public.devotional_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
CREATE POLICY devotional_comments_update_policy ON public.devotional_comments
    FOR UPDATE USING (auth.uid() = user_id);
    
CREATE POLICY devotional_comments_delete_policy ON public.devotional_comments
    FOR DELETE USING (
        auth.uid() = user_id OR 
        auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'leader'))
    ); 