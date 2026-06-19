import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from "react";
import type { User, UserRole } from "@/types";
import { initDatabase } from "@/db/database";
import { authService, setCurrentUserId } from "@/services/auth.service";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  dbReady: boolean;
}

type AuthAction =
  | { type: "SET_USER"; payload: User }
  | { type: "LOGOUT" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_DB_READY" };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  dbReady: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload, isAuthenticated: true, isLoading: false };
    case "LOGOUT":
      return { ...state, user: null, isAuthenticated: false, isLoading: false };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_DB_READY":
      return { ...state, dbReady: true };
    default:
      return state;
  }
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "restrohub_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize database
  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        dispatch({ type: "SET_DB_READY" });
      } catch (error) {
        console.error("Failed to initialize database:", error);
        dispatch({ type: "SET_DB_READY" });
      }
    };
    init();
  }, []);

  const checkAuth = useCallback(async () => {
    if (!state.dbReady) return;

    // Check localStorage for saved user
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored) as User;
        setCurrentUserId(user._id);
        dispatch({ type: "SET_USER", payload: user });
        return;
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    dispatch({ type: "LOGOUT" });
  }, [state.dbReady]);

  useEffect(() => {
    if (state.dbReady) {
      checkAuth();
    }
  }, [state.dbReady, checkAuth]);

  const login = async (email: string, password: string): Promise<User> => {
    // Ensure database is ready before login
    if (!state.dbReady) {
      await initDatabase();
    }
    const user = await authService.login({ email, password });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    setCurrentUserId(user._id);
    dispatch({ type: "SET_USER", payload: user });
    return user;
  };

  const logout = async () => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentUserId(null);
    await authService.logout();
    dispatch({ type: "LOGOUT" });
  };

  const hasRole = (roles: UserRole[]) => {
    if (!state.user) return false;
    return roles.includes(state.user.role);
  };

  // Show loading until DB is ready
  const isLoading = !state.dbReady || state.isLoading;

  return (
    <AuthContext.Provider value={{ ...state, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
