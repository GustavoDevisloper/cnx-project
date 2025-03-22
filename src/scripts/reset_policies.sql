-- Script to clean up and reset RLS policies
-- This should be run when encountering issues with policies

-- First drop all existing policies on the events tables
DROP POLICY IF EXISTS "Permitir visualização de eventos para todos" ON events;
DROP POLICY IF EXISTS "Permitir criação de eventos para administradores" ON events;
DROP POLICY IF EXISTS "Permitir atualização de eventos para administradores" ON events;
DROP POLICY IF EXISTS "Permitir exclusão de eventos para administradores" ON events;
DROP POLICY IF EXISTS "events_select_policy" ON events;
DROP POLICY IF EXISTS "events_insert_policy" ON events;
DROP POLICY IF EXISTS "events_update_policy" ON events;
DROP POLICY IF EXISTS "events_delete_policy" ON events;

DROP POLICY IF EXISTS "Permitir visualização de confirmações para todos" ON event_attendances;
DROP POLICY IF EXISTS "Permitir confirmação de presença para o próprio usuário" ON event_attendances;
DROP POLICY IF EXISTS "Permitir atualização de presença para o próprio usuário" ON event_attendances; 
DROP POLICY IF EXISTS "Permitir exclusão de presença para o próprio usuário" ON event_attendances;
DROP POLICY IF EXISTS "attendances_select_policy" ON event_attendances;
DROP POLICY IF EXISTS "attendances_insert_policy" ON event_attendances;
DROP POLICY IF EXISTS "attendances_update_policy" ON event_attendances;
DROP POLICY IF EXISTS "attendances_delete_policy" ON event_attendances;

DROP POLICY IF EXISTS "Permitir visualização de itens para todos" ON event_items;
DROP POLICY IF EXISTS "Permitir adição de itens para o próprio usuário" ON event_items;
DROP POLICY IF EXISTS "Permitir atualização de itens para o próprio usuário" ON event_items;
DROP POLICY IF EXISTS "Permitir exclusão de itens para o próprio usuário" ON event_items;
DROP POLICY IF EXISTS "items_select_policy" ON event_items;
DROP POLICY IF EXISTS "items_insert_policy" ON event_items;
DROP POLICY IF EXISTS "items_update_policy" ON event_items;
DROP POLICY IF EXISTS "items_delete_policy" ON event_items;

DROP POLICY IF EXISTS "Permitir visualização de mensagens para todos" ON event_messages;
DROP POLICY IF EXISTS "Permitir envio de mensagens para o próprio usuário" ON event_messages;
DROP POLICY IF EXISTS "Permitir atualização de mensagens para o próprio usuário" ON event_messages;
DROP POLICY IF EXISTS "Permitir exclusão de mensagens para o próprio usuário" ON event_messages;
DROP POLICY IF EXISTS "messages_select_policy" ON event_messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON event_messages;
DROP POLICY IF EXISTS "messages_update_policy" ON event_messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON event_messages;

-- Now recreate the minimal necessary policies with correct syntax
-- Ensure events table policies
CREATE POLICY "events_select_policy" 
ON events FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "events_insert_policy" 
ON events FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

CREATE POLICY "events_update_policy" 
ON events FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Ensure attendance table policies
CREATE POLICY "attendances_select_policy" 
ON event_attendances FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "attendances_insert_policy" 
ON event_attendances FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "attendances_update_policy" 
ON event_attendances FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- Ensure items table policies
CREATE POLICY "items_select_policy" 
ON event_items FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "items_insert_policy" 
ON event_items FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM event_attendances
    WHERE event_attendances.id = attendance_id 
    AND event_attendances.user_id = auth.uid()
  )
);

-- Ensure messages table policies
CREATE POLICY "messages_select_policy" 
ON event_messages FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "messages_insert_policy" 
ON event_messages FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid()); 