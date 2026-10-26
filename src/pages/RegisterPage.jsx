import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../lib/api";

function getStrength(pwd) {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
}
const strengthColors = ["", "#ef5350", "#D4956A", "#66bb6a"];
const strengthLabels = ["", "Faible", "Moyen", "Fort"];

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function PasswordField({ label, placeholder, value, onChange, children }) {
  const [show, setShow] = useState(false);
  return (
    <div className="field-wrap">
      <label className="field-label">{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="field-input"
          required
          style={{ paddingRight: 40 }}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          style={{
            position: "absolute", right: 10, top: "50%",
            transform: "translateY(-50%)",
            background: "none", border: "none",
            cursor: "pointer", color: "#9A8090", padding: 0,
            display: "flex", alignItems: "center",
          }}
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {children}
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ prenom: "", nom: "", email: "", telephone: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const strength = getStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setMsg({ type: "error", text: "Les mots de passe ne correspondent pas." }); return; }
    const prenom = form.prenom.trim().replace(/\s+/g, " ");
    const nom = form.nom.trim().replace(/\s+/g, " ");
    const email = form.email.trim().toLowerCase();
    if (!prenom || !nom || !email) { setMsg({ type: "error", text: "Veuillez renseigner le prénom, le nom et l'email." }); return; }
    if (form.password.length < 6) { setMsg({ type: "error", text: "Minimum 6 caractères." }); return; }
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.post("/register", { nom: `${prenom} ${nom}`, email, mot_de_passe: form.password });
      setMsg({ type: "success", text: res.data.message || "Compte créé avec succès. Vous pouvez vous connecter." });
      setForm({ prenom: "", nom: "", email: "", telephone: "", password: "", confirm: "" });
      // Après connexion, la page formations s'ouvrira en mode onboarding (choix de 3 parcours max)
      setTimeout(() => navigate("/login?onboarding=1"), 1200);
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Erreur lors de l'inscription." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-form-zone auth-form-zone--compact">
        <div className="form-card form-card--wide">
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#9A8090", fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}>
            &#8592; Retour à l'accueil
          </button>
          <h1 className="form-title">Créer mon compte</h1>
          <p className="form-subtitle">Rejoignez la communauté SheTech gratuitement</p>
          {msg && <div className={`alert alert--${msg.type}`}>{msg.text}</div>}
          <form onSubmit={handleSubmit}>
            <div className="field-row">
              <div className="field-wrap">
                <label className="field-label">Prénom</label>
                <input type="text" placeholder="Marie" value={form.prenom} onChange={set("prenom")} className="field-input" required />
              </div>
              <div className="field-wrap">
                <label className="field-label">Nom</label>
                <input type="text" placeholder="Dupont" value={form.nom} onChange={set("nom")} className="field-input" required />
              </div>
            </div>
            <div className="field-wrap">
              <label className="field-label">Adresse e-mail</label>
              <input type="email" placeholder="marie@exemple.com" value={form.email} onChange={set("email")} className="field-input" required />
            </div>
            <div className="field-wrap">
              <label className="field-label">Téléphone</label>
              <input type="tel" placeholder="+229 XX XX XX XX" value={form.telephone} onChange={set("telephone")} className="field-input" />
            </div>
            <PasswordField label="Mot de passe" placeholder="••••••••" value={form.password} onChange={set("password")}>
              {form.password && (
                <>
                  <div className="strength-bar" style={{ background: strengthColors[strength], width: ["0%", "33%", "66%", "100%"][strength] }} />
                  <span className="strength-text">Force : <strong style={{ color: strengthColors[strength] }}>{strengthLabels[strength]}</strong></span>
                </>
              )}
            </PasswordField>
            <PasswordField label="Confirmer le mot de passe" placeholder="••••••••" value={form.confirm} onChange={set("confirm")}>
              {form.confirm && form.password !== form.confirm && (
                <span className="field-error">Les mots de passe ne correspondent pas</span>
              )}
            </PasswordField>
            <p className="terms">
              En créant un compte, vous acceptez nos{" "}
              <span className="terms-link">Conditions d'utilisation</span> et notre{" "}
              <span className="terms-link">Politique de confidentialité</span>.
            </p>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Création en cours..." : "Créer mon compte"}
            </button>
          </form>
          <p className="switch-line">
            Déjà un compte ?{" "}
            <Link to="/login" className="switch-link">Se connecter</Link>
          </p>
        </div>
      </div>

      <div className="auth-panel auth-panel--dark">
        <div className="circle circle--tl-reg" />
        <div className="circle circle--br-reg" />
        <div className="circle circle--gold-reg" />
        <div className="panel-content">
          <span className="panel-tag">REJOIGNEZ-NOUS</span>
          <h2 className="panel-title panel-title--sm">Votre avenir<br />numérique<br />commence ici</h2>
          <p className="panel-subtitle">SheTech accompagne les femmes et jeunes filles africaines vers l'autonomisation économique grâce au numérique.</p>
          <div className="stats-row">
            {[["500+", "Utilisatrices"], ["200+", "Projets créés"], ["85%", "Satisfaction"]].map(([n, l]) => (
              <div key={l}>
                <div className="stat-number">{n}</div>
                <div className="stat-label">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
