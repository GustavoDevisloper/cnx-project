import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { LogIn, LogOut, Music } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import * as SpotifyAPI from "@/services/spotifyServiceReal";

interface SpotifyLoginProps {
  onLoginChange?: () => void;
  className?: string;
}

export function SpotifyLogin({ onLoginChange, className }: SpotifyLoginProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Verificar status da API ao carregar o componente
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const available = await SpotifyAPI.isApiAvailable();
        setIsLoggedIn(available);
      } catch (error) {
        console.error("Erro ao verificar API:", error);
        setIsLoggedIn(false);
      }
    };
    
    checkApiStatus();
  }, []);
  
  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // Tenta obter um token de acesso
      const token = await SpotifyAPI.getAccessToken();
      
      if (token) {
        setIsLoggedIn(true);
        if (onLoginChange) onLoginChange();
        toast({
          title: "Conectado ao Spotify",
          description: "API do Spotify conectada com sucesso"
        });
      } else {
        throw new Error("Não foi possível obter token de acesso");
      }
    } catch (error) {
      console.error("Erro ao conectar:", error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar à API do Spotify. Verifique as credenciais.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = () => {
    SpotifyAPI.logout();
    setIsLoggedIn(false);
    if (onLoginChange) onLoginChange();
    toast({
      title: "Desconectado do Spotify",
      description: "Conexão com Spotify encerrada"
    });
  };
  
  return isLoggedIn ? (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleLogout}
      className={`text-green-600 border-green-600 ${className}`}
    >
      <LogOut className="w-4 h-4 mr-2" />
      Desconectar do Spotify
    </Button>
  ) : (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleLogin}
      className={`text-green-600 border-green-600 ${className}`}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Music className="w-4 h-4 mr-2 animate-pulse" />
          Conectando...
        </>
      ) : (
        <>
          <LogIn className="w-4 h-4 mr-2" />
          Conectar ao Spotify
        </>
      )}
    </Button>
  );
} 