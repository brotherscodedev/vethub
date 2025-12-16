import { useState, useEffect } from 'react';
import { PublicLayout } from '../components/layouts/PublicLayout';
import { Heart, Calendar, Syringe, Image } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Animal, Vaccination, MedicalRecordFile } from '../types';

export function TutorPortal() {
  const { user } = useAuth();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [files, setFiles] = useState<MedicalRecordFile[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    requested_date: '',
    requested_time: '',
    notes: '',
  });

  useEffect(() => {
    if (user) {
      fetchMyAnimals();
    }
  }, [user]);

  useEffect(() => {
    if (selectedAnimal) {
      fetchAnimalData(selectedAnimal.id);
    }
  }, [selectedAnimal]);

  const fetchMyAnimals = async () => {
    const { data: tutorData } = await supabase
      .from('tutors')
      .select('id')
      .eq('user_id', user?.id)
      .maybeSingle();

    if (tutorData) {
      const { data } = await supabase
        .from('animals')
        .select('*')
        .eq('tutor_id', tutorData.id);

      if (data && data.length > 0) {
        setAnimals(data);
        setSelectedAnimal(data[0]);
      }
    }
  };

  const fetchAnimalData = async (animalId: string) => {
    const { data: vacData } = await supabase
      .from('vaccinations')
      .select('*')
      .eq('animal_id', animalId)
      .order('administered_at', { ascending: false });

    if (vacData) setVaccinations(vacData);

    const { data: filesData } = await supabase
      .from('medical_record_files')
      .select('*')
      .eq('animal_id', animalId)
      .eq('visible_to_tutor', true)
      .order('created_at', { ascending: false });

    if (filesData) setFiles(filesData);
  };

  const handleScheduleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimal) return;

    const { data: tutorData } = await supabase
      .from('tutors')
      .select('id, clinic_id')
      .eq('user_id', user?.id)
      .maybeSingle();

    if (tutorData) {
      await supabase.from('appointment_requests').insert({
        clinic_id: tutorData.clinic_id,
        tutor_id: tutorData.id,
        animal_id: selectedAnimal.id,
        ...scheduleForm,
      });

      alert('Solicitação enviada com sucesso!');
      setShowScheduleModal(false);
      setScheduleForm({ requested_date: '', requested_time: '', notes: '' });
    }
  };

  if (!user) {
    return (
      <PublicLayout>
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12">
          <div className="text-center">
            <Heart className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Portal do Tutor</h1>
            <p className="text-gray-600 mb-8">Acesse informações do seu pet</p>
            <button
              onClick={() => (window.location.href = '/auth/login')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Fazer Login
            </button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Meus Pets</h1>
          <p className="text-gray-600">Acompanhe a saúde dos seus animais</p>
        </div>

        {animals.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum animal cadastrado</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              {animals.map((animal) => (
                <button
                  key={animal.id}
                  onClick={() => setSelectedAnimal(animal)}
                  className={`p-4 rounded-lg border-2 transition ${
                    selectedAnimal?.id === animal.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900">{animal.name}</h3>
                  <p className="text-sm text-gray-600">{animal.species}</p>
                </button>
              ))}
            </div>

            {selectedAnimal && (
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Informações</h2>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Espécie</p>
                      <p className="font-medium">{selectedAnimal.species}</p>
                    </div>
                    {selectedAnimal.breed && (
                      <div>
                        <p className="text-sm text-gray-600">Raça</p>
                        <p className="font-medium">{selectedAnimal.breed}</p>
                      </div>
                    )}
                    {selectedAnimal.weight_kg && (
                      <div>
                        <p className="text-sm text-gray-600">Peso</p>
                        <p className="font-medium">{selectedAnimal.weight_kg} kg</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Agendar Consulta
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Syringe className="w-5 h-5" />
                    Vacinas
                  </h2>
                  {vaccinations.length === 0 ? (
                    <p className="text-gray-500 text-sm">Nenhuma vacina registrada</p>
                  ) : (
                    <div className="space-y-3">
                      {vaccinations.slice(0, 5).map((vac) => (
                        <div key={vac.id} className="border-b pb-2">
                          <p className="font-medium text-sm">{vac.vaccine_name}</p>
                          <p className="text-xs text-gray-600">
                            {new Date(vac.administered_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    Exames e Imagens
                  </h2>
                  {files.length === 0 ? (
                    <p className="text-gray-500 text-sm">Nenhum arquivo compartilhado</p>
                  ) : (
                    <div className="space-y-2">
                      {files.map((file) => (
                        <a
                          key={file.id}
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 border rounded hover:bg-gray-50"
                        >
                          <p className="text-sm font-medium truncate">{file.file_name}</p>
                          {file.description && (
                            <p className="text-xs text-gray-600">{file.description}</p>
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {showScheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">Solicitar Agendamento</h2>
              <form onSubmit={handleScheduleRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                  <input
                    type="date"
                    value={scheduleForm.requested_date}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, requested_date: e.target.value })
                    }
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
                  <input
                    type="time"
                    value={scheduleForm.requested_time}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, requested_time: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    value={scheduleForm.notes}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    Enviar Solicitação
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
