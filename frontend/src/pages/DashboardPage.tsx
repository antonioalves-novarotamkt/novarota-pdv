import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Store, ChevronRight } from 'lucide-react';
import { apiClient } from '../services/api';
import { useAuthStore } from '../store/auth';
import { AppLayout } from '../components/AppLayout';

interface Client {
  id: string;
  name: string;
  slug: string;
  email: string;
  _count?: { products: number };
}

const inputClass =
  'rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent';

export function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewClient, setShowNewClient] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', email: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setClientId } = useAuthStore();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setClients(await apiClient.getClients());
    } catch (err) {
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const newClient = await apiClient.createClient(formData.name, formData.slug, formData.email);
      setClients([{ ...newClient, _count: { products: 0 } }, ...clients]);
      setFormData({ name: '', slug: '', email: '' });
      setShowNewClient(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Não foi possível criar o cliente.');
    }
  };

  const handleSelectClient = (clientId: string) => {
    setClientId(clientId);
    navigate(`/client/${clientId}`);
  };

  return (
    <AppLayout>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-slate-500">Cada cliente tem seu próprio cardápio</p>
        </div>
        <button
          onClick={() => setShowNewClient(!showNewClient)}
          className="flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
        >
          <Plus className="h-4 w-4" />
          Novo cliente
        </button>
      </div>

      {showNewClient && (
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold">Novo cliente</h2>
          <form onSubmit={handleCreateClient} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <input
                type="text"
                placeholder="Nome da loja"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputClass}
                required
              />
              <input
                type="text"
                placeholder="Identificador (ex: pizzaria-italiana)"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className={inputClass}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={inputClass}
                required
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
              >
                Criar
              </button>
              <button
                type="button"
                onClick={() => setShowNewClient(false)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-center text-slate-500">Carregando...</p>
      ) : clients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Store className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="mb-4 text-slate-500">Nenhum cliente cadastrado ainda</p>
          <button
            onClick={() => setShowNewClient(true)}
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            Cadastrar primeiro cliente
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <button
              key={client.id}
              onClick={() => handleSelectClient(client.id)}
              className="group rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-orange-300 hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  <Store className="h-5 w-5" />
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-orange-500" />
              </div>
              <h3 className="font-semibold">{client.name}</h3>
              <p className="text-xs text-slate-500">{client.email}</p>
              <p className="mt-3 text-sm font-medium text-orange-600">
                {client._count?.products ?? 0} produto{client._count?.products === 1 ? '' : 's'}
              </p>
            </button>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
