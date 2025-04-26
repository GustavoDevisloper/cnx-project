import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider as CustomThemeProvider } from "@/contexts/ThemeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastifyContainer } from "@/components/ui/react-toastify";
import { AuthProvider } from "@/hooks/auth";
import MainLayout from "@/layouts/MainLayout";
import Index from "@/pages/Index";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Events from "@/pages/Events";
import EventDetail from "@/pages/EventDetail";
import CreateEvent from "@/pages/CreateEvent";
import Playlists from "@/pages/Playlists";
import SpotifyCallback from "@/pages/SpotifyCallback";
import Contact from "@/pages/Contact";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Logout from "@/pages/Logout";
import Profile from "@/pages/Profile";
import AuthCallback from "@/pages/AuthCallback";
import NotFound from "@/pages/NotFound";
import Questions from "@/pages/Questions";
import QuestionDetail from "@/pages/QuestionDetail";
import PrivateRoute from "@/components/PrivateRoute";
import PublicOnlyRoute from "@/layouts/PublicOnlyRoute";
import { TooltipProvider } from "@/components/ui/tooltip";
import DevTools from "@/pages/DevTools";
import UpdateAdminRole from "@/pages/UpdateAdminRole";
import DBSchemaCheck from "@/pages/DBSchemaCheck";
import BiblePage from "@/pages/BiblePage";
import FixPolicies from "@/pages/FixPolicies";
import DevotionalDetail from "@/pages/DevotionalDetail";
import DevotionalNew from "@/pages/DevotionalNew";
import { syncPendingProfileUpdates } from "@/services/authService";
import { syncPendingDevotionals, syncPendingComments } from "@/services/devotionalService";
import NotificationTest from "@/pages/NotificationTest";
import EventForm from "@/pages/EventForm";
import UserProfile from "@/pages/UserProfile";
import UserSearch from './pages/UserSearch';
import TestPage from "@/pages/TestPage";
import { initializeBackgroundTasks, shutdownBackgroundTasks } from './lib/startupTasks';
import { logger } from './lib/utils';

// Lazy load admin pages para melhorar performance
const Admin = React.lazy(() => import("@/pages/Admin"));
const Devotional = React.lazy(() => import("@/pages/Devotional"));

// Configuração do React Query
const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    // Sincronizar atualizações pendentes ao iniciar
    if (window.navigator.onLine) {
      setTimeout(() => {
        // Sincronizar perfis pendentes
        syncPendingProfileUpdates().then(updated => {
          if (updated) {
            console.log("✅ Perfis pendentes foram sincronizados");
          }
        });
        
        // Sincronizar devocionais pendentes
        syncPendingDevotionals().then(updated => {
          if (updated) {
            console.log("✅ Devocionais pendentes foram sincronizados");
          }
        });
        
        // Sincronizar comentários pendentes
        syncPendingComments().then(updated => {
          if (updated) {
            console.log("✅ Comentários pendentes foram sincronizados");
          }
        });
      }, 5000); // Atraso de 5 segundos após carregar a aplicação
    }
    
    // Configurar listeners para eventos de online para sincronizar dados
    const handleOnline = () => {
      console.log("🌐 Conexão restaurada, sincronizando dados pendentes...");
      
      // Tentar sincronizar todos os tipos de dados pendentes
      syncPendingProfileUpdates();
      syncPendingDevotionals();
      syncPendingComments();
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Inicializa tarefas de background quando o app é montado
  useEffect(() => {
    // Inicializa tarefas de fundo, incluindo o agendador de mensagens WhatsApp
    try {
      logger.log('Inicializando aplicação...');
      initializeBackgroundTasks();
    } catch (error) {
      logger.error('Erro ao inicializar tarefas de fundo:', error);
    }

    // Cleanup: para o agendador quando o componente é desmontado
    return () => {
      try {
        logger.log('Finalizando aplicação...');
        shutdownBackgroundTasks();
      } catch (error) {
        logger.error('Erro ao finalizar tarefas de fundo:', error);
      }
    };
  }, []);

  return (
    <CustomThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Rotas públicas - não requerem autenticação */}
                <Route path="login" element={
                  <PublicOnlyRoute>
                    <Login />
                  </PublicOnlyRoute>
                } />
                
                <Route path="register" element={
                  <PublicOnlyRoute>
                    <Register />
                  </PublicOnlyRoute>
                } />
                
                <Route path="auth/callback" element={<AuthCallback />} />
                <Route path="callback" element={<SpotifyCallback />} />
                
                {/* Layout principal - todas as rotas dentro deste layout usam MainLayout */}
                <Route path="/" element={<MainLayout />}>
                  {/* Página inicial protegida - redireciona para login se não autenticado */}
                  <Route index element={
                    <PrivateRoute>
                      <Home />
                    </PrivateRoute>
                  } />
                  
                  {/* Rotas básicas - todas protegidas por autenticação */}
                  <Route path="about" element={
                    <PrivateRoute>
                      <About />
                    </PrivateRoute>
                  } />
                  
                  <Route path="events" element={
                    <PrivateRoute>
                      <Events />
                    </PrivateRoute>
                  } />
                  
                  <Route path="events/:id" element={
                    <PrivateRoute>
                      <EventDetail />
                    </PrivateRoute>
                  } />
                  
                  <Route path="events/new" element={
                    <PrivateRoute requireAdmin>
                      <CreateEvent />
                    </PrivateRoute>
                  } />
                  
                  <Route path="playlists" element={
                    <PrivateRoute>
                      <Playlists />
                    </PrivateRoute>
                  } />
                  
                  <Route path="questions" element={
                    <PrivateRoute>
                      <Questions />
                    </PrivateRoute>
                  } />
                  
                  <Route path="questions/:id" element={
                    <PrivateRoute requireLeader>
                      <QuestionDetail />
                    </PrivateRoute>
                  } />
                  
                  <Route path="contact" element={
                    <PrivateRoute>
                      <Contact />
                    </PrivateRoute>
                  } />
                  
                  <Route path="logout" element={<Logout />} />
                  
                  <Route path="profile" element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  } />
                  
                  <Route path="profile/:userId" element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  } />
                  
                  <Route path="biblia" element={
                    <PrivateRoute>
                      <BiblePage />
                    </PrivateRoute>
                  } />
                  
                  {/* Rotas admin protegidas com lazy loading */}
                  <Route path="admin" element={
                    <React.Suspense fallback={<div>Carregando...</div>}>
                      <PrivateRoute requireLeader>
                        <Admin />
                      </PrivateRoute>
                    </React.Suspense>
                  } />
                  
                  {/* Devotional routes - agora também protegidas */}
                  <Route path="devotional" element={
                    <React.Suspense fallback={<div>Carregando...</div>}>
                      <PrivateRoute>
                        <Devotional />
                      </PrivateRoute>
                    </React.Suspense>
                  } />
                  
                  <Route path="devotional/new" element={
                    <PrivateRoute requireAdmin>
                      <React.Suspense fallback={<div>Carregando...</div>}>
                        <DevotionalNew />
                      </React.Suspense>
                    </PrivateRoute>
                  } />
                  
                  <Route path="devotional/:id" element={
                    <React.Suspense fallback={<div>Carregando...</div>}>
                      <PrivateRoute>
                        <DevotionalDetail />
                      </PrivateRoute>
                    </React.Suspense>
                  } />
                  
                  {/* Rota de desenvolvimento - Remover em produção */}
                  <Route path="dev-tools" element={
                    <PrivateRoute requireAdmin>
                      <DevTools />
                    </PrivateRoute>
                  } />
                  
                  <Route path="update-admin" element={
                    <PrivateRoute requireAdmin>
                      <UpdateAdminRole />
                    </PrivateRoute>
                  } />
                  
                  <Route path="db-schema" element={
                    <PrivateRoute requireAdmin>
                      <DBSchemaCheck />
                    </PrivateRoute>
                  } />
                  
                  <Route path="fix-policies" element={
                    <PrivateRoute requireAdmin>
                      <FixPolicies />
                    </PrivateRoute>
                  } />
                  
                  <Route path="test-notifications" element={
                    <PrivateRoute requireAdmin>
                      <NotificationTest />
                    </PrivateRoute>
                  } />

                  {/* Add redirect from devotionals to devotional */}
                  <Route path="devotionals" element={<Navigate to="/devotional" replace />} />

                  <Route path="/admin/events/new" element={
                    <PrivateRoute requireAdmin>
                      <EventForm />
                    </PrivateRoute>
                  } />
                  
                  <Route path="/admin/events/:eventId" element={
                    <PrivateRoute requireAdmin>
                      <EventForm />
                    </PrivateRoute>
                  } />
                  
                  <Route path="/admin/users/:userId" element={
                    <PrivateRoute requireAdmin>
                      <UserProfile />
                    </PrivateRoute>
                  } />
                  
                  <Route path="/admin/users" element={
                    <PrivateRoute requireAdmin>
                      <UserSearch />
                    </PrivateRoute>
                  } />
                  
                  <Route path="/test" element={
                    <PrivateRoute requireAdmin>
                      <TestPage />
                    </PrivateRoute>
                  } />
                  
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
            <ToastifyContainer />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </CustomThemeProvider>
  );
}

export default App;
