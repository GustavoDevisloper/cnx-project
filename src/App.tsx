import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider as CustomThemeProvider } from "@/contexts/ThemeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
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
import { TooltipProvider } from "@/components/ui/tooltip";
import DevTools from "@/pages/DevTools";
import UpdateAdminRole from "@/pages/UpdateAdminRole";
import DBSchemaCheck from "@/pages/DBSchemaCheck";
import BiblePage from "@/pages/BiblePage";
import FixPolicies from "@/pages/FixPolicies";
import DevotionalDetail from "@/pages/DevotionalDetail";
import DevotionalNew from "@/pages/DevotionalNew";
import { syncPendingProfileUpdates } from "@/services/authService";
import { syncPendingDevotionals } from "@/services/devotionalService";

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
      }, 5000); // Atraso de 5 segundos após carregar a aplicação
    }
  }, []);

  return (
    <CustomThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Home />} />
                  <Route path="about" element={<About />} />
                  <Route path="events" element={<Events />} />
                  <Route path="events/:id" element={<EventDetail />} />
                  <Route path="events/new" element={
                    <PrivateRoute requireAdmin>
                      <CreateEvent />
                    </PrivateRoute>
                  } />
                  <Route path="playlists" element={
                    <PrivateRoute requireLeader>
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
                  <Route path="callback" element={<SpotifyCallback />} />
                  <Route path="auth/callback" element={<AuthCallback />} />
                  <Route path="contact" element={<Contact />} />
                  <Route path="login" element={<Login />} />
                  <Route path="register" element={<Register />} />
                  <Route path="logout" element={<Logout />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="profile/:userId" element={<Profile />} />
                  <Route path="biblia" element={<BiblePage />} />
                  
                  {/* Rotas admin protegidas com lazy loading */}
                  <Route path="admin" element={
                    <React.Suspense fallback={<div>Carregando...</div>}>
                      <PrivateRoute requireLeader>
                        <Admin />
                      </PrivateRoute>
                    </React.Suspense>
                  } />
                  
                  {/* Devotional routes - available to all users */}
                  <Route path="devotional" element={
                    <React.Suspense fallback={<div>Carregando...</div>}>
                      <Devotional />
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
                      <DevotionalDetail />
                    </React.Suspense>
                  } />
                  
                  {/* Rota de desenvolvimento - Remover em produção */}
                  <Route path="dev-tools" element={<DevTools />} />
                  <Route path="update-admin" element={<UpdateAdminRole />} />
                  <Route path="db-schema" element={<DBSchemaCheck />} />
                  <Route path="fix-policies" element={<FixPolicies />} />

                  {/* Add redirect from devotionals to devotional */}
                  <Route path="devotionals" element={<Navigate to="/devotional" replace />} />

                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </CustomThemeProvider>
  );
}

export default App;
