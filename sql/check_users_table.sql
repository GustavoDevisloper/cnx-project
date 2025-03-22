-- Verificar a estrutura da tabela users
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'public' 
  AND table_name = 'users'
ORDER BY 
  ordinal_position;

-- Verificar restrições da tabela
SELECT 
  con.conname as constraint_name,
  pg_get_constraintdef(con.oid) as constraint_definition
FROM 
  pg_constraint con 
JOIN 
  pg_class rel ON rel.oid = con.conrelid
JOIN 
  pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE 
  nsp.nspname = 'public' 
  AND rel.relname = 'users'; 