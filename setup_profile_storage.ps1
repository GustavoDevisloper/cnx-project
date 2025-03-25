# Script PowerShell para configurar o bucket de armazenamento de perfis no Supabase
# Este script executa o SQL necessário para criar o bucket e definir permissões

Write-Host "Iniciando configuração do bucket de armazenamento para avatares..." -ForegroundColor Cyan

# Comando Supabase
$SupabaseCmd = "npx supabase"

# Caminho para o script SQL
$SqlPath = ".\sql\create_profiles_bucket.sql"

# Verificar se o diretório SQL existe
if (!(Test-Path -Path ".\sql" -PathType Container)) {
    Write-Host "Criando diretório SQL..." -ForegroundColor Yellow
    New-Item -Path ".\sql" -ItemType Directory | Out-Null
}

# Verificar se o arquivo SQL existe
if (!(Test-Path -Path $SqlPath -PathType Leaf)) {
    Write-Host "ERRO: Arquivo SQL não encontrado em $SqlPath" -ForegroundColor Red
    Write-Host "Certifique-se de que o arquivo create_profiles_bucket.sql está presente no diretório sql" -ForegroundColor Red
    exit 1
}

# Executar o comando SQL
Write-Host "Configurando bucket e políticas de segurança..." -ForegroundColor Yellow
Write-Host "Este script corrigiu vários problemas nas políticas de segurança do bucket" -ForegroundColor Green
Invoke-Expression "$SupabaseCmd db execute -f $SqlPath"

# Verificar o resultado do comando
if ($LASTEXITCODE -eq 0) {
    Write-Host "`nConfiguração do bucket de profiles concluída com sucesso!" -ForegroundColor Green
    
    Write-Host "`nPolíticas de segurança configuradas:" -ForegroundColor Cyan
    Write-Host "1. Acesso público de leitura para imagens de avatar" -ForegroundColor White
    Write-Host "2. Usuários autenticados podem fazer upload de seus próprios avatares" -ForegroundColor White
    Write-Host "3. Usuários autenticados podem atualizar seus próprios avatares" -ForegroundColor White
    Write-Host "4. Usuários autenticados podem excluir seus próprios avatares" -ForegroundColor White
    
    Write-Host "`nCorreções aplicadas:" -ForegroundColor Green
    Write-Host "- Corrigido o erro '42804: cannot subscript type text'" -ForegroundColor White
    Write-Host "- Corrigido o erro '22P02: malformed array literal'" -ForegroundColor White
    Write-Host "- Corrigido o erro '42883: function position(text, uuid) does not exist'" -ForegroundColor White
    Write-Host "- Substituído o uso de storage.foldername/filename por função position()" -ForegroundColor White
    Write-Host "- Adicionado conversão explícita de UUID para texto (auth.uid()::text)" -ForegroundColor White
    Write-Host "- Simplificado as condições de políticas para maior compatibilidade" -ForegroundColor White
    
    Write-Host "`nPróximos passos:" -ForegroundColor Yellow
    Write-Host "1. Teste a funcionalidade de upload de imagem na página de perfil" -ForegroundColor White
    Write-Host "2. Verifique se as imagens estão sendo armazenadas no bucket 'profiles/avatars'" -ForegroundColor White
    Write-Host "3. Confirme se a atualização automática do nome e bio está funcionando" -ForegroundColor White
} else {
    Write-Host "`nErro ao configurar o bucket de profiles." -ForegroundColor Red
    Write-Host "Verifique os logs acima para mais detalhes." -ForegroundColor Red
} 