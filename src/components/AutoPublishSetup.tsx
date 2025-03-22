import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { checkAndPublishDailyDevotional } from "@/services/devotionalService";
import { toast } from "@/hooks/use-toast";

export default function AutoPublishSetup() {
  const [autoPublishEnabled, setAutoPublishEnabled] = useState<boolean>(
    localStorage.getItem("autoPublishEnabled") === "true"
  );
  const [publishTime, setPublishTime] = useState<string>(
    localStorage.getItem("autoPublishTime") || "06:00"
  );
  const [nextPublishDate, setNextPublishDate] = useState<string>("");
  
  useEffect(() => {
    // Calcular a próxima data de publicação
    updateNextPublishDate();
    
    // Se habilitado, configurar o intervalo para verificar a publicação automática
    let intervalId: number | null = null;
    
    if (autoPublishEnabled) {
      intervalId = window.setInterval(() => {
        const now = new Date();
        const [hours, minutes] = publishTime.split(":").map(Number);
        
        if (now.getHours() === hours && now.getMinutes() === minutes) {
          handlePublishNow();
        }
      }, 60000); // Verificar a cada minuto
    }
    
    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [autoPublishEnabled, publishTime]);
  
  const updateNextPublishDate = () => {
    const now = new Date();
    const [hours, minutes] = publishTime.split(":").map(Number);
    
    const nextDate = new Date();
    nextDate.setHours(hours, minutes, 0, 0);
    
    // Se a hora já passou hoje, agendar para amanhã
    if (nextDate <= now) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
    
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    setNextPublishDate(nextDate.toLocaleDateString('pt-BR', options));
  };
  
  const handleToggleAutoPublish = (checked: boolean) => {
    setAutoPublishEnabled(checked);
    localStorage.setItem("autoPublishEnabled", checked.toString());
    
    if (checked) {
      toast({
        title: "Publicação automática ativada",
        description: `Próximo devocional será publicado em ${nextPublishDate}`
      });
    } else {
      toast({
        title: "Publicação automática desativada",
        description: "Os devocionais precisarão ser publicados manualmente"
      });
    }
  };
  
  const handleTimeChange = (time: string) => {
    setPublishTime(time);
    localStorage.setItem("autoPublishTime", time);
    updateNextPublishDate();
  };
  
  const handlePublishNow = async () => {
    try {
      toast({
        title: "Publicando devocional...",
        description: "Aguarde enquanto geramos o devocional de hoje"
      });
      
      await checkAndPublishDailyDevotional();
      
      toast({
        title: "Devocional publicado",
        description: "O devocional do dia foi publicado com sucesso!"
      });
    } catch (error) {
      console.error("Erro ao publicar devocional:", error);
      toast({
        title: "Erro ao publicar",
        description: "Não foi possível publicar o devocional automaticamente",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          Publicação Automática
        </CardTitle>
        <CardDescription>
          Configure a publicação automática diária de devocionais
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-publish">Ativar publicação automática</Label>
            <p className="text-sm text-muted-foreground">
              Um novo devocional será publicado diariamente no horário definido
            </p>
          </div>
          <Switch 
            id="auto-publish"
            checked={autoPublishEnabled}
            onCheckedChange={handleToggleAutoPublish}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="publish-time">Horário de publicação</Label>
          <Select value={publishTime} onValueChange={handleTimeChange}>
            <SelectTrigger id="publish-time" className="w-full">
              <SelectValue placeholder="Selecione o horário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="00:00">00:00</SelectItem>
              <SelectItem value="03:00">03:00</SelectItem>
              <SelectItem value="06:00">06:00</SelectItem>
              <SelectItem value="09:00">09:00</SelectItem>
              <SelectItem value="12:00">12:00</SelectItem>
              <SelectItem value="15:00">15:00</SelectItem>
              <SelectItem value="18:00">18:00</SelectItem>
              <SelectItem value="21:00">21:00</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {autoPublishEnabled && (
          <div className="rounded-md bg-muted p-4">
            <div className="flex items-start">
              <Calendar className="mt-0.5 mr-3 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Próxima publicação:</p>
                <p className="text-sm text-muted-foreground">{nextPublishDate}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button onClick={handlePublishNow}>
          Publicar agora
        </Button>
      </CardFooter>
    </Card>
  );
} 