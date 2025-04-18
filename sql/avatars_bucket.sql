-- Script para configurar as permissões do bucket 'avatars' no Supabase Storage
-- Correção para o erro "new row violates row-level security policy"

-- 1. Remover políticas existentes para evitar duplicação
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- 2. Criar políticas mais simples e permissivas
-- Permitir leitura pública para todos os objetos no bucket avatars
CREATE POLICY "Public read access for avatars bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Permitir que usuários autenticados façam upload no bucket avatars
CREATE POLICY "Authenticated users can upload to avatars bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Permitir que usuários autenticados atualizem no bucket avatars
CREATE POLICY "Authenticated users can update in avatars bucket"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Permitir que usuários autenticados excluam no bucket avatars
CREATE POLICY "Authenticated users can delete from avatars bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- Mensagem de conclusão
DO $$
BEGIN
    RAISE NOTICE 'Políticas de segurança configuradas para o bucket "avatars".';
    RAISE NOTICE 'As políticas foram criadas para permitir acesso mais amplo.';
END
$$; 