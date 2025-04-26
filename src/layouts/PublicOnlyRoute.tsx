import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '@/services/authService';

interface PublicOnlyRouteProps {
  children: React.ReactNode;
}

/**
 * PublicOnlyRoute - Componente que restringe rotas apenas para usuários não autenticados
 * Se o usuário estiver autenticado, redireciona para a página principal
 * Útil para páginas de login, registro, etc.
 */
export default function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const [loading, setLoading] = useState(true);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('🔍 Verificando se usuário já está autenticado...');
        const authenticated = await isAuthenticated();
        
        if (authenticated) {
          console.log('✅ Usuário já autenticado, redirecionando para página principal');
          setIsUserAuthenticated(true);
        } else {
          console.log('🔓 Usuário não autenticado, permitindo acesso à rota pública');
          setIsUserAuthenticated(false);
        }
      } catch (error) {
        console.error('❌ Erro ao verificar autenticação:', error);
        setIsUserAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    // Verificar autenticação ao montar o componente
    checkAuthStatus();
    
    // Adicionar event listener para mudanças de autenticação
    const handleAuthChanged = () => {
      console.log('🔄 Estado de autenticação mudou, verificando status');
      checkAuthStatus();
    };
    
    window.addEventListener('auth-state-changed', handleAuthChanged);
    
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthChanged);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se o usuário estiver autenticado, redireciona para a página principal
  // ou para a página que estava tentando acessar originalmente
  if (isUserAuthenticated) {
    const returnPath = sessionStorage.getItem('returnTo') || '/';
    sessionStorage.removeItem('returnTo'); // Limpar após uso
    
    console.log(`🔀 Usuário já autenticado, redirecionando para: ${returnPath}`);
    return <Navigate to={returnPath} replace />;
  }

  // Se não estiver autenticado, permite acesso à rota
  return <>{children}</>;
} 