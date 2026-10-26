import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus, faShareNodes, faEyeSlash, faTrash, faPenToSquare, faEye,
  faCheck, faXmark, faFileArrowDown, faLink,
  faFolderOpen, faHourglassHalf, faFlagCheckered, faComments,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "./store/authStore";
import { useMessagerie } from "./store/messagerieStore";
import api from "./lib/api";

const ACCENT = "#C45C7A";
const DARK = "#2B1B24";
const GRAY = "#9A8090";
const BORDER = "#EDE3E7";
const SOFT_BG = "#F9F4F6";

const PROJECT_DOMAINS = [
  "Developpement Web",
  "Intelligence Artificielle",
  "Marketing Digital",
  "Design UI/UX",
  "E-commerce",
  "Leadership",
  "Cybersecurite",
  "Freelance",
  "Autre"
];

const DOMAIN_DETAILS = {
  "Developpement Web": {
    toolsLabel: "Technologies utilisees",
    toolsPlaceholder: "React, Node.js, MySQL...",
    deliverables: "Code source, lien GitHub, lien demo, documentation PDF"
  },
  "Intelligence Artificielle": {
    toolsLabel: "Outils, modeles ou donnees",
    toolsPlaceholder: "Python, TensorFlow, dataset, notebook...",
    deliverables: "Notebook, rapport PDF, jeu de donnees, presentation"
  },
  "Marketing Digital": {
    toolsLabel: "Canaux et outils utilises",
    toolsPlaceholder: "Instagram, Canva, Meta Ads, email...",
    deliverables: "Strategie PDF, calendrier editorial, rapport de campagne"
  },
  "Design UI/UX": {
    toolsLabel: "Outils et methodes",
    toolsPlaceholder: "Figma, wireframes, prototype, tests utilisateur...",
    deliverables: "Maquette, prototype, moodboard, rapport UX"
  },
  "E-commerce": {
    toolsLabel: "Plateformes et ressources",
    toolsPlaceholder: "Shopify, WooCommerce, catalogue, paiement...",
    deliverables: "Catalogue PDF, fiche boutique, plan commercial"
  },
  "Leadership": {
    toolsLabel: "Competences travaillees",
    toolsPlaceholder: "Communication, planification, gestion d'equipe...",
    deliverables: "Plan d'action, presentation, rapport de decision"
  },
  "Cybersecurite": {
    toolsLabel: "Outils et notions",
    toolsPlaceholder: "Audit, OWASP, analyse de risques, bonnes pratiques...",
    deliverables: "Rapport d'audit, checklist, plan de securisation"
  },
  "Freelance": {
    toolsLabel: "Outils et competences",
    toolsPlaceholder: "Portfolio, prospection, devis, gestion client...",
    deliverables: "Portfolio, proposition commerciale, modele de devis"
  },
  "Autre": {
    toolsLabel: "Outils / competences",
    toolsPlaceholder: "Outils, methodes, competences...",
    deliverables: "Rapport PDF, presentation, fichier de travail"
  }
};

const defaultFormData = {
  titre: "",
  description: "",
  statut: "en_cours",
  domaine: "",
  lien_github: "",
  lien_demo: "",
  technologies: ""
};

const getDomainDetails = (domaine) => DOMAIN_DETAILS[domaine] || DOMAIN_DETAILS.Autre;

const projectStatusLabel = (statut) => {
  if (statut === "termine") return "Terminé";
  if (statut === "lance") return "Lancé";
  return "En cours";
};

const projectStatusColor = (statut) => {
  if (statut === "termine") return "#2E7D32";
  if (statut === "lance") return "#4CAF8A";
  return "#E8A554";
};

const acceptationBadge = (statut) => {
  if (statut === "en_attente") return { label: "En attente de ta réponse", bg: "#FFF6E8", color: "#B97A1F" };
  if (statut === "refuse") return { label: "Refusé", bg: "#FDECEC", color: "#C0392B" };
  return { label: "Accepté", bg: "#E8F5E8", color: "#2E7D32" };
};

const btn = (bg, color = "#fff", extra = {}) => ({
  background: bg, border: "none", color, padding: "8px 16px", borderRadius: 6,
  cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
  display: "inline-flex", alignItems: "center", gap: 6, ...extra,
});

/* ── Ouvre la discussion projet dans le widget de messagerie flottant ── */
function DiscussionProjetCard({ projet }) {
  const ouvrir = useMessagerie((s) => s.ouvrir);
  return (
    <div style={{ background: SOFT_BG, borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div>
        <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: DARK }}>
          <FontAwesomeIcon icon={faComments} style={{ color: ACCENT, marginRight: 8 }} />
          Discussion avec SheTech
        </h3>
        <p style={{ fontSize: 13, color: GRAY, lineHeight: 1.6, margin: "0 0 16px" }}>
          Pose tes questions sur ce projet à l'équipe SheTech. La discussion s'ouvre dans le widget de
          messagerie en bas à droite et reste disponible pendant que tu navigues sur le site.
        </p>
      </div>
      <button
        onClick={() => ouvrir({ key: `projet-${projet.id}`, type: "projet", id: projet.id, titre: projet.titre, sousTitre: "Discussion avec SheTech" })}
        style={btn(ACCENT, "#fff", { justifyContent: "center", padding: "10px 16px", fontSize: 13 })}
      >
        <FontAwesomeIcon icon={faComments} />
        Ouvrir la discussion
      </button>
    </div>
  );
}

/* ── Liste de livrables + upload (fichier ou lien) ── */
function LivrablesPanel({ projet, livrables, onOpenUpload, onRemove, canEdit, hint }) {
  return (
    <div style={{ background: SOFT_BG, borderRadius: 12, padding: 18 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: DARK }}>
        <FontAwesomeIcon icon={faFolderOpen} style={{ color: ACCENT, marginRight: 8 }} />
        Livrables et photos
      </h3>

      {(livrables || []).length === 0 && (
        <p style={{ fontSize: 13, color: GRAY, margin: "0 0 10px" }}>{hint || "Aucun livrable ajouté."}</p>
      )}

      <ul style={{ paddingLeft: 0, margin: "0 0 12px", listStyle: "none" }}>
        {(livrables || []).map((l) => (
          <li key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${BORDER}`, fontSize: 14, color: DARK }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span>{l.titre}</span>
              {l.fichier_url ? (
                <a
                  href={`${api.defaults.baseURL}${l.fichier_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: ACCENT, fontSize: 12, textDecoration: "none", background: "#F4EEF1", padding: "2px 8px", borderRadius: 4 }}
                >
                  <FontAwesomeIcon icon={faFileArrowDown} style={{ marginRight: 4 }} />
                  Télécharger
                </a>
              ) : l.lien && (
                <a
                  href={l.lien}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#6D7FCC", fontSize: 12, textDecoration: "none", background: "#EEF0FB", padding: "2px 8px", borderRadius: 4 }}
                >
                  <FontAwesomeIcon icon={faLink} style={{ marginRight: 4 }} />
                  Ouvrir le lien
                </a>
              )}
            </div>
            {canEdit && (
              <button
                onClick={() => onRemove(projet.id, l.id)}
                style={{ background: "transparent", border: "none", color: ACCENT, cursor: "pointer", fontSize: 14, lineHeight: 1 }}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )}
          </li>
        ))}
      </ul>

      {canEdit && (
        <button
          onClick={() => onOpenUpload(projet.id)}
          style={btn(ACCENT, "#fff", { width: "100%", justifyContent: "center", padding: "8px 16px", fontSize: 13 })}
        >
          <FontAwesomeIcon icon={faPlus} />
          Ajouter un livrable (fichier ou lien)
        </button>
      )}
    </div>
  );
}

export default function Projets() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onglet, setOnglet] = useState("proposition"); // 'proposition' | 'assigne'
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProjet, setEditingProjet] = useState(null);
  const [selectedProjet, setSelectedProjet] = useState(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [createLivrableType, setCreateLivrableType] = useState("fichier"); // 'fichier' | 'lien'
  const [createLivrableTitre, setCreateLivrableTitre] = useState("");
  const [createLivrableFichier, setCreateLivrableFichier] = useState(null);
  const [createLivrableLien, setCreateLivrableLien] = useState("");

  // Livrables persistés : { [projetId]: [{id, titre, fichier_url, lien}] }
  const [livrables, setLivrables] = useState({});

  // Modal d'upload
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentProjetId, setCurrentProjetId] = useState(null);
  const [newLivrableType, setNewLivrableType] = useState("fichier"); // 'fichier' | 'lien'
  const [newLivrableTitre, setNewLivrableTitre] = useState("");
  const [newLivrableFichier, setNewLivrableFichier] = useState(null);
  const [newLivrableLien, setNewLivrableLien] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleAuthError = (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      alert("Votre session a expire. Veuillez vous reconnecter.");
      logout();
      navigate("/login");
      return true;
    }
    return false;
  };

  const getProjectProgress = (statut) => {
    switch (statut) {
      case "termine": return 100;
      case "lance": return 75;
      default: return 45;
    }
  };

  const normalizeProjet = (projet) => ({
    ...projet,
    statut: projet.statut === "lancé" ? "lance" : projet.statut === "terminé" ? "termine" : projet.statut,
    is_public: projet.is_public ?? projet.isPublic ?? false,
    statut_acceptation: projet.statut_acceptation ?? projet.statutAcceptation ?? "accepte",
    technologies: typeof projet.technologies === "string"
      ? projet.technologies ? JSON.parse(projet.technologies) : []
      : Array.isArray(projet.technologies) ? projet.technologies : []
  });

  const currentDomainDetails = getDomainDetails(formData.domaine);
  const currentUploadProjet = projets.find((projet) => projet.id === currentProjetId);
  const currentUploadDetails = getDomainDetails(currentUploadProjet?.domaine);

  useEffect(() => { fetchProjets(); }, []);

  const fetchProjets = async () => {
    try {
      const response = await api.get("/projets");
      const list = response.data.map(normalizeProjet);
      setProjets(list);
      setSelectedProjet((prev) => prev ? list.find((p) => p.id === prev.id) || null : null);
    } catch (err) {
      console.error("Erreur chargement projets:", err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLivrables = async (projetId) => {
    try {
      const res = await api.get(`/projets/${projetId}/livrables`);
      setLivrables(prev => ({ ...prev, [projetId]: res.data }));
    } catch (err) {
      console.error("Erreur chargement livrables:", err);
    }
  };

  const openDetail = (projet) => {
    setSelectedProjet(projet);
    fetchLivrables(projet.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openUploadModal = (projetId) => {
    setCurrentProjetId(projetId);
    setNewLivrableType("fichier");
    setNewLivrableTitre("");
    setNewLivrableFichier(null);
    setNewLivrableLien("");
    setShowUploadModal(true);
  };

  const handleUpload = async () => {
    if (!newLivrableTitre.trim()) { alert("Veuillez entrer un titre"); return; }
    if (newLivrableType === "fichier" && !newLivrableFichier) { alert("Veuillez sélectionner un fichier"); return; }
    if (newLivrableType === "lien" && !newLivrableLien.trim()) { alert("Veuillez indiquer un lien"); return; }

    setUploading(true);
    const fd = new FormData();
    fd.append("titre", newLivrableTitre.trim());
    if (newLivrableType === "fichier") fd.append("fichier", newLivrableFichier);
    else fd.append("lien", newLivrableLien.trim());

    try {
      const res = await api.post(`/projets/${currentProjetId}/livrables`, fd);
      setLivrables(prev => ({
        ...prev,
        [currentProjetId]: [res.data, ...(prev[currentProjetId] || [])]
      }));
      setShowUploadModal(false);
      setNewLivrableTitre("");
      setNewLivrableFichier(null);
      setNewLivrableLien("");
    } catch (err) {
      console.error("Erreur upload livrable:", err);
      alert(err.response?.data?.message || "Impossible d'ajouter le livrable.");
    } finally {
      setUploading(false);
    }
  };

  const removeLivrable = async (projetId, livrableId) => {
    if (!window.confirm("Supprimer ce livrable ?")) return;
    try {
      await api.delete(`/livrables/${livrableId}`);
      setLivrables(prev => ({
        ...prev,
        [projetId]: prev[projetId].filter(l => l.id !== livrableId)
      }));
    } catch (err) {
      console.error("Erreur suppression livrable:", err);
      alert("Impossible de supprimer le livrable.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    try {
      setSaving(true);
      const data = {
        ...formData,
        technologies: formData.technologies.split(",").map(t => t.trim()).filter(t => t)
      };
      if (editingProjet) {
        await api.put(`/projets/${editingProjet.id}`, data);
      } else {
        const projetRes = await api.post("/projets", data);
        const projetId = projetRes.data.id;
        if (createLivrableType === "fichier" ? createLivrableFichier : createLivrableLien.trim()) {
          const livrableFormData = new FormData();
          livrableFormData.append("titre", createLivrableTitre.trim() || "Livrable principal");
          if (createLivrableType === "fichier") livrableFormData.append("fichier", createLivrableFichier);
          else livrableFormData.append("lien", createLivrableLien.trim());
          await api.post(`/projets/${projetId}/livrables`, livrableFormData);
        }
      }
      resetForm();
      fetchProjets();
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
      if (handleAuthError(err)) return;
      const message = err.response?.data?.message || err.message || "Impossible de sauvegarder le projet.";
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (projet) => {
    setEditingProjet(projet);
    setCreateLivrableTitre("");
    setCreateLivrableFichier(null);
    setFormData({
      titre: projet.titre,
      description: projet.description || "",
      statut: projet.statut,
      domaine: projet.domaine || "",
      lien_github: projet.lien_github || "",
      lien_demo: projet.lien_demo || "",
      technologies: projet.technologies ? projet.technologies.join(", ") : ""
    });
    setShowCreateForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Etes-vous sur de vouloir supprimer ce projet ?")) return;
    try {
      await api.delete(`/projets/${id}`);
      if (selectedProjet?.id === id) setSelectedProjet(null);
      fetchProjets();
    } catch (err) {
      console.error("Erreur suppression:", err);
    }
  };

  // Partager / retirer un projet personnel de la communauté
  const handlePartager = async (projet) => {
    const partager = !projet.is_public;
    if (partager && !window.confirm("Partager ce projet avec la communauté ? Les autres membres pourront le lire, voir tes livrables et te donner des conseils.")) return;
    try {
      await api.put(`/projets/${projet.id}/partage`, { is_public: partager });
      fetchProjets();
    } catch (err) {
      console.error("Erreur partage:", err);
      alert(err.response?.data?.message || "Impossible de modifier le partage.");
    }
  };

  // Accepter / refuser un projet assigné par SheTech
  const handleReponse = async (projet, action) => {
    const confirmMsg = action === "accepter"
      ? "Accepter ce projet ? Tu pourras ensuite travailler dessus, discuter avec SheTech et soumettre tes livrables."
      : "Refuser ce projet ?";
    if (!window.confirm(confirmMsg)) return;
    try {
      await api.put(`/projets/${projet.id}/reponse`, { action });
      fetchProjets();
    } catch (err) {
      console.error("Erreur réponse projet:", err);
      alert(err.response?.data?.message || "Impossible d'enregistrer ta réponse.");
    }
  };

  // Soumettre un projet assigné (marquer terminé)
  const handleSoumettre = async (projet) => {
    if ((livrables[projet.id] || []).length === 0) {
      alert("Ajoute au moins un livrable avant de soumettre le projet.");
      return;
    }
    if (!window.confirm("Soumettre le projet à SheTech ? Il sera marqué comme terminé.")) return;
    try {
      await api.put(`/projets/${projet.id}`, { statut: "termine" });
      fetchProjets();
    } catch (err) {
      console.error("Erreur soumission:", err);
      alert(err.response?.data?.message || "Impossible de soumettre le projet.");
    }
  };

  const resetForm = () => {
    setShowCreateForm(false);
    setEditingProjet(null);
    setFormData(defaultFormData);
    setCreateLivrableType("fichier");
    setCreateLivrableTitre("");
    setCreateLivrableFichier(null);
    setCreateLivrableLien("");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#F4EEF1", fontFamily: "'Georgia', serif" }}>
        <p style={{ color: GRAY, fontSize: 16 }}>Chargement des projets...</p>
      </div>
    );
  }

  const estAssigne = selectedProjet?.origine === "assigne";

  return (
    <div className="st-soft-page" style={{ minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#F4EEF1" }}>

      {/* Header */}
      <div style={{ background: DARK, color: "#fff", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => navigate("/dashboard")} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontSize: 14 }}>
            ← Tableau de bord
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Mes Projets</h1>
        </div>
        <button onClick={() => { setOnglet("proposition"); resetForm(); setShowCreateForm(true); }} style={btn(ACCENT, "#fff", { padding: "12px 24px", fontSize: 14 })}>
          <FontAwesomeIcon icon={faPlus} />
          Nouveau Projet
        </button>
      </div>

      <div style={{ padding: "32px" }}>

        {/* Formulaire création / édition (projets personnels uniquement) */}
        {showCreateForm && (
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: "0 2px 12px rgba(43,27,36,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: DARK, margin: 0 }}>
                {editingProjet ? "Modifier le projet" : "Creer un nouveau projet"}
              </h2>
              <button onClick={resetForm} style={{ background: "transparent", border: "none", color: GRAY, cursor: "pointer", fontSize: 18 }}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: DARK, marginBottom: 4 }}>Titre du projet *</label>
                <input type="text" value={formData.titre} onChange={e => setFormData({ ...formData, titre: e.target.value })} required
                  style={{ width: "100%", padding: 12, border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 14 }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: DARK, marginBottom: 4 }}>Description *</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required rows={4}
                  placeholder="Décris ton projet : son objectif, ce que tu as réalisé, où tu en es..."
                  style={{ width: "100%", padding: 12, border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 14, resize: "vertical" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: DARK, marginBottom: 4 }}>Statut</label>
                  <select value={formData.statut} onChange={e => setFormData({ ...formData, statut: e.target.value })}
                    style={{ width: "100%", padding: 12, border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 14 }}>
                    <option value="en_cours">En cours</option>
                    <option value="lance">Lance</option>
                    <option value="termine">Termine</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: DARK, marginBottom: 4 }}>Domaine *</label>
                  <select value={formData.domaine} onChange={e => setFormData({ ...formData, domaine: e.target.value })} required
                    style={{ width: "100%", padding: 12, border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 14 }}>
                    <option value="">Choisir un domaine</option>
                    {PROJECT_DOMAINS.map((domaine) => (
                      <option key={domaine} value={domaine}>{domaine}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: DARK, marginBottom: 4 }}>
                  {currentDomainDetails.toolsLabel} (separes par des virgules)
                </label>
                <input type="text" value={formData.technologies} onChange={e => setFormData({ ...formData, technologies: e.target.value })}
                  placeholder={currentDomainDetails.toolsPlaceholder}
                  style={{ width: "100%", padding: 12, border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 14 }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: DARK, marginBottom: 4 }}>Lien GitHub</label>
                  <input type="url" value={formData.lien_github} onChange={e => setFormData({ ...formData, lien_github: e.target.value })}
                    placeholder="https://github.com/..."
                    style={{ width: "100%", padding: 12, border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: DARK, marginBottom: 4 }}>Lien demo / ressource</label>
                  <input type="url" value={formData.lien_demo} onChange={e => setFormData({ ...formData, lien_demo: e.target.value })}
                    placeholder="https://..."
                    style={{ width: "100%", padding: 12, border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 14 }} />
                </div>
              </div>

              {!editingProjet && (
                <div style={{ background: SOFT_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: DARK }}>
                    Photo ou livrable du projet (optionnel)
                  </h3>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    {[["fichier", "Fichier"], ["lien", "Lien"]].map(([id, label]) => (
                      <button key={id} type="button" onClick={() => setCreateLivrableType(id)} style={{
                        padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12.5, fontWeight: 600,
                        border: `1px solid ${createLivrableType === id ? ACCENT : BORDER}`,
                        background: createLivrableType === id ? ACCENT : "#fff",
                        color: createLivrableType === id ? "#fff" : GRAY,
                      }}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: DARK, marginBottom: 4 }}>Titre du livrable</label>
                      <input
                        type="text"
                        value={createLivrableTitre}
                        onChange={e => setCreateLivrableTitre(e.target.value)}
                        placeholder={`Ex: ${currentDomainDetails.deliverables.split(",")[0]}`}
                        style={{ width: "100%", padding: 12, border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 14 }}
                      />
                    </div>
                    {createLivrableType === "fichier" ? (
                      <div>
                        <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: DARK, marginBottom: 4 }}>Fichier (photo, PDF...)</label>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                          onChange={e => setCreateLivrableFichier(e.target.files[0])}
                          style={{ width: "100%", padding: 10, border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 13, background: "#fff" }}
                        />
                      </div>
                    ) : (
                      <div>
                        <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: DARK, marginBottom: 4 }}>Lien (Drive, Figma, GitHub...)</label>
                        <input
                          type="url"
                          value={createLivrableLien}
                          onChange={e => setCreateLivrableLien(e.target.value)}
                          placeholder="https://..."
                          style={{ width: "100%", padding: 12, border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 14 }}
                        />
                      </div>
                    )}
                  </div>
                  <p style={{ margin: "8px 0 0", fontSize: 12, color: GRAY }}>
                    Tu pourras ajouter d'autres photos et livrables plus tard, puis partager ton projet avec la communauté pour demander conseil. Suggestions : {currentDomainDetails.deliverables}
                  </p>
                </div>
              )}

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button type="submit" disabled={saving} style={btn(saving ? GRAY : ACCENT, "#fff", { padding: "12px 24px", fontSize: 14, cursor: saving ? "not-allowed" : "pointer" })}>
                  {saving ? "Enregistrement..." : editingProjet ? "Modifier" : "Creer le projet"}
                </button>
                <button type="button" onClick={resetForm} style={{ background: "transparent", border: `1px solid ${BORDER}`, color: GRAY, padding: "12px 24px", borderRadius: 6, cursor: "pointer", fontSize: 14 }}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Detail projet */}
        {selectedProjet && (
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: "0 2px 12px rgba(43,27,36,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: projectStatusColor(selectedProjet.statut) }} />
                  <div style={{ fontSize: 13, color: projectStatusColor(selectedProjet.statut), fontWeight: 700 }}>
                    {projectStatusLabel(selectedProjet.statut)}
                  </div>
                  {selectedProjet.domaine && (
                    <div style={{ fontSize: 12, color: ACCENT, fontWeight: 700, background: "#F4EEF1", padding: "4px 10px", borderRadius: 999 }}>
                      {selectedProjet.domaine}
                    </div>
                  )}
                  {estAssigne ? (
                    <div style={{ fontSize: 12, fontWeight: 700, background: "#EEE6FA", color: "#6D4FA1", padding: "4px 10px", borderRadius: 999 }}>
                      Projet SheTech
                    </div>
                  ) : selectedProjet.is_public && (
                    <div style={{ fontSize: 12, fontWeight: 700, background: "#E8F5E8", color: "#2E7D32", padding: "4px 10px", borderRadius: 999 }}>
                      <FontAwesomeIcon icon={faShareNodes} style={{ marginRight: 4 }} />
                      Partagé avec la communauté
                    </div>
                  )}
                </div>
                <h2 style={{ fontSize: 20, margin: 0, color: DARK }}>{selectedProjet.titre}</h2>
                <p style={{ color: GRAY, fontSize: 14, lineHeight: 1.75, marginTop: 8, whiteSpace: "pre-wrap" }}>{selectedProjet.description}</p>

                {estAssigne && selectedProjet.brief && (
                  <div style={{ background: SOFT_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14, marginTop: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 6 }}>Brief SheTech : {selectedProjet.brief.titre}</div>
                    {selectedProjet.brief.consignes && (
                      <p style={{ fontSize: 13, color: GRAY, margin: "0 0 6px", whiteSpace: "pre-wrap" }}><strong style={{ color: DARK }}>Consignes :</strong> {selectedProjet.brief.consignes}</p>
                    )}
                    {selectedProjet.brief.livrables && (
                      <p style={{ fontSize: 13, color: GRAY, margin: 0, whiteSpace: "pre-wrap" }}><strong style={{ color: DARK }}>Livrables attendus :</strong> {selectedProjet.brief.livrables}</p>
                    )}
                  </div>
                )}

                {estAssigne && selectedProjet.statut_evaluation && selectedProjet.statut_evaluation !== "en_attente" && (
                  <div style={{ background: "#F0F7F4", border: "1px solid #CDE8DC", borderRadius: 10, padding: 14, marginTop: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#2E7D32", marginBottom: 4 }}>
                      Évaluation SheTech : {selectedProjet.statut_evaluation}{selectedProjet.note != null ? ` — Note : ${selectedProjet.note}/20` : ""}
                    </div>
                    {selectedProjet.commentaire_mentor && (
                      <p style={{ fontSize: 13, color: "#3B5A4C", margin: 0 }}>{selectedProjet.commentaire_mentor}</p>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
                {!estAssigne && (
                  <>
                    <button onClick={() => handlePartager(selectedProjet)}
                      style={btn(selectedProjet.is_public ? "#fff" : "#4CAF8A", selectedProjet.is_public ? "#4CAF8A" : "#fff", { padding: "12px 18px", fontSize: 13, border: selectedProjet.is_public ? "1px solid #4CAF8A" : "none" })}>
                      <FontAwesomeIcon icon={selectedProjet.is_public ? faEyeSlash : faShareNodes} />
                      {selectedProjet.is_public ? "Retirer de la communauté" : "Partager avec la communauté"}
                    </button>
                    <button onClick={() => { handleEdit(selectedProjet); setSelectedProjet(null); }}
                      style={btn(ACCENT, "#fff", { padding: "12px 18px", fontSize: 13 })}>
                      <FontAwesomeIcon icon={faPenToSquare} />
                      Mettre a jour
                    </button>
                  </>
                )}
                {estAssigne && selectedProjet.statut !== "termine" && selectedProjet.statut_acceptation === "accepte" && (
                  <button onClick={() => handleSoumettre(selectedProjet)}
                    style={btn("#4CAF8A", "#fff", { padding: "12px 18px", fontSize: 13 })}>
                    <FontAwesomeIcon icon={faFlagCheckered} />
                    Soumettre le projet
                  </button>
                )}
                <button onClick={() => setSelectedProjet(null)}
                  style={{ background: "transparent", border: `1px solid ${BORDER}`, color: GRAY, padding: "12px 18px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
                  Fermer
                </button>
              </div>
            </div>

            {/* Barre de progression */}
            <div style={{ marginTop: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 10, background: "#EDF2F7", borderRadius: 999 }}>
                  <div style={{ width: `${getProjectProgress(selectedProjet.statut)}%`, height: 10, background: ACCENT, borderRadius: 999, transition: "width 0.3s" }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: DARK }}>{getProjectProgress(selectedProjet.statut)}%</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 18 }}>
                <LivrablesPanel
                  projet={selectedProjet}
                  livrables={livrables[selectedProjet.id]}
                  onOpenUpload={openUploadModal}
                  onRemove={removeLivrable}
                  canEdit={!estAssigne || selectedProjet.statut_acceptation === "accepte"}
                  hint={estAssigne
                    ? "Soumets ici les livrables demandés par SheTech à la fin de ton travail."
                    : "Ajoute des photos ou livrables pour que les autres puissent découvrir ton projet."}
                />

                {estAssigne ? (
                  <DiscussionProjetCard projet={selectedProjet} />
                ) : (
                  <div style={{ background: SOFT_BG, borderRadius: 12, padding: 18 }}>
                    <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 700, color: DARK }}>
                      {getDomainDetails(selectedProjet.domaine).toolsLabel}
                    </h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {selectedProjet.technologies?.map((tech, i) => (
                        <span key={i} style={{ fontSize: 12, padding: "6px 10px", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 8, color: DARK }}>
                          {tech}
                        </span>
                      ))}
                    </div>
                    <p style={{ fontSize: 12, color: GRAY, marginTop: 14, lineHeight: 1.6 }}>
                      {selectedProjet.is_public
                        ? "Ton projet est visible dans la communauté : les membres peuvent le commenter et te donner des conseils."
                        : "Partage ton projet avec la communauté pour demander des conseils aux autres membres."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Onglets : mes projets vs projets SheTech */}
        {(() => {
          const nbProp = projets.filter((p) => (p.origine || "proposition") === "proposition").length;
          const nbAssigne = projets.filter((p) => p.origine === "assigne").length;
          const nbEnAttente = projets.filter((p) => p.origine === "assigne" && p.statut_acceptation === "en_attente").length;
          const ongletStyle = (actif) => ({
            padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer",
            fontSize: 14, fontWeight: 600, fontFamily: "inherit",
            background: actif ? ACCENT : "#fff", color: actif ? "#fff" : "#7A6570",
            boxShadow: "0 1px 4px rgba(43,27,36,0.08)",
            display: "inline-flex", alignItems: "center", gap: 8,
          });
          return (
            <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
              <button onClick={() => { setOnglet("proposition"); setSelectedProjet(null); }} style={ongletStyle(onglet === "proposition")}>
                Mes projets ({nbProp})
              </button>
              <button onClick={() => { setOnglet("assigne"); setSelectedProjet(null); }} style={ongletStyle(onglet === "assigne")}>
                Projets SheTech ({nbAssigne})
                {nbEnAttente > 0 && (
                  <span style={{ background: "#E8A554", color: "#fff", borderRadius: 999, padding: "2px 8px", fontSize: 11 }}>
                    {nbEnAttente} en attente
                  </span>
                )}
              </button>
            </div>
          );
        })()}

        {/* Liste des projets filtrée par onglet */}
        {(() => {
          const projetsFiltres = projets.filter((p) =>
            onglet === "assigne" ? p.origine === "assigne" : (p.origine || "proposition") === "proposition"
          );
          return projetsFiltres.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 12, padding: 48, textAlign: "center", boxShadow: "0 2px 12px rgba(43,27,36,0.1)" }}>
            <p style={{ color: GRAY, fontSize: 16, marginBottom: 16 }}>
              {onglet === "assigne"
                ? "SheTech ne t'a proposé aucun projet pour le moment."
                : "Aucun projet pour le moment. Crée ton premier projet et partage-le avec la communauté !"}
            </p>
            {onglet === "proposition" && (
              <button onClick={() => setShowCreateForm(true)} style={btn(ACCENT, "#fff", { padding: "12px 24px", fontSize: 14 })}>
                <FontAwesomeIcon icon={faPlus} />
                Creer un projet
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 20 }}>
            {projetsFiltres.map(projet => {
              const assigne = projet.origine === "assigne";
              const badge = acceptationBadge(projet.statut_acceptation);
              return (
              <div key={projet.id} style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 12px rgba(43,27,36,0.1)", opacity: assigne && projet.statut_acceptation === "refuse" ? 0.65 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: DARK, margin: 0 }}>{projet.titre}</h3>
                      {projet.domaine && (
                        <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: "#F4EEF1", color: ACCENT }}>
                          {projet.domaine}
                        </span>
                      )}
                      {assigne ? (
                        <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: badge.bg, color: badge.color }}>
                          {projet.statut_acceptation === "en_attente" && <FontAwesomeIcon icon={faHourglassHalf} style={{ marginRight: 5 }} />}
                          {badge.label}
                        </span>
                      ) : (
                        projet.is_public && (
                          <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: "#E8F5E8", color: "#2E7D32" }}>
                            <FontAwesomeIcon icon={faShareNodes} style={{ marginRight: 5 }} />
                            Partagé
                          </span>
                        )
                      )}
                      <span style={{
                        fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20,
                        background: projet.statut === "lance" ? "#EDF7F2" : projet.statut === "termine" ? "#E8F5E8" : "#F4EEF1",
                        color: projet.statut === "lance" ? "#4CAF8A" : projet.statut === "termine" ? "#2E7D32" : "#E8A554"
                      }}>
                        {projectStatusLabel(projet.statut)}
                      </span>
                    </div>
                    <p style={{ color: GRAY, fontSize: 14, lineHeight: 1.5, margin: 0 }}>{projet.description}</p>
                    {assigne && projet.nom_mentor && (
                      <p style={{ color: GRAY, fontSize: 12, margin: "8px 0 0" }}>Proposé par SheTech · suivi par {projet.nom_mentor}</p>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {assigne && projet.statut_acceptation === "en_attente" ? (
                      <>
                        <button onClick={() => handleReponse(projet, "accepter")} style={btn("#4CAF8A")}>
                          <FontAwesomeIcon icon={faCheck} />
                          Accepter
                        </button>
                        <button onClick={() => handleReponse(projet, "refuser")} style={btn("transparent", "#C0392B", { border: "1px solid #C0392B" })}>
                          <FontAwesomeIcon icon={faXmark} />
                          Refuser
                        </button>
                      </>
                    ) : assigne ? (
                      projet.statut_acceptation === "accepte" && (
                        <button onClick={() => openDetail(projet)} style={btn(ACCENT)}>
                          <FontAwesomeIcon icon={faEye} />
                          Ouvrir
                        </button>
                      )
                    ) : (
                      <>
                        <button onClick={() => openDetail(projet)} style={btn(ACCENT)}>
                          <FontAwesomeIcon icon={faEye} />
                          Voir
                        </button>
                        <button onClick={() => handlePartager(projet)} style={btn(projet.is_public ? "#fff" : "#4CAF8A", projet.is_public ? "#4CAF8A" : "#fff", projet.is_public ? { border: "1px solid #4CAF8A" } : {})}>
                          <FontAwesomeIcon icon={projet.is_public ? faEyeSlash : faShareNodes} />
                          {projet.is_public ? "Retirer" : "Partager"}
                        </button>
                        <button onClick={() => handleEdit(projet)} style={btn(DARK)}>
                          <FontAwesomeIcon icon={faPenToSquare} />
                          Modifier
                        </button>
                        <button onClick={() => handleDelete(projet.id)} style={btn("transparent", ACCENT, { border: `1px solid ${ACCENT}` })}>
                          <FontAwesomeIcon icon={faTrash} />
                          Supprimer
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {projet.technologies?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: DARK, marginBottom: 8 }}>{getDomainDetails(projet.domaine).toolsLabel} :</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {projet.technologies.map((tech, i) => (
                        <span key={i} style={{ fontSize: 11, padding: "4px 8px", background: "#F4EEF1", color: ACCENT, borderRadius: 4, fontWeight: 500 }}>
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 16 }}>
                  {projet.lien_github && (
                    <a href={projet.lien_github} target="_blank" rel="noopener noreferrer"
                      style={{ color: "#6D7FCC", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
                      GitHub
                    </a>
                  )}
                  {projet.lien_demo && (
                    <a href={projet.lien_demo} target="_blank" rel="noopener noreferrer"
                      style={{ color: "#6D7FCC", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
                      Demo / ressource
                    </a>
                  )}
                </div>
              </div>
            );
            })}
          </div>
        );
        })()}
      </div>

      {/* Modal d'upload de fichier */}
      {showUploadModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: "90%", maxWidth: 450 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 20, color: DARK }}>Ajouter un livrable</h3>

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[["fichier", "Fichier"], ["lien", "Lien"]].map(([id, label]) => (
                <button key={id} type="button" onClick={() => setNewLivrableType(id)} style={{
                  padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12.5, fontWeight: 600,
                  border: `1px solid ${newLivrableType === id ? ACCENT : BORDER}`,
                  background: newLivrableType === id ? ACCENT : "#fff",
                  color: newLivrableType === id ? "#fff" : GRAY,
                }}>
                  {label}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: DARK }}>Titre *</label>
              <input
                type="text"
                value={newLivrableTitre}
                onChange={(e) => setNewLivrableTitre(e.target.value)}
                placeholder={`Ex: ${currentUploadDetails.deliverables.split(",")[0]}`}
                style={{ width: "100%", padding: 10, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 14 }}
              />
            </div>

            {newLivrableType === "fichier" ? (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: DARK }}>Fichier *</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                  onChange={(e) => setNewLivrableFichier(e.target.files[0])}
                  style={{ width: "100%", padding: 8, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 13 }}
                />
                <p style={{ fontSize: 11, color: GRAY, marginTop: 6 }}>
                  Formats acceptes : PDF, Word, JPG, PNG, TXT (max 5MB). Suggestions : {currentUploadDetails.deliverables}
                </p>
              </div>
            ) : (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: DARK }}>Lien *</label>
                <input
                  type="url"
                  value={newLivrableLien}
                  onChange={(e) => setNewLivrableLien(e.target.value)}
                  placeholder="https://..."
                  style={{ width: "100%", padding: 10, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 14 }}
                />
                <p style={{ fontSize: 11, color: GRAY, marginTop: 6 }}>
                  Lien Drive, Figma, GitHub, vidéo... Suggestions : {currentUploadDetails.deliverables}
                </p>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{ background: "transparent", border: `1px solid ${BORDER}`, color: GRAY, padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 14 }}
              >
                Annuler
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                style={btn(uploading ? GRAY : ACCENT, "#fff", { padding: "10px 24px", fontSize: 14, cursor: uploading ? "not-allowed" : "pointer" })}
              >
                {uploading ? "Upload en cours..." : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
