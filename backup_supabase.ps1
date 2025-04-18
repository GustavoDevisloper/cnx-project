# Script para fazer backup do banco de dados Supabase
# Certifique-se de ter a Supabase CLI instalada

# Defina as variáveis
$PROJECT_ID = "phplnehnmnqywqzzzytg"
$BACKUP_FILENAME = "supabase_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"

# Verifique se a CLI do Supabase está instalada
try {
    supabase --version
    Write-Host "Supabase CLI encontrada, continuando..." -ForegroundColor Green
} catch {
    Write-Host "Supabase CLI não encontrada. Instalando..." -ForegroundColor Yellow
    npm install -g supabase
}

# Instrução para login (usuário deve executar manualmente)
Write-Host "Por favor, execute o comando 'supabase login' se ainda não estiver autenticado" -ForegroundColor Yellow
Write-Host "Após login, entre com a senha do banco de dados quando solicitado para gerar o backup" -ForegroundColor Yellow

# Comando para executar o backup (solicita senha interativamente)
Write-Host "Executando backup do banco de dados para $BACKUP_FILENAME..." -ForegroundColor Cyan
Write-Host "supabase db dump -p $PROJECT_ID > $BACKUP_FILENAME"

# Gere o arquivo de estrutura do banco
Write-Host "Gerando estrutura do banco..." -ForegroundColor Cyan
$SCHEMA_FILENAME = "supabase_schema_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
Write-Host "supabase db dump -p $PROJECT_ID --schema-only > $SCHEMA_FILENAME"

# Instruções para o usuário
Write-Host "`nInstruções para restaurar:" -ForegroundColor Green
Write-Host "1. Na VPS, crie um novo banco de dados PostgreSQL (se necessário)"
Write-Host "2. Restaure o backup com: psql -U postgres -d seu_banco -f $BACKUP_FILENAME"
Write-Host "3. Ou importe pelo painel do Supabase em uma nova instância"
Write-Host "`nArquivos de backup:"
Write-Host "- $BACKUP_FILENAME (backup completo)"
Write-Host "- $SCHEMA_FILENAME (apenas estrutura)"
Write-Host "`nLembre-se de guardar esses arquivos em local seguro!" -ForegroundColor Red 