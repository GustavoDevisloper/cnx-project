import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createEvent, getEventById, updateEvent, Event } from '@/services/eventService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Calendar, MapPin, Image, Save } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Switch } from '@/components/ui/switch';

export default function EventForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Partial<Event>>({
    title: '',
    description: '',
    date: '',
    end_date: '',
    location: '',
    image_url: '',
    status: 'draft'
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isEditing = !!id;

  useEffect(() => {
    const fetchEvent = async () => {
      if (!isEditing) return;
      
      try {
        setLoading(true);
        const data = await getEventById(id);
        
        if (data) {
          // Formatar datas para o formato esperado pelo input type="datetime-local"
          const formattedData = {
            ...data,
            date: formatDateForInput(data.date),
            end_date: data.end_date ? formatDateForInput(data.end_date) : ''
          };
          setEvent(formattedData);
        }
      } catch (error: any) {
        console.error('Erro ao carregar evento:', error);
        toast({
          title: 'Erro ao carregar evento',
          description: error.message,
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, isEditing]);

  const formatDateForInput = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "yyyy-MM-dd'T'HH:mm");
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEvent(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setEvent(prev => ({ ...prev, status: checked ? 'published' : 'draft' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!event.title || !event.description || !event.date || !event.location) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (isEditing) {
        await updateEvent(id, event);
        toast({
          title: 'Evento atualizado',
          description: 'O evento foi atualizado com sucesso',
        });
      } else {
        // Garantir que os campos obrigatórios estejam presentes
        const newEvent = {
          title: event.title!,
          description: event.description!,
          date: event.date!,
          location: event.location!,
          end_date: event.end_date,
          image_url: event.image_url,
          status: event.status as 'draft' | 'published'
        };
        
        await createEvent(newEvent);
        toast({
          title: 'Evento criado',
          description: 'O evento foi criado com sucesso',
        });
      }
      
      navigate('/admin?tab=overview');
    } catch (error: any) {
      console.error('Erro ao salvar evento:', error);
      toast({
        title: 'Erro ao salvar evento',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-10 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="max-w-3xl mx-auto">
        <Button 
          variant="outline" 
          className="mb-4"
          onClick={() => navigate('/admin?tab=overview')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para eventos
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? 'Editar Evento' : 'Criar Novo Evento'}</CardTitle>
            <CardDescription>
              {isEditing 
                ? 'Atualize as informações do evento existente' 
                : 'Preencha os detalhes para criar um novo evento'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título do evento *</Label>
                <Input
                  id="title"
                  name="title"
                  value={event.title}
                  onChange={handleChange}
                  placeholder="Ex: Culto de Jovens"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={event.description}
                  onChange={handleChange}
                  placeholder="Descreva o evento..."
                  rows={4}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data e hora de início *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="date"
                      name="date"
                      type="datetime-local"
                      value={event.date}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end_date">Data e hora de término</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="end_date"
                      name="end_date"
                      type="datetime-local"
                      value={event.end_date}
                      onChange={handleChange}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Local *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    name="location"
                    value={event.location}
                    onChange={handleChange}
                    placeholder="Ex: Igreja Central"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="image_url">URL da imagem</Label>
                <div className="relative">
                  <Image className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="image_url"
                    name="image_url"
                    value={event.image_url}
                    onChange={handleChange}
                    placeholder="https://exemplo.com/imagem.jpg"
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="status"
                  checked={event.status === 'published'}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="status">
                  {event.status === 'published' ? 'Publicado' : 'Rascunho'}
                </Label>
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                    {isEditing ? 'Atualizando...' : 'Criando...'}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEditing ? 'Atualizar Evento' : 'Criar Evento'}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 