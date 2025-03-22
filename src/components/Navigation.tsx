import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Book, Home, Music, Calendar, Settings, BookOpen } from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';

export function Navigation() {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`bg-white dark:bg-gray-800 shadow z-20 w-full ${
      isSticky ? "sticky top-0 shadow-md" : ""
    }`}>
      {/* Desktop Navigation */}
      <div className="container mx-auto px-4">
        <div className="hidden sm:flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold">Conexão Jovem</h1>
          </div>
          
          <div className="flex items-center space-x-6">
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
              to="/biblia"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`
              }
            >
              <Book className="w-5 h-5 mr-1.5" />
              <span>Bíblia</span>
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
            
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`
              }
            >
              <Settings className="w-5 h-5 mr-1.5" />
              <span>Admin</span>
            </NavLink>
          </div>
          <ThemeSwitcher />
        </div>
      </div>
      
      {/* Mobile Navigation - completely separate */}
      <div className="sm:hidden">
        <div className="py-3 text-center flex items-center justify-between px-4">
          <h1 className="text-xl font-bold">Conexão Jovem</h1>
          <ThemeSwitcher />
        </div>
        
        <div className="grid grid-cols-5 border-t border-gray-200 dark:border-gray-700">
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
            to="/biblia"
            className={({ isActive }) =>
              `flex flex-col items-center py-2 ${
                isActive ? 'text-primary' : 'text-gray-600 dark:text-gray-400'
              }`
            }
          >
            <Book className="w-5 h-5" />
            <span className="text-xs mt-1">Bíblia</span>
          </NavLink>
          
          <NavLink
            to="/playlists"
            className={({ isActive }) =>
              `flex flex-col items-center py-2 ${
                isActive ? 'text-primary' : 'text-gray-600 dark:text-gray-400'
              }`
            }
          >
            <Music className="w-5 h-5" />
            <span className="text-xs mt-1">Playlists</span>
          </NavLink>
          
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex flex-col items-center py-2 ${
                isActive ? 'text-primary' : 'text-gray-600 dark:text-gray-400'
              }`
            }
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs mt-1">Admin</span>
          </NavLink>
        </div>
      </div>
    </nav>
  );
}