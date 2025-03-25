-- SQL para criar um bucket "profiles" no Supabase Storage

-- Verificar se o bucket 'profiles' já existe e criá-lo se não existir
DO $$
BEGIN
    -- Verificar se o bucket existe
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE name = 'profiles'
    ) THEN
        -- Criar o bucket se não existir
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('profiles', 'profiles', true);
        
        RAISE NOTICE 'Bucket "profiles" criado com sucesso!';
    ELSE
        RAISE NOTICE 'Bucket "profiles" já existe.';
    END IF;
END
$$;

-- Remover políticas existentes para evitar duplicação
DROP POLICY IF EXISTS "Imagens são acessíveis publicamente" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem fazer upload" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios arquivos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios arquivos" ON storage.objects;

-- Criar políticas de segurança para o bucket 'profiles'

-- 1. Permitir acesso público para leitura de imagens
CREATE POLICY "Imagens são acessíveis publicamente"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'profiles'
);

-- 2. Permitir que qualquer usuário faça upload (desabilitado RLS para upload)
CREATE POLICY "Usuários podem fazer upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'profiles'
);

-- 3. Permitir que usuários atualizem arquivos
CREATE POLICY "Usuários podem atualizar seus próprios arquivos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'profiles'
);

-- 4. Permitir que usuários excluam arquivos
CREATE POLICY "Usuários podem deletar seus próprios arquivos"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'profiles'
);

-- Crie a função RPC para sincronização de usuários sem passar pelo RLS
-- Esta função será chamada pelo cliente quando houver erros de recursão RLS
CREATE OR REPLACE FUNCTION sync_user(user_id UUID, user_email TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se o usuário já existe
    IF EXISTS (SELECT 1 FROM users WHERE id = user_id) THEN
        RETURN TRUE;
    END IF;
    
    -- Inserir o usuário
    INSERT INTO users (
        id, 
        email, 
        username,
        role, 
        created_at, 
        updated_at
    ) VALUES (
        user_id,
        user_email,
        split_part(user_email, '@', 1),
        'user',
        now(),
        now()
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Função para criar um registro mínimo de usuário
CREATE OR REPLACE FUNCTION create_minimal_user(user_id UUID, user_email TEXT, user_name TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se o usuário já existe
    IF EXISTS (SELECT 1 FROM users WHERE id = user_id) THEN
        RETURN TRUE;
    END IF;
    
    -- Inserir o usuário mínimo
    INSERT INTO users (
        id, 
        email, 
        username,
        role, 
        created_at
    ) VALUES (
        user_id,
        user_email,
        COALESCE(user_name, split_part(user_email, '@', 1)),
        'user',
        now()
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Função para sincronizar um usuário completo
CREATE OR REPLACE FUNCTION sync_complete_user(user_record JSONB)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se o usuário já existe
    IF EXISTS (SELECT 1 FROM users WHERE id = (user_record->>'id')::UUID) THEN
        -- Atualizar o usuário existente
        UPDATE users
        SET 
            email = user_record->>'email',
            username = COALESCE(user_record->>'username', split_part(user_record->>'email', '@', 1)),
            role = COALESCE(user_record->>'role', 'user'),
            first_name = user_record->>'first_name',
            bio = user_record->>'bio',
            avatar_url = user_record->>'avatar_url',
            updated_at = now()
        WHERE id = (user_record->>'id')::UUID;
    ELSE
        -- Inserir o usuário completo
        INSERT INTO users (
            id, 
            email, 
            username,
            role, 
            first_name,
            bio,
            avatar_url,
            created_at,
            updated_at
        ) VALUES (
            (user_record->>'id')::UUID,
            user_record->>'email',
            COALESCE(user_record->>'username', split_part(user_record->>'email', '@', 1)),
            COALESCE(user_record->>'role', 'user'),
            user_record->>'first_name',
            user_record->>'bio',
            user_record->>'avatar_url',
            COALESCE(user_record->>'created_at', now()),
            now()
        );
    END IF;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql; 