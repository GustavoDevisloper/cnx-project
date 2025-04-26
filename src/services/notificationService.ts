import { 
  showSuccessToast, 
  showErrorToast, 
  showWarningToast, 
  showInfoToast 
} from '@/services/toast-service';
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
}

// Chave para o armazenamento no localStorage
const NOTIFICATIONS_STORAGE_KEY = 'user_notifications';
const MAX_NOTIFICATIONS = 20; // Reduzido para simplificar

/**
 * Mostra uma notificação para o usuário e a armazena no histórico
 */
export const showNotification = (
  title: string,
  message: string,
  type: NotificationType = 'info'
): string => {
  const notificationId = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  
  // Mostrar toast usando o serviço apropriado
  if (type === 'success') {
    showSuccessToast(title, message);
  } else if (type === 'error') {
    showErrorToast(title, message);
  } else if (type === 'warning') {
    showWarningToast(title, message);
  } else {
    showInfoToast(title, message);
  }
  
  // Criar e armazenar a notificação
  const notification: Notification = {
    id: notificationId,
    title,
    message,
    type,
    timestamp: Date.now(),
    read: false
  };
  
  storeNotification(notification);
  
  return notificationId;
};

// Funções de atalho para os diferentes tipos
export const showSuccessNotification = (title: string, message: string): string => 
  showNotification(title, message, 'success');

export const showErrorNotification = (title: string, message: string): string => 
  showNotification(title, message, 'error');

export const showWarningNotification = (title: string, message: string): string => 
  showNotification(title, message, 'warning');

export const showInfoNotification = (title: string, message: string): string => 
  showNotification(title, message, 'info');

/**
 * Armazena uma notificação no histórico
 */
const storeNotification = (notification: Notification): void => {
  try {
    const existingNotifications = getNotificationsHistory();
    const updatedNotifications = [notification, ...existingNotifications].slice(0, MAX_NOTIFICATIONS);
    
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedNotifications));
    window.dispatchEvent(new CustomEvent('notifications-updated'));
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
 * Marca uma notificação como lida
 */
export const markNotificationAsRead = (notificationId: string): void => {
  try {
    const notifications = getNotificationsHistory();
    const updatedNotifications = notifications.map(notification => 
      notification.id === notificationId ? { ...notification, read: true } : notification
    );
    
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedNotifications));
    window.dispatchEvent(new CustomEvent('notifications-updated'));
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
  }
};

/**
 * Marca todas as notificações como lidas
 */
export const markAllNotificationsAsRead = (): void => {
  try {
    const notifications = getNotificationsHistory();
    const updatedNotifications = notifications.map(notification => ({ 
      ...notification, read: true 
    }));
    
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedNotifications));
    window.dispatchEvent(new CustomEvent('notifications-updated'));
  } catch (error) {
    console.error('Erro ao marcar todas notificações como lidas:', error);
  }
};

/**
 * Limpa o histórico de notificações
 */
export const clearNotificationsHistory = (): void => {
  try {
    localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('notifications-updated'));
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
  
  useEffect(() => {
    const handleNotificationsUpdated = () => {
      const updatedNotifications = getNotificationsHistory();
      setNotifications(updatedNotifications);
      setUnreadCount(updatedNotifications.filter(n => !n.read).length);
    };
    
    window.addEventListener('notifications-updated', handleNotificationsUpdated);
    return () => window.removeEventListener('notifications-updated', handleNotificationsUpdated);
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