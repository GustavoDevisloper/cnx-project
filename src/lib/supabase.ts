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

export default supabase 