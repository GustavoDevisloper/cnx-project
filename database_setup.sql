-- Tabela de perguntas (dúvidas)
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('pending', 'answered')),
  answer TEXT,
  answered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  answered_at TIMESTAMP WITH TIME ZONE
);

-- Índices para a tabela de perguntas
CREATE INDEX IF NOT EXISTS idx_questions_user_id ON questions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at);

-- Tabela de eventos
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT NOT NULL,
  image_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('draft', 'published'))
);

-- Índices para a tabela de eventos
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

-- Permissões RLS (Row Level Security)

-- Política para perguntas
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa autenticada pode criar perguntas
CREATE POLICY "Usuários autenticados podem criar perguntas" ON questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem ver suas próprias perguntas
CREATE POLICY "Usuários podem ver suas próprias perguntas" ON questions
  FOR SELECT USING (auth.uid() = user_id);

-- Admins e líderes podem ver todas as perguntas
CREATE POLICY "Admins e líderes podem ver todas as perguntas" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role = 'admin' OR users.role = 'leader')
    )
  );

-- Admins e líderes podem responder perguntas
CREATE POLICY "Admins e líderes podem responder perguntas" ON questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role = 'admin' OR users.role = 'leader')
    )
  );

-- Política para eventos
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode ver eventos publicados
CREATE POLICY "Qualquer pessoa pode ver eventos publicados" ON events
  FOR SELECT USING (status = 'published');

-- Admins e líderes podem ver todos os eventos
CREATE POLICY "Admins e líderes podem ver todos os eventos" ON events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role = 'admin' OR users.role = 'leader')
    )
  );

-- Admins e líderes podem criar eventos
CREATE POLICY "Admins e líderes podem criar eventos" ON events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role = 'admin' OR users.role = 'leader')
    )
  );

-- Admins e líderes podem atualizar eventos
CREATE POLICY "Admins e líderes podem atualizar eventos" ON events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role = 'admin' OR users.role = 'leader')
    )
  );

-- Admins e líderes podem excluir eventos
CREATE POLICY "Admins e líderes podem excluir eventos" ON events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role = 'admin' OR users.role = 'leader')
    )
  ); 