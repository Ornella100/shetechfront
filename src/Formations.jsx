import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FormationDetail from "./FormationDetail";
import homeHero from "./assets/home-hero.png";
import { useParcoursList, useParcoursDetail } from "./hooks/useParcours";

const ACCENT = "#C45C7A";
const TEXT_MAIN = "#2B1B24";
const TEXT_MID = "#7A6570";
const TEXT_MUTED = "#9A8090";

/* ─────────────────────────────────────────────
   CARTE PARCOURS — grille principale
───────────────────────────────────────────── */
function ParcoursCard({ parcours, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="st-formation-row"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        borderRadius: 8,
        overflow: "hidden",
        cursor: "pointer",
        border: hovered ? `1px solid ${ACCENT}` : "1px solid #e5e7eb",
        boxShadow: hovered ? "0 4px 16px rgba(0,0,0,0.10)" : "0 1px 3px rgba(0,0,0,0.05)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.18s ease",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ height: 4, background: ACCENT }} />

      <div style={{ padding: "20px 22px 22px", flex: 1, display: "flex", flexDirection: "column" }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT_MAIN, marginBottom: 8, lineHeight: 1.35 }}>
          {parcours.titre}
        </h3>

        <p
          style={{
            fontSize: 13,
            color: TEXT_MID,
            lineHeight: 1.65,
            flex: 1,
            marginBottom: 18,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {parcours.description}
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: TEXT_MUTED }}>
            {parcours.nb_formations} formation{parcours.nb_formations > 1 ? "s" : ""}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: ACCENT }}>
            Découvrir →
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   VUE PARCOURS — chronologie des formations
───────────────────────────────────────────── */
function VueParcours({ parcours, onBack, onOpenFormation }) {
  const { data: detail, isLoading: loading, isError: erreur } = useParcoursDetail(parcours.id);

  const formations = detail?.formations || [];

  return (
    <div className="st-soft-page" style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Breadcrumb */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "13px 40px" }}>
        <span onClick={onBack} style={{ fontSize: 13, color: TEXT_MID, cursor: "pointer" }}>
          Parcours
        </span>
        <span style={{ fontSize: 13, color: "#d1d5db", margin: "0 8px" }}>/</span>
        <span style={{ fontSize: 13, color: TEXT_MAIN, fontWeight: 600 }}>{parcours.titre}</span>
      </div>

      {/* Hero */}
      <div style={{ background: `linear-gradient(115deg, rgba(26,15,20,0.94), rgba(74,25,66,0.76)), url(${homeHero}) center/cover`, borderBottom: `3px solid ${ACCENT}`, padding: "40px 40px 36px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 8, letterSpacing: "-0.3px" }}>
          {parcours.titre}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.6, maxWidth: 540 }}>
          {parcours.description}
        </p>
      </div>

      {/* Chronologie */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px" }}>
        <p style={{ fontSize: 13, color: TEXT_MID, marginBottom: 24 }}>
          Suivez les formations dans l'ordre pour progresser étape par étape.
        </p>

        {loading ? (
          <div style={{ background: "#fff", borderRadius: 8, padding: "48px", textAlign: "center", color: TEXT_MUTED, fontSize: 14 }}>
            Chargement du parcours...
          </div>
        ) : erreur || formations.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 8, padding: "48px", textAlign: "center" }}>
            <p style={{ color: TEXT_MID, fontSize: 14 }}>
              {erreur ? "Impossible de charger le parcours." : "Aucune formation dans ce parcours pour le moment."}
            </p>
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            {formations.map((f, index) => (
              <EtapeFormation
                key={f.id}
                formation={f}
                index={index}
                dernier={index === formations.length - 1}
                onClick={() => onOpenFormation(f)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* Une étape de la chronologie */
function EtapeFormation({ formation, index, dernier, onClick }) {
  const [hovered, setHovered] = useState(false);
  const prog = Number(formation.progression) || 0;
  const complet = prog >= 100;

  return (
    <div style={{ display: "flex", gap: 18, alignItems: "stretch" }}>
      {/* Colonne numéro + ligne verticale */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: complet ? ACCENT : "#fff",
            border: `2px solid ${ACCENT}`,
            color: complet ? "#fff" : ACCENT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {complet ? "✓" : index + 1}
        </div>
        {!dernier && <div style={{ width: 2, flex: 1, background: "#e5e7eb", minHeight: 20 }} />}
      </div>

      {/* Carte formation */}
      <div
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          flex: 1,
          marginBottom: 16,
          background: "#fff",
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          borderLeft: `4px solid ${ACCENT}`,
          padding: "18px 22px",
          cursor: "pointer",
          boxShadow: hovered ? "0 4px 16px rgba(0,0,0,0.08)" : "none",
          transform: hovered ? "translateY(-1px)" : "translateY(0)",
          transition: "all 0.18s ease",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT_MAIN, marginBottom: 5 }}>
              {formation.titre}
            </h3>
            <p style={{ fontSize: 13, color: TEXT_MID, margin: 0, lineHeight: 1.55 }}>
              {formation.description}
            </p>
          </div>
          <button
            style={{
              flexShrink: 0,
              padding: "8px 18px",
              borderRadius: 6,
              border: `1.5px solid ${ACCENT}`,
              background: hovered ? ACCENT : "transparent",
              color: hovered ? "#fff" : ACCENT,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.18s",
              fontFamily: "inherit",
            }}
          >
            {prog > 0 ? "Continuer" : "Commencer"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 14, marginTop: 12, alignItems: "center" }}>
          {formation.nb_modules != null && (
            <span style={{ fontSize: 12, color: TEXT_MUTED }}>{formation.nb_modules} module{formation.nb_modules > 1 ? "s" : ""}</span>
          )}
          {prog > 0 && (
            <>
              <div style={{ flex: 1, background: "#f3f4f6", borderRadius: 4, height: 4, maxWidth: 200 }}>
                <div style={{ width: `${prog}%`, height: "100%", background: ACCENT, borderRadius: 4, transition: "width 0.8s ease" }} />
              </div>
              <span style={{ fontSize: 11, color: TEXT_MUTED }}>{prog}%</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   VUE PRINCIPALE — grille des parcours
───────────────────────────────────────────── */
export default function Formations() {
  const navigate = useNavigate();
  const [vue, setVue] = useState("parcours");
  const [parcoursSelectionne, setParcoursSelectionne] = useState(null);
  const [formationSelectionnee, setFormationSelectionnee] = useState(null);
  const { data: parcours = [], isLoading: loading } = useParcoursList();
  const [recherche, setRecherche] = useState("");

  if (vue === "detail" && formationSelectionnee) {
    return (
      <FormationDetail
        formation={formationSelectionnee}
        domaine={parcoursSelectionne}
        onBack={() => setVue("liste-formations")}
      />
    );
  }

  if (vue === "liste-formations" && parcoursSelectionne) {
    return (
      <VueParcours
        parcours={parcoursSelectionne}
        onBack={() => setVue("parcours")}
        onOpenFormation={(formation) => {
          setFormationSelectionnee(formation);
          setVue("detail");
        }}
      />
    );
  }

  const parcoursFiltres = parcours.filter((p) =>
    p.titre.toLowerCase().includes(recherche.toLowerCase()) ||
    (p.description || "").toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div className="st-soft-page" style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ background: `linear-gradient(115deg, rgba(26,15,20,0.94), rgba(74,25,66,0.76)), url(${homeHero}) center/cover`, padding: "0 40px" }}>
        <div style={{ padding: "13px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <span
            onClick={() => navigate("/dashboard")}
            style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", cursor: "pointer" }}
          >
            ← Tableau de bord
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "32px 0 36px", flexWrap: "wrap", gap: 20 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 6, letterSpacing: "-0.5px" }}>
              Nos parcours
            </h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
              {parcours.length} parcours · progresse étape par étape
            </p>
          </div>

          <input
            className="st-page-search"
            type="text"
            placeholder="Rechercher un parcours..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            style={{
              padding: "10px 16px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.07)",
              color: "#fff",
              fontSize: 13,
              outline: "none",
              width: 260,
              fontFamily: "inherit",
            }}
          />
        </div>
      </div>

      {/* Contenu */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px" }}>
        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: TEXT_MAIN, marginBottom: 20 }}>
            {recherche ? `Résultats (${parcoursFiltres.length})` : "Tous les parcours"}
          </h2>

          {loading ? (
            <div style={{ background: "#fff", borderRadius: 8, padding: "48px", textAlign: "center", color: TEXT_MUTED, fontSize: 14 }}>
              Chargement des parcours...
            </div>
          ) : parcoursFiltres.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 8, padding: "48px", textAlign: "center" }}>
              <p style={{ color: TEXT_MID, fontSize: 14, marginBottom: 8 }}>
                {recherche ? "Aucun parcours trouvé." : "Aucun parcours disponible pour le moment."}
              </p>
              {recherche && (
                <span
                  onClick={() => setRecherche("")}
                  style={{ fontSize: 13, color: ACCENT, cursor: "pointer", fontWeight: 600 }}
                >
                  Réinitialiser la recherche
                </span>
              )}
            </div>
          ) : (
            <div className="st-card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
              {parcoursFiltres.map((p, index) => (
                <div key={p.id} className="st-animate-card" style={{ animationDelay: `${index * 45}ms` }}>
                  <ParcoursCard
                    parcours={p}
                    onClick={() => { setParcoursSelectionne(p); setVue("liste-formations"); }}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
