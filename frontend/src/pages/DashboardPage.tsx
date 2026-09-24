import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';
import { useAuthStore } from '../store/auth';

interface Client {
  id: string;
  name: string;
  slug: string;
  email: string;
  products?: any[];
}

export function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewClient, setShowNewClient] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', email: '' });
  const navigate = useNavigate();
  const { user, logout, setClientId } = useAuthStore();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await apiClient.getClients();
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newClient = await apiClient.createClient(
        formData.name,
        formData.slug,
        formData.email
      );
      setClients([...clients, newClient]);
      setFormData({ name: '', slug: '', email: '' });
      setShowNewClient(false);
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  const handleSelectClient = (clientId: string) => {
    setClientId(clientId);
    navigate(`/client/${clientId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">🍽️ Menu Manager</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.name}</span>
            <button
              onClick={() => {
                apiClient.clearToken();
                logout();
                navigate('/login');
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Meus Clientes</h2>
          <button
            onClick={() => setShowNewClient(!showNewClient)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            + Novo Cliente
          </button>
        </div>

        {showNewClient && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold mb-4">Novo Cliente</h3>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Nome da loja"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="Slug (ex: pizzaria-italiana)"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Criar
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-600">Carregando...</p>
        ) : clients.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">Nenhum cliente criado ainda</p>
            <button
              onClick={() => setShowNewClient(true)}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Criar seu primeiro cliente
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {clients.map((client) => (
              <div
                key={client.id}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition cursor-pointer"
                onClick={() => handleSelectClient(client.id)}
              >
                <h3 className="text-xl font-bold mb-2">{client.name}</h3>
                <p className="text-gray-600 text-sm mb-1">Slug: {client.slug}</p>
                <p className="text-gray-600 text-sm mb-4">{client.email}</p>
                <p className="text-sm font-semibold text-green-600">
                  {client.products?.length || 0} produtos
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
