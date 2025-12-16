import { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '../components/layouts/AuthenticatedLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Syringe, Plus, Search, Dog, User, Calendar, Edit, Trash2 } from 'lucide-react';
import { Vaccination, Animal, Tutor } from '../types';
import { VaccinationFormModal } from '../components/VaccinationFormModal';

interface VaccinationWithDetails extends Vaccination {
  animal?: Animal & { tutor?: Tutor };
}

export function Vaccinations() {
  const { currentClinicId } = useAuth();
  const [vaccinations, setVaccinations] = useState<VaccinationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedVaccination, setSelectedVaccination] = useState<Vaccination | undefined>();

  useEffect(() => {
    if (!currentClinicId) return;
    fetchVaccinations();
  }, [currentClinicId]);

  const fetchVaccinations = async () => {
    setLoading(true);
    try {
      const { data: vaccinationsData } = await supabase
        .from('vaccinations')
        .select('*')
        .eq('clinic_id', currentClinicId)
        .order('administered_at', { ascending: false })
        .limit(100);

      if (vaccinationsData) {
        const vaccinationsWithDetails = await Promise.all(
          vaccinationsData.map(async (vac) => {
            const { data: animal } = await supabase
              .from('animals')
              .select('*, tutor:tutors(*)')
              .eq('id', vac.animal_id)
              .maybeSingle();

            return { ...vac, animal };
          })
        );
        setVaccinations(vaccinationsWithDetails);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vaccination: Vaccination) => {
    setSelectedVaccination(vaccination);
    setShowModal(true);
  };

  const handleNew = () => {
    setSelectedVaccination(undefined);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir esta vacinação?')) {
      await supabase.from('vaccinations').delete().eq('id', id);
      fetchVaccinations();
    }
  };

  const filteredVaccinations = vaccinations.filter(
    (vac) =>
      vac.vaccine_name.toLowerCase().includes(search.toLowerCase()) ||
      vac.animal?.name.toLowerCase().includes(search.toLowerCase()) ||
      vac.animal?.tutor?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AuthenticatedLayout>
      <div className="p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Carteira de Vacinas</h1>
            <p className="text-gray-600">Controle de vacinação e lembretes</p>
          </div>
          <button
            onClick={handleNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nova Vacinação
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por vacina, animal ou tutor..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Carregando vacinações...</p>
          </div>
        ) : filteredVaccinations.length === 0 ? (
          <div className="text-center py-12">
            <Syringe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Nenhuma vacinação registrada</p>
            <p className="text-sm text-gray-400">
              {search ? 'Tente outra busca' : 'Comece registrando a primeira vacinação'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredVaccinations.map((vac) => (
              <div
                key={vac.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <div className="bg-green-100 p-3 rounded-full">
                      <Syringe className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {vac.vaccine_name}
                      </h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Dog className="w-4 h-4" />
                          <span>{vac.animal?.name} ({vac.animal?.species})</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4" />
                          <span>Tutor: {vac.animal?.tutor?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Aplicada em: {new Date(vac.administered_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        {vac.next_dose_date && (
                          <div className="flex items-center gap-2 text-amber-600">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Próxima dose: {new Date(vac.next_dose_date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}
                        {vac.batch_number && (
                          <p className="text-gray-500">Lote: {vac.batch_number}</p>
                        )}
                        {vac.manufacturer && (
                          <p className="text-gray-500">Fabricante: {vac.manufacturer}</p>
                        )}
                        {vac.notes && (
                          <p className="text-gray-500 mt-2">{vac.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(vac)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(vac.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <VaccinationFormModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={fetchVaccinations}
          vaccination={selectedVaccination}
        />
      </div>
    </AuthenticatedLayout>
  );
}
