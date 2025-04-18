import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuFooter 
} from "@/components/ui/dropdown-menu";
import { 
  Bell, 
  Check, 
  Trash2, 
  X,
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
import { Card } from "@/components/ui/card";

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

  // Manipulador para quando o menu é aberto
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    // Marcar como lidas quando o menu é aberto
    if (open && unreadCount > 0) {
      markAllNotificationsAsRead();
    }
  };

  // Manipulador para marcar uma notificação como lida
  const handleMarkAsRead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    markNotificationAsRead(id);
  };

  // Obter o ícone correto para o tipo de notificação
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  // Obter a classe de cor para o tipo de notificação
  const getNotificationColorClass = (type: NotificationType, isRead: boolean) => {
    const baseClass = isRead ? 'opacity-60 ' : '';
    
    switch (type) {
      case 'success':
        return `${baseClass}bg-green-50 dark:bg-green-950 border-l-4 border-green-500`;
      case 'error':
        return `${baseClass}bg-red-50 dark:bg-red-950 border-l-4 border-red-500`;
      case 'warning':
        return `${baseClass}bg-yellow-50 dark:bg-yellow-950 border-l-4 border-yellow-500`;
      case 'info':
      default:
        return `${baseClass}bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-500`;
    }
  };

  // Componente para renderizar uma notificação individual
  const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => (
    <div 
      className={`p-2 mb-2 rounded ${getNotificationColorClass(notification.type, notification.read)}`}
      onClick={() => markNotificationAsRead(notification.id)}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-2">
          <div className="mt-0.5">
            {getNotificationIcon(notification.type)}
          </div>
          <div>
            <div className="font-medium text-sm">{notification.title}</div>
            <div className="text-xs text-muted-foreground">{notification.message}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(notification.timestamp, { addSuffix: true, locale: ptBR })}
            </div>
          </div>
        </div>
        {!notification.read && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => handleMarkAsRead(e, notification.id)}
          >
            <Check className="h-3 w-3" />
            <span className="sr-only">Marcar como lida</span>
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] text-xs flex items-center justify-center">
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notificações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between">
          <span>Notificações</span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={markAllNotificationsAsRead}
              disabled={notifications.length === 0}
            >
              <Check className="h-3 w-3 mr-1" />
              <span className="text-xs">Marcar todas como lidas</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={clearNotificationsHistory}
              disabled={notifications.length === 0}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              <span className="text-xs">Limpar</span>
            </Button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length > 0 ? (
          <ScrollArea className="h-80">
            <div className="p-2">
              {notifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="py-4 px-2 text-center text-sm text-muted-foreground">
            Nenhuma notificação disponível
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationCenter; 