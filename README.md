# Sistema de Upload de Imagens

Este projeto implementa um sistema de upload de imagens que permite o armazenamento local de arquivos no diretório `public/uploads/images` do projeto.

## Estrutura de Armazenamento

- As imagens são salvas no diretório `public/uploads/images/`
- Subdiretórios podem ser criados para diferentes tipos de imagens (ex: `playlists`, `avatars`, etc.)
- Os nomes dos arquivos são gerados com timestamp e string aleatória para evitar conflitos

## Recursos Implementados

### 1. Redimensionamento Automático

- As imagens são redimensionadas antes de serem salvas para economizar espaço
- A resolução máxima padrão é 800x800 pixels
- A qualidade é ajustada para otimizar o tamanho do arquivo

### 2. Validações de Segurança

- Verificação de tamanho máximo (2MB)
- Validação de tipos de arquivo permitidos (JPG, PNG, GIF, WebP)
- Geração de nomes únicos para evitar sobrescrita

### 3. Fallbacks

O sistema implementa uma estratégia de fallback em três camadas:

1. Tenta salvar a imagem localmente no diretório público
2. Se falhar, tenta fazer upload para o Supabase Storage (se disponível)
3. Em último caso, converte a imagem para base64 e armazena no localStorage

## Como Usar

### Importação

```javascript
import { saveImageLocally, uploadImageWithLocalFallback } from "@/services/storageService";
```

### Upload Simples (Local)

```javascript
const handleUpload = async (file) => {
  const imagePath = await saveImageLocally(file, 'categoria');
  
  if (imagePath) {
    // Sucesso: imagePath contém o caminho relativo da imagem
    // Ex: "/uploads/images/categoria/1234567890_abc123.jpg"
  }
};
```

### Upload com Fallback (Recomendado)

```javascript
const handleUpload = async (file, userId) => {
  const imageUrl = await uploadImageWithLocalFallback(file, userId, 'categoria');
  
  if (imageUrl) {
    // Sucesso: imageUrl contém o caminho da imagem (local, Supabase ou base64)
  }
};
```

## Implementações

O sistema está sendo usado atualmente em:

1. Páginas de playlists para upload de capas
2. Perfil de usuário para upload de avatar

## Considerações para Produção

Em ambiente de produção, seria necessário implementar:

1. Um endpoint de API para receber e salvar as imagens no servidor
2. Uma estratégia de autorização para evitar uploads maliciosos
3. Um sistema de limpeza para remover imagens não utilizadas
