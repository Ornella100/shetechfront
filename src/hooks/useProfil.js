import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";

export function useProfil() {
  return useQuery({
    queryKey: ["profil"],
    queryFn: () => api.get("/profil").then((r) => r.data),
  });
}

// Met à jour le profil texte + synchronise le store d'auth (nom/avatar affichés partout)
export function useUpdateProfil() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (data) => api.put("/profil", data).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["profil"] });
      if (res.user) {
        const current = useAuthStore.getState().user || {};
        setUser({ ...current, ...res.user });
      }
    },
  });
}

export function useUpdateAvatar() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (file) => {
      const form = new FormData();
      form.append("avatar", file);
      return api.post("/profil/avatar", form).then((r) => r.data);
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["profil"] });
      const current = useAuthStore.getState().user || {};
      setUser({ ...current, avatar: res.avatar });
    },
  });
}
