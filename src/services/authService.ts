import { supabase } from './supabaseClient';
import { toast } from '@/hooks/use-toast';

// Tipos
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'leader' | 'user';
  username?: string;
  display_name?: string;
  first_name?: string;
  phone_number?: string;
  bio?: string;
  avatar_url?: string;
  created_at?: string;
  profile_views?: number;
}

// Login com email/senha via Supabase Auth
export const signInWithEmailViaSupabase = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data.user;
  } catch (error: any) {
    toast({
      title: "Erro ao fazer login",
      description: error.message,
      variant: "destructive"
    });
    return null;
  }
};

/**
 * Login com email e senha simplificado
 * Usa nosso sistema de autenticação manual
 */
export async function signInWithEmail(email: string, password: string): Promise<User | null> {
  try {
    console.log(`🔒 Tentando login: ${email}`);

    // Limpar dados de usuário temporário que possam estar causando conflitos
    const tempUserKey = 'temp_user_' + email.replace('@', '_at_');
    localStorage.removeItem(tempUserKey);
    
    // Buscar usuário diretamente da tabela users
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !user) {
      console.error('❌ Usuário não encontrado:', error);
      throw new Error('Email ou senha incorretos.');
    }
    
    // Verificar a senha (você precisará implementar a função de hash para comparação)
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    if (hashedPassword !== user.password_hash) {
      console.error('❌ Senha incorreta');
      throw new Error('Email ou senha incorretos.');
    }
    
    // Login bem-sucedido, armazenar informações
    localStorage.setItem('current_user_id', user.id);
    localStorage.setItem('current_user_email', user.email);
    
    console.log(`✅ Login bem-sucedido para: ${email}`);
    
    return user as User;
  } catch (error: any) {
    console.error(`❌ Erro no login:`, error);
    throw error;
  }
}

/**
 * Login com Google via OAuth
 */
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    toast({
      title: "Erro ao fazer login com Google",
      description: error.message,
      variant: "destructive"
    });
    return null;
  }
};

/**
 * Registro com email e senha
 * Versão 5 - usando função RPC segura que contorna problemas de RLS
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  firstName: string, 
  phoneNumber: string
): Promise<User | null> {
  console.log("🚀 Iniciando processo de registro");
  
  // Gerar UUID para o caso de precisarmos criar o usuário manualmente
  const fallbackId = crypto.randomUUID();
  
  try {
    // ETAPA 1: Tentar registrar via auth.signUp padrão
    let userId = null;
    let authSuccess = false;
    
    try {
      console.log("🔑 Tentando registro padrão via auth.signUp");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            first_name: firstName,
            phone_number: phoneNumber
          }
        }
      });
      
      if (error) throw error;
      
      if (data?.user?.id) {
        userId = data.user.id;
        authSuccess = true;
        console.log("✅ Usuário registrado com sucesso no Auth:", userId);
      } else {
        throw new Error("Dados de usuário não retornados pelo Auth");
      }
    } catch (signUpError: any) {
      // Se o erro for de email já registrado, relançar o erro
      if (signUpError.message && signUpError.message.includes("already registered")) {
        throw new Error("Este email já está registrado");
      }
      
      // Para outros erros, seguir com o fluxo alternativo
      console.warn("⚠️ Erro no registro Auth:", signUpError.message);
      console.log("🔄 Seguindo para fluxo alternativo...");
    }
    
    // Se conseguiu criar no Auth, tentar criar o perfil diretamente
    if (authSuccess && userId) {
      try {
        console.log("👤 Tentando criar perfil para ID:", userId);
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: email,
            first_name: firstName,
            phone_number: phoneNumber,
            role: 'user',
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (!profileError && profile) {
          console.log("✅ Perfil criado com sucesso!");
          return profile as User;
        }
      } catch (profileError) {
        console.warn("⚠️ Erro ao criar perfil:", profileError);
      }
    }
    
    // ETAPA 2: Se o perfil não pôde ser criado, tente usar SQL diretamente
    // Este método só funciona no Supabase se você tiver uma função SQL do lado do servidor
    try {
      console.log("🔧 Tentando criar usuário via RPC (stored procedure)");
      const { data: rpcResult, error: rpcError } = await supabase.rpc('create_full_user', {
        p_email: email,
        p_password: password,
        p_first_name: firstName,
        p_phone_number: phoneNumber
      });
      
      if (!rpcError && rpcResult && rpcResult.user_id) {
        console.log("✅ Usuário criado via RPC:", rpcResult.user_id);
        return {
          id: rpcResult.user_id,
          email: email,
          role: 'user',
          first_name: firstName,
          phone_number: phoneNumber,
          created_at: new Date().toISOString()
        };
      } else {
        console.warn("⚠️ Erro no RPC:", rpcError?.message);
      }
    } catch (rpcError) {
      console.warn("⚠️ Erro ao chamar RPC:", rpcError);
    }
    
    // ETAPA 3: Como último recurso, use REST API diretamente
    // Esta abordagem pode falhar por causa de políticas de CORS ou permissões
    try {
      console.log("📡 Tentando criar usuário via REST API");
      const userApiResponse = await fetch(`${supabase.supabaseUrl}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabase.supabaseKey,
          'Authorization': `Bearer ${supabase.supabaseKey}`
        },
        body: JSON.stringify({
          id: userId || fallbackId,
          email: email,
          first_name: firstName,
          phone_number: phoneNumber,
          role: 'user',
          created_at: new Date().toISOString()
        })
      });
      
      if (userApiResponse.ok) {
        const userData = await userApiResponse.json();
        console.log("✅ Usuário criado via REST API:", userData);
        return userData as User;
      }
    } catch (apiError) {
      console.warn("⚠️ Erro na REST API:", apiError);
    }
    
    // ETAPA 4: Se todas as tentativas falharem, use dados temporários em memória
    console.log("⚠️ Todas as tentativas falharam! Usando dados temporários.");
    
    // Criar objeto de usuário temporário
    const tempUser: User = {
      id: userId || fallbackId,
      email: email,
      role: 'user',
      first_name: firstName,
      phone_number: phoneNumber,
      created_at: new Date().toISOString()
    };
    
    // Armazenar no localStorage para futuras recuperações
    localStorage.setItem('temp_user_' + email.replace('@', '_at_'), JSON.stringify(tempUser));
    
    return tempUser;
    
  } catch (error: any) {
    console.error("❌ Erro crítico no registro:", error);
    throw error;
  }
}

/**
 * Obter o usuário atual usando nosso sistema manual de autenticação
 * Versão melhorada que usa cache local quando possível
 */
export const getCurrentUser = async (userId?: string): Promise<User | null> => {
  try {
    // Se um ID específico foi passado, usar ele
    // Caso contrário, pegar do localStorage
    const id = userId || localStorage.getItem('current_user_id');
    
    if (!id) {
      console.log('Nenhum ID de usuário encontrado');
      return null;
    }
    
    // Verificar se temos o usuário em cache e se é o mesmo ID
    const cachedUserStr = localStorage.getItem('current_user');
    const cacheTime = localStorage.getItem('current_user_cache_time');
    
    if (cachedUserStr && cacheTime) {
      const cachedUser = JSON.parse(cachedUserStr);
      const cacheAge = Date.now() - parseInt(cacheTime);
      
      // Se o cache tem menos de 15 minutos e é o mesmo usuário, usar direto
      if (cacheAge < 15 * 60 * 1000 && cachedUser.id === id) {
        console.log('Usando dados de usuário em cache');
        return cachedUser as User;
      }
    }
    
    // Se não temos cache ou está velho, buscar do banco
    console.log('Buscando dados de usuário do banco');
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }
    
    if (!data) {
      console.log('Nenhum usuário encontrado com esse ID');
      return null;
    }
    
    // Transformar os dados para o tipo User
    const user: User = {
      id: data.id,
      email: data.email,
      role: data.role || 'user',
      username: data.username,
      first_name: data.first_name,
      phone_number: data.phone_number,
      bio: data.bio,
      avatar_url: data.avatar_url,
      created_at: data.created_at,
      profile_views: data.profile_views
    };
    
    // Atualizar o cache
    localStorage.setItem('current_user', JSON.stringify(user));
    localStorage.setItem('current_user_cache_time', Date.now().toString());
    
    return user;
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error);
    return null;
  }
};

/**
 * Verificar se o usuário está autenticado
 * Versão melhorada que verifica o localStorage e mantém uma cópia em cache do usuário
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const id = localStorage.getItem('current_user_id');
    if (!id) {
      console.log('Nenhum ID de usuário encontrado no localStorage');
      return false;
    }
    
    // Verificar se temos o usuário em cache no localStorage
    const cachedUserStr = localStorage.getItem('current_user');
    if (cachedUserStr) {
      // Verificar se o cache não está muito antigo (15 minutos)
      const cachedUser = JSON.parse(cachedUserStr);
      const cacheTime = localStorage.getItem('current_user_cache_time');
      
      if (cacheTime) {
        const cacheAge = Date.now() - parseInt(cacheTime);
        // Se o cache tem menos de 15 minutos, usar direto
        if (cacheAge < 15 * 60 * 1000) {
          return true;
        }
      }
    }
    
    // Se não temos cache ou está velho, verificar no banco
    const user = await getCurrentUser(id);
    
    if (user) {
      // Atualizar o cache
      localStorage.setItem('current_user', JSON.stringify(user));
      localStorage.setItem('current_user_cache_time', Date.now().toString());
      return true;
    }
    
    // Se não encontramos o usuário, limpar os dados
    console.log('Usuário não encontrado no banco, limpando dados');
    localStorage.removeItem('current_user_id');
    localStorage.removeItem('current_user_email');
    localStorage.removeItem('current_user');
    localStorage.removeItem('current_user_cache_time');
    return false;
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    return false;
  }
};

/**
 * Verificar status de autenticação
 */
export const checkAuthStatus = async (): Promise<boolean> => {
  return await isAuthenticated();
};

/**
 * Fazer logout
 * Versão melhorada que limpa todos os dados de sessão
 */
export const signOut = async (): Promise<void> => {
  localStorage.removeItem('current_user_id');
  localStorage.removeItem('current_user_email');
  localStorage.removeItem('current_user');
  localStorage.removeItem('current_user_cache_time');
  
  // Disparar evento para notificar os componentes sobre a mudança
  window.dispatchEvent(new Event('auth-state-changed'));
  
  // Redirecionar para a página de login
  window.location.href = '/login';
};

/**
 * Verificar se o usuário é admin
 */
export const isAdmin = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user?.role === 'admin';
};

/**
 * Verificar se o usuário é líder
 */
export const isLeader = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user?.role === 'leader' || user?.role === 'admin';
};

/**
 * Limpar todos os dados de autenticação
 */
export function clearAllAuthData(): void {
  console.log("🧹 Limpando todos os dados de autenticação...");
  
  // Limpar localStorage
  localStorage.removeItem('current_user_id');
  localStorage.removeItem('current_user_email');
  localStorage.removeItem('current_user');
  
  // Limpar qualquer chave que comece com temp_user_
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('temp_user_')) {
      localStorage.removeItem(key);
    }
  });
  
  console.log("✅ Dados de autenticação limpos com sucesso");
}

/**
 * Obter usuário pelo ID
 * Versão simplificada que busca o usuário na tabela users
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    console.log(`🔍 Buscando usuário pelo ID: ${userId}`);
    
    // Buscar na tabela users
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error(`❌ Erro ao buscar usuário: ${error.message}`);
      return null;
    }
    
    console.log(`✅ Usuário encontrado`);
    return userProfile as User;
  } catch (error: any) {
    console.error(`❌ Erro inesperado: ${error?.message}`);
    return null;
  }
}

/**
 * Atualizar perfil do usuário
 * Versão simplificada que atualiza os dados do perfil na tabela users
 */
export async function updateUserProfile(userId: string, userData: Partial<User> & { displayName?: string, avatarUrl?: string }): Promise<User | null> {
  try {
    console.log(`✏️ Atualizando perfil do usuário: ${userId}`);
    
    // Mapear campos para o formato correto (adaptação de camelCase para snake_case)
    const dataToUpdate = {
      display_name: userData.display_name || userData.displayName,
      bio: userData.bio,
      avatar_url: userData.avatar_url || userData.avatarUrl
    };
    
    // Atualizar na tabela users
    const { data: updatedProfile, error } = await supabase
      .from('users')
      .update(dataToUpdate)
      .eq('id', userId)
      .select()
      .single();
      
    if (error) {
      console.error(`❌ Erro ao atualizar perfil: ${error.message}`);
      toast({
        title: "Erro ao atualizar perfil",
        description: "Não foi possível salvar as alterações",
        variant: "destructive"
      });
      return null;
    }
    
    // Atualizar no localStorage
    const cachedUser = localStorage.getItem('current_user');
    if (cachedUser) {
      const user = JSON.parse(cachedUser);
      if (user.id === userId) {
        const updatedUser = { ...user, ...dataToUpdate };
        localStorage.setItem('current_user', JSON.stringify(updatedUser));
      }
    }
    
    console.log(`✅ Perfil atualizado com sucesso`);
    toast({
      title: "Perfil atualizado",
      description: "As alterações foram salvas com sucesso"
    });
    
    return updatedProfile as User;
  } catch (error: any) {
    console.error(`❌ Erro inesperado: ${error?.message}`);
    toast({
      title: "Erro ao atualizar perfil",
      description: "Ocorreu um erro inesperado ao salvar as alterações",
      variant: "destructive"
    });
    return null;
  }
}

/**
 * Criar conta de teste (apenas para desenvolvimento)
 * Versão simplificada que cria uma conta sem verificação de email
 */
export const devCreateTestAccount = async (email: string, password: string, username: string) => {
  try {
    console.log(`🧪 Criando conta de teste: ${email}`);
    
    // 1. Verificar se o email já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .maybeSingle();
      
    if (existingUser) {
      console.error(`❌ Email já registrado: ${email}`);
      return {
        success: false,
        message: "Este email já está sendo usado por outra conta"
      };
    }
    
    // 2. Registrar no Auth do Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    });
    
    if (error) {
      console.error(`❌ Erro ao criar conta de teste: ${error.message}`);
      return {
        success: false,
        message: error.message
      };
    }
    
    if (!data.user) {
      console.error(`❌ Dados do usuário não retornados pelo Supabase`);
      return {
        success: false,
        message: "Não foi possível criar a conta de teste"
      };
    }
    
    // 3. Criar perfil na tabela users
    const userId = data.user.id;
    const newUser = {
      id: userId,
      email: email,
      username: username,
      first_name: username,
      display_name: username,
      phone_number: "",
      role: "user",
      created_at: new Date().toISOString(),
    };
    
    const { error: profileError } = await supabase
      .from('users')
      .insert([newUser]);
      
    if (profileError) {
      console.error(`❌ Erro ao criar perfil: ${profileError.message}`);
      return {
        success: true,
        message: "Conta criada, mas não foi possível salvar o perfil"
      };
    }
    
    // 4. Login automático
    try {
      await supabase.auth.signInWithPassword({
        email,
        password
      });
      console.log(`✅ Login automático realizado`);
    } catch (loginError) {
      console.error(`⚠️ Não foi possível fazer login automático: ${loginError}`);
    }
    
    console.log(`✅ Conta de teste criada com sucesso`);
    return {
      success: true,
      message: "Conta de teste criada com sucesso",
      user: data.user
    };
  } catch (error: any) {
    console.error(`❌ Erro inesperado: ${error?.message}`);
    return {
      success: false,
      message: error.message || "Erro ao criar conta de teste"
    };
  }
};

/**
 * Confirmar email de usuário (apenas para desenvolvimento)
 * Versão simplificada que tenta confirmar um email usando RPC
 */
export const devConfirmUserEmail = async (email: string) => {
  try {
    console.log(`🧪 Tentando confirmar email: ${email}`);
    
    // Tentativa de usar RPC (requer função personalizada no Supabase)
    try {
      const { error } = await supabase.rpc('confirm_user_email', { 
        email_to_confirm: email 
      });
      
      if (error) {
        console.error(`❌ Erro ao confirmar email via RPC: ${error.message}`);
        return {
          success: false,
          message: `Não foi possível confirmar o email: ${error.message}`
        };
      }
      
      console.log(`✅ Email confirmado com sucesso via RPC`);
      return {
        success: true,
        message: "Email confirmado com sucesso"
      };
    } catch (rpcError: any) {
      console.error(`❌ Função RPC não disponível: ${rpcError?.message}`);
      return {
        success: false,
        message: "Função de confirmação não disponível no servidor"
      };
    }
  } catch (error: any) {
    console.error(`❌ Erro inesperado: ${error?.message}`);
    return {
      success: false,
      message: error.message || "Erro ao confirmar email"
    };
  }
};

/**
 * Atualizar papel do usuário pelo email
 * Versão simplificada que atualiza o papel na tabela users
 */
export const updateUserRoleByEmail = async (email: string, newRole: string) => {
  try {
    console.log(`👑 Atualizando papel do usuário ${email} para ${newRole}`);
    
    // 1. Verificar se o papel é válido
    if (!['admin', 'leader', 'user'].includes(newRole)) {
      throw new Error('Papel inválido. Deve ser admin, leader ou user');
    }
    
    // 2. Buscar o usuário pelo email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
      
    if (userError || !user) {
      console.error(`❌ Usuário não encontrado: ${userError?.message}`);
      throw new Error('Usuário não encontrado');
    }
    
    // 3. Atualizar o papel do usuário
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', user.id);
      
    if (updateError) {
      console.error(`❌ Erro ao atualizar papel: ${updateError.message}`);
      throw new Error(`Erro ao atualizar papel: ${updateError.message}`);
    }
    
    console.log(`✅ Papel atualizado com sucesso`);
    
    // 4. Atualizar localStorage se for o usuário atual
    const cachedUser = localStorage.getItem('current_user');
    if (cachedUser) {
      const currentUser = JSON.parse(cachedUser);
      if (currentUser.email === email) {
        currentUser.role = newRole;
        localStorage.setItem('current_user', JSON.stringify(currentUser));
      }
    }
    
    return true;
  } catch (error: any) {
    console.error(`❌ Erro ao atualizar papel do usuário: ${error?.message}`);
    throw error;
  }
};

/**
 * Obter todos os usuários do sistema
 * Usado principalmente pela interface de administração
 */
export const getAllUsers = async (): Promise<User[]> => {
  try {
    console.log('🔍 Buscando todos os usuários');
    
    // Verificar se o usuário atual tem permissão (deve ser admin ou leader)
    const userIsAdmin = await isAdmin();
    const userIsLeader = await isLeader();
    
    if (!userIsAdmin && !userIsLeader) {
      console.error('❌ Usuário sem permissão para listar todos os usuários');
      throw new Error('Você não tem permissão para visualizar todos os usuários');
    }
    
    // Buscar todos os usuários da tabela users
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      throw new Error('Não foi possível obter a lista de usuários');
    }
    
    console.log(`✅ ${data.length} usuários encontrados`);
    
    // Transformar cada registro para o formato correto da interface User
    return data.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role || 'user',
      username: user.username || '',
      displayName: user.display_name || user.first_name || user.username || user.email,
      bio: user.bio || '',
      avatarUrl: user.avatar_url || '',
      createdAt: user.created_at || '',
      profileViews: user.profile_views || 0
    }));
  } catch (error) {
    console.error('❌ Erro ao obter todos os usuários:', error);
    throw error;
  }
};

/**
 * Atualizar papel/função de um usuário pelo ID
 * Usado principalmente pela interface de administração
 */
export const updateUserRole = async (userId: string, newRole: string): Promise<boolean> => {
  try {
    console.log(`👑 Atualizando papel do usuário ${userId} para ${newRole}`);
    
    // Verificar se o papel é válido
    if (!['admin', 'leader', 'user'].includes(newRole)) {
      throw new Error('Papel inválido. Deve ser admin, leader ou user');
    }
    
    // Verificar se o usuário atual tem permissão (deve ser admin ou leader)
    const userIsAdmin = await isAdmin();
    const userIsLeader = await isLeader();
    
    if (!userIsAdmin && !userIsLeader) {
      console.error('❌ Usuário sem permissão para atualizar papéis');
      throw new Error('Você não tem permissão para modificar papéis de usuários');
    }
    
    // Leaders só podem modificar usuários normais
    if (userIsLeader && !userIsAdmin) {
      // Verificar se o usuário alvo não é admin
      const { data: targetUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
        
      if (targetUser?.role === 'admin') {
        throw new Error('Líderes não podem modificar administradores');
      }
      
      // Líderes não podem criar administradores
      if (newRole === 'admin') {
        throw new Error('Líderes não podem promover a administrador');
      }
    }
    
    // Atualizar o papel do usuário
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId);
      
    if (error) {
      console.error(`❌ Erro ao atualizar papel: ${error.message}`);
      throw new Error(`Erro ao atualizar papel: ${error.message}`);
    }
    
    console.log(`✅ Papel atualizado com sucesso`);
    
    // Atualizar localStorage se for o usuário atual
    const currentUserId = localStorage.getItem('current_user_id');
    if (currentUserId === userId) {
      const cachedUser = localStorage.getItem('current_user');
      if (cachedUser) {
        const user = JSON.parse(cachedUser);
        user.role = newRole;
        localStorage.setItem('current_user', JSON.stringify(user));
        
        // Disparar evento para notificar componentes sobre a mudança
        window.dispatchEvent(new Event('auth-state-changed'));
      }
    }
    
    return true;
  } catch (error: any) {
    console.error(`❌ Erro ao atualizar papel do usuário: ${error?.message}`);
    throw error;
  }
}; 