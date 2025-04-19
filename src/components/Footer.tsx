import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Instagram, Youtube } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border py-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-lg font-medium mb-4">Conexão Jovem</h3>
            <p className="text-muted-foreground text-sm">
              Um espaço de conexão e crescimento espiritual para jovens cristãos.
            </p>
          </div>
          
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-lg font-medium mb-4">Links Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-muted-foreground hover:text-foreground">
                  Eventos
                </Link>
              </li>
              <li>
                <Link to="/questions" className="text-muted-foreground hover:text-foreground">
                  Dúvidas
                </Link>
              </li>
              <li>
                <Link to="/bible" className="text-muted-foreground hover:text-foreground">
                  Bíblia
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-lg font-medium mb-4">Recursos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/devotional" className="text-muted-foreground hover:text-foreground">
                  Devocionais
                </Link>
              </li>
              <li>
                <Link to="/playlists" className="text-muted-foreground hover:text-foreground">
                  Playlists
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-lg font-medium mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-foreground">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground">
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-sm text-muted-foreground">© {currentYear} Conexão Jovem. Todos os direitos reservados.</p>
            <p className="mt-1 text-sm text-muted-foreground">Desenvolvido por Gustavo | @_ogustah.</p>
          </div>
          <div className="flex items-center gap-4">
            {/* <a href="https://github.com/GustavoDevisloper" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
              <Github className="h-5 w-5" />
              <span className="sr-only">Github</span>
            </a> */}
            <a href="https://www.instagram.com/cnxvidanova" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
              <Instagram className="h-5 w-5" />
              <span className="sr-only">Instagram</span>
            </a>
            {/* <a href="https://youtube.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
              <Youtube className="h-5 w-5" />
              <span className="sr-only">YouTube</span>
            </a> */}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
} 