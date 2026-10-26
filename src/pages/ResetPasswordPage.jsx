import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-form-zone">
          <div className="form-card">
            <h1 className="form-title">Lien invalide</h1>
            <p className="form-subtitle">Ce lien de réinitialisation est invalide ou expiré.</p>
            <button className="btn-primary" onClick={() => navigate("/login")}>Retour à la connexion</button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setMsg({ type: "error", text: "Les mots de passe ne correspondent pas." }); return; }
    if (password.length < 6) { setMsg({ type: "error", text: "Minimum 6 caractères." }); return; }
    setLoading(true);
    try {
      const res = await api.post("/reset-password", { token, newPassword: password });
      setMsg({ type: "success", text: res.data.message });
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Lien invalide ou expiré." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="circle circle--tl" />
        <div className="circle circle--bl" />
        <div className="circle circle--gold" />
        <div className="panel-content">
          <span className="panel-tag">SÉCURITÉ</span>
          <h2 className="panel-title">SheTech</h2>
          <p className="panel-subtitle">Créez un nouveau<br />mot de passe sécurisé</p>
          <div className="panel-divider" />
          {["Minimum 6 caractères", "Mélangez lettres et chiffres", "Évitez les mots simples", "Sécurisé et chiffré"].map((f) => (
            <div key={f} className="feature-item"><div className="feature-dot" />{f}</div>
          ))}
        </div>
      </div>
      <div className="auth-form-zone">
        <div className="form-card">
          <h1 className="form-title">Nouveau mot de passe</h1>
          <p className="form-subtitle">Choisissez un mot de passe sécurisé</p>
          {msg && <div className={`alert alert--${msg.type}`}>{msg.text}</div>}
          <form onSubmit={handleSubmit}>
            <PasswordField label="Nouveau mot de passe" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            <PasswordField label="Confirmer le mot de passe" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer le mot de passe"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
