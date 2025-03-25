-- Script para criar o bucket de armazenamento de perfis e configurar permissões
-- Este script configura o bucket "profiles" no Supabase Storage

-- Verificar se o bucket 'profiles' já existe e criá-lo se não existir
DO $$
BEGIN
    -- Verificar se o bucket existe
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE name = 'profiles'
    ) THEN
        -- Criar o bucket se não existir
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('profiles', 'profiles', false);
        
        RAISE NOTICE 'Bucket "profiles" criado com sucesso!';
    ELSE
        RAISE NOTICE 'Bucket "profiles" já existe.';
    END IF;
END
$$;

-- Remover políticas existentes para evitar duplicação
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Criar políticas de segurança para o bucket 'profiles'

-- 1. Permitir acesso público para leitura de avatares
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'profiles' AND
    position('avatars' in name) > 0
);

-- 2. Permitir que usuários autenticados façam upload de seus próprios avatares
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'profiles' AND
    position('avatars' in name) > 0 AND
    position(auth.uid()::text in name) > 0
);

-- 3. Permitir que usuários autenticados atualizem seus próprios avatares
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'profiles' AND
    position('avatars' in name) > 0 AND
    position(auth.uid()::text in name) > 0
);

-- 4. Permitir que usuários autenticados excluam seus próprios avatares
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'profiles' AND
    position('avatars' in name) > 0 AND
    position(auth.uid()::text in name) > 0
);

-- Mensagem final
DO $$
BEGIN
    RAISE NOTICE 'Políticas de segurança configuradas para o bucket "profiles".';
    RAISE NOTICE 'Políticas implementadas:';
    RAISE NOTICE '1. Acesso público de leitura para imagens de avatar';
    RAISE NOTICE '2. Usuários autenticados podem fazer upload de seus próprios avatares';
    RAISE NOTICE '3. Usuários autenticados podem atualizar seus próprios avatares';
    RAISE NOTICE '4. Usuários autenticados podem excluir seus próprios avatares';
END
$$; 