import { CronScheduler } from './cronScheduler';
import { logger } from './utils';
import { setupStorage } from '../scripts/setupStorage';
import { setupAppConfig } from '../scripts/setupAppConfig';

/**
 * Inicializa todas as tarefas de background da aplicação
 */
export async function initializeBackgroundTasks(): Promise<void> {
  try {
    logger.log('Inicializando tarefas de fundo...');
    
    // Configuração do Storage do Supabase
    setupStorage().then(success => {
      if (success) {
        logger.log('✅ Storage do Supabase configurado com sucesso!');
      } else {
        logger.warn('⚠️ Configuração do Storage do Supabase falhou, usando alternativas locais.');
      }
    });
    
    // Configuração da tabela app_config para WhatsApp Bot
    setupAppConfig().then(success => {
      if (success) {
        logger.log('✅ Tabela app_config configurada com sucesso!');
      } else {
        logger.warn('⚠️ Configuração da tabela app_config falhou, usando valores padrão.');
      }
    });
    
    // Inicia o agendador de tarefas cron
    const scheduler = CronScheduler.getInstance();
    scheduler.start();
    
    logger.log('Tarefas de fundo inicializadas com sucesso.');
  } catch (error) {
    logger.error('Erro ao inicializar tarefas de fundo:', error);
  }
}

/**
 * Finaliza todas as tarefas de background da aplicação
 */
export function shutdownBackgroundTasks(): void {
  try {
    logger.log('Finalizando tarefas de fundo...');
    
    // Para o agendador de tarefas cron
    const scheduler = CronScheduler.getInstance();
    scheduler.stop();
    
    logger.log('Tarefas de fundo finalizadas com sucesso.');
  } catch (error) {
    logger.error('Erro ao finalizar tarefas de fundo:', error);
  }
}

/**
 * Obtém o status atual das tarefas de fundo
 */
export function getBackgroundTasksStatus(): { schedulerStatus: { running: boolean; tasks: string[] } } {
  const scheduler = CronScheduler.getInstance();
  
  return {
    schedulerStatus: scheduler.getStatus()
  };
} 