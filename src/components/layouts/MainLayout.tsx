import { Outlet } from 'react-router-dom';
import { MainNavigation } from '@/components/MainNavigation';

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <MainNavigation />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="py-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Conexão Jovem
      </footer>
    </div>
  );
} 