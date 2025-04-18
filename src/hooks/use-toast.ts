import { toast as sonnerToast, type Toast } from "sonner";
import { 
  successToast, 
  errorToast, 
  warningToast, 
  infoToast, 
  loadingToast 
} from "@/components/ui/toast-icons";

// Armazenar mensagens recentes para evitar duplicações
const recentMessages = new Set<string>();
const MAX_RECENT_MESSAGES = 10;

type ToastProps = Toast & {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning" | "info";
};

// Cria uma chave única para cada notificação baseada em seu conteúdo
const createMessageKey = (props: ToastProps): string => {
  return `${props.title || ''}:${props.description || ''}:${props.variant || 'default'}`;
};

// Limpa mensagens antigas do cache
const cleanupRecentMessages = () => {
  if (recentMessages.size > MAX_RECENT_MESSAGES) {
    // Transforma o Set em um Array, remove os primeiros elementos e recria o Set
    const messagesArray = Array.from(recentMessages);
    const newMessages = messagesArray.slice(messagesArray.length - MAX_RECENT_MESSAGES);
    recentMessages.clear();
    newMessages.forEach(msg => recentMessages.add(msg));
  }
};

export function toast(props: ToastProps) {
  const variant = props.variant || "default";
  
  // Cria uma chave única para a mensagem atual
  const messageKey = createMessageKey(props);
  
  // Verifica se esta mensagem já foi exibida recentemente
  if (recentMessages.has(messageKey)) {
    return; // Ignora mensagens duplicadas
  }
  
  // Adiciona a mensagem ao conjunto de mensagens recentes
  recentMessages.add(messageKey);
  cleanupRecentMessages();
  
  // Remove a propriedade variant antes de passar para o sonner
  // e mapeia para o tipo correto do sonner
  const { variant: _, ...sonnerProps } = props;
  
  if (variant === "destructive") {
    return sonnerToast.error(sonnerProps.title, {
      description: sonnerProps.description,
      ...sonnerProps,
    });
  }
  
  if (variant === "success") {
    return sonnerToast.success(sonnerProps.title, {
      description: sonnerProps.description,
      ...sonnerProps,
    });
  }
  
  if (variant === "warning") {
    return sonnerToast.warning(sonnerProps.title, {
      description: sonnerProps.description,
      ...sonnerProps,
    });
  }
  
  if (variant === "info") {
    return sonnerToast.info(sonnerProps.title, {
      description: sonnerProps.description,
      ...sonnerProps,
    });
  }

  return sonnerToast(sonnerProps.title, {
    description: sonnerProps.description,
    ...sonnerProps,
  });
}

// Funções de conveniência
toast.success = (title: string, description?: string, duration?: number) => {
  successToast(title, description, duration);
};

toast.error = (title: string, description?: string, duration?: number) => {
  errorToast(title, description, duration);
};

toast.warning = (title: string, description?: string, duration?: number) => {
  warningToast(title, description, duration);
};

toast.info = (title: string, description?: string, duration?: number) => {
  infoToast(title, description, duration);
};

toast.loading = (title: string, options?: { description?: string, duration?: number }) => {
  return loadingToast(title, options?.description, options?.duration);
};

// Exporta o toast da biblioteca original para casos onde precisamos de acesso direto
export const sonnerToastOriginal = sonnerToast;
