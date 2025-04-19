import { User } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getWhatsAppLink } from '@/services/whatsappBotService';
import { logger } from '@/lib/utils';

interface WhatsAppContactOptionsProps {
  user: User;
  showTitle?: boolean;
}

export default function WhatsAppContactOptions({ user, showTitle = true }: WhatsAppContactOptionsProps) {
  // Verifica se o usuário tem número de telefone
  const hasPhoneNumber = !!user.phone_number;
  
  const getUserDisplayName = () => {
    return user.display_name || user.displayName || user.first_name || user.username || 'o usuário';
  };
  
  const handleDirectChat = () => {
    if (!hasPhoneNumber) {
      toast({
        title: "Número não disponível",
        description: "Este usuário não cadastrou um número de telefone",
        variant: "destructive"
      });
      return;
    }
    
    logger.log(`Abrindo chat do WhatsApp para ${getUserDisplayName()} (${user.phone_number})`);
    
    const whatsappLink = getWhatsAppLink(user.phone_number);
    if (whatsappLink) {
      window.open(whatsappLink, '_blank');
    } else {
      logger.error(`Erro ao gerar link do WhatsApp para: ${user.phone_number}`);
      toast({
        title: "Erro ao gerar link",
        description: "Não foi possível gerar o link do WhatsApp",
        variant: "destructive"
      });
    }
  };
  
  if (!hasPhoneNumber) {
    return null;
  }
  
  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Contato via WhatsApp
          </CardTitle>
          <CardDescription>
            Entre em contato com {getUserDisplayName()} via WhatsApp
          </CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleDirectChat}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Conversar via WhatsApp
        </Button>
      </CardContent>
    </Card>
  );
} 