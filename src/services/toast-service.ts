import { toast as toastify } from 'react-toastify';
import { 
  SuccessToast, 
  ErrorToast, 
  WarningToast, 
  InfoToast, 
  LoadingToast,
  SuccessIcon,
  ErrorIcon,
  WarningIcon,
  InfoIcon,
  LoadingIcon
} from '@/components/ui/toast-content';

// Tipos de notificações
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

// Função de sucesso
export function showSuccessToast(title: string, message?: string) {
  return toastify.success(
    SuccessToast({ title, message }),
    {
      icon: SuccessIcon
    }
  );
}

// Função de erro
export function showErrorToast(title: string, message?: string) {
  return toastify.error(
    ErrorToast({ title, message }),
    {
      icon: ErrorIcon,
      autoClose: 8000 // Erros ficam visíveis por mais tempo
    }
  );
}

// Função de aviso
export function showWarningToast(title: string, message?: string) {
  return toastify.warning(
    WarningToast({ title, message }),
    {
      icon: WarningIcon
    }
  );
}

// Função de informação
export function showInfoToast(title: string, message?: string) {
  return toastify.info(
    InfoToast({ title, message }),
    {
      icon: InfoIcon
    }
  );
}

// Função de carregamento
export function showLoadingToast(title: string, message?: string) {
  return toastify.loading(
    LoadingToast({ title, message }),
    {
      icon: LoadingIcon
    }
  );
}

// Função para descartar toast
export function dismissToast(id?: string | number) {
  if (id) {
    toastify.dismiss(id);
  } else {
    toastify.dismiss();
  }
}

// Função para atualizar toast
export function updateToast(id: string | number, options: {
  title?: string;
  message?: string;
  type?: NotificationType;
  isLoading?: boolean;
}) {
  const { title, message, type, isLoading } = options;
  
  let icon;
  let content;
  
  if (isLoading) {
    icon = LoadingIcon;
    content = LoadingToast({ title: title || '', message });
  } else if (type === 'success') {
    icon = SuccessIcon;
    content = SuccessToast({ title: title || '', message });
  } else if (type === 'error') {
    icon = ErrorIcon;
    content = ErrorToast({ title: title || '', message });
  } else if (type === 'warning') {
    icon = WarningIcon;
    content = WarningToast({ title: title || '', message });
  } else {
    icon = InfoIcon;
    content = InfoToast({ title: title || '', message });
  }
  
  toastify.update(id, {
    render: content,
    type: isLoading ? toastify.TYPE.DEFAULT : type,
    isLoading: isLoading,
    icon: icon,
    autoClose: type === 'error' ? 8000 : 5000,
  });
}

// Função geral para exibir toast
export function showToast(title: string, message?: string, type: NotificationType = 'info') {
  switch (type) {
    case 'success':
      return showSuccessToast(title, message);
    case 'error':
      return showErrorToast(title, message);
    case 'warning':
      return showWarningToast(title, message);
    case 'info':
    default:
      return showInfoToast(title, message);
  }
}

// Função para manipular promises
export async function promiseToast<T>(
  promise: Promise<T>,
  messages: {
    pending: string;
    success: string;
    error: string;
  }
) {
  return toastify.promise(
    promise,
    {
      pending: messages.pending,
      success: messages.success,
      error: messages.error,
    }
  );
} 