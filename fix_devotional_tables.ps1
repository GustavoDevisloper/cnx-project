# Script PowerShell simplificado para corrigir as tabelas de devocionais
# Esta versão usa o script corrigido que evita erros de sintaxe

Write-Host "Iniciando correção das tabelas de devocionais (likes e comentários)..." -ForegroundColor Cyan

# Comando Supabase
$SupabaseCmd = "npx supabase"

# Verificar se o script existe
$SqlPath = ".\sql\create_devotional_tables_fix.sql"
if (-not (Test-Path $SqlPath)) {
    Write-Host "Erro: O arquivo SQL '$SqlPath' não foi encontrado." -ForegroundColor Red
    Write-Host "Certifique-se de que o arquivo foi criado corretamente." -ForegroundColor Yellow
    Exit 1
}

# Executar o comando SQL
Write-Host "Executando script SQL corrigido..." -ForegroundColor Yellow
try {
    Invoke-Expression "$SupabaseCmd db execute -f '$SqlPath'"
    Write-Host "`n✅ Script executado com sucesso!" -ForegroundColor Green
}
catch {
    Write-Host "`n❌ Erro ao executar o script:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Exit 1
}

Write-Host "`nAs tabelas devotional_likes e devotional_comments devem ter sido criadas." -ForegroundColor Cyan
Write-Host "Para verificar se as tabelas foram criadas, execute:" -ForegroundColor Yellow
Write-Host "  $SupabaseCmd db execute -f '.\sql\check_tables.sql'" -ForegroundColor Gray

Write-Host "`nPróximos passos:" -ForegroundColor Cyan
Write-Host "1. Reinicie o aplicativo para que ele possa usar as novas tabelas"
Write-Host "2. Teste as funcionalidades de curtidas e comentários nos devocionais" 