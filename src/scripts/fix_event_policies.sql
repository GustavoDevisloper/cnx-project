-- Script para corrigir as políticas RLS das tabelas de eventos
-- Execute cada seção separadamente para identificar erros específicos

-- 1. Remover políticas antigas que podem estar causando o erro
DROP POLICY IF EXISTS "Permitir criação de eventos para administradores" ON "events";
DROP POLICY IF EXISTS "Permitir confirmação de presença para o próprio usuário" ON "event_attendances";
DROP POLICY IF EXISTS "Permitir adição de itens para o próprio usuário" ON "event_items";
DROP POLICY IF EXISTS "Permitir envio de mensagens para o próprio usuário" ON "event_messages";

-- 2. Criar políticas para eventos com sintaxe correta
CREATE POLICY "Permitir criação de eventos para administradores"
ON "events" FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "users"
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 3. Criar políticas para confirmações de presença
CREATE POLICY "Permitir confirmação de presença para o próprio usuário"
ON "event_attendances" FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 4. Criar políticas para itens
CREATE POLICY "Permitir adição de itens para o próprio usuário"
ON "event_items" FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "event_attendances"
    WHERE id = attendance_id AND user_id = auth.uid()
  )
);

-- 5. Criar políticas para mensagens
CREATE POLICY "Permitir envio de mensagens para o próprio usuário"
ON "event_messages" FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()); 