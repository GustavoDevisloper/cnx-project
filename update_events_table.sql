-- Check if the events table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'events') THEN
    -- Create the events table if it doesn't exist
    CREATE TABLE events (
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

    -- Create indices
    CREATE INDEX idx_events_date ON events(date);
    CREATE INDEX idx_events_status ON events(status);
    CREATE INDEX idx_events_created_by ON events(created_by);

    -- Enable RLS
    ALTER TABLE events ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies
    CREATE POLICY "Anyone can view published events" ON events
      FOR SELECT USING (status = 'published');

    CREATE POLICY "Leaders and admins can view all events" ON events
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND (users.role = 'admin' OR users.role = 'leader')
        )
      );

    CREATE POLICY "Leaders and admins can create events" ON events
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND (users.role = 'admin' OR users.role = 'leader')
        )
      );

    CREATE POLICY "Leaders and admins can update events" ON events
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND (users.role = 'admin' OR users.role = 'leader')
        )
      );

    CREATE POLICY "Leaders and admins can delete events" ON events
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND (users.role = 'admin' OR users.role = 'leader')
        )
      );
  ELSE
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'end_date') THEN
      ALTER TABLE events ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'image_url') THEN
      ALTER TABLE events ADD COLUMN image_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'status') THEN
      ALTER TABLE events ADD COLUMN status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published'));
    END IF;

    -- Create indices if they don't exist
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'events' AND indexname = 'idx_events_date') THEN
      CREATE INDEX idx_events_date ON events(date);
    END IF;

    IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'events' AND indexname = 'idx_events_status') THEN
      CREATE INDEX idx_events_status ON events(status);
    END IF;

    IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'events' AND indexname = 'idx_events_created_by') THEN
      CREATE INDEX idx_events_created_by ON events(created_by);
    END IF;

    -- Enable RLS if not already enabled
    ALTER TABLE events ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies if they don't exist
    DROP POLICY IF EXISTS "Anyone can view published events" ON events;
    DROP POLICY IF EXISTS "Leaders and admins can view all events" ON events;
    DROP POLICY IF EXISTS "Leaders and admins can create events" ON events;
    DROP POLICY IF EXISTS "Leaders and admins can update events" ON events;
    DROP POLICY IF EXISTS "Leaders and admins can delete events" ON events;

    CREATE POLICY "Anyone can view published events" ON events
      FOR SELECT USING (status = 'published');

    CREATE POLICY "Leaders and admins can view all events" ON events
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND (users.role = 'admin' OR users.role = 'leader')
        )
      );

    CREATE POLICY "Leaders and admins can create events" ON events
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND (users.role = 'admin' OR users.role = 'leader')
        )
      );

    CREATE POLICY "Leaders and admins can update events" ON events
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND (users.role = 'admin' OR users.role = 'leader')
        )
      );

    CREATE POLICY "Leaders and admins can delete events" ON events
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND (users.role = 'admin' OR users.role = 'leader')
        )
      );
  END IF;
END $$; 