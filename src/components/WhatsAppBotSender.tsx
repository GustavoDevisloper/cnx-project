import React, { useState, useEffect } from 'react';
import { Card, TextInput, Text, Button, Select, SelectItem, Textarea, Callout } from '@tremor/react';
import { toast } from 'sonner';
import { Send, Users, Phone, Calendar, Clock, Info, Bell, AlertCircle, ExternalLink } from 'lucide-react';
import { sendWhatsAppMessage, formatPhoneNumber } from '@/services/whatsappBotService';
import { 
  DevotionalMessage, 
  EventMessage, 
  WelcomeMessage, 
  CustomMessage, 
  BirthdayMessage,
  ReminderMessage,
  AnnouncementMessage
} from '@/lib/messageTemplates';
import { cn } from '@/lib/utils';
import useWhatsAppContacts from '@/hooks/useWhatsAppContacts';
import { ensureUnicodeEmojis } from '@/lib/emojiUtils';

// Tipos de mensagens disponíveis
type MessageType = 'devotional' | 'event' | 'welcome' | 'custom' | 'birthday' | 'reminder' | 'announcement';

interface WhatsAppBotSenderProps {
  initialRecipientPhone?: string;
  initialRecipientName?: string;
}

const WhatsAppBotSender: React.FC<WhatsAppBotSenderProps> = ({
  initialRecipientPhone = '',
  initialRecipientName = ''
}) => {
  const [loading, setLoading] = useState(false);
  const [messageType, setMessageType] = useState<MessageType>('welcome');
  const [phoneNumber, setPhoneNumber] = useState(initialRecipientPhone);
  const [userName, setUserName] = useState(initialRecipientName);
  const [customMessage, setCustomMessage] = useState('');
  const [message, setMessage] = useState('');
  const [age, setAge] = useState('');
  const [previewMessage, setPreviewMessage] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | ''>('');
  const [isDemoMode, setIsDemoMode] = useState(true); // Sempre usar modo demo
  const [reminderData, setReminderData] = useState({
    eventName: '',
    eventDate: '',
    eventTime: '',
    additionalInfo: ''
  });
  const [announcementData, setAnnouncementData] = useState({
    title: '',
    body: '',
    callToAction: ''
  });
  const [attachmentType, setAttachmentType] = useState<'none' | 'image' | 'document'>('none');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { contacts } = useWhatsAppContacts();
  
  // Estados para os campos de modelo removidos da função de envio
  const [marketingData, setMarketingData] = useState({
    businessName: '',
    offerDetails: '',
    callToAction: ''
  });
  
  const [updateData, setUpdateData] = useState({
    updateType: '',
    updateDetails: '',
    callToAction: ''
  });

  // Atualiza a mensagem de prévia com base nos inputs do usuário
  useEffect(() => {
    updatePreviewMessage();
  }, [messageType, userName, customMessage, age, reminderData, announcementData]);

  // Atualiza os estados quando as props iniciais mudam
  useEffect(() => {
    if (initialRecipientPhone) {
      setPhoneNumber(initialRecipientPhone);
    }
    if (initialRecipientName) {
      setUserName(initialRecipientName);
    }
    
    // Gera a mensagem automaticamente quando recebe o contato selecionado
    updatePreviewMessage();
    
    // Adiciona a mensagem prévia ao campo de mensagem para envio
    if (initialRecipientPhone && initialRecipientName) {
      setTimeout(() => {
        setMessage(previewMessage);
      }, 100);
    }
  }, [initialRecipientPhone, initialRecipientName]);

  // Quando a prévia da mensagem é atualizada, atualize também o campo de mensagem
  useEffect(() => {
    if (previewMessage) {
      setMessage(previewMessage);
    }
  }, [previewMessage]);

  const updatePreviewMessage = () => {
    let message = '';
    
    switch (messageType) {
      case 'devotional':
        message = DevotionalMessage(userName);
        break;
      case 'event':
        message = EventMessage(userName);
        break;
      case 'welcome':
        message = WelcomeMessage(userName);
        break;
      case 'custom':
        message = CustomMessage(customMessage, userName);
        break;
      case 'birthday':
        message = BirthdayMessage(userName, age);
        break;
      case 'reminder':
        message = ReminderMessage(
          userName,
          reminderData.eventName,
          reminderData.eventDate,
          reminderData.eventTime,
          reminderData.additionalInfo
        );
        break;
      case 'announcement':
        message = AnnouncementMessage(
          userName,
          announcementData.title,
          announcementData.body,
          announcementData.callToAction
        );
        break;
      default:
        message = WelcomeMessage(userName);
    }
    
    // Garantir que os emojis estejam em formato Unicode compatível
    setPreviewMessage(ensureUnicodeEmojis(message));
  };

  const handleReminderDataChange = (field: keyof typeof reminderData, value: string) => {
    setReminderData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAnnouncementDataChange = (field: keyof typeof announcementData, value: string) => {
    setAnnouncementData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMessage('');
    setFeedbackType('');
    
    if (!phoneNumber) {
      setFeedbackMessage('Por favor, insira um número de telefone válido');
      setFeedbackType('error');
      return;
    }
    
    try {
      setLoading(true);
      
      // Formata o número de telefone antes de enviar
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      // Garante compatibilidade de emojis antes de enviar
      const compatibleMessage = ensureUnicodeEmojis(previewMessage);
      
      // Envia a mensagem usando o serviço de WhatsApp
      await sendWhatsAppMessage(formattedPhone, compatibleMessage);
      
      setFeedbackMessage('Mensagem enviada com sucesso!');
      setFeedbackType('success');
      
      // Limpa o formulário após o envio bem-sucedido
      if (messageType === 'custom') {
        setCustomMessage('');
      }
      if (messageType === 'birthday') {
        setAge('');
      }
      if (messageType === 'reminder') {
        setReminderData({
          eventName: '',
          eventDate: '',
          eventTime: '',
          additionalInfo: ''
        });
      }
      if (messageType === 'announcement') {
        setAnnouncementData({
          title: '',
          body: '',
          callToAction: ''
        });
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setFeedbackMessage('Não foi possível enviar a mensagem. Tente novamente.');
      setFeedbackType('error');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleFileUpload = (file: File, url: string) => {
    setAttachment(file);
    setAttachmentUrl(url);
    
    // Criar preview para imagens
    if (attachmentType === 'image' && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachmentPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setAttachmentPreview(null);
    }
    
    toast.success(`Arquivo "${file.name}" anexado com sucesso`);
  };

  const handleClearAttachment = () => {
    setAttachment(null);
    setAttachmentUrl(null);
    setAttachmentPreview(null);
    setAttachmentType('none');
  };

  const handleSendMessage = async () => {
    if (!phoneNumber) {
      setFeedbackType('error');
      setFeedbackMessage('Por favor, insira um número de telefone');
      return;
    }

    if (!message) {
      setFeedbackType('error');
      setFeedbackMessage('Por favor, insira uma mensagem');
      return;
    }

    setIsLoading(true);
    setFeedbackType('');
    setFeedbackMessage('');

    try {
      // Formatar número de telefone
      let formattedPhone;
      try {
        formattedPhone = formatPhoneNumber(phoneNumber);
      } catch (error: any) {
        setFeedbackType('error');
        setFeedbackMessage(error.message || 'Número de telefone inválido');
        setIsLoading(false);
        return;
      }

      // Garantir compatibilidade dos emojis
      const compatibleMessage = ensureUnicodeEmojis(message);

      // Preparar objeto da mensagem
      const messageObj: any = {
        to: formattedPhone,
        text: compatibleMessage
      };
      
      // Adicionar anexo, se houver
      if (attachment && attachmentUrl) {
        messageObj.media = {
          type: attachmentType,
          url: attachmentUrl,
          caption: compatibleMessage || undefined
        };
      }

      // Enviar mensagem
      const response = await sendWhatsAppMessage(messageObj);

      setFeedbackType('success');
      setFeedbackMessage(`Mensagem enviada para ${phoneNumber}`);
      toast.success(`Mensagem enviada para ${phoneNumber}`);
      
      // Limpar campos após envio bem-sucedido
      setMessage('');
      setPhoneNumber('');
      setMessageType('welcome');
      setAttachment(null);
      setAttachmentUrl(null);
      setAttachmentPreview(null);
      setAttachmentType('none');
      
      // Limpar dados específicos de modelos
      setMarketingData({
        businessName: '',
        offerDetails: '',
        callToAction: ''
      });
      setReminderData({
        eventName: '',
        eventDate: '',
        eventTime: '',
        additionalInfo: ''
      });
      setUpdateData({
        updateType: '',
        updateDetails: '',
        callToAction: ''
      });
      setAnnouncementData({
        title: '',
        body: '',
        callToAction: ''
      });
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      setFeedbackType('error');
      setFeedbackMessage(error.message || 'Ocorreu um erro ao enviar a mensagem');
      toast.error(`Erro ao enviar mensagem: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-4">
      <Text className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong mb-4">
        Enviar Mensagem pelo WhatsApp
      </Text>
      
      <Button
        icon={ExternalLink}
        className="w-full mb-4"
        color="green"
        onClick={() => {
          if (!phoneNumber) {
            toast.error('Número de telefone não informado');
            return;
          }
          
          try {
            const formattedPhone = formatPhoneNumber(phoneNumber).replace('+', '');
            // Garantir que os emojis estejam em formato Unicode compatível
            const compatibleMessage = ensureUnicodeEmojis(previewMessage);
            const encodedMessage = encodeURIComponent(compatibleMessage);
            const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
            window.open(whatsappUrl, '_blank');
            toast.success(`Abrindo WhatsApp para ${userName || 'o contato'}`);
          } catch (error) {
            console.error('Erro ao abrir WhatsApp:', error);
            toast.error('Não foi possível abrir o WhatsApp');
          }
        }}
      >
        Abrir Conversa no WhatsApp
      </Button>
      
      <Callout 
        title="Modo de Demonstração" 
        icon={AlertCircle}
        color="amber"
        className="mb-4"
      >
        As mensagens não serão realmente enviadas. O sistema está operando em modo de simulação.
      </Callout>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Text className="text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-1">
            Tipo de Mensagem
          </Text>
          <Select 
            value={messageType} 
            onValueChange={(value) => setMessageType(value as MessageType)}
            className="mb-2"
          >
            <SelectItem value="welcome">Boas-vindas</SelectItem>
            <SelectItem value="devotional">Devocional da Semana</SelectItem>
            <SelectItem value="event">Evento/Programação</SelectItem>
            <SelectItem value="birthday">Aniversário</SelectItem>
            <SelectItem value="reminder">Lembrete</SelectItem>
            <SelectItem value="announcement">Anúncio/Comunicado</SelectItem>
            <SelectItem value="custom">Personalizada</SelectItem>
          </Select>
        </div>
        
        <div>
          <Text className="text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-1">
            Número de Telefone
          </Text>
          <TextInput
            icon={Phone}
            placeholder="Ex: (11) 98765-4321"
            value={phoneNumber}
            onChange={handlePhoneChange}
            required
          />
        </div>
        
        <div>
          <Text className="text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-1">
            Nome do Destinatário
          </Text>
          <TextInput
            icon={Users}
            placeholder="Ex: João"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>
        
        {messageType === 'birthday' && (
          <div>
            <Text className="text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-1">
              Idade (opcional)
            </Text>
            <TextInput
              icon={Calendar}
              placeholder="Ex: 25"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
        )}
        
        {messageType === 'reminder' && (
          <div className="space-y-3">
            <div>
              <Text className="text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-1">
                Nome do Compromisso
              </Text>
              <TextInput
                icon={Info}
                placeholder="Ex: Reunião de oração"
                value={reminderData.eventName}
                onChange={(e) => handleReminderDataChange('eventName', e.target.value)}
                required={messageType === 'reminder'}
              />
            </div>
            
            <div>
              <Text className="text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-1">
                Data do Compromisso
              </Text>
              <TextInput
                icon={Calendar}
                placeholder="Ex: amanhã, 12/10/2023"
                value={reminderData.eventDate}
                onChange={(e) => handleReminderDataChange('eventDate', e.target.value)}
                required={messageType === 'reminder'}
              />
            </div>
            
            <div>
              <Text className="text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-1">
                Horário (opcional)
              </Text>
              <TextInput
                icon={Clock}
                placeholder="Ex: 19:00"
                value={reminderData.eventTime}
                onChange={(e) => handleReminderDataChange('eventTime', e.target.value)}
              />
            </div>
            
            <div>
              <Text className="text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-1">
                Informações Adicionais (opcional)
              </Text>
              <Textarea
                placeholder="Ex: Traga sua Bíblia e um caderno para anotações"
                value={reminderData.additionalInfo}
                onChange={(e) => handleReminderDataChange('additionalInfo', e.target.value)}
              />
            </div>
          </div>
        )}
        
        {messageType === 'announcement' && (
          <div className="space-y-3">
            <div>
              <Text className="text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-1">
                Título do Anúncio
              </Text>
              <TextInput
                icon={Bell}
                placeholder="Ex: Novo Estudo Bíblico"
                value={announcementData.title}
                onChange={(e) => handleAnnouncementDataChange('title', e.target.value)}
                required={messageType === 'announcement'}
              />
            </div>
            
            <div>
              <Text className="text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-1">
                Corpo do Anúncio
              </Text>
              <Textarea
                placeholder="Ex: Estamos iniciando um novo estudo bíblico sobre o livro de Romanos..."
                value={announcementData.body}
                onChange={(e) => handleAnnouncementDataChange('body', e.target.value)}
                required={messageType === 'announcement'}
              />
            </div>
            
            <div>
              <Text className="text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-1">
                Chamada para Ação (opcional)
              </Text>
              <TextInput
                placeholder="Ex: Inscreva-se até sexta-feira"
                value={announcementData.callToAction}
                onChange={(e) => handleAnnouncementDataChange('callToAction', e.target.value)}
              />
            </div>
          </div>
        )}
        
        {messageType === 'custom' && (
          <div>
            <Text className="text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-1">
              Mensagem Personalizada
            </Text>
            <Textarea
              placeholder="Digite sua mensagem personalizada aqui..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              required={messageType === 'custom'}
            />
          </div>
        )}
        
        <div className="mt-4">
          <Text className="text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-1">
            Prévia da Mensagem
          </Text>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg whitespace-pre-line">
            {previewMessage || 'A prévia da mensagem aparecerá aqui...'}
          </div>
        </div>
        
        {feedbackMessage && (
          <div className={`p-3 rounded-lg ${feedbackType === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'}`}>
            {feedbackMessage}
          </div>
        )}
      </form>
    </Card>
  );
};

export default WhatsAppBotSender;