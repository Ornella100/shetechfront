import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../store/authStore";
import api from "../lib/api";

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

function PasswordField({ label, placeholder, value, onChange }) {
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
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const onboarding = new URLSearchParams(window.location.search).get("onboarding") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.post("/login", { email, mot_de_passe: password });
      login(res.data.user, res.data.token);
      navigate(res.data.user.role === "admin"
        ? "/admin"
        : onboarding ? "/dashboard/formations?onboarding=1" : "/dashboard");
    } catch (err) {
      setMsg(err.response?.data?.message || "Impossible de joindre le serveur.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel auth-panel--login">
        <div className="circle circle--tl" />
        <div className="circle circle--bl" />
        <div className="circle circle--gold" />
        <div className="panel-content">
          <span className="panel-tag">SHETECH 2026</span>
          <h2 className="panel-title">SheTech</h2>
          <p className="panel-subtitle">Plateforme d'entrepreneuriat numérique féminin</p>
          <div className="panel-divider" />
          {[
            "Formations numériques accessibles",
            "Projets pratiques guidés",
            "Réseau de femmes entrepreneures",
            "Suivi de progression personnalisé",
          ].map((f) => (
            <div key={f} className="feature-item"><div className="feature-dot" />{f}</div>
          ))}
          <div className="auth-proof-row">
            <div><strong>50+</strong><span>formations</span></div>
            <div><strong>8</strong><span>domaines</span></div>
            <div><strong>100%</strong><span>pratique</span></div>
          </div>
        </div>
      </div>

      <div className="auth-form-zone">
        <div className="form-card auth-login-card">
          <button onClick={() => navigate("/")} className="auth-back-btn">
            &#8592; Retour à l'accueil
          </button>
          <span className="auth-mini-tag">Espace apprenante</span>
          <h1 className="form-title">Bon retour</h1>
          <p className="form-subtitle">Connectez-vous à votre espace SheTech et reprenez votre progression.</p>
          {msg && <div className="alert alert--error">{msg}</div>}
          <form onSubmit={handleSubmit}>
            <div className="field-wrap">
              <label className="field-label">Adresse e-mail</label>
              <input type="email" placeholder="exemple@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="field-input" required />
            </div>
            <PasswordField label="Mot de passe" placeholder="Votre mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="forgot-link">
              <Link to="/forgot-password" style={{ fontSize: 13, color: "var(--burgun-light)" }}>Mot de passe oublié ?</Link>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>
          <div className="divider">
            <div className="divider-line" /><span className="divider-text">ou</span><div className="divider-line" />
          </div>
          <p className="switch-line">
            Pas encore de compte ?{" "}
            <Link to="/register" className="switch-link">S'inscrire gratuitement</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
