# Script PowerShell para criar tabelas relacionadas a devocionais
# Este script cria as tabelas necessárias para suportar curtidas e comentários

Write-Host "Criando tabelas relacionadas aos devocionais (likes e comentários)..." -ForegroundColor Cyan

# Comando Supabase
$SupabaseCmd = "npx supabase"

# Diretório dos scripts SQL
$SqlDir = ".\sql"

# Verificar se a pasta sql existe
if (-not (Test-Path $SqlDir)) {
    Write-Host "Criando diretório para scripts SQL..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $SqlDir -Force | Out-Null
}

# Caminho do arquivo de log
$LogPath = ".\devotional_tables_update_log.txt"

# Executar o script principal e capturar a saída para o log
Write-Host "Executando script de criação de tabelas relacionadas..." -ForegroundColor Yellow
try {
    # Executar o comando e salvar a saída no arquivo de log
    Invoke-Expression "$SupabaseCmd db execute -f '$SqlDir\create_devotional_related_tables.sql'" | Tee-Object -FilePath $LogPath

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
- Criação da tabela devotional_likes para as curtidas
- Criação da tabela devotional_comments para os comentários
- Configuração de políticas de segurança (RLS)
- Criação de funções auxiliares para manipulação de curtidas e comentários

"@ -ForegroundColor Cyan

# Perguntar se o usuário quer testar a função
$resposta = Read-Host "`nDeseja verificar se as tabelas foram criadas corretamente? (S/N)"
if ($resposta -eq "S" -or $resposta -eq "s") {
    Write-Host "Executando teste..." -ForegroundColor Cyan
    
    # Criar um arquivo SQL temporário para o teste
    $TestSqlPath = "$SqlDir\temp_test_devotional_tables.sql"
@"
-- Verificar se as tabelas existem
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_name IN ('devotional_likes', 'devotional_comments')
ORDER BY table_name;

-- Verificar se as funções existem
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('count_devotional_likes', 'has_user_liked_devotional', 'add_devotional_comment')
ORDER BY routine_name;
"@ | Out-File -FilePath $TestSqlPath -Encoding utf8
    
    # Executar o teste
    Invoke-Expression "$SupabaseCmd db execute -f '$TestSqlPath'"
    
    # Remover o arquivo temporário
    Remove-Item -Path $TestSqlPath -Force
}

# Mensagem final
Write-Host "`nPróximos passos:" -ForegroundColor Cyan
Write-Host "1. Reinicie o aplicativo para que ele possa usar as novas tabelas"
Write-Host "2. Teste as funcionalidades de curtidas e comentários nos devocionais"
Write-Host "3. Verifique os logs do aplicativo para garantir que os erros foram resolvidos" 