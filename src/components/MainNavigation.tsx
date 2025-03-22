import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Book, BookOpen, Music, Settings, User, MessageCircleQuestion, LogOut, Calendar, Menu, X } from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { isAuthenticated, isAdmin, signOut } from '@/services/authService';
import { useState, useEffect, useCallback } from 'react';

export function MainNavigation() {
  const [authenticated, setAuthenticated] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Safely check auth state with a useCallback to prevent memory leaks
  const checkAuthState = useCallback(async () => {
    try {
      const authStatus = await isAuthenticated();
      const adminStatus = await isAdmin();
      setAuthenticated(authStatus);
      setAdmin(adminStatus);
    } catch (error) {
      console.error("Error checking authentication status:", error);
      // Default to safe values in case of error
      setAuthenticated(false);
      setAdmin(false);
    }
  }, []);

  useEffect(() => {
    // Check authentication status initially
    checkAuthState();

    // Set up a listener for storage events (in case auth state changes in another tab)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'current_user' || event.key === 'auth_token') {
        checkAuthState();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuthState]);

  // Handle logout safely
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Use the signOut service
    await signOut();
    
    // Update the local state
    setAuthenticated(false);
    setAdmin(false);
    
    // Navigate to home page after logout
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold">Conexão Jovem</h1>
          </div>
          
          {/* Menu desktop */}
          <div className="hidden md:flex items-center space-x-4">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`
              }
            >
              <Home className="w-5 h-5 mr-1.5" />
              <span>Início</span>
            </NavLink>
            
            <NavLink
              to="/devotional"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`
              }
            >
              <BookOpen className="w-5 h-5 mr-1.5" />
              <span>Devocionais</span>
            </NavLink>

            <NavLink
              to="/events"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`
              }
            >
              <Calendar className="w-5 h-5 mr-1.5" />
              <span>Eventos</span>
            </NavLink>
            
            <NavLink
              to="/biblia"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`
              }
            >
              <BookOpen className="w-5 h-5 mr-1.5" />
              <span>Bíblia</span>
            </NavLink>
            
            <NavLink
              to="/questions"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`
              }
            >
              <MessageCircleQuestion className="w-5 h-5 mr-1.5" />
              <span>Dúvidas</span>
            </NavLink>
            
            <NavLink
              to="/playlists"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`
              }
            >
              <Music className="w-5 h-5 mr-1.5" />
              <span>Playlists</span>
            </NavLink>
          </div>
          
          {/* Área do usuário */}
          <div className="flex items-center space-x-2">
            {/* Alternador de tema */}
            <ThemeSwitcher />
            
            {admin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `p-2 rounded-md text-sm font-medium ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`
                }
              >
                <Settings className="w-5 h-5" />
              </NavLink>
            )}
            
            {authenticated ? (
              <>
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `p-2 rounded-md text-sm font-medium ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  <User className="w-5 h-5" />
                </NavLink>
                <NavLink
                  to="/logout"
                  className="p-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5" />
                </NavLink>
              </>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `p-2 rounded-md text-sm font-medium ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`
                }
              >
                <User className="w-5 h-5" />
              </NavLink>
            )}
            
            {/* Botão Hambúrguer para Mobile */}
            <button 
              className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              onClick={toggleMobileMenu}
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Menu móvel - Menu Hambúrguer */}
      <div 
        className={`md:hidden fixed inset-0 z-50 bg-white dark:bg-gray-800 transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ top: '64px' }} // Altura da barra de navegação
      >
        <div className="flex flex-col space-y-2 p-4">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-md ${
                isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
            onClick={closeMobileMenu}
          >
            <Home className="w-5 h-5 mr-3" />
            <span className="font-medium">Início</span>
          </NavLink>
          
          <NavLink
            to="/devotional"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-md ${
                isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
            onClick={closeMobileMenu}
          >
            <BookOpen className="w-5 h-5 mr-3" />
            <span className="font-medium">Devocionais</span>
          </NavLink>

          <NavLink
            to="/events"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-md ${
                isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
            onClick={closeMobileMenu}
          >
            <Calendar className="w-5 h-5 mr-3" />
            <span className="font-medium">Eventos</span>
          </NavLink>
          
          <NavLink
            to="/biblia"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-md ${
                isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
            onClick={closeMobileMenu}
          >
            <Book className="w-5 h-5 mr-3" />
            <span className="font-medium">Bíblia</span>
          </NavLink>
          
          <NavLink
            to="/questions"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-md ${
                isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
            onClick={closeMobileMenu}
          >
            <MessageCircleQuestion className="w-5 h-5 mr-3" />
            <span className="font-medium">Dúvidas</span>
          </NavLink>
          
          <NavLink
            to="/playlists"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-md ${
                isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
            onClick={closeMobileMenu}
          >
            <Music className="w-5 h-5 mr-3" />
            <span className="font-medium">Playlists</span>
          </NavLink>
          
          {admin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-md ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
              onClick={closeMobileMenu}
            >
              <Settings className="w-5 h-5 mr-3" />
              <span className="font-medium">Gerenciamento</span>
            </NavLink>
          )}
          
          {authenticated ? (
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-md ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
              onClick={closeMobileMenu}
            >
              <User className="w-5 h-5 mr-3" />
              <span className="font-medium">Perfil</span>
            </NavLink>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-md ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
              onClick={closeMobileMenu}
            >
              <User className="w-5 h-5 mr-3" />
              <span className="font-medium">Login</span>
            </NavLink>
          )}
        </div>
      </div>
      
      {/* Overlay para fechar o menu quando clicar fora */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
          style={{ top: '64px' }} // Altura da barra de navegação
        ></div>
      )}
    </nav>
  );
} 