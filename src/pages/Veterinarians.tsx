import { useState, useEffect } from 'react';
import {
  Plus,
  User,
  Mail,
  Phone,
  Stethoscope,
  Shield,
  ShieldCheck,
  Trash2,
  Edit2,
} from 'lucide-react';
import EditVeterinarianModal from '../components/EditVeterinarianModal';
import { supabase } from '../lib/supabase';
import VeterinarianFormModal from '../components/VeterinarianFormModal';
import { AuthenticatedLayout } from '../components/layouts/AuthenticatedLayout';
import { maskPhone } from '../utils/validationsMasks';

interface Veterinarian {
  id: string;
  name: string;
  email: string;
  cpf: string;
  crmv: string;
  phone: string | null;
  specialization: string | null;
  is_active: boolean;
  user_id: string | null;
  created_at: string;
}

export default function Veterinarians() {
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [clinicId, setClinicId] = useState<string>('');
  const [error, setError] = useState('');

  // Edit user modal state
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editingVeterinarian, setEditingVeterinarian] = useState<null | {
    id: string;
    name?: string;
    email?: string;
    cpf?: string;
    crmv?: string;
    phone?: string | null;
    specialization?: string | null;
    user_id?: string | null;
  }>(null);

  useEffect(() => {
    loadClinicAndVeterinarians();
  }, []);

  const loadClinicAndVeterinarians = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: clinicUser } = await supabase
        .from('clinic_users')
        .select('clinic_id')
        .eq('user_id', user.id)
        .single();

      if (!clinicUser) return;

      setClinicId(clinicUser.clinic_id);

      const { data, error } = await supabase
        .from('veterinarians')
        .select('*')
        .eq('clinic_id', clinicUser.clinic_id)
        .order('name');

      if (error) throw error;
      setVeterinarians(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createAccount = async (veterinarianId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(
        `${
          import.meta.env.VITE_SUPABASE_URL
        }/functions/v1/create-veterinarian-account`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ veterinarianId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar conta de acesso');
      }

      alert('Conta criada com sucesso! Senha inicial: CPF do veterinário');
      loadClinicAndVeterinarians();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar conta');
    }
  };

  const toggleActive = async (
    veterinarianId: string,
    currentStatus: boolean
  ) => {
    try {
      const { error } = await supabase
        .from('veterinarians')
        .update({ is_active: !currentStatus })
        .eq('id', veterinarianId);

      if (error) throw error;
      loadClinicAndVeterinarians();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar status');
    }
  };

  const deleteVeterinarian = async (veterinarianId: string) => {
    if (!confirm('Tem certeza que deseja excluir este veterinário?')) return;

    try {
      const { error } = await supabase
        .from('veterinarians')
        .delete()
        .eq('id', veterinarianId);

      if (error) throw error;
      loadClinicAndVeterinarians();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir veterinário');
    }
  };

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando...</div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Veterinários</h1>
            <p className="text-gray-600 mt-2">
              Gerencie os veterinários da clínica
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Novo Veterinário</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {veterinarians.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum veterinário cadastrado
            </h3>
            <p className="text-gray-600 mb-6">
              Comece cadastrando o primeiro veterinário da clínica
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Cadastrar Veterinário</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {veterinarians.map((vet) => (
              <div
                key={vet.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {vet.name}
                      </h3>
                      <p className="text-sm text-gray-500">{vet.crmv}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {vet.user_id ? (
                      <div className="flex items-center space-x-2">
                        <div title="Tem acesso ao portal">
                          <ShieldCheck className="h-5 w-5 text-green-600" />
                        </div>
                        <button
                          onClick={() => {
                            setEditingVeterinarian({
                              id: vet.id,
                              name: vet.name,
                              email: vet.email,
                              cpf: vet.cpf,
                              crmv: vet.crmv,
                              phone: vet.phone,
                              specialization: vet.specialization,
                              user_id: vet.user_id,
                            });
                            setEditUserOpen(true);
                          }}
                          className="text-gray-400 hover:text-blue-600"
                          title="Editar usuário"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => createAccount(vet.id)}
                        className="text-gray-400 hover:text-blue-600"
                        title="Criar acesso ao portal"
                      >
                        <Shield className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="truncate">{vet.email}</span>
                  </div>
                  {vet.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{maskPhone(vet.phone)}</span>
                    </div>
                  )}
                  {vet.specialization && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Stethoscope className="h-4 w-4 mr-2" />
                      <span>{vet.specialization}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <button
                    onClick={() => toggleActive(vet.id, vet.is_active)}
                    className={`text-sm font-medium ${
                      vet.is_active
                        ? 'text-green-600 hover:text-green-700'
                        : 'text-gray-400 hover:text-gray-500'
                    }`}
                  >
                    {vet.is_active ? 'Ativo' : 'Inativo'}
                  </button>
                  <button
                    onClick={() => deleteVeterinarian(vet.id)}
                    className="text-red-600 hover:text-red-700"
                    title="Excluir veterinário"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <VeterinarianFormModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadClinicAndVeterinarians();
          }}
          clinicId={clinicId}
        />
      )}

      {editUserOpen && editingVeterinarian && (
        <EditVeterinarianModal
          isOpen={editUserOpen}
          onClose={() => setEditUserOpen(false)}
          onSuccess={() => {
            setEditUserOpen(false);
            setEditingVeterinarian(null);
            loadClinicAndVeterinarians();
          }}
          veterinarianId={editingVeterinarian.id}
          initialName={editingVeterinarian.name}
          initialEmail={editingVeterinarian.email}
          initialCPF={editingVeterinarian.cpf}
          initialCRMV={editingVeterinarian.crmv}
          initialPhone={editingVeterinarian.phone}
          initialSpecialization={editingVeterinarian.specialization}
          initialUserId={editingVeterinarian.user_id}
        />
      )}
    </AuthenticatedLayout>
  );
}
