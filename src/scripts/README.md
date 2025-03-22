# Scripts SQL para Configuração do Banco de Dados

Este diretório contém scripts SQL para configurar e manter o banco de dados Supabase do sistema.

## Ordem de Execução Recomendada

Ao configurar o sistema pela primeira vez, execute os scripts na seguinte ordem:

1. `sync_users_tables.sql` - Sincroniza os usuários entre `auth.users` e `public.users`
2. `create_events_tables.sql` - Cria as tabelas necessárias para o sistema de eventos
3. `fix_questions_table_schema.sql` - Configura o esquema das tabelas de perguntas
4. `create_answer_question_function.sql` - Cria a função para responder perguntas

## Resolução de Problemas

Se você encontrar erros específicos, execute os scripts de correção:

- `fix_events_date_format.sql` - Corrige problemas de tipo de dados para campos de data em eventos
- `sync_current_user.sql` - Se um usuário não existir na tabela `public.users`, execute para sincronizar

### Scripts para problemas de chave estrangeira com usuários

Se você encontrar erros como `Key (user_id) is not present in table users`, use os scripts:

1. `diagnose_user_sync.sql` - Diagnóstico detalhado sobre problemas de sincronização de usuários
2. `sync_current_user.sql` - Sincroniza um usuário específico entre `auth.users` e `public.users`
3. `force_user_insert.sql` - Força a inserção de um usuário contornando restrições de RLS
4. `fix_user_foreign_keys.sql` - Corrige as chaves estrangeiras para apontarem para `public.users`

## Descrição dos Scripts

### sync_users_tables.sql
Cria a tabela `public.users` se não existir e sincroniza os usuários do `auth.users` para `public.users`.
Este script também configura as políticas de segurança de linha (RLS) para a tabela de usuários.

### create_events_tables.sql
Cria as tabelas necessárias para o sistema de eventos:
- `public.events` - Armazena informações de eventos
- `public.event_attendances` - Registra participações em eventos
- `public.event_items` - Itens que participantes levarão para eventos
- `public.event_messages` - Mensagens de discussão sobre eventos

Também configura políticas de segurança e funções RPC.

### fix_questions_table_schema.sql
Configura o esquema da tabela `questions` e suas políticas de segurança.

### create_answer_question_function.sql
Cria a função RPC `answer_question` para permitir que administradores respondam perguntas.

### fix_events_date_format.sql
Corrige problemas de tipo de dados para campos de data nas tabelas de eventos, garantindo que
sejam armazenados como `TIMESTAMP WITH TIME ZONE` e que as funções relacionadas trabalhem 
corretamente com esse tipo de dado.

### sync_current_user.sql
Sincroniza um usuário específico da tabela `auth.users` para a tabela `public.users`.
Útil para corrigir erros de chave estrangeira ao confirmar presença em eventos.

### diagnose_user_sync.sql
Realiza um diagnóstico completo de problemas de sincronização de usuários, verificando a 
estrutura da tabela `public.users`, políticas RLS, existência do usuário em ambas as tabelas e
configuração de chaves estrangeiras.

### force_user_insert.sql
Força a inserção de um usuário na tabela `public.users`, contornando políticas RLS usando
uma função SECURITY DEFINER. Use apenas quando outros métodos falharem.

### fix_user_foreign_keys.sql
Reconfigura as chaves estrangeiras nas tabelas `event_attendances` e `event_messages`
para apontarem corretamente para a tabela `public.users`.

## Notas de Uso

- Execute os scripts diretamente no SQL Editor do painel do Supabase
- Alguns scripts usam blocos `DO` que permitem lógica condicional para evitar erros
- Os scripts foram projetados para serem idempotentes (podem ser executados múltiplas vezes)
- Política de erro: os scripts incluem manipulação de exceções e notificações de erros
- Todos os scripts incluem remoção de funções/políticas existentes antes de criar novas 

## Solução de Problemas Comuns

### Erro: cannot change return type of existing function

Se você encontrar o erro:
```
ERROR: 42P13: cannot change return type of existing function
HINT: Use DROP FUNCTION ... first.
```

Isso ocorre porque uma versão anterior da função já existe com um tipo de retorno diferente. Os scripts foram atualizados para remover automaticamente funções existentes antes de criar novas versões. Certifique-se de usar a versão mais recente dos scripts.

Solução manual:
1. Execute o comando mencionado na dica, por exemplo:
   ```sql
   DROP FUNCTION IF EXISTS create_event(text, text, timestamp with time zone, timestamp with time zone, text, text, uuid);
   ```
2. Em seguida, execute o script novamente

### Erro: operator does not exist: text < timestamp with time zone

Este erro ocorre quando há incompatibilidade entre tipos de dados em comparações, geralmente quando uma coluna de data está armazenada como texto ou quando parâmetros são passados com tipos incorretos.

Solução: Execute o script `fix_events_date_format.sql` que converte as colunas para o tipo correto e atualiza as funções relacionadas.

### Erro: Key (user_id) is not present in table "users"

Este erro ocorre quando você tenta inserir um registro em uma tabela que tem uma chave estrangeira para `public.users`, mas o usuário não existe nessa tabela (embora exista em `auth.users`).

Solução:
1. Execute o script `diagnose_user_sync.sql` para verificar o problema exato
2. Execute o script `sync_current_user.sql` alterando o ID para o seu usuário
3. Se ainda houver problemas, execute `force_user_insert.sql` para forçar a inserção
4. Se as chaves estrangeiras estiverem apontando para o local errado, execute `fix_user_foreign_keys.sql`

### Erro: unterminated dollar-quoted string

Este erro ocorre quando o Supabase SQL Editor adiciona seus próprios metadados ao final do script, interferindo com os delimitadores de string dollar-quoted.

Erro típico:
```
ERROR: 42601: unterminated dollar-quoted string at or near "$function$
-- source: dashboard
-- user: [id]
-- date: [timestamp]"
```

Solução:
1. Use a versão mais recente dos scripts. Os scripts foram atualizados para usar delimitadores mais específicos (como `$create_event_function$` em vez de apenas `$function$`) para evitar conflitos.
2. Se o erro persistir, você pode modificar manualmente os delimitadores no script:
   - Encontre todas as ocorrências de `$function$` (ou similar)
   - Substitua por um identificador mais específico como `$custom_identifier_[nome_da_função]$`
   - Certifique-se de que o mesmo identificador seja usado tanto na abertura quanto no fechamento da string 