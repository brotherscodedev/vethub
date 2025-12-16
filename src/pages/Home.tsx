import { useNavigate } from 'react-router-dom';
import { PublicLayout } from '../components/layouts/PublicLayout';
import { CheckCircle, Users, Calendar, FileText, Pill, BarChart3, ArrowRight, Stethoscope, Heart } from 'lucide-react';

export function Home() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: 'Gestão de Pacientes',
      description: 'Cadastro completo de tutores e animais com histórico integrado',
    },
    {
      icon: Calendar,
      title: 'Agenda Inteligente',
      description: 'Agendamentos, confirmações automáticas e fila de atendimento',
    },
    {
      icon: FileText,
      title: 'Prontuário Eletrônico',
      description: 'Documentação clínica completa e acessível para toda equipe',
    },
    {
      icon: Pill,
      title: 'Bulário Inteligente',
      description: 'Prescrições automáticas com cálculo de doses e geração de PDF',
    },
    {
      icon: BarChart3,
      title: 'Relatórios Financeiros',
      description: 'Dashboard completo com análise de vendas e comissionamento',
    },
    {
      icon: CheckCircle,
      title: 'Carteira Digital',
      description: 'Portal do tutor com acesso a vacinações e documentos liberados',
    },
  ];

  return (
    <PublicLayout>
      <section className="bg-gradient-to-br from-blue-50 to-cyan-100 py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Gestão Completa para Clínicas Veterinárias
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            VetHub é a plataforma SaaS que simplifica a gestão da sua clínica veterinária com
            prontuários digitais, agenda inteligente, prescrições automáticas e muito mais.
          </p>
          <button
            onClick={() => navigate('/auth/signup')}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 inline-flex items-center gap-2 transition"
          >
            Começar Gratuitamente <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Funcionalidades Principais</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition"
              >
                <feature.icon className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Acesso Rápido</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <button
              onClick={() => navigate('/auth/login')}
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-center"
            >
              <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Clínica</h3>
              <p className="text-sm text-gray-600">Acesso administrativo</p>
            </button>
            <button
              onClick={() => navigate('/veterinarian-login')}
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-center"
            >
              <Stethoscope className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Veterinário</h3>
              <p className="text-sm text-gray-600">Portal profissional</p>
            </button>
            <button
              onClick={() => navigate('/tutor/login')}
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-center"
            >
              <Heart className="w-12 h-12 text-pink-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Tutor</h3>
              <p className="text-sm text-gray-600">Área do cliente</p>
            </button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
