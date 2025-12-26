import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  LogOut,
  Calendar,
  Users,
  Dog,
  ClipboardList,
  Check,
  X,
  Plus,
  Edit,
  Key,
} from 'lucide-react';
import { TutorFormModal } from '../components/TutorFormModal';
import { AnimalFormModal } from '../components/AnimalFormModal';

interface Receptionist {
  id: string;
  name: string;
  email: string;
  clinic_id: string;
}

interface AppointmentRequest {
  id: string;
  requested_date: string;
  requested_time: string;
  notes: string;
  status: string;
  created_at: string;
  animal: {
    name: string;
    species: string;
  };
  tutor: {
    name: string;
    phone: string;
  };
  veterinarian: {
    name: string;
  } | null;
}

interface Appointment {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  notes: string;
  animal: {
    name: string;
    species: string;
  };
  tutor: {
    name: string;
    phone: string;
  };
  veterinarian: {
    name: string;
  } | null;
}

interface Tutor {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  address: string;
}

interface Animal {
  id: string;
  name: string;
  species: string;
  breed: string;
  birth_date: string;
  tutor: {
    name: string;
  };
}

export function ReceptionPortal() {
  const [receptionist, setReceptionist] = useState<Receptionist | null>(null);
  const [activeTab, setActiveTab] = useState<
    'requests' | 'calendar' | 'tutors' | 'animals'
  >('requests');
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTutorModal, setShowTutorModal] = useState(false);
  const [showAnimalModal, setShowAnimalModal] = useState(false);
  const [editingTutor, setEditingTutor] = useState<Tutor | null>(null);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadReceptionistData();
  }, []);

  const loadReceptionistData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate('/receptionist-login');
        return;
      }

      const { data: receptionistData } = await supabase
        .from('receptionists')
        .select('id, name, email, clinic_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!receptionistData) {
        navigate('/receptionist-login');
        return;
      }

      setReceptionist(receptionistData);
      await loadRequests(receptionistData.clinic_id);
      await loadAppointments(receptionistData.clinic_id);
      await loadTutors(receptionistData.clinic_id);
      await loadAnimals(receptionistData.clinic_id);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRequests = async (clinicId: string) => {
    const { data } = await supabase
      .from('appointment_requests')
      .select(
        `
        id,
        requested_date,
        requested_time,
        notes,
        status,
        created_at,
        animal:animals(name, species),
        tutor:tutors(name, phone),
        veterinarian:veterinarians(name)
      `
      )
      .eq('clinic_id', clinicId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (data) setRequests(data as any);
  };

  const loadAppointments = async (clinicId: string) => {
    const { data } = await supabase
      .from('appointments')
      .select(
        `
        id,
        scheduled_at,
        duration_minutes,
        status,
        notes,
        animal:animals(name, species),
        tutor:tutors(name, phone),
        veterinarian:veterinarians(name)
      `
      )
      .eq('clinic_id', clinicId)
      .order('scheduled_at', { ascending: true });

    if (data) setAppointments(data as any);
  };

  const loadTutors = async (clinicId: string) => {
    const { data } = await supabase
      .from('tutors')
      .select('id, name, email, phone, cpf, address, number')
      .eq('clinic_id', clinicId)
      .order('name');

    if (data) setTutors(data);
  };

  const loadAnimals = async (clinicId: string) => {
    const { data } = await supabase
      .from('animals')
      .select(
        `
        id,
        name,
        species,
        breed,
        birth_date,
        tutor:tutors(name)
      `
      )
      .eq('clinic_id', clinicId)
      .order('name');

    if (data) setAnimals(data as any);
  };

  const handleApprove = async (request: AppointmentRequest) => {
    if (!receptionist) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('appointments').insert({
        clinic_id: receptionist.clinic_id,
        animal_id: request.animal,
        veterinarian_id: request.veterinarian?.name || null,
        scheduled_at: `${request.requested_date}T${request.requested_time}`,
        duration_minutes: 30,
        status: 'confirmed',
        notes: request.notes,
      });

      await supabase
        .from('appointment_requests')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      await loadRequests(receptionist.clinic_id);
      await loadAppointments(receptionist.clinic_id);
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (request: AppointmentRequest) => {
    if (!receptionist) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('appointment_requests')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: 'Horário indisponível',
        })
        .eq('id', request.id);

      await loadRequests(receptionist.clinic_id);
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/receptionist-login');
  };

  const handlePasswordChange = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      alert('Senha alterada com sucesso!');
      setShowPasswordChange(false);
      setNewPassword('');
    } catch (error: any) {
      alert('Erro ao alterar senha: ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <ClipboardList className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Portal da Recepção
                </h1>
                <p className="text-sm text-gray-600">{receptionist?.name}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <Key className="h-5 w-5" />
                Alterar Senha
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <LogOut className="h-5 w-5" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {showPasswordChange && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">Alterar Senha</h3>
            <div className="flex gap-2">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nova senha"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
              <button
                onClick={handlePasswordChange}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setShowPasswordChange(false);
                  setNewPassword('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {[
            { id: 'requests', label: 'Solicitações', icon: ClipboardList },
            { id: 'calendar', label: 'Agenda', icon: Calendar },
            { id: 'tutors', label: 'Tutores', icon: Users },
            { id: 'animals', label: 'Animais', icon: Dog },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'requests' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                Solicitações Pendentes
              </h2>
              {requests.length === 0 ? (
                <p className="text-gray-500">Nenhuma solicitação pendente</p>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div
                      key={request.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">
                              {request.animal.name}
                            </span>
                            <span className="text-sm text-gray-500">
                              ({request.animal.species})
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>
                              Tutor: {request.tutor.name} -{' '}
                              {request.tutor.phone}
                            </div>
                            <div>
                              Data:{' '}
                              {new Date(
                                request.requested_date
                              ).toLocaleDateString('pt-BR')}
                            </div>
                            <div>Horário: {request.requested_time}</div>
                            {request.veterinarian && (
                              <div>
                                Veterinário: {request.veterinarian.name}
                              </div>
                            )}
                            {request.notes && (
                              <div>Observações: {request.notes}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(request)}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1"
                          >
                            <Check className="h-4 w-4" />
                            Aprovar
                          </button>
                          <button
                            onClick={() => handleReject(request)}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1"
                          >
                            <X className="h-4 w-4" />
                            Rejeitar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                Agenda de Consultas
              </h2>
              {appointments.length === 0 ? (
                <p className="text-gray-500">Nenhuma consulta agendada</p>
              ) : (
                <div className="space-y-2">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold">
                            {appointment.animal.name} (
                            {appointment.animal.species})
                          </div>
                          <div className="text-sm text-gray-600">
                            {new Date(appointment.scheduled_at).toLocaleString(
                              'pt-BR'
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            Tutor: {appointment.tutor.name}
                          </div>
                          {appointment.veterinarian && (
                            <div className="text-sm text-gray-600">
                              Veterinário: {appointment.veterinarian.name}
                            </div>
                          )}
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            appointment.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : appointment.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tutors' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Tutores</h2>
                <button
                  onClick={() => {
                    setEditingTutor(null);
                    setShowTutorModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  <Plus className="h-5 w-5" />
                  Novo Tutor
                </button>
              </div>
              <div className="overflow-x-auto">
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
                        Telefone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        CPF
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Endereço
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tutors.map((tutor) => (
                      <tr key={tutor.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {tutor.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {tutor.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {tutor.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {tutor.cpf}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {tutor.address}
                          {tutor.number ? `, ${tutor.number}` : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => {
                              setEditingTutor(tutor);
                              setShowTutorModal(true);
                            }}
                            className="text-emerald-600 hover:text-emerald-900"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'animals' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Animais</h2>
                <button
                  onClick={() => {
                    setEditingAnimal(null);
                    setShowAnimalModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  <Plus className="h-5 w-5" />
                  Novo Animal
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Espécie
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Raça
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tutor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Data Nasc.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {animals.map((animal) => (
                      <tr key={animal.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {animal.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {animal.species}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {animal.breed}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {animal.tutor.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(animal.birth_date).toLocaleDateString(
                            'pt-BR'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => {
                              setEditingAnimal(animal);
                              setShowAnimalModal(true);
                            }}
                            className="text-emerald-600 hover:text-emerald-900"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {showTutorModal && (
        <TutorFormModal
          tutor={editingTutor}
          onClose={() => {
            setShowTutorModal(false);
            setEditingTutor(null);
          }}
          onSuccess={() => {
            loadTutors(receptionist!.clinic_id);
            setShowTutorModal(false);
            setEditingTutor(null);
          }}
        />
      )}

      {showAnimalModal && (
        <AnimalFormModal
          animal={editingAnimal}
          onClose={() => {
            setShowAnimalModal(false);
            setEditingAnimal(null);
          }}
          onSuccess={() => {
            loadAnimals(receptionist!.clinic_id);
            setShowAnimalModal(false);
            setEditingAnimal(null);
          }}
        />
      )}
    </div>
  );
}
