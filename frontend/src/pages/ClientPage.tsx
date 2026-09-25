import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, UtensilsCrossed } from 'lucide-react';
import { apiClient } from '../services/api';
import { AppLayout } from '../components/AppLayout';
import { ExcelActions } from '../components/ExcelActions';
import { MarkupSettings } from '../components/MarkupSettings';
import { ProductPhoto } from '../components/ProductPhoto';

interface Product {
  id: string;
  name: string;
  sku?: string | null;
  description?: string;
  basePrice: number;
  markup: number;
  finalPrice: number;
  active: boolean;
  category?: { id: string; name: string };
  images: { id: string; url: string }[];
}

const emptyForm = { name: '', description: '', basePrice: '', markup: '30', categoryId: '' };

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent';

const brl = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function ClientPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [client, setClient] = useState<{ name: string; defaultMarkup: number } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (clientId) {
      loadClient();
      loadProducts();
    }
  }, [clientId]);

  const loadClient = async () => {
    try {
      setClient(await apiClient.getClient(clientId!));
    } catch (error) {
      console.error('Error loading client:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setProducts(await apiClient.getProducts(clientId!));
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      description: formData.description,
      basePrice: parseFloat(formData.basePrice),
      markup: parseFloat(formData.markup),
      categoryId: formData.categoryId || undefined,
    };
    try {
      if (editingId) {
        await apiClient.updateProduct(clientId!, editingId, payload);
      } else {
        await apiClient.createProduct(clientId!, payload);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (productId: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await apiClient.deleteProduct(clientId!, productId);
        loadProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const previewPrice =
    formData.basePrice && formData.markup
      ? parseFloat(formData.basePrice) * (1 + parseFloat(formData.markup) / 100)
      : 0;

  return (
    <AppLayout>
      <Link
        to="/dashboard"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Clientes
      </Link>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{client?.name ?? 'Cardápio'}</h1>
          <p className="text-sm text-slate-500">Cardápio e precificação</p>
        </div>
        <button
          onClick={() => {
            if (showForm) return resetForm();
            setFormData({ ...emptyForm, markup: String(client?.defaultMarkup ?? 30) });
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
        >
          <Plus className="h-4 w-4" />
          Novo produto
        </button>
      </div>

      {clientId && client && (
        <MarkupSettings
          clientId={clientId}
          currentMarkup={client.defaultMarkup}
          productCount={products.length}
          onApplied={() => {
            loadClient();
            loadProducts();
          }}
        />
      )}

      {clientId && <ExcelActions clientId={clientId} onImported={loadProducts} />}

      {showForm && (
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold">{editingId ? 'Editar produto' : 'Novo produto'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Nome do produto"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClass}
              required
            />
            <textarea
              placeholder="Descrição"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={inputClass}
              rows={3}
            />
            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Preço na loja (R$)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                  className={inputClass}
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Acréscimo (%)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="30"
                  value={formData.markup}
                  onChange={(e) => setFormData({ ...formData, markup: e.target.value })}
                  className={inputClass}
                />
              </label>
              <div>
                <span className="mb-1 block text-xs font-medium text-slate-600">Preço final</span>
                <div className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700">
                  {brl(previewPrice)}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
              >
                {editingId ? 'Salvar' : 'Criar'}
              </button>
              <button
                type="button"
                onClick={resetForm}
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
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <UtensilsCrossed className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-slate-500">Nenhum produto cadastrado ainda</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div key={product.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <ProductPhoto
                clientId={clientId!}
                productId={product.id}
                productName={product.name}
                imageUrl={product.images[0]?.url}
                onChanged={loadProducts}
              />
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{product.name}</h3>
                {!product.active && (
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                    Inativo
                  </span>
                )}
              </div>
              {(product.category || product.sku) && (
                <p className="mt-0.5 text-xs text-slate-400">
                  {[product.category?.name, product.sku].filter(Boolean).join(' · ')}
                </p>
              )}
              {product.description && (
                <p className="mt-1 text-sm text-slate-500">{product.description}</p>
              )}

              <dl className="mt-4 space-y-1.5 rounded-lg bg-slate-50 p-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Preço na loja</dt>
                  <dd className="font-medium">{brl(product.basePrice)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Acréscimo</dt>
                  <dd className="font-medium">{product.markup}%</dd>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5">
                  <dt className="text-slate-500">Preço final</dt>
                  <dd className="text-base font-bold text-orange-600">{brl(product.finalPrice)}</dd>
                </div>
              </dl>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleEdit(product)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
