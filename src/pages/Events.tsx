import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUpcomingEvents } from '@/services/eventService';
import { Event } from '@/types/event';
import { CalendarIcon, MapPinIcon, User2Icon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EventsDatabaseFix } from '@/components/EventsDatabaseFix';

interface EventCardProps {
  event: Event;
}

const EventsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [databaseError, setDatabaseError] = useState<{code?: string, message?: string} | null>(null);

  useEffect(() => {
    document.title = "Conexão Jovem | Eventos";
    
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        setDatabaseError(null);
        const upcomingEvents = await getUpcomingEvents();
        setEvents(upcomingEvents);
      } catch (err: any) {
        console.error('Error loading events:', err);
        
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
          setError('Não foi possível carregar os eventos. Tente novamente mais tarde.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Eventos</h1>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Eventos</h1>
      </div>
      
      {databaseError && (
        <EventsDatabaseFix 
          errorCode={databaseError.code} 
          errorMessage={databaseError.message} 
        />
      )}
      
      {error && !databaseError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
          <div className="mt-2">
            <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
          </div>
        </div>
      )}
      
      {!error && events.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium text-gray-600 mb-4">Não há eventos programados no momento</h2>
          <p className="text-gray-500">Fique atento para futuros eventos da comunidade.</p>
        </div>
      ) : !databaseError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsPage;

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const formattedDate = format(new Date(event.date), "dd 'de' MMMM', às' HH:mm", { locale: ptBR });

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
            <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{event.title}</CardTitle>
          <Badge variant="outline" className="bg-primary/10 text-primary">
            {event.status === 'upcoming' ? 'Em breve' : event.status === 'ongoing' ? 'Em andamento' : 'Concluído'}
          </Badge>
                </div>
        <CardDescription className="line-clamp-2">{event.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center text-sm">
            <MapPinIcon className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{event.location}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link to={`/events/${event.id}`} className="w-full">
          <Button variant="default" className="w-full">Ver detalhes</Button>
        </Link>
            </CardFooter>
          </Card>
  );
};
