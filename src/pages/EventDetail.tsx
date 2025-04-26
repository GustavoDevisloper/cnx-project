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
import { getMessagesByEvent, sendMessage, subscribeToEventMessages } from '@/services/eventMessageService';
import { EventWithAttendees, EventMessage, EventMessageFormInput } from '@/types/event';

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
  User
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
import { toast } from '@/hooks/use-toast';
import { EventChat } from '@/components/EventChat';

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [event, setEvent] = useState<EventWithAttendees | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [attendanceStatus, setAttendanceStatus] = useState<string | null>(null);
  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const [messages, setMessages] = useState<EventMessage[]>([]);
  
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
          }
        }
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
        // Verificar se a mensagem já existe antes de adicionar
        setMessages(prevMessages => {
          const messageExists = prevMessages.some(m => m.id === message.id);
          if (messageExists) {
            return prevMessages;
          }
          return [...prevMessages, message];
        });
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
        setError('Ocorreu um erro ao confirmar presença');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAttendance = async () => {
    if (!user || !isAuthenticated || !id) return;
    
    try {
      setSubmitting(true);
      await cancelAttendance(id);
      
      // Reset attendance status
      setAttendanceStatus(null);
      setAttendanceId(null);
      
      // Reload event to update attendees list
      const updatedEvent = await getEventById(id);
      if (updatedEvent) {
        setEvent(updatedEvent);
      }
    } catch (err) {
      console.error('Error cancelling attendance:', err);
      setError('Ocorreu um erro ao cancelar presença');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!user || !isAuthenticated || !id || !attendanceId) return;
    
    try {
      const message: EventMessageFormInput = {
        event_id: id,
        attendance_id: attendanceId,
        content
      };
      
      await sendMessage(message);
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        title: 'Erro ao enviar mensagem',
        description: 'Não foi possível enviar a mensagem. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'HH:mm', { locale: ptBR });
  };

  // Função auxiliar para extrair iniciais do nome
  const getInitials = (name?: string): string => {
    if (!name) return '?';
    
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
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
  const formattedDate = formatDate(event.date);
  const formattedTime = formatTime(event.date);

  return (
    <div className="container py-8">
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
      <Tabs defaultValue="details" className="mt-6">
        <TabsList className="grid grid-cols-2 lg:grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
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
                        {attendance.user?.avatar_url ? (
                          <AvatarImage 
                            src={attendance.user.avatar_url} 
                            alt={attendance.user?.name || 'Usuário'} 
                          />
                        ) : (
                          <AvatarFallback>
                            {attendance.user?.name ? getInitials(attendance.user.name) : <User className="h-4 w-4" />}
                          </AvatarFallback>
                        )}
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
        
        <TabsContent value="chat">
          {isAuthenticated ? (
            attendanceStatus === 'confirmed' ? (
              <EventChat 
                messages={messages} 
                onSendMessage={handleSendMessage}
                currentUserId={user?.id || ''} 
              />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-6 text-muted-foreground">
                    <p>Confirme sua presença para participar do chat</p>
                  </div>
                </CardContent>
              </Card>
            )
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-6 text-muted-foreground">
                  <p>Faça login para participar do chat</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventDetailPage;
