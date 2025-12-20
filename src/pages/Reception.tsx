import { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '../components/layouts/AuthenticatedLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Search, Plus, User, Edit, Trash2 } from 'lucide-react';
import { Tutor, Animal } from '../types';
import { TutorFormModal } from '../components/TutorFormModal';
import { AnimalFormModal } from '../components/AnimalFormModal';
import { getSpeciesIcon } from '../utils/getSpeciesIcon';
import { maskPhone } from '../utils/validationsMasks';

export function Reception() {
  const { currentClinicId } = useAuth();
  const [tutors, setTutors] = useState<(Tutor & { animals: Animal[] })[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [tutorModalOpen, setTutorModalOpen] = useState(false);
  const [animalModalOpen, setAnimalModalOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | undefined>();
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | undefined>();
  const [selectedTutorForAnimal, setSelectedTutorForAnimal] = useState<
    string | undefined
  >();

  useEffect(() => {
    if (!currentClinicId) return;
    fetchTutors();
  }, [currentClinicId]);

  const fetchTutors = async () => {
    if (!currentClinicId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: tutorsData, error } = await supabase
        .from('tutors')
        .select('*')
        .eq('clinic_id', currentClinicId)
        .order('name');

      if (error) {
        console.error('Error fetching tutors:', error);
        alert(`Erro ao buscar tutores: ${error.message}`);
        return;
      }

      if (tutorsData) {
        const tutorsWithAnimals = await Promise.all(
          tutorsData.map(async (tutor) => {
            const { data: animals } = await supabase
              .from('animals')
              .select('*')
              .eq('tutor_id', tutor.id);
            return { ...tutor, animals: animals || [] };
          })
        );
        setTutors(tutorsWithAnimals);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewTutor = () => {
    setSelectedTutor(undefined);
    setTutorModalOpen(true);
  };

  const handleEditTutor = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setTutorModalOpen(true);
  };

  const handleNewAnimal = (tutorId: string) => {
    setSelectedAnimal(undefined);
    setSelectedTutorForAnimal(tutorId);
    setAnimalModalOpen(true);
  };

  const handleEditAnimal = (animal: Animal) => {
    setSelectedAnimal(animal);
    setSelectedTutorForAnimal(undefined);
    setAnimalModalOpen(true);
  };

  const handleDeleteAnimal = async (animalId: string) => {
    if (confirm('Deseja realmente excluir este animal?')) {
      await supabase.from('animals').delete().eq('id', animalId);
      fetchTutors();
    }
  };

  const filteredTutors = tutors.filter(
    (tutor) =>
      tutor.name.toLowerCase().includes(search.toLowerCase()) ||
      tutor.phone?.includes(search) ||
      tutor.animals.some((animal) =>
        animal.name.toLowerCase().includes(search.toLowerCase())
      )
  );

  return (
    <AuthenticatedLayout>
      <div className="p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recepção</h1>
            <p className="text-gray-600">Gerenciar tutores e animais</p>
          </div>
          <button
            onClick={handleNewTutor}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Novo Tutor
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por tutor, animal ou telefone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Carregando...</p>
          </div>
        ) : filteredTutors.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Nenhum tutor cadastrado</p>
            <p className="text-sm text-gray-400">
              Comece cadastrando o primeiro tutor da clínica
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTutors.map((tutor) => (
              <div
                key={tutor.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {tutor.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {tutor.phone ? maskPhone(tutor.phone) : 'Sem telefone'}
                      </p>
                      {tutor.email && (
                        <p className="text-sm text-gray-500">{tutor.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditTutor(tutor)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                      title="Editar tutor"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleNewAnimal(tutor.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded"
                      title="Adicionar animal"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {tutor.animals.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Animais:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {tutor.animals.map((animal) => (
                        <div
                          key={animal.id}
                          className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100"
                        >
                          <div className="flex items-center gap-2">
                            {getSpeciesIcon(animal.species)}
                            <span className="text-sm text-gray-700">
                              {animal.name}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditAnimal(animal)}
                              className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                              title="Editar"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteAnimal(animal.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Excluir"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <TutorFormModal
          isOpen={tutorModalOpen}
          onClose={() => setTutorModalOpen(false)}
          onSuccess={fetchTutors}
          tutor={selectedTutor}
        />

        <AnimalFormModal
          isOpen={animalModalOpen}
          onClose={() => setAnimalModalOpen(false)}
          onSuccess={fetchTutors}
          animal={selectedAnimal}
          tutorId={selectedTutorForAnimal}
        />
      </div>
    </AuthenticatedLayout>
  );
}
