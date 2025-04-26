import { logger } from '@/lib/utils';

/**
 * Singleton para gerenciar tarefas agendadas usando sintaxe cron
 */
export class CronScheduler {
  private static instance: CronScheduler;
  private intervalId: NodeJS.Timeout | null = null;
  private running: boolean = false;
  private tasks: Array<{ name: string; cronExpr: string; lastRun: Date | null; fn: () => Promise<void> }> = [];

  private constructor() {
    // Inicialize as tarefas aqui
    this.registerTask('checkSimulation', '*/30 * * * *', async () => {
      logger.log('🕒 Executando simulação de verificação a cada 30 minutos');
      await this.simulateMessageProcessing();
    });
  }

  /**
   * Obtém a instância única do CronScheduler
   */
  public static getInstance(): CronScheduler {
    if (!CronScheduler.instance) {
      CronScheduler.instance = new CronScheduler();
    }
    return CronScheduler.instance;
  }

  /**
   * Verifica se uma expressão cron deve ser executada no momento atual
   */
  private shouldRunCron(cronExpr: string, lastRun: Date | null): boolean {
    if (!lastRun) {
      return true; // Nunca foi executado antes
    }

    const now = new Date();
    const [minutes, hours, dayOfMonth, month, dayOfWeek] = cronExpr.split(' ');

    // Implementação simplificada para expressões cron básicas
    // Suporta apenas */N para minutos e horas
    if (minutes.startsWith('*/')) {
      const interval = parseInt(minutes.substring(2), 10);
      const minutesSinceLastRun = Math.floor((now.getTime() - lastRun.getTime()) / (60 * 1000));
      return minutesSinceLastRun >= interval;
    }

    if (hours.startsWith('*/')) {
      const interval = parseInt(hours.substring(2), 10);
      const hoursSinceLastRun = Math.floor((now.getTime() - lastRun.getTime()) / (60 * 60 * 1000));
      return hoursSinceLastRun >= interval;
    }

    // Implementação muito simples - verifica apenas se passou pelo menos 1 hora desde a última execução
    return (now.getTime() - lastRun.getTime()) >= 60 * 60 * 1000;
  }

  /**
   * Registra uma nova tarefa no agendador
   */
  public registerTask(name: string, cronExpr: string, fn: () => Promise<void>): void {
    this.tasks.push({
      name,
      cronExpr,
      lastRun: null,
      fn
    });
    logger.log(`📝 Tarefa registrada: ${name} (${cronExpr})`);
  }

  /**
   * Inicia o agendador de tarefas
   */
  public start(): void {
    if (this.running) {
      logger.warn('⚠️ O agendador já está em execução');
      return;
    }
    
    this.running = true;
    logger.log('🚀 Iniciando agendador de tarefas');
    
    // Verificar tarefas a cada minuto
    this.intervalId = setInterval(() => {
      this.checkTasks();
    }, 60 * 1000);

    // Executar uma verificação imediata
    this.checkTasks();
  }

  /**
   * Verifica quais tarefas devem ser executadas no momento atual
   */
  private checkTasks(): void {
    if (!this.running) return;

    const now = new Date();
    logger.log(`🔍 Verificando tarefas agendadas em ${now.toLocaleTimeString()}`);

    this.tasks.forEach(task => {
      if (this.shouldRunCron(task.cronExpr, task.lastRun)) {
        logger.log(`▶️ Executando tarefa: ${task.name}`);
        task.lastRun = now;
        
        task.fn()
          .then(() => {
            logger.log(`✅ Tarefa concluída: ${task.name}`);
          })
          .catch(error => {
            logger.error(`❌ Erro ao executar tarefa ${task.name}:`, error);
          });
      }
    });
  }

  /**
   * Para o agendador de tarefas
   */
  public stop(): void {
    if (!this.running) {
      logger.warn('⚠️ O agendador já está parado');
      return;
    }
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.running = false;
    logger.log('🛑 Agendador de tarefas parado');
  }

  /**
   * Obtém o status atual do agendador
   */
  public getStatus(): { running: boolean; tasks: string[] } {
    return {
      running: this.running,
      tasks: this.tasks.map(task => `${task.name} (${task.cronExpr})`)
    };
  }

  /**
   * Simula o processamento de mensagens agendadas
   * Esta é uma versão simulada que substitui a dependência do messageScheduler
   */
  private async simulateMessageProcessing(): Promise<void> {
    try {
      logger.log('🔵 [SIMULAÇÃO] Verificando mensagens agendadas para envio...');
      
      // Simula um atraso de processamento
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simula que encontrou algumas mensagens
      const foundMessages = Math.floor(Math.random() * 3); // 0 a 2 mensagens
      
      if (foundMessages > 0) {
        logger.log(`✅ [SIMULAÇÃO] ${foundMessages} mensagem(s) processada(s) com sucesso`);
      } else {
        logger.log('ℹ️ [SIMULAÇÃO] Nenhuma mensagem pendente encontrada');
      }
    } catch (error) {
      logger.error('❌ [SIMULAÇÃO] Erro ao processar mensagens agendadas:', error);
    }
  }
} 