import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Event } from "@/types/event";

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const formattedDate = format(new Date(event.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
  const formattedEndDate = event.end_date 
    ? format(new Date(event.end_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })
    : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">
            {event.title}
          </CardTitle>
          <Badge variant="outline" className="ml-2">
            {event.status === 'published' ? 'Publicado' : 'Rascunho'}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{formattedDate}</span>
            {formattedEndDate && (
              <span> até {formattedEndDate}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <MapPin size={14} />
            <span>{event.location}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          {event.description}
        </div>
      </CardContent>
    </Card>
  );
} 