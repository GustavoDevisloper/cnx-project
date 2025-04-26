import React, { useState } from 'react';
import { Card, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Badge, Button } from '@tremor/react';
import { toast } from 'sonner';
import { formatPhoneNumber } from '@/services/whatsappBotService';
import { Trash2, RefreshCw } from 'lucide-react';

interface ScheduledMessage {
  id: string;
  recipient_phone: string;
  recipient_name?: string;
  message_type: string;
  scheduled_time: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
}

const ScheduledMessagesList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Dados simulados para demonstração
  const [messages, setMessages] = useState<ScheduledMessage[]>([
    {
      id: '1',
      recipient_phone: '5511987654321',
      recipient_name: 'João Silva',
      message_type: 'welcome',
      scheduled_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Amanhã
      status: 'pending'
    },
    {
      id: '2',
      recipient_phone: '5511912345678',
      recipient_name: 'Maria Oliveira',
      message_type: 'birthday',
      scheduled_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 dias
      status: 'pending'
    },
    {
      id: '3',
      recipient_phone: '5511955555555',
      recipient_name: 'Pedro Santos',
      message_type: 'reminder',
      scheduled_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hora atrás
      status: 'sent'
    },
    {
      id: '4',
      recipient_phone: '5511944444444',
      recipient_name: 'Ana Lima',
      message_type: 'event',
      scheduled_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
      status: 'failed'
    }
  ]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      // Simulação de refresh
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      toast.success('Lista atualizada com sucesso');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (window.confirm('Tem certeza que deseja cancelar esta mensagem?')) {
      try {
        // Simulação do cancelamento
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Atualiza a lista alterando o status da mensagem para cancelada
        setMessages(messages.map(msg => 
          msg.id === id 
            ? { ...msg, status: 'cancelled' as 'pending' | 'sent' | 'failed' | 'cancelled' } 
            : msg
        ));
          toast.success('Mensagem cancelada com sucesso');
      } catch (error) {
        toast.error('Erro ao cancelar mensagem');
        console.error('Erro ao cancelar mensagem:', error);
      }
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      return 'Data inválida';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge color="yellow">Pendente</Badge>;
      case 'sent':
        return <Badge color="green">Enviada</Badge>;
      case 'failed':
        return <Badge color="red">Falhou</Badge>;
      case 'cancelled':
        return <Badge color="gray">Cancelada</Badge>;
      default:
        return <Badge color="gray">Desconhecido</Badge>;
    }
  };

  const getMessageTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'devotional': 'Devocional',
      'event': 'Evento',
      'welcome': 'Boas-vindas',
      'birthday': 'Aniversário',
      'reminder': 'Lembrete',
      'announcement': 'Anúncio',
      'custom': 'Personalizada'
    };
    
    return types[type] || type;
  };

  // Função para formatar o telefone para exibição
  const formatPhoneDisplay = (phone: string) => {
    const formatted = formatPhoneNumber(phone);
    if (!formatted) return phone;
    
    // Se começar com 55 (Brasil), formata como (XX) XXXXX-XXXX
    if (formatted.startsWith('55') && formatted.length >= 12) {
      const ddd = formatted.substring(2, 4);
      const firstPart = formatted.substring(4, 9);
      const secondPart = formatted.substring(9);
      return `(${ddd}) ${firstPart}-${secondPart}`;
    }
    
    return phone;
  };

  return (
    <Card className="mt-4">
      <div className="flex justify-between items-center mb-4">
        <Text className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
          Mensagens Agendadas (Simulação)
        </Text>
        <Button
          size="xs"
          variant="secondary"
          icon={RefreshCw}
          onClick={handleRefresh}
          loading={refreshing}
        >
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="py-8 text-center">
          <Text>Carregando mensagens agendadas...</Text>
        </div>
      ) : messages.length === 0 ? (
        <div className="py-8 text-center">
          <Text>Nenhuma mensagem agendada encontrada</Text>
        </div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Destinatário</TableHeaderCell>
              <TableHeaderCell>Tipo</TableHeaderCell>
              <TableHeaderCell>Agendamento</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Ações</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {messages.map((message) => (
              <TableRow key={message.id}>
                <TableCell>
                  <div>
                    <Text className="font-medium">
                      {message.recipient_name || 'Sem nome'}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {formatPhoneDisplay(message.recipient_phone)}
                    </Text>
                  </div>
                </TableCell>
                <TableCell>
                  {getMessageTypeLabel(message.message_type)}
                </TableCell>
                <TableCell>
                  {formatDateTime(message.scheduled_time)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(message.status)}
                </TableCell>
                <TableCell>
                  {message.status === 'pending' && (
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      icon={Trash2}
                      onClick={() => handleCancel(message.id)}
                    >
                      Cancelar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
};

export default ScheduledMessagesList; 