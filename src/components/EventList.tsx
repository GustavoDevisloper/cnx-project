import { useState, useEffect } from "react";
import { EventCard } from "@/components/EventCard";
import { getEvents } from "@/services/eventService";
import { Event } from "@/types/event";
import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await getEvents({ 
        upcoming: true,
        status: 'published'
      });
      setEvents(data);
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-6 text-muted-foreground">
            <Calendar size={48} className="mx-auto mb-2 opacity-30" />
            <p>Carregando eventos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-6 text-muted-foreground">
            <Calendar size={48} className="mx-auto mb-2 opacity-30" />
            <p>Nenhum evento programado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
} 