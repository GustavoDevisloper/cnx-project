import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Book, BookOpen, Music, Settings, User, MessageCircleQuestion, LogOut, Calendar } from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { isAuthenticated, isAdmin, signOut } from '@/services/authService';
import { useState, useEffect, useCallback } from 'react';

export function MainNavigation() {
  const [authenticated, setAuthenticated] = useState(false);
  const [admin, setAdmin] = useState(false);
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
          </div>
        </div>
      </div>
      
      {/* Menu móvel - simplificado e com divisão clara */}
      <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-5 gap-1">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center py-2 ${
                isActive ? 'text-primary' : 'text-gray-600 dark:text-gray-400'
              }`
            }
          >
            <Home className="w-5 h-5" />
            <span className="text-xs mt-1">Início</span>
          </NavLink>
          
          <NavLink
            to="/devotional"
            className={({ isActive }) =>
              `flex flex-col items-center py-2 ${
                isActive ? 'text-primary' : 'text-gray-600 dark:text-gray-400'
              }`
            }
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-xs mt-1">Devocionais</span>
          </NavLink>
          
          <NavLink
            to="/events"
            className={({ isActive }) =>
              `flex flex-col items-center py-2 ${
                isActive ? 'text-primary' : 'text-gray-600 dark:text-gray-400'
              }`
            }
          >
            <Calendar className="w-5 h-5" />
            <span className="text-xs mt-1">Eventos</span>
          </NavLink>
          
          <NavLink
            to="/questions"
            className={({ isActive }) =>
              `flex flex-col items-center py-2 ${
                isActive ? 'text-primary' : 'text-gray-600 dark:text-gray-400'
              }`
            }
          >
            <MessageCircleQuestion className="w-5 h-5" />
            <span className="text-xs mt-1">Dúvidas</span>
          </NavLink>
          
          {authenticated ? (
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex flex-col items-center py-2 ${
                  isActive ? 'text-primary' : 'text-gray-600 dark:text-gray-400'
                }`
              }
            >
              <User className="w-5 h-5" />
              <span className="text-xs mt-1">Perfil</span>
            </NavLink>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `flex flex-col items-center py-2 ${
                  isActive ? 'text-primary' : 'text-gray-600 dark:text-gray-400'
                }`
              }
            >
              <User className="w-5 h-5" />
              <span className="text-xs mt-1">Login</span>
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
} 