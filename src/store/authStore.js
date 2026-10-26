import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { disconnectSocket } from "../lib/socket";

function loadUser() {
  try {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create((set) => ({
  user: loadUser(),

  login: (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    disconnectSocket(); // force une reconnexion avec le nouveau token
    set({ user: userData });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    disconnectSocket();
    set({ user: null });
  },

  // Met à jour l'utilisateur courant (ex. après édition du profil) sans re-login
  setUser: (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    set({ user: userData });
  },
}));

// Compat : conserve la même API que l'ancien AuthContext (useAuth)
export const useAuth = () =>
  useAuthStore(
    useShallow((s) => ({ user: s.user, login: s.login, logout: s.logout, setUser: s.setUser }))
  );
