-- Script to check and fix the questions table structure

-- First check if the table exists
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'questions'
    ) INTO table_exists;

    IF NOT table_exists THEN
        RAISE NOTICE 'The questions table does not exist. Creating it...';
        
        -- Create the questions table
        CREATE TABLE public.questions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            status TEXT NOT NULL CHECK (status IN ('pending', 'answered')),
            answer TEXT,
            answered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            answered_at TIMESTAMP WITH TIME ZONE,
            is_public BOOLEAN DEFAULT TRUE
        );
        
        -- Create indices
        CREATE INDEX IF NOT EXISTS idx_questions_user_id ON questions(user_id);
        CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
        CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at);
        
        -- Enable Row Level Security
        ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Usuários autenticados podem criar perguntas" ON questions
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Usuários podem ver suas próprias perguntas" ON questions
            FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Admins e líderes podem ver todas as perguntas" ON questions
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM users
                    WHERE users.id = auth.uid()
                    AND (users.role = 'admin' OR users.role = 'leader')
                )
            );
        
        CREATE POLICY "Admins e líderes podem responder perguntas" ON questions
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM users
                    WHERE users.id = auth.uid()
                    AND (users.role = 'admin' OR users.role = 'leader')
                )
            );
        
        CREATE POLICY "Usuários podem excluir suas próprias perguntas" ON questions
            FOR DELETE USING (auth.uid() = user_id);
        
        CREATE POLICY "Admins e líderes podem excluir qualquer pergunta" ON questions
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM users
                    WHERE users.id = auth.uid()
                    AND (users.role = 'admin' OR users.role = 'leader')
                )
            );
        
        RAISE NOTICE 'The questions table has been created successfully.';
    ELSE
        RAISE NOTICE 'The questions table already exists. Checking its structure...';
        
        -- Check if the title column exists
        DECLARE
            title_exists BOOLEAN;
        BEGIN
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'questions' 
                AND column_name = 'title'
            ) INTO title_exists;
            
            IF NOT title_exists THEN
                RAISE NOTICE 'The title column does not exist. Adding it...';
                ALTER TABLE questions ADD COLUMN title TEXT;
                UPDATE questions SET title = 'Dúvida' WHERE title IS NULL;
                ALTER TABLE questions ALTER COLUMN title SET NOT NULL;
                RAISE NOTICE 'The title column has been added successfully.';
            ELSE
                RAISE NOTICE 'The title column already exists.';
            END IF;
        END;
        
        -- Check if the content column exists
        DECLARE
            content_exists BOOLEAN;
        BEGIN
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'questions' 
                AND column_name = 'content'
            ) INTO content_exists;
            
            IF NOT content_exists THEN
                RAISE NOTICE 'The content column does not exist. Adding it...';
                ALTER TABLE questions ADD COLUMN content TEXT;
                
                -- If there's a 'question' column, copy its data to content
                DECLARE
                    question_exists BOOLEAN;
                BEGIN
                    SELECT EXISTS (
                        SELECT FROM information_schema.columns 
                        WHERE table_schema = 'public' 
                        AND table_name = 'questions' 
                        AND column_name = 'question'
                    ) INTO question_exists;
                    
                    IF question_exists THEN
                        UPDATE questions SET content = question WHERE content IS NULL;
                    END IF;
                END;
                
                ALTER TABLE questions ALTER COLUMN content SET NOT NULL;
                RAISE NOTICE 'The content column has been added successfully.';
            ELSE
                RAISE NOTICE 'The content column already exists.';
            END IF;
        END;
        
        -- Check if is_public column exists
        DECLARE
            is_public_exists BOOLEAN;
        BEGIN
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'questions' 
                AND column_name = 'is_public'
            ) INTO is_public_exists;
            
            IF NOT is_public_exists THEN
                RAISE NOTICE 'The is_public column does not exist. Adding it...';
                ALTER TABLE questions ADD COLUMN is_public BOOLEAN DEFAULT TRUE;
                RAISE NOTICE 'The is_public column has been added successfully.';
            ELSE
                RAISE NOTICE 'The is_public column already exists.';
            END IF;
        END;
    END IF;
END
$$; 