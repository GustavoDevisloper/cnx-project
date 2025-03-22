# Correção de Políticas RLS Duplicadas

## Problema Identificado

Após analisar as políticas de segurança (RLS) das tabelas de devocionais, identificamos a causa dos erros 401 (Unauthorized):

**Políticas duplicadas e conflitantes**:
- Existem múltiplas políticas para a mesma operação na mesma tabela
- Algumas políticas usam `{authenticated}` enquanto outras usam `{public}` 
- Algumas políticas de INSERT não têm a cláusula WITH CHECK definida corretamente

Isso cria conflitos na avaliação das permissões, resultando no erro:
```
{code: '42501', details: null, hint: null, message: 'new row violates row-level security policy for table "devotional_likes"'}
```

## Como Resolver

### Opção 1: Via Console do Supabase

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**
5. Cole o conteúdo do arquivo `sql/cleanup_devotional_policies.sql`
6. Clique em **Run** para executar

### Opção 2: Via CLI do Supabase

Se o CLI do Supabase estiver configurado corretamente, execute:

```bash
npx supabase db execute -f ./sql/cleanup_devotional_policies.sql
```

ou no PowerShell:

```powershell
npx supabase db execute -f .\sql\cleanup_devotional_policies.sql
```

### Opção 3: Ajuste Manual via Interface

Se preferir fazer manualmente pela interface do Supabase:

1. Acesse o Dashboard do Supabase
2. Navegue até **Authentication > Policies**
3. Selecione a tabela `devotional_likes`
4. Exclua todas as políticas existentes
5. Adicione novas políticas conforme abaixo:
   - INSERT: apenas usuários autenticados podem inserir suas próprias curtidas
   - SELECT: todos podem ver todas as curtidas
   - DELETE: usuários podem excluir suas próprias curtidas
   - Admin: administradores podem gerenciar todas as curtidas
6. Repita o processo para `devotional_comments`

## Confirmação

Após aplicar as correções, você pode verificar se elas foram aplicadas corretamente executando:

```sql
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  roles, 
  cmd
FROM 
  pg_policies
WHERE 
  tablename IN ('devotional_likes', 'devotional_comments')
ORDER BY 
  tablename, cmd;
```

Você deve ver apenas um conjunto limpo de políticas sem duplicações.

## Próximos Passos

1. Reinicie seu aplicativo para atualizar a conexão com o banco de dados
2. Teste novamente a funcionalidade de curtir e comentar devocionais
3. Os erros 401 (Unauthorized) devem estar resolvidos

Se ainda enfrentar problemas, verifique se:
- O usuário está autenticado corretamente (com token JWT válido)
- O valor de `user_id` nas tabelas corresponde ao `auth.uid()` do usuário autenticado 