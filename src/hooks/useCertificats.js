import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

// Tous mes certificats (formations + parcours)
export function useMesCertificats() {
  return useQuery({
    queryKey: ["certificats"],
    queryFn: () => api.get("/certificats").then((r) => r.data),
  });
}

// Éligibilité au certificat — type: "formations" | "parcours"
export function useEligibiliteCertificat(type, id) {
  return useQuery({
    queryKey: ["certificats", "eligibilite", type, id],
    queryFn: () => api.get(`/${type}/${id}/certificat/verifier`).then((r) => r.data),
    enabled: !!id,
  });
}

// Génération UNIQUE du certificat avec le nom exact à imprimer
export function useGenererCertificat(type, id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nomComplet) =>
      api.post(`/${type}/${id}/certificat/generer`, { nomComplet }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["certificats"] });
    },
  });
}

// Télécharge le PDF d'un certificat existant (re-téléchargement toujours autorisé)
export async function telechargerCertificat(certificatId, nomFichier = "certificat.pdf") {
  const response = await api.get(`/certificats/${certificatId}/download`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nomFichier;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
