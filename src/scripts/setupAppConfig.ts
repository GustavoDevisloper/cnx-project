import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/utils';
import { getCurrentUser } from '@/services/authService';

export interface AppConfigItem {
  key: string;
  value: any;
  description?: string;
  last_updated?: string;
}

/**
 * Configura a tabela app_config no Supabase e adiciona valores padrão
 */
export async function setupAppConfig(): Promise<boolean> {
  try {
    logger.log('Configurando tabela app_config...');
    
    // Verificar se estamos em ambiente de desenvolvimento
    const isDev = import.meta.env.DEV;
    
    if (isDev) {
      logger.log('Ambiente de desenvolvimento detectado, usando configuração local');
      // Em desenvolvimento, não precisamos criar a tabela, apenas retornamos sucesso
      return true;
    }
    
    // Verificar se o usuário atual está autenticado
    const currentUser = await getCurrentUser();
    const isAdmin = currentUser?.role === 'admin';
    
    if (!currentUser) {
      logger.warn('Usuário não autenticado. Usando configuração local.');
      return false;
    }
    
    if (!isAdmin) {
      logger.warn('Usuário não possui permissões de administrador. Usando configuração local.');
      return false;
    }
    
    // Verificar se a tabela app_config existe
    const { error: tableExistsError } = await supabase
      .from('app_config')
      .select('key')
      .limit(1);
    
    // Se a tabela não existir, criaremos usando SQL
    if (tableExistsError) {
      // Verificar se é um erro de permissão negada ou tabela não encontrada
      if (tableExistsError.code === '42501' || 
          tableExistsError.message.includes('permission denied') || 
          tableExistsError.message.includes('Unauthorized')) {
        logger.warn('Permissão negada para acessar app_config. Isso pode ser devido a RLS.');
        return false;
      }
      
      if (tableExistsError.code === '42P01' || tableExistsError.message.includes('relation "app_config" does not exist')) {
        logger.log('Tabela app_config não encontrada, tentando criar via RPC...');
        
        // Tentamos criar via RPC (função que precisa estar definida no Supabase)
        try {
          const { error: rpcError } = await supabase.rpc('create_app_config_table');
          
          if (rpcError) {
            if (rpcError.message.includes('function') && rpcError.message.includes('does not exist')) {
              logger.warn('Função create_app_config_table não existe no Supabase.');
            } else {
              logger.error('Erro ao chamar RPC para criar tabela:', rpcError);
            }
            
            logger.log('Por favor, crie a tabela app_config manualmente no Supabase SQL Editor usando:');
            logger.log(`
              CREATE TABLE IF NOT EXISTS public.app_config (
                key TEXT PRIMARY KEY,
                value JSONB NOT NULL,
                description TEXT,
                last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
              );
              
              -- Permissões
              ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
              
              -- Apenas usuários autenticados podem ler app_config
              CREATE POLICY "Usuários autenticados podem ler app_config" 
                ON public.app_config FOR SELECT 
                USING (auth.role() = 'authenticated');
                
              -- Apenas admins podem modificar app_config
              CREATE POLICY "Apenas admins podem modificar app_config" 
                ON public.app_config FOR ALL 
                USING (auth.uid() IN (
                  SELECT auth.uid() 
                  FROM auth.users 
                  WHERE auth.users.role = 'admin'
                ));
            `);
            
            logger.warn('Usando configuração padrão local para WhatsApp Bot.');
            return false;
          }
        } catch (createError) {
          logger.error('Erro ao tentar criar tabela app_config:', createError);
          return false;
        }
      }
    }
    
    // Verificar se já existe configuração do WhatsApp Bot
    const { data: existingConfig, error: configError } = await supabase
      .from('app_config')
      .select('*')
      .eq('key', 'whatsapp_bot_config')
      .maybeSingle();
    
    if (configError) {
      if (configError.code === '42501' || 
          configError.message.includes('permission denied') || 
          configError.message.includes('Unauthorized')) {
        logger.warn('Permissão negada para verificar configuração existente. Isso pode ser devido a RLS.');
        return false;
      }
      
      if (configError.code !== '42P01') {
        logger.error('Erro ao verificar configuração existente:', configError);
        return false;
      }
    }
    
    // Se não existir configuração, criamos uma padrão para demonstração
    if (!existingConfig) {
      const whatsappConfig: AppConfigItem = {
        key: 'whatsapp_bot_config',
        value: {
          apiKey: "demo_key",
          apiSecret: "demo_secret",
          fromNumber: "5511999999999"
        },
        description: 'Configuração do serviço de WhatsApp Bot',
        last_updated: new Date().toISOString()
      };
      
      const { error: insertError } = await supabase
        .from('app_config')
        .insert(whatsappConfig);
      
      if (insertError) {
        if (insertError.code === '42501' || 
            insertError.message.includes('permission denied') || 
            insertError.message.includes('Unauthorized') ||
            insertError.message.includes('row-level security')) {
          logger.warn('Permissão negada para inserir configuração. Verificando permissões RLS.');
          return false;
        }
        
        logger.error('Erro ao inserir configuração padrão:', insertError);
        return false;
      }
      
      logger.log('Configuração padrão de WhatsApp Bot inserida com sucesso');
    } else {
      logger.log('Configuração de WhatsApp Bot já existe na tabela app_config');
    }
    
    return true;
  } catch (error) {
    logger.error('Erro ao configurar app_config:', error);
    return false;
  }
}

// Executar o script diretamente quando importado
if (import.meta.url === import.meta.resolve('./setupAppConfig.ts')) {
  setupAppConfig().then(success => {
    if (success) {
      logger.log('✅ Tabela app_config configurada com sucesso!');
    } else {
      logger.error('❌ Falha ao configurar tabela app_config!');
    }
  });
}

export default setupAppConfig; 