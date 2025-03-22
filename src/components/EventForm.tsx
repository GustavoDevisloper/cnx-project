import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { isAuthenticated } from "@/utils/auth";
import { createEvent, getEventById, updateEvent } from "@/services/eventService";
import { Event } from "@/types/event";
import { format, parseISO } from "date-fns";

export default function EventForm() {
  const { id } = useParams<{ id?: string }>();
  const [event, setEvent] = useState({
    title: "",
    description: "",
    date: "",
    end_date: "",
    location: "",
    image_url: "",
    status: "draft" as const
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(id !== "new");
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is authenticated before fetching
    const checkAuthAndFetch = async () => {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        navigate('/login');
        return;
      }
      
      if (id && id !== 'new') {
        await fetchEvent();
      } else {
        setIsLoading(false);
      }
    };
    
    checkAuthAndFetch();
  }, [id, navigate]);
  
  const fetchEvent = async () => {
    if (!id || id === 'new') return;
    
    try {
      setIsLoading(true);
      const eventData = await getEventById(id);
      
      if (eventData) {
        setEvent({
          title: eventData.title || "",
          description: eventData.description || "",
          date: formatDateForInput(eventData.date) || "",
          end_date: eventData.end_date ? formatDateForInput(eventData.end_date) : "",
          location: eventData.location || "",
          image_url: eventData.image_url || "",
          status: eventData.status || "draft"
        });
      }
    } catch (error: any) {
      console.error("Erro ao carregar evento:", error);
      toast({
        title: "Erro ao carregar evento",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função auxiliar para formatar datas no formato aceito pelo input datetime-local
  const formatDateForInput = (dateString: string) => {
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
      return format(date, "yyyy-MM-dd'T'HH:mm");
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "";
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para criar ou editar eventos",
        variant: "destructive"
      });
      navigate("/login");
      return;
    }
    
    if (!event.title || !event.date || !event.location) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (id && id !== 'new') {
        await updateEvent(id, event);
        toast({
          title: "Evento atualizado",
          description: "O evento foi atualizado com sucesso"
        });
      } else {
        await createEvent(event);
        toast({
          title: "Evento criado",
          description: "O evento foi criado com sucesso"
        });
      }
      
      navigate("/events");
    } catch (error: any) {
      console.error("Erro ao salvar evento:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{id === "new" ? "Criar Novo Evento" : "Editar Evento"}</CardTitle>
        <CardDescription>
          {id === "new" 
            ? "Preencha os detalhes do evento para publicá-lo"
            : "Atualize os detalhes do evento"
          }
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Título do Evento
            </label>
            <Input
              id="title"
              name="title"
              placeholder="Digite o título do evento"
              defaultValue={event.title}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Descrição
            </label>
            <Textarea
              id="description"
              name="description"
              placeholder="Descreva o evento"
              defaultValue={event.description}
              required
              rows={4}
            />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium">
                Data e Hora
              </label>
              <Input
                id="date"
                name="date"
                type="datetime-local"
                defaultValue={event.date}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="end_date" className="text-sm font-medium">
                Data e Hora de Término
              </label>
              <Input
                id="end_date"
                name="end_date"
                type="datetime-local"
                defaultValue={event.end_date}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="location" className="text-sm font-medium">
              Local
            </label>
            <Input
              id="location"
              name="location"
              placeholder="Digite o local do evento"
              defaultValue={event.location}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="image_url" className="text-sm font-medium">
              URL da Imagem (opcional)
            </label>
            <Input
              id="image_url"
              name="image_url"
              placeholder="Cole a URL da imagem do evento"
              type="url"
              defaultValue={event.image_url}
            />
          </div>
        </CardContent>
        
        <CardFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting 
              ? (id === "new" ? "Criando..." : "Salvando...") 
              : (id === "new" ? "Criar Evento" : "Salvar Alterações")
            }
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 