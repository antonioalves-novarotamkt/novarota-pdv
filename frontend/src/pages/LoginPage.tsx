import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { apiClient, readApiError } from '../services/api';
import { useAuthStore } from '../store/auth';
import { AuthLayout, authButtonClass, authInputClass } from '../components/AuthLayout';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [searchParams] = useSearchParams();
  const passwordWasReset = searchParams.get('reset') === 'ok';
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
    } catch (err) {
      setError((await readApiError(err)).error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      subtitle={isRegister ? 'Crie sua conta para gerenciar cardápios' : 'Entre para gerenciar seus cardápios'}
    >
      {passwordWasReset && !isRegister && (
        <p className="mb-3 rounded-md bg-green-50 px-3 py-2 text-center text-xs text-green-700">
          Senha alterada com sucesso. Entre com sua nova senha.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {isRegister && (
          <input
            type="text"
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={authInputClass}
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={authInputClass}
          required
        />
        <input
          type="password"
          placeholder={isRegister ? 'Senha (mínimo 6 caracteres)' : 'Senha'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={authInputClass}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          required
        />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isRegister ? 'Criar conta' : 'Entrar'}
        </button>
      </form>

      {!isRegister && (
        <Link to="/esqueci-senha" className="mt-4 block text-center text-xs text-slate-500 hover:text-slate-700">
          Esqueci minha senha
        </Link>
      )}

      <button
        type="button"
        onClick={() => {
          setIsRegister(!isRegister);
          setError('');
        }}
        className="mt-2 block w-full text-center text-xs text-slate-500 hover:text-slate-700"
      >
        {isRegister ? 'Já tem conta? Entrar' : 'Não tem conta? Criar conta'}
      </button>
    </AuthLayout>
  );
}
