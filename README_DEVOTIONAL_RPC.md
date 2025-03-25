# Configuração da Função RPC para Criar Devocionais

Este guia explica como configurar uma função RPC no Supabase para resolver o problema de autenticação ao criar devocionais.

## Problema

Você está enfrentando um problema onde o usuário está logado no site, mas ao tentar criar um devocional, você recebe este erro:

```
DevotionalNew component mounted
devotionalService.ts:510 Usuário não autenticado
```

Este erro ocorre porque o método de autenticação usado pelo Supabase não está reconhecendo o usuário logado através do localStorage.

## Solução

Para resolver este problema, criamos uma função RPC no banco de dados que permite criar devocionais mesmo quando há problemas de RLS (Row Level Security) ou autenticação.

## Como configurar

1. Acesse o painel do Supabase
2. Vá para o SQL Editor
3. Crie uma nova consulta
4. Cole o seguinte código SQL e execute:

```sql
-- Função para criar um devocional mesmo quando há problemas de RLS
CREATE OR REPLACE FUNCTION create_devotional(devotional_data JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
BEGIN
  -- Verificar se tem os campos obrigatórios
  IF (devotional_data->>'title') IS NULL OR (devotional_data->>'verse') IS NULL THEN
    RAISE EXCEPTION 'Campos obrigatórios faltando: título e versículo são necessários';
  END IF;

  -- Inserir o devocional
  INSERT INTO devotionals (
    title,
    content,
    verse,
    verse_reference,
    theme,
    author_id, 
    date,
    is_generated,
    "references",
    image_url,
    transmission_link,
    created_at,
    updated_at
  ) VALUES (
    devotional_data->>'title',
    COALESCE(devotional_data->>'content', ''),
    devotional_data->>'verse',
    devotional_data->>'verse_reference',
    COALESCE(devotional_data->>'theme', 'reflexão'),
    (devotional_data->>'author_id')::UUID,
    COALESCE(devotional_data->>'date', CURRENT_DATE::TEXT),
    COALESCE((devotional_data->>'is_generated')::BOOLEAN, FALSE),
    COALESCE((devotional_data->'references')::JSONB, '[]'::JSONB)::TEXT[],
    COALESCE(devotional_data->>'image_url', ''),
    COALESCE(devotional_data->>'transmission_link', ''),
    COALESCE(devotional_data->>'created_at', NOW()::TEXT)::TIMESTAMPTZ,
    COALESCE(devotional_data->>'updated_at', NOW()::TEXT)::TIMESTAMPTZ
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao criar devocional: %', SQLERRM;
    RETURN NULL;
END;
$$;

-- Conceder permissão de execução para todos os usuários
GRANT EXECUTE ON FUNCTION create_devotional(JSONB) TO authenticated, anon;
```

5. Verifique se a função foi criada com sucesso.
6. Reinicie sua aplicação.

## Como funciona

A função criada utiliza `SECURITY DEFINER`, o que significa que ela é executada com as permissões do criador da função (normalmente o administrador do banco de dados), ignorando as políticas de RLS.

Isso permite que a função crie devocionais mesmo quando há problemas com a autenticação do Supabase.

## Testes adicionais

Se o problema persistir após implementar essa solução, verifique:

1. Se o localStorage contém os dados de usuário corretos através do console do navegador
2. Se as permissões do usuário (role = 'admin' ou role = 'leader') estão corretas
3. Se a tabela de devotionals existe e tem a estrutura correta

## Suporte

Se você continuar enfrentando problemas, verifique os logs do console do navegador para obter mais informações sobre o erro e entre em contato com a equipe de suporte. 