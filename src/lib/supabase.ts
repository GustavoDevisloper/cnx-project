import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔧 Inicializando cliente Supabase...')
console.log('URL configurada:', supabaseUrl ? 'Sim' : 'Não')
console.log('🔑 Chave configurada:', supabaseAnonKey ? 'Sim' : 'Não')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!')
  console.error('Por favor, configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env')
  throw new Error('Supabase URL and Anon Key são necessários.')
}

/**
 * Criar uma versão customizada do cliente Supabase que evita problemas com canais
 */
function createCustomClient<T = Database>(
  supabaseUrl: string, 
  supabaseKey: string
): SupabaseClient<T> {
  const options = {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    global: {
      headers: { 'x-client-info': 'supabase-js-web' }
    },
    // Desabilitar completamente recursos em tempo real
    realtime: { enabled: false }
  }

  // Criar cliente com opções customizadas
  const client = createClient<T>(supabaseUrl, supabaseKey, options)

  // Substituir métodos problemáticos com versões seguras
  const originalOnAuthStateChange = client.auth.onAuthStateChange
  client.auth.onAuthStateChange = (callback: any) => {
    console.log('🔒 Usando versão segura de onAuthStateChange')
    return {
      data: { subscription: { unsubscribe: () => {} } },
      error: null
    }
  }

  return client
}

// Criar cliente Supabase
export const supabase = createCustomClient<Database>(supabaseUrl, supabaseAnonKey)

// Inicializar sem verificação de conexão
console.log('✅ Cliente Supabase inicializado')

// Função para verificar autenticação de forma segura
export const checkAuthStatus = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Erro ao verificar sessão:', error)
      return false
    }
    
    if (session) {
      localStorage.setItem('has_session', 'true')
      return true
    } else {
      localStorage.removeItem('has_session')
      localStorage.removeItem('current_user')
      return false
    }
  } catch (e) {
    console.warn('⚠️ Erro ao verificar status de autenticação:', e)
    return false
  }
}

// Limpar recursos ao descarregar a página
window.addEventListener('beforeunload', () => {
  sessionStorage.removeItem('login_in_progress')
  sessionStorage.removeItem('registration_in_progress')
})

/**
 * Verifica se o serviço Supabase está acessível
 * Com tratamento específico para o erro ERR_NAME_NOT_RESOLVED e mecanismo de retry
 */
export const checkSupabaseConnectivity = async (retryCount = 1): Promise<boolean> => {
  try {
    if (!window.navigator.onLine) return false;
    
    // Verificar se temos uma resposta em cache recente (últimos 30 segundos)
    const cachedValue = localStorage.getItem('supabase_connectivity_cache');
    const cachedTimestamp = localStorage.getItem('supabase_connectivity_timestamp');
    
    if (cachedValue && cachedTimestamp) {
      const timestamp = parseInt(cachedTimestamp);
      const now = Date.now();
      
      // Se o cache for válido (menos de 30 segundos), usar o valor em cache
      if (now - timestamp < 30000) {
        return cachedValue === 'true';
      }
    }
    
    // Primeira tentativa - usar o health check do Supabase
    try {
      const response = await fetch(`${supabase.supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': supabase.supabaseKey,
        },
        // Definir um timeout curto para evitar esperas longas
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        console.log("✅ Serviço Supabase disponível via fetch");
        // Armazenar resultado positivo em cache
        localStorage.setItem('supabase_connectivity_cache', 'true');
        localStorage.setItem('supabase_connectivity_timestamp', Date.now().toString());
        return true;
      }
    } catch (e: any) {
      console.warn("⚠️ Primeiro teste de conectividade falhou:", e.name);
      
      // Verificar especificamente o erro ERR_NAME_NOT_RESOLVED
      if (e.message && e.message.includes('ERR_NAME_NOT_RESOLVED')) {
        console.error("❌ Erro de resolução DNS (ERR_NAME_NOT_RESOLVED) - domínio do Supabase não pôde ser resolvido");
        // Armazenar resultado negativo em cache
        localStorage.setItem('supabase_connectivity_cache', 'false');
        localStorage.setItem('supabase_connectivity_timestamp', Date.now().toString());
        return false;
      }
    }
    
    // Segunda tentativa - usar o Supabase SDK para uma consulta simples
    try {
      const { count, error } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .limit(1)
        .maybeSingle();
      
      if (!error) {
        console.log("✅ Serviço Supabase disponível via SDK");
        // Armazenar resultado positivo em cache
        localStorage.setItem('supabase_connectivity_cache', 'true');
        localStorage.setItem('supabase_connectivity_timestamp', Date.now().toString());
        return true;
      } else if (error.message && error.message.includes('ERR_NAME_NOT_RESOLVED')) {
        console.error("❌ Erro de resolução DNS (ERR_NAME_NOT_RESOLVED) - domínio do Supabase não pôde ser resolvido");
        // Armazenar resultado negativo em cache
        localStorage.setItem('supabase_connectivity_cache', 'false');
        localStorage.setItem('supabase_connectivity_timestamp', Date.now().toString());
        return false;
      }
    } catch (e: any) {
      console.warn("⚠️ Segundo teste de conectividade falhou:", e);
      
      // Verificar especificamente o erro ERR_NAME_NOT_RESOLVED
      if (e.message && e.message.includes('ERR_NAME_NOT_RESOLVED')) {
        console.error("❌ Erro de resolução DNS (ERR_NAME_NOT_RESOLVED) - domínio do Supabase não pôde ser resolvido");
        // Armazenar resultado negativo em cache
        localStorage.setItem('supabase_connectivity_cache', 'false');
        localStorage.setItem('supabase_connectivity_timestamp', Date.now().toString());
        return false;
      }
    }
    
    // Se todas as tentativas falharam e ainda temos tentativas disponíveis, tentar novamente
    if (retryCount > 0) {
      console.log(`🔄 Tentando novamente verificar conectividade (${retryCount} tentativas restantes)...`);
      // Esperar 1 segundo antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 1000));
      return checkSupabaseConnectivity(retryCount - 1);
    }
    
    console.error("❌ Serviço Supabase não está acessível após múltiplas tentativas");
    // Armazenar resultado negativo em cache
    localStorage.setItem('supabase_connectivity_cache', 'false');
    localStorage.setItem('supabase_connectivity_timestamp', Date.now().toString());
    return false;
  } catch (e) {
    console.error("❌ Erro ao verificar conectividade com Supabase:", e);
    // Armazenar resultado negativo em cache
    localStorage.setItem('supabase_connectivity_cache', 'false');
    localStorage.setItem('supabase_connectivity_timestamp', Date.now().toString());
    return false;
  }
};

export default supabase 