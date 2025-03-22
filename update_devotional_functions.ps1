# Script PowerShell para validar e corrigir a estrutura da tabela devotionals
# Este script executa o script SQL de validação e mostra um resumo das alterações

Write-Host "Iniciando validação e correção da tabela devotionals..." -ForegroundColor Cyan

# Comando Supabase
$SupabaseCmd = "npx supabase"

# Diretório dos scripts SQL
$SqlDir = ".\sql"

# Verificar se a pasta sql existe
if (-not (Test-Path $SqlDir)) {
    Write-Host "Criando diretório para scripts SQL..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $SqlDir -Force | Out-Null
}

# Definir o caminho do arquivo de log
$LogPath = ".\devotionals_update_log.txt"

# Executar o script principal e capturar a saída para o log
Write-Host "Executando script de validação e correção..." -ForegroundColor Yellow
try {
    # Executar o comando e salvar a saída no arquivo de log
    Invoke-Expression "$SupabaseCmd db execute -f '$SqlDir\validate_devotionals_structure.sql'" | Tee-Object -FilePath $LogPath

    Write-Host "`n✅ Script executado com sucesso!" -ForegroundColor Green
    Write-Host "O log da execução foi salvo em: $LogPath" -ForegroundColor Cyan
}
catch {
    Write-Host "`n❌ Erro ao executar o script:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "Verifique se o Supabase CLI está instalado e se você tem acesso ao banco de dados." -ForegroundColor Yellow
    Exit 1
}

# Resumo das alterações
Write-Host @"

Resumo das alterações:
- Validação da existência da tabela devotionals
- Adição das colunas 'references' e 'transmission_link' (se não existirem)
- Atualização das funções RPC para utilizar todas as colunas
- Concessão de permissões para as funções

"@ -ForegroundColor Cyan

# Verificar resultados
Write-Host "Para verificar se as correções foram aplicadas corretamente, execute:" -ForegroundColor Yellow
Write-Host "  $SupabaseCmd db execute -f '$SqlDir\check_devotionals_structure.sql'" -ForegroundColor Gray

# Perguntar se o usuário quer testar a função
$resposta = Read-Host "`nDeseja testar a função get_latest_devotional()? (S/N)"
if ($resposta -eq "S" -or $resposta -eq "s") {
    Write-Host "Executando teste..." -ForegroundColor Cyan
    
    # Criar um arquivo SQL temporário para o teste
    $TestSqlPath = "$SqlDir\temp_test_devotional.sql"
    "SELECT get_latest_devotional();" | Out-File -FilePath $TestSqlPath -Encoding utf8
    
    # Executar o teste
    Invoke-Expression "$SupabaseCmd db execute -f '$TestSqlPath'"
    
    # Remover o arquivo temporário
    Remove-Item -Path $TestSqlPath -Force
}

# Informações finais
Write-Host "`nPróximos passos:" -ForegroundColor Cyan
Write-Host "1. Verifique se o código TypeScript está atualizado para usar essas colunas"
Write-Host "2. Teste a funcionalidade de devocionais no seu aplicativo"
Write-Host "3. Se encontrar erros, consulte o README.md para soluções de problemas comuns" 