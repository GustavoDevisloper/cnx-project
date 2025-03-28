-- Script para criar as tabelas relacionadas aos devocionais
-- Execute este script no console SQL do Supabase

-- Tabela de devocionais
CREATE TABLE IF NOT EXISTS public.devotionals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    verse TEXT NOT NULL,
    verse_text TEXT,
    author TEXT NOT NULL,
    author_id UUID REFERENCES public.users(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    day_of_week TEXT,
    image_url TEXT,
    is_generated BOOLEAN DEFAULT false,
    theme TEXT DEFAULT 'reflexão',
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

-- RLS policies para devocionais (todos podem ver, apenas admin/autenticados podem criar)
ALTER TABLE public.devotionals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS devotionals_select_policy ON public.devotionals;
DROP POLICY IF EXISTS devotionals_insert_policy ON public.devotionals;
DROP POLICY IF EXISTS devotionals_update_policy ON public.devotionals;
DROP POLICY IF EXISTS devotionals_delete_policy ON public.devotionals;

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

-- Drop existing policies for likes if they exist
DROP POLICY IF EXISTS devotional_likes_select_policy ON public.devotional_likes;
DROP POLICY IF EXISTS devotional_likes_insert_policy ON public.devotional_likes;
DROP POLICY IF EXISTS devotional_likes_delete_policy ON public.devotional_likes;

-- Políticas para curtidas
ALTER TABLE public.devotional_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY devotional_likes_select_policy ON public.devotional_likes
    FOR SELECT USING (true);

CREATE POLICY devotional_likes_insert_policy ON public.devotional_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY devotional_likes_delete_policy ON public.devotional_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Drop existing policies for comments if they exist
DROP POLICY IF EXISTS devotional_comments_select_policy ON public.devotional_comments;
DROP POLICY IF EXISTS devotional_comments_insert_policy ON public.devotional_comments;
DROP POLICY IF EXISTS devotional_comments_update_policy ON public.devotional_comments;
DROP POLICY IF EXISTS devotional_comments_delete_policy ON public.devotional_comments;

-- Políticas para comentários
ALTER TABLE public.devotional_comments ENABLE ROW LEVEL SECURITY;

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