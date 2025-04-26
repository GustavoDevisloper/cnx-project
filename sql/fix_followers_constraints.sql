-- Script para corrigir a tabela de seguidores no Supabase

-- Primeiro, remover as restrições existentes
ALTER TABLE followers DROP CONSTRAINT IF EXISTS fk_follower_id;
ALTER TABLE followers DROP CONSTRAINT IF EXISTS fk_following_id;

-- Agora, recriar as restrições apontando para public.users em vez de auth.users
ALTER TABLE followers
ADD CONSTRAINT fk_follower_id 
FOREIGN KEY (follower_id) REFERENCES public.users (id) ON DELETE CASCADE;

ALTER TABLE followers
ADD CONSTRAINT fk_following_id 
FOREIGN KEY (following_id) REFERENCES public.users (id) ON DELETE CASCADE;

-- Mostrar uma mensagem de sucesso para confirmar que as alterações foram feitas
DO $$
BEGIN
    RAISE NOTICE 'Constraints da tabela followers atualizadas com sucesso!';
END $$; 