import { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '../components/layouts/AuthenticatedLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  FileText,
  Search,
  Dog,
  User,
  Calendar,
  Thermometer,
  Heart,
  Activity,
} from 'lucide-react';
import { MedicalRecord, Animal, Tutor } from '../types';
import { formatarParaDataBR } from '../utils/dateTimeBR';

interface MedicalRecordWithDetails extends MedicalRecord {
  animal?: Animal & { tutor?: Tutor };
  veterinarian_name?: string;
  specialization: string;
}

export function MedicalRecords() {
  const { currentClinicId } = useAuth();
  const [records, setRecords] = useState<MedicalRecordWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] =
    useState<MedicalRecordWithDetails | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [showDateFilter, setShowDateFilter] = useState(false);

  useEffect(() => {
    if (!currentClinicId) return;
    fetchRecords();
  }, [currentClinicId]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data: recordsData } = await supabase
        .from('medical_records')
        .select('*')
        .eq('clinic_id', currentClinicId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (recordsData) {
        const recordsWithDetails = await Promise.all(
          recordsData.map(async (record) => {
            const { data: animal } = await supabase
              .from('animals')
              .select('*, tutor:tutors(*)')
              .eq('id', record.animal_id)
              .maybeSingle();

            const { data: veterinarian } = await supabase
              .from('veterinarians')
              .select('name, specialization')
              .eq('user_id', record.veterinarian_id)
              .maybeSingle();
            return {
              ...record,
              animal,
              veterinarian_name: veterinarian?.name || 'Veterinário',
              specialization: veterinarian?.specialization || '',
            };
          })
        );
        setRecords(recordsWithDetails);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter((record) => {
    const lowerSearch = search.toLowerCase();
    const matchesText =
      (record.animal?.name || '').toLowerCase().includes(lowerSearch) ||
      (record.animal?.tutor?.name || '').toLowerCase().includes(lowerSearch) ||
      (record.diagnosis || '').toLowerCase().includes(lowerSearch) ||
      (record.created_at || '').includes(search);

    let matchesDate = true;
    if ((startDate || endDate) && record.created_at) {
      const recordDate = new Date(record.created_at);

      if (startDate) {
        const [sy, sm, sd] = startDate.split('-').map(Number);
        const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
        if (recordDate < start) matchesDate = false;
      }

      if (endDate) {
        const [ey, em, ed] = endDate.split('-').map(Number);
        const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
        if (recordDate > end) matchesDate = false;
      }
    }

    return matchesText && matchesDate;
  });

  return (
    <AuthenticatedLayout>
      <div className="p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Prontuários</h1>
            <p className="text-gray-600">Histórico clínico e atendimentos</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="relative flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por animal, tutor ou diagnóstico..."
                className="w-full pl-10 pr-32 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setShowDateFilter((s) => !s)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
              >
                <Calendar className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">Filtrar por data</span>
              </button>

              {showDateFilter && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow p-4 z-10">
                  <label className="text-xs text-gray-500">De</label>
                  <input
                    type="date"
                    value={startDate || ''}
                    onChange={(e) => setStartDate(e.target.value || null)}
                    className="w-full mt-1 mb-3 px-2 py-1 border rounded"
                  />
                  <label className="text-xs text-gray-500">Até</label>
                  <input
                    type="date"
                    value={endDate || ''}
                    onChange={(e) => setEndDate(e.target.value || null)}
                    className="w-full mt-1 mb-3 px-2 py-1 border rounded"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setStartDate(null);
                        setEndDate(null);
                        setShowDateFilter(false);
                      }}
                      className="px-3 py-1 text-sm text-gray-600 hover:underline"
                    >
                      Limpar
                    </button>
                    <button
                      onClick={() => setShowDateFilter(false)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {(startDate || endDate) && (
            <div className="mt-3 text-sm text-gray-600">
              Filtro de data: {startDate ? formatarParaDataBR(startDate) : '—'}{' '}
              até {endDate ? formatarParaDataBR(endDate) : '—'}
              <button
                onClick={() => {
                  setStartDate(null);
                  setEndDate(null);
                }}
                className="ml-3 text-blue-600 hover:underline"
              >
                Remover
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Carregando prontuários...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Nenhum prontuário encontrado</p>
            <p className="text-sm text-gray-400">
              {search
                ? 'Tente outra busca'
                : 'Comece criando o primeiro prontuário'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRecords.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition cursor-pointer"
                onClick={() => setSelectedRecord(record)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Dog className="w-5 h-5 text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {record.animal?.name || 'Animal'}
                        </h3>
                        <span className="text-sm text-gray-500">
                          ({record.animal?.species})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>
                          Tutor: {record.animal?.tutor?.name || 'Não informado'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(record.created_at).toLocaleDateString(
                          'pt-BR'
                        )}
                      </span>
                    </div>
                    <p>Dr(a). {record.veterinarian_name}</p>
                  </div>
                </div>

                {(record.temperature_celsius ||
                  record.heart_rate ||
                  record.weight_kg) && (
                  <div className="flex gap-6 mb-4 p-4 bg-gray-50 rounded-lg">
                    {record.temperature_celsius && (
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-red-500" />
                        <span className="text-sm">
                          Temp: <strong>{record.temperature_celsius}°C</strong>
                        </span>
                      </div>
                    )}
                    {record.heart_rate && (
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-pink-500" />
                        <span className="text-sm">
                          FC: <strong>{record.heart_rate} bpm</strong>
                        </span>
                      </div>
                    )}
                    {record.respiratory_rate && (
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">
                          FR: <strong>{record.respiratory_rate} rpm</strong>
                        </span>
                      </div>
                    )}
                    {record.weight_kg && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          Peso: <strong>{record.weight_kg} kg</strong>
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {record.anamnesis && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Anamnese:
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {record.anamnesis}
                    </p>
                  </div>
                )}

                {record.diagnosis && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Diagnóstico:
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {record.diagnosis}
                    </p>
                  </div>
                )}

                {record.treatment_plan && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Plano de Tratamento:
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {record.treatment_plan}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedRecord && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedRecord(null)}
          >
            <div
              className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">
                  Detalhes do Prontuário
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Informações do Animal
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="mb-2">
                      <strong>Animal:</strong> {selectedRecord.animal?.name} (
                      {selectedRecord.animal?.species})
                    </p>
                    <p>
                      <strong>Tutor:</strong>{' '}
                      {selectedRecord.animal?.tutor?.name}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Sinais Vitais</h3>
                  <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-2 gap-4">
                    <p>
                      <strong>Temperatura:</strong>{' '}
                      {selectedRecord.temperature_celsius
                        ? `${selectedRecord.temperature_celsius}°C`
                        : 'Não registrado'}
                    </p>
                    <p>
                      <strong>Frequência Cardíaca:</strong>{' '}
                      {selectedRecord.heart_rate
                        ? `${selectedRecord.heart_rate} bpm`
                        : 'Não registrado'}
                    </p>
                    <p>
                      <strong>Frequência Respiratória:</strong>{' '}
                      {selectedRecord.respiratory_rate
                        ? `${selectedRecord.respiratory_rate} rpm`
                        : 'Não registrado'}
                    </p>
                    <p>
                      <strong>Peso:</strong>{' '}
                      {selectedRecord.weight_kg
                        ? `${selectedRecord.weight_kg} kg`
                        : 'Não registrado'}
                    </p>
                  </div>
                </div>

                {selectedRecord.anamnesis && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Anamnese</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="whitespace-pre-wrap">
                        {selectedRecord.anamnesis}
                      </p>
                    </div>
                  </div>
                )}

                {selectedRecord.clinical_impression && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Impressão Clínica
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="whitespace-pre-wrap">
                        {selectedRecord.clinical_impression}
                      </p>
                    </div>
                  </div>
                )}

                {selectedRecord.diagnosis && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Diagnóstico</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="whitespace-pre-wrap">
                        {selectedRecord.diagnosis}
                      </p>
                    </div>
                  </div>
                )}

                {selectedRecord.treatment_plan && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Plano de Tratamento
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="whitespace-pre-wrap">
                        {selectedRecord.treatment_plan}
                      </p>
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-500 border-t pt-4">
                  <p>
                    <strong>Veterinário: </strong> Dr(a).{' '}
                    {selectedRecord.veterinarian_name}
                  </p>
                  <p>
                    <strong>Especialização: </strong>
                    {selectedRecord.specialization}
                  </p>
                  <p>
                    <strong>Data:</strong>{' '}
                    {new Date(selectedRecord.created_at).toLocaleString(
                      'pt-BR'
                    )}
                  </p>
                </div>
              </div>
              <div className="p-6 border-t">
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
