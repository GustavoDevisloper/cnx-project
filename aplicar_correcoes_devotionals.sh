#!/bin/bash

# Script para aplicar correções na tabela de devocionais
# Resolve o problema da coluna "references" sendo uma palavra reservada em SQL

echo "Aplicando correções na tabela de devocionais..."

# Path para o cliente Supabase ou comando para conectar ao banco
SUPABASE_CMD="npx supabase"

# Diretório dos scripts SQL
SQL_DIR="./sql"

echo "1. Aplicando correção na coluna 'references'..."
$SUPABASE_CMD db execute -f "$SQL_DIR/fix_devotional_references_column.sql"

echo "2. Adicionando funções auxiliares..."
$SUPABASE_CMD db execute -f "$SQL_DIR/add_devotional_helper_functions.sql"

echo "3. Testando as funções..."
$SUPABASE_CMD db execute -f "$SQL_DIR/test_devotional_functions.sql"

echo "✅ Correções aplicadas com sucesso!"
echo "Verifique os logs acima para garantir que não houve erros."

echo "
Resumo das alterações:
- Coluna 'references' renomeada para '\"references\"' (com aspas duplas)
- Funções RPC atualizadas para trabalhar com a coluna escapada
- Funções auxiliares adicionadas para manipulação de devocionais
- Teste realizado para confirmar o funcionamento
"

echo "As atualizações no código TypeScript também devem ser implantadas." 