import { AuthenticatedLayout } from '../components/layouts/AuthenticatedLayout';
import { Settings as SettingsIcon } from 'lucide-react';

export function Settings() {
  return (
    <AuthenticatedLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600">Gerenciar clínica, usuários e permissões</p>
        </div>

        <div className="bg-white rounded-lg shadow p-12 text-center">
          <SettingsIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Módulo de Configurações</p>
          <p className="text-sm text-gray-400">Em desenvolvimento</p>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
