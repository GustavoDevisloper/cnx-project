import { supabase } from '@/lib/supabase';
import { logger } from '../lib/utils';
import { getCurrentUser } from '@/services/authService';

/**
 * Script para configurar o Storage do Supabase
 * Verifica se o bucket de avatars existe e cria se necessário
 */

export async function setupStorage() {
  try {
    logger.log('Verificando configuração do Storage...');
    
    // Verificar se o usuário atual está autenticado
    const currentUser = await getCurrentUser();
    logger.log('Dados do usuário:', currentUser);
    
    // Verificar permissões do usuário
    const isAdmin = currentUser?.role === 'admin';
    const isLeader = currentUser?.role === 'leader';
    const hasPermission = isAdmin || isLeader;
    
    logger.log('É admin:', isAdmin);
    logger.log('É líder:', isLeader);
    logger.log('Tem permissão:', hasPermission);
    
    // Verificar se o bucket 'avatars' existe - primeiro tentando listar seus arquivos
    try {
      logger.log('Tentando acessar diretamente o bucket avatars...');
      const { data: files, error: accessError } = await supabase.storage
        .from('avatars')
        .list('', { limit: 1 });
      
      if (!accessError) {
        logger.log('✅ Bucket "avatars" já existe e está acessível!');
        // Tentar listar arquivos no bucket para verificar a acessibilidade
        logger.log(`Arquivos encontrados no bucket: ${files?.length || 0}`);
        return true;
      } else {
        // Se houver um erro de acesso específico para "não encontrado", o bucket realmente não existe
        if (accessError.message.includes('not found') || accessError.message.includes('does not exist')) {
          logger.log('Bucket "avatars" não encontrado no acesso direto, verificando listagem...');
        } else {
          logger.log('Erro ao acessar bucket "avatars":', accessError);
        }
      }
    } catch (accessAttemptError) {
      logger.log('Erro ao tentar acessar diretamente o bucket:', accessAttemptError);
    }
    
    // Se o acesso direto falhar, tenta listar todos os buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      if (error.message.includes('PermissionDenied') || error.message.includes('Unauthorized')) {
        logger.warn('Permissão negada para listar buckets. Isso é esperado se você não estiver autenticado ou não tiver permissões de admin.');
        
        // Mesmo sem permissão para listar, podemos tentar verificar se o bucket está acessível
        try {
          const { data: testData, error: testError } = await supabase.storage
            .from('avatars')
            .list('', { limit: 1 });
            
          if (!testError) {
            logger.log('✅ Bucket "avatars" existe e está acessível, mesmo sem permissão para listar todos os buckets!');
            return true;
          }
        } catch (e) {
          logger.log('Erro ao verificar acessibilidade do bucket:', e);
        }
        
        return false;
      }
      
      logger.error('Erro ao listar buckets:', error);
      return false;
    }
    
    // Log dos buckets encontrados para diagnóstico
    if (buckets && buckets.length > 0) {
      logger.log('Buckets encontrados:', buckets.map(b => b.name).join(', '));
    } else {
      logger.log('Nenhum bucket encontrado na listagem');
    }
    
    // Verificar se o bucket avatars existe na listagem
    const avatarsBucket = buckets?.find(b => b.name === 'avatars');
    
    if (!avatarsBucket) {
      logger.log('Bucket "avatars" não encontrado na listagem, tentando criar...');
      
      // Verificar se o usuário tem permissão para criar buckets
      if (!hasPermission) {
        logger.warn('Usuário não tem permissão para criar buckets. Pulando esta etapa.');
        return false;
      }
      
      try {
        // Tentar criar o bucket
        const { data, error: createError } = await supabase.storage.createBucket('avatars', {
          public: true,
          fileSizeLimit: 2 * 1024 * 1024 // 2MB
        });
        
        if (createError) {
          // Se o erro indicar que o bucket já existe, consideramos como sucesso
          if (createError.message?.includes('already exists')) {
            logger.log('✅ Bucket "avatars" já existe (detectado durante a criação)!');
            return true;
          }
          
          if (createError.message?.includes('row-level security') || 
              createError.message?.includes('permission denied') || 
              createError.message?.includes('Unauthorized')) {
            logger.warn('Permissão negada para criar bucket. Configure as permissões no Supabase ou peça a um administrador para criar o bucket "avatars".');
            return false;
          }
          
          logger.error('Erro ao criar bucket:', createError);
          return false;
        }
        
        logger.log('✅ Bucket "avatars" criado com sucesso!');
        
        // Configurar políticas de acesso público para o bucket
        try {
          // Esse método pode não funcionar se as permissões RLS não estiverem configuradas
          const { error: policyError } = await supabase.storage.from('avatars').createSignedUrl('test.txt', 60);
          
          if (policyError && !policyError.message.includes('not found')) {
            logger.warn('Verificação de políticas do bucket, isso não impede a utilização:', policyError);
          } else {
            logger.log('Políticas do bucket verificadas com sucesso');
          }
        } catch (policyError) {
          logger.warn('Erro ao verificar políticas, isso não impede a utilização:', policyError);
        }
        
        return true;
      } catch (bucketError) {
        logger.error('Erro ao criar bucket:', bucketError);
        return false;
      }
    }
    
    logger.log('✅ Bucket "avatars" já existe na listagem!');
    return true;
  } catch (e) {
    logger.error('Erro ao configurar storage:', e);
    return false;
  }
}

// Executar o setup ao carregar este script
setupStorage().then(success => {
  if (success) {
    logger.log('✅ Storage configurado com sucesso!');
  } else {
    logger.warn('⚠️ Configuração do Storage do Supabase falhou, usando alternativas locais.');
  }
});

export default setupStorage; 