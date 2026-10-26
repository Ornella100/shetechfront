import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = "http://localhost:5000";

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const fmt = (n) => Number(n || 0).toLocaleString("fr-FR");
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const C = {
  bg: "#F4EEF1", surface: "#fff", dark: "#1A0F14", dark2: "#2B1B24",
  rose: "#C45C7A", rosePale: "#FDF0F4", roseMid: "#EDE3E7", plum: "#6D2E46",
  gold: "#E8A554", goldPale: "#FEF0DC", green: "#4CAF8A", greenPale: "#EDF7F2",
  blue: "#54A8E8", bluePale: "#E3EEF7", purple: "#7B5EA7", purplePale: "#EDE3F7",
  muted: "#9A8090", border: "#F0E8EC", text: "#2B1B24",
};

const ROLE_CFG = {
  apprenante: { bg: C.purplePale, color: C.purple, label: "Apprenante" },
  mentor:     { bg: C.goldPale,   color: "#854F0B", label: "Mentor" },
  admin:      { bg: C.rosePale,   color: C.plum,    label: "Admin" },
};

const NAV_ITEMS = [
  { id: "dashboard",   label: "Tableau de bord", icon: "⊞" },
  { id: "users",       label: "Utilisateurs",    icon: "◎" },
  { id: "formations",  label: "Formations",      icon: "◈" },
  { id: "stats",       label: "Statistiques",    icon: "◉" },
  { id: "mentorat",    label: "Mentorat",        icon: "◐" },
  { id: "marketplace", label: "Marketplace",     icon: "◑" },
];

// FIX 1 — liste des domaines pour le formulaire création formation
const DOMAINES_LIST = [
  { id: "developpement", titre: "Développement Web" },
  { id: "ia",            titre: "Intelligence Artificielle" },
  { id: "marketing",     titre: "Marketing Digital" },
  { id: "ecommerce",     titre: "E-commerce" },
  { id: "leadership",    titre: "Leadership & Business" },
  { id: "freelance",     titre: "Freelance & Entrepreneuriat" },
  { id: "design",        titre: "Design UI/UX" },
  { id: "cybersecurite", titre: "Cybersécurité" },
];

function Badge({ role }) {
  const cfg = ROLE_CFG[role] || { bg: C.roseMid, color: C.muted, label: role };
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 4,
      background: cfg.bg, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {cfg.label}
    </span>
  );
}

function StatutBadge({ statut }) {
  const cfg = {
    planifiée: { bg: C.bluePale, color: "#0C447C" },
    terminée:  { bg: C.greenPale, color: "#27500A" },
    annulée:   { bg: C.rosePale, color: C.plum },
  };
  const s = cfg[statut] || { bg: C.roseMid, color: C.muted };
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 4,
      background: s.bg, color: s.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {statut}
    </span>
  );
}

function KpiCard({ label, value, sub, color, icon }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
      padding: "20px 22px", flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 18, opacity: 0.5 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, color: color || C.text, fontFamily: "Georgia, serif", marginBottom: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted }}>{sub}</div>}
    </div>
  );
}

function Spinner() {
  return <div style={{ padding: "48px", textAlign: "center", color: C.muted, fontSize: 13 }}>Chargement...</div>;
}

function EmptyState({ message = "Aucune donnée" }) {
  return (
    <div style={{ padding: "48px", textAlign: "center", color: C.muted, fontSize: 13,
      background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
      {message}
    </div>
  );
}

function SectionTitle({ children, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: 0, fontFamily: "Georgia, serif" }}>
        {children}
      </h2>
      {action}
    </div>
  );
}

function BtnPrimary({ onClick, children, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: "9px 18px", borderRadius: 8, border: "none",
        background: disabled ? C.roseMid : C.rose, color: disabled ? C.muted : "#fff",
        fontSize: 13, fontWeight: 600, cursor: disabled ? "default" : "pointer",
        fontFamily: "inherit", transition: "background 0.15s" }}>
      {children}
    </button>
  );
}

function BtnGhost({ onClick, children }) {
  return (
    <button onClick={onClick}
      style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.border}`,
        background: C.surface, color: C.plum, fontSize: 13, fontWeight: 500,
        cursor: "pointer", fontFamily: "inherit" }}>
      {children}
    </button>
  );
}

function Input({ label, value, onChange, type = "text", placeholder, required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 5 }}>
          {label} {required && <span style={{ color: C.rose }}>*</span>}
        </label>
      )}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ width: "100%", padding: "10px 14px", borderRadius: 8,
          border: `1px solid ${C.border}`, fontSize: 13, color: C.text,
          fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#FDFAFB" }} />
    </div>
  );
}

function Select({ label, value, onChange, options, required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 5 }}>
          {label} {required && <span style={{ color: C.rose }}>*</span>}
        </label>
      )}
      <select value={value} onChange={onChange}
        style={{ width: "100%", padding: "10px 14px", borderRadius: 8,
          border: `1px solid ${C.border}`, fontSize: 13, color: C.text,
          fontFamily: "inherit", outline: "none", background: "#FDFAFB", boxSizing: "border-box" }}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 5 }}>
          {label}
        </label>
      )}
      <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
        style={{ width: "100%", padding: "10px 14px", borderRadius: 8,
          border: `1px solid ${C.border}`, fontSize: 13, color: C.text,
          fontFamily: "inherit", outline: "none", resize: "vertical",
          boxSizing: "border-box", background: "#FDFAFB" }} />
    </div>
  );
}

function Drawer({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(26,15,20,0.45)",
        zIndex: 100, backdropFilter: "blur(2px)" }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 440,
        background: C.surface, zIndex: 101, display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 32px rgba(26,15,20,0.15)" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text, fontFamily: "Georgia, serif" }}>
            {title}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20,
            color: C.muted, cursor: "pointer", padding: 0, lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>{children}</div>
      </div>
    </>
  );
}

function Table({ cols, data, loading, empty = "Aucune donnée" }) {
  if (loading) return <Spinner />;
  if (!data.length) return <EmptyState message={empty} />;
  return (
    <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#F9F4F6" }}>
            {cols.map((c) => (
              <th key={c.key} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11,
                fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em",
                borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ borderBottom: i < data.length - 1 ? `1px solid ${C.border}` : "none", transition: "background 0.1s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#FDF5F7"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              {cols.map((c) => (
                <td key={c.key} style={{ padding: "12px 16px", fontSize: 13, color: C.text, verticalAlign: "middle" }}>
                  {c.render ? c.render(row[c.key], row) : row[c.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pagination({ page, total, perPage, onChange }) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
      {[...Array(pages)].map((_, i) => (
        <button key={i} onClick={() => onChange(i + 1)}
          style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${C.border}`,
            background: page === i + 1 ? C.rose : C.surface,
            color: page === i + 1 ? "#fff" : C.text,
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          {i + 1}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — TABLEAU DE BORD
// ═══════════════════════════════════════════════════════════════════════════════
function SectionDashboard() {
  const [users, setUsers] = useState([]);
  const [formations, setFormations] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const h = getHeaders();
    Promise.all([
      axios.get(`${API}/admin/users`, { headers: h }).catch(() => ({ data: MOCK.users })),
      axios.get(`${API}/formations`, { headers: h }).catch(() => ({ data: MOCK.formations })),
      axios.get(`${API}/sessions`, { headers: h }).catch(() => ({ data: MOCK.sessions })),
    ]).then(([u, f, s]) => {
      setUsers(u.data); setFormations(f.data); setSessions(s.data);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 24, fontFamily: "Georgia, serif" }}>
        Tableau de bord
      </h1>
      <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <KpiCard label="Utilisatrices" value={fmt(users.length)} color={C.purple} sub="+12 ce mois" icon="◎" />
        <KpiCard label="Formations actives" value={fmt(formations.length)} color={C.rose} sub="Toutes gratuites" icon="◈" />
        <KpiCard label="Sessions mentorat" value={fmt(sessions.length)} color={C.gold}
          sub={`${sessions.filter(s => s.statut === "planifiée").length} à venir`} icon="◐" />
        <KpiCard label="Taux de complétion" value="68%" color={C.green} sub="Moyenne globale" icon="◉" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <SectionTitle>Dernières inscriptions</SectionTitle>
          <Table loading={loading}
            cols={[
              { key: "nom", label: "Nom" },
              { key: "email", label: "Email", render: (v) => <span style={{ color: C.muted, fontSize: 12 }}>{v}</span> },
              { key: "role", label: "Rôle", render: (v) => <Badge role={v} /> },
              { key: "date_creation", label: "Inscription", render: (v) => <span style={{ fontSize: 12, color: C.muted }}>{fmtDate(v)}</span> },
            ]}
            data={users.slice(0, 5)} empty="Aucune inscription récente" />
        </div>
        <div>
          <SectionTitle>Formations récentes</SectionTitle>
          {loading ? <Spinner /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {formations.slice(0, 4).map((f, i) => (
                <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>{f.titre}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{f.niveau} · Gratuit</div>
                  </div>
                  <span style={{ fontSize: 20, opacity: 0.3 }}>◈</span>
                </div>
              ))}
              {formations.length === 0 && <EmptyState message="Aucune formation" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — UTILISATEURS
// ═══════════════════════════════════════════════════════════════════════════════
function SectionUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [filtreRole, setFiltreRole] = useState("tous");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const load = useCallback(() => {
    setLoading(true);
    axios.get(`${API}/admin/users`, { headers: getHeaders() })
      .then((r) => setUsers(r.data))
      .catch(() => setUsers(MOCK.users))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeRole = (id, role) => {
    axios.put(`${API}/admin/users/${id}/role`, { role }, { headers: getHeaders() })
      .then(() => setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u)))
      .catch(() => alert("Erreur lors du changement de rôle"));
  };

  const filtered = users.filter((u) => {
    const matchR = filtreRole === "tous" || u.role === filtreRole;
    const matchS = !recherche ||
      u.nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      u.email?.toLowerCase().includes(recherche.toLowerCase());
    return matchR && matchS;
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div>
      <SectionTitle>
        Utilisateurs
        <span style={{ fontSize: 12, color: C.muted, fontWeight: 400 }}>
          {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
        </span>
      </SectionTitle>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input value={recherche} onChange={(e) => { setRecherche(e.target.value); setPage(1); }}
          placeholder="Rechercher par nom ou email..."
          style={{ flex: 1, minWidth: 200, padding: "9px 14px", borderRadius: 8,
            border: `1px solid ${C.border}`, fontSize: 13, color: C.text, fontFamily: "inherit", outline: "none" }} />
        {["tous", "apprenante", "mentor", "admin"].map((r) => (
          <button key={r} onClick={() => { setFiltreRole(r); setPage(1); }}
            style={{ padding: "8px 14px", borderRadius: 20,
              border: `1px solid ${filtreRole === r ? C.rose : C.border}`,
              background: filtreRole === r ? C.rosePale : C.surface,
              color: filtreRole === r ? C.plum : C.muted,
              fontSize: 12, fontWeight: filtreRole === r ? 700 : 400,
              cursor: "pointer", fontFamily: "inherit" }}>
            {r === "tous" ? "Tous" : ROLE_CFG[r]?.label || r}
          </button>
        ))}
      </div>
      <Table loading={loading}
        cols={[
          { key: "nom", label: "Nom", render: (v) => <strong style={{ fontSize: 13 }}>{v}</strong> },
          { key: "email", label: "Email", render: (v) => <span style={{ color: C.muted, fontSize: 12 }}>{v}</span> },
          { key: "role", label: "Rôle", render: (v, row) => (
            <select value={v} onChange={(e) => changeRole(row.id, e.target.value)}
              style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.border}`,
                fontSize: 12, color: C.text, fontFamily: "inherit", cursor: "pointer",
                background: ROLE_CFG[v]?.bg || C.roseMid, fontWeight: 600 }}>
              <option value="apprenante">Apprenante</option>
              <option value="mentor">Mentor</option>
              <option value="admin">Admin</option>
            </select>
          )},
          { key: "niveau", label: "Niveau", render: (v) => <span style={{ fontSize: 12, color: C.muted }}>{v || "—"}</span> },
          { key: "date_creation", label: "Inscription", render: (v) => <span style={{ fontSize: 12, color: C.muted }}>{fmtDate(v)}</span> },
        ]}
        data={paginated} empty="Aucun utilisateur trouvé" />
      <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — FORMATIONS & MODULES (CORRIGÉE)
// ═══════════════════════════════════════════════════════════════════════════════
function SectionFormations() {
  const [formations, setFormations]         = useState([]);
  const [loading, setLoading]               = useState(true);
  const [detail, setDetail]                 = useState(null);
  const [detailData, setDetailData]         = useState(null);
  const [drawerF, setDrawerF]               = useState(false);
  const [drawerM, setDrawerM]               = useState(false);
  const [drawerL, setDrawerL]               = useState(false);
  const [drawerV, setDrawerV]               = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedLecon, setSelectedLecon]   = useState(null);
  const [erreurVideo, setErreurVideo]       = useState(null);

  // FIX 1 — "domaine" ajouté, "prix" supprimé (plateforme gratuite)
  const [fForm, setFForm] = useState({
    titre: "", description: "", niveau: "Débutant", domaine: "developpement"
  });
  const [mForm, setMForm] = useState({ titre: "", duree: "" });
  const [lForm, setLForm] = useState({ titre: "", type: "video", video_url: "", contenu_texte: "", duree: "" });
  const [vForm, setVForm] = useState({ titre: "", url: "", description: "", duree: "" });

  const load = useCallback(() => {
    setLoading(true);
    axios.get(`${API}/formations`, { headers: getHeaders() })
      .then((r) => setFormations(r.data))
      .catch(() => setFormations(MOCK.formations))
      .finally(() => setLoading(false));
  }, []);

  // FIX 2 — loadDetail prend l'objet formation complet, pas juste l'id
  const loadDetail = useCallback((formation) => {
    setDetail(formation);
    setDetailData(null);
    axios.get(`${API}/formations/${formation.id}`, { headers: getHeaders() })
      .then((r) => setDetailData(r.data))
      .catch(() => setDetailData({ formation, modules: MOCK.modules }));
  }, []);

  useEffect(() => { load(); }, [load]);

  // FIX 1 — domaine envoyé au backend
  const creerFormation = () => {
    axios.post(`${API}/formations`, fForm, { headers: getHeaders() })
      .then(() => {
        load();
        setDrawerF(false);
        setFForm({ titre: "", description: "", niveau: "Débutant", domaine: "developpement" });
      })
      .catch((err) => {
        const msg = err.response?.data?.message || "Erreur création formation";
        alert(msg);
      });
  };

  // FIX 2 — detail est maintenant l'objet complet, detail.id est fiable
  const creerModule = () => {
    if (!detail?.id) { alert("Aucune formation sélectionnée."); return; }
    axios.post(`${API}/modules`, { formation_id: detail.id, ...mForm }, { headers: getHeaders() })
      .then(() => {
        loadDetail(detail);
        setDrawerM(false);
        setMForm({ titre: "", duree: "" });
      })
      .catch((err) => {
        const msg = err.response?.data?.message || "Erreur création module";
        alert(msg);
      });
  };

  const creerLecon = () => {
    if (!selectedModule) { alert("Aucun module sélectionné."); return; }
    axios.post(`${API}/lecons`, { module_id: selectedModule, ...lForm }, { headers: getHeaders() })
      .then(() => {
        loadDetail(detail);
        setDrawerL(false);
        setLForm({ titre: "", type: "video", video_url: "", contenu_texte: "", duree: "" });
      })
      .catch((err) => {
        const msg = err.response?.data?.message || "Erreur création leçon";
        alert(msg);
      });
  };

  // FIX 3 — erreur affichée clairement si la vidéo ne s'ajoute pas
  const ajouterVideo = () => {
    setErreurVideo(null);
    if (!selectedLecon) { setErreurVideo("Aucune leçon sélectionnée."); return; }
    if (!vForm.titre)   { setErreurVideo("Le titre est obligatoire."); return; }
    if (!vForm.url)     { setErreurVideo("L'URL YouTube est obligatoire."); return; }

    axios.post(`${API}/lecons/${selectedLecon}/videos`, vForm, { headers: getHeaders() })
      .then(() => {
        loadDetail(detail);
        setDrawerV(false);
        setVForm({ titre: "", url: "", description: "", duree: "" });
      })
      .catch((err) => {
        const msg = err.response?.data?.message || err.message || "Erreur inconnue";
        setErreurVideo("Erreur : " + msg);
      });
  };

  const getYoutubeId = (url) => {
    if (!url) return "";
    if (url.includes("watch?v=")) return new URLSearchParams(url.split("?")[1]).get("v") || "";
    const clean = url.split("?")[0];
    if (clean.includes("youtu.be/")) return clean.split("youtu.be/")[1];
    return "";
  };

  // ── Vue détail formation
  if (detail) {
    const modules = detailData?.modules || [];
    return (
      <div>
        <button
          onClick={() => { setDetail(null); setDetailData(null); }}
          style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none",
            color: C.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginBottom: 20, padding: 0 }}>
          ← Retour aux formations
        </button>

        <SectionTitle>
          {detail.titre}
          <BtnPrimary onClick={() => setDrawerM(true)}>+ Nouveau module</BtnPrimary>
        </SectionTitle>

        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{detail.niveau}</span>
          <span style={{ fontSize: 12, color: C.muted }}>·</span>
          <span style={{ fontSize: 12, color: C.muted }}>{detail.domaine}</span>
        </div>

        {!detailData ? (
          <Spinner />
        ) : modules.length === 0 ? (
          <EmptyState message="Aucun module — cliquez '+ Nouveau module' pour commencer." />
        ) : (
          modules.map((mod, mi) => (
            <div key={mod.id || mi} style={{ background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 12, marginBottom: 14, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", background: "#F9F4F6", borderBottom: `1px solid ${C.border}`,
                display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{mod.titre}</span>
                  {mod.duree && <span style={{ fontSize: 12, color: C.muted, marginLeft: 10 }}>{mod.duree}</span>}
                </div>
                <BtnGhost onClick={() => { setSelectedModule(mod.id); setDrawerL(true); }}>
                  + Leçon
                </BtnGhost>
              </div>

              {(mod.lecons || []).length === 0 ? (
                <div style={{ padding: "16px 18px", fontSize: 12, color: C.muted }}>
                  Aucune leçon — cliquez "+ Leçon" pour en ajouter.
                </div>
              ) : (
                (mod.lecons || []).map((l, li) => {
                  const typeCfg = {
                    video: { bg: "#EDE3F7", c: C.purple, label: "Vidéo" },
                    texte: { bg: C.bluePale, c: "#185FA5", label: "Lecture" },
                    quiz:  { bg: C.goldPale, c: "#854F0B", label: "Quiz" },
                  };
                  const tc = typeCfg[l.type] || typeCfg.texte;
                  return (
                    <div key={l.id || li} style={{ display: "flex", alignItems: "center", gap: 12,
                      padding: "11px 18px", borderBottom: li < mod.lecons.length - 1 ? `1px solid ${C.border}` : "none" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                        background: tc.bg, color: tc.c, textTransform: "uppercase" }}>{tc.label}</span>
                      <span style={{ fontSize: 13, color: C.text, flex: 1 }}>{l.titre}</span>
                      <span style={{ fontSize: 11, color: C.muted }}>{l.duree}</span>
                      <button
                        onClick={() => {
                          setSelectedLecon(l.id);
                          setErreurVideo(null);
                          setVForm({ titre: "", url: "", description: "", duree: "" });
                          setDrawerV(true);
                        }}
                        style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6,
                          border: `1px solid ${C.border}`, background: "#EDE3F7",
                          color: C.purple, cursor: "pointer", fontFamily: "inherit",
                          fontWeight: 600, marginLeft: 8 }}>
                        + Vidéo
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          ))
        )}

        {/* Drawer module */}
        <Drawer open={drawerM} onClose={() => setDrawerM(false)} title="Nouveau module">
          <Input label="Titre du module" value={mForm.titre} required
            onChange={(e) => setMForm({ ...mForm, titre: e.target.value })} />
          <Input label="Durée estimée" value={mForm.duree} placeholder="ex : 2h30"
            onChange={(e) => setMForm({ ...mForm, duree: e.target.value })} />
          <div style={{ marginTop: 8 }}>
            <BtnPrimary onClick={creerModule} disabled={!mForm.titre}>Créer le module</BtnPrimary>
          </div>
        </Drawer>

        {/* Drawer leçon */}
        <Drawer open={drawerL} onClose={() => setDrawerL(false)} title="Nouvelle leçon">
          <Input label="Titre de la leçon" value={lForm.titre} required
            onChange={(e) => setLForm({ ...lForm, titre: e.target.value })} />
          <Select label="Type" value={lForm.type} required
            onChange={(e) => setLForm({ ...lForm, type: e.target.value })}
            options={[
              { value: "video", label: "Vidéo" },
              { value: "texte", label: "Texte / Lecture" },
              { value: "quiz", label: "Quiz" },
            ]} />
          <Input label="Durée" value={lForm.duree} placeholder="ex : 15 min"
            onChange={(e) => setLForm({ ...lForm, duree: e.target.value })} />
          {lForm.type === "video" && (
            <Input label="URL de la vidéo" value={lForm.video_url} placeholder="https://..."
              onChange={(e) => setLForm({ ...lForm, video_url: e.target.value })} />
          )}
          {lForm.type === "texte" && (
            <Textarea label="Contenu texte" value={lForm.contenu_texte} rows={6}
              placeholder="Votre contenu..."
              onChange={(e) => setLForm({ ...lForm, contenu_texte: e.target.value })} />
          )}
          {lForm.type === "quiz" && (
            <div style={{ padding: "12px", background: C.bg, borderRadius: 8, fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
              Après création de la leçon, utilisez la route<br />
              <code style={{ color: C.rose }}>POST /lecons/:id/quiz</code><br />
              pour ajouter les questions.
            </div>
          )}
          <div style={{ marginTop: 8 }}>
            <BtnPrimary onClick={creerLecon} disabled={!lForm.titre}>Créer la leçon</BtnPrimary>
          </div>
        </Drawer>

        {/* Drawer vidéo */}
        <Drawer open={drawerV} onClose={() => { setDrawerV(false); setErreurVideo(null); }} title="Ajouter une vidéo YouTube">
          {erreurVideo && (
            <div style={{ background: "#FDF0F4", border: `1px solid ${C.rose}`, borderRadius: 8,
              padding: "10px 14px", marginBottom: 14, fontSize: 12, color: C.plum }}>
              {erreurVideo}
            </div>
          )}
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 14, padding: "10px 12px",
            background: C.bg, borderRadius: 8, lineHeight: 1.6 }}>
            Leçon sélectionnée : <strong style={{ color: C.text }}>ID {selectedLecon}</strong><br />
            URL acceptées : youtube.com/watch?v=... ou youtu.be/...
          </div>
          <Input label="Titre de la vidéo" value={vForm.titre} required
            placeholder="ex : Introduction au HTML"
            onChange={(e) => setVForm({ ...vForm, titre: e.target.value })} />
          <Input label="URL YouTube" value={vForm.url} required
            placeholder="https://www.youtube.com/watch?v=..."
            onChange={(e) => setVForm({ ...vForm, url: e.target.value })} />
          <Input label="Durée" value={vForm.duree} placeholder="ex : 12 min"
            onChange={(e) => setVForm({ ...vForm, duree: e.target.value })} />
          <Textarea label="Description (optionnel)" value={vForm.description} rows={3}
            placeholder="Décrivez le contenu de la vidéo..."
            onChange={(e) => setVForm({ ...vForm, description: e.target.value })} />

          {vForm.url && getYoutubeId(vForm.url) && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 }}>Aperçu :</div>
              <div style={{ borderRadius: 8, overflow: "hidden", aspectRatio: "16/9" }}>
                <iframe width="100%" height="100%"
                  src={`https://www.youtube.com/embed/${getYoutubeId(vForm.url)}`}
                  frameBorder="0" allowFullScreen style={{ display: "block" }} />
              </div>
            </div>
          )}
          <div style={{ marginTop: 8 }}>
            <BtnPrimary onClick={ajouterVideo} disabled={!vForm.titre || !vForm.url}>
              Ajouter la vidéo
            </BtnPrimary>
          </div>
        </Drawer>
      </div>
    );
  }

  // ── Vue liste formations
  return (
    <div>
      <SectionTitle>
        Formations & Modules
        <BtnPrimary onClick={() => setDrawerF(true)}>+ Nouvelle formation</BtnPrimary>
      </SectionTitle>

      <Table
        loading={loading}
        cols={[
          { key: "titre", label: "Titre", render: (v, row) => (
            <button onClick={() => loadDetail(row)}
              style={{ background: "none", border: "none", color: C.rose, fontSize: 13,
                fontWeight: 700, cursor: "pointer", fontFamily: "inherit", padding: 0, textAlign: "left" }}>
              {v}
            </button>
          )},
          { key: "niveau", label: "Niveau", render: (v) => <span style={{ fontSize: 12, color: C.muted }}>{v}</span> },
          { key: "domaine", label: "Domaine", render: (v) => <span style={{ fontSize: 12, color: C.muted }}>{v || "—"}</span> },
          { key: "created_at", label: "Créé le", render: (v) => <span style={{ fontSize: 12, color: C.muted }}>{fmtDate(v)}</span> },
          { key: "id", label: "", render: (_, row) => (
            <button onClick={() => loadDetail(row)}
              style={{ fontSize: 12, color: C.rose, background: "none", border: "none",
                cursor: "pointer", fontFamily: "inherit" }}>
              Voir →
            </button>
          )},
        ]}
        data={formations}
        empty="Aucune formation"
      />

      {/* Drawer nouvelle formation — FIX 1 : domaine ajouté, prix supprimé */}
      <Drawer open={drawerF} onClose={() => setDrawerF(false)} title="Nouvelle formation">
        <Input label="Titre" value={fForm.titre} required
          onChange={(e) => setFForm({ ...fForm, titre: e.target.value })} />
        <Textarea label="Description" value={fForm.description} rows={3} required
          onChange={(e) => setFForm({ ...fForm, description: e.target.value })} />
        <Select label="Domaine" value={fForm.domaine} required
          onChange={(e) => setFForm({ ...fForm, domaine: e.target.value })}
          options={DOMAINES_LIST.map((d) => ({ value: d.id, label: d.titre }))} />
        <Select label="Niveau" value={fForm.niveau} required
          onChange={(e) => setFForm({ ...fForm, niveau: e.target.value })}
          options={["Débutant", "Intermédiaire", "Avancé", "Expert"].map((n) => ({ value: n, label: n }))} />
        <div style={{ marginTop: 8 }}>
          <BtnPrimary onClick={creerFormation} disabled={!fForm.titre || !fForm.description}>
            Créer la formation
          </BtnPrimary>
        </div>
      </Drawer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — STATISTIQUES
// ═══════════════════════════════════════════════════════════════════════════════
function SectionStats() {
  const [users, setUsers] = useState([]);
  const [formations, setFormations] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const h = getHeaders();
    Promise.all([
      axios.get(`${API}/admin/users`, { headers: h }).catch(() => ({ data: MOCK.users })),
      axios.get(`${API}/formations`, { headers: h }).catch(() => ({ data: MOCK.formations })),
      axios.get(`${API}/sessions`, { headers: h }).catch(() => ({ data: MOCK.sessions })),
    ]).then(([u, f, s]) => {
      setUsers(u.data); setFormations(f.data); setSessions(s.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const roles = ["apprenante", "mentor", "admin"];
  const roleCounts = roles.map((r) => ({ role: r, count: users.filter((u) => u.role === r).length }));
  const maxRole = Math.max(...roleCounts.map((r) => r.count), 1);
  const niveaux = ["Débutant", "Intermédiaire", "Avancé", "Expert"];
  const niveauCounts = niveaux.map((n) => ({ niveau: n, count: formations.filter((f) => f.niveau === n).length }));
  const maxNiveau = Math.max(...niveauCounts.map((n) => n.count), 1);
  const sessionsStats = [
    { label: "Planifiées", value: sessions.filter((s) => s.statut === "planifiée").length, color: C.blue },
    { label: "Terminées",  value: sessions.filter((s) => s.statut === "terminée").length,  color: C.green },
    { label: "Annulées",   value: sessions.filter((s) => s.statut === "annulée").length,   color: C.rose },
  ];

  const Bar = ({ label, value, max, color }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: C.text }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
      </div>
      <div style={{ background: C.roseMid, borderRadius: 4, height: 8 }}>
        <div style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, height: "100%",
          background: color, borderRadius: 4, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 24, fontFamily: "Georgia, serif" }}>
        Statistiques & Analytiques
      </h1>
      <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <KpiCard label="Total utilisateurs" value={fmt(users.length)} color={C.purple} icon="◎" />
        <KpiCard label="Formations" value={fmt(formations.length)} color={C.rose} icon="◈" />
        <KpiCard label="Sessions mentorat" value={fmt(sessions.length)} color={C.gold} icon="◐" />
        <KpiCard label="Formations disponibles" value={fmt(formations.length)} color={C.green} icon="◉" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 20px" }}>Répartition des rôles</h3>
          {roleCounts.map((r) => <Bar key={r.role} label={ROLE_CFG[r.role]?.label || r.role} value={r.count} max={maxRole} color={ROLE_CFG[r.role]?.color || C.rose} />)}
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 20px" }}>Formations par niveau</h3>
          {niveauCounts.map((n) => <Bar key={n.niveau} label={n.niveau} value={n.count} max={maxNiveau} color={C.rose} />)}
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: "0 0 20px" }}>Sessions mentorat</h3>
          {sessionsStats.map((s) => <Bar key={s.label} label={s.label} value={s.value} max={sessions.length || 1} color={s.color} />)}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: C.muted }}>Total sessions</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{sessions.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5 — MENTORAT
// ═══════════════════════════════════════════════════════════════════════════════
function SectionMentorat() {
  const [sessions, setSessions] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreMentor, setFiltreMentor] = useState("tous");
  const [filtreStatut, setFiltreStatut] = useState("tous");

  useEffect(() => {
    const h = getHeaders();
    Promise.all([
      axios.get(`${API}/sessions`, { headers: h }).catch(() => ({ data: MOCK.sessions })),
      axios.get(`${API}/mentors`, { headers: h }).catch(() => ({ data: MOCK.mentors })),
    ]).then(([s, m]) => { setSessions(s.data); setMentors(m.data); }).finally(() => setLoading(false));
  }, []);

  const filtered = sessions.filter((s) => {
    const matchM = filtreMentor === "tous" || String(s.mentor_id) === String(filtreMentor);
    const matchS = filtreStatut === "tous" || s.statut === filtreStatut;
    return matchM && matchS;
  });

  return (
    <div>
      <SectionTitle>
        Sessions de Mentorat
        <span style={{ fontSize: 12, color: C.muted }}>{filtered.length} session{filtered.length > 1 ? "s" : ""}</span>
      </SectionTitle>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <select value={filtreMentor} onChange={(e) => setFiltreMentor(e.target.value)}
          style={{ padding: "9px 14px", borderRadius: 8, border: `1px solid ${C.border}`,
            fontSize: 13, color: C.text, fontFamily: "inherit", background: C.surface, outline: "none" }}>
          <option value="tous">Tous les mentors</option>
          {mentors.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
        </select>
        {["tous", "planifiée", "terminée", "annulée"].map((s) => (
          <button key={s} onClick={() => setFiltreStatut(s)}
            style={{ padding: "8px 14px", borderRadius: 20,
              border: `1px solid ${filtreStatut === s ? C.rose : C.border}`,
              background: filtreStatut === s ? C.rosePale : C.surface,
              color: filtreStatut === s ? C.plum : C.muted,
              fontSize: 12, fontWeight: filtreStatut === s ? 700 : 400,
              cursor: "pointer", fontFamily: "inherit" }}>
            {s === "tous" ? "Tous les statuts" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      <Table loading={loading}
        cols={[
          { key: "user_nom", label: "Participante", render: (v) => <strong style={{ fontSize: 13 }}>{v || "—"}</strong> },
          { key: "mentor_nom", label: "Mentor", render: (v) => <span style={{ fontSize: 13 }}>{v}</span> },
          { key: "date_session", label: "Date", render: (v) => <span style={{ fontSize: 12, color: C.muted }}>{fmtDate(v)}</span> },
          { key: "type", label: "Type", render: (v) => (
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
              background: v === "individuel" ? C.purplePale : C.bluePale,
              color: v === "individuel" ? C.purple : "#185FA5",
              textTransform: "uppercase", letterSpacing: "0.05em" }}>{v}</span>
          )},
          { key: "statut", label: "Statut", render: (v) => <StatutBadge statut={v} /> },
        ]}
        data={filtered} empty="Aucune session trouvée" />
      {!loading && (
        <div style={{ display: "flex", gap: 14, marginTop: 20, flexWrap: "wrap" }}>
          {[
            { label: "Planifiées",     val: sessions.filter(s => s.statut === "planifiée").length, color: C.blue,   bg: C.bluePale },
            { label: "Terminées",      val: sessions.filter(s => s.statut === "terminée").length,  color: C.green,  bg: C.greenPale },
            { label: "Annulées",       val: sessions.filter(s => s.statut === "annulée").length,   color: C.rose,   bg: C.rosePale },
            { label: "Mentors actifs", val: mentors.length,                                        color: C.gold,   bg: C.goldPale },
          ].map((item) => (
            <div key={item.label} style={{ flex: 1, minWidth: 120, background: item.bg,
              border: `1px solid ${item.bg}`, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: item.color, fontFamily: "Georgia, serif" }}>{item.val}</div>
              <div style={{ fontSize: 12, color: item.color, opacity: 0.8, marginTop: 2 }}>{item.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6 — MARKETPLACE
// ═══════════════════════════════════════════════════════════════════════════════
function SectionMarketplace() {
  const produits = MOCK.marketplace;
  return (
    <div>
      <SectionTitle>
        Marketplace & Paiements
        <span style={{ fontSize: 12, background: C.goldPale, color: "#633806", padding: "4px 10px", borderRadius: 6, fontWeight: 600 }}>Bêta</span>
      </SectionTitle>
      <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <KpiCard label="Revenus totaux" value={`${fmt(produits.reduce((a, p) => a + p.revenus, 0))} FCFA`} color={C.gold} sub="Microservices + formations" icon="◑" />
        <KpiCard label="Produits actifs" value={fmt(produits.length)} color={C.green} sub="Microservices publiés" icon="◒" />
        <KpiCard label="Ventes ce mois" value={fmt(produits.reduce((a, p) => a + p.ventes, 0))} color={C.rose} sub="" icon="◓" />
        <KpiCard label="Vendeuses actives" value="14" color={C.purple} sub="Participantes qui vendent" icon="◔" />
      </div>
      <Table loading={false}
        cols={[
          { key: "titre",   label: "Produit",  render: (v) => <strong style={{ fontSize: 13 }}>{v}</strong> },
          { key: "type",    label: "Type",     render: (v) => (
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
              background: v === "formation" ? C.purplePale : C.bluePale,
              color: v === "formation" ? C.purple : "#185FA5", textTransform: "uppercase" }}>{v}</span>
          )},
          { key: "vendeur", label: "Vendeuse", render: (v) => <span style={{ fontSize: 12, color: C.muted }}>{v}</span> },
          { key: "prix",    label: "Prix",     render: (v) => <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{fmt(v)} FCFA</span> },
          { key: "ventes",  label: "Ventes",   render: (v) => <span style={{ fontSize: 13, color: C.muted }}>{v}</span> },
          { key: "revenus", label: "Revenus",  render: (v) => <span style={{ fontSize: 13, fontWeight: 700, color: C.green }}>{fmt(v)} FCFA</span> },
          { key: "statut",  label: "Statut",   render: (v) => (
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 4,
              background: v === "actif" ? C.greenPale : C.roseMid,
              color: v === "actif" ? "#27500A" : C.muted, textTransform: "uppercase" }}>{v}</span>
          )},
        ]}
        data={produits} empty="Aucun produit sur la marketplace" />
      <div style={{ marginTop: 20, padding: "16px 20px", background: C.goldPale,
        borderRadius: 12, border: `1px solid #F0D9A8`, fontSize: 13, color: "#633806", lineHeight: 1.7 }}>
        <strong>À connecter :</strong> Branchez cette section sur votre API de paiements (Stripe, Wave, Orange Money...)
        pour avoir les transactions réelles et les revenus en temps réel.
      </div>
    </div>
  );
}

// ─── Données mockup ───────────────────────────────────────────────────────────
const MOCK = {
  users: [
    { id: 1, nom: "Aminata Diallo",  email: "aminata@shetech.bj", role: "apprenante", niveau: "Débutant",      date_creation: "2024-11-01" },
    { id: 2, nom: "Fatou Koné",      email: "fatou@shetech.bj",   role: "mentor",     niveau: "Expert",        date_creation: "2024-10-15" },
    { id: 3, nom: "Laure Agbossou",  email: "laure@shetech.bj",   role: "apprenante", niveau: "Intermédiaire", date_creation: "2024-12-03" },
    { id: 4, nom: "Inès Hounsou",    email: "ines@shetech.bj",    role: "mentor",     niveau: "Avancé",        date_creation: "2024-09-20" },
    { id: 5, nom: "Mariama Balde",   email: "mariama@shetech.bj", role: "apprenante", niveau: "Débutant",      date_creation: "2025-01-08" },
    { id: 6, nom: "Cécile Admin",    email: "admin@shetech.bj",   role: "admin",      niveau: "Expert",        date_creation: "2024-08-01" },
  ],
  formations: [
    { id: 1, titre: "Introduction au Développement Web", niveau: "Débutant",      domaine: "developpement", created_at: "2024-10-01" },
    { id: 2, titre: "Marketing Digital Avancé",          niveau: "Avancé",        domaine: "marketing",     created_at: "2024-11-10" },
    { id: 3, titre: "Intelligence Artificielle & IA",    niveau: "Intermédiaire", domaine: "ia",            created_at: "2024-12-05" },
    { id: 4, titre: "E-commerce & Boutique en ligne",    niveau: "Débutant",      domaine: "ecommerce",     created_at: "2025-01-15" },
  ],
  modules: [
    { id: 1, titre: "Introduction & Fondamentaux", duree: "1h30", lecons: [
      { id: 1, titre: "Bienvenue dans la formation", type: "video", duree: "8 min" },
      { id: 2, titre: "Les concepts essentiels",     type: "texte", duree: "15 min" },
    ]},
    { id: 2, titre: "Mise en pratique", duree: "2h00", lecons: [
      { id: 3, titre: "Démonstration pas à pas", type: "video", duree: "20 min" },
      { id: 4, titre: "Quiz de validation",      type: "quiz",  duree: "10 min" },
    ]},
  ],
  sessions: [
    { id: 1, user_nom: "Aminata Diallo", mentor_nom: "Fatou Koné",   mentor_id: 2, date_session: "2025-01-20", type: "individuel", statut: "planifiée" },
    { id: 2, user_nom: "Laure Agbossou", mentor_nom: "Inès Hounsou", mentor_id: 4, date_session: "2025-01-18", type: "collectif",  statut: "terminée" },
    { id: 3, user_nom: "Mariama Balde",  mentor_nom: "Fatou Koné",   mentor_id: 2, date_session: "2025-01-15", type: "individuel", statut: "terminée" },
    { id: 4, user_nom: "Inès Hounsou",   mentor_nom: "Fatou Koné",   mentor_id: 2, date_session: "2025-01-10", type: "collectif",  statut: "annulée" },
  ],
  mentors: [
    { id: 2, nom: "Fatou Koné",   email: "fatou@shetech.bj", niveau: "Expert" },
    { id: 4, nom: "Inès Hounsou", email: "ines@shetech.bj",  niveau: "Avancé" },
  ],
  marketplace: [
    { id: 1, titre: "Template Boutique Woocommerce", type: "microservice", vendeur: "Aminata D.", prix: 5000,  ventes: 12, revenus: 60000, statut: "actif" },
    { id: 2, titre: "Pack SEO Débutant",             type: "microservice", vendeur: "Laure A.",   prix: 8000,  ventes: 7,  revenus: 56000, statut: "actif" },
    { id: 3, titre: "Audit Réseaux Sociaux",         type: "microservice", vendeur: "Mariama B.", prix: 12000, ventes: 4,  revenus: 48000, statut: "actif" },
    { id: 4, titre: "Formation Canva Pro",           type: "formation",    vendeur: "Inès H.",    prix: 10000, ventes: 9,  revenus: 90000, statut: "actif" },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL — AdminDashboard
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminDashboard({ onBack }) {
  const [section, setSection] = useState("dashboard");

  const adminNom = (() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return "Admin";
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.nom || "Admin";
    } catch { return "Admin"; }
  })();

  const renderSection = () => {
    switch (section) {
      case "dashboard":   return <SectionDashboard />;
      case "users":       return <SectionUsers />;
      case "formations":  return <SectionFormations />;
      case "stats":       return <SectionStats />;
      case "mentorat":    return <SectionMentorat />;
      case "marketplace": return <SectionMarketplace />;
      default:            return <SectionDashboard />;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Georgia, 'Times New Roman', serif",
      background: C.bg, overflow: "hidden" }}>

      <div style={{ width: 230, flexShrink: 0, background: C.dark, display: "flex",
        flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", fontFamily: "Georgia, serif", letterSpacing: "0.5px" }}>
            She<span style={{ color: C.rose }}>Tech</span>
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2,
            textTransform: "uppercase", letterSpacing: "0.1em" }}>Administration</div>
        </div>

        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          {NAV_ITEMS.map((item) => {
            const active = section === item.id;
            return (
              <button key={item.id} onClick={() => setSection(item.id)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: active ? "rgba(255,255,255,0.08)" : "transparent",
                  borderLeft: active ? `3px solid ${C.rose}` : "3px solid transparent",
                  paddingLeft: active ? 9 : 12, marginBottom: 2, transition: "all 0.15s", fontFamily: "inherit" }}>
                <span style={{ fontSize: 14, opacity: active ? 1 : 0.4 }}>{item.icon}</span>
                <span style={{ fontSize: 13, fontWeight: active ? 600 : 400,
                  color: active ? "#fff" : "rgba(255,255,255,0.5)" }}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={{ padding: "14px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={onBack}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 8,
              padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer",
              background: "transparent", fontFamily: "inherit" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>←</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Retour à l'app</span>
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`,
          padding: "0 28px", height: 54, display: "flex", alignItems: "center",
          justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ fontSize: 12, color: C.muted }}>
            {NAV_ITEMS.find((n) => n.id === section)?.label}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.rosePale,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: C.rose }}>
                {adminNom.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{adminNom}</span>
            </div>
            <div style={{ width: 1, height: 20, background: C.border }} />
            <button onClick={() => { localStorage.removeItem("token"); window.location.href = "/"; }}
              style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`,
                background: "transparent", color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              Déconnexion
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
