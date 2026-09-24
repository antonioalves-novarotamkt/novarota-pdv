import { useEffect, useState } from 'react';
import { Loader2, Percent, CircleCheck } from 'lucide-react';
import { apiClient, readApiError } from '../services/api';

interface Props {
  clientId: string;
  currentMarkup: number;
  productCount: number;
  onApplied: () => void;
}

export function MarkupSettings({ clientId, currentMarkup, productCount, onApplied }: Props) {
  const [value, setValue] = useState(String(currentMarkup));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setValue(String(currentMarkup));
  }, [currentMarkup]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const markup = Number(value.replace(',', '.'));
    if (value.trim() === '' || !Number.isFinite(markup) || markup < 0) {
      setError('Informe uma porcentagem válida (0 ou mais).');
      return;
    }
    const plural = productCount === 1 ? 'o produto' : `os ${productCount} produtos`;
    if (!confirm(`Aplicar ${markup}% de acréscimo em ${plural} deste cardápio? O acréscimo individual de cada produto será substituído.`)) {
      return;
    }

    setBusy(true);
    try {
      const result = await apiClient.applyMarkupToAll(clientId, markup);
      setMessage(
        `Acréscimo de ${result.markup}% aplicado em ${result.updated} produto${result.updated === 1 ? '' : 's'}.`
      );
      onApplied();
    } catch (err) {
      setError((await readApiError(err)).error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <form onSubmit={handleApply} className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Acréscimo geral (%)</span>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-32 rounded-md border border-slate-300 py-2 pl-3 pr-8 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <Percent className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>
        </label>
        <button
          type="submit"
          disabled={busy}
          className="flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Aplicar a todo o cardápio
        </button>
        <p className="basis-full text-xs text-slate-500 sm:basis-auto">
          Recalcula o preço final de todos os produtos. Produtos novos já vêm com esse acréscimo.
        </p>
      </form>
      {message && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-green-700">
          <CircleCheck className="h-4 w-4" />
          {message}
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
