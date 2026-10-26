import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.post("/forgot-password", { email });
      setMsg({ type: "success", text: res.data.message });
    } catch {
      setMsg({ type: "error", text: "Erreur serveur. Veuillez réessayer." });
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
          <p className="panel-subtitle">Réinitialisez votre<br />mot de passe en toute sécurité</p>
          <div className="panel-divider" />
          {["Lien envoyé par email", "Valable 1 heure", "Sécurisé et chiffré", "Gratuit et instantané"].map((f) => (
            <div key={f} className="feature-item"><div className="feature-dot" />{f}</div>
          ))}
        </div>
      </div>
      <div className="auth-form-zone">
        <div className="form-card">
          <button onClick={() => navigate("/login")} style={{ background: "none", border: "none", color: "#9A8090", fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}>
            &#8592; Retour à la connexion
          </button>
          <h1 className="form-title">Mot de passe oublié</h1>
          <p className="form-subtitle">Entrez votre email pour recevoir un lien de réinitialisation</p>
          {msg && <div className={`alert alert--${msg.type}`}>{msg.text}</div>}
          <form onSubmit={handleSubmit}>
            <div className="field-wrap">
              <label className="field-label">Adresse e-mail</label>
              <input type="email" placeholder="exemple@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="field-input" required />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Envoi en cours..." : "Envoyer le lien"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
