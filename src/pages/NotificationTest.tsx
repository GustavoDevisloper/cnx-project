import React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info, 
  Bell 
} from 'lucide-react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  onlineToast,
  loadingToast
} from '@/components/ui/toast-icons';

const NotificationTest = () => {
  const showSuccessToast = () => {
    toast.success(
      "Operação realizada com sucesso", 
      "Sua solicitação foi processada corretamente."
    );
  };

  const showErrorToast = () => {
    toast.error(
      "Erro ao processar solicitação", 
      "Houve um problema ao processar sua solicitação. Por favor, tente novamente."
    );
  };

  const showWarningToast = () => {
    toast.warning(
      "Atenção", 
      "Esta ação pode causar mudanças permanentes nos seus dados."
    );
  };

  const showInfoToast = () => {
    toast.info(
      "Lembrete", 
      "Você tem uma reunião agendada para amanhã às 14h."
    );
  };

  const showCustomToast = () => {
    toast({
      title: "Notificação personalizada",
      description: "Esta é uma notificação personalizada com ícone e botão de ação.",
      icon: <Bell className="h-5 w-5 text-blue-500" />,
      variant: "info",
      duration: 10000,
      action: {
        label: "Ver detalhes",
        onClick: () => alert("Ação executada!")
      }
    });
  };

  const showWithIcon = () => {
    toast({
      title: "Nova mensagem",
      description: "Você recebeu uma nova mensagem do sistema.",
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      variant: "success"
    });
  };
  
  const showOnlineToast = () => {
    onlineToast(
      "Conexão restaurada",
      "Sua conexão com a internet foi restabelecida."
    );
  };
  
  const showLoadingToast = () => {
    loadingToast(
      "Processando solicitação...",
      "Aguarde enquanto processamos sua solicitação"
    );
  };

  return (
    <div className="container py-10">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Teste de Notificações</CardTitle>
          <CardDescription>
            Clique nos botões abaixo para testar os diferentes tipos de notificações pop-up
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="text-lg font-medium">Notificações Básicas</h3>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={showSuccessToast}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Sucesso
                </Button>
                
                <Button 
                  onClick={showErrorToast}
                  variant="destructive"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Erro
                </Button>
                
                <Button 
                  onClick={showWarningToast}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Aviso
                </Button>
                
                <Button 
                  onClick={showInfoToast}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Info className="mr-2 h-4 w-4" />
                  Informação
                </Button>
              </div>
            </div>
            
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="text-lg font-medium">Notificações Avançadas</h3>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={showCustomToast}
                  variant="outline"
                  className="border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Personalizada com Ação
                </Button>
                
                <Button 
                  onClick={showWithIcon}
                  variant="outline"
                  className="border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Com Ícone
                </Button>
                
                <Button 
                  onClick={showLoadingToast}
                  variant="outline"
                >
                  Carregamento
                </Button>
                
                <Button 
                  onClick={showOnlineToast}
                  variant="outline"
                  className="border-green-500 text-green-500"
                >
                  Conexão Restaurada
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            As notificações agora aparecem como pop-ups mais visíveis
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default NotificationTest; 