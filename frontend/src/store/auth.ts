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
  restoreSession: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  accessToken: null,
  clientId: null,
  isLoggedIn: false,

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

  restoreSession: () => {
    const user = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');
    const clientId = localStorage.getItem('clientId');

    if (user && accessToken) {
      set({
        user: JSON.parse(user),
        accessToken,
        clientId,
        isLoggedIn: true,
      });
    }
  },
}));
