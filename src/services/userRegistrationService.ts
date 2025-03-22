import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Tipo para usuário
export interface UserRegistration {
  id: string;
  email: string;
  role: 'admin' | 'leader' | 'user';
  first_name?: string;
  phone_number?: string;
  created_at?: string;
  username?: string;
}

/**
 * Verifica se um usuário já existe com o e-mail fornecido
 */
const checkUserExists = async (email: string): Promise<boolean> => {
  try {
    // Verificar se já existe um usuário com este e-mail
    const { data: existingUser, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Usuário não encontrado
        return false;
      }
      throw error;
    }

    return !!existingUser;
  } catch (error) {
    console.error('Erro ao verificar existência do usuário:', error);
    return false;
  }
};

/**
 * Sincroniza o usuário autenticado atual com a tabela public.users
 * Esta função ajuda a resolver problemas de chave estrangeira em outras tabelas
 */
export const syncCurrentUser = async (): Promise<boolean> => {
  try {
    // Obter a sessão atual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.log('Nenhuma sessão ativa para sincronizar');
      return false;
    }
    
    const userId = session.user.id;
    const userEmail = session.user.email;
    
    if (!userEmail) {
      console.log('Email de usuário não disponível para sincronizar');
      return false;
    }
    
    // Verificar se o usuário já existe na tabela public.users
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single();
    
    if (userError && userError.code !== 'PGRST116') {
      console.error('Erro ao verificar usuário existente:', userError);
      return false;
    }
    
    if (existingUser) {
      console.log('Usuário já existe na tabela public.users');
      return true;
    }
    
    // Criar um nome de usuário a partir do email
    const username = userEmail.split('@')[0];
    
    // Inserir o usuário na tabela public.users
    const { data: insertedUser, error: insertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: userEmail,
        username: username,
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Erro ao inserir usuário na tabela public.users:', insertError);
      return false;
    }
    
    console.log('Usuário sincronizado com sucesso:', insertedUser);
    return true;
  } catch (error) {
    console.error('Erro ao sincronizar usuário:', error);
    return false;
  }
};

/**
 * Registro simplificado - cria apenas o perfil do usuário sem usar a autenticação do Supabase
 */
export const registerUser = async (
  email: string,
  password: string,
  firstName: string,
  phoneNumber: string
): Promise<UserRegistration | null> => {
  console.log('🚀 Iniciando processo de registro simplificado');

  try {
    // 1. Verificar se o e-mail já está em uso
    const userExists = await checkUserExists(email);
    if (userExists) {
      console.warn('⚠️ E-mail já registrado:', email);
      throw new Error('Este e-mail já está registrado. Por favor, tente outro ou faça login.');
    }

    // 2. Gerar um ID para o novo usuário
    const userId = uuidv4();

    // 3. Gerar um username baseado no firstName para evitar conflitos
    const generatedUsername = `${firstName.toLowerCase().replace(/\s+/g, '_')}_${Math.floor(Math.random() * 10000)}`;

    // 4. Criar o perfil do usuário diretamente na tabela users
    let { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email,
        first_name: firstName,
        phone_number: phoneNumber,
        role: 'user',
        created_at: new Date().toISOString(),
        password_hash: await hashPassword(password),
        username: generatedUsername // Usar username gerado para evitar conflitos
      })
      .select('*')
      .single();

    if (userError) {
      console.error('❌ Erro ao criar usuário:', userError);
      
      // Verificar se é outro tipo de erro
      if (userError.code === '23505') {
        // Se for erro de chave duplicada, verificar qual campo está causando o problema
        if (userError.message.includes('email')) {
          throw new Error('Este e-mail já está sendo usado por outra conta.');
        } else if (userError.message.includes('username')) {
          // Tentar novamente com outro username
          const newUsername = `${firstName.toLowerCase().replace(/\s+/g, '_')}_${Math.floor(Math.random() * 100000)}`;
          
          const { data: retryData, error: retryError } = await supabase
            .from('users')
            .insert({
              id: userId,
              email: email,
              first_name: firstName,
              phone_number: phoneNumber,
              role: 'user',
              created_at: new Date().toISOString(),
              password_hash: await hashPassword(password),
              username: newUsername
            })
            .select('*')
            .single();
            
          if (retryError) {
            console.error('❌ Erro na segunda tentativa:', retryError);
            throw new Error('Não foi possível criar sua conta. Por favor, tente novamente mais tarde.');
          }
          
          userData = retryData;
        } else {
          // Outro tipo de erro de chave duplicada
          throw new Error('Não foi possível criar sua conta. Por favor, tente novamente mais tarde.');
        }
      } else {
        throw new Error('Não foi possível criar sua conta. Por favor, tente novamente mais tarde.');
      }
    }

    console.log('📦 Usuário criado com sucesso:', userData);

    // 5. Armazenar informações do usuário para "login" manual
    localStorage.setItem('current_user_id', userId);
    localStorage.setItem('current_user_email', email);

    // 6. Retornar os dados do usuário criado
    const userProfile: UserRegistration = {
      id: userId,
      email: email,
      first_name: firstName,
      phone_number: phoneNumber,
      role: 'user',
      created_at: new Date().toISOString(),
      username: userData.username
    };

    console.log('✅ Perfil criado com sucesso:', userProfile);
    return userProfile;

  } catch (error: any) {
    console.error('❌ Erro fatal no processo de registro:', error);
    throw error;
  }
};

/**
 * Função simples para hash de senha (para demonstração)
 * Em produção, você deve usar algo mais robusto como bcrypt ou Argon2
 */
const hashPassword = async (password: string): Promise<string> => {
  // Usando TextEncoder e crypto.subtle.digest para criar um hash da senha
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

/**
 * Login manual usando nosso próprio sistema
 */
export const manualLogin = async (email: string, password: string): Promise<UserRegistration | null> => {
  try {
    console.log(`🔒 Tentando login manual: ${email}`);
    
    // Limpar quaisquer dados de usuário temporário que possam estar causando conflitos
    const tempUserKey = 'temp_user_' + email.replace('@', '_at_');
    localStorage.removeItem(tempUserKey);
    
    // 1. Buscar usuário pelo email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      console.error('❌ Usuário não encontrado:', error);
      throw new Error('Email ou senha incorretos.');
    }

    // 2. Verificar a senha
    const hashedPassword = await hashPassword(password);
    if (hashedPassword !== user.password_hash) {
      console.error('❌ Senha incorreta');
      throw new Error('Email ou senha incorretos.');
    }

    // 3. Armazenar informações de login
    localStorage.setItem('current_user_id', user.id);
    localStorage.setItem('current_user_email', user.email);
    
    // 4. Guardar informações completas em cache
    localStorage.setItem('current_user', JSON.stringify(user));
    localStorage.setItem('current_user_cache_time', Date.now().toString());

    // 5. Retornar o perfil do usuário
    const userProfile: UserRegistration = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      phone_number: user.phone_number,
      role: user.role,
      created_at: user.created_at,
      username: user.username
    };
    
    console.log(`✅ Login bem-sucedido para ${email} (${user.role})`);
    
    // Disparar evento de mudança no estado de autenticação
    window.dispatchEvent(new Event('auth-state-changed'));

    return userProfile;
  } catch (error) {
    console.error('❌ Erro no login:', error);
    throw error;
  }
};

/**
 * Finaliza o registro armazenando os dados do usuário para uso posterior
 */
export const finalizeRegistration = (user: UserRegistration): void => {
  if (!user) return;
  
  // Armazenar dados do usuário para uso em toda a aplicação
  localStorage.setItem('current_user', JSON.stringify(user));
  localStorage.setItem('current_user_cache_time', Date.now().toString());
  
  // Limpar flags de registro
  sessionStorage.removeItem('registration_in_progress');
  
  // Disparar evento de mudança no estado de autenticação
  window.dispatchEvent(new Event('auth-state-changed'));
  
  console.log('✅ Registro finalizado com sucesso');
}; 