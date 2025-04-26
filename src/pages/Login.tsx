import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { signInWithEmail, isAuthenticated } from "@/services/authService";
import { checkAuthStatus } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { AtSign, Key, LogIn } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Buscar redirecionamento da URL ou do sessionStorage
  const redirectFromParams = searchParams.get('redirect') || '/';
  const redirectFromStorage = sessionStorage.getItem('returnTo') || '/';
  const redirectUrl = redirectFromParams !== '/' ? decodeURIComponent(redirectFromParams) : redirectFromStorage;

  useEffect(() => {
    // Remover qualquer flag de login em andamento
    sessionStorage.removeItem('login_in_progress');
    
    // Log para debugging
    console.log('🔍 Destino após login:', redirectUrl);
    
    // Verifica se o usuário já está autenticado com nova função
    const checkAuth = async () => {
      try {
        const authenticated = await checkAuthStatus();
        if (authenticated) {
          console.log('✅ Usuário já autenticado, redirecionando para:', redirectUrl);
          
          // Limpar returnTo do sessionStorage após redirecionamento
          sessionStorage.removeItem('returnTo');
          
          // Se já estiver autenticado, direcionar para a URL de redirecionamento
          navigate(redirectUrl);
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
      }
    };

    checkAuth();
    
    // Limpeza durante desmontagem
    return () => {
      const timeout = sessionStorage.getItem('login_timeout');
      if (timeout) {
        clearTimeout(parseInt(timeout));
        sessionStorage.removeItem('login_timeout');
      }
      sessionStorage.removeItem('login_in_progress');
    };
  }, [navigate, redirectUrl]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos",
        variant: "destructive"
      });
      return;
    }
    
    // Verificar se já tem login em andamento
    if (sessionStorage.getItem('login_in_progress') === 'true') {
      console.log("🚫 Login já em andamento, ignorando clique duplo");
      return;
    }
    
    console.log('🚀 Iniciando processo de login');
    console.log('📍 Após login bem-sucedido, redirecionará para:', redirectUrl);
    
    try {
      setLoading(true);
      sessionStorage.setItem('login_in_progress', 'true');
      
      // Adicionar timeout para limpar a flag de login em andamento
      // caso algo dê errado e o fluxo não seja concluído
      const timeout = setTimeout(() => {
        sessionStorage.removeItem('login_in_progress');
      }, 20000); // 20 segundos
      
      sessionStorage.setItem('login_timeout', timeout.toString());
      
      const user = await signInWithEmail(email, password);
      console.log('✅ Login bem-sucedido:', user);
      
      // Limpar flag de login em andamento antes de redirecionar
      sessionStorage.removeItem('login_in_progress');
      
      // Verificar e atualizar o último login
      if (user) {
        try {
          // Forçar atualização da data de último login
          const now = new Date().toISOString();
          const userWithLastLogin = {
            ...user,
            last_login: now
          };
          
          // Atualizar no localStorage
          localStorage.setItem('current_user', JSON.stringify(userWithLastLogin));
        } catch (error) {
          console.error('Erro ao atualizar último login:', error);
        }
      }
      
      // Disparar evento personalizado para avisar componentes que a autenticação mudou
      window.dispatchEvent(new Event('auth-state-changed'));
      
      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo de volta!"
      });
      
      // Limpar returnTo do sessionStorage após redirecionamento
      sessionStorage.removeItem('returnTo');
      
      // Depois de login bem-sucedido, redirecionar para a URL salva
      navigate(redirectUrl);
      
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      let errorMessage = "Falha no login. Por favor, tente novamente.";
      
      if (error.message) {
        if (error.message.includes("Email ou senha")) {
          errorMessage = "Email ou senha incorretos.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Erro ao fazer login",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Limpar flag de login em andamento em caso de erro
      sessionStorage.removeItem('login_in_progress');
      const timeout = sessionStorage.getItem('login_timeout');
      if (timeout) {
        clearTimeout(parseInt(timeout));
        sessionStorage.removeItem('login_timeout');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Entrar</CardTitle>
          <CardDescription className="text-center">
            Entre com suas credenciais para acessar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full flex items-center gap-2" disabled={loading}>
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processando...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Entrar
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-center text-sm text-muted-foreground">
            Não tem uma conta?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Criar conta
            </Link>
          </p>
          <Link to="/forgot-password" className="text-center text-sm text-primary hover:underline">
            Esqueceu sua senha?
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
