import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { apiClient, API_URL } from '../services/api';
import { useAuthStore } from '../store/auth';
import { BrandLogo } from '../components/BrandLogo';

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = isRegister
        ? await apiClient.register(email, password, name)
        : await apiClient.login(email, password);

      const { user, accessToken } = response;
      apiClient.setToken(accessToken);
      setUser(user, accessToken);
      navigate('/dashboard');
    } catch (err: any) {
      if (!err.response) {
        setError(`Não foi possível conectar ao servidor (${API_URL}). Tente novamente em alguns segundos.`);
      } else {
        setError(err.response.data?.error || 'Erro inesperado. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center gap-2">
          <BrandLogo size={96} className="text-center" />
          <p className="text-xs text-slate-500">
            {isRegister ? 'Crie sua conta para gerenciar cardápios' : 'Entre para gerenciar seus cardápios'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {isRegister && (
            <input
              type="text"
              placeholder="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            required
          />

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-md bg-orange-600 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isRegister ? 'Criar conta' : 'Entrar'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister);
            setError('');
          }}
          className="mt-4 block w-full text-center text-xs text-slate-500 hover:text-slate-700"
        >
          {isRegister ? 'Já tem conta? Entrar' : 'Não tem conta? Criar conta'}
        </button>
      </div>
    </div>
  );
}
