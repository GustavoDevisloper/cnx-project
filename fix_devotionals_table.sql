-- Script para criar ou atualizar a tabela de devocionais

-- Limpar cache de esquema para evitar erro "Could not find column in schema cache"
SELECT pg_notify('pgrst', 'reload schema');

-- Verificar se a tabela existe e se precisa de atualização
DO $$ 
BEGIN
    -- Verificar se a tabela existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'devotionals') THEN
        CREATE TABLE devotionals (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            date DATE NOT NULL,
            theme TEXT,
            verse TEXT,
            verse_reference TEXT,
            author_id UUID REFERENCES users(id),
            is_generated BOOLEAN DEFAULT false,
            "references" TEXT[],
            image_url TEXT,
            transmission_link TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        RAISE NOTICE 'Tabela devotionals criada com sucesso!';
    ELSE
        -- Tabela já existe, verificar e adicionar colunas faltantes
        RAISE NOTICE 'Tabela devotionals já existe, verificando colunas...';
        
        -- Verificar se a coluna 'author' existe, se existir, renomear para 'author_id'
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='devotionals' AND column_name='author') THEN
            ALTER TABLE devotionals RENAME COLUMN author TO author_id;
            RAISE NOTICE 'Coluna author renomeada para author_id';
        END IF;
        
        -- Adicionar colunas que podem estar faltando
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='devotionals' AND column_name='theme') THEN
            ALTER TABLE devotionals ADD COLUMN theme TEXT;
            RAISE NOTICE 'Coluna theme adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='devotionals' AND column_name='verse') THEN
            ALTER TABLE devotionals ADD COLUMN verse TEXT;
            RAISE NOTICE 'Coluna verse adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='devotionals' AND column_name='verse_reference') THEN
            ALTER TABLE devotionals ADD COLUMN verse_reference TEXT;
            RAISE NOTICE 'Coluna verse_reference adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='devotionals' AND column_name='references') THEN
            ALTER TABLE devotionals ADD COLUMN "references" TEXT[];
            RAISE NOTICE 'Coluna references adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='devotionals' AND column_name='is_generated') THEN
            ALTER TABLE devotionals ADD COLUMN is_generated BOOLEAN DEFAULT false;
            RAISE NOTICE 'Coluna is_generated adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='devotionals' AND column_name='image_url') THEN
            ALTER TABLE devotionals ADD COLUMN image_url TEXT;
            RAISE NOTICE 'Coluna image_url adicionada';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='devotionals' AND column_name='transmission_link') THEN
            ALTER TABLE devotionals ADD COLUMN transmission_link TEXT;
            RAISE NOTICE 'Coluna transmission_link adicionada';
        END IF;
        
        -- Migrar dados se houver colunas com nomes diferentes
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='devotionals' AND column_name='scripture') THEN
            UPDATE devotionals SET verse = scripture WHERE verse IS NULL AND scripture IS NOT NULL;
            RAISE NOTICE 'Dados migrados de scripture para verse';
        END IF;
    END IF;
END $$;

-- Atualizar política RLS para permitir leitura anônima
DROP POLICY IF EXISTS devotionals_read_policy ON devotionals;
CREATE POLICY devotionals_read_policy ON devotionals
    FOR SELECT USING (true);

-- Permitir que usuários autenticados criem/editem devocionais
DROP POLICY IF EXISTS devotionals_insert_policy ON devotionals;
CREATE POLICY devotionals_insert_policy ON devotionals
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS devotionals_update_policy ON devotionals;
CREATE POLICY devotionals_update_policy ON devotionals
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Habilitar RLS na tabela
ALTER TABLE devotionals ENABLE ROW LEVEL SECURITY;

-- Limpar cache novamente após todas as alterações
SELECT pg_notify('pgrst', 'reload schema');
