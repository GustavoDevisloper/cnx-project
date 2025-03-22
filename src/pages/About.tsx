import { useEffect } from "react";

export default function About() {
  useEffect(() => {
    document.title = "Conexão Jovem | Sobre";
  }, []);

  return (
    <div className="container py-8">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Sobre a Conexão Jovem</h1>
        <p className="text-lg text-muted-foreground">
          Conexão Jovem é um ministério dedicado ao crescimento espiritual e ao discipulado de jovens cristãos.
        </p>
        
        <div className="mt-8 space-y-4">
          <h2 className="text-2xl font-semibold">Nossa Missão</h2>
          <p>
            Conectar jovens a Cristo, à Palavra e uns aos outros, promovendo um ambiente de comunhão e crescimento espiritual.
          </p>
          
          <h2 className="text-2xl font-semibold">Nossa Visão</h2>
          <p>
            Ser uma comunidade de jovens que impacta positivamente a sociedade através de vidas transformadas pelo evangelho.
          </p>
          
          <h2 className="text-2xl font-semibold">Nossos Valores</h2>
          <ul className="ml-6 list-disc space-y-2">
            <li>Fé bíblica e prática</li>
            <li>Comunhão autêntica</li>
            <li>Discipulado intencional</li>
            <li>Serviço compassivo</li>
            <li>Evangelismo relacional</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 