-- Script para criar as tabelas necessárias para a funcionalidade de eventos
-- Executar este script no SQL Editor do Supabase

-- Tabela de eventos
CREATE TABLE IF NOT EXISTS "events" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "date" TIMESTAMP WITH TIME ZONE NOT NULL,
  "end_date" TIMESTAMP WITH TIME ZONE,
  "location" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'upcoming', -- 'upcoming', 'ongoing', 'completed', 'cancelled'
  "created_by" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para melhorar desempenho de consultas
CREATE INDEX IF NOT EXISTS "idx_events_date" ON "events" ("date");
CREATE INDEX IF NOT EXISTS "idx_events_status" ON "events" ("status");
CREATE INDEX IF NOT EXISTS "idx_events_created_by" ON "events" ("created_by");

-- Tabela de confirmações de presença em eventos
CREATE TABLE IF NOT EXISTS "event_attendances" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "event_id" UUID NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "status" TEXT NOT NULL DEFAULT 'confirmed', -- 'confirmed', 'declined', 'maybe'
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  -- Garantir que um usuário só tenha uma confirmação por evento
  UNIQUE("event_id", "user_id")
);

-- Índices para melhorar desempenho
CREATE INDEX IF NOT EXISTS "idx_event_attendances_event_id" ON "event_attendances" ("event_id");
CREATE INDEX IF NOT EXISTS "idx_event_attendances_user_id" ON "event_attendances" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_event_attendances_status" ON "event_attendances" ("status");

-- Tabela de itens que os participantes vão levar para o evento
CREATE TABLE IF NOT EXISTS "event_items" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "attendance_id" UUID NOT NULL REFERENCES "event_attendances"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índice para melhorar desempenho
CREATE INDEX IF NOT EXISTS "idx_event_items_attendance_id" ON "event_items" ("attendance_id");

-- Tabela de mensagens de chat para um evento
CREATE TABLE IF NOT EXISTS "event_messages" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "event_id" UUID NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para melhorar desempenho
CREATE INDEX IF NOT EXISTS "idx_event_messages_event_id" ON "event_messages" ("event_id");
CREATE INDEX IF NOT EXISTS "idx_event_messages_user_id" ON "event_messages" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_event_messages_created_at" ON "event_messages" ("created_at");

-- Políticas de segurança (RLS)

-- Permitir que qualquer pessoa autenticada veja eventos
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir visualização de eventos para qualquer usuário autenticado"
ON "events" FOR SELECT
TO authenticated
USING (true);

-- Apenas administradores podem criar, editar ou excluir eventos
CREATE POLICY "Permitir criação de eventos para administradores"
ON "events" FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "users"
    WHERE "id" = auth.uid() AND "role" = 'admin'
  )
);

CREATE POLICY "Permitir edição de eventos para administradores"
ON "events" FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "users"
    WHERE "id" = auth.uid() AND "role" = 'admin'
  )
);

CREATE POLICY "Permitir exclusão de eventos para administradores"
ON "events" FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "users"
    WHERE "id" = auth.uid() AND "role" = 'admin'
  )
);

-- Políticas para confirmações de presença
ALTER TABLE "event_attendances" ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa autenticada pode ver confirmações
CREATE POLICY "Permitir visualização de confirmações para qualquer usuário autenticado"
ON "event_attendances" FOR SELECT
TO authenticated
USING (true);

-- Usuários só podem criar/atualizar suas próprias confirmações
CREATE POLICY "Permitir confirmação de presença para o próprio usuário"
ON "event_attendances" FOR INSERT
TO authenticated
WITH CHECK ("user_id" = auth.uid());

CREATE POLICY "Permitir atualização de confirmação para o próprio usuário"
ON "event_attendances" FOR UPDATE
TO authenticated
USING ("user_id" = auth.uid());

-- Políticas para itens
ALTER TABLE "event_items" ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa autenticada pode ver itens
CREATE POLICY "Permitir visualização de itens para qualquer usuário autenticado"
ON "event_items" FOR SELECT
TO authenticated
USING (true);

-- Usuários só podem gerenciar itens de suas próprias confirmações
CREATE POLICY "Permitir adição de itens para o próprio usuário"
ON "event_items" FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "event_attendances"
    WHERE "id" = "attendance_id" AND "user_id" = auth.uid()
  )
);

CREATE POLICY "Permitir atualização de itens para o próprio usuário"
ON "event_items" FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "event_attendances"
    WHERE "id" = "attendance_id" AND "user_id" = auth.uid()
  )
);

CREATE POLICY "Permitir exclusão de itens para o próprio usuário"
ON "event_items" FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "event_attendances"
    WHERE "id" = "attendance_id" AND "user_id" = auth.uid()
  )
);

-- Políticas para mensagens
ALTER TABLE "event_messages" ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa autenticada pode ver mensagens
CREATE POLICY "Permitir visualização de mensagens para qualquer usuário autenticado"
ON "event_messages" FOR SELECT
TO authenticated
USING (true);

-- Usuários só podem enviar mensagens em seu próprio nome
CREATE POLICY "Permitir envio de mensagens para o próprio usuário"
ON "event_messages" FOR INSERT
TO authenticated
WITH CHECK ("user_id" = auth.uid());

-- Usuários só podem editar suas próprias mensagens
CREATE POLICY "Permitir edição de mensagens para o próprio usuário"
ON "event_messages" FOR UPDATE
TO authenticated
USING ("user_id" = auth.uid());

-- Usuários só podem excluir suas próprias mensagens
CREATE POLICY "Permitir exclusão de mensagens para o próprio usuário"
ON "event_messages" FOR DELETE
TO authenticated
USING ("user_id" = auth.uid());

-- Funções para auxiliar no gerenciamento de eventos

-- Função para atualizar o status de evento baseado na data
CREATE OR REPLACE FUNCTION update_event_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a data do evento já passou
  IF NEW."date" < NOW() THEN
    -- Se há uma data final e ela também já passou
    IF NEW."end_date" IS NOT NULL AND NEW."end_date" < NOW() THEN
      NEW."status" := 'completed';
    ELSE
      NEW."status" := 'ongoing';
    END IF;
  ELSE
    NEW."status" := 'upcoming';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar automaticamente o status do evento
CREATE TRIGGER trigger_update_event_status
BEFORE INSERT OR UPDATE ON "events"
FOR EACH ROW
EXECUTE FUNCTION update_event_status();

-- Função para buscar eventos com informações relacionadas
CREATE OR REPLACE FUNCTION get_events_with_attendees(status_param TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  status TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  attendee_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e."id", 
    e."title", 
    e."description", 
    e."date", 
    e."end_date", 
    e."location", 
    e."status", 
    e."created_by", 
    e."created_at", 
    e."updated_at",
    COUNT(DISTINCT a."id") FILTER (WHERE a."status" = 'confirmed') AS attendee_count
  FROM "events" e
  LEFT JOIN "event_attendances" a ON e."id" = a."event_id"
  WHERE 
    (status_param IS NULL OR e."status" = status_param)
  GROUP BY e."id"
  ORDER BY e."date";
END;
$$ LANGUAGE plpgsql; 