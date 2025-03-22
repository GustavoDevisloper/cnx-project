import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";
import { Book, Music, User } from "lucide-react";

const Index = () => {
  useEffect(() => {
    document.title = "JovemCristo | Início";
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="px-6 py-12 md:py-20">
        <div className="max-w-5xl mx-auto text-center animate-slide-in">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Cresca na fé junto com a comunidade
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10">
            Devocionais inspiradores e músicas que elevam seu espírito
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <NavLink to="/devotional">Devocionais Diários</NavLink>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <NavLink to="/playlists">Músicas Inspiradoras</NavLink>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="px-6 py-16 md:py-24 bg-accent">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">O que oferecemos</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="glass-card rounded-xl p-8 animate-scale-in">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Book className="text-primary" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Devocionais Diários</h3>
              <p className="text-muted-foreground">
                Reflexões e estudos bíblicos para fortalecer sua caminhada espiritual diariamente.
              </p>
            </div>
            
            <div className="glass-card rounded-xl p-8 animate-scale-in" style={{ animationDelay: "0.1s" }}>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Music className="text-primary" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Playlist Inspiradora</h3>
              <p className="text-muted-foreground">
                Músicas que edificam e elevam seu espírito, com integração ao Spotify.
              </p>
            </div>
            
            <div className="glass-card rounded-xl p-8 animate-scale-in" style={{ animationDelay: "0.2s" }}>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <User className="text-primary" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Comunidade</h3>
              <p className="text-muted-foreground">
                Conecte-se com outros jovens cristãos e compartilhe sua jornada de fé.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Index;
