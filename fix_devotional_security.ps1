# Script PowerShell para corrigir as políticas de segurança RLS nas tabelas de devocionais
# Este script resolve os erros 401 (Unauthorized) e 42501 (violação de políticas RLS)

Write-Host "Iniciando correção das políticas de segurança RLS para devocionais..." -ForegroundColor Cyan

# Comando Supabase
$SupabaseCmd = "npx supabase"

# Verificar se o script existe
$SqlPath = ".\sql\fix_devotional_tables_rls.sql"
if (-not (Test-Path $SqlPath)) {
    Write-Host "Erro: O arquivo SQL '$SqlPath' não foi encontrado." -ForegroundColor Red
    Write-Host "Certifique-se de que o arquivo foi criado corretamente." -ForegroundColor Yellow
    Exit 1
}

# Executar o comando SQL
Write-Host "Executando script SQL para adicionar políticas RLS..." -ForegroundColor Yellow
try {
    Invoke-Expression "$SupabaseCmd db execute -f '$SqlPath'"
    Write-Host "`n✅ Políticas de segurança aplicadas com sucesso!" -ForegroundColor Green
}
catch {
    Write-Host "`n❌ Erro ao aplicar políticas de segurança:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Exit 1
}

Write-Host "`nAs políticas RLS para devotional_likes e devotional_comments foram configuradas." -ForegroundColor Cyan
Write-Host "Isso deve resolver os erros 401 (Unauthorized) ao tentar adicionar likes e comentários." -ForegroundColor Cyan

Write-Host "`nPróximos passos:" -ForegroundColor Cyan
Write-Host "1. Reinicie o aplicativo para que as novas políticas sejam aplicadas"
Write-Host "2. Teste a funcionalidade de curtir e comentar nos devocionais"
Write-Host "3. Se ainda houver problemas, verifique os logs da aplicação" 