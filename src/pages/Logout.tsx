import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { signOut } from '@/services/authService';

export default function Logout() {
  const [isProcessing, setIsProcessing] = useState(true);
  
  useEffect(() => {
    const performLogout = async () => {
      try {
        console.log("🚪 Iniciando processo de logout");
        
        // Sinalizar que o logout está em andamento
        sessionStorage.setItem('logout_in_progress', 'true');
        
        // Esperar um breve momento para garantir que as operações assíncronas
        // tenham tempo para serem concluídas visualmente
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Executar a função de logout
        await signOut();
        
        console.log("✅ Logout concluído com sucesso");
      } catch (error) {
        console.error("❌ Erro durante o logout:", error);
      } finally {
        // Limpar a flag de logout em andamento
        sessionStorage.removeItem('logout_in_progress');
        
        // Marcar como processado para permitir o redirecionamento
        setIsProcessing(false);
      }
    };
    
    performLogout();
    
    // Limpeza: garantir que a flag de logout seja removida
    return () => {
      sessionStorage.removeItem('logout_in_progress');
    };
  }, []);
  
  // Enquanto o logout está sendo processado, mostrar um indicador visual
  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-t-primary rounded-full animate-spin mb-4"></div>
        <h1 className="text-2xl font-semibold mb-2">Saindo...</h1>
        <p className="text-muted-foreground">Encerrando sua sessão de forma segura</p>
      </div>
    );
  }
  
  // Após o processamento, redirecionar para a página inicial
  return <Navigate to="/" replace />;
} 