import { toast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

// Tipos de notificações
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

// Interface para notificação
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: number;
  read: boolean;
  keepInHistory?: boolean; // Se a notificação deve ser mantida no histórico
}

// Chave para o armazenamento no localStorage
const NOTIFICATIONS_STORAGE_KEY = 'user_notifications';
const MAX_NOTIFICATIONS_HISTORY = 30;

/**
 * Mostra uma notificação para o usuário
 */
export const showNotification = (
  title: string,
  message: string,
  type: NotificationType = 'info',
  keepInHistory: boolean = false
): string => {
  const notificationId = Date.now().toString(36) + Math.random().toString(36).substring(2);
  
  // Mostrar na UI usando o sistema de toast melhorado
  toast({
    title: title,
    description: message,
    variant: type === 'error' ? 'destructive' : type,
    duration: type === 'error' ? 8000 : 5000 // Erros ficam visíveis por mais tempo
  });
  
  // Criar objeto da notificação
  const notification: Notification = {
    id: notificationId,
    title,
    message,
    type,
    timestamp: Date.now(),
    read: false,
    keepInHistory
  };
  
  // Armazenar no histórico de notificações
  if (keepInHistory) {
    storeNotification(notification);
  }
  
  return notificationId;
};

/**
 * Funções de atalho para diferentes tipos de notificações
 */
export const showSuccessNotification = (title: string, message: string, keepInHistory = false): string => 
  showNotification(title, message, 'success', keepInHistory);

export const showErrorNotification = (title: string, message: string, keepInHistory = true): string => 
  showNotification(title, message, 'error', keepInHistory);

export const showWarningNotification = (title: string, message: string, keepInHistory = false): string => 
  showNotification(title, message, 'warning', keepInHistory);

export const showInfoNotification = (title: string, message: string, keepInHistory = false): string => 
  showNotification(title, message, 'info', keepInHistory);

/**
 * Armazena uma notificação no histórico
 */
const storeNotification = (notification: Notification): void => {
  try {
    // Obter notificações existentes
    const existingNotifications = getNotificationsHistory();
    
    // Adicionar nova notificação
    const updatedNotifications = [notification, ...existingNotifications];
    
    // Limitar o número de notificações armazenadas
    const limitedNotifications = updatedNotifications.slice(0, MAX_NOTIFICATIONS_HISTORY);
    
    // Armazenar no localStorage
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(limitedNotifications));
    
    // Disparar evento para atualizar componentes que estejam mostrando notificações
    window.dispatchEvent(new Event('notifications-updated'));
  } catch (error) {
    console.error('Erro ao armazenar notificação:', error);
  }
};

/**
 * Obtém o histórico de notificações
 */
export const getNotificationsHistory = (): Notification[] => {
  try {
    const storedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    return storedNotifications ? JSON.parse(storedNotifications) : [];
  } catch (error) {
    console.error('Erro ao buscar histórico de notificações:', error);
    return [];
  }
};

/**
 * Marcar notificação como lida
 */
export const markNotificationAsRead = (notificationId: string): void => {
  try {
    const notifications = getNotificationsHistory();
    const updatedNotifications = notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read: true } 
        : notification
    );
    
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedNotifications));
    window.dispatchEvent(new Event('notifications-updated'));
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
  }
};

/**
 * Marcar todas as notificações como lidas
 */
export const markAllNotificationsAsRead = (): void => {
  try {
    const notifications = getNotificationsHistory();
    const updatedNotifications = notifications.map(notification => ({ 
      ...notification, 
      read: true 
    }));
    
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedNotifications));
    window.dispatchEvent(new Event('notifications-updated'));
  } catch (error) {
    console.error('Erro ao marcar todas notificações como lidas:', error);
  }
};

/**
 * Limpar o histórico de notificações
 */
export const clearNotificationsHistory = (): void => {
  try {
    localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    window.dispatchEvent(new Event('notifications-updated'));
  } catch (error) {
    console.error('Erro ao limpar histórico de notificações:', error);
  }
};

/**
 * Hook para usar o sistema de notificações em componentes React
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>(getNotificationsHistory());
  const [unreadCount, setUnreadCount] = useState<number>(
    getNotificationsHistory().filter(n => !n.read).length
  );
  
  // Atualizar o estado quando as notificações mudarem
  useEffect(() => {
    const handleNotificationsUpdated = () => {
      const updatedNotifications = getNotificationsHistory();
      setNotifications(updatedNotifications);
      setUnreadCount(updatedNotifications.filter(n => !n.read).length);
    };
    
    window.addEventListener('notifications-updated', handleNotificationsUpdated);
    
    return () => {
      window.removeEventListener('notifications-updated', handleNotificationsUpdated);
    };
  }, []);
  
  return {
    notifications,
    unreadCount,
    showNotification,
    showSuccessNotification,
    showErrorNotification,
    showWarningNotification,
    showInfoNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotificationsHistory
  };
}; 