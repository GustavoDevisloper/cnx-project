-- Verificar se a tabela app_config já existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'app_config') THEN
    -- Criar tabela app_config para armazenar configurações
    CREATE TABLE public.app_config (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      key TEXT UNIQUE NOT NULL,
      value JSONB NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Configurar Políticas de Segurança por Linha (RLS)
    ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
    
    -- Permitir acesso apenas a administradores
    CREATE POLICY "Admins podem ler configurações" ON public.app_config
      FOR SELECT USING (
        auth.role() = 'authenticated' AND
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.role = 'admin'
        )
      );
      
    CREATE POLICY "Admins podem inserir configurações" ON public.app_config
      FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.role = 'admin'
        )
      );
      
    CREATE POLICY "Admins podem atualizar configurações" ON public.app_config
      FOR UPDATE USING (
        auth.role() = 'authenticated' AND
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.role = 'admin'
        )
      );
      
    CREATE POLICY "Admins podem excluir configurações" ON public.app_config
      FOR DELETE USING (
        auth.role() = 'authenticated' AND
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid() AND users.role = 'admin'
        )
      );
  END IF;
END
$$;

-- Inserir ou atualizar a configuração do bot do WhatsApp
INSERT INTO public.app_config (key, value, description)
VALUES ('whatsapp_bot_config', '{
  "apiKey": "sua_api_key_aqui",
  "apiSecret": "seu_api_secret_aqui",
  "fromNumber": "5511999999999",
  "templates": {
    "welcome": "Olá {{name}}, seja bem-vindo(a) à Conexão Jovem! Estamos felizes por você fazer parte da nossa comunidade. Você pode acessar o app em https://conexaojovem.app",
    "event_notification": "Olá {{name}}! Temos um novo evento: {{eventTitle}} que acontecerá em {{eventDate}} no local: {{eventLocation}}. Contamos com sua presença!",
    "devotional_reminder": "Olá {{name}}! Não esqueça de conferir o devocional de hoje na plataforma Conexão Jovem."
  }
}', 'Configuração para o bot do WhatsApp da aplicação')
ON CONFLICT (key) 
DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Comentário: Este script cria a estrutura para armazenar configurações do aplicativo, 
-- incluindo a configuração do bot do WhatsApp. Os valores das chaves API devem ser 
-- substituídos pelos valores reais antes de executar em produção.
-- Para obter as chaves API, registre-se no serviço Vonage (Nexmo) e configure 
-- o WhatsApp Business API. 