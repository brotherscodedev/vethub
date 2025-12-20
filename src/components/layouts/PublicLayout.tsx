import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <Activity className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">VetHub</span>
          </div>
          <nav className="flex gap-6">
            <button
              onClick={() => navigate('/auth/login')}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/auth/signup')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
            >
              Começar Agora
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-600 text-sm">
          <p>
            &copy; {new Date().getFullYear()} VetHub. Todos os direitos
            reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
