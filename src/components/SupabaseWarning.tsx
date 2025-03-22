import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { isSupabaseConfigured } from '@/services/supabaseClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SupabaseWarning() {
  const [showDevWarning, setShowDevWarning] = useState(false);
  const isDevelopment = import.meta.env.MODE === 'development';

  useEffect(() => {
    // Only show development warning in development environment
    setShowDevWarning(isDevelopment);
    
    // Check if the user has dismissed the warning before
    const dismissed = localStorage.getItem('supabase-warning-dismissed');
    if (dismissed === 'true') {
      setShowDevWarning(false);
    }
  }, [isDevelopment]);

  const handleDismiss = () => {
    setShowDevWarning(false);
    localStorage.setItem('supabase-warning-dismissed', 'true');
  };

  // If Supabase is not configured correctly, show configuration warning
  if (!isSupabaseConfigured()) {
    return (
      <Alert variant="destructive" className="fixed bottom-4 right-4 max-w-md z-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Configuração Incompleta</AlertTitle>
        <AlertDescription>
          O Supabase não está configurado corretamente. Verifique se o arquivo .env.local 
          contém VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY válidos.
        </AlertDescription>
      </Alert>
    );
  }

  // Show development warning if needed
  if (showDevWarning) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 px-4 py-2 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm">
              <strong>Ambiente de Desenvolvimento:</strong> Usando instância de Supabase para desenvolvimento.
              Os dados podem ser resetados a qualquer momento.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded-full"
            aria-label="Dismiss warning"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
} 