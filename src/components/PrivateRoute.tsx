import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, isAdmin, isLeader } from '@/services/authService';

interface PrivateRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireLeader?: boolean;
}

export default function PrivateRoute({ 
  children, 
  requireAdmin = false,
  requireLeader = false 
}: PrivateRouteProps) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isNotAuthenticated, setIsNotAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        console.log(`🔒 Verificando acesso para rota (Admin: ${requireAdmin}, Leader: ${requireLeader})`);
        
        // Verificar autenticação usando nossa função melhorada
        const authenticated = await isAuthenticated();
        
        if (!authenticated) {
          console.log("❌ Usuário não está autenticado");
          setHasAccess(false);
          setIsNotAuthenticated(true);
          setLoading(false);
          return;
        }
        
        // Verificar permissões específicas se necessário
        if (requireAdmin) {
          const adminStatus = await isAdmin();
          console.log(`👑 Admin: ${adminStatus ? 'Sim' : 'Não'}`);
          setHasAccess(adminStatus);
        } else if (requireLeader) {
          const leaderStatus = await isLeader();
          console.log(`🎯 Leader: ${leaderStatus ? 'Sim' : 'Não'}`);
          setHasAccess(leaderStatus);
        } else {
          console.log("✅ Usuário autenticado, sem requisitos especiais");
          setHasAccess(authenticated);
        }
      } catch (error) {
        console.error('❌ Erro ao verificar permissões:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };
    
    // Adicionar event listener para mudanças de autenticação
    const handleAuthChanged = () => {
      console.log("🔄 Estado de autenticação mudou, verificando permissões");
      checkAccess();
    };
    
    // Registrar listener para evento personalizado de autenticação
    window.addEventListener('auth-state-changed', handleAuthChanged);
    
    // Verificar acesso ao montar
    checkAccess();
    
    // Cleanup
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthChanged);
    };
  }, [requireAdmin, requireLeader]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    if (isNotAuthenticated) {
      // Redirecionar para login com URL de retorno
      const returnPath = encodeURIComponent(location.pathname + location.search);
      
      // Log para debugging
      console.log(`🔀 Redirecionando para login (usuário não autenticado). URL de retorno: ${returnPath}`);
      
      // Salvar o caminho original no sessionStorage para usar após o login
      sessionStorage.setItem('returnTo', location.pathname + location.search);
      
      return <Navigate to={`/login?redirect=${returnPath}`} replace />;
    }
    
    // Se está autenticado mas não tem permissão, redirecionar para home com mensagem
    console.log(`🚫 Usuário autenticado mas sem permissão para ${location.pathname}`);
    return <Navigate to="/" state={{ message: 'Você não tem permissão para acessar esta página' }} replace />;
  }

  return <>{children}</>;
} 