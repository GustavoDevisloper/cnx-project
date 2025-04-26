import { createClient } from '@supabase/supabase-js';

// Valores padrão para desenvolvimento (substitua pelos seus valores reais no .env.local)
const FALLBACK_URL = 'https://seu-projeto.supabase.co';
const FALLBACK_KEY = 'sua-chave-anon-publica';

// Obtenha as variáveis de ambiente ou use os valores padrão
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

// Verifique se os valores são válidos URLs
function isValidUrl(string: string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Valide a URL do Supabase
if (!isValidUrl(supabaseUrl)) {
  console.error('VITE_SUPABASE_URL inválida ou não configurada corretamente');
}

// Verifique se a chave anônima não é a chave padrão
if (supabaseAnonKey === FALLBACK_KEY) {
  console.error('VITE_SUPABASE_ANON_KEY não configurada corretamente. Usando chave padrão!');
}

// Crie o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função para verificar se o Supabase está configurado corretamente
export function isSupabaseConfigured() {
  return isValidUrl(supabaseUrl) && supabaseAnonKey !== FALLBACK_KEY;
}

// Função para verificar a conexão com o Supabase
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('Erro ao conectar ao Supabase:', error);
      return { connected: false, error };
    }
    return { connected: true, data };
  } catch (error) {
    console.error('Exceção ao conectar ao Supabase:', error);
    return { connected: false, error };
  }
}
