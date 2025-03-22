-- Script para corrigir chaves estrangeiras relacionadas a usuários
-- Use este script se encontrar erros de chave estrangeira mesmo após sincronizar os usuários

-- Parte 1: Verificar chaves estrangeiras atuais
DO $$
BEGIN
    RAISE NOTICE '🔍 Verificando chaves estrangeiras existentes...';
END $$;

SELECT 
    conrelid::regclass AS table_name,
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM 
    pg_constraint
WHERE 
    contype = 'f' 
    AND (conrelid = 'public.event_attendances'::regclass 
         OR conrelid = 'public.event_messages'::regclass)
    AND pg_get_constraintdef(oid) LIKE '%users%';

-- Parte 2: Remover e recriar corretamente as chaves estrangeiras
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Reconfigurando chaves estrangeiras...';
    
    -- event_attendances: usuário na tabela public.users
    BEGIN
        RAISE NOTICE 'Reconfigurando FK para event_attendances.user_id...';
        
        -- Remover constraint existente se houver
        ALTER TABLE public.event_attendances 
        DROP CONSTRAINT IF EXISTS event_attendances_user_id_fkey;
        
        -- Adicionar nova constraint para public.users
        ALTER TABLE public.event_attendances 
        ADD CONSTRAINT event_attendances_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id);
        
        RAISE NOTICE '✅ FK para event_attendances.user_id reconfigurada para public.users';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao reconfigurar FK para event_attendances.user_id: %', SQLERRM;
    END;
    
    -- event_messages: usuário na tabela public.users
    BEGIN
        RAISE NOTICE 'Reconfigurando FK para event_messages.user_id...';
        
        -- Remover constraint existente se houver
        ALTER TABLE public.event_messages 
        DROP CONSTRAINT IF EXISTS event_messages_user_id_fkey;
        
        -- Adicionar nova constraint para public.users
        ALTER TABLE public.event_messages 
        ADD CONSTRAINT event_messages_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id);
        
        RAISE NOTICE '✅ FK para event_messages.user_id reconfigurada para public.users';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao reconfigurar FK para event_messages.user_id: %', SQLERRM;
    END;
END $$;

-- Parte 3: Adicionar comentários para ajudar o PostgREST a entender as relações
COMMENT ON COLUMN event_attendances.user_id IS 'references:users.id';
COMMENT ON COLUMN event_messages.user_id IS 'references:users.id';

-- Parte 4: Verificar as chaves estrangeiras após as alterações
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Verificando chaves estrangeiras após as alterações...';
END $$;

SELECT 
    conrelid::regclass AS table_name,
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM 
    pg_constraint
WHERE 
    contype = 'f' 
    AND (conrelid = 'public.event_attendances'::regclass 
         OR conrelid = 'public.event_messages'::regclass)
    AND pg_get_constraintdef(oid) LIKE '%users%';

-- Parte 5: Criar índices para melhorar o desempenho
CREATE INDEX IF NOT EXISTS idx_event_attendances_user_id ON event_attendances(user_id);
CREATE INDEX IF NOT EXISTS idx_event_messages_user_id ON event_messages(user_id); 