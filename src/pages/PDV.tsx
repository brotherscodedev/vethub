import { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '../components/layouts/AuthenticatedLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ShoppingCart, Plus, Search, DollarSign, Calendar, User } from 'lucide-react';
import { Invoice, Animal, Tutor } from '../types';

interface InvoiceWithDetails extends Invoice {
  animal?: Animal & { tutor?: Tutor };
}

export function PDV() {
  const { currentClinicId } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!currentClinicId) return;
    fetchInvoices();
  }, [currentClinicId]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .eq('clinic_id', currentClinicId)
        .order('issued_at', { ascending: false })
        .limit(50);

      if (invoicesData) {
        const invoicesWithDetails = await Promise.all(
          invoicesData.map(async (invoice) => {
            const { data: animal } = await supabase
              .from('animals')
              .select('*, tutor:tutors(*)')
              .eq('id', invoice.animal_id)
              .maybeSingle();

            return { ...invoice, animal };
          })
        );
        setInvoices(invoicesWithDetails);
      }
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.animal?.name.toLowerCase().includes(search.toLowerCase()) ||
      invoice.animal?.tutor?.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = invoices
    .filter((inv) => inv.payment_status === 'paid')
    .reduce((sum, inv) => sum + inv.total_amount, 0);

  const pendingRevenue = invoices
    .filter((inv) => inv.payment_status === 'pending')
    .reduce((sum, inv) => sum + inv.total_amount, 0);

  return (
    <AuthenticatedLayout>
      <div className="p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ponto de Venda</h1>
            <p className="text-gray-600">Vendas, consultas e produtos</p>
          </div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            onClick={() => alert('Funcionalidade em desenvolvimento')}
          >
            <Plus className="w-5 h-5" />
            Nova Venda
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-100 p-2 rounded-full">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">Receita Total</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              R$ {totalRevenue.toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-yellow-100 p-2 rounded-full">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">A Receber</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              R$ {pendingRevenue.toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 p-2 rounded-full">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">Total de Vendas</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
          </div>
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
            <p className="text-gray-500">Carregando vendas...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Nenhuma venda encontrada</p>
            <p className="text-sm text-gray-400">
              {search ? 'Tente outra busca' : 'Comece registrando a primeira venda'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Animal / Tutor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(invoice.issued_at).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">
                          {invoice.animal?.name}
                        </p>
                        <div className="flex items-center gap-1 text-gray-500">
                          <User className="w-3 h-3" />
                          <span>{invoice.animal?.tutor?.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        R$ {invoice.total_amount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {invoice.payment_method || 'Não informado'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(invoice.payment_status)}`}>
                        {getPaymentStatusText(invoice.payment_status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
