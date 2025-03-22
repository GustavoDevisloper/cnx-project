import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import NavbarNew from "@/components/NavbarNew";
import Footer from "@/components/Footer";
import SupabaseWarning from "@/components/SupabaseWarning";
import { checkAuthStatus } from "@/lib/supabase";

export default function MainLayout() {
  useEffect(() => {
    // Limpar quaisquer flags persistentes quando o layout é montado
    if (window.sessionStorage.getItem('logout_in_progress') === 'true') {
      console.log("🚫 Removendo flag de logout persistente no carregamento do app");
      window.sessionStorage.removeItem('logout_in_progress');
    }
    
    // Limpar também flag de registro persistente se existir
    if (window.sessionStorage.getItem('registration_in_progress') === 'true') {
      console.log("🚫 Removendo flag de registro persistente no carregamento do app");
      window.sessionStorage.removeItem('registration_in_progress');
    }
    
    // Limpar flag de login em andamento
    if (window.sessionStorage.getItem('login_in_progress') === 'true') {
      console.log("🚫 Removendo flag de login persistente no carregamento do app");
      window.sessionStorage.removeItem('login_in_progress');
    }
    
    // Verificar estado de autenticação ao montar o componente
    checkAuthStatus()
      .then(isAuthenticated => {
        console.log("🔒 Estado de autenticação verificado:", isAuthenticated ? "Autenticado" : "Não autenticado");
      })
      .catch(error => {
        console.error("❌ Erro ao verificar estado de autenticação:", error);
      });
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <NavbarNew />
      <main className="flex-1 pt-28">
        <Outlet />
      </main>
      <Footer />
      <SupabaseWarning />
    </div>
  );
} 