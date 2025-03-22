import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/auth';
import { syncCurrentUser } from '@/services/userRegistrationService';
import { 
  confirmAttendance, 
  cancelAttendance, 
  getEventById, 
  getAttendanceForUser
} from '@/services/eventService';
import { getItemsByAttendance, addItem, getEventItemsWithUserInfo } from '@/services/eventItemService';
import { getMessagesByEvent, sendMessage, subscribeToEventMessages } from '@/services/eventMessageService';
import { EventWithAttendees, EventItem, EventMessage, EventItemFormInput, EventMessageFormInput, EventItemSummary } from '@/types/event';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CalendarIcon, 
  MapPinIcon, 
  UsersIcon, 
  ClockIcon,
  CheckIcon,
  XIcon,
  SendIcon,
  PlusIcon
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EventsDatabaseFix } from '@/components/EventsDatabaseFix';
import { EventItemsList } from '@/components/EventItemsList';
import { toast } from '@/hooks/use-toast';

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [event, setEvent] = useState<EventWithAttendees | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [attendanceStatus, setAttendanceStatus] = useState<string | null>(null);
  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const [items, setItems] = useState<EventItem[]>([]);
  const [allEventItems, setAllEventItems] = useState<EventItemSummary[]>([]);
  const [messages, setMessages] = useState<EventMessage[]>([]);
  
  const [newItem, setNewItem] = useState<EventItemFormInput>({ name: '', quantity: 1 });
  const [newMessage, setNewMessage] = useState<EventMessageFormInput>({ content: '' });
  
  const [submitting, setSubmitting] = useState(false);
  const [databaseError, setDatabaseError] = useState<{code?: string, message?: string} | null>(null);

  // Função para carregar dados do evento
  const loadEventData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setDatabaseError(null);
      const eventData = await getEventById(id);
      
      if (!eventData) {
        setError('Evento não encontrado');
        return;
      }
      
      setEvent(eventData);
      
      // If user is logged in, check their attendance
      if (user && isAuthenticated) {
        const status = await getAttendanceForUser(id, user.id);
        setAttendanceStatus(status);
        
        // Find attendance ID if user is attending
        if (status) {
          const attendance = eventData.attendees.find(a => a.userId === user.id);
          if (attendance) {
            setAttendanceId(attendance.id);
            
            // Load items if confirmed
            if (status === 'confirmed') {
              try {
                const itemsData = await getItemsByAttendance(attendance.id);
                setItems(itemsData);
              } catch (err) {
                console.error('Error loading items:', err);
                // Continue even with errors
              }
            }
          }
        }
      }
      
      // Carregar todos os itens do evento para todos os usuários
      try {
        const allItems = await getEventItemsWithUserInfo(id);
        setAllEventItems(allItems);
      } catch (err) {
        console.error('Error loading all event items:', err);
        // Continue even with errors
      }
      
      // Load messages
      try {
        const messagesData = await getMessagesByEvent(id);
        setMessages(messagesData);
      } catch (err) {
        console.error('Error loading messages:', err);
        // Continue even with errors
      }
    } catch (err: any) {
      console.error('Error loading event:', err);
      
      // Verificar se é um erro de banco de dados (tabela não encontrada)
      if (err.message?.includes('tabela de eventos') || 
          err.message?.includes('table') ||
          err.code === '404' || 
          err.code === '42883') {
        
        setDatabaseError({
          code: err.code,
          message: err.message
        });
        
        setError('Erro de configuração do banco de dados. Siga as instruções abaixo.');
      } else {
        setError('Ocorreu um erro ao carregar o evento');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventData();
    
    // Subscribe to new messages if id exists
    let subscription: { unsubscribe: () => void } | null = null;
    
    if (id) {
      subscription = subscribeToEventMessages(id, (message) => {
        setMessages(prevMessages => [...prevMessages, message]);
      });
    }
    
    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id, isAuthenticated]);

  const handleConfirmAttendance = async () => {
    if (!user || !isAuthenticated || !id) return;
    
    try {
      setSubmitting(true);
      await confirmAttendance(id, 'confirmed');
      setAttendanceStatus('confirmed');
      
      // Reload event to update attendees list
      const updatedEvent = await getEventById(id);
      if (updatedEvent) {
        setEvent(updatedEvent);
        
        // Find attendance ID
        const attendance = updatedEvent.attendees.find(a => a.userId === user.id);
        if (attendance) {
          setAttendanceId(attendance.id);
        }
      }
    } catch (err: any) {
      console.error('Error confirming attendance:', err);
      
      // Verificar se é um erro de chave estrangeira
      if (err.code === '23503' && err.message?.includes('foreign key constraint')) {
        setError(
          'Erro de sincronização de usuário. Por favor, vá até a página principal, faça logout e login novamente. ' +
          'Se o problema persistir, entre em contato com o administrador.'
        );
      } else {
        setError('Ocorreu um erro ao confirmar presença. Tente novamente mais tarde.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAttendance = async () => {
    if (!user || !isAuthenticated || !id) return;
    
    try {
      setSubmitting(true);
      await cancelAttendance(id, user.id);
      setAttendanceStatus(null);
      setAttendanceId(null);
      setItems([]);
      
      // Reload event to update attendees list
      const updatedEvent = await getEventById(id);
      if (updatedEvent) {
        setEvent(updatedEvent);
      }
    } catch (err) {
      console.error('Error canceling attendance:', err);
      setError('Ocorreu um erro ao cancelar presença');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendanceId || !newItem.name) return;
    
    try {
      setSubmitting(true);
      const createdItem = await addItem(attendanceId, newItem);
      setItems(prevItems => [...prevItems, createdItem]);
      setNewItem({ name: '', quantity: 1 });
    } catch (err) {
      console.error('Error adding item:', err);
      setError('Ocorreu um erro ao adicionar item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAuthenticated || !id || !newMessage.content.trim()) return;
    
    try {
      setSubmitting(true);
      await sendMessage(id, user.id, newMessage);
      setNewMessage({ content: '' });
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Ocorreu um erro ao enviar mensagem');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (databaseError) {
    return (
      <EventsDatabaseFix 
        errorCode={databaseError.code} 
        errorMessage={databaseError.message} 
      />
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Erro</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          
          {error.includes('sincronização de usuário') && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">
                Podemos tentar sincronizar seu perfil automaticamente:
              </p>
              <Button 
                variant="default"
                onClick={async () => {
                  try {
                    const success = await syncCurrentUser();
                    if (success) {
                      setError(null);
                      toast({
                        title: "Perfil sincronizado",
                        description: "Seu perfil foi sincronizado com sucesso!",
                        variant: "default"
                      });
                      // Tentar carregar o evento novamente
                      loadEventData();
                    } else {
                      toast({
                        title: "Erro na sincronização",
                        description: "Não foi possível sincronizar seu perfil automaticamente. Por favor, tente as outras opções sugeridas.",
                        variant: "destructive"
                      });
                    }
                  } catch (err) {
                    console.error('Erro na sincronização automática:', err);
                    toast({
                      title: "Erro na sincronização",
                      description: "Ocorreu um erro ao tentar sincronizar seu perfil.",
                      variant: "destructive"
                    });
                  }
                }}
                className="mr-2"
              >
                Tentar Sincronização Automática
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setError(null)}
              >
                Tentar Novamente
              </Button>
            </div>
          )}
          
          {!error.includes('sincronização de usuário') && (
            <Button onClick={() => setError(null)}>
              Tentar Novamente
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error || 'Evento não encontrado'}
        </div>
        <Button onClick={() => navigate('/events')}>Voltar para Eventos</Button>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const formattedDate = format(eventDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const formattedTime = format(eventDate, "HH:mm", { locale: ptBR });

  return (
    <div className="container mx-auto py-8">
      <Button variant="outline" className="mb-6" onClick={() => navigate('/events')}>
        Voltar para Eventos
      </Button>
      
      {/* Event Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-3xl font-bold">{event.title}</h1>
          <Badge className="ml-2" variant={
            event.status === 'upcoming' ? 'outline' : 
            event.status === 'ongoing' ? 'default' : 
            'secondary'
          }>
            {event.status === 'upcoming' ? 'Em breve' : 
             event.status === 'ongoing' ? 'Em andamento' : 
             event.status === 'completed' ? 'Concluído' : 'Cancelado'}
          </Badge>
        </div>
        
        <p className="text-muted-foreground mb-4">{event.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center">
                  <CalendarIcon className="mr-3 h-5 w-5 text-muted-foreground" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="mr-3 h-5 w-5 text-muted-foreground" />
                  <span>{formattedTime}</span>
                </div>
                <div className="flex items-center">
                  <MapPinIcon className="mr-3 h-5 w-5 text-muted-foreground" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center">
                  <UsersIcon className="mr-3 h-5 w-5 text-muted-foreground" />
                  <span>{event.attendees.length} confirmados</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              {isAuthenticated ? (
                attendanceStatus === 'confirmed' ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-4 text-green-600">
                      <CheckIcon className="h-8 w-8 mr-2" />
                      <p className="text-lg font-medium">Você confirmou presença!</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleCancelAttendance}
                      disabled={submitting}
                    >
                      Cancelar Presença
                    </Button>
                  </div>
                ) : attendanceStatus === 'declined' ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-4 text-red-600">
                      <XIcon className="h-8 w-8 mr-2" />
                      <p className="text-lg font-medium">Você não vai participar</p>
                    </div>
                    <div className="space-x-2">
                      <Button 
                        onClick={() => {
                          confirmAttendance(id!, 'confirmed')
                            .then(() => {
                              setAttendanceStatus('confirmed');
                              loadEventData();
                            })
                            .catch(err => {
                              console.error('Error confirming attendance:', err);
                              
                              // Verificar se é um erro de chave estrangeira
                              if (err.code === '23503' && err.message?.includes('foreign key constraint')) {
                                setError(
                                  'Erro de sincronização de usuário. Por favor, vá até a página principal, faça logout e login novamente. ' +
                                  'Se o problema persistir, entre em contato com o administrador.'
                                );
                              } else {
                                setError('Ocorreu um erro ao confirmar presença. Tente novamente mais tarde.');
                              }
                            });
                        }}
                        variant="default"
                        disabled={submitting}
                      >
                        Vou Participar
                      </Button>
                      <Button 
                        onClick={() => {
                          confirmAttendance(id!, 'maybe')
                            .then(() => {
                              setAttendanceStatus('maybe');
                              loadEventData();
                            })
                            .catch(err => {
                              console.error('Error updating attendance:', err);
                              
                              // Verificar se é um erro de chave estrangeira
                              if (err.code === '23503' && err.message?.includes('foreign key constraint')) {
                                setError(
                                  'Erro de sincronização de usuário. Por favor, vá até a página principal, faça logout e login novamente. ' +
                                  'Se o problema persistir, entre em contato com o administrador.'
                                );
                              } else {
                                setError('Ocorreu um erro ao atualizar presença. Tente novamente mais tarde.');
                              }
                            });
                        }}
                        variant="outline"
                        disabled={submitting}
                      >
                        Talvez
                      </Button>
                    </div>
                  </div>
                ) : attendanceStatus === 'maybe' ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-4 text-yellow-600">
                      <p className="text-lg font-medium">Você talvez participe</p>
                    </div>
                    <div className="space-x-2">
                      <Button 
                        onClick={() => {
                          confirmAttendance(id!, 'confirmed')
                            .then(() => {
                              setAttendanceStatus('confirmed');
                              loadEventData();
                            })
                            .catch(err => {
                              console.error('Error confirming attendance:', err);
                              
                              // Verificar se é um erro de chave estrangeira
                              if (err.code === '23503' && err.message?.includes('foreign key constraint')) {
                                setError(
                                  'Erro de sincronização de usuário. Por favor, vá até a página principal, faça logout e login novamente. ' +
                                  'Se o problema persistir, entre em contato com o administrador.'
                                );
                              } else {
                                setError('Ocorreu um erro ao confirmar presença. Tente novamente mais tarde.');
                              }
                            });
                        }}
                        variant="default"
                        disabled={submitting}
                      >
                        Vou Participar
                      </Button>
                      <Button 
                        onClick={() => {
                          confirmAttendance(id!, 'declined')
                            .then(() => {
                              setAttendanceStatus('declined');
                              loadEventData();
                            })
                            .catch(err => {
                              console.error('Error updating attendance:', err);
                              
                              // Verificar se é um erro de chave estrangeira
                              if (err.code === '23503' && err.message?.includes('foreign key constraint')) {
                                setError(
                                  'Erro de sincronização de usuário. Por favor, vá até a página principal, faça logout e login novamente. ' +
                                  'Se o problema persistir, entre em contato com o administrador.'
                                );
                              } else {
                                setError('Ocorreu um erro ao recusar. Tente novamente mais tarde.');
                              }
                            });
                        }}
                        variant="outline"
                        disabled={submitting}
                      >
                        Não Vou
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="mb-4">Confirme sua presença para este evento:</p>
                    <div className="space-y-2">
                      <Button 
                        onClick={handleConfirmAttendance}
                        disabled={submitting}
                        className="w-full"
                      >
                        Confirmar Presença
                      </Button>
                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => {
                            confirmAttendance(id!, 'maybe')
                              .then(() => {
                                setAttendanceStatus('maybe');
                                loadEventData();
                              })
                              .catch(err => {
                                console.error('Error confirming maybe:', err);
                                
                                // Verificar se é um erro de chave estrangeira
                                if (err.code === '23503' && err.message?.includes('foreign key constraint')) {
                                  setError(
                                    'Erro de sincronização de usuário. Por favor, vá até a página principal, faça logout e login novamente. ' +
                                    'Se o problema persistir, entre em contato com o administrador.'
                                  );
                                } else {
                                  setError('Ocorreu um erro ao confirmar possível presença. Tente novamente mais tarde.');
                                }
                              });
                          }}
                          variant="outline"
                          disabled={submitting}
                          className="flex-1"
                        >
                          Talvez
                        </Button>
                        <Button 
                          onClick={() => {
                            confirmAttendance(id!, 'declined')
                              .then(() => {
                                setAttendanceStatus('declined');
                                loadEventData();
                              })
                              .catch(err => {
                                console.error('Error declining:', err);
                                
                                // Verificar se é um erro de chave estrangeira
                                if (err.code === '23503' && err.message?.includes('foreign key constraint')) {
                                  setError(
                                    'Erro de sincronização de usuário. Por favor, vá até a página principal, faça logout e login novamente. ' +
                                    'Se o problema persistir, entre em contato com o administrador.'
                                  );
                                } else {
                                  setError('Ocorreu um erro ao recusar. Tente novamente mais tarde.');
                                }
                              });
                          }}
                          variant="outline"
                          disabled={submitting}
                          className="flex-1"
                        >
                          Não Vou
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center">
                  <p className="mb-4">Faça login para confirmar sua presença:</p>
                  <Button 
                    onClick={() => navigate('/login', { state: { from: `/events/${id}` } })}
                  >
                    Entrar para Participar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Event Tabs */}
      <Tabs defaultValue="attendees">
        <TabsList className="mb-6">
          <TabsTrigger value="attendees">Participantes</TabsTrigger>
          <TabsTrigger value="items">O que Levar</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>
        
        <TabsContent value="attendees">
          <Card>
            <CardHeader>
              <CardTitle>Participantes Confirmados</CardTitle>
              <CardDescription>
                Total de {event.attendees.length} pessoas confirmaram presença
              </CardDescription>
            </CardHeader>
            <CardContent>
              {event.attendees.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  Ninguém confirmou presença ainda.
                </p>
              ) : (
                <div className="space-y-4">
                  {event.attendees.map((attendance) => (
                    <div key={attendance.id} className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={attendance.user?.avatar_url || ''} />
                        <AvatarFallback>
                          {attendance.user?.name?.substring(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{attendance.user?.name || 'Usuário'}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(attendance.createdAt), "dd/MM/yyyy")}
                        </p>
                      </div>
                      <Badge variant={
                        attendance.status === 'confirmed' ? 'default' :
                        attendance.status === 'maybe' ? 'outline' : 'secondary'
                      }>
                        {attendance.status === 'confirmed' ? 'Confirmado' :
                         attendance.status === 'maybe' ? 'Talvez' : 'Não vai'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle>O que Vamos Levar</CardTitle>
              <CardDescription>
                Lista de itens que os participantes confirmaram que vão levar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EventItemsList items={allEventItems} />
              
              {isAuthenticated && attendanceStatus === 'confirmed' && (
                <>
                  <Separator className="my-6" />
                  
                  <div className="bg-muted/30 p-4 rounded-md mb-4">
                    <h3 className="font-medium mb-2">O que você vai levar?</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Informe o que você pretende levar para o evento
                    </p>
                    
                    <form onSubmit={handleAddItem} className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <Label htmlFor="item-name">Item</Label>
                          <Input 
                            id="item-name"
                            placeholder="Ex: Refrigerante, salgados, etc"
                            value={newItem.name}
                            onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="item-quantity">Quantidade</Label>
                          <Input 
                            id="item-quantity"
                            type="number"
                            min="1"
                            value={newItem.quantity}
                            onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value)})}
                            required
                          />
                        </div>
                      </div>
                      <Button type="submit" disabled={submitting || !newItem.name}>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Adicionar Item
                      </Button>
                    </form>
                  </div>
                  
                  {items.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Seus itens confirmados:</h3>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center p-3 bg-accent/50 rounded-md">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">Quantidade: {item.quantity}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {isAuthenticated && attendanceStatus !== 'confirmed' && (
                <div className="mt-6 p-4 bg-muted/30 rounded-md text-center">
                  <p className="text-muted-foreground">
                    Confirme sua presença para adicionar itens que você irá levar.
                  </p>
                  <Button 
                    onClick={handleConfirmAttendance}
                    className="mt-2"
                    variant="outline"
                  >
                    Confirmar Presença
                  </Button>
                </div>
              )}
              
              {!isAuthenticated && (
                <div className="mt-6 p-4 bg-muted/30 rounded-md text-center">
                  <p className="text-muted-foreground">
                    Faça login para confirmar sua presença e adicionar itens.
                  </p>
                  <Button 
                    onClick={() => navigate('/login', { state: { from: `/events/${id}` } })}
                    className="mt-2"
                    variant="outline"
                  >
                    Entrar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="chat">
          <Card className="h-[500px] flex flex-col">
            <CardHeader>
              <CardTitle>Chat do Evento</CardTitle>
              <CardDescription>
                {isAuthenticated 
                  ? attendanceStatus
                    ? 'Digite sua mensagem...'
                    : 'Confirme sua presença para participar do chat'
                  : 'Faça login para enviar mensagens'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden">
              <ScrollArea className="h-[300px] pr-4">
                {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhuma mensagem ainda. Seja o primeiro a dizer olá!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isCurrentUser = user?.id === message.user_id;
                      return (
                        <div 
                          key={message.id} 
                          className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-start max-w-[80%]`}>
                            <Avatar className={`${isCurrentUser ? 'ml-2' : 'mr-2'} flex-shrink-0`}>
                              <AvatarImage src={message.user?.avatar_url || ''} />
                              <AvatarFallback>
                                {message.user?.name?.substring(0, 2).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div 
                                className={`rounded-lg p-3 ${
                                  isCurrentUser 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted'
                                }`}
                              >
                                <p>{message.content}</p>
                              </div>
                              <div 
                                className={`text-xs text-muted-foreground mt-1 ${
                                  isCurrentUser ? 'text-right' : 'text-left'
                                }`}
                              >
                                {message.user?.name} · {format(new Date(message.created_at), "HH:mm")}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <form onSubmit={handleSendMessage} className="w-full">
                <div className="flex space-x-2">
                  <Textarea 
                    placeholder={
                      isAuthenticated 
                        ? attendanceStatus
                          ? 'Digite sua mensagem...'
                          : 'Confirme sua presença para enviar mensagens'
                        : 'Faça login para enviar mensagens'
                    }
                    value={newMessage.content}
                    onChange={(e) => setNewMessage({content: e.target.value})}
                    className="flex-grow resize-none"
                    disabled={!isAuthenticated || !attendanceStatus}
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={!isAuthenticated || !attendanceStatus || !newMessage.content.trim() || submitting}
                  >
                    <SendIcon className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventDetailPage;
