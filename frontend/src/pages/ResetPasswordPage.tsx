import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { apiClient, readApiError } from '../services/api';
import { AuthLayout, authButtonClass, authInputClass } from '../components/AuthLayout';

const MIN_PASSWORD_LENGTH = 6;

export function ResetPasswordPage() {
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não são iguais.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.resetPassword(token, password);
      navigate('/login?reset=ok', { replace: true });
    } catch (err) {
      setError((await readApiError(err)).error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout subtitle="Crie uma nova senha para sua conta">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="password"
          placeholder={`Nova senha (mínimo ${MIN_PASSWORD_LENGTH} caracteres)`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={authInputClass}
          autoComplete="new-password"
          autoFocus
          required
        />
        <input
          type="password"
          placeholder="Confirme a nova senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={authInputClass}
          autoComplete="new-password"
          required
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar nova senha'}
        </button>
      </form>
      <Link to="/esqueci-senha" className="mt-4 block text-center text-xs text-slate-500 hover:text-slate-700">
        Pedir um novo link
      </Link>
    </AuthLayout>
  );
}
