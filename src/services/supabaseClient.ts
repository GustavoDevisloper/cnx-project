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

// Crie o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função auxiliar para verificar se o Supabase está configurado
export function isSupabaseConfigured() {
  return isValidUrl(supabaseUrl) && supabaseAnonKey !== FALLBACK_KEY;
}
