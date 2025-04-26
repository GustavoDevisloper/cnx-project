import React, { useState, useEffect } from 'react';
import { Card, Text, Button, TextInput, Select, SelectItem, DatePicker, Textarea, Callout } from '@tremor/react';
import { toast } from 'sonner';
import { Calendar, Clock, Send, Users, Phone, AlertCircle } from 'lucide-react';
import { formatPhoneNumber } from '@/services/whatsappBotService';

interface MessageSchedulerProps {
  initialRecipientPhone?: string;
  initialRecipientName?: string;
}

type MessageType = 'devotional' | 'event' | 'welcome' | 'birthday' | 'reminder' | 'announcement' | 'custom';

const MessageScheduler: React.FC<MessageSchedulerProps> = ({
  initialRecipientPhone = '',
  initialRecipientName = '',
}) => {
  const [loading, setLoading] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState(initialRecipientPhone);
  const [recipientName, setRecipientName] = useState(initialRecipientName);
  const [messageType, setMessageType] = useState<MessageType>('welcome');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState('12:00');
  
  // Campos específicos de cada tipo de mensagem
  const [customMessage, setCustomMessage] = useState('');
  const [eventData, setEventData] = useState({
    eventTitle: '',
    eventDate: '',
    eventLocation: '',
  });
  const [birthdayData, setBirthdayData] = useState({
    age: '',
  });
  const [reminderData, setReminderData] = useState({
    eventName: '',
    eventDate: '',
    eventTime: '',
    additionalInfo: '',
  });
  const [announcementData, setAnnouncementData] = useState({
    title: '',
    body: '',
    callToAction: '',
  });

  // Atualiza os estados quando as props iniciais mudam
  useEffect(() => {
    if (initialRecipientPhone) {
      setRecipientPhone(initialRecipientPhone);
    }
    if (initialRecipientName) {
      setRecipientName(initialRecipientName);
    }
  }, [initialRecipientPhone, initialRecipientName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipientPhone) {
      toast.error('Por favor, informe um número de telefone válido');
      return;
    }
    
    if (!scheduledDate) {
      toast.error('Por favor, selecione uma data para o agendamento');
      return;
    }
    
    try {
      setLoading(true);
      
      // Simular o agendamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Mensagem agendada com sucesso! (Simulação)');
      
      // Limpar formulário
      if (messageType === 'custom') setCustomMessage('');
      if (messageType === 'event') setEventData({ eventTitle: '', eventDate: '', eventLocation: '' });
      if (messageType === 'birthday') setBirthdayData({ age: '' });
      if (messageType === 'reminder') {
        setReminderData({ eventName: '', eventDate: '', eventTime: '', additionalInfo: '' });
      }
      if (messageType === 'announcement') {
        setAnnouncementData({ title: '', body: '', callToAction: '' });
      }
      
      // Limpar data e hora
      setScheduledDate(undefined);
      setScheduledTime('12:00');
    } catch (error: any) {
      toast.error(`Erro ao agendar mensagem: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-4">
      <Text className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong mb-4">
        Agendar Mensagem de WhatsApp
      </Text>
      
      <Callout 
        title="Modo de Demonstração" 
        icon={AlertCircle}
        color="amber"
        className="mb-4"
      >
        As mensagens agendadas são apenas simulações. O sistema está operando em modo de demonstração.
      </Callout>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Text className="text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-1">
            Tipo de Mensagem
          </Text>
          <Select
            value={messageType}
            onValueChange={(value) => setMessageType(value as MessageType)}
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
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            required
          />
        </div>
        
        <div>
          <Text className="text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-1">
            Nome do Destinatário (opcional)
          </Text>
          <TextInput
            icon={Users}
            placeholder="Ex: João"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Text className="text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-1">
              Data de Envio
            </Text>
            <DatePicker
              className="w-full"
              value={scheduledDate}
              onValueChange={setScheduledDate}
              minDate={new Date()}
              placeholder="Selecione a data"
              enableClear={false}
              required
            />
          </div>
          
          <div>
            <Text className="text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-1">
              Horário de Envio
            </Text>
            <TextInput
              icon={Clock}
              type="time"
              placeholder="12:00"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              required
            />
          </div>
        </div>
        
        {/* Campos específicos para cada tipo de mensagem */}
        {messageType === 'custom' && (
          <div>
            <Text className="text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-1">
              Mensagem Personalizada
            </Text>
            <Textarea
              placeholder="Digite sua mensagem personalizada aqui..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              required
            />
          </div>
        )}
        
        {messageType === 'event' && (
          <div className="space-y-3">
            <div>
              <Text className="text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-1">
                Nome do Evento
              </Text>
              <TextInput
                placeholder="Ex: Culto de Domingo"
                value={eventData.eventTitle}
                onChange={(e) => setEventData(prev => ({ ...prev, eventTitle: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Text className="text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-1">
                Data do Evento
              </Text>
              <TextInput
                icon={Calendar}
                placeholder="Ex: 15/12/2023"
                value={eventData.eventDate}
                onChange={(e) => setEventData(prev => ({ ...prev, eventDate: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Text className="text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-1">
                Local do Evento
              </Text>
              <TextInput
                placeholder="Ex: Igreja Central"
                value={eventData.eventLocation}
                onChange={(e) => setEventData(prev => ({ ...prev, eventLocation: e.target.value }))}
              />
            </div>
          </div>
        )}
        
        {messageType === 'reminder' && (
          <div className="space-y-3">
            <div>
              <Text className="text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-1">
                Nome do Compromisso
              </Text>
              <TextInput
                placeholder="Ex: Reunião de Oração"
                value={reminderData.eventName}
                onChange={(e) => setReminderData(prev => ({ ...prev, eventName: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Text className="text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-1">
                Data do Compromisso
              </Text>
              <TextInput
                icon={Calendar}
                placeholder="Ex: Amanhã às 19h"
                value={reminderData.eventDate}
                onChange={(e) => setReminderData(prev => ({ ...prev, eventDate: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Text className="text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-1">
                Horário (opcional)
              </Text>
              <TextInput
                icon={Clock}
                placeholder="Ex: 19:30"
                value={reminderData.eventTime}
                onChange={(e) => setReminderData(prev => ({ ...prev, eventTime: e.target.value }))}
              />
            </div>
            
            <div>
              <Text className="text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-1">
                Informações Adicionais
              </Text>
              <Textarea
                placeholder="Ex: Traga sua Bíblia e um caderno"
                value={reminderData.additionalInfo}
                onChange={(e) => setReminderData(prev => ({ ...prev, additionalInfo: e.target.value }))}
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
                placeholder="Ex: Novo Estudo Bíblico"
                value={announcementData.title}
                onChange={(e) => setAnnouncementData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Text className="text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-1">
                Conteúdo do Anúncio
              </Text>
              <Textarea
                placeholder="Ex: Estamos começando um estudo sobre o livro de Romanos..."
                value={announcementData.body}
                onChange={(e) => setAnnouncementData(prev => ({ ...prev, body: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Text className="text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-1">
                Chamada para Ação
              </Text>
              <TextInput
                placeholder="Ex: Inscreva-se até sexta-feira"
                value={announcementData.callToAction}
                onChange={(e) => setAnnouncementData(prev => ({ ...prev, callToAction: e.target.value }))}
              />
            </div>
          </div>
        )}
        
        {messageType === 'birthday' && (
          <div>
            <Text className="text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-1">
              Idade (opcional)
            </Text>
            <TextInput
              placeholder="Ex: 30"
              value={birthdayData.age}
              onChange={(e) => setBirthdayData({ age: e.target.value })}
            />
          </div>
        )}
        
        <Button
          type="submit"
          disabled={loading}
          icon={Send}
          className="w-full"
        >
          {loading ? 'Agendando...' : 'Agendar Mensagem'}
        </Button>
      </form>
    </Card>
  );
};

export default MessageScheduler; 