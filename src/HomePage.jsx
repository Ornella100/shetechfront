import { useNavigate } from "react-router-dom";
import heroImage from "./assets/home-hero.png";

const navLinks = [
  { label: "Formations", anchor: "formations" },
  { label: "Projets", anchor: "projets" },
  { label: "Communauté", anchor: "communaute" },
  { label: "Certificats", anchor: "certificats" },
  { label: "Actualités", path: "/actualites" },
];

const stats = [
  ["50+", "formations"],
  ["500+", "apprenantes"],
  ["120+", "projets lancés"],
];

const parcours = [
  {
    title: "Apprendre",
    desc: "Des modules courts, des vidéos et des quiz pour avancer sans pression.",
  },
  {
    title: "Pratiquer",
    desc: "Des projets concrets pour construire un portfolio utile et crédible.",
  },
  {
    title: "Être accompagnée",
    desc: "Une communauté, des projets et des certificats pour garder le cap.",
  },
];

const domaines = [
  "Développement Web",
  "Marketing Digital",
  "E-commerce",
  "Design UI/UX",
  "Cybersécurité",
  "Leadership",
];

export default function HomePage() {
  const navigate = useNavigate();
  const onLogin = () => navigate("/login");
  const onRegister = () => navigate("/register");
  return (
    <main className="home-shell">
      <header className="home-nav">
        <button className="home-brand" type="button" onClick={onRegister}>
          <span>She</span>Tech
        </button>

        <nav className="home-links" aria-label="Navigation principale">
          {navLinks.map((link) => (
            link.path
              ? <button key={link.label} type="button" className="home-link-btn" onClick={() => navigate(link.path)}>{link.label}</button>
              : <a key={link.label} href={`#${link.anchor}`}>{link.label}</a>
          ))}
        </nav>

        <div className="home-actions">
          <button className="home-link-btn" type="button" onClick={onLogin}>
            Connexion
          </button>
          <button className="home-primary-btn" type="button" onClick={onRegister}>
            Commencer
          </button>
        </div>
      </header>

      <section className="home-hero">
        <div className="home-hero-media" aria-hidden="true">
          <img src={heroImage} alt="" />
        </div>

        <div className="home-hero-content">
          <p className="home-kicker">Entrepreneuriat numérique féminin</p>
          <h1>
            Apprendre le numérique, créer un projet, avancer avec confiance.
          </h1>
          <p className="home-lead">
            SheTech accompagne les femmes et jeunes filles vers des compétences
            concrètes : formations, projets, communauté et certificats.
          </p>
          <div className="home-cta-row">
            <button className="home-primary-btn home-primary-btn--large" type="button" onClick={onRegister}>
              Créer mon compte
            </button>
            <button className="home-secondary-btn" type="button" onClick={onLogin}>
              Accéder à mon espace
            </button>
          </div>

          <div className="home-stats" aria-label="Chiffres clés">
            {stats.map(([value, label]) => (
              <div key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-band" id="formations">
        <div className="home-section-head">
          <p className="home-kicker">Une plateforme dynamique</p>
          <h2>Tout est organisé pour passer à l’action.</h2>
        </div>
        <div className="home-path-grid">
          {parcours.map((item, index) => (
            <article className="home-path-card" key={item.title} style={{ animationDelay: `${index * 90}ms` }}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-domains" id="projets">
        <div>
          <p className="home-kicker">Domaines populaires</p>
          <h2>Des parcours adaptés aux métiers qui recrutent.</h2>
        </div>
        <div className="home-domain-list">
          {domaines.map((domaine) => (
            <span key={domaine}>{domaine}</span>
          ))}
        </div>
      </section>

      <section className="home-proof" id="certificats">
        <div className="home-proof-panel">
          <h2>Un espace pensé pour apprendre tous les jours.</h2>
          <p>
            Les apprenantes suivent leur progression, valident leurs quiz,
            téléchargent leurs certificats et présentent leurs projets dans un
            environnement clair et motivant.
          </p>
          <button className="home-primary-btn" type="button" onClick={onRegister}>
            Rejoindre SheTech
          </button>
        </div>
        <div className="home-dashboard-preview" aria-hidden="true">
          <div className="preview-top">
            <span>Progression</span>
            <strong>76%</strong>
          </div>
          <div className="preview-bar">
            <span />
          </div>
          <div className="preview-list">
            <p>Quiz marketing validé</p>
            <p>Projet boutique en cours</p>
            <p>Certificat prêt à télécharger</p>
          </div>
        </div>
      </section>
    </main>
  );
}
