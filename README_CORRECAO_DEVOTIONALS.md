# Correção do Erro na Tabela de Devocionais

## Problema

Foi identificado um erro de sintaxe SQL que afeta a tabela `devotionals`. O erro ocorre porque o nome da coluna `references` é uma palavra-chave reservada em SQL.

**Erro encontrado:**
```
ERROR: 42601: syntax error at or near "references"
```

## Solução

A solução consiste em:

1. Renomear a coluna `references` para `"references"` (com aspas duplas) no banco de dados
2. Atualizar as funções RPC para trabalhar corretamente com a coluna escapada
3. Modificar o código TypeScript para lidar com a resposta das funções atualizadas
4. Criar funções auxiliares para manipulação adequada da coluna

## Arquivos Modificados

### SQL

1. **`sql/fix_devotional_references_column.sql`**
   - Verifica se a tabela existe e renomeia a coluna para usar aspas duplas
   - Atualiza as funções RPC `get_daily_devotional` e `get_latest_devotional`

2. **`sql/add_devotional_helper_functions.sql`**
   - Cria funções auxiliares para obter e inserir devocionais:
     - `get_devotional_with_references`: Retorna um devocional com a coluna references processada corretamente
     - `insert_devotional`: Insere um novo devocional com a coluna references escapada

3. **`sql/test_devotional_functions.sql`**
   - Script de teste para verificar se as funções estão funcionando corretamente

### TypeScript

1. **`src/services/devotionalService.ts`**
   - Atualizado para inserir corretamente devocionais com a coluna `"references"` escapada
   - Modificada a função `getTodayDevotional` para processar a resposta JSONB das funções RPC

### Scripts de Aplicação

1. **`aplicar_correcoes_devotionals.sh`** (Linux/Mac)
   - Script shell para aplicar todas as correções no ambiente Unix/Linux

2. **`AplicarCorrecoesDevotionals.ps1`** (Windows)
   - Script PowerShell para aplicar todas as correções em ambiente Windows

## Como Aplicar as Correções

### No Windows

1. Abra o PowerShell como administrador
2. Navegue até o diretório do projeto: `cd caminho/para/projeto`
3. Execute o script: `.\AplicarCorrecoesDevotionals.ps1`
4. Siga as instruções no terminal

### No Linux/Mac

1. Abra o terminal
2. Navegue até o diretório do projeto: `cd caminho/para/projeto`
3. Dê permissão de execução ao script: `chmod +x aplicar_correcoes_devotionals.sh`
4. Execute o script: `./aplicar_correcoes_devotionals.sh`
5. Siga as instruções no terminal

## Verificação

Para verificar se as correções foram aplicadas corretamente:

1. Acesse o console do Supabase
2. Execute a seguinte consulta SQL:

```sql
SELECT 
    column_name,
    data_type
FROM 
    information_schema.columns
WHERE 
    table_name = 'devotionals'
ORDER BY 
    ordinal_position;
```

3. Verifique se a coluna aparece como `"references"` (com aspas)

4. Teste a criação de um devocional pela aplicação e verifique se está funcionando corretamente

## Notas Adicionais

- A solução mantém toda a funcionalidade existente
- As inserções e consultas na tabela agora usam a sintaxe correta com a coluna escapada
- As funções RPC foram atualizadas para retornar JSONB, o que facilita o trabalho com a coluna escapada

Em caso de dúvidas ou problemas, entre em contato com a equipe de desenvolvimento. 