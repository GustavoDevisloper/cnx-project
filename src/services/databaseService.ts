import { supabase } from '@/lib/supabase';

/**
 * Executa um script SQL - função avançada para uso exclusivo em desenvolvimento
 * @param sql O script SQL a ser executado
 * @returns Resultado da execução
 */
export const executeSql = async (sql: string): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('🔧 Executando SQL:', sql.substring(0, 50) + '...');
    
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Erro ao executar SQL:', error);
      return {
        success: false,
        message: `Erro: ${error.message}`
      };
    }
    
    return {
      success: true,
      message: 'Comando SQL executado com sucesso'
    };
  } catch (error: any) {
    console.error('❌ Exceção ao executar SQL:', error);
    return {
      success: false,
      message: `Exceção: ${error.message}`
    };
  }
};

/**
 * Executa múltiplos comandos SQL separadamente
 * @param sqlCommands Array de comandos SQL
 * @returns Resultados da execução de cada comando
 */
export const executeSqlBatch = async (
  sqlCommands: string[]
): Promise<Array<{ command: string; success: boolean; message: string }>> => {
  const results = [];
  
  for (const command of sqlCommands) {
    try {
      // Executar cada comando individualmente
      const result = await executeSql(command);
      
      results.push({
        command: command.substring(0, 50) + '...',
        success: result.success,
        message: result.message
      });
    } catch (error: any) {
      results.push({
        command: command.substring(0, 50) + '...',
        success: false,
        message: `Exceção: ${error.message}`
      });
    }
  }
  
  return results;
};

/**
 * Verifica se uma tabela existe no banco de dados
 * @param tableName Nome da tabela
 * @returns Verdadeiro se a tabela existe
 */
export const tableExists = async (tableName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .single();
    
    if (error) {
      console.warn('⚠️ Erro ao verificar existência da tabela:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('❌ Exceção ao verificar tabela:', error);
    return false;
  }
};

/**
 * Executa um script para consertar as políticas RLS da tabela de usuários
 * @returns Resultado da operação
 */
export const fixUserPolicies = async (): Promise<{ success: boolean; message: string }> => {
  const sqlScript = `
    -- Desabilitar temporariamente RLS para permitir a criação de usuário sem restrições
    ALTER TABLE users DISABLE ROW LEVEL SECURITY;
    
    -- Limpar todas as políticas existentes que podem estar causando conflitos
    DO $$
    BEGIN
        FOR pol IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE tablename = 'users' AND schemaname = 'public'
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON users', pol.policyname);
        END LOOP;
    END
    $$;
    
    -- Criar novas políticas simples e sem recursão
    CREATE POLICY "users_read_policy"
    ON users FOR SELECT
    TO authenticated
    USING (true);
    
    CREATE POLICY "users_insert_policy"
    ON users FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
    
    CREATE POLICY "users_update_policy"
    ON users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);
    
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  `;

  // Dividir o script em comandos individuais e executar
  const commands = sqlScript
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0)
    .map(cmd => cmd + ';');
  
  const results = await executeSqlBatch(commands);
  
  // Verificar resultados
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;
  
  if (failureCount > 0) {
    return {
      success: false,
      message: `${failureCount} de ${results.length} comandos falharam.`
    };
  }
  
  return {
    success: true,
    message: `Políticas RLS atualizadas com sucesso (${successCount} comandos)`
  };
}; 