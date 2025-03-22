-- Tabela de eventos 
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabela de confirmações
CREATE TABLE IF NOT EXISTS event_attendances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Tabela de itens
CREATE TABLE IF NOT EXISTS event_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_id UUID NOT NULL REFERENCES event_attendances(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS event_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_messages ENABLE ROW LEVEL SECURITY;

-- Política para eventos: todos podem ver
CREATE POLICY "events_select_policy" 
ON events FOR SELECT 
TO authenticated 
USING (true);

-- Política para eventos: só admins podem criar
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

-- Política para eventos: só admins podem atualizar
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

-- Políticas para confirmações 
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

-- Políticas para itens
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

-- Políticas para mensagens
CREATE POLICY "messages_select_policy" 
ON event_messages FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "messages_insert_policy" 
ON event_messages FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid()); 