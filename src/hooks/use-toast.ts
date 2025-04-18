import { toast as sonnerToast } from "sonner";
import { 
  successToast, 
  errorToast, 
  warningToast, 
  infoToast, 
  loadingToast 
} from "@/components/ui/toast-icons";

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning" | "info";
  duration?: number;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  closeButton?: boolean;
}

export function toast({ 
  title, 
  description, 
  variant = "default", 
  duration = 5000,
  icon,
  action,
  closeButton = true
}: ToastProps) {
  const options = {
    description,
    duration,
    icon,
    action: action ? {
      label: action.label,
      onClick: action.onClick
    } : undefined,
    closeButton
  };

  if (variant === "destructive") {
    if (!icon) {
      errorToast(title || "", description, duration);
    } else {
      sonnerToast.error(title, options);
    }
  } else if (variant === "success") {
    if (!icon) {
      successToast(title || "", description, duration);
    } else {
      sonnerToast.success(title, options);
    }
  } else if (variant === "warning") {
    if (!icon) {
      warningToast(title || "", description, duration);
    } else {
      sonnerToast.warning(title, options);
    }
  } else if (variant === "info") {
    if (!icon) {
      infoToast(title || "", description, duration);
    } else {
      sonnerToast.info(title, options);
    }
  } else {
    if (!icon) {
      successToast(title || "", description, duration);
    } else {
      sonnerToast.success(title, options);
    }
  }
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
