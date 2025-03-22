import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Book, Music, User, MessageCircleQuestion, LogIn, LogOut, UserCircle, Settings } from "lucide-react";
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

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if we're on login or register pages to hide login button
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";
  
  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = await isAuthenticated();
      setAuthenticated(authStatus);
      
      if (authStatus) {
        const userData = await getCurrentUser();
        setCurrentUser(userData);
      } else {
        setCurrentUser(null);
      }
    };

    checkAuth();
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    
    // Para detectar mudanças de login em outras abas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'current_user') {
        checkAuth();
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = async () => {
    await signOut();
    setAuthenticated(false); // Atualiza o estado imediatamente
    setCurrentUser(null);
    navigate('/');
  };

  const goToProfile = () => {
    navigate('/profile');
  };

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4 px-6",
        scrolled ? "bg-background/80 backdrop-blur-lg shadow-sm" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <NavLink to="/" className="flex items-center space-x-2">
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
              <span>Admin</span>
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
        </div>
      </div>
    </header>
  );
};

export default Navbar;
