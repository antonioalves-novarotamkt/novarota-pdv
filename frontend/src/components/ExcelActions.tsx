import { useRef, useState } from 'react';
import { Upload, Download, FileSpreadsheet, CircleCheck, CircleAlert, Loader2, X, Link2 } from 'lucide-react';
import { apiClient, readApiError, ImportErrorResponse, ImportResult } from '../services/api';

type Busy = 'import' | 'sheet' | 'export' | 'template' | null;

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function summarize({ created, updated, categoriesCreated }: ImportResult) {
  const parts = [
    created > 0 && plural(created, 'produto criado', 'produtos criados'),
    updated > 0 && plural(updated, 'produto atualizado', 'produtos atualizados'),
    categoriesCreated > 0 && plural(categoriesCreated, 'categoria nova', 'categorias novas'),
  ].filter(Boolean);
  return `Planilha importada: ${parts.join(', ')}.`;
}

const buttonClass =
  'flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50';

export function ExcelActions({ clientId, onImported }: { clientId: string; onImported: () => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [success, setSuccess] = useState('');
  const [failure, setFailure] = useState<ImportErrorResponse | null>(null);
  const [showSheetForm, setShowSheetForm] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');

  const clearMessages = () => {
    setSuccess('');
    setFailure(null);
  };

  const download = async (template: boolean) => {
    clearMessages();
    setBusy(template ? 'template' : 'export');
    try {
      await apiClient.downloadProductsExcel(clientId, template);
    } catch (err) {
      setFailure(await readApiError(err));
    } finally {
      setBusy(null);
    }
  };

  const runImport = async (kind: Busy, doImport: () => Promise<ImportResult>) => {
    clearMessages();
    setBusy(kind);
    try {
      setSuccess(summarize(await doImport()));
      onImported();
      return true;
    } catch (err) {
      setFailure(await readApiError(err));
      return false;
    } finally {
      setBusy(null);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await runImport('import', () => apiClient.importProductsExcel(clientId, file));
  };

  const handleSheetImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await runImport('sheet', () => apiClient.importProductsGoogleSheet(clientId, sheetUrl));
    if (ok) {
      setShowSheetForm(false);
      setSheetUrl('');
    }
  };

  const spinner = <Loader2 className="h-4 w-4 animate-spin" />;

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInput}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleFile}
          className="hidden"
        />
        <button onClick={() => fileInput.current?.click()} disabled={busy !== null} className={buttonClass}>
          {busy === 'import' ? spinner : <Upload className="h-4 w-4" />}
          Importar planilha
        </button>
        <button
          onClick={() => setShowSheetForm(!showSheetForm)}
          disabled={busy !== null}
          className={buttonClass}
        >
          <Link2 className="h-4 w-4" />
          Importar do Google Planilhas
        </button>
        <button onClick={() => download(false)} disabled={busy !== null} className={buttonClass}>
          {busy === 'export' ? spinner : <Download className="h-4 w-4" />}
          Exportar planilha
        </button>
        <button onClick={() => download(true)} disabled={busy !== null} className={buttonClass}>
          {busy === 'template' ? spinner : <FileSpreadsheet className="h-4 w-4" />}
          Baixar modelo
        </button>
      </div>

      {showSheetForm && (
        <form
          onSubmit={handleSheetImport}
          className="mt-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <label className="mb-1 block text-xs font-medium text-slate-600">Link da planilha do Google</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="url"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
              autoFocus
              required
            />
            <button
              type="submit"
              disabled={busy !== null}
              className="flex items-center justify-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {busy === 'sheet' && spinner}
              Importar
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            A planilha precisa estar compartilhada como <strong>"Qualquer pessoa com o link"</strong> e usar as
            mesmas colunas do modelo. Só a primeira aba é importada.
          </p>
        </form>
      )}

      {success && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="flex-1">{success}</p>
          <button onClick={clearMessages} title="Fechar" className="text-green-700 hover:text-green-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {failure && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <div className="flex items-start gap-2">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="flex-1 font-medium">{failure.error}</p>
            <button onClick={clearMessages} title="Fechar" className="text-red-700 hover:text-red-900">
              <X className="h-4 w-4" />
            </button>
          </div>
          {failure.details && failure.details.length > 0 && (
            <ul className="mt-2 max-h-60 space-y-1 overflow-y-auto pl-6">
              {failure.details.map((detail) => (
                <li key={detail.row}>
                  <span className="font-semibold">Linha {detail.row}:</span> {detail.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
