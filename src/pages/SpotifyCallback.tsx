import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { handleRedirect } from "@/services/spotifyService";
import { Loader2, Check, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SpotifyCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  
  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        
        if (error) {
          throw new Error(`Autorização do Spotify negada: ${error}`);
        }
        
        if (!code) {
          throw new Error('Não foi possível obter o código de autorização');
        }
        
        // Aqui você faria uma chamada para seu backend para trocar o código por um token
        // Simulando um processo bem-sucedido
        setTimeout(() => {
          setStatus('success');
          // Em uma implementação real, você salvaria o token e outras informações relevantes
        }, 1500);
        
      } catch (error: any) {
        console.error('Erro na autenticação do Spotify:', error);
        setStatus('error');
        setErrorMessage(error.message || 'Ocorreu um erro durante a autenticação com o Spotify');
      }
    };
    
    processCallback();
  }, [searchParams, navigate]);
  
  const handleReturn = () => {
    navigate("/playlists");
  };
  
  if (status === "loading") {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-4">Conectando ao Spotify...</p>
      </div>
    );
  }
  
  if (status === "error") {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
        <div className="rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900 dark:text-red-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-bold">Erro de Autenticação</h1>
        <p className="mt-2 text-muted-foreground">{errorMessage}</p>
        <Button className="mt-6" onClick={handleReturn}>
          Voltar para Playlists
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
      <div className="rounded-full bg-green-100 p-3 text-green-600 dark:bg-green-900 dark:text-green-200">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="mt-4 text-2xl font-bold">Conectado ao Spotify com Sucesso!</h1>
      <p className="mt-2 text-muted-foreground">
        Sua conta do Spotify foi conectada à Conexão Jovem.
      </p>
      <Button className="mt-6" onClick={handleReturn}>
        Explorar Playlists
      </Button>
    </div>
  );
} 