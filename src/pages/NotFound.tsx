import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  const location = useLocation();
  
  useEffect(() => {
    document.title = "Conexão Jovem | Página não encontrada";
    console.log(`404 Error: User attempted to access non-existent route: ${location.pathname}`);
  }, [location]);

  return (
    <div className="container flex flex-col items-center justify-center py-16 text-center">
      <h1 className="text-9xl font-extrabold text-gray-200 dark:text-gray-800">404</h1>
      <h2 className="mt-8 text-3xl font-bold">Página não encontrada</h2>
      <p className="mt-4 max-w-md text-center text-muted-foreground">
        A página que você está procurando não existe ou foi movida para outro endereço.
      </p>
      <Button asChild className="mt-8">
        <Link to="/" className="flex items-center">
          <Home className="mr-2 h-4 w-4" />
          Voltar para a página inicial
        </Link>
      </Button>
    </div>
  );
}
