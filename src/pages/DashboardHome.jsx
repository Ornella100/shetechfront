import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/authStore";
import api from "../lib/api";

function ProgressBar({ value, color = "#C45C7A" }) {
  return (
    <div className="dash-progress">
      <span style={{ width: `${Math.min(Number(value) || 0, 100)}%`, background: color }} />
    </div>
  );
}

function KpiCard({ value, label, sub, tone = "rose", delay = 0 }) {
  return (
    <article className={`dash-kpi dash-kpi--${tone}`} style={{ animationDelay: `${delay}ms` }}>
      <strong>{value}</strong>
      <span>{label}</span>
      <small>{sub}</small>
    </article>
  );
}

const PROGRESS_COLORS = ["#C45C7A", "#4CAF8A", "#E8A554", "#6D7FCC", "#6D2E46"];

export default function DashboardHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [progression, setProgression] = useState([]);
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreurProgression, setErreurProgression] = useState(false);

  const prenom = user?.nom?.split(" ")[0] || "Utilisatrice";

  const charger = () => {
    setLoading(true);
    Promise.allSettled([api.get("/progression"), api.get("/projets")])
      .then(([prog, proj]) => {
        setErreurProgression(prog.status === "rejected");
        setProgression(prog.status === "fulfilled" ? prog.value.data || [] : []);
        setProjets(proj.status === "fulfilled" ? proj.value.data || [] : []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(); }, []);

  const avgProgression = progression.length
    ? Math.round(progression.reduce((acc, p) => acc + (Number(p.pourcentage) || 0), 0) / progression.length)
    : 0;

  return (
    <div className="dash-home">
      <section className="dash-hero">
        <div>
          <p className="dash-kicker">Espace apprenante</p>
          <h1>Bonjour, {prenom}</h1>
          <p>
            {progression.length
              ? `Vous avez ${progression.length} formation(s) en cours. Continuez votre progression.`
              : "Bienvenue sur votre tableau de bord SheTech. Choisissez une formation pour commencer."}
          </p>
        </div>
        <div className="dash-hero-actions">
          <button type="button" onClick={() => navigate("/dashboard/formations")}>Explorer</button>
          <button type="button" onClick={() => { logout(); navigate("/"); }}>Déconnexion</button>
        </div>
      </section>

      <section className="dash-kpis">
        <KpiCard value={erreurProgression ? "—" : `${avgProgression}%`} label="Progression moyenne" sub={erreurProgression ? "Données indisponibles" : `${progression.length} formation(s) active(s)`} tone="rose" />
        <KpiCard value={erreurProgression ? "—" : progression.length} label="Formations" sub="Formations commencées" tone="green" delay={70} />
        <KpiCard value={projets.length} label="Projets créés" sub={`${projets.filter((p) => p.statut === "lancé").length} lancé(s)`} tone="gold" delay={140} />
        <KpiCard value="À venir" label="Certificats" sub="Terminez une formation pour générer un certificat" tone="plum" delay={210} />
      </section>

      <section className="dash-grid dash-grid--single">
        <article className="dash-panel dash-panel--wide">
          <div className="dash-panel-head">
            <h2>Formations en cours</h2>
            <button type="button" onClick={() => navigate("/dashboard/formations")}>Voir tout</button>
          </div>

          {loading ? (
            <p className="dash-empty">Chargement...</p>
          ) : erreurProgression ? (
            <div className="dash-empty">
              <p>Impossible de charger votre progression pour le moment.</p>
              <button type="button" onClick={charger}>Réessayer</button>
            </div>
          ) : progression.length === 0 ? (
            <div className="dash-empty">
              <p>Aucune formation en cours</p>
              <button type="button" onClick={() => navigate("/dashboard/formations")}>Parcourir le catalogue</button>
            </div>
          ) : (
            progression.map((p, i) => (
              <div className="dash-course" key={`${p.formation_id || i}-${p.formation_titre}`}>
                <div>
                  <strong>{p.formation_titre || `Formation ${i + 1}`}</strong>
                  <span>{p.formation_domaine || "Formation SheTech"}</span>
                </div>
                <b style={{ color: PROGRESS_COLORS[i % PROGRESS_COLORS.length] }}>{p.pourcentage}%</b>
                <ProgressBar value={p.pourcentage} color={PROGRESS_COLORS[i % PROGRESS_COLORS.length]} />
              </div>
            ))
          )}
        </article>
      </section>

      <section className="dash-panel">
        <div className="dash-panel-head">
          <h2>Mes projets</h2>
          <button type="button" onClick={() => navigate("/dashboard/projets")}>Voir tout</button>
        </div>

        {loading ? (
          <p className="dash-empty">Chargement...</p>
        ) : projets.length === 0 ? (
          <div className="dash-empty">
            <p>Aucun projet créé</p>
            <button type="button" onClick={() => navigate("/dashboard/projets")}>Créer mon premier projet</button>
          </div>
        ) : (
          <div className="dash-projects">
            {projets.slice(0, 4).map((p, i) => (
              <article key={`${p.id || i}-${p.titre}`}>
                <span>{p.statut === "lancé" ? "Lancé" : "En cours"}</span>
                <h3>{p.titre}</h3>
                <p>{p.description}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <button className="dash-cert-banner" type="button" onClick={() => navigate("/dashboard/certificats")}>
        <span>
          <strong>Mes certificats</strong>
          <small>Terminez vos formations et téléchargez vos certificats.</small>
        </span>
        <b>→</b>
      </button>
    </div>
  );
}
