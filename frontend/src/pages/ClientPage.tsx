import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';
import { useAuthStore } from '../store/auth';

interface Product {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  markup: number;
  finalPrice: number;
  active: boolean;
  category?: any;
  images: any[];
}

export function ClientPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [client, setClient] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: '',
    markup: '30',
    categoryId: '',
  });
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  useEffect(() => {
    if (clientId) {
      loadClient();
      loadProducts();
    }
  }, [clientId]);

  const loadClient = async () => {
    try {
      const data = await apiClient.getClient(clientId!);
      setClient(data);
    } catch (error) {
      console.error('Error loading client:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await apiClient.getProducts(clientId!);
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.updateProduct(clientId!, editingId, {
          name: formData.name,
          description: formData.description,
          basePrice: parseFloat(formData.basePrice),
          markup: parseFloat(formData.markup),
          categoryId: formData.categoryId || undefined,
        });
      } else {
        await apiClient.createProduct(clientId!, {
          name: formData.name,
          description: formData.description,
          basePrice: parseFloat(formData.basePrice),
          markup: parseFloat(formData.markup),
          categoryId: formData.categoryId || undefined,
        });
      }
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      basePrice: product.basePrice.toString(),
      markup: product.markup.toString(),
      categoryId: product.category?.id || '',
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleDelete = async (productId: string) => {
    if (confirm('Tem certeza?')) {
      try {
        await apiClient.deleteProduct(clientId!, productId);
        loadProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      basePrice: '',
      markup: '30',
      categoryId: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-900 mb-2"
            >
              ← Voltar
            </button>
            <h1 className="text-2xl font-bold text-green-600">{client?.name}</h1>
          </div>
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
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Cardápio</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            + Novo Produto
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold mb-4">
              {editingId ? 'Editar Produto' : 'Novo Produto'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Nome do produto"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
              <textarea
                placeholder="Descrição"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Preço Base (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.basePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, basePrice: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Margem (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="30"
                    value={formData.markup}
                    onChange={(e) =>
                      setFormData({ ...formData, markup: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Preço Final
                  </label>
                  <input
                    type="text"
                    value={
                      formData.basePrice && formData.markup
                        ? (
                            parseFloat(formData.basePrice) *
                            (1 + parseFloat(formData.markup) / 100)
                          ).toFixed(2)
                        : '0.00'
                    }
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 bg-gray-100 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  {editingId ? 'Atualizar' : 'Criar'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-600">Carregando...</p>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">Nenhum produto cadastrado</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-2">{product.name}</h3>
                  {product.description && (
                    <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                  )}

                  <div className="bg-gray-50 p-4 rounded mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Preço Base:</span>
                      <span className="font-semibold">
                        R$ {product.basePrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Margem:</span>
                      <span className="font-semibold">{product.markup}%</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Preço Final:</span>
                      <span className="font-bold text-lg text-green-600">
                        R$ {product.finalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 text-sm"
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
