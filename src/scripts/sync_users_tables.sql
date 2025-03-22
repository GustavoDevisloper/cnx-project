-- Script para sincronizar usuários entre auth.users e a tabela pública users
-- Usado para resolver problemas de chave estrangeira na tabela de perguntas

-- Verifica se existe a tabela de usuários, se não existir, cria
DO $users_block$
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
    ) INTO table_exists;

    IF NOT table_exists THEN
        -- Cria a tabela de usuários
        CREATE TABLE public.users (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT,
            username TEXT,
            display_name TEXT,
            first_name TEXT,
            phone_number TEXT,
            bio TEXT,
            avatar_url TEXT,
            role TEXT DEFAULT 'user',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            profile_views INTEGER DEFAULT 0
        );
        
        -- Cria índices
        CREATE INDEX idx_users_email ON users(email);
        CREATE INDEX idx_users_role ON users(role);
        
        -- Habilita RLS
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        
        -- Remover políticas existentes para evitar duplicação
        DROP POLICY IF EXISTS "Usuários podem ver seus próprios perfis" ON users;
        DROP POLICY IF EXISTS "Administradores podem ver todos os perfis" ON users;
        DROP POLICY IF EXISTS "Líderes podem ver todos os perfis" ON users;
        DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON users;
        DROP POLICY IF EXISTS "Administradores podem atualizar qualquer perfil" ON users;
        DROP POLICY IF EXISTS "Permitir inserção durante cadastro" ON users;
        
        -- Cria políticas básicas
        CREATE POLICY "Usuários podem ver seus próprios perfis" ON users
            FOR SELECT USING (auth.uid() = id);
            
        CREATE POLICY "Administradores podem ver todos os perfis" ON users
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM users
                    WHERE users.id = auth.uid()
                    AND users.role = 'admin'
                )
            );
            
        CREATE POLICY "Líderes podem ver todos os perfis" ON users
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM users
                    WHERE users.id = auth.uid()
                    AND users.role = 'leader'
                )
            );
            
        CREATE POLICY "Usuários podem atualizar seus próprios perfis" ON users
            FOR UPDATE USING (auth.uid() = id);
            
        CREATE POLICY "Administradores podem atualizar qualquer perfil" ON users
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM users
                    WHERE users.id = auth.uid()
                    AND users.role = 'admin'
                )
            );
            
        CREATE POLICY "Permitir inserção durante cadastro" ON users
            FOR INSERT WITH CHECK (auth.uid() = id);
            
        RAISE NOTICE 'Tabela users criada com sucesso.';
    ELSE
        RAISE NOTICE 'Tabela users já existe, pulando criação.';
        
        -- Remover políticas existentes para garantir que estejam atualizadas
        DROP POLICY IF EXISTS "Usuários podem ver seus próprios perfis" ON users;
        DROP POLICY IF EXISTS "Administradores podem ver todos os perfis" ON users;
        DROP POLICY IF EXISTS "Líderes podem ver todos os perfis" ON users;
        DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON users;
        DROP POLICY IF EXISTS "Administradores podem atualizar qualquer perfil" ON users;
        DROP POLICY IF EXISTS "Permitir inserção durante cadastro" ON users;
        
        -- Recriar políticas para garantir consistência
        CREATE POLICY "Usuários podem ver seus próprios perfis" ON users
            FOR SELECT USING (auth.uid() = id);
            
        CREATE POLICY "Administradores podem ver todos os perfis" ON users
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM users
                    WHERE users.id = auth.uid()
                    AND users.role = 'admin'
                )
            );
            
        CREATE POLICY "Líderes podem ver todos os perfis" ON users
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM users
                    WHERE users.id = auth.uid()
                    AND users.role = 'leader'
                )
            );
            
        CREATE POLICY "Usuários podem atualizar seus próprios perfis" ON users
            FOR UPDATE USING (auth.uid() = id);
            
        CREATE POLICY "Administradores podem atualizar qualquer perfil" ON users
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM users
                    WHERE users.id = auth.uid()
                    AND users.role = 'admin'
                )
            );
            
        CREATE POLICY "Permitir inserção durante cadastro" ON users
            FOR INSERT WITH CHECK (auth.uid() = id);
        
        RAISE NOTICE 'Políticas da tabela users atualizadas.';
    END IF;
END $users_block$;

-- Remover função existente para evitar duplicação
DROP FUNCTION IF EXISTS sync_users();

-- Função para sincronizar usuários entre auth.users e users
CREATE OR REPLACE FUNCTION sync_users()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $sync_function$
DECLARE
    v_count_inserted INTEGER := 0;
    v_count_updated INTEGER := 0;
    v_count_deleted INTEGER := 0;
    v_result TEXT;
BEGIN
    -- Inserir novos usuários
    WITH new_users AS (
        INSERT INTO public.users (
            id, email, username, role, created_at, updated_at
        )
        SELECT 
            au.id, 
            au.email, 
            COALESCE(au.raw_user_meta_data->>'username', SPLIT_PART(au.email, '@', 1)), 
            'user',
            NOW(),
            NOW()
        FROM auth.users au
        LEFT JOIN public.users pu ON au.id = pu.id
        WHERE pu.id IS NULL
        RETURNING id
    )
    SELECT COUNT(*) INTO v_count_inserted FROM new_users;
    
    -- Atualizar usuários existentes (opcional)
    -- Isso garante que os emails estejam sincronizados
    WITH updated_users AS (
        UPDATE public.users pu
        SET 
            email = au.email,
            updated_at = NOW()
        FROM auth.users au
        WHERE pu.id = au.id
        AND pu.email != au.email
        RETURNING pu.id
    )
    SELECT COUNT(*) INTO v_count_updated FROM updated_users;
    
    -- Opcional: Remover usuários que não existem mais em auth.users
    -- Descomente se você quiser esta funcionalidade
    -- WITH deleted_users AS (
    --     DELETE FROM public.users pu
    --     WHERE NOT EXISTS (
    --         SELECT 1 FROM auth.users au
    --         WHERE au.id = pu.id
    --     )
    --     RETURNING id
    -- )
    -- SELECT COUNT(*) INTO v_count_deleted FROM deleted_users;
    
    v_result := FORMAT('Sincronização concluída: %s usuários inseridos, %s usuários atualizados, %s usuários removidos.', 
        v_count_inserted, v_count_updated, v_count_deleted);
    
    RETURN v_result;
END $sync_function$;

-- Conceder permissão para executar a função
GRANT EXECUTE ON FUNCTION sync_users() TO authenticated;

-- Comentário para explicar a função
COMMENT ON FUNCTION sync_users IS 'Sincroniza usuários entre auth.users e a tabela pública users';

-- Instruções para o administrador do banco:
-- 1. Execute este script no SQL Editor do Supabase para criar a tabela e a função
-- 2. Sincronize os usuários executando: SELECT sync_users();
-- 3. Opcional: Para sincronização automática, você pode criar um gatilho ou programar uma tarefa

-- Trigger Opcional: Atualização automática quando um usuário é criado (descomente para habilitar)
-- CREATE OR REPLACE FUNCTION sync_user_on_auth_user_created()
-- RETURNS TRIGGER
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- AS $on_auth_create$
-- BEGIN
--     INSERT INTO public.users (id, email, username, role, created_at, updated_at)
--     VALUES (
--         NEW.id,
--         NEW.email,
--         COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
--         'user',
--         NOW(),
--         NOW()
--     )
--     ON CONFLICT (id) DO UPDATE SET
--         email = EXCLUDED.email,
--         updated_at = NOW();
--     RETURN NEW;
-- END $on_auth_create$;
-- 
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW EXECUTE FUNCTION sync_user_on_auth_user_created(); 