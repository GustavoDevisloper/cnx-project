import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Book, Music, User, MessageCircleQuestion, LogIn, LogOut, UserCircle, Settings, Calendar, Home, BookOpen, HelpCircle, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isAuthenticated, signOut, getCurrentUser } from "@/services/authService";
import { ThemeSwitcher } from './ThemeSwitcher';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { User as UserType } from '@/services/authService';

const NavbarNew = () => {
  const [scrolled, setScrolled] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Ref para controlar quando a última verificação foi feita
  const lastAuthCheckRef = useRef(0);
  // Ref para controlar quando uma verificação está em andamento
  const isCheckingRef = useRef(false);
  
  // Check if we're on login or register pages to hide login button
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";
  
  // Função para verificar autenticação 
  const checkAuth = async () => {
    // Verificar se estamos em processo de logout
    if (window.sessionStorage.getItem('logout_in_progress') === 'true') {
      console.log("⏭️ Pulando verificação de autenticação - logout em andamento");
      return;
    }
    
    // Verificar se estamos em processo de registro
    if (window.sessionStorage.getItem('registration_in_progress') === 'true') {
      console.log("⏭️ Pulando verificação de autenticação - registro em andamento");
      return;
    }
    
    // Evita múltiplas verificações em intervalo curto (3 segundos)
    const now = Date.now();
    if (isCheckingRef.current || now - lastAuthCheckRef.current < 3000) {
      return;
    }
    
    console.log("Verificando autenticação...");
    isCheckingRef.current = true;
    
    try {
      const authStatus = await isAuthenticated();
      console.log("Status de autenticação:", authStatus);
      
      // Só atualiza o estado se o status for diferente do atual
      // para evitar re-renderizações desnecessárias
      if (authenticated !== authStatus) {
        setAuthenticated(authStatus);
      }
      
      if (authStatus && !currentUser) {
        const userData = await getCurrentUser();
        console.log("Dados do usuário:", userData);
        setCurrentUser(userData);
      } else if (!authStatus && currentUser) {
        setCurrentUser(null);
      }
    } finally {
      lastAuthCheckRef.current = Date.now();
      isCheckingRef.current = false;
    }
  };
  
  // Verificar autenticação ao montar o componente
  useEffect(() => {
    if (!isAuthPage) {
      checkAuth();
    }
  }, []);
  
  // Verificar autenticação quando a rota muda, mas evitando páginas de auth
  useEffect(() => {
    if (!isAuthPage && !isCheckingRef.current) {
      checkAuth();
    }
  }, [location.pathname]);
  
  // Adicionar eventos de scroll e storage
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    
    // Verificar autenticação quando o foco retorna à janela
    // mas limitando frequência para evitar loops
    const handleFocus = () => {
      // Só verifica se não estiver em páginas de autenticação e se passou tempo suficiente
      if (!isAuthPage && !isCheckingRef.current && Date.now() - lastAuthCheckRef.current > 5000) {
        checkAuth();
      }
    };
    
    // Adicionar listener para evento personalizado de autenticação
    const handleAuthChange = () => {
      console.log("🔄 Evento auth-state-changed detectado no navbar");
      if (!isAuthPage) {
        checkAuth();
      }
    };
    
    // Listener para evento de início de logout
    const handleLogoutStarted = () => {
      console.log("🚪 Logout iniciado, bloqueando verificações de autenticação");
      isCheckingRef.current = true;
      
      // Desbloqueia após um período de tempo
      setTimeout(() => {
        console.log("🔓 Reativando verificações de autenticação após logout");
        isCheckingRef.current = false;
        lastAuthCheckRef.current = Date.now();
      }, 5000);
    };
    
    window.addEventListener("focus", handleFocus);
    window.addEventListener("auth-state-changed", handleAuthChange);
    window.addEventListener("auth-logout-started", handleLogoutStarted);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("auth-state-changed", handleAuthChange);
      window.removeEventListener("auth-logout-started", handleLogoutStarted);
    };
  }, [isAuthPage]);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = async () => {
    // Sinalizar que o logout está em andamento para evitar mais verificações
    window.sessionStorage.setItem('logout_in_progress', 'true');
    
    // Impedir verificações durante o logout
    isCheckingRef.current = true;
    
    // Atualiza o estado manualmente para mostrar botão de login imediatamente
    setAuthenticated(false);
    setCurrentUser(null);
    
    // Redirecionar para página de logout que irá lidar com todo o processo
    // de forma controlada e evitar ciclos de verificação
    navigate('/logout');
  };

  const goToProfile = () => {
    navigate('/profile');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4 px-6",
        scrolled ? "bg-background/90 backdrop-blur-lg shadow-sm" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <NavLink to="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
          <span className="text-xl font-semibold">Conexão Jovem</span>
        </NavLink>
        
        <nav className="hidden md:flex items-center space-x-8">
          <NavLink 
            to="/"
            className={({isActive}) => cn("nav-link", isActive && "active")}
          >
            Início
          </NavLink>
          
          <NavLink 
            to="/devotional"
            className={({isActive}) => cn("nav-link flex items-center gap-1.5", isActive && "active")}
          >
            <Book size={16} />
            <span>Devocional</span>
          </NavLink>
          
          <NavLink 
            to="/questions"
            className={({isActive}) => cn("nav-link flex items-center gap-1.5", isActive && "active")}
          >
            <MessageCircleQuestion size={16} />
            <span>Dúvidas</span>
          </NavLink>
          
          <NavLink 
            to="/events"
            className={({isActive}) => cn("nav-link flex items-center gap-1.5", isActive && "active")}
          >
            <Calendar size={16} />
            <span>Eventos</span>
          </NavLink>
          
          <NavLink 
            to="/playlists"
            className={({isActive}) => cn("nav-link flex items-center gap-1.5", isActive && "active")}
          >
            <Music size={16} />
            <span>Playlists</span>
          </NavLink>
          
          {authenticated && currentUser?.role === 'admin' && (
            <NavLink 
              to="/admin"
              className={({isActive}) => cn("nav-link flex items-center gap-1.5", isActive && "active")}
            >
              <Settings size={16} />
              <span>Gerenciamento</span>
            </NavLink>
          )}
        </nav>
        
        <div className="flex items-center space-x-4">
          <ThemeSwitcher />
          
          {!isAuthPage && (
            authenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <UserCircle className="h-4 w-4" />
                    <span>{currentUser?.username || 'Usuário'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {currentUser?.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={goToProfile}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Meu Perfil</span>
                  </DropdownMenuItem>
                  {(currentUser?.role === 'leader' || currentUser?.role === 'admin') && (
                    <DropdownMenuItem onClick={() => navigate('/admin?tab=leaders')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Gerenciar Líderes</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogin}
                className="flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                <span>Entrar</span>
              </Button>
            )
          )}
          
          {/* Botão Menu Hambúrguer para dispositivos móveis */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden focus:outline-none"
            onClick={toggleMobileMenu}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Menu Mobile - Slide-in */}
      <div 
        className={`fixed inset-0 bg-background dark:bg-gray-900 z-50 transition-transform duration-300 shadow-xl md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ top: '72px' }} // Altura do cabeçalho
      >
        <div className="flex flex-col space-y-1 p-6">
          <NavLink 
            to="/"
            className={({isActive}) => cn(
              "flex items-center px-4 py-3 rounded-md transition-colors text-base",
              isActive 
                ? "bg-primary/20 text-primary font-semibold" 
                : "text-foreground hover:bg-muted"
            )}
            onClick={closeMobileMenu}
          >
            <Home className="mr-3 h-5 w-5" />
            <span>Início</span>
          </NavLink>
          
          <NavLink 
            to="/devotional"
            className={({isActive}) => cn(
              "flex items-center px-4 py-3 rounded-md transition-colors text-base",
              isActive 
                ? "bg-primary/20 text-primary font-semibold" 
                : "text-foreground hover:bg-muted"
            )}
            onClick={closeMobileMenu}
          >
            <Book className="mr-3 h-5 w-5" />
            <span>Devocional</span>
          </NavLink>
          
          <NavLink 
            to="/questions"
            className={({isActive}) => cn(
              "flex items-center px-4 py-3 rounded-md transition-colors text-base",
              isActive 
                ? "bg-primary/20 text-primary font-semibold" 
                : "text-foreground hover:bg-muted"
            )}
            onClick={closeMobileMenu}
          >
            <MessageCircleQuestion className="mr-3 h-5 w-5" />
            <span>Dúvidas</span>
          </NavLink>
          
          <NavLink 
            to="/events"
            className={({isActive}) => cn(
              "flex items-center px-4 py-3 rounded-md transition-colors text-base",
              isActive 
                ? "bg-primary/20 text-primary font-semibold" 
                : "text-foreground hover:bg-muted"
            )}
            onClick={closeMobileMenu}
          >
            <Calendar className="mr-3 h-5 w-5" />
            <span>Eventos</span>
          </NavLink>
          
          <NavLink 
            to="/playlists"
            className={({isActive}) => cn(
              "flex items-center px-4 py-3 rounded-md transition-colors text-base",
              isActive 
                ? "bg-primary/20 text-primary font-semibold" 
                : "text-foreground hover:bg-muted"
            )}
            onClick={closeMobileMenu}
          >
            <Music className="mr-3 h-5 w-5" />
            <span>Playlists</span>
          </NavLink>
          
          {authenticated && currentUser?.role === 'admin' && (
            <NavLink 
              to="/admin"
              className={({isActive}) => cn(
                "flex items-center px-4 py-3 rounded-md transition-colors text-base",
                isActive 
                  ? "bg-primary/20 text-primary font-semibold" 
                  : "text-foreground hover:bg-muted"
              )}
              onClick={closeMobileMenu}
            >
              <Settings className="mr-3 h-5 w-5" />
              <span>Gerenciamento</span>
            </NavLink>
          )}
          
          <div className="border-t border-border my-4 pt-2">
            {authenticated ? (
              <>
                <NavLink 
                  to="/profile"
                  className={({isActive}) => cn(
                    "flex items-center px-4 py-3 rounded-md transition-colors text-base",
                    isActive 
                      ? "bg-primary/20 text-primary font-semibold" 
                      : "text-foreground hover:bg-muted"
                  )}
                  onClick={closeMobileMenu}
                >
                  <User className="mr-3 h-5 w-5" />
                  <span>Meu Perfil</span>
                </NavLink>
                
                <button
                  className="w-full flex items-center px-4 py-3 rounded-md text-base text-left text-foreground hover:bg-muted transition-colors"
                  onClick={() => {
                    closeMobileMenu();
                    handleLogout();
                  }}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  <span>Sair</span>
                </button>
              </>
            ) : (
              <NavLink 
                to="/login"
                className={({isActive}) => cn(
                  "flex items-center px-4 py-3 rounded-md transition-colors text-base",
                  isActive 
                    ? "bg-primary/20 text-primary font-semibold" 
                    : "text-foreground hover:bg-muted"
                )}
                onClick={closeMobileMenu}
              >
                <LogIn className="mr-3 h-5 w-5" />
                <span>Entrar</span>
              </NavLink>
            )}
          </div>
        </div>
        
        {/* Botão de fechar visível dentro do menu */}
        <button 
          className="absolute top-4 right-4 p-2 rounded-full bg-muted text-foreground"
          onClick={closeMobileMenu}
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* Overlay para fechar o menu quando clicar fora */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobileMenu}
          style={{ top: '72px' }}
        ></div>
      )}
    </header>
  );
};

export default NavbarNew; 