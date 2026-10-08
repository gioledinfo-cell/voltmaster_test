import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, CompanyDepartment } from '../types';
import { INITIAL_USERS } from '../data/mockData';
import { apiService } from '../services/apiService';

export interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginError: string | null;
  login: (email: string, password?: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => void;
  switchUser: (userId: string) => Promise<boolean>;
  setLoginError: (msg: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'voltmaster_auth_token';
const USER_KEY = 'voltmaster_current_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    if (savedToken && savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return INITIAL_USERS[0];
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const t = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    const u = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    return !!t && !!u;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Validate session token on app load
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setIsLoading(false);
        setIsAuthenticated(false);
        setCurrentUser(null);
        return;
      }

      try {
        const response = await fetch('/api/v1/auth/me', {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            const matchedUser =
              INITIAL_USERS.find(
                (u) => u.email.toLowerCase() === data.user.email?.toLowerCase() || u.id === data.user.id
              ) || {
                id: data.user.id || 'usr-default',
                name: data.user.name || 'Utente Autenticato',
                email: data.user.email || '',
                role: (data.user.role as UserRole) || 'operatore',
                reparto: (data.user.reparto as CompanyDepartment) || 'ufficio_tecnico',
              };

            setCurrentUser(matchedUser);
            setIsAuthenticated(true);
            setToken(storedToken);
            localStorage.setItem(USER_KEY, JSON.stringify(matchedUser));
          } else {
            logout();
          }
        } else if (response.status === 401) {
          logout();
        } else {
          // Dev offline mode: restore stored user
          const storedUser = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
          if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
          }
        }
      } catch (err) {
        console.warn('Authentication check offline fallback active:', err);
        const storedUser = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
        if (storedUser) {
          try {
            setCurrentUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
          } catch (e) {
            logout();
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (emailInput: string, passwordInput?: string, rememberMe = true): Promise<boolean> => {
    setLoginError(null);
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanEmail) {
      setLoginError('Inserisci un indirizzo email o nome utente valido.');
      return false;
    }

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: passwordInput || 'voltmaster2026' }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.token) {
        const userObj: User =
          data.user ||
          INITIAL_USERS.find((u) => u.email.toLowerCase() === cleanEmail) ||
          INITIAL_USERS[0];

        setToken(data.token);
        apiService.setToken(data.token);
        setCurrentUser(userObj);
        setIsAuthenticated(true);

        if (rememberMe) {
          localStorage.setItem(TOKEN_KEY, data.token);
          localStorage.setItem(USER_KEY, JSON.stringify(userObj));
        } else {
          sessionStorage.setItem(TOKEN_KEY, data.token);
          sessionStorage.setItem(USER_KEY, JSON.stringify(userObj));
        }

        return true;
      } else {
        setLoginError(data.message || 'Credenziali non valide. Verifica email e password.');
        return false;
      }
    } catch (err) {
      console.warn('Login server connection failed, trying local matching:', err);
      const matched = INITIAL_USERS.find((u) => u.email.toLowerCase() === cleanEmail);
      if (matched) {
        const dummyToken = `dev-token-${Date.now()}`;
        setToken(dummyToken);
        setCurrentUser(matched);
        setIsAuthenticated(true);
        localStorage.setItem(TOKEN_KEY, dummyToken);
        localStorage.setItem(USER_KEY, JSON.stringify(matched));
        return true;
      } else {
        setLoginError('Utente non registrato nel sistema. Seleziona uno degli utenti demo in basso.');
        return false;
      }
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    apiService.setToken('');
    setToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setLoginError(null);
  };

  const switchUser = async (userId: string): Promise<boolean> => {
    const targetUser = INITIAL_USERS.find((u) => u.id === userId) || INITIAL_USERS[0];
    return await login(targetUser.email, 'voltmaster2026', true);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isAuthenticated,
        isLoading,
        loginError,
        login,
        logout,
        switchUser,
        setLoginError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere utilizzato all\'interno di un AuthProvider');
  }
  return context;
};
