import { Button } from "@/components/ui/button";
import { getAuthUrl, isAuthenticated as isSpotifyAuthenticated, logout } from "@/services/spotifyService";
import { LogIn, LogOut, Music } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

interface SpotifyLoginProps {
  onLoginChange?: () => void;
}

export function SpotifyLogin({ onLoginChange }: SpotifyLoginProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const handleLogin = () => {
    // Apenas para teste, não faz autenticação real
    setIsLoggedIn(true);
    localStorage.setItem("spotify_fake_auth", "true");
    if (onLoginChange) onLoginChange();
    toast({
      title: "Conectado ao Spotify",
      description: "Modo de demonstração ativado"
    });
  };
  
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("spotify_fake_auth");
    if (onLoginChange) onLoginChange();
    toast({
      title: "Desconectado do Spotify",
      description: "Modo de demonstração desativado"
    });
  };
  
  // Verificar status de login simulado ao inicializar
  useEffect(() => {
    setIsLoggedIn(localStorage.getItem("spotify_fake_auth") === "true");
  }, []);
  
  return isLoggedIn ? (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleLogout}
      className="text-green-600 border-green-600"
    >
      <LogOut className="w-4 h-4 mr-2" />
      Desconectar do Spotify
    </Button>
  ) : (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleLogin}
      className="text-green-600 border-green-600"
    >
      <LogIn className="w-4 h-4 mr-2" />
      Conectar ao Spotify
    </Button>
  );
} 