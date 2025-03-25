# Guia para o Sistema de Devocionais

## Visão Geral Atualizada

O sistema de devocionais foi redesenhado para seguir uma nova abordagem:

1. **Criação apenas por administradores** - Não existem mais devocionais gerados automaticamente.
2. **Simplificação de conteúdo** - Foco no tema, versículo bíblico e texto opcional.
3. **Sem explicações automáticas** - Os usuários compartilham suas interpretações nos comentários.

## Correções Técnicas Implementadas

Os seguintes problemas foram resolvidos:

1. Erro ao buscar devocional: `invalid input syntax for type uuid: "new"`
2. Erro na consulta por data: status `406 (Not Acceptable)`
3. Erro ao salvar devocional: `Could not find the 'theme' column of 'devotionals' in the schema cache`
4. Erro nas funções RPC: `column d.verse does not exist`

## Como Aplicar as Correções

### 1. Execute os scripts SQL

Execute os scripts SQL na seguinte ordem:

1. Primeiro, execute o script para corrigir a estrutura da tabela:
   ```
   fix_devotionals_table.sql
   ```

2. Em seguida, execute o script para criar as funções necessárias:
   ```
   create_devotional_functions.sql
   ```

### 2. Como executar os scripts:

1. Acesse o [Painel de controle do Supabase](https://app.supabase.io)
2. Selecione seu projeto
3. No menu lateral, clique em "SQL Editor"
4. Crie uma nova consulta
5. Copie e cole o conteúdo do arquivo `fix_devotionals_table.sql`
6. Clique em "Run" ou pressione Ctrl+Enter
7. Repita o processo para o arquivo `create_devotional_functions.sql`

## Criando Devocionais

### Quem pode criar

Apenas usuários com perfil `admin` ou `leader` podem criar devocionais.

### Campos necessários

1. **Título** (obrigatório) - O título do devocional
2. **Versículo** (obrigatório) - A referência bíblica principal (ex: "João 3:16")
3. **Tema** (opcional) - O tema principal do devocional
4. **Conteúdo** (opcional) - Um texto complementar ou introdutório

### Processo de Criação

1. Acesse a página `/devotional/new` como administrador
2. Preencha os campos necessários
3. Clique em "Publicar"

## Interação dos Usuários

1. **Leitura** - Todos os usuários podem ler os devocionais publicados
2. **Comentários** - Os usuários podem compartilhar suas interpretações nos comentários
3. **Curtidas** - Os usuários podem curtir devocionais e comentários

## Verificação Técnica

Após executar os scripts, verifique se:

1. A tabela `devotionals` existe e tem todas as colunas necessárias
2. As funções SQL estão criadas:
   - `get_daily_devotional()`
   - `get_latest_devotional()`
   - `get_devotionals_by_range(start_date, end_date)`
3. As políticas de segurança (RLS) estão configuradas

## Suporte

Para suporte adicional, consulte os arquivos:
- `src/services/devotionalService.ts` - Serviço principal de devocionais
- `src/pages/Devotional.tsx` - Página de visualização de devocionais
- `src/pages/DevotionalNew.tsx` - Página de criação de devocionais 