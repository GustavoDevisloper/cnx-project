-- Script para testar as funções de manipulação de devocionais
-- Execute este script após aplicar as correções da coluna "references"

DO $$
DECLARE
    v_user_id UUID;
    v_devotional_id UUID;
    v_result JSONB;
BEGIN
    -- Obter um ID de usuário válido para teste
    SELECT id INTO v_user_id
    FROM public.users
    LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'Não foi encontrado nenhum usuário na tabela public.users. Criando um usuário fictício para teste...';
        -- Criar um registro fictício para teste
        v_user_id := '00000000-0000-0000-0000-000000000001'::UUID;
    END IF;
    
    RAISE NOTICE 'Testando inserção de devocional com coluna "references"...';
    
    -- Inserir um devocional de teste usando a função
    v_devotional_id := insert_devotional(
        'Teste de Devocional',                           -- título
        'Este é um conteúdo de teste para o devocional', -- conteúdo
        'João 3:16',                                     -- passagem bíblica
        'Porque Deus amou o mundo de tal maneira...',    -- texto da passagem
        'Usuário de Teste',                              -- autor
        v_user_id,                                       -- ID do autor
        CURRENT_DATE,                                    -- data
        'Segunda-feira',                                 -- dia da semana
        NULL,                                            -- URL da imagem
        TRUE,                                            -- gerado por IA
        ARRAY['Romanos 8:28', 'Salmos 23'],             -- referências (array)
        NULL                                             -- link de transmissão
    );
    
    RAISE NOTICE 'Devocional inserido com ID: %', v_devotional_id;
    
    -- Obter o devocional inserido
    v_result := get_devotional_with_references(v_devotional_id);
    
    RAISE NOTICE 'Devocional recuperado com sucesso:';
    RAISE NOTICE 'Título: %', v_result->>'title';
    RAISE NOTICE 'Conteúdo: %', v_result->>'content';
    RAISE NOTICE 'Passagem: %', v_result->>'scripture';
    RAISE NOTICE 'Referências: %', v_result->'references';
    
    -- Tentar acessar a coluna "references" diretamente via SELECT
    RAISE NOTICE '';
    RAISE NOTICE 'Verificando acesso direto à coluna references via SQL:';
    
    -- Cleanup (opcional - remova para manter o registro de teste)
    DELETE FROM public.devotionals WHERE id = v_devotional_id;
    RAISE NOTICE 'Limpeza concluída. Devocional de teste removido.';
END $$;

-- Teste de acesso direto via SQL
SELECT 
    id, 
    title, 
    scripture, 
    "references"
FROM 
    public.devotionals
LIMIT 5; 