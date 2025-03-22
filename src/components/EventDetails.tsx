import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Clock, CalendarDays, Users, ShoppingBag, MessageSquare, Check, X, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Event, EventAttendance, EventMessage, EventItemSummary } from '@/types/event';
import { 
  getEventById, 
  getUserAttendanceStatus, 
  confirmAttendance, 
  getEventAttendances,
  getEventItemsSummary,
  getEventMessages,
  sendEventMessage,
  addEventItem
} from '@/services/eventService';
import { isAuthenticated } from '@/services/authService';
import { toast } from '@/hooks/use-toast';
import { AttendanceList } from '@/components/AttendanceList';
import { EventChat } from '@/components/EventChat';
import { EventItemForm } from '@/components/EventItemForm';
import { EventItemsList } from '@/components/EventItemsList';

interface EventDetailsProps {
  id: string;
}

export function EventDetails({ id }: EventDetailsProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [attendance, setAttendance] = useState<EventAttendance | null>(null);
  const [attendances, setAttendances] = useState<EventAttendance[]>([]);
  const [messages, setMessages] = useState<EventMessage[]>([]);
  const [itemsSummary, setItemsSummary] = useState<EventItemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const navigate = useNavigate();

  // Carregar dados do evento e verificar status de autenticação
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Verificar login
        const authenticated = await isAuthenticated();
        setIsUserLoggedIn(authenticated);
        
        // Carregar evento
        const eventData = await getEventById(id);
        setEvent(eventData);
        
        if (authenticated) {
          // Verificar status de confirmação do usuário
          const userAttendance = await getUserAttendanceStatus(id);
          setAttendance(userAttendance);
          
          // Carregar participantes
          const attendancesList = await getEventAttendances(id);
          setAttendances(attendancesList);
          
          // Carregar resumo de itens
          const itemsSummaryData = await getEventItemsSummary(id);
          setItemsSummary(itemsSummaryData);
          
          // Carregar mensagens
          const messagesData = await getEventMessages(id);
          setMessages(messagesData);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do evento:', error);
        toast({
          title: 'Erro ao carregar evento',
          description: 'Não foi possível carregar os dados do evento',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    
    // Configurar polling para mensagens a cada 10 segundos
    const messageInterval = setInterval(async () => {
      if (activeTab === 'chat' && isUserLoggedIn) {
        try {
          const messagesData = await getEventMessages(id);
          setMessages(messagesData);
        } catch (error) {
          console.error('Erro ao atualizar mensagens:', error);
        }
      }
    }, 10000);
    
    return () => {
      clearInterval(messageInterval);
    };
  }, [id, activeTab]);

  // Confirmar presença
  const handleConfirmAttendance = async (status: 'confirmed' | 'declined' | 'maybe') => {
    if (!isUserLoggedIn) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para confirmar presença',
        variant: 'destructive'
      });
      navigate('/login?redirect=/events/' + id);
      return;
    }
    
    try {
      setConfirmLoading(true);
      const updatedAttendance = await confirmAttendance(id, status);
      setAttendance(updatedAttendance);
      
      // Atualizar lista de participantes
      const attendancesList = await getEventAttendances(id);
      setAttendances(attendancesList);
      
      let statusMessage = 'Presença confirmada com sucesso';
      if (status === 'declined') statusMessage = 'Ausência registrada';
      if (status === 'maybe') statusMessage = 'Sua resposta foi registrada';
      
      toast({
        title: 'Status atualizado',
        description: statusMessage
      });
      
      // Se confirmou, ir para a aba de itens
      if (status === 'confirmed') {
        setActiveTab('items');
      }
    } catch (error) {
      console.error('Erro ao confirmar presença:', error);
      toast({
        title: 'Erro ao confirmar presença',
        description: 'Não foi possível registrar sua presença',
        variant: 'destructive'
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  // Adicionar item
  const handleAddItem = async (itemData: { name: string; quantity: number }) => {
    if (!attendance) return;
    
    try {
      await addEventItem(attendance.id, itemData);
      
      // Atualizar lista de itens
      const itemsSummaryData = await getEventItemsSummary(id);
      setItemsSummary(itemsSummaryData);
      
      // Recarregar status do usuário para obter itens atualizados
      const userAttendance = await getUserAttendanceStatus(id);
      setAttendance(userAttendance);
      
      toast({
        title: 'Item adicionado',
        description: `${itemData.quantity}x ${itemData.name} adicionado à sua lista`
      });
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      toast({
        title: 'Erro ao adicionar item',
        description: 'Não foi possível adicionar este item',
        variant: 'destructive'
      });
    }
  };

  // Enviar mensagem
  const handleSendMessage = async (content: string) => {
    if (!isUserLoggedIn) return;
    
    try {
      const message = await sendEventMessage(id, content);
      if (message) {
        setMessages(prev => [...prev, message]);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: 'Erro ao enviar mensagem',
        description: 'Não foi possível enviar sua mensagem',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-6 text-muted-foreground">
            <p>Evento não encontrado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const eventDate = new Date(event.date);
  const formattedDate = format(eventDate, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
  const formattedEndDate = event.end_date 
    ? format(new Date(event.end_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })
    : null;
  
  const isEventPast = new Date() > eventDate;
  const confirmButtonDisabled = isEventPast || confirmLoading;
  
  const confirmedCount = attendances.filter(a => a.status === 'confirmed').length;
  const maybeCount = attendances.filter(a => a.status === 'maybe').length;

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg p-6">
        <div className="mb-4">
          <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
          <p className="text-muted-foreground mb-4">{event.description}</p>
          
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <CalendarDays size={16} />
              <span>{formattedDate}</span>
              {formattedEndDate && (
                <span> até {formattedEndDate}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <MapPin size={16} />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={16} />
              <span>{confirmedCount} confirmado{confirmedCount !== 1 ? 's' : ''}</span>
              {maybeCount > 0 && (
                <span> (+{maybeCount} talvez)</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Botões de confirmação */}
        {!isEventPast && isUserLoggedIn && (
          <div className="flex flex-wrap gap-2 mt-6">
            <Button 
              onClick={() => handleConfirmAttendance('confirmed')}
              variant={attendance?.status === 'confirmed' ? 'default' : 'outline'}
              className="flex items-center gap-2"
              disabled={confirmButtonDisabled}
            >
              <Check size={16} />
              {attendance?.status === 'confirmed' ? 'Confirmado' : 'Confirmar Presença'}
            </Button>
            
            <Button 
              onClick={() => handleConfirmAttendance('maybe')}
              variant={attendance?.status === 'maybe' ? 'default' : 'outline'}
              className="flex items-center gap-2"
              disabled={confirmButtonDisabled}
            >
              <HelpCircle size={16} />
              {attendance?.status === 'maybe' ? 'Talvez (Confirmado)' : 'Talvez'}
            </Button>
            
            <Button 
              onClick={() => handleConfirmAttendance('declined')}
              variant={attendance?.status === 'declined' ? 'destructive' : 'outline'}
              className="flex items-center gap-2"
              disabled={confirmButtonDisabled}
            >
              <X size={16} />
              {attendance?.status === 'declined' ? 'Não vou (Confirmado)' : 'Não vou'}
            </Button>
          </div>
        )}
        
        {!isUserLoggedIn && (
          <div className="mt-6">
            <Button onClick={() => navigate('/login?redirect=/events/' + id)}>
              Faça login para confirmar presença
            </Button>
          </div>
        )}
        
        {isEventPast && (
          <div className="mt-6 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-3 rounded-md">
            <p>Este evento já ocorreu.</p>
          </div>
        )}
      </div>
      
      {isUserLoggedIn && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Users size={16} />
              <span>Participantes</span>
            </TabsTrigger>
            <TabsTrigger 
              value="items" 
              className="flex items-center gap-2"
              disabled={!attendance || attendance.status !== 'confirmed'}
            >
              <ShoppingBag size={16} />
              <span>Itens</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare size={16} />
              <span>Chat</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            {attendances.length > 0 ? (
              <AttendanceList attendances={attendances} />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-6 text-muted-foreground">
                    <p>Nenhum participante confirmado ainda</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="items">
            {attendance && attendance.status === 'confirmed' ? (
              <div className="space-y-6">
                <EventItemForm 
                  onAddItem={handleAddItem} 
                  existingItems={attendance.items || []} 
                />
                
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">O que todos estão levando</h3>
                  <EventItemsList items={itemsSummary} />
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-6 text-muted-foreground">
                    <p>Confirme sua presença para adicionar itens</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="chat">
            <EventChat 
              messages={messages} 
              onSendMessage={handleSendMessage} 
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 