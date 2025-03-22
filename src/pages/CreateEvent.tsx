import React from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { createEvent } from '@/services/eventService';
import { useAuth } from '@/hooks/auth';
import { toast } from '@/components/ui/use-toast';
import { EventsDatabaseFix } from '@/components/EventsDatabaseFix';

const eventFormSchema = z.object({
  title: z.string().min(5, {
    message: 'O título deve ter pelo menos 5 caracteres',
  }),
  description: z.string().min(10, {
    message: 'A descrição deve ter pelo menos 10 caracteres',
  }),
  date: z.date({
    required_error: 'A data do evento é obrigatória',
  }),
  end_date: z.date().optional(),
  location: z.string().min(5, {
    message: 'O local deve ter pelo menos 5 caracteres',
  }),
  status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled'], {
    required_error: 'Por favor selecione o status do evento',
  }),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

const CreateEvent: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [databaseError, setDatabaseError] = React.useState<{code?: string, message?: string} | null>(null);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      description: '',
      date: new Date(),
      location: '',
      status: 'upcoming',
    },
  });

  const onSubmit = async (data: EventFormValues) => {
    try {
      if (!user) {
        toast({
          title: 'Não autenticado',
          description: 'Você precisa estar logado para criar um evento',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }
      
      setIsSubmitting(true);
      setDatabaseError(null);
      
      const eventData = {
        title: data.title,
        description: data.description,
        date: data.date.toISOString(),
        end_date: data.end_date ? data.end_date.toISOString() : undefined,
        location: data.location,
        status: data.status,
      };
      
      const createdEvent = await createEvent(eventData);
      
      if (!createdEvent) {
        throw new Error('Falha ao criar evento');
      }
      
      toast({
        title: 'Evento criado com sucesso!',
        description: 'O evento foi criado e está disponível para todos.',
      });
      
      navigate(`/events/${createdEvent.id}`);
    } catch (error: any) {
      console.error('Erro ao criar evento:', error);
      
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
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao criar evento',
          description: error.message || 'Ocorreu um erro ao tentar criar o evento. Tente novamente.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Criar Novo Evento</h1>
      </div>
      
      {databaseError && (
        <EventsDatabaseFix 
          errorCode={databaseError.code} 
          errorMessage={databaseError.message} 
        />
      )}
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Detalhes do Evento</CardTitle>
          <CardDescription>
            Preencha todos os campos para criar um novo evento para a comunidade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do evento" {...field} />
                    </FormControl>
                    <FormDescription>
                      Um título curto e descritivo para o evento.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrição detalhada do evento"
                        className="h-32 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Forneça detalhes importantes sobre o evento.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data e Hora</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: ptBR })
                              ) : (
                                <span>Selecione a data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        A data de início do evento.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local</FormLabel>
                      <FormControl>
                        <Input placeholder="Local do evento" {...field} />
                      </FormControl>
                      <FormDescription>
                        Onde o evento será realizado.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status do evento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="upcoming">Em breve</SelectItem>
                        <SelectItem value="ongoing">Em andamento</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      O status atual do evento.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={() => navigate('/events')}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Criando...' : 'Criar Evento'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateEvent; 