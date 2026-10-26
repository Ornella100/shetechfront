import { create } from "zustand";

// Pilote les fenêtres de chat flottantes (widget persistant sur tout le dashboard),
// utilisable depuis n'importe quel écran : discussions membres (suivi mutuel) et
// discussions projet (SheTech ↔ apprenante).
export const useMessagerie = create((set, get) => ({
  panelOpen: false,
  fenetres: [], // { key, type: "dm" | "projet", id, titre, sousTitre }

  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  closePanel: () => set({ panelOpen: false }),

  ouvrir: (fenetre) => {
    const existe = get().fenetres.some((f) => f.key === fenetre.key);
    if (existe) return;
    set((s) => ({ fenetres: [...s.fenetres, fenetre].slice(-3), panelOpen: false }));
  },

  fermer: (key) => set((s) => ({ fenetres: s.fenetres.filter((f) => f.key !== key) })),
}));
