# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/b4bd3ea0-34bc-49e0-8157-1d7270794026

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/b4bd3ea0-34bc-49e0-8157-1d7270794026) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/b4bd3ea0-34bc-49e0-8157-1d7270794026) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)

# Estrutura e Correções da Tabela Devotionals

Este repositório contém scripts SQL e componentes React/TypeScript para gerenciar devocionais na aplicação. Abaixo estão as informações sobre a estrutura da tabela e como aplicar correções.

## Estrutura da Tabela Devotionals

A tabela `devotionals` contém as seguintes colunas:

| Coluna             | Tipo                    | Descrição                                |
|--------------------|-------------------------|-----------------------------------------|
| id                 | uuid                    | Identificador único do devocional        |
| title              | text                    | Título do devocional                     |
| content            | text                    | Conteúdo principal do devocional         |
| scripture          | text                    | Referência bíblica (ex: João 3:16)       |
| scripture_text     | text                    | Texto da passagem bíblica                |
| author_id          | uuid                    | ID do autor (referência à tabela users)  |
| created_at         | timestamp with time zone| Data de criação                          |
| updated_at         | timestamp with time zone| Data da última atualização               |
| published          | boolean                 | Indica se está publicado                 |
| publish_date       | timestamp with time zone| Data de publicação                       |
| image_url          | text                    | URL da imagem associada ao devocional    |
| date               | text                    | Data no formato texto (YYYY-MM-DD)       |
| day_of_week        | text                    | Dia da semana                            |
| is_ai_generated    | boolean                 | Indica se foi gerado por IA              |
| references         | text[]                  | Array de referências bíblicas adicionais |
| transmission_link  | text                    | Link para transmissão ao vivo            |

## Scripts de Correção Disponíveis

### 1. Validação e Correção Completa

O script `validate_devotionals_structure.sql` verifica e corrige toda a estrutura da tabela:

- Adiciona as colunas `references` e `transmission_link` se não existirem
- Atualiza todas as funções RPC para utilizar as novas colunas
- Adiciona permissões corretas para as funções

Para aplicar:

```bash
npx supabase db execute -f ./sql/validate_devotionals_structure.sql
```

### 2. Scripts Individuais

Também há scripts individuais disponíveis:

- `add_references_column.sql`: Adiciona apenas a coluna `references`
- `add_transmission_link_column.sql`: Adiciona apenas a coluna `transmission_link`
- `update_devotional_fix_script.sql`: Atualiza as funções RPC para a estrutura atual

## Componentes TypeScript

### DevotionalAdmin

O componente `DevotionalAdmin.tsx` permite que administradores criem e gerem devocionais:

- Geração automática baseada em temas
- Criação manual com todos os campos necessários
- Interface amigável com feedback visual

Para utilizar, adicione o componente a uma rota protegida para administradores:

```jsx
<Route path="/admin/devotionals" element={<DevotionalAdmin />} />
```

## Como Aplicar as Correções

### No Windows:

```powershell
.\AplicarCorrecoesDevotionals.ps1
```

### No Linux/Mac:

```bash
./aplicar_correcoes_devotionals.sh
```

## Resolvendo Problemas Comuns

### Problema com a coluna "references"

Se encontrar erros com a coluna "references", isso acontece porque é uma palavra reservada em SQL. O script `validate_devotionals_structure.sql` corrige esse problema adicionando aspas duplas ao nome da coluna.

### Erro ao inserir devocionais

Se houver erros ao inserir devocionais, verifique:

1. Se o TypeScript está usando a função `insert_devotional` corretamente
2. Se os parâmetros obrigatórios estão sendo enviados
3. Se o autor_id existe na tabela users

## Testes e Verificação

Para verificar se as correções foram aplicadas corretamente:

```sql
-- Verificar a estrutura da tabela
SELECT 
  column_name, 
  data_type 
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'public' 
  AND table_name = 'devotionals'
ORDER BY 
  ordinal_position;

-- Testar a função get_latest_devotional
SELECT get_latest_devotional();
```

# Conexão Jovem - Sistema de Devocionais

## Estrutura do Banco de Dados

### Tabelas Principais

1. **devotionals** - Armazena os devocionais diários
   - `id` (UUID) - Identificador único do devocional
   - `title` (TEXT) - Título do devocional
   - `content` (TEXT) - Conteúdo do devocional
   - `scripture` (TEXT) - Referência bíblica (ex: "João 3:16")
   - `scripture_text` (TEXT) - Texto completo da passagem bíblica
   - `author_id` (UUID) - ID do autor (referência à tabela users)
   - `created_at` (TIMESTAMP) - Data de criação
   - `updated_at` (TIMESTAMP) - Data de atualização
   - `published` (BOOLEAN) - Se o devocional está publicado
   - `publish_date` (TIMESTAMP) - Data de publicação
   - `image_url` (TEXT) - URL da imagem do devocional
   - `date` (DATE) - Data do devocional
   - `day_of_week` (TEXT) - Dia da semana
   - `is_ai_generated` (BOOLEAN) - Se foi gerado por IA
   - `"references"` (TEXT[]) - Array de referências adicionais
   - `transmission_link` (TEXT) - Link para transmissão ao vivo

2. **devotional_likes** - Armazena curtidas em devocionais
   - `id` (UUID) - Identificador único da curtida
   - `devotional_id` (UUID) - ID do devocional
   - `user_id` (UUID) - ID do usuário que curtiu
   - `created_at` (TIMESTAMP) - Data da curtida

3. **devotional_comments** - Armazena comentários em devocionais
   - `id` (UUID) - Identificador único do comentário
   - `devotional_id` (UUID) - ID do devocional
   - `user_id` (UUID) - ID do usuário que comentou
   - `text` (TEXT) - Texto do comentário
   - `created_at` (TIMESTAMP) - Data do comentário

## Scripts de Correção Disponíveis

### Scripts para Validação e Correção da Estrutura

1. **Validação e Correção Completa**
   - `validate_devotionals_structure.sql` - Valida e corrige a estrutura da tabela
   - Use `npx supabase db execute -f ./sql/validate_devotionals_structure.sql`

2. **Correção de Tabelas Relacionadas**
   - `create_devotional_tables_fix.sql` - Cria as tabelas de likes e comentários
   - Use `npx supabase db execute -f ./sql/create_devotional_tables_fix.sql`

3. **Correção de Políticas de Segurança RLS**
   - `fix_devotional_tables_rls.sql` - Configura as políticas de segurança RLS
   - Use `npx supabase db execute -f ./sql/fix_devotional_tables_rls.sql`

4. **Scripts Individuais**
   - `add_references_column.sql` - Adiciona a coluna "references"
   - `add_transmission_link_column.sql` - Adiciona a coluna transmission_link
   - `fix_devotional_functions.sql` - Corrige funções relacionadas
   - `check_tables.sql` - Verifica a estrutura atual das tabelas

## Como Aplicar Correções

### No Windows (PowerShell)

Execute um dos scripts PowerShell:

```powershell
# Para corrigir a estrutura das tabelas
.\update_devotional_functions.ps1

# Para criar tabelas de likes e comentários
.\fix_devotional_tables.ps1

# Para corrigir políticas de segurança RLS
.\fix_devotional_security.ps1
```

### No Linux/Mac

```bash
# Para corrigir a estrutura das tabelas
npx supabase db execute -f ./sql/validate_devotionals_structure.sql

# Para criar tabelas de likes e comentários
npx supabase db execute -f ./sql/create_devotional_tables_fix.sql

# Para corrigir políticas de segurança RLS
npx supabase db execute -f ./sql/fix_devotional_tables_rls.sql
```

## Problemas Comuns e Soluções

### 1. Erro com a coluna "references"

**Problema**: `references` é uma palavra reservada em SQL e causa erros.

**Solução**: Use aspas duplas em torno do nome da coluna: `"references"`.

### 2. Erro ao inserir devocionais

**Problema**: Erro ao inserir devocionais com referências ou links de transmissão.

**Solução**: Use a função `insert_devotional()` que lida corretamente com todas as colunas.

### 3. Erro de acesso às tabelas devotional_likes e devotional_comments

**Problema**: Erro 401 (Unauthorized) ou 42501 (violação de políticas RLS).

**Solução**: Execute o script de correção de políticas RLS:
```powershell
.\fix_devotional_security.ps1
```

### 4. Função get_daily_devotional não retorna o devocional correto

**Problema**: A função não considera a data atual ou o dia da semana.

**Solução**: Verifique e atualize a função usando o script `fix_devotional_functions.sql`.
