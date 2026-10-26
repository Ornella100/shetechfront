import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

// Liste des parcours (publique)
export function useParcoursList() {
  return useQuery({
    queryKey: ["parcours"],
    queryFn: () => api.get("/parcours").then((r) => r.data),
  });
}

// Détail d'un parcours + formations ordonnées + progression
export function useParcoursDetail(id) {
  return useQuery({
    queryKey: ["parcours", id],
    queryFn: () => api.get(`/parcours/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

// Création / mise à jour / suppression (admin) — invalident le cache
export function useCreateParcours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post("/parcours", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parcours"] }),
  });
}

export function useUpdateParcours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/parcours/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parcours"] }),
  });
}

export function useDeleteParcours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/parcours/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parcours"] }),
  });
}

// Mes inscriptions aux parcours (max 3 actifs)
export function useMesInscriptions() {
  return useQuery({
    queryKey: ["mes-inscriptions"],
    queryFn: () => api.get("/parcours/mes-inscriptions").then((r) => r.data),
  });
}

export function useInscriptionParcours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (parcoursId) => api.post(`/parcours/${parcoursId}/inscription`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mes-inscriptions"] }),
  });
}

export function useDesinscriptionParcours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (parcoursId) => api.delete(`/parcours/${parcoursId}/inscription`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mes-inscriptions"] }),
  });
}
