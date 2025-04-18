# Script para preparar projeto para migração para VPS
# Executa o build e prepara os arquivos para transferência

# Cores para output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

$GREEN = "Green"
$YELLOW = "Yellow"
$RED = "Red"

Write-ColorOutput $GREEN "Preparando projeto para migração para VPS..."

# 1. Verificar requisitos
Write-ColorOutput $YELLOW "Verificando requisitos..."
try {
    npm --version | Out-Null
    Write-Output "✓ npm está instalado"
} catch {
    Write-ColorOutput $RED "× npm não está instalado. Por favor, instale o Node.js e o npm."
    exit 1
}

# 2. Instalar dependências (caso não estejam instaladas)
Write-ColorOutput $YELLOW "Instalando dependências do projeto..."
npm install

# 3. Criar build de produção
Write-ColorOutput $YELLOW "Criando build de produção..."
npm run build

# 4. Criar diretório para arquivos de migração
$MIGRATION_DIR = "migration_package"
Write-ColorOutput $YELLOW "Criando diretório para os arquivos de migração: $MIGRATION_DIR"

if (Test-Path $MIGRATION_DIR) {
    Remove-Item -Path $MIGRATION_DIR -Recurse -Force
}
New-Item -Path $MIGRATION_DIR -ItemType Directory | Out-Null

# 5. Copiar arquivos necessários
Write-ColorOutput $YELLOW "Copiando arquivos necessários..."

# Copiar build
New-Item -Path "$MIGRATION_DIR/dist" -ItemType Directory | Out-Null
Copy-Item -Path "dist/*" -Destination "$MIGRATION_DIR/dist" -Recurse

# Copiar arquivos de configuração
Copy-Item -Path "package.json" -Destination "$MIGRATION_DIR/"
Copy-Item -Path "package-lock.json" -Destination "$MIGRATION_DIR/"
Copy-Item -Path ".env.production" -Destination "$MIGRATION_DIR/"

# Copiar diretório supabase para migrações
New-Item -Path "$MIGRATION_DIR/supabase" -ItemType Directory | Out-Null
Copy-Item -Path "supabase/*" -Destination "$MIGRATION_DIR/supabase" -Recurse

# Copiar scripts de implantação
Copy-Item -Path "deploy_vps.sh" -Destination "$MIGRATION_DIR/"
Copy-Item -Path "migrar_para_vps.md" -Destination "$MIGRATION_DIR/README.md"

# 6. Finalização
Write-ColorOutput $GREEN "Preparação concluída!"
Write-Output "Todos os arquivos necessários foram preparados no diretório: $MIGRATION_DIR"
Write-Output "Você pode transferir este diretório para sua VPS e seguir as instruções no README.md"
Write-Output ""
Write-ColorOutput $YELLOW "IMPORTANTE: Não esqueça de realizar o backup do banco de dados usando o script backup_supabase.ps1" 