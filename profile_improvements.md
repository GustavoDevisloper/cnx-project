# Melhorias na Página de Perfil

Este documento descreve as melhorias implementadas na página de perfil da aplicação Conexão Jovem.

## Funcionalidades Adicionadas

### 1. Upload de Imagem de Perfil 🖼️
- Agora os usuários podem fazer upload de uma imagem do dispositivo para seu perfil
- Alternativa ao método anterior que apenas permitia URL de imagens
- Interface com botões para alternar entre os modos "Link" e "Upload"
- Validação de tipo de arquivo (apenas imagens) e tamanho (máx. 2MB)

### 2. Atualização Automática do Nome 📝
- O nome de exibição é salvo automaticamente após o usuário parar de digitar
- Sem necessidade de clicar em um botão "Salvar" separado
- Feedback visual imediato com notificações toast

### 3. Atualização Automática da Bio 📄
- A biografia do usuário é salva automaticamente após digitação
- Exibida instantaneamente no perfil após a atualização
- Mantém a formatação de múltiplas linhas

## Implementação Técnica

### Armazenamento de Imagens
As imagens são armazenadas no Supabase Storage em um bucket chamado "profiles" com a seguinte estrutura:
- Bucket: `profiles`
- Pasta: `avatars`
- Formato do nome do arquivo: `{user_id}-{timestamp}.{extension}`

### Políticas de Segurança
- Imagens são publicamente acessíveis para leitura
- Apenas usuários autenticados podem fazer upload
- Usuários só podem manipular seus próprios arquivos de avatar
- Validação de nome de arquivo para garantir propriedade

### Otimizações
- Debounce na atualização de texto para reduzir chamadas à API
- Upload assíncrono de imagens com feedback visual do progresso
- Feedback imediato de sucesso/erro com sistema de toast

### Correções de Erros
- **Erro de SQL (42804)**: Corrigido o erro "cannot subscript type text" nas políticas de segurança do bucket
  - Problema: Tentativa incorreta de usar notação de subscript `[1]` com funções que não retornavam arrays
  - Solução inicial: Removida a notação de subscript das funções nos scripts SQL

- **Erro de SQL (22P02)**: Corrigido o erro "malformed array literal" nas políticas de segurança
  - Problema: As funções `storage.foldername` e `storage.filename` retornam arrays em PostgreSQL, não strings simples
  - Solução: Substituído as funções por `position()` para verificar a presença de strings no nome do arquivo
  - Abordagem: A função `position('avatars' in name) > 0` verifica se a string 'avatars' está presente no caminho do arquivo

- **Erro de SQL (42883)**: Corrigido o erro "function pg_catalog.position(text, uuid) does not exist"
  - Problema: A função `position()` não aceita diretamente um valor UUID como parâmetro
  - Solução: Adicionado conversão explícita do UUID para texto usando `auth.uid()::text`
  - Impacto: Esta correção permite verificar corretamente se o ID do usuário está presente no nome do arquivo

## Como Usar

### Upload de Imagem
1. Acesse seu perfil
2. Clique no ícone de edição (lápis)
3. Na seção de avatar, clique no botão "Upload"
4. Selecione uma imagem do seu dispositivo
5. A imagem será enviada e atualizada automaticamente

### Atualização de Nome ou Bio
1. Acesse seu perfil
2. Clique no ícone de edição (lápis)
3. Edite seu nome ou biografia
4. Pare de digitar e aguarde brevemente - a informação será salva automaticamente
5. Uma notificação confirmará o sucesso da atualização

## Configuração do Servidor

Para que a funcionalidade de upload de imagens funcione corretamente, o bucket de storage precisa ser configurado. Execute o script PowerShell:

```
.\setup_profile_storage.ps1
```

Este script configura o bucket de storage "profiles" no Supabase com as políticas de segurança necessárias.

## Solução de Problemas

### Erro: "42804: cannot subscript type text because it does not support subscripting"
Este erro foi resolvido na versão mais recente do script. Se você ainda o encontrar:
1. Certifique-se de estar usando a versão mais recente do script `create_profiles_bucket.sql`
2. Execute o script `setup_profile_storage.ps1` atualizado para aplicar as correções

### Erro: "22P02: malformed array literal"
Este erro foi resolvido na versão mais recente do script. Se você ainda o encontrar:
1. O script foi atualizado para usar a função `position()` em vez de funções específicas para manipulação de caminho
2. Certifique-se de estar usando a versão mais recente do script `create_profiles_bucket.sql`
3. Execute o script `setup_profile_storage.ps1` atualizado para aplicar as correções

### Erro: "42883: function pg_catalog.position(text, uuid) does not exist"
Este erro foi resolvido na versão mais recente do script. Se você ainda o encontrar:
1. Certifique-se de que o UUID está sendo convertido explicitamente para texto com `::text`
2. Verifique se está usando a sintaxe correta: `position(auth.uid()::text in name) > 0`
3. Execute o script `setup_profile_storage.ps1` atualizado para aplicar todas as correções 