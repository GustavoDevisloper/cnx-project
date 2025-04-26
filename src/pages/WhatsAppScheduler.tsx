import React, { useState } from 'react';
import { Card, Title, Text, Subtitle } from '@tremor/react';
import { Button, Select, SelectItem, TextInput, Textarea } from '@tremor/react';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Calendar, Clock, Phone, Send, User } from 'lucide-react';
import { formatPhoneNumber } from '@/services/whatsappBotService';

interface FormData {
  recipientPhone: string;
  recipientName: string;
  messageType: string;
  messageContent: string;
  scheduledDate: string;
  scheduledTime: string;
}

const INITIAL_FORM_DATA: FormData = {
  recipientPhone: '',
  recipientName: '',
  messageType: 'custom',
  messageContent: '',
  scheduledDate: format(new Date(), 'yyyy-MM-dd'),
  scheduledTime: format(new Date(new Date().getTime() + 30 * 60000), 'HH:mm') // 30 minutos no futuro
};

// Função simulada para agendamento de mensagens
const simulateScheduleMessage = async (
  phone: string,
  type: string,
  dateTime: Date,
  options?: { recipientName?: string, messageContent?: string }
): Promise<string> => {
  // Simula um atraso de rede
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Gera um ID único baseado no timestamp
  const messageId = `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  console.log('Mensagem agendada (simulação):', {
    id: messageId,
    phone,
    type,
    dateTime,
    options
  });
  
  return messageId;
}

const WhatsAppScheduler: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [submitting, setSubmitting] = useState(false);

  const messageTypes = [
    { value: 'welcome', label: 'Boas-vindas' },
    { value: 'devotional', label: 'Devocional' },
    { value: 'event', label: 'Evento' },
    { value: 'birthday', label: 'Aniversário' },
    { value: 'reminder', label: 'Lembrete' },
    { value: 'announcement', label: 'Anúncio' },
    { value: 'custom', label: 'Personalizada' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Formata o número para o padrão internacional
    const formattedPhone = formatPhoneNumber(value) || value;
    setFormData(prev => ({ ...prev, recipientPhone: formattedPhone }));
  };

  const validateForm = (): boolean => {
    if (!formData.recipientPhone) {
      toast.error('O número de telefone é obrigatório');
      return false;
    }

    if (!formData.messageType) {
      toast.error('Selecione um tipo de mensagem');
      return false;
    }

    if (formData.messageType === 'custom' && !formData.messageContent) {
      toast.error('Conteúdo da mensagem é obrigatório para mensagens personalizadas');
      return false;
    }

    if (!formData.scheduledDate || !formData.scheduledTime) {
      toast.error('Data e hora de agendamento são obrigatórias');
      return false;
    }

    // Verifica se a data/hora escolhida está no futuro
    const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
    if (scheduledDateTime <= new Date()) {
      toast.error('A data e hora de agendamento devem estar no futuro');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      
      // Cria objeto de data para o agendamento
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
      
      // Agenda a mensagem (simulação)
      const messageId = await simulateScheduleMessage(
        formData.recipientPhone,
        formData.messageType,
        scheduledDateTime,
        {
          recipientName: formData.recipientName,
          messageContent: formData.messageContent,
        }
      );

      if (messageId) {
        toast.success('Mensagem agendada com sucesso! (Simulação)');
        // Reseta o formulário
        setFormData(INITIAL_FORM_DATA);
      } else {
        toast.error('Erro ao agendar mensagem');
      }
    } catch (error) {
      console.error('Erro ao agendar mensagem:', error);
      toast.error('Ocorreu um erro ao agendar a mensagem');
    } finally {
      setSubmitting(false);
    }
  };

  const getMessagePlaceholder = (): string => {
    switch (formData.messageType) {
      case 'welcome':
        return 'Mensagem de boas-vindas para o novo usuário';
      case 'devotional':
        return 'Conteúdo da mensagem devocional diária';
      case 'event':
        return 'Detalhes sobre o evento que está sendo anunciado';
      case 'birthday':
        return 'Mensagem de felicitações pelo aniversário';
      case 'reminder':
        return 'Informações sobre o que você está lembrando';
      case 'announcement':
        return 'Conteúdo do anúncio importante';
      case 'custom':
      default:
        return 'Digite aqui sua mensagem personalizada...';
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Title className="mb-2">Agendador de Mensagens WhatsApp</Title>
      <Subtitle className="mb-6">Agende mensagens para serem enviadas automaticamente no horário desejado</Subtitle>

      <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-md mb-4 text-amber-800 dark:text-amber-100 text-sm">
        <p>⚠️ Modo de demonstração: Nenhuma mensagem será realmente agendada ou enviada.</p>
      </div>

      <Card className="mb-6 p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <Label htmlFor="recipientPhone" className="mb-2 flex items-center">
                  <Phone className="w-4 h-4 mr-2" /> Número do WhatsApp
                </Label>
                <TextInput
                  id="recipientPhone"
                  name="recipientPhone"
                  placeholder="Ex: 5511999887766"
                  value={formData.recipientPhone}
                  onChange={handlePhoneChange}
                  icon={Phone}
                />
                <Text className="text-xs text-gray-500 mt-1">
                  Digite o número com código do país (55 para Brasil)
                </Text>
              </div>

              <div className="mb-4">
                <Label htmlFor="recipientName" className="mb-2 flex items-center">
                  <User className="w-4 h-4 mr-2" /> Nome do Destinatário
                </Label>
                <TextInput
                  id="recipientName"
                  name="recipientName"
                  placeholder="Nome da pessoa"
                  value={formData.recipientName}
                  onChange={handleChange}
                  icon={User}
                />
              </div>

              <div className="mb-4">
                <Label htmlFor="messageType" className="mb-2">Tipo de Mensagem</Label>
                <Select
                  id="messageType"
                  name="messageType"
                  value={formData.messageType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, messageType: value }))}
                >
                  {messageTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <div className="mb-4">
                <Label htmlFor="scheduledDate" className="mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" /> Data
                </Label>
                <TextInput
                  id="scheduledDate"
                  name="scheduledDate"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={handleChange}
                  icon={Calendar}
                />
              </div>

              <div className="mb-4">
                <Label htmlFor="scheduledTime" className="mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-2" /> Hora
                </Label>
                <TextInput
                  id="scheduledTime"
                  name="scheduledTime"
                  type="time"
                  value={formData.scheduledTime}
                  onChange={handleChange}
                  icon={Clock}
                />
              </div>

              <div className="mb-4">
                <Label htmlFor="messageContent" className="mb-2">Conteúdo da Mensagem</Label>
                <Textarea
                  id="messageContent"
                  name="messageContent"
                  placeholder={getMessagePlaceholder()}
                  value={formData.messageContent}
                  onChange={handleChange}
                  rows={5}
                />
                <Text className="text-xs text-gray-500 mt-1">
                  {formData.messageType !== 'custom' 
                    ? "Template pré-definido será usado, mas você pode personalizar o conteúdo aqui."
                    : "Digite a mensagem exatamente como deseja que seja enviada."}
                </Text>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button 
              type="submit" 
              size="lg"
              disabled={submitting}
              icon={submitting ? undefined : Send}
              loading={submitting}
            >
              {submitting ? 'Agendando...' : 'Agendar Mensagem'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default WhatsAppScheduler; 