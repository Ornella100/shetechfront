import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

// Statut d'accès : essai en cours, abonnement actif ou expiré
export function useAbonnementStatut() {
  return useQuery({
    queryKey: ["abonnement", "statut"],
    queryFn: () => api.get("/abonnement/statut").then((r) => r.data),
    staleTime: 60 * 1000,
  });
}

// Crée une transaction FedaPay et renvoie l'URL de la page de paiement hébergée
export function useCheckoutAbonnement() {
  return useMutation({
    mutationFn: () => api.post("/abonnement/checkout").then((r) => r.data),
  });
}

// Historique personnel des paiements
export function useMesPaiements() {
  return useQuery({
    queryKey: ["abonnement", "paiements"],
    queryFn: () => api.get("/abonnement/paiements").then((r) => r.data),
  });
}

// Au retour du checkout : force la vérification de la transaction côté FedaPay
export function useVerifierTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (transactionId) =>
      api.get(`/abonnement/verifier-transaction/${transactionId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["abonnement"] }),
  });
}

// Admin : traçabilité des essais, abonnements et paiements
export function useAdminAbonnements() {
  return useQuery({
    queryKey: ["admin", "abonnements"],
    queryFn: () => api.get("/admin/abonnements").then((r) => r.data),
  });
}
