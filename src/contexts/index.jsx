import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authApi } from "../api";

// ── Auth
const AuthCtx = createContext(null);

const normalise = (u) =>
  u
    ? {
        ...u,
        fullName: u.fullName || u.full_name,
        roleLabel: u.roleLabel || u.role_label,
      }
    : null;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return normalise(JSON.parse(localStorage.getItem("user")));
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((r) => setUser(normalise(r.data.data)))
      .catch(() => {
        localStorage.clear();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const r = await authApi.login({ email, password });
    const { token, user } = r.data.data;
    const norm = normalise(user);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(norm));
    setUser(norm);
    return norm;
  }, []);

  const logout = useCallback(() => {
    localStorage.clear();
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin: user?.role === "admin",
        isOfficer: user?.role === "admin" || user?.role === "field_officer",
      }}>
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => useContext(AuthCtx);

// ── Theme
const ThemeCtx = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light",
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <ThemeCtx.Provider
      value={{
        theme,
        isDark: theme === "dark",
        toggle: () => setTheme((t) => (t === "light" ? "dark" : "light")),
      }}>
      {children}
    </ThemeCtx.Provider>
  );
};

export const useTheme = () => useContext(ThemeCtx);
