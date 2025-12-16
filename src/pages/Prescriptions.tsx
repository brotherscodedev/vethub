import { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '../components/layouts/AuthenticatedLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Pill, Plus, Search, Dog, User, Calendar, FileText } from 'lucide-react';
import { Prescription, Animal, Tutor } from '../types';

interface PrescriptionWithDetails extends Prescription {
  animal?: Animal & { tutor?: Tutor };
  veterinarian_name?: string;
}

export function Prescriptions() {
  const { currentClinicId } = useAuth();
  const [prescriptions, setPrescriptions] = useState<PrescriptionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!currentClinicId) return;
    fetchPrescriptions();
  }, [currentClinicId]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const { data: prescriptionsData } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('clinic_id', currentClinicId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (prescriptionsData) {
        const prescriptionsWithDetails = await Promise.all(
          prescriptionsData.map(async (prescription) => {
            const { data: animal } = await supabase
              .from('animals')
              .select('*, tutor:tutors(*)')
              .eq('id', prescription.animal_id)
              .maybeSingle();

            const { data: vet } = await supabase
              .from('user_profiles')
              .select('full_name')
              .eq('id', prescription.veterinarian_id)
              .maybeSingle();

            return {
              ...prescription,
              animal,
              veterinarian_name: vet?.full_name || 'Veterinário',
            };
          })
        );
        setPrescriptions(prescriptionsWithDetails);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'issued': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'viewed': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'issued': return 'Emitida';
      case 'sent': return 'Enviada';
      case 'viewed': return 'Visualizada';
      case 'draft': return 'Rascunho';
      default: return status;
    }
  };

  const filteredPrescriptions = prescriptions.filter(
    (prescription) =>
      prescription.animal?.name.toLowerCase().includes(search.toLowerCase()) ||
      prescription.animal?.tutor?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AuthenticatedLayout>
      <div className="p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Prescrições</h1>
            <p className="text-gray-600">Bulário e geração de receitas</p>
          </div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            onClick={() => alert('Funcionalidade em desenvolvimento')}
          >
            <Plus className="w-5 h-5" />
            Nova Prescrição
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por animal ou tutor..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Carregando prescrições...</p>
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="text-center py-12">
            <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Nenhuma prescrição encontrada</p>
            <p className="text-sm text-gray-400">
              {search ? 'Tente outra busca' : 'Comece criando a primeira prescrição'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPrescriptions.map((prescription) => (
              <div
                key={prescription.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Dog className="w-5 h-5 text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {prescription.animal?.name}
                        </h3>
                        <span className="text-sm text-gray-500">
                          ({prescription.animal?.species})
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4" />
                          <span>Tutor: {prescription.animal?.tutor?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(prescription.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-gray-600">
                          Veterinário: Dr(a). {prescription.veterinarian_name}
                        </p>
                        {prescription.notes && (
                          <p className="text-gray-500 mt-2">{prescription.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(prescription.status)}`}>
                    {getStatusText(prescription.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
