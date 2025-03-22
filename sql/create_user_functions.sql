-- Função para executar SQL arbitrário (para uso administrativo/desenvolvimento)
-- ATENÇÃO: Esta função deve ser restrita apenas a administradores em ambiente de produção!
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios do proprietário da função
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Função segura para criar perfil de usuário, ignorando RLS
-- Esta função é executada com privilégios elevados (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_first_name TEXT,
  user_phone_number TEXT
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_data jsonb;
  generated_username TEXT;
BEGIN
  -- Verificar se o usuário já existe
  IF EXISTS (SELECT 1 FROM public.users WHERE email = user_email) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Email já está em uso',
      'error_code', 'EMAIL_IN_USE',
      'user_data', NULL
    );
  END IF;

  -- Gerar um username único baseado no primeiro nome
  generated_username := user_first_name;
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = generated_username) LOOP
    generated_username := user_first_name || '_' || floor(random() * 1000)::text;
  END LOOP;

  -- Inserir o novo usuário na tabela users
  INSERT INTO public.users(
    id,
    email,
    first_name,
    phone_number,
    role,
    created_at,
    username  -- Agora vamos usar o username gerado
  )
  VALUES (
    user_id,
    user_email,
    user_first_name,
    user_phone_number,
    'user',
    NOW(),
    generated_username  -- Usando o username gerado ao invés de NULL
  )
  RETURNING jsonb_build_object(
    'id', id,
    'email', email,
    'first_name', first_name,
    'phone_number', phone_number,
    'role', role,
    'created_at', created_at,
    'username', username
  ) INTO result_data;

  -- Retornar sucesso com os dados do usuário
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Usuário criado com sucesso',
    'user_data', result_data
  );

EXCEPTION WHEN others THEN
  -- Log do erro para debugging
  RAISE NOTICE 'Erro ao criar usuário: %', SQLERRM;
  
  -- Retornar erro com formato consistente
  RETURN jsonb_build_object(
    'success', false,
    'message', 'Erro ao criar usuário: ' || SQLERRM,
    'error_code', SQLSTATE,
    'user_data', NULL
  );
END;
$$;

-- Garantir que a função pode ser executada por usuários autenticados
GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile TO service_role;

-- Função para criar um usuário completo (auth + perfil)
-- Esta função combina a criação de autenticação e perfil
CREATE OR REPLACE FUNCTION create_full_user(
  p_email text,
  p_password text,
  p_first_name text,
  p_phone_number text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_profile jsonb;
  v_username text;
BEGIN
  -- Gerar UUID para o novo usuário
  v_user_id := gen_random_uuid();
  
  -- Gerar um username único baseado no primeiro nome
  v_username := p_first_name;
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = v_username) LOOP
    v_username := p_first_name || '_' || floor(random() * 1000)::text;
  END LOOP;

  -- Criar o perfil do usuário primeiro
  INSERT INTO public.users(
    id,
    email,
    first_name,
    phone_number,
    role,
    created_at,
    username
  ) VALUES (
    v_user_id,
    p_email,
    p_first_name,
    p_phone_number,
    'user',
    NOW(),
    v_username
  )
  RETURNING jsonb_build_object(
    'id', id,
    'email', email,
    'first_name', first_name,
    'phone_number', phone_number,
    'role', role,
    'created_at', created_at,
    'username', username
  ) INTO v_profile;

  -- Retornar resultado
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Usuário criado com sucesso',
    'user_id', v_user_id,
    'user_data', v_profile
  );

EXCEPTION WHEN others THEN
  -- Log do erro para debugging
  RAISE NOTICE 'Erro ao criar usuário: %', SQLERRM;
  
  -- Retornar erro com formato consistente
  RETURN jsonb_build_object(
    'success', false,
    'message', 'Erro ao criar usuário: ' || SQLERRM,
    'error_code', SQLSTATE,
    'user_data', NULL
  );
END;
$$;

-- Garantir que a função pode ser executada
GRANT EXECUTE ON FUNCTION create_full_user TO authenticated;
GRANT EXECUTE ON FUNCTION create_full_user TO service_role;

-- Função para criar um perfil de usuário temporário (sem autenticação)
-- Útil para o fluxo de magic link, onde o ID de auth só é criado depois
CREATE OR REPLACE FUNCTION create_temp_user_profile(
  user_email TEXT,
  user_first_name TEXT,
  user_phone_number TEXT
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_data jsonb;
  temp_user_id uuid;
  generated_username TEXT;
BEGIN
  -- Verificar se o usuário já existe
  IF EXISTS (SELECT 1 FROM public.users WHERE email = user_email) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Email já está em uso',
      'error_code', 'EMAIL_IN_USE',
      'user_data', NULL
    );
  END IF;

  -- Gerar um UUID temporário
  temp_user_id := gen_random_uuid();
  
  -- Gerar um username único baseado no primeiro nome
  generated_username := user_first_name;
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = generated_username) LOOP
    generated_username := user_first_name || '_' || floor(random() * 1000)::text;
  END LOOP;

  -- Criar um registro na tabela temp_users
  -- Nota: Precisamos ter certeza de que essa tabela existe
  INSERT INTO public.temp_users(
    temp_id,
    email,
    first_name,
    phone_number,
    created_at,
    username,
    status
  )
  VALUES (
    temp_user_id,
    user_email,
    user_first_name,
    user_phone_number,
    NOW(),
    generated_username,
    'pending'
  )
  RETURNING jsonb_build_object(
    'temp_id', temp_id,
    'email', email,
    'first_name', first_name,
    'phone_number', phone_number,
    'created_at', created_at,
    'username', username,
    'status', status
  ) INTO result_data;

  -- Retornar sucesso com os dados temporários
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Perfil temporário criado com sucesso',
    'user_data', result_data
  );

EXCEPTION WHEN others THEN
  -- Log do erro para debugging
  RAISE NOTICE 'Erro ao criar perfil temporário: %', SQLERRM;
  
  -- Retornar erro com formato consistente
  RETURN jsonb_build_object(
    'success', false,
    'message', 'Erro ao criar perfil temporário: ' || SQLERRM,
    'error_code', SQLSTATE,
    'user_data', NULL
  );
END;
$$;

-- Garantir que a função pode ser executada
GRANT EXECUTE ON FUNCTION create_temp_user_profile TO anon;
GRANT EXECUTE ON FUNCTION create_temp_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION create_temp_user_profile TO service_role;

-- Essa função não é mais necessária porque não podemos acessar diretamente auth.users
-- devido à falta da extensão pgcrypto
-- A função está comentada para referência, mas não deve ser executada
/*
CREATE OR REPLACE FUNCTION create_user_direct(
  p_email text,
  p_password text,
  p_first_name text,
  p_phone_number text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios elevados
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_username text;
  v_encrypted_password text;
  v_profile jsonb;
BEGIN
  -- Verificar se o usuário já existe
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Email já está em uso',
      'error_code', 'EMAIL_IN_USE'
    );
  END IF;

  -- Gerar um UUID para o usuário
  v_user_id := gen_random_uuid();
  
  -- Gerar username único
  v_username := p_first_name;
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = v_username) LOOP
    v_username := p_first_name || '_' || floor(random() * 1000)::text;
  END LOOP;

  -- Iniciar transação
  BEGIN
    -- 1. Inserir o usuário diretamente na tabela auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      email_confirmed_at,
      aud,
      role,
      encrypted_password,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      p_email,
      NOW(),
      'authenticated',
      'authenticated',
      crypt(p_password, gen_salt('bf')),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'first_name', p_first_name,
        'phone_number', p_phone_number
      ),
      NOW(),
      NOW(),
      '',
      '',
      ''
    );

    -- 2. Inserir na tabela identities para autenticação
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) 
    VALUES (
      v_user_id,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', p_email),
      'email',
      NOW(),
      NOW(),
      NOW()
    );

    -- 3. Criar o perfil do usuário na tabela users
    INSERT INTO public.users(
      id,
      email,
      first_name,
      phone_number,
      role,
      created_at,
      username
    ) VALUES (
      v_user_id,
      p_email,
      p_first_name,
      p_phone_number,
      'user',
      NOW(),
      v_username
    )
    RETURNING jsonb_build_object(
      'id', id,
      'email', email,
      'first_name', first_name,
      'phone_number', phone_number,
      'role', role,
      'created_at', created_at,
      'username', username
    ) INTO v_profile;

    -- Retornar sucesso com os dados
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Usuário criado com sucesso',
      'user_id', v_user_id,
      'username', v_username,
      'user_data', v_profile
    );
  
  EXCEPTION WHEN others THEN
    -- Em caso de erro, fazer rollback
    RAISE NOTICE 'Erro ao criar usuário: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Erro ao criar usuário: ' || SQLERRM,
      'error_code', SQLSTATE
    );
  END;
END;
$$;

-- Garantir que a função pode ser executada
GRANT EXECUTE ON FUNCTION create_user_direct TO anon;
GRANT EXECUTE ON FUNCTION create_user_direct TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_direct TO service_role;
*/ 