# Script PowerShell para aplicar correções na tabela de devocionais
# Resolve o problema da coluna "references" sendo uma palavra reservada em SQL

Write-Host "Aplicando correções na tabela de devocionais..." -ForegroundColor Cyan

# Comando Supabase
$SupabaseCmd = "npx supabase"

# Diretório dos scripts SQL
$SqlDir = ".\sql"

Write-Host "1. Aplicando correção na coluna 'references'..." -ForegroundColor Yellow
Invoke-Expression "$SupabaseCmd db execute -f '$SqlDir\fix_devotional_references_column.sql'"

Write-Host "2. Adicionando funções auxiliares..." -ForegroundColor Yellow
Invoke-Expression "$SupabaseCmd db execute -f '$SqlDir\add_devotional_helper_functions.sql'"

Write-Host "3. Testando as funções..." -ForegroundColor Yellow
Invoke-Expression "$SupabaseCmd db execute -f '$SqlDir\test_devotional_functions.sql'"

Write-Host "`n✅ Correções aplicadas com sucesso!" -ForegroundColor Green
Write-Host "Verifique os logs acima para garantir que não houve erros."

Write-Host @"

Resumo das alterações:
- Coluna 'references' renomeada para '"references"' (com aspas duplas)
- Funções RPC atualizadas para trabalhar com a coluna escapada
- Funções auxiliares adicionadas para manipulação de devocionais
- Teste realizado para confirmar o funcionamento

"@ -ForegroundColor Cyan

Write-Host "As atualizações no código TypeScript também devem ser implantadas." -ForegroundColor Yellow

# Perguntar se deseja implantar as alterações TypeScript
$resposta = Read-Host "Deseja fazer deploy das alterações TypeScript agora? (S/N)"
if ($resposta -eq "S" -or $resposta -eq "s") {
    Write-Host "Executando deploy..." -ForegroundColor Cyan
    Invoke-Expression "npm run build"
    Invoke-Expression "npm run deploy"
    Write-Host "Deploy concluído!" -ForegroundColor Green
} 