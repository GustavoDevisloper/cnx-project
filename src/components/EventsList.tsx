import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, Edit, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  getUpcomingEvents, 
  updateEvent,
  Event 
} from '@/services/eventService';
import { toast } from '@/hooks/use-toast';
import { EventsDatabaseFix } from '@/components/EventsDatabaseFix';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function EventsList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [databaseError, setDatabaseError] = useState<{code?: string, message?: string} | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setDatabaseError(null);
      const eventsData = await getUpcomingEvents();
      setEvents(eventsData);
    } catch (error: any) {
      console.error('Erro ao carregar eventos:', error);
      
      // Verificar se é um erro de banco de dados (tabela não encontrada)
      if (error.message?.includes('tabela de eventos') || 
          error.message?.includes('table') ||
          error.code === '404' || 
          error.code === '42883') {
        
        setDatabaseError({
          code: error.code,
          message: error.message
        });
        
        toast({
          title: 'Erro de configuração do banco de dados',
          description: 'O banco de dados precisa ser configurado para usar eventos. Siga as instruções na tela.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Erro ao carregar eventos',
          description: error.message || 'Não foi possível carregar a lista de eventos',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (eventId: string) => {
    navigate(`/events/${eventId}/edit`);
  };

  const handleDelete = async (eventId: string) => {
    try {
      setDeleteLoading(eventId);
      // Marcar o evento como cancelado, em vez de excluí-lo
      await updateEvent(eventId, { status: 'cancelled' });
      
      // Atualizar a lista de eventos (remover o item cancelado)
      setEvents(events.filter(event => event.id !== eventId));
      
      toast({
        title: 'Evento cancelado',
        description: 'O evento foi cancelado com sucesso',
      });
    } catch (error: any) {
      console.error('Erro ao cancelar evento:', error);
      toast({
        title: 'Erro ao cancelar evento',
        description: error.message || 'Não foi possível cancelar o evento',
        variant: 'destructive'
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (databaseError) {
    return <EventsDatabaseFix errorCode={databaseError.code} errorMessage={databaseError.message} />;
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-semibold text-foreground">Nenhum evento encontrado</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Não existem eventos ativos no momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div
          key={event.id}
          className="flex items-start justify-between p-4 border rounded-md"
        >
          <div className="space-y-1">
            <h3 className="font-medium">{event.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {event.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(event.date), "dd 'de' MMMM', às' HH:mm", { locale: ptBR })}
              </span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(event.id)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancelar evento</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja cancelar este evento? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(event.id)}
                    disabled={deleteLoading === event.id}
                  >
                    {deleteLoading === event.id ? 'Cancelando...' : 'Sim, cancelar evento'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
} 