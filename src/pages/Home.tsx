import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Home() {
  useEffect(() => {
    document.title = "Conexão Jovem | Início";
  }, []);

  return (
    <div className="container py-8 md:py-12 lg:py-16">
      <div className="flex flex-col items-center text-center">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
          Bem-vindos à Conexão Jovem
        </h1>
        <p className="mt-4 max-w-[700px] text-lg text-muted-foreground">
          Um espaço para os jovens se conectarem, aprenderem e crescerem na fé juntos.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button asChild size="lg">
            <Link to="/events">
              Próximos Eventos
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/devotional">
              Devocional Diário
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 