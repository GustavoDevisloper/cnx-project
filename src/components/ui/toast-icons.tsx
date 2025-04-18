import React from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  RefreshCw,
  Bell,
  Wifi
} from 'lucide-react';
import { toast as sonnerToast } from "sonner";

// Tipos de ícones de toast
export type ToastIconType = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'notification' | 'online';

// Função para garantir tempo mínimo de exibição
const ensureMinDuration = (duration?: number): number => {
  const MIN_DURATION = 3000; // 3 segundos
  return duration && duration > MIN_DURATION ? duration : MIN_DURATION;
};

// Componente que renderiza os ícones corretos para cada tipo de toast
export const ToastIcon: React.FC<{ type: ToastIconType }> = ({ type }) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-500 animate-pulse-gentle" />;
    case 'error':
      return <AlertCircle className="h-5 w-5 text-red-500 animate-bounce-small" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500 animate-pulse-gentle" />;
    case 'loading':
      return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
    case 'notification':
      return <Bell className="h-5 w-5 text-blue-500 animate-pulse-gentle" />;
    case 'online':
      return <Wifi className="h-5 w-5 text-green-500 animate-pulse-gentle" />;
    case 'info':
    default:
      return <Info className="h-5 w-5 text-blue-500 animate-pulse-gentle" />;
  }
};

// Função para classe de animação principal do toast
const getAnimationClass = (type: ToastIconType): string => {
  return 'animate-slide-in-right'; // Usamos a mesma animação para todos os tipos
};

// Funções de conveniência para exibir toasts com ícones

// Toast de sucesso com ícone
export function successToast(title: string, description?: string, duration?: number) {
  sonnerToast.success(title, {
    description,
    duration: ensureMinDuration(duration),
    icon: <CheckCircle className="h-5 w-5 text-green-500 animate-pulse-gentle" />,
    className: 'animate-slide-in-right' // Força a animação de entrada da direita
  });
}

// Toast de erro com ícone
export function errorToast(title: string, description?: string, duration?: number) {
  sonnerToast.error(title, {
    description,
    duration: ensureMinDuration(duration || 8000), // Erros ficam visíveis por mais tempo por padrão
    icon: <AlertCircle className="h-5 w-5 text-red-500 animate-bounce-small" />,
    className: 'animate-slide-in-right' // Força a animação de entrada da direita
  });
}

// Toast de aviso com ícone
export function warningToast(title: string, description?: string, duration?: number) {
  sonnerToast.warning(title, {
    description,
    duration: ensureMinDuration(duration),
    icon: <AlertTriangle className="h-5 w-5 text-yellow-500 animate-pulse-gentle" />,
    className: 'animate-slide-in-right' // Força a animação de entrada da direita
  });
}

// Toast de informação com ícone
export function infoToast(title: string, description?: string, duration?: number) {
  sonnerToast.info(title, {
    description,
    duration: ensureMinDuration(duration),
    icon: <Info className="h-5 w-5 text-blue-500 animate-pulse-gentle" />,
    className: 'animate-slide-in-right' // Força a animação de entrada da direita
  });
}

// Toast de carregamento com ícone animado
export function loadingToast(title: string, description?: string, duration?: number) {
  return sonnerToast.loading(title, {
    description,
    duration: ensureMinDuration(duration),
    icon: <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />,
    className: 'animate-slide-in-right' // Força a animação de entrada da direita
  });
}

// Toast para notificação de conexão online
export function onlineToast(title: string, description?: string, duration?: number) {
  sonnerToast.info(title, {
    description,
    duration: ensureMinDuration(duration),
    icon: <Wifi className="h-5 w-5 text-green-500 animate-pulse-gentle" />,
    className: 'animate-slide-in-right' // Força a animação de entrada da direita
  });
} 