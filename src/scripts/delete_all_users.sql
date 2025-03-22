-- Script para deletar todos os usuários e dados relacionados
-- ATENÇÃO: Este script irá remover TODOS os dados de usuários. Use com cautela!

-- Primeiro, desabilitar temporariamente as restrições de chave estrangeira
SET session_replication_role = 'replica';

-- Deletar dados das tabelas relacionadas primeiro
DELETE FROM event_messages;
DELETE FROM event_items;
DELETE FROM event_attendances;
DELETE FROM events;
DELETE FROM questions;

-- Deletar usuários da tabela principal
DELETE FROM users;

-- Deletar usuários do sistema de autenticação do Supabase
DELETE FROM auth.users;

-- Reabilitar as restrições de chave estrangeira
SET session_replication_role = 'origin';

-- Resetar as sequências (se houver)
ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;

-- Log de confirmação
DO $$
BEGIN
    RAISE NOTICE 'Todos os usuários e dados relacionados foram removidos com sucesso.';
END $$; 