import { useState, useEffect, useCallback } from 'react';
import { AuthenticatedLayout } from '../components/layouts/AuthenticatedLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/pt-br';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Appointment, Animal, Tutor } from '../types';
import { AppointmentFormModal } from '../components/AppointmentFormModal';
import { Plus } from 'lucide-react';

moment.locale('pt-br');
const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: AppointmentWithDetails;
}

interface AppointmentWithDetails extends Appointment {
  animal?: Animal & { tutor?: Tutor };
  veterinarian_name?: string;
}

export function Appointments() {
  const { currentClinicId } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>(undefined);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>(Views.WEEK);

  const fetchAppointments = useCallback(async () => {
    if (!currentClinicId) return;
    setLoading(true);

    try {
      const startRange = moment(currentDate).startOf('month').subtract(7, 'days').toDate();
      const endRange = moment(currentDate).endOf('month').add(7, 'days').toDate();

      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('clinic_id', currentClinicId)
        .gte('scheduled_at', startRange.toISOString())
        .lte('scheduled_at', endRange.toISOString());

      if (error) throw error;

      if (appointmentsData) {
        const formattedEvents: CalendarEvent[] = await Promise.all(
          appointmentsData.map(async (apt) => {
            const { data: animal } = await supabase
              .from('animals')
              .select('*, tutor:tutors(*)')
              .eq('id', apt.animal_id)
              .maybeSingle();

            const { data: vet } = await supabase
              .from('veterinarians')
              .select('name')
              .eq('user_id', apt.veterinarian_id)
              .eq('clinic_id', currentClinicId)
              .maybeSingle();

            const startDate = new Date(apt.scheduled_at);
            const endDate = new Date(startDate.getTime() + apt.duration_minutes * 60000);

            const vetName = vet?.name || 'Sem Veterinário';
            const animalName = animal?.name || 'Desconhecido';
            const tutorName = animal?.tutor?.name || '';

            return {
              id: apt.id,
              title: `${animalName} (${tutorName}) - Dr(a). ${vetName}`,
              start: startDate,
              end: endDate,
              resource: {
                ...apt,
                animal,
                veterinarian_name: vetName,
              },
            };
          })
        );
        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  }, [currentClinicId, currentDate]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setSelectedAppointment(undefined);
    setShowModal(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedAppointment(event.resource);
    setShowModal(true);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3174ad';
    const status = event.resource.status;

    switch (status) {
      case 'confirmed': backgroundColor = '#10B981'; break;
      case 'in_progress': backgroundColor = '#F59E0B'; break;
      case 'completed': backgroundColor = '#6B7280'; break;
      case 'cancelled': backgroundColor = '#EF4444'; break;
      case 'reception': backgroundColor = '#06B6D4'; break;
      default: backgroundColor = '#3B82F6';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  return (
    <AuthenticatedLayout>
      <div className="h-screen flex flex-col p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agenda</h1>
            <p className="text-gray-600">Gestão visual de consultas e veterinários</p>
          </div>
          <button
            onClick={() => {
              setSelectedAppointment(undefined);
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Novo Agendamento
          </button>
        </div>

        <div className="flex-1 bg-white rounded-lg shadow p-4">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
            view={view}
            onView={setView}
            date={currentDate}
            onNavigate={setCurrentDate}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            messages={{
              today: 'Hoje',
              previous: 'Anterior',
              next: 'Próximo',
              month: 'Mês',
              week: 'Semana',
              day: 'Dia',
              agenda: 'Agenda',
              date: 'Data',
              time: 'Hora',
              event: 'Evento',
              noEventsInRange: 'Não há agendamentos neste período.',
            }}
            min={new Date(0, 0, 0, 8, 0, 0)}
            max={new Date(0, 0, 0, 20, 0, 0)}
          />
        </div>

        <AppointmentFormModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            fetchAppointments();
            setShowModal(false);
          }}
          appointment={selectedAppointment}
        />
      </div>
    </AuthenticatedLayout>
  );
}