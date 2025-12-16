import { useEffect, useState } from 'react';
import { AuthenticatedLayout } from '../components/layouts/AuthenticatedLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Users, Calendar, FileText, DollarSign, Check, X, Clock } from 'lucide-react';
import { AppointmentRequest } from '../types';

export function Dashboard() {
  const { currentClinicId, user } = useAuth();
  const [stats, setStats] = useState({
    totalAnimals: 0,
    todayAppointments: 0,
    pendingRequests: 0,
    thisMonthRevenue: 0,
  });
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentClinicId) return;
    fetchStats();
    fetchPendingRequests();
  }, [currentClinicId]);

  const fetchStats = async () => {
    const { count: animalsCount } = await supabase
      .from('animals')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', currentClinicId);

    const today = new Date().toISOString().split('T')[0];
    const { count: todayCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', currentClinicId)
      .gte('scheduled_at', `${today}T00:00:00`)
      .lte('scheduled_at', `${today}T23:59:59`);

    const { count: pendingCount } = await supabase
      .from('appointment_requests')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', currentClinicId)
      .eq('status', 'pending');

    setStats({
      totalAnimals: animalsCount || 0,
      todayAppointments: todayCount || 0,
      pendingRequests: pendingCount || 0,
      thisMonthRevenue: 0,
    });
  };

  const fetchPendingRequests = async () => {
    const { data } = await supabase
      .from('appointment_requests')
      .select('*')
      .eq('clinic_id', currentClinicId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) setRequests(data);
  };

  const handleApprove = async (request: AppointmentRequest) => {
    setLoading(true);
    try {
      await supabase.from('appointments').insert({
        clinic_id: request.clinic_id,
        animal_id: request.animal_id,
        veterinarian_id: request.veterinarian_id,
        scheduled_at: `${request.requested_date}T${request.requested_time}`,
        duration_minutes: 30,
        status: 'confirmed',
        notes: request.notes,
      });

      await supabase
        .from('appointment_requests')
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      fetchStats();
      fetchPendingRequests();
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (request: AppointmentRequest) => {
    setLoading(true);
    try {
      await supabase
        .from('appointment_requests')
        .update({
          status: 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: 'Horário indisponível',
        })
        .eq('id', request.id);

      fetchStats();
      fetchPendingRequests();
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      icon: Users,
      label: 'Animais Cadastrados',
      value: stats.totalAnimals,
      color: 'bg-blue-500',
    },
    {
      icon: Calendar,
      label: 'Consultas Hoje',
      value: stats.todayAppointments,
      color: 'bg-green-500',
    },
    {
      icon: Clock,
      label: 'Solicitações Pendentes',
      value: stats.pendingRequests,
      color: 'bg-yellow-500',
    },
    {
      icon: DollarSign,
      label: 'Faturamento do Mês',
      value: `R$ ${stats.thisMonthRevenue.toFixed(2)}`,
      color: 'bg-cyan-500',
    },
  ];

  return (
    <AuthenticatedLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Visão geral da clínica</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.color} p-3 rounded-lg`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          ))}
        </div>

        {requests.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Solicitações de Agendamento
            </h2>
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      Solicitação de agendamento
                    </p>
                    <p className="text-sm text-gray-600">
                      Data: {new Date(request.requested_date).toLocaleDateString('pt-BR')} às{' '}
                      {request.requested_time}
                    </p>
                    {request.notes && (
                      <p className="text-sm text-gray-500 mt-1">{request.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(request)}
                      disabled={loading}
                      className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                      title="Aprovar"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleReject(request)}
                      disabled={loading}
                      className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                      title="Recusar"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Próximas Consultas</h2>
            <p className="text-gray-500 text-center py-8">
              Nenhuma consulta agendada para hoje
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Atividade Recente</h2>
            <p className="text-gray-500 text-center py-8">Nenhuma atividade recente</p>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
