-- Script para verificar e corrigir a constraint de status na tabela event_attendances

-- 1. Verificar quais são os valores permitidos na restrição atual
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.event_attendances'::regclass
  AND conname = 'event_attendances_status_check';

-- 2. Alterar a restrição para permitir os valores que precisamos
DO $$
BEGIN
  -- Remover a restrição existente
  ALTER TABLE public.event_attendances 
  DROP CONSTRAINT IF EXISTS event_attendances_status_check;
  
  -- Criar uma nova restrição que permita todos os valores necessários
  ALTER TABLE public.event_attendances
  ADD CONSTRAINT event_attendances_status_check
  CHECK (status IN ('confirmed', 'declined', 'maybe', 'pending', 'cancelled'));
  
  RAISE NOTICE 'Restrição atualizada com sucesso. Agora permite os valores: confirmed, declined, maybe, pending, cancelled';
END;
$$; 