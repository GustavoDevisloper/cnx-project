import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

/**
 * Componente para processar callbacks de autenticação
 * Este componente é usado principalmente para redirecionamentos de OAuth providers
 */
export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Verificar se o usuário está autenticado
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (data.session) {
          console.log('✅ Usuário autenticado com sucesso!');
          // Redirecionar para o dashboard
          navigate('/dashboard');
        } else {
          // Se não há sessão, redirecionar para login
          navigate('/login');
        }
      } catch (err: any) {
        setError(err.message);
        console.error('Erro na autenticação:', err);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Erro na autenticação</h1>
          <p className="text-red-500">{error}</p>
          <button 
            onClick={() => navigate('/login')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded"
          >
            Voltar para login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Completando autenticação</h2>
        <p className="text-gray-600">Por favor, aguarde enquanto finalizamos o processo...</p>
      </div>
    </div>
  );
}
