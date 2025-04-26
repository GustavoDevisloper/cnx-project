import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Bell, 
  Check, 
  Trash2, 
  Info,
  AlertCircle,
  CheckCircle2,
  AlertTriangle 
} from "lucide-react";
import { useNotifications, Notification, NotificationType } from '@/services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// Componente para o centro de notificações
const NotificationCenter: React.FC = () => {
  const { 
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotificationsHistory
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  // Marcar como lidas quando o menu é aberto
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && unreadCount > 0) {
      markAllNotificationsAsRead();
    }
  };

  // Ícones para cada tipo de notificação
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
      case 'error': return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />;
      case 'info': default: return <Info className="h-3.5 w-3.5 text-blue-500" />;
    }
  };

  // Classes de cor simplificadas
  const getBorderClass = (type: NotificationType) => {
    switch (type) {
      case 'success': return 'border-l-green-500';
      case 'error': return 'border-l-red-500';
      case 'warning': return 'border-l-yellow-500';
      case 'info': default: return 'border-l-blue-500';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] text-xs flex items-center justify-center">
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notificações</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex justify-between items-center py-1.5">
          <span className="text-xs font-medium">Notificações</span>
          <div className="flex gap-1">
            {notifications.length > 0 && (
              <>
            <Button
              variant="ghost"
              size="sm"
                  className="h-6 w-6 p-0"
              onClick={markAllNotificationsAsRead}
                  title="Marcar todas como lidas"
            >
                  <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
                  className="h-6 w-6 p-0"
              onClick={clearNotificationsHistory}
                  title="Limpar todas"
            >
                  <Trash2 className="h-3.5 w-3.5" />
            </Button>
              </>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {notifications.length > 0 ? (
          <ScrollArea className="h-72">
            <div className="px-1 py-1">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`mb-1.5 px-2 py-1.5 border-l-2 bg-muted/20 rounded-sm ${getBorderClass(notification.type)} ${notification.read ? 'opacity-60' : ''}`}
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs">{notification.title}</div>
                      <div className="text-xs text-muted-foreground">{notification.message}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(notification.timestamp, { addSuffix: true, locale: ptBR })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="py-3 px-2 text-center text-xs text-muted-foreground">
            Nenhuma notificação disponível
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationCenter; 