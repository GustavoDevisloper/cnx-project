-- Script para buscar usuários diretamente da tabela, sem depender da função RPC
-- Execute este script no SQL Editor do Supabase

-- Verifique o usuário atual para testar
SELECT auth.uid() as current_user_id;

-- Buscar usuários que não são o usuário atual, formatados para o componente de frontend
WITH user_roles AS (
  SELECT DISTINCT role, 
    CASE 
      WHEN role = 'admin' THEN 2
      WHEN role = 'leader' THEN 1
      ELSE 0
    END as role_priority
  FROM users
)

SELECT 
    u.id,
    u.username,
    u.display_name,
    u.avatar_url,
    COALESCE(u.followers_count, 0) as followers_count,
    false as is_followed  -- Definido como false por padrão, ajuste no frontend conforme necessário
FROM 
    users u
JOIN 
    user_roles r ON u.role = r.role
WHERE 
    -- Não incluir o usuário atual
    (auth.uid() IS NULL OR u.id <> auth.uid())
    -- E ordenar por prioridade de papel, visualizações de perfil e data de criação
ORDER BY 
    r.role_priority DESC,
    COALESCE(u.profile_views, 0) DESC,
    u.created_at ASC
LIMIT 10;

-- Verificação alternativa se o RPC não funcionar
-- Se o resultado acima estiver vazio, você pode executar esta consulta sem filtrar o usuário atual
SELECT 
    u.id,
    u.username,
    u.display_name,
    u.avatar_url,
    COALESCE(u.followers_count, 0) as followers_count,
    false as is_followed
FROM 
    users u
ORDER BY 
    u.created_at DESC
LIMIT 10;

-- Contar usuários por papel
SELECT 
    role, 
    COUNT(*) as count
FROM 
    users
GROUP BY 
    role
ORDER BY 
    count DESC; 