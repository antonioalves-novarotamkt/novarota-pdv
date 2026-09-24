import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, MailCheck } from 'lucide-react';
import { apiClient, readApiError } from '../services/api';
import { AuthLayout, authButtonClass, authInputClass } from '../components/AuthLayout';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentMessage, setSentMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      setSentMessage(await apiClient.forgotPassword(email));
    } catch (err) {
      setError((await readApiError(err)).error);
    } finally {
      setLoading(false);
    }
  };

  if (sentMessage) {
    return (
      <AuthLayout subtitle="Verifique seu email">
        <div className="flex flex-col items-center gap-3 text-center">
          <MailCheck className="h-10 w-10 text-orange-500" />
          <p className="text-sm text-slate-600">{sentMessage}</p>
          <p className="text-xs text-slate-400">
            O link vale por 1 hora. Se não encontrar o email, confira a caixa de spam.
          </p>
        </div>
        <Link to="/login" className="mt-6 block text-center text-xs text-slate-500 hover:text-slate-700">
          Voltar para o login
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout subtitle="Informe seu email para receber um link de redefinição de senha">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={authInputClass}
          autoFocus
          required
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar link'}
        </button>
      </form>
      <Link to="/login" className="mt-4 block text-center text-xs text-slate-500 hover:text-slate-700">
        Voltar para o login
      </Link>
    </AuthLayout>
  );
}
