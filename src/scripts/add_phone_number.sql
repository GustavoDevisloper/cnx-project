-- Adicionar coluna phone_number à tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Comentário para documentar a coluna
COMMENT ON COLUMN users.phone_number IS 'Número de telefone do usuário';

-- Atualizar registros existentes com valor vazio
UPDATE users 
SET phone_number = ''
WHERE phone_number IS NULL; 