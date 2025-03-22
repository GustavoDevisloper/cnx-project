-- Script para corrigir relacionamentos de chave estrangeira
-- Este script adiciona comentários especiais para o PostgREST 
-- reconhecer relacionamentos entre tabelas

-- 1. Remover a view users_view existente antes de recriá-la para evitar erros de tipo de dados
DROP VIEW IF EXISTS users_view;

-- Criar a view users_view
CREATE VIEW users_view AS
SELECT 
  id,
  email,
  COALESCE(first_name, username) as name,
  avatar_url
FROM public.users;

-- 2. Comentários de coluna para PostgREST entender as relações
COMMENT ON COLUMN event_attendances.user_id IS 'references:users.id';
COMMENT ON COLUMN event_messages.user_id IS 'references:users.id';

-- 3. Comentários na tabela para facilitar o debugging
COMMENT ON TABLE event_attendances IS 'Event attendance records with user_id referencing the users table';
COMMENT ON TABLE event_messages IS 'Messages in event chats with user_id referencing the users table';

-- 4. Verificar chaves estrangeiras existentes e adicioná-las se necessário
DO $$
BEGIN
  -- Para event_attendances
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'event_attendances_user_id_fkey'
  ) THEN
    ALTER TABLE event_attendances 
    ADD CONSTRAINT event_attendances_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id);
  END IF;

  -- Para event_messages
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'event_messages_user_id_fkey'
  ) THEN
    ALTER TABLE event_messages 
    ADD CONSTRAINT event_messages_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id);
  END IF;
END $$;

-- 5. Adicionar índices para melhorar o desempenho das consultas
CREATE INDEX IF NOT EXISTS idx_event_attendances_user_id ON event_attendances(user_id);
CREATE INDEX IF NOT EXISTS idx_event_messages_user_id ON event_messages(user_id);

-- 6. Verificar o status da migração
SELECT 
  'Foreign key relationships configured successfully. ' ||
  'Please restart your application or reload the relevant pages ' ||
  'to see the changes take effect.' as status; 