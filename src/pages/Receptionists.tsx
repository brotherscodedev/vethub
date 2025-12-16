import { useEffect, useState } from 'react';
import { AuthenticatedLayout } from '../components/layouts/AuthenticatedLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { UserCircle, Plus, Edit, Trash2 } from 'lucide-react';
import { ReceptionistFormModal } from '../components/ReceptionistFormModal';

interface Receptionist {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export function Receptionists() {
  const { currentClinicId } = useAuth();
  const [receptionists, setReceptionists] = useState<Receptionist[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentClinicId) return;
    loadReceptionists();
  }, [currentClinicId]);

  const loadReceptionists = async () => {
    const { data, error } = await supabase
      .from('receptionists')
      .select('*')
      .eq('clinic_id', currentClinicId)
      .order('name');

    if (data) setReceptionists(data);
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este recepcionista?')) return;

    const { error } = await supabase
      .from('receptionists')
      .delete()
      .eq('id', id);

    if (!error) {
      loadReceptionists();
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recepcionistas</h1>
            <p className="text-gray-600">Gerencie os recepcionistas da clínica</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Plus className="h-5 w-5" />
            Novo Recepcionista
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : receptionists.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <UserCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum recepcionista cadastrado
            </h3>
            <p className="text-gray-600 mb-4">
              Comece adicionando um recepcionista à sua clínica
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              <Plus className="h-5 w-5" />
              Adicionar Recepcionista
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    CPF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Telefone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {receptionists.map((receptionist) => (
                  <tr key={receptionist.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <UserCircle className="h-6 w-6 text-emerald-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {receptionist.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {receptionist.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {receptionist.cpf}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {receptionist.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          receptionist.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {receptionist.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(receptionist.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <ReceptionistFormModal
            onClose={() => setShowModal(false)}
            onSuccess={loadReceptionists}
            clinicId={currentClinicId!}
          />
        )}
      </div>
    </AuthenticatedLayout>
  );
}
