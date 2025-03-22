import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, getCurrentUser, isAdmin, isAuthenticated as checkIsAuthenticated } from '@/services/authService';
import { manualLogin, syncCurrentUser } from '@/services/userRegistrationService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdminUser: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    // Check for existing session on mount
    checkAuth();
    
    // Adicionar um listener para o evento auth-state-changed
    const handleAuthChanged = () => {
      console.log("🔄 Estado de autenticação mudou, atualizando contexto");
      checkAuth();
    };
    
    window.addEventListener('auth-state-changed', handleAuthChanged);
    
    // Cleanup
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthChanged);
    };
  }, []);

  async function checkAuth() {
    try {
      setIsLoading(true);
      console.log("🔍 Verificando autenticação no contexto...");
      
      // Usar a função melhorada de isAuthenticated
      const isUserAuthenticated = await checkIsAuthenticated();
      
      if (isUserAuthenticated) {
        // Se autenticado, buscar dados do usuário
        const userData = await getCurrentUser();
        
        if (userData) {
          console.log("👤 Dados do usuário carregados com sucesso");
          setUser(userData);
          setIsAuthenticated(true);
          setIsAdminUser(userData.role === 'admin');
          console.log(`✅ Usuário ${userData.email} (${userData.role}) autenticado`);
          
          // Sincronizar o usuário com a tabela public.users para evitar problemas de chave estrangeira
          syncCurrentUser().then(success => {
            if (success) {
              console.log("✅ Usuário sincronizado com a tabela public.users");
            } else {
              console.warn("⚠️ Não foi possível sincronizar o usuário com a tabela public.users");
            }
          });
          
          return true;
        } else {
          console.log("❓ Usuário autenticado mas dados não encontrados");
          setUser(null);
          setIsAuthenticated(false);
          setIsAdminUser(false);
          return false;
        }
      } else {
        console.log("❌ Usuário não está autenticado");
        setUser(null);
        setIsAuthenticated(false);
        setIsAdminUser(false);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao verificar autenticação:', error);
      setUser(null);
      setIsAuthenticated(false);
      setIsAdminUser(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    setIsLoading(true);
    try {
      // Usar nosso sistema de login manual
      const userData = await manualLogin(email, password);
      
      if (userData) {
        setUser(userData as User);
        setIsAuthenticated(true);
        setIsAdminUser(userData.role === 'admin');
        
        // Disparar evento de mudança de autenticação
        window.dispatchEvent(new Event('auth-state-changed'));
        
        return;
      }
      
      throw new Error('Falha na autenticação');
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    setIsLoading(true);
    try {
      // Limpar informações do usuário
      localStorage.removeItem('current_user_id');
      localStorage.removeItem('current_user_email');
      localStorage.removeItem('current_user');
      localStorage.removeItem('current_user_cache_time');
      
      // Atualizar estado
      setUser(null);
      setIsAuthenticated(false);
      setIsAdminUser(false);
      
      // Disparar evento de mudança de autenticação
      window.dispatchEvent(new Event('auth-state-changed'));
      
      console.log("✅ Logout realizado com sucesso no contexto");
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  const value = {
    user,
    isLoading,
    isAuthenticated,
    isAdminUser,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 