# Instruções para Migração do Projeto para VPS

## 1. Prepare o projeto para transferência

### 1.1 Crie um build de produção
Execute o seguinte comando para criar uma versão de produção otimizada:

```bash
npm run build
```

Isso criará uma pasta `dist` com os arquivos otimizados para produção.

### 1.2 Arquivos essenciais para transferir
Certifique-se de transferir os seguintes arquivos/diretórios para sua VPS:

- `dist/` (pasta gerada pelo build)
- `package.json`
- `package-lock.json`
- `.env.production` (você precisará criar este arquivo com variáveis para produção)
- `supabase/` (pasta com migrações)

## 2. Backup do Banco de Dados Supabase

### 2.1 Usando a interface do Supabase
1. Acesse o painel do Supabase em https://app.supabase.com
2. Selecione seu projeto
3. Vá para "Database" → "Backups"
4. Clique em "Generate a new backup" e escolha "Full Database Dump"
5. Faça o download do arquivo SQL gerado

### 2.2 Usando a CLI do Supabase (alternativa)
Se você tiver a Supabase CLI instalada:

```bash
# Instalar Supabase CLI se não tiver
npm install -g supabase

# Fazer login
supabase login

# Fazer backup do banco de dados
supabase db dump -p phplnehnmnqywqzzzytg --db-url "postgresql://postgres:[PASSWORD]@db.phplnehnmnqywqzzzytg.supabase.co:5432/postgres" > supabase_backup.sql
```

Substitua `[PASSWORD]` pela senha do banco de dados.

## 3. Configuração na VPS

### 3.1 Requisitos no servidor
Instale os seguintes softwares na VPS:

```bash
# Node.js e npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Nginx (para servir arquivos estáticos)
sudo apt-get install nginx
```

### 3.2 Configuração do Nginx
Crie um arquivo de configuração para o Nginx:

```
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        root /caminho/para/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
    }
}
```

### 3.3 Variáveis de ambiente
Crie um arquivo `.env.production` na raiz do projeto com as configurações para produção:

```
VITE_SUPABASE_URL=https://phplnehnmnqywqzzzytg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBocGxuZWhubW5xeXdxenp6eXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwMDkxMDIsImV4cCI6MjA1NjU4NTEwMn0.sHzQyQTLe_KR4ZK_pRji7SHXLjmY-ZZPH-dSZKqtrL4 
VITE_BIBLE_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdHIiOiJUaHUgTWFyIDEzIDIwMjUgMDE6NDc6MzUgR01UKzAwMDAuZ3VzdGF2b2hlbnJpcXVlbWQ0QGdtYWlsLmNvbSIsImlhdCI6MTc0MTgzMDQ1NX0.2ErPmj2iYcpJeVNmkO9a8qqEX5fO8iEvAgPkjTEL8lU
VITE_SPOTIFY_CLIENT_ID=0ca611c8a6194de6a0fdd3c676fc6c11
VITE_SPOTIFY_REDIRECT_URI=https://seu-dominio.com/callback
```

Altere o `VITE_SPOTIFY_REDIRECT_URI` para o domínio da sua VPS.

## 4. Restauração do Banco de Dados (Se necessário)

Se você optar por usar uma nova instância do Supabase ou um PostgreSQL próprio na VPS:

### 4.1 Nova instância do Supabase
1. Crie um novo projeto no Supabase
2. Vá para "SQL Editor" e execute os scripts de migração
3. Importe o backup pelo painel do Supabase

### 4.2 PostgreSQL na VPS
```bash
# Instalar PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Importar o dump
psql -U postgres -d seu_banco -f supabase_backup.sql
```

## 5. Considerações Finais

### 5.1 URLs e Redirecionamentos
Certifique-se de atualizar todas as URLs que apontam para `localhost` para apontar para seu domínio de produção.

### 5.2 HTTPS
Configure HTTPS usando Let's Encrypt para maior segurança:

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

### 5.3 CI/CD (opcional)
Considere configurar uma pipeline CI/CD usando GitHub Actions ou similar para automatizar o processo de implantação. 