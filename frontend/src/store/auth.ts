import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  clientId: string | null;
  isLoggedIn: boolean;

  setUser: (user: User, token: string) => void;
  setClientId: (clientId: string) => void;
  logout: () => void;
}

// Read synchronously so protected routes see the saved session on the very first render
// after a page reload, instead of redirecting to /login before it is restored.
function loadSession() {
  try {
    const user = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');
    if (user && accessToken) {
      return {
        user: JSON.parse(user) as User,
        accessToken,
        clientId: localStorage.getItem('clientId'),
        isLoggedIn: true,
      };
    }
  } catch {
    // Corrupted or unavailable storage: start logged out.
  }
  return { user: null, accessToken: null, clientId: null, isLoggedIn: false };
}

export const useAuthStore = create<AuthStore>((set) => ({
  ...loadSession(),

  setUser: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('accessToken', token);
    set({ user, accessToken: token, isLoggedIn: true });
  },

  setClientId: (clientId) => {
    localStorage.setItem('clientId', clientId);
    set({ clientId });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('clientId');
    set({ user: null, accessToken: null, clientId: null, isLoggedIn: false });
  },
}));
