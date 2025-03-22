-- Atualizar o papel do usuário para admin
UPDATE users 
SET role = 'admin'
WHERE email = 'developer@gmail.com';

-- Confirmar a atualização
SELECT id, email, role 
FROM users 
WHERE email = 'developer@gmail.com'; 