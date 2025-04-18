import { supabase } from '@/lib/supabase';
import { checkSupabaseConnectivity } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

// Tipos de dados
export interface OfflineDevotional {
  id: string;
  title: string;
  text: string;
  date: string;
  isPending: boolean;
  createdAt: string;
  updatedAt: string;
  userId?: string;
  imageSrc?: string;
  transmissionLink?: string;
}

// Chave para armazenamento local
const OFFLINE_DEVOTIONALS_KEY = 'offline_devotionals';

/**
 * Salva um devocional offline no localStorage
 */
export const saveOfflineDevotional = (devotional: Omit<OfflineDevotional, 'id' | 'isPending' | 'createdAt' | 'updatedAt'>): OfflineDevotional => {
  // Gerar um ID temporário e adicionar metadados
  const offlineDevotional: OfflineDevotional = {
    ...devotional,
    id: `offline_${uuidv4()}`, // ID temporário com prefixo para identificação
    isPending: true, // Marcar como pendente de sincronização
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  // Obter devocionais offline existentes
  const existingDevotionals = getOfflineDevotionals();
  
  // Adicionar novo devocional à lista
  const updatedDevotionals = [...existingDevotionals, offlineDevotional];
  
  // Salvar a lista atualizada
  localStorage.setItem(OFFLINE_DEVOTIONALS_KEY, JSON.stringify(updatedDevotionals));
  
  // Notificar o usuário
  toast.success('Devocional salvo offline. Será sincronizado quando houver conexão.');
  
  return offlineDevotional;
};

/**
 * Obter todos os devocionais offline do localStorage
 */
export const getOfflineDevotionals = (): OfflineDevotional[] => {
  const devotionals = localStorage.getItem(OFFLINE_DEVOTIONALS_KEY);
  return devotionals ? JSON.parse(devotionals) : [];
};

/**
 * Verifica se há devocionais pendentes para sincronização
 */
export const hasPendingDevotionals = (): boolean => {
  const devotionals = getOfflineDevotionals();
  return devotionals.some(dev => dev.isPending);
};

/**
 * Remove um devocional da lista offline
 */
export const removeOfflineDevotional = (id: string): void => {
  const devotionals = getOfflineDevotionals();
  const updatedDevotionals = devotionals.filter(dev => dev.id !== id);
  localStorage.setItem(OFFLINE_DEVOTIONALS_KEY, JSON.stringify(updatedDevotionals));
};

/**
 * Sincroniza um devocional específico com o Supabase
 */
export const syncDevotional = async (devotional: OfflineDevotional): Promise<boolean> => {
  try {
    // Verifica conectividade antes de tentar sincronizar
    const isConnected = await checkSupabaseConnectivity();
    
    if (!isConnected) {
      console.log('❌ Sem conexão para sincronizar devocional:', devotional.id);
      return false;
    }
    
    // Remover propriedades específicas do offline e converter para formato compatível com PostgreSQL
    const { id, isPending, createdAt, updatedAt, ...offlineData } = devotional;
    
    // Mapear para o formato esperado pela tabela no PostgreSQL com base na estrutura usada em createDevotional
    const devotionalData = {
      title: offlineData.title.trim(),
      content: (offlineData.text || '').trim() || 'Sem conteúdo',
      scripture: (offlineData.scripture || '').trim(),
      author_id: offlineData.userId,
      date: offlineData.date || new Date().toISOString().split('T')[0],
      theme: 'reflexão',
      is_generated: false,
      references: [],
      image_url: offlineData.imageSrc || '',
      transmission_link: offlineData.transmissionLink || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Enviar para o Supabase
    const { data, error } = await supabase
      .from('devotionals')
      .insert(devotionalData)
      .select()
      .single();
  
    if (error) {
      console.error('❌ Erro ao sincronizar devocional:', error);
      return false;
    }
    
    // Remover da lista offline
    removeOfflineDevotional(devotional.id);
    console.log('✅ Devocional sincronizado com sucesso:', data);
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao sincronizar devocional:', error);
    return false;
  }
};

/**
 * Sincroniza todos os devocionais pendentes com o Supabase
 */
export const syncAllPendingDevotionals = async (): Promise<{ success: number, failed: number }> => {
  const devotionals = getOfflineDevotionals();
  const pendingDevotionals = devotionals.filter(dev => dev.isPending);
  
  if (pendingDevotionals.length === 0) {
    return { success: 0, failed: 0 };
  }
  
  let success = 0;
  let failed = 0;
  
  // Verificar conectividade apenas uma vez antes do processo em lote
  const isConnected = await checkSupabaseConnectivity();
  
  if (!isConnected) {
    console.log('❌ Sem conexão para sincronizar devocionais pendentes');
    return { success: 0, failed: pendingDevotionals.length };
  }
  
  // Notificar o usuário que a sincronização começou
  if (pendingDevotionals.length > 0) {
    toast.loading(`Sincronizando ${pendingDevotionals.length} devocionais...`, { duration: 3000 });
  }
  
  // Sincronizar cada devocional
  for (const devotional of pendingDevotionals) {
    const synced = await syncDevotional(devotional);
    
    if (synced) {
      success++;
    } else {
      failed++;
    }
  }
  
  // Notificar o resultado da sincronização
  if (success > 0) {
    toast.success(`${success} devocionais sincronizados com sucesso`);
  }
  
  if (failed > 0) {
    toast.error(`${failed} devocionais não puderam ser sincronizados`);
  }
  
  return { success, failed };
};

/**
 * Configura um listener para detectar quando o dispositivo volta a ficar online
 * e tenta sincronizar automaticamente
 */
export const setupConnectivityListeners = (): void => {
  // Função para tentar sincronizar quando voltar online
  const handleOnline = async () => {
    console.log('🌐 Conexão restabelecida, verificando devocionais pendentes...');
    
    if (hasPendingDevotionals()) {
      toast('Conexão restabelecida. Tentando sincronizar devocionais pendentes...', {
        icon: '🔄',
        duration: 3000
      });
      
      // Dar um pequeno delay para garantir que a conexão está estável
      setTimeout(async () => {
        await syncAllPendingDevotionals();
      }, 2000);
    }
  };
  
  // Verificar se estamos no ambiente do navegador
  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    
    // Limpar o listener quando não for mais necessário
    // (geralmente em um componente React, no useEffect cleanup)
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }
};

/**
 * Salva um devocional, no Supabase se estiver online ou localmente se offline
 */
export const saveDevotional = async (devotionalData: Omit<OfflineDevotional, 'id' | 'isPending' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean, data: any, isOffline: boolean }> => {
  try {
    // Verificar conectividade
    const isConnected = await checkSupabaseConnectivity(2); // Tenta 2 vezes
    
    if (!isConnected) {
      console.log('📴 Salvando devocional offline pois não há conexão...');
      const offlineData = saveOfflineDevotional(devotionalData);
      return { success: true, data: offlineData, isOffline: true };
    }
    
    // Se conectado, salvar diretamente no Supabase
    const { data, error } = await supabase
      .from('devotionals')
      .insert([devotionalData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao salvar devocional online:', error);
      
      // Se falhar por problema de conexão, tentar salvar offline
      if (error.message && (
        error.message.includes('network error') || 
        error.message.includes('Failed to fetch') ||
        error.message.includes('ERR_NAME_NOT_RESOLVED')
      )) {
        console.log('📴 Salvando offline após falha de rede...');
        const offlineData = saveOfflineDevotional(devotionalData);
        return { success: true, data: offlineData, isOffline: true };
      }
      
      return { success: false, data: null, isOffline: false };
    }
    
    toast.success('Devocional salvo com sucesso!');
    return { success: true, data, isOffline: false };
    
  } catch (e: any) {
    console.error('❌ Erro ao salvar devocional:', e);
    
    // Se for erro de conexão, salvar offline
    if (e.message && (
      e.message.includes('network error') || 
      e.message.includes('Failed to fetch') ||
      e.message.includes('ERR_NAME_NOT_RESOLVED')
    )) {
      console.log('📴 Salvando offline após erro...');
      const offlineData = saveOfflineDevotional(devotionalData);
      return { success: true, data: offlineData, isOffline: true };
    }
    
    return { success: false, data: null, isOffline: false };
  }
};

/**
 * Inicializar o sistema de sincronização
 */
export const initOfflineSync = (): void => {
  // Configurar os listeners de conectividade
  setupConnectivityListeners();
  
  // Verificar e tentar sincronizar na inicialização se estiver online
  if (typeof window !== 'undefined' && window.navigator.onLine && hasPendingDevotionals()) {
    // Verificar a conectividade real com o Supabase antes de tentar sincronizar
    checkSupabaseConnectivity().then(isConnected => {
      if (isConnected) {
        console.log('🔄 Tentando sincronizar devocionais pendentes na inicialização...');
        syncAllPendingDevotionals();
      }
    });
  }
}; 