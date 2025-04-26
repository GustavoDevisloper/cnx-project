# Guia de Solução de Problemas - Supabase Storage

Este documento oferece orientações para solucionar problemas comuns relacionados ao serviço de armazenamento do Supabase.

## Problema Detectado: Acesso ao Bucket "avatars"

### Sintomas
- Mensagens de erro no console: `Bucket "avatars" não encontrado, tentando criar...`
- Erro 400 (Bad Request) ao tentar criar o bucket: `POST https://phplnehnmnqywqzzzytg.supabase.co/storage/v1/bucket 400`
- Aviso: `Permissão negada para criar bucket. Configure as permissões no Supabase ou peça a um administrador para criar o bucket "avatars".`

### Causa
Este erro geralmente ocorre por um dos seguintes motivos:

1. **Permissões Insuficientes**: O usuário atual não tem permissões necessárias para:
   - Listar buckets existentes
   - Criar novos buckets
   - Acessar buckets específicos

2. **Inconsistência na Detecção de Buckets**: O bucket já existe, mas a aplicação não consegue detectá-lo corretamente porque:
   - O método de verificação está falhando
   - As políticas de segurança do Row Level Security (RLS) estão bloqueando o acesso, mesmo que o bucket exista

3. **Problemas de Configuração do Supabase**: Configurações incorretas no projeto Supabase.

### Solução

#### Para Usuários
Se você está vendo estes erros como usuário final:

- Não se preocupe, a aplicação continuará funcionando
- Suas imagens serão armazenadas localmente (no navegador)
- Algumas funcionalidades relacionadas ao upload de imagens terão capacidades limitadas

#### Para Desenvolvedores

1. **Verificar Permissões no Supabase**:
   - Acesse o Dashboard do Supabase
   - Vá para "Storage" > "Policies"
   - Verifique se existem políticas que permitem leitura e escrita para os buckets de avatares

2. **Corrigir Políticas de Acesso**:
   - Para o bucket "avatars", adicione as seguintes políticas:
   
   ```sql
   -- Permitir leitura (SELECT) para todos
   CREATE POLICY "Avatars são públicos" ON storage.objects FOR SELECT 
   USING (bucket_id = 'avatars');
   
   -- Permitir inserção (INSERT) para usuários autenticados
   CREATE POLICY "Usuários podem fazer upload" ON storage.objects FOR INSERT TO authenticated
   WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
   
   -- Permitir atualização (UPDATE) dos próprios arquivos
   CREATE POLICY "Usuários podem atualizar próprios arquivos" ON storage.objects FOR UPDATE TO authenticated
   USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
   ```

3. **Verificar Existência do Bucket**:
   - Via Dashboard do Supabase, acesse "Storage" 
   - Verifique se o bucket "avatars" está listado
   - Se não estiver, crie-o manualmente e marque como público

4. **Ajustes no Código**:
   - A correção implementada no script `setupStorage.ts` deve resolver o problema de detecção
   - O script agora utiliza múltiplos métodos para detectar a existência do bucket
   - Logs aprimorados ajudarão a diagnosticar problemas futuros

## Implementação Resiliente

A aplicação foi projetada para ser resiliente a falhas de acesso ao Storage:

1. **Camadas de Fallback**:
   - Tenta usar o Supabase Storage
   - Se falhar, tenta armazenamento local
   - Se necessário, converte para base64

2. **Feedback ao Usuário**:
   - Notificações toast informam quando métodos alternativos são utilizados
   - Mensagens claras sobre limitações quando o armazenamento em nuvem não está disponível

## Verificando o Status Atual

Para verificar se o Storage está funcionando corretamente:

1. Abra o Console do navegador (F12)
2. Procure por mensagens contendo:
   - "✅ Bucket 'avatars' já existe e está acessível!"
   - "Storage configurado com sucesso!"

Se você ver "⚠️ Configuração do Storage do Supabase falhou, usando alternativas locais", o sistema está operando em modo de fallback.

## Dúvidas Frequentes

### As imagens sumirão se eu limpar o cache do navegador?
- Se estiverem armazenadas em base64 ou localmente, sim
- Se estiverem no Supabase Storage, não

### Preciso de permissão de administrador para usar o upload de imagens?
- Não, qualquer usuário autenticado pode fazer upload
- Mas um administrador precisa configurar corretamente o bucket e as políticas 