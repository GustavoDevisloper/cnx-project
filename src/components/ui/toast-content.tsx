import React from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Loader2
} from 'lucide-react';

export interface ToastContentProps {
  title: string;
  message?: string;
}

// Componentes para cada tipo de toast
export const SuccessToast: React.FC<ToastContentProps> = ({ title, message }) => (
  <div>
    <div className="font-medium">{title}</div>
    {message && <div className="text-sm opacity-90">{message}</div>}
  </div>
);

export const ErrorToast: React.FC<ToastContentProps> = ({ title, message }) => (
  <div>
    <div className="font-medium">{title}</div>
    {message && <div className="text-sm opacity-90">{message}</div>}
  </div>
);

export const WarningToast: React.FC<ToastContentProps> = ({ title, message }) => (
  <div>
    <div className="font-medium">{title}</div>
    {message && <div className="text-sm opacity-90">{message}</div>}
  </div>
);

export const InfoToast: React.FC<ToastContentProps> = ({ title, message }) => (
  <div>
    <div className="font-medium">{title}</div>
    {message && <div className="text-sm opacity-90">{message}</div>}
  </div>
);

export const LoadingToast: React.FC<ToastContentProps> = ({ title, message }) => (
  <div>
    <div className="font-medium">{title}</div>
    {message && <div className="text-sm opacity-90">{message}</div>}
  </div>
);

// Ícones para cada tipo de toast
export const SuccessIcon = <CheckCircle className="h-5 w-5 text-green-500" />;
export const ErrorIcon = <AlertCircle className="h-5 w-5 text-red-500" />;
export const WarningIcon = <AlertTriangle className="h-5 w-5 text-yellow-500" />;
export const InfoIcon = <Info className="h-5 w-5 text-blue-500" />;
export const LoadingIcon = <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />; 