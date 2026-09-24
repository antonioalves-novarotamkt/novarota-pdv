import { useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { apiClient, imageSrc, readApiError } from '../services/api';
import { resizeImage } from '../utils/resizeImage';

interface Props {
  clientId: string;
  productId: string;
  productName: string;
  imageUrl?: string;
  onChanged: () => void;
}

export function ProductPhoto({ clientId, productId, productName, imageUrl, onChanged }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    setBusy(true);
    try {
      let resized: Blob;
      try {
        resized = await resizeImage(file);
      } catch (err) {
        setError((err as Error).message);
        return;
      }
      await apiClient.uploadProductImage(clientId, productId, resized);
      onChanged();
    } catch (err) {
      setError((await readApiError(err)).error);
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Remover a foto deste produto?')) return;
    setError('');
    setBusy(true);
    try {
      await apiClient.removeProductImage(clientId, productId);
      onChanged();
    } catch (err) {
      setError((await readApiError(err)).error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative -mx-5 -mt-5 mb-4">
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />

      {imageUrl ? (
        <div className="group relative aspect-[4/3] overflow-hidden rounded-t-xl bg-slate-100">
          <img src={imageSrc(imageUrl)} alt={productName} className="h-full w-full object-cover" loading="lazy" />
          <div className="absolute right-2 top-2 flex gap-1.5">
            <button
              onClick={() => fileInput.current?.click()}
              disabled={busy}
              title="Trocar foto"
              className="rounded-md bg-white/90 p-1.5 text-slate-700 shadow hover:bg-white disabled:opacity-50"
            >
              <Camera className="h-4 w-4" />
            </button>
            <button
              onClick={handleRemove}
              disabled={busy}
              title="Remover foto"
              className="rounded-md bg-white/90 p-1.5 text-red-600 shadow hover:bg-white disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60">
              <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => fileInput.current?.click()}
          disabled={busy}
          className="flex h-20 w-full items-center justify-center gap-2 rounded-t-xl border-b border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
          {busy ? 'Enviando...' : 'Adicionar foto'}
        </button>
      )}

      {error && <p className="px-5 pt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
