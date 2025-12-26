import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  Stethoscope,
  FileText,
  Syringe,
  PawPrint,
  User,
  Calendar,
  ClipboardList,
  Key,
  Search,
  Plus,
  Edit,
  Clock,
  Filter
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { VetAnimalEditModal } from '../components/VetAnimalEditModal';
import { VetMedicalRecordModal } from '../components/VetMedicalRecordModal';
import { VetVaccinationModal } from '../components/VetVaccinationModal';
import { VetPrescriptionModal } from '../components/VetPrescriptionModal';

// --- Interfaces ---
interface Veterinarian {
  id: string;
  name: string;
  email: string;
  crmv: string;
  specialization: string | null;
}

interface Animal {
  id: string;
  name: string;
  species: string;
  breed: string;
  birth_date: string;
  tutor: {
    name: string;
    phone: string;
  };
}

interface Appointment {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
  animal: {
    name: string;
    species: string;
    tutor: {
      name: string;
    }
  };
}

interface MedicalRecord {
  id: string;
  date: string;
  diagnosis: string;
  treatment: string;
  notes: string | null;
  animal: {
    name: string;
    species: string;
  };
}

interface Prescription {
  id: string;
  prescribed_at: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  animal: {
    name: string;
    species: string;
  };
}

interface Vaccination {
  id: string;
  vaccine_name: string;
  date: string;
  next_dose: string | null;
  batch_number: string | null;
  animal: {
    name: string;
    species: string;
  };
}

export default function VeterinarianPortal() {
  const [veterinarian, setVeterinarian] = useState<Veterinarian | null>(null);
  const [activeTab, setActiveTab] = useState<'appointments' | 'animals' | 'records' | 'prescriptions' | 'vaccinations' | 'profile'>('appointments');
  
  // 1. CORREÇÃO: Função para pegar a data local correta (evita bug de fuso horário UTC)
  const getLocalDate = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localDate = new Date(now.getTime() - offset);
    return localDate.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getLocalDate());
  
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [editingAnimal, setEditingAnimal] = useState<any>(null);
  const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
  const [showVaccinationModal, setShowVaccinationModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const navigate = useNavigate();

  // Carrega os dados iniciais do veterinário
  useEffect(() => {
    loadVeterinarianData();
  }, []);

  // 2. CORREÇÃO: useCallback para garantir estabilidade da função
  const fetchAppointments = useCallback(async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Filtra do inicio (00:00:00) ao fim (23:59:59) do dia selecionado
        const startOfDay = `${selectedDate}T00:00:00`;
        const endOfDay = `${selectedDate}T23:59:59`;

        const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select(`
            id,
            scheduled_at,
            duration_minutes,
            status,
            notes,
            animal:animals(
              name, 
              species,
              tutor:tutors(name)
            )
        `)
        .eq('veterinarian_id', user.id)
        .gte('scheduled_at', startOfDay)
        .lte('scheduled_at', endOfDay)
        .order('scheduled_at', { ascending: true });

        if (error) throw error;
        setAppointments(appointmentsData || []);
    } catch (error) {
        console.error('Erro ao buscar agendamentos:', error);
    }
  }, [selectedDate]); // Recria a função apenas se a data mudar

  // 3. CORREÇÃO: Adicionado 'veterinarian' e 'fetchAppointments' nas dependências
  // Isso garante que a busca aconteça assim que o login for confirmado E quando a data mudar
  useEffect(() => {
    if (veterinarian) { 
       fetchAppointments();
    }
  }, [selectedDate, veterinarian, fetchAppointments]);


  const toggleAppointmentStatus = async (appointmentId: string, currentStatus: string) => {
    try {
        const newStatus = currentStatus === 'completed' ? 'scheduled' : 'completed';
        
        // Atualização Otimista
        setAppointments(prev => prev.map(apt => 
            apt.id === appointmentId ? { ...apt, status: newStatus } : apt
        ));

        const { error } = await supabase
            .from('appointments')
            .update({ status: newStatus })
            .eq('id', appointmentId);

        if (error) {
            setAppointments(prev => prev.map(apt => 
                apt.id === appointmentId ? { ...apt, status: currentStatus } : apt
            ));
            alert('Erro ao atualizar status');
            console.error(error);
        }
    } catch (error) {
        console.error('Erro:', error);
    }
  };

  const loadVeterinarianData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/veterinarian-login');
        return;
      }

      const { data: vetData, error: vetError } = await supabase
        .from('veterinarians')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (vetError || !vetData) {
        navigate('/veterinarian-login');
        return;
      }

      setVeterinarian(vetData);

      // Carrega os outros dados
      const { data: animalsData } = await supabase
        .from('animals')
        .select(`
          id,
          name,
          species,
          breed,
          birth_date,
          tutor:tutors(name, phone)
        `)
        .order('name');
      setAnimals(animalsData || []);

      const { data: recordsData } = await supabase
        .from('medical_records')
        .select(`
          id,
          date,
          diagnosis,
          treatment,
          notes,
          animal:animals(name, species)
        `)
        .order('date', { ascending: false });
      setMedicalRecords(recordsData || []);

      const { data: prescriptionsData } = await supabase
        .from('prescriptions')
        .select(`
          id,
          prescribed_at,
          medication,
          dosage,
          frequency,
          duration,
          animal:animals(name, species)
        `)
        .order('prescribed_at', { ascending: false });
      setPrescriptions(prescriptionsData || []);

      const { data: vaccinationsData } = await supabase
        .from('vaccinations')
        .select(`
          id,
          vaccine_name,
          date,
          next_dose,
          batch_number,
          animal:animals(name, species)
        `)
        .order('date', { ascending: false });
      setVaccinations(vaccinationsData || []);

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/veterinarian-login');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      alert('Senha alterada com sucesso!');
      setShowPasswordChange(false);
      setNewPassword('');
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar senha');
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendado';
      case 'confirmed': return 'Confirmado';
      case 'in_progress': return 'Em Atendimento';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      case 'reception': return 'Na Recepção';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'reception': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAnimals = animals.filter(animal =>
    animal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    animal.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
    animal.tutor.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{veterinarian?.name}</h1>
                <p className="text-xs text-gray-500">{veterinarian?.crmv}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('appointments')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'appointments'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span>Agenda</span>
            </button>
            <button
              onClick={() => setActiveTab('animals')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'animals'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <PawPrint className="h-5 w-5" />
              <span>Animais</span>
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'records'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span>Prontuários</span>
            </button>
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'prescriptions'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ClipboardList className="h-5 w-5" />
              <span>Prescrições</span>
            </button>
            <button
              onClick={() => setActiveTab('vaccinations')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'vaccinations'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Syringe className="h-5 w-5" />
              <span>Vacinas</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'profile'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <User className="h-5 w-5" />
              <span>Meu Perfil</span>
            </button>
          </div>
        </div>

        {activeTab === 'appointments' && (
          <div>
            {/* --- FILTRO DE DATA --- */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                    <Filter className="h-5 w-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Filtrar Data:</span>
                    <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                </div>
                <div className="text-sm text-gray-500">
                    Mostrando agendamentos para: <span className="font-semibold text-gray-900">{new Date(selectedDate).toLocaleDateString('pt-BR')}</span>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-700">Agendamentos do Dia</h3>
              </div>
              {appointments.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Nenhum agendamento encontrado para esta data.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16">Finalizar</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duração</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notas</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {appointments.map((apt) => {
                        const date = new Date(apt.scheduled_at);
                        const isCompleted = apt.status === 'completed';
                        
                        return (
                          <tr key={apt.id} className={isCompleted ? "bg-gray-50" : ""}>
                            {/* CHECKBOX PARA FINALIZAR */}
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <input 
                                    type="checkbox" 
                                    checked={isCompleted}
                                    onChange={() => toggleAppointmentStatus(apt.id, apt.status)}
                                    className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    title={isCompleted ? "Marcar como não finalizado" : "Finalizar consulta"}
                                />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className={`flex flex-col ${isCompleted ? "opacity-50" : ""}`}>
                                <span className="font-medium text-lg">{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className={`flex flex-col ${isCompleted ? "opacity-50" : ""}`}>
                                <span className="font-medium">{apt.animal.name}</span>
                                <span className="text-xs text-gray-500">{apt.animal.species}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className={isCompleted ? "opacity-50" : ""}>{apt.animal.tutor?.name || '-'}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className={`flex items-center ${isCompleted ? "opacity-50" : ""}`}>
                                <Clock className="w-4 h-4 mr-1" />
                                {apt.duration_minutes} min
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(apt.status)}`}>
                                {getStatusLabel(apt.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={apt.notes || ''}>
                              {apt.notes || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'animals' && (
          <div>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por animal, espécie ou tutor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAnimals.map((animal) => (
                <div key={animal.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{animal.name}</h3>
                      <p className="text-sm text-gray-500">{animal.species} - {animal.breed}</p>
                    </div>
                    <button
                      onClick={() => setEditingAnimal(animal as any)}
                      className="text-blue-600 hover:text-blue-700"
                      title="Editar animal"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      Nascimento: {new Date(animal.birth_date).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <p className="font-medium text-gray-700">Tutor</p>
                      <p className="text-gray-600">{animal.tutor.name}</p>
                      <p className="text-gray-500 text-xs">{animal.tutor.phone}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'records' && (
          <div>
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => setShowMedicalRecordModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-5 w-5" />
                Novo Prontuário
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Animal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diagnóstico</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tratamento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Observações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {medicalRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(record.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.animal.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{record.diagnosis}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{record.treatment}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{record.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          </div>
        )}

        {activeTab === 'prescriptions' && (
          <div>
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => setShowPrescriptionModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-5 w-5" />
                Nova Prescrição
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Animal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicamento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dosagem</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequência</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duração</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {prescriptions.map((prescription) => (
                    <tr key={prescription.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(prescription.prescribed_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {prescription.animal.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{prescription.medication}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{prescription.dosage}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{prescription.frequency}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{prescription.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          </div>
        )}

        {activeTab === 'vaccinations' && (
          <div>
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => setShowVaccinationModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-5 w-5" />
                Nova Vacinação
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Animal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vacina</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Próxima Dose</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lote</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vaccinations.map((vaccination) => (
                    <tr key={vaccination.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vaccination.animal.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{vaccination.vaccine_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(vaccination.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vaccination.next_dose ? new Date(vaccination.next_dose).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{vaccination.batch_number || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Meu Perfil</h2>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <p className="mt-1 text-gray-900">{veterinarian?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-gray-900">{veterinarian?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">CRMV</label>
                <p className="mt-1 text-gray-900">{veterinarian?.crmv}</p>
              </div>
              {veterinarian?.specialization && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Especialização</label>
                  <p className="mt-1 text-gray-900">{veterinarian.specialization}</p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Alterar Senha</h3>

              {!showPasswordChange ? (
                <button
                  onClick={() => setShowPasswordChange(true)}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                >
                  <Key className="h-5 w-5" />
                  <span>Alterar minha senha</span>
                </button>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nova Senha
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Digite a nova senha"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Salvar Nova Senha
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordChange(false);
                        setNewPassword('');
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {editingAnimal && (
        <VetAnimalEditModal
          animal={editingAnimal}
          onClose={() => setEditingAnimal(null)}
          onSuccess={loadVeterinarianData}
        />
      )}

      {showMedicalRecordModal && (
        <VetMedicalRecordModal
          onClose={() => setShowMedicalRecordModal(false)}
          onSuccess={loadVeterinarianData}
        />
      )}

      {showVaccinationModal && (
        <VetVaccinationModal
          onClose={() => setShowVaccinationModal(false)}
          onSuccess={loadVeterinarianData}
        />
      )}

      {showPrescriptionModal && (
        <VetPrescriptionModal
          onClose={() => setShowPrescriptionModal(false)}
          onSuccess={loadVeterinarianData}
        />
      )}
    </div>
  );
}