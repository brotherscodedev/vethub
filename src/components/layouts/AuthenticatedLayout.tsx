import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Activity,
  Menu,
  X,
  LogOut,
  Settings,
  Users,
  Calendar,
  FileText,
  Pill,
  Stethoscope,
  ShoppingCart,
  BarChart3,
  UserCog,
} from 'lucide-react';

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, profile, clinics, currentClinicId } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/clinic/dashboard' },
    { icon: Users, label: 'Recepção', path: '/clinic/reception' },
    { icon: Calendar, label: 'Agenda', path: '/clinic/appointments' },
    { icon: UserCog, label: 'Veterinários', path: '/clinic/veterinarians' },
    { icon: Stethoscope, label: 'Prontuários', path: '/clinic/medical-records' },
    { icon: Pill, label: 'Prescrições', path: '/clinic/prescriptions' },
    { icon: FileText, label: 'Carteira de Vacinas', path: '/clinic/vaccinations' },
    { icon: ShoppingCart, label: 'PDV', path: '/clinic/pdv' },
    { icon: Settings, label: 'Configurações', path: '/clinic/settings' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const currentClinic = clinics.find((c) => c.clinic_id === currentClinicId);

  return (
    <div className="flex h-screen bg-gray-100">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-900 text-white transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6" />
              <span className="font-bold">VetHub</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-gray-800 rounded"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                location.pathname === item.path ? 'bg-blue-600' : 'hover:bg-gray-800'
              }`}
              title={!sidebarOpen ? item.label : ''}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition"
            title={!sidebarOpen ? 'Sair' : ''}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Sair</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              {currentClinic && (
                <h1 className="text-xl font-bold text-gray-900">{currentClinic.clinic_name}</h1>
              )}
              <p className="text-sm text-gray-600">{profile?.full_name || user?.email}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
