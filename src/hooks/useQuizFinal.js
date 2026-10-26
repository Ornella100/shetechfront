import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

// type: "formations" (seuil 85 %) | "parcours" (seuil 100 %)

export function useQuizFinalStatus(type, id) {
  return useQuery({
    queryKey: ["quiz-final", type, id, "status"],
    queryFn: () => api.get(`/${type}/${id}/quiz-final/status`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useQuizFinalQuestions(type, id, enabled = true) {
  return useQuery({
    queryKey: ["quiz-final", type, id, "questions"],
    queryFn: () => api.get(`/${type}/${id}/quiz-final`).then((r) => r.data),
    enabled: !!id && enabled,
  });
}

export function useSoumettreQuizFinal(type, id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reponses) =>
      api.post(`/${type}/${id}/quiz-final/soumettre`, { reponses }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quiz-final", type, id] });
      qc.invalidateQueries({ queryKey: ["certificats"] });
    },
  });
}
