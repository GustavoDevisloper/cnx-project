-- Script para criar as tabelas relacionadas aos devocionais: likes e comentários
-- Este script cria as tabelas necessárias para suportar curtidas e comentários

DO $$
BEGIN
    RAISE NOTICE '🔍 Verificando e criando tabelas relacionadas aos devocionais...';
END $$;

-- Parte 1: Criar tabela devotional_likes (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'devotional_likes') THEN
        RAISE NOTICE 'Criando tabela devotional_likes...';
        
        CREATE TABLE public.devotional_likes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            devotional_id UUID NOT NULL,
            user_id UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT devotional_likes_devotional_fkey FOREIGN KEY (devotional_id) 
                REFERENCES public.devotionals(id) ON DELETE CASCADE,
            CONSTRAINT devotional_likes_user_fkey FOREIGN KEY (user_id) 
                REFERENCES public.users(id) ON DELETE CASCADE,
            CONSTRAINT devotional_likes_unique UNIQUE (devotional_id, user_id)
        );
        
        -- Adicionar comentário para o PostgREST entender as relações
        COMMENT ON TABLE public.devotional_likes IS 'Likes em devocionais pelos usuários';
        COMMENT ON COLUMN public.devotional_likes.devotional_id IS 'references:devotionals.id';
        COMMENT ON COLUMN public.devotional_likes.user_id IS 'references:users.id';
        
        -- Criar índices para melhorar performance
        CREATE INDEX idx_devotional_likes_devotional_id ON public.devotional_likes(devotional_id);
        CREATE INDEX idx_devotional_likes_user_id ON public.devotional_likes(user_id);
        
        RAISE NOTICE 'Tabela devotional_likes criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela devotional_likes já existe.';
    END IF;
END $$;

-- Parte 2: Criar tabela devotional_comments (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'devotional_comments') THEN
        RAISE NOTICE 'Criando tabela devotional_comments...';
        
        CREATE TABLE public.devotional_comments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            devotional_id UUID NOT NULL,
            user_id UUID NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT devotional_comments_devotional_fkey FOREIGN KEY (devotional_id) 
                REFERENCES public.devotionals(id) ON DELETE CASCADE,
            CONSTRAINT devotional_comments_user_fkey FOREIGN KEY (user_id) 
                REFERENCES public.users(id) ON DELETE CASCADE
        );
        
        -- Adicionar comentário para o PostgREST entender as relações
        COMMENT ON TABLE public.devotional_comments IS 'Comentários em devocionais pelos usuários';
        COMMENT ON COLUMN public.devotional_comments.devotional_id IS 'references:devotionals.id';
        COMMENT ON COLUMN public.devotional_comments.user_id IS 'references:users.id';
        
        -- Criar índices para melhorar performance
        CREATE INDEX idx_devotional_comments_devotional_id ON public.devotional_comments(devotional_id);
        CREATE INDEX idx_devotional_comments_user_id ON public.devotional_comments(user_id);
        CREATE INDEX idx_devotional_comments_created_at ON public.devotional_comments(created_at);
        
        RAISE NOTICE 'Tabela devotional_comments criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela devotional_comments já existe.';
    END IF;
END $$;

-- Parte 3: Configurar RLS (Row Level Security) para as tabelas
DO $$
BEGIN
    RAISE NOTICE 'Configurando políticas de segurança (RLS)...';
    
    -- Habilitar RLS para as tabelas
    ALTER TABLE public.devotional_likes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.devotional_comments ENABLE ROW LEVEL SECURITY;
    
    -- Remover políticas existentes para evitar duplicações
    DROP POLICY IF EXISTS "Qualquer pessoa pode ver curtidas" ON public.devotional_likes;
    DROP POLICY IF EXISTS "Usuários autenticados podem curtir" ON public.devotional_likes;
    DROP POLICY IF EXISTS "Usuários podem remover suas próprias curtidas" ON public.devotional_likes;
    
    DROP POLICY IF EXISTS "Qualquer pessoa pode ver comentários" ON public.devotional_comments;
    DROP POLICY IF EXISTS "Usuários autenticados podem comentar" ON public.devotional_comments;
    DROP POLICY IF EXISTS "Usuários podem editar seus próprios comentários" ON public.devotional_comments;
    DROP POLICY IF EXISTS "Usuários podem excluir seus próprios comentários" ON public.devotional_comments;
    DROP POLICY IF EXISTS "Admins podem gerenciar qualquer comentário" ON public.devotional_comments;
    
    -- Criar políticas para devotional_likes
    CREATE POLICY "Qualquer pessoa pode ver curtidas" 
        ON public.devotional_likes FOR SELECT 
        USING (true);
    
    CREATE POLICY "Usuários autenticados podem curtir" 
        ON public.devotional_likes FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Usuários podem remover suas próprias curtidas" 
        ON public.devotional_likes FOR DELETE 
        USING (auth.uid() = user_id);
    
    -- Criar políticas para devotional_comments
    CREATE POLICY "Qualquer pessoa pode ver comentários" 
        ON public.devotional_comments FOR SELECT 
        USING (true);
    
    CREATE POLICY "Usuários autenticados podem comentar" 
        ON public.devotional_comments FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Usuários podem editar seus próprios comentários" 
        ON public.devotional_comments FOR UPDATE 
        USING (auth.uid() = user_id);
    
    CREATE POLICY "Usuários podem excluir seus próprios comentários" 
        ON public.devotional_comments FOR DELETE 
        USING (auth.uid() = user_id);
    
    CREATE POLICY "Admins podem gerenciar qualquer comentário" 
        ON public.devotional_comments 
        USING (
            EXISTS (
                SELECT 1 FROM public.users
                WHERE id = auth.uid() AND role = 'admin'
            )
        );
    
    RAISE NOTICE 'Políticas de segurança configuradas com sucesso!';
END $$;

-- Parte 4: Criar funções auxiliares para trabalhar com likes e comentários
DO $$
BEGIN
    RAISE NOTICE 'Criando funções auxiliares para likes e comentários...';
    
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
        v_exists BOOLEAN;
    BEGIN
        SELECT EXISTS (
            SELECT 1
            FROM public.devotional_likes
            WHERE devotional_id = p_devotional_id AND user_id = p_user_id
        ) INTO v_exists;
        
        RETURN v_exists;
    END;
    $$;
    
    -- Função para adicionar comentário
    CREATE OR REPLACE FUNCTION add_devotional_comment(
        p_devotional_id UUID,
        p_user_id UUID,
        p_content TEXT
    )
    RETURNS UUID
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
        v_comment_id UUID;
    BEGIN
        INSERT INTO public.devotional_comments (
            devotional_id,
            user_id,
            content
        ) VALUES (
            p_devotional_id,
            p_user_id,
            p_content
        ) RETURNING id INTO v_comment_id;
        
        RETURN v_comment_id;
    END;
    $$;
    
    -- Conceder permissões para as funções
    GRANT EXECUTE ON FUNCTION count_devotional_likes(UUID) TO authenticated;
    GRANT EXECUTE ON FUNCTION count_devotional_likes(UUID) TO anon;
    
    GRANT EXECUTE ON FUNCTION has_user_liked_devotional(UUID, UUID) TO authenticated;
    GRANT EXECUTE ON FUNCTION has_user_liked_devotional(UUID, UUID) TO anon;
    
    GRANT EXECUTE ON FUNCTION add_devotional_comment(UUID, UUID, TEXT) TO authenticated;
    GRANT EXECUTE ON FUNCTION add_devotional_comment(UUID, UUID, TEXT) TO anon;
    
    RAISE NOTICE 'Funções auxiliares criadas com sucesso!';
END $$;

-- Parte 5: Verificar que as tabelas e funções foram criadas
SELECT 
    table_name, 
    table_type
FROM 
    information_schema.tables
WHERE 
    table_schema = 'public' 
    AND table_name IN ('devotional_likes', 'devotional_comments')
ORDER BY 
    table_name;

SELECT 
    routine_name,
    routine_type,
    data_type AS return_type
FROM 
    information_schema.routines
WHERE 
    routine_schema = 'public'
    AND routine_name IN ('count_devotional_likes', 'has_user_liked_devotional', 'add_devotional_comment')
ORDER BY 
    routine_name;

-- Resumo final
DO $$
BEGIN
    RAISE NOTICE '
✅ Script de criação de tabelas relacionadas executado com sucesso!

As seguintes estruturas foram criadas ou verificadas:

1. Tabelas:
   - devotional_likes: Para armazenar curtidas em devocionais
   - devotional_comments: Para armazenar comentários em devocionais

2. Índices:
   - Índices para melhorar o desempenho de consultas por devotional_id e user_id
   
3. Políticas de Segurança (RLS):
   - Configuradas para permitir visualização pública
   - Restrições adequadas para inserção, atualização e exclusão

4. Funções Auxiliares:
   - count_devotional_likes(devotional_id): Conta likes de um devocional
   - has_user_liked_devotional(devotional_id, user_id): Verifica se um usuário curtiu um devocional
   - add_devotional_comment(devotional_id, user_id, content): Adiciona um comentário

Para testar, execute:
SELECT count_devotional_likes(''UUID_DE_UM_DEVOCIONAL'');
';
END $$; 