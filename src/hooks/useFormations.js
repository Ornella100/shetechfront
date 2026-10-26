import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export function useFormations() {
  return useQuery({
    queryKey: ['formations'],
    queryFn: async () => {
      const res = await api.get('/formations');
      return res.data;
    },
  });
}

export function useFormationDetail(id) {
  return useQuery({
    queryKey: ['formation', id],
    queryFn: async () => {
      const res = await api.get(`/formations/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useModules(formationId) {
  return useQuery({
    queryKey: ['modules', formationId],
    queryFn: async () => {
      const res = await api.get(`/formations/${formationId}/modules`);
      return res.data;
    },
    enabled: !!formationId,
  });
}

export function useModuleDetail(id) {
  return useQuery({
    queryKey: ['module', id],
    queryFn: async () => {
      const res = await api.get(`/modules/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCours(moduleId) {
  return useQuery({
    queryKey: ['cours', moduleId],
    queryFn: async () => {
      const res = await api.get(`/modules/${moduleId}/cours`);
      return res.data;
    },
    enabled: !!moduleId,
  });
}

export function useCoursDetail(id) {
  return useQuery({
    queryKey: ['cours', id],
    queryFn: async () => {
      const res = await api.get(`/cours/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useLecons(coursId) {
  return useQuery({
    queryKey: ['lecons', coursId],
    queryFn: async () => {
      const res = await api.get(`/cours/${coursId}/lecons`);
      return res.data;
    },
    enabled: !!coursId,
  });
}

// IDs des leçons complétées par l'utilisatrice pour une formation
export function useFormationProgressionLecons(formationId) {
  return useQuery({
    queryKey: ['formation-progression-lecons', formationId],
    queryFn: async () => {
      const res = await api.get(`/formations/${formationId}/progression-lecons`);
      return res.data;
    },
    enabled: !!formationId,
  });
}

export function useMarquerLeconComplete(formationId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (leconId) => {
      const res = await api.post(`/lecons/${leconId}/complete`, { tempsPasseMinutes: 0 });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['formation-progression-lecons', formationId] });
    },
  });
}

export function useLeconDetail(id) {
  return useQuery({
    queryKey: ['lecon', id],
    queryFn: async () => {
      const res = await api.get(`/lecons/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}
