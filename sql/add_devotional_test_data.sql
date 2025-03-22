-- Script para adicionar dados de teste à tabela devotionals
-- Inclui dados para todas as colunas, incluindo references e transmission_link

DO $$
DECLARE
    v_user_id UUID;
    v_devotional_id UUID;
BEGIN
    -- Mensagem inicial
    RAISE NOTICE 'Inserindo dados de teste na tabela devotionals...';

    -- Obter um ID de usuário válido para teste
    SELECT id INTO v_user_id
    FROM public.users
    WHERE role = 'admin'
    LIMIT 1;
    
    -- Se não encontrar um admin, tentar qualquer usuário
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id
        FROM public.users
        LIMIT 1;
    END IF;
    
    -- Se ainda não encontrar, criar um UUID fictício
    IF v_user_id IS NULL THEN
        v_user_id := '00000000-0000-0000-0000-000000000001'::UUID;
        RAISE NOTICE 'Não foi encontrado nenhum usuário na tabela users. Usando ID fictício para testes.';
    END IF;

    -- Inserir primeiro devocional de teste (com todas as colunas preenchidas)
    RAISE NOTICE 'Inserindo devocional de teste #1...';
    
    INSERT INTO public.devotionals (
        id,
        title,
        content,
        scripture,
        scripture_text,
        author_id,
        created_at,
        updated_at,
        published,
        publish_date,
        image_url,
        date,
        day_of_week,
        is_ai_generated,
        "references",
        transmission_link
    ) VALUES (
        gen_random_uuid(),
        'O Poder da Fé',
        'A fé é a certeza daquilo que esperamos e a prova das coisas que não vemos. Por meio da fé, os antigos receberam bom testemunho. Pela fé, entendemos que o universo foi formado pela palavra de Deus, de modo que aquilo que se vê não foi feito do que é visível.',
        'Hebreus 11:1-3',
        'Ora, a fé é a certeza daquilo que esperamos e a prova das coisas que não vemos. Por meio da fé, os antigos receberam bom testemunho. Pela fé, entendemos que o universo foi formado pela palavra de Deus, de modo que aquilo que se vê não foi feito do que é visível.',
        v_user_id,
        NOW(),
        NOW(),
        TRUE,
        NOW(),
        'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=1000',
        CURRENT_DATE::TEXT,
        CASE
            WHEN EXTRACT(DOW FROM CURRENT_DATE) = 0 THEN 'Domingo'
            WHEN EXTRACT(DOW FROM CURRENT_DATE) = 1 THEN 'Segunda-feira'
            WHEN EXTRACT(DOW FROM CURRENT_DATE) = 2 THEN 'Terça-feira'
            WHEN EXTRACT(DOW FROM CURRENT_DATE) = 3 THEN 'Quarta-feira'
            WHEN EXTRACT(DOW FROM CURRENT_DATE) = 4 THEN 'Quinta-feira'
            WHEN EXTRACT(DOW FROM CURRENT_DATE) = 5 THEN 'Sexta-feira'
            ELSE 'Sábado'
        END,
        FALSE,
        ARRAY['Romanos 10:17', 'Tiago 2:26', 'Mateus 17:20'],
        'https://youtube.com/watch?v=example-faith-video'
    ) RETURNING id INTO v_devotional_id;
    
    RAISE NOTICE 'Devocional #1 inserido com ID: %', v_devotional_id;
    
    -- Inserir segundo devocional de teste (para data futura)
    RAISE NOTICE 'Inserindo devocional de teste #2...';
    
    INSERT INTO public.devotionals (
        id,
        title,
        content,
        scripture,
        scripture_text,
        author_id,
        created_at,
        updated_at,
        published,
        publish_date,
        image_url,
        date,
        day_of_week,
        is_ai_generated,
        "references",
        transmission_link
    ) VALUES (
        gen_random_uuid(),
        'Graça e Perdão',
        'O verdadeiro amor de Deus se manifesta através da graça e do perdão. Quando entendemos a profundidade do perdão divino, somos capacitados a perdoar aqueles que nos ofenderam. O perdão não é uma opção para o cristão, mas um mandamento que reflete o caráter de Cristo em nós.',
        'Efésios 4:32',
        'Sejam bondosos e compassivos uns para com os outros, perdoando-se mutuamente, assim como Deus perdoou vocês em Cristo.',
        v_user_id,
        NOW(),
        NOW(),
        TRUE,
        NOW() + INTERVAL '1 day',
        'https://images.unsplash.com/photo-1529045138662-5ca4b0c17209?q=80&w=1000',
        (CURRENT_DATE + INTERVAL '1 day')::TEXT,
        CASE
            WHEN EXTRACT(DOW FROM (CURRENT_DATE + INTERVAL '1 day')) = 0 THEN 'Domingo'
            WHEN EXTRACT(DOW FROM (CURRENT_DATE + INTERVAL '1 day')) = 1 THEN 'Segunda-feira'
            WHEN EXTRACT(DOW FROM (CURRENT_DATE + INTERVAL '1 day')) = 2 THEN 'Terça-feira'
            WHEN EXTRACT(DOW FROM (CURRENT_DATE + INTERVAL '1 day')) = 3 THEN 'Quarta-feira'
            WHEN EXTRACT(DOW FROM (CURRENT_DATE + INTERVAL '1 day')) = 4 THEN 'Quinta-feira'
            WHEN EXTRACT(DOW FROM (CURRENT_DATE + INTERVAL '1 day')) = 5 THEN 'Sexta-feira'
            ELSE 'Sábado'
        END,
        TRUE,
        ARRAY['Mateus 6:14-15', 'Colossenses 3:13', 'Lucas 23:34'],
        NULL
    ) RETURNING id INTO v_devotional_id;
    
    RAISE NOTICE 'Devocional #2 inserido com ID: %', v_devotional_id;
    
    -- Inserir terceiro devocional de teste (gerado por IA)
    RAISE NOTICE 'Inserindo devocional de teste #3...';
    
    INSERT INTO public.devotionals (
        id,
        title,
        content,
        scripture,
        scripture_text,
        author_id,
        created_at,
        updated_at,
        published,
        publish_date,
        image_url,
        date,
        day_of_week,
        is_ai_generated,
        "references",
        transmission_link
    ) VALUES (
        gen_random_uuid(),
        'Esperança nas Tribulações',
        'As tribulações são parte da jornada cristã. Paulo nos ensina que, longe de nos afastar de Deus, as dificuldades podem nos aproximar dele quando respondemos com fé. O processo de crescimento espiritual muitas vezes passa por momentos de prova, forjando em nós um caráter que se assemelha cada vez mais ao de Cristo.',
        'Romanos 5:3-5',
        'Não só isso, mas também nos gloriamos nas tribulações, porque sabemos que a tribulação produz perseverança; a perseverança, um caráter aprovado; e o caráter aprovado, esperança. E a esperança não nos decepciona, porque Deus derramou seu amor em nossos corações, por meio do Espírito Santo que ele nos concedeu.',
        v_user_id,
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '1 day',
        TRUE,
        NOW() - INTERVAL '1 day',
        'https://images.unsplash.com/photo-1520642413789-2bd6770d59e3?q=80&w=1000',
        (CURRENT_DATE - INTERVAL '1 day')::TEXT,
        CASE
            WHEN EXTRACT(DOW FROM (CURRENT_DATE - INTERVAL '1 day')) = 0 THEN 'Domingo'
            WHEN EXTRACT(DOW FROM (CURRENT_DATE - INTERVAL '1 day')) = 1 THEN 'Segunda-feira'
            WHEN EXTRACT(DOW FROM (CURRENT_DATE - INTERVAL '1 day')) = 2 THEN 'Terça-feira'
            WHEN EXTRACT(DOW FROM (CURRENT_DATE - INTERVAL '1 day')) = 3 THEN 'Quarta-feira'
            WHEN EXTRACT(DOW FROM (CURRENT_DATE - INTERVAL '1 day')) = 4 THEN 'Quinta-feira'
            WHEN EXTRACT(DOW FROM (CURRENT_DATE - INTERVAL '1 day')) = 5 THEN 'Sexta-feira'
            ELSE 'Sábado'
        END,
        TRUE,
        ARRAY['Tiago 1:2-4', '2 Coríntios 4:17', '1 Pedro 1:6-7'],
        'https://youtube.com/watch?v=example-hope-video'
    ) RETURNING id INTO v_devotional_id;
    
    RAISE NOTICE 'Devocional #3 inserido com ID: %', v_devotional_id;
    
    -- Mensagem final
    RAISE NOTICE '✅ Dados de teste inseridos com sucesso!';
    RAISE NOTICE 'Total de devocionais inseridos: 3';
    
    -- Instruções para verificar os dados
    RAISE NOTICE '';
    RAISE NOTICE 'Para verificar os dados inseridos, execute:';
    RAISE NOTICE 'SELECT * FROM devotionals ORDER BY date DESC;';
    RAISE NOTICE '';
    RAISE NOTICE 'Para testar a função get_daily_devotional, execute:';
    RAISE NOTICE 'SELECT get_daily_devotional();';
END $$;

-- Contar quantos devocionais existem na tabela
SELECT count(*) AS total_devotionals FROM public.devotionals;

-- Mostrar dados mais recentes (opcional)
SELECT 
    id, 
    title, 
    date, 
    scripture, 
    "references", 
    transmission_link, 
    is_ai_generated
FROM 
    public.devotionals
ORDER BY 
    created_at DESC
LIMIT 5; 