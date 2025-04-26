-- Script para criar e configurar o bucket "avatars" no Supabase Storage
-- Execute este script no SQL Editor do Supabase para configurar corretamente o storage

-- Verificar se o bucket 'avatars' já existe e criá-lo se não existir
DO $$
BEGIN
    -- Verificar se o bucket existe
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE name = 'avatars'
    ) THEN
        -- Criar o bucket se não existir
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('avatars', 'avatars', true);
        
        RAISE NOTICE 'Bucket "avatars" criado com sucesso!';
    ELSE
        RAISE NOTICE 'Bucket "avatars" já existe.';
    END IF;
END
$$;

-- Remover políticas existentes para evitar duplicação
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatars são públicos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem fazer upload" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar próprios arquivos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem excluir próprios arquivos" ON storage.objects;

-- Criar políticas de segurança para o bucket 'avatars'

-- 1. Permitir acesso público para leitura de avatares
CREATE POLICY "Avatars são públicos" 
ON storage.objects FOR SELECT
USING (
    bucket_id = 'avatars'
);

-- 2. Permitir que usuários autenticados façam upload de avatares
CREATE POLICY "Usuários podem fazer upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars'
);

-- 3. Permitir que usuários autenticados atualizem arquivos no bucket
CREATE POLICY "Usuários podem atualizar próprios arquivos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars'
);

-- 4. Permitir que usuários autenticados excluam seus próprios arquivos
-- Versão corrigida sem usar sintaxe de array incompatível
CREATE POLICY "Usuários podem excluir próprios arquivos"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' AND
    (auth.uid()::text = SPLIT_PART(name, '/', 1) OR auth.jwt() ->> 'role' = 'service_role')
);

-- Verificar políticas configuradas
SELECT
    p.policyname AS policy_name,
    o.name AS table_name,
    p.operation,
    p.permissive,
    p.roles,
    p.cmd,
    CASE 
        WHEN p.with IS NOT NULL THEN p.with
        ELSE ''
    END AS with_check,
    CASE 
        WHEN p.using IS NOT NULL THEN p.using
        ELSE ''
    END AS using_check
FROM
    pg_policies p
JOIN
    pg_class o ON p.tableid = o.oid
JOIN
    pg_namespace n ON o.relnamespace = n.oid
WHERE
    n.nspname = 'storage' AND o.relname = 'objects';

-- Conceder permissões adicionais para todos os usuários autenticados
GRANT INSERT, SELECT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT ON storage.buckets TO authenticated;

-- Configurar bucket para acesso público
UPDATE storage.buckets 
SET public = true 
WHERE name = 'avatars';

-- Inserir registro de configuração
-- Verificar se a tabela app_config existe antes de tentar inserir
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'app_config'
    ) THEN
        INSERT INTO public.app_config (key, value, description, updated_at)
        VALUES (
            'storage_avatars_configured', 
            'true', 
            'Indica que o bucket de avatars foi configurado corretamente', 
            NOW()
        )
        ON CONFLICT (key) 
        DO UPDATE SET 
            value = 'true', 
            updated_at = NOW();
        
        RAISE NOTICE 'Registro de configuração atualizado';
    ELSE
        RAISE NOTICE 'Tabela app_config não encontrada, pulando registro de configuração';
    END IF;
END
$$;

-- Nota final
DO $$
BEGIN
    RAISE NOTICE 'Configuração do bucket "avatars" concluída com sucesso!';
END
$$; 