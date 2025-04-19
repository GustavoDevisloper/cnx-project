import { supabase } from '@/services/supabaseClient';
import { toast } from '@/hooks/use-toast';
import { logger } from '../lib/utils';

// Lista de buckets possíveis para tentar
const BUCKET_NAMES = ['avatars', 'profile', 'public', 'profiles', 'users'];

/**
 * Serviço para gerenciar upload e armazenamento de imagens
 */

/**
 * Verifica buckets existentes e retorna o primeiro disponível
 */
export const getAvailableBucket = async (): Promise<string | null> => {
  try {
    logger.log('Verificando buckets disponíveis...');
    
    // Tentar listar buckets primeiro
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (!error && buckets && buckets.length > 0) {
        logger.log('Buckets encontrados:', buckets.map(b => b.name).join(', '));
        
        // Verificar se algum dos buckets preferidos existe
        for (const bucketName of BUCKET_NAMES) {
          if (buckets.some(b => b.name === bucketName)) {
            logger.log(`Usando bucket existente: ${bucketName}`);
            return bucketName;
          }
        }
        
        // Se nenhum dos preferidos existir, usar o primeiro disponível
        logger.log(`Usando primeiro bucket disponível: ${buckets[0].name}`);
        return buckets[0].name;
      }
    } catch (e) {
      logger.error('Erro ao listar buckets:', e);
    }
    
    // Se não conseguir listar, tentar verificar cada bucket individualmente
    for (const bucketName of BUCKET_NAMES) {
      try {
        logger.log(`Tentando acessar bucket ${bucketName}...`);
        const { data, error } = await supabase.storage
          .from(bucketName)
          .list('', { limit: 1 });
          
        if (!error) {
          logger.log(`Bucket ${bucketName} está acessível!`);
          return bucketName;
        }
      } catch (e) {
        logger.log(`Bucket ${bucketName} não acessível`);
      }
    }
    
    logger.error('Nenhum bucket disponível');
    return null;
  } catch (e) {
    logger.error('Erro ao verificar buckets:', e);
    return null;
  }
};

/**
 * Criar um bucket se tiver permissão
 */
export const createStorageBucket = async (bucketName: string): Promise<boolean> => {
  try {
    logger.log(`Tentando criar bucket ${bucketName}...`);
    
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 2 * 1024 * 1024 // 2MB
    });
    
    if (error) {
      logger.error(`Erro ao criar bucket ${bucketName}:`, error);
      
      if (error.message?.includes('security policy')) {
        toast({
          title: 'Permissão negada',
          description: 'Você não tem permissão para criar buckets de armazenamento',
          variant: 'destructive'
        });
      }
      
      return false;
    }
    
    logger.log(`Bucket ${bucketName} criado com sucesso!`);
    return true;
  } catch (e) {
    logger.error(`Erro ao criar bucket ${bucketName}:`, e);
    return false;
  }
};

/**
 * Redimensiona uma imagem para limitar seu tamanho
 */
export const resizeImage = (file: File, maxWidth = 300, maxHeight = 300): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      // Criar canvas para redimensionar
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // Calcular proporções
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round(height * maxWidth / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round(width * maxHeight / height);
          height = maxHeight;
        }
      }
      
      // Configurar o canvas com o novo tamanho
      canvas.width = width;
      canvas.height = height;
      
      // Desenhar imagem redimensionada
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Converter para blob com qualidade reduzida (0.8 = 80%)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Falha ao converter imagem'));
          }
        },
        'image/jpeg',
        0.8
      );
    };
    
    img.onerror = () => {
      reject(new Error('Erro ao carregar imagem para redimensionamento'));
    };
  });
};

/**
 * Converter arquivo para base64 com tamanho limitado
 */
export const fileToBase64 = async (
  file: File, 
  maxWidth = 800, 
  maxHeight = 800, 
  quality = 0.8
): Promise<string> => {
  try {
    // Verificar tamanho máximo (2MB)
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      toast.error('Arquivo muito grande (máximo 2MB)');
      throw new Error('Arquivo excede tamanho máximo de 2MB');
    }

    // Verificar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado (apenas JPG, PNG, GIF ou WebP)');
      throw new Error('Tipo de arquivo não suportado');
    }

    return new Promise<string>((resolve, reject) => {
      // Primeiro ler o arquivo para obter o data URL
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (!event.target?.result) {
          toast.error('Erro ao processar imagem');
          reject(new Error('Erro ao ler arquivo'));
          return;
        }

        // Criar elemento de imagem para redimensionar
        const img = document.createElement('img');
        img.src = event.target.result as string;
        
        img.onload = () => {
          // Calcular novas dimensões mantendo proporção
          let width = img.width;
          let height = img.height;
          
          // Limitar largura
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          
          // Limitar altura
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
          
          // Redimensionar imagem usando canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            toast.error('Canvas não suportado no seu navegador');
            reject(new Error('Canvas não suportado'));
            return;
          }
          
          // Configuração para melhorar qualidade de renderização
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Fundo branco para imagens com transparência (melhor compatibilidade)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          
          // Desenhar imagem redimensionada
          ctx.drawImage(img, 0, 0, width, height);
          
          // Usar formato PNG para imagens pequenas para melhor qualidade
          const isPngBetter = file.type === 'image/png' && file.size < 500 * 1024;
          
          // Converter para base64 com formato adequado
          let base64;
          if (isPngBetter) {
            // Para PNG pequenos, usar PNG para melhor qualidade
            base64 = canvas.toDataURL('image/png', 1.0);
          } else {
            // Para outros tipos, usar JPEG com alta qualidade
            base64 = canvas.toDataURL('image/jpeg', quality);
          }
          
          // Se ainda estiver muito grande, reduzir mais a qualidade
          if (base64.length > 80000) {
            base64 = canvas.toDataURL('image/jpeg', 0.7);
          }
          
          // Se ainda estiver muito grande, reduzir ainda mais
          if (base64.length > 60000) {
            logger.log('Reduzindo qualidade da imagem para garantir compatibilidade');
            // Reduzir mais o tamanho, mas mantendo resolução razoável
            canvas.width = Math.round(width * 0.9);
            canvas.height = Math.round(height * 0.9);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            base64 = canvas.toDataURL('image/jpeg', 0.6);
          }
          
          logger.log(`Imagem convertida para base64: ${base64.length} caracteres`);
          
          resolve(base64);
        };
        
        img.onerror = () => {
          toast.error('Erro ao processar imagem');
          reject(new Error('Formato de imagem inválido'));
        };
      };
      
      reader.onerror = () => {
        toast.error('Erro ao ler arquivo');
        reject(new Error('Erro ao ler arquivo'));
      };
      
      reader.readAsDataURL(file);
    });
  } catch (error) {
    logger.error('Erro ao converter arquivo para base64:', error);
    throw error;
  }
};

/**
 * Upload de imagem usando Supabase Storage
 */
export const uploadImage = async (
  file: File,
  userId: string,
  path: string = 'avatars'
): Promise<string | null> => {
  try {
    // Verificar tamanho do arquivo (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo permitido é 2MB',
        variant: 'destructive'
      });
      return null;
    }
    
    // Verificar tipo de arquivo
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const validTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    if (!fileExt || !validTypes.includes(fileExt)) {
      toast({
        title: 'Tipo de arquivo inválido',
        description: 'Use apenas JPG, PNG, GIF ou WebP',
        variant: 'destructive'
      });
      return null;
    }
    
    // Obter bucket disponível
    const bucketName = await getAvailableBucket();
    
    if (!bucketName) {
      toast({
        title: 'Usando alternativa local',
        description: 'Salvando sua imagem localmente devido à indisponibilidade do armazenamento',
        variant: 'warning'
      });
      
      logger.log('Convertendo para base64 como alternativa...');
      return await fileToBase64(file);
    }
    
    // Nome do arquivo único com timestamp
    const timestamp = new Date().getTime();
    const filePath = `${path}/${userId}_${timestamp}.${fileExt}`;
    
    logger.log(`Fazendo upload para ${bucketName}/${filePath}`);
    
    // Tentar fazer upload
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
      
    if (error) {
      logger.error('Erro ao fazer upload:', error);
      
      // Se for erro de política de segurança ou permissão
      if (error.message?.includes('security policy') || error.message?.includes('permission') || error.statusCode === '403') {
        toast({
          title: 'Usando alternativa local',
          description: 'Salvando sua imagem localmente devido a restrições de permissão',
          variant: 'warning'
        });
        
        // Tentar alternativa com base64
        logger.log('Convertendo para base64 como alternativa...');
        return await fileToBase64(file);
      }
      
      // Se for erro de bucket não encontrado
      if (error.message?.includes('not found') || error.statusCode === '404') {
        toast({
          title: 'Usando alternativa local',
          description: 'Salvando sua imagem localmente devido à indisponibilidade do bucket',
          variant: 'warning'
        });
        
        // Tentar alternativa com base64
        logger.log('Convertendo para base64 como alternativa...');
        return await fileToBase64(file);
      }
      
      toast({
        title: 'Erro ao fazer upload',
        description: error.message || 'Não foi possível fazer upload do arquivo',
        variant: 'destructive'
      });
      
      return null;
    }
    
    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
      
    if (!urlData?.publicUrl) {
      logger.error('Não foi possível obter URL pública');
      
      // Tentar alternativa com base64
      return await fileToBase64(file);
    }
    
    logger.log('Upload concluído com sucesso:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (e) {
    logger.error('Erro inesperado ao fazer upload:', e);
    
    // Em caso de erro, tentar converter para base64
    try {
      logger.log('Tentando alternativa com base64...');
      return await fileToBase64(file);
    } catch (base64Error) {
      logger.error('Erro ao converter para base64:', base64Error);
      return null;
    }
  }
}; 