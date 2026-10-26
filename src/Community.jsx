import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments, faFileArrowDown, faLink } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "./store/authStore";
import { useMessagerie } from "./store/messagerieStore";
import homeHero from "./assets/home-hero.png";
import api from "./lib/api";

const ACCENT = "#C45C7A";
const ACCENT_LIGHT = "#F5E6EC";
const GREEN = "#4CAF8A";
const GREEN_LIGHT = "#E3F5EF";
const GRAY = "#7A6570";
const BORDER = "#EDE3E7";

/* ── Styles CSS pour animations ── */
const styles = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

/* ── Utilitaires ── */
const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return `il y a ${Math.floor(diff / 86400)} j`;
};

const Avatar = ({ name, size = 36, color = ACCENT }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%",
    background: color, color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: size * 0.4, flexShrink: 0,
    fontFamily: "'Segoe UI', sans-serif"
  }}>
    {(name || "?").charAt(0).toUpperCase()}
  </div>
);

const Badge = ({ children, color = ACCENT, bg = ACCENT_LIGHT }) => (
  <span style={{
    display: "inline-flex", alignItems: "center",
    background: bg, color, padding: "2px 8px",
    borderRadius: 4, fontSize: 11, fontWeight: 600,
    letterSpacing: "0.3px"
  }}>{children}</span>
);

const CategoryTag = ({ cat }) => {
  const colors = {
    "Développement Web": { bg: "#EEF2FF", color: "#4F46E5" },
    "Developpement Web": { bg: "#EEF2FF", color: "#4F46E5" },
    "Intelligence Artificielle": { bg: "#F0FDF4", color: "#16A34A" },
    "Marketing Digital": { bg: "#FFF7ED", color: "#EA580C" },
    "E-commerce": { bg: "#FEF3C7", color: "#D97706" },
    "Leadership": { bg: "#FDF2F8", color: "#C026D3" },
    "Freelance": { bg: "#F0F9FF", color: "#0284C7" },
    "Design UI/UX": { bg: "#FFF1F2", color: "#E11D48" },
    "Cybersécurité": { bg: "#F5F3FF", color: "#7C3AED" },
    "Cybersecurite": { bg: "#F5F3FF", color: "#7C3AED" },
    "Autre": { bg: ACCENT_LIGHT, color: ACCENT },
  };
  const c = colors[cat] || { bg: ACCENT_LIGHT, color: ACCENT };
  return <Badge color={c.color} bg={c.bg}>{cat}</Badge>;
};

/* ── Thread complet ── */
function ForumThread({ post, onVote, user, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [responses, setResponses] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const loadResponses = async () => {
    if (open) { setOpen(false); return; }
    setLoading(true);
    try {
      const res = await api.get(`/community/posts/${post.id}/responses`);
      setResponses(res.data);
      setOpen(true);
    } catch {}
    setLoading(false);
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await api.post(`/community/posts/${post.id}/responses`, { contenu: replyText });
      setReplyText("");
      const res = await api.get(`/community/posts/${post.id}/responses`);
      setResponses(res.data);
      onRefresh();
    } catch {}
    setSending(false);
  };

  const handleMarkSolution = async (responseId) => {
    try {
      await api.put(`/community/responses/${responseId}/solution`);
      const res = await api.get(`/community/posts/${post.id}/responses`);
      setResponses(res.data);
      onRefresh();
    } catch {}
  };

  const handleVoteResponse = async (r) => {
    try {
      await api.post(`/community/vote`, { target_type: "reponse", target_id: r.id, valeur: r.mon_vote === 1 ? 0 : 1 });
      const res = await api.get(`/community/posts/${post.id}/responses`);
      setResponses(res.data);
    } catch {}
  };

  return (
    <div className="st-community-post-card">
      <div style={{
      background: "#fff",
      borderRadius: 8,
      border: `1px solid ${BORDER}`,
      marginBottom: 12,
      overflow: "hidden",
      transition: "all 0.3s ease",
      transform: "translateY(0)",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", gap: 0 }}>
        <div style={{
          width: 60, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "flex-start",
          padding: "20px 0 16px",
          borderRight: `1px solid ${BORDER}`,
          gap: 4
        }}>
          <button onClick={() => onVote(post)} style={{
            background: "none", border: "none", cursor: "pointer",
            color: post.mon_vote === 1 ? ACCENT : "#9CA3AF",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            padding: 4, borderRadius: 4,
            transition: "color 0.15s"
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={post.mon_vote === 1 ? ACCENT : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 700, color: post.mon_vote === 1 ? ACCENT : "#374151" }}>
              {post.nb_votes || 0}
            </span>
          </button>
          {post.est_resolu && (
            <div style={{ color: GREEN, marginTop: 4 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
          )}
        </div>

        <div style={{ flex: 1, padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                {post.est_resolu && <Badge color={GREEN} bg={GREEN_LIGHT}>✓ Résolu</Badge>}
                {post.tags && <CategoryTag cat={post.tags} />}
              </div>
              <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 600, color: "#111827", lineHeight: 1.4, cursor: "pointer" }}
                onClick={loadResponses}>
                {post.titre}
              </h3>
              <p style={{ margin: 0, color: GRAY, fontSize: 13, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {post.contenu}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar name={post.auteur_nom} size={24} />
              <span style={{ fontSize: 12, color: GRAY }}>
                <strong style={{ color: "#374151" }}>{post.auteur_nom}</strong> · {timeAgo(post.created_at)}
              </span>
            </div>
            <button onClick={loadResponses} style={{
              background: "none", border: `1px solid ${BORDER}`,
              borderRadius: 6, padding: "4px 12px",
              cursor: "pointer", fontSize: 12, color: GRAY,
              display: "flex", alignItems: "center", gap: 6,
              transition: "all 0.15s"
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = GRAY; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {loading ? "..." : `${post.nb_reponses || 0} réponse${post.nb_reponses !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div style={{ borderTop: `1px solid ${BORDER}`, background: "#FAFAFA" }}>
          {responses.length === 0 ? (
            <p style={{ margin: 0, padding: "16px 20px 16px 80px", color: GRAY, fontSize: 13 }}>
              Pas encore de réponses. Soyez la première !
            </p>
          ) : (
            responses.map((r, idx) => (
              <div key={r.id} style={{
                padding: "16px 20px 16px 80px",
                borderBottom: idx < responses.length - 1 ? `1px solid ${BORDER}` : "none",
                background: r.est_solution ? "#F0FDF4" : "transparent"
              }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <Avatar name={r.auteur_nom} size={32} color={r.est_solution ? GREEN : "#6B7280"} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <strong style={{ fontSize: 13, color: "#111827" }}>{r.auteur_nom}</strong>
                      {r.est_solution && <Badge color={GREEN} bg={GREEN_LIGHT}>✓ Solution acceptée</Badge>}
                      <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: "auto" }}>{timeAgo(r.created_at)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{r.contenu}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                      <button onClick={() => handleVoteResponse(r)} style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: r.mon_vote === 1 ? ACCENT : "#9CA3AF", fontSize: 12, display: "flex", alignItems: "center", gap: 4, padding: 0
                      }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill={r.mon_vote === 1 ? ACCENT : "none"} stroke="currentColor" strokeWidth="2">
                          <path d="M12 19V5M5 12l7-7 7 7"/>
                        </svg>
                        {r.nb_votes || 0} vote{r.nb_votes !== 1 ? "s" : ""}
                      </button>
                      {user && post.user_id === user.id && !r.est_solution && (
                        <button onClick={() => handleMarkSolution(r.id)} style={{
                          background: "none", border: `1px solid ${GREEN}`, cursor: "pointer",
                          color: GREEN, fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 999
                        }}>
                          ✓ Marquer comme solution
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {user ? (
            <div style={{ padding: "16px 20px 16px 80px", borderTop: `1px solid ${BORDER}` }}>
              <form onSubmit={handleReply} style={{ display: "flex", gap: 10 }}>
                <Avatar name={user.nom} size={32} />
                <div style={{ flex: 1, display: "flex", gap: 8 }}>
                  <input
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Écris ta réponse..."
                    style={{
                      flex: 1, padding: "8px 14px",
                      border: `1px solid ${BORDER}`, borderRadius: 6,
                      fontSize: 13, outline: "none",
                      fontFamily: "inherit"
                    }}
                    onFocus={e => e.target.style.borderColor = ACCENT}
                    onBlur={e => e.target.style.borderColor = BORDER}
                  />
                  <button type="submit" disabled={sending || !replyText.trim()} style={{
                    background: ACCENT, color: "#fff", border: "none",
                    borderRadius: 6, padding: "8px 16px",
                    cursor: "pointer", fontSize: 13, fontWeight: 600,
                    opacity: sending || !replyText.trim() ? 0.6 : 1
                  }}>
                    {sending ? "..." : "Répondre"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <p style={{ margin: 0, padding: "12px 20px 12px 80px", fontSize: 12, color: GRAY }}>
              Connecte-toi pour répondre
            </p>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

/* ── Carte profil ── */
function ProfileCard({ u, onFollow }) {
  const me = JSON.parse(localStorage.getItem("user") || "{}");
  const isMe = u.id === me.id;
  const ouvrirChat = useMessagerie((s) => s.ouvrir);
  return (
    <div className="st-community-member-card" style={{
      background: "#fff", borderRadius: 8, border: `1px solid ${BORDER}`,
      padding: "24px 20px", textAlign: "center",
      transition: "all 0.3s ease",
      transform: "translateY(0)",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)";
        e.currentTarget.style.transform = "translateY(-4px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <Avatar name={u.nom} size={56} />
      <h4 style={{ margin: "12px 0 2px", fontSize: 14, fontWeight: 700, color: "#111827" }}>{u.nom}</h4>
      {u.niveau && <p style={{ margin: "0 0 8px", fontSize: 12, color: ACCENT, fontWeight: 600 }}>{u.niveau}</p>}
      <p style={{ margin: "0 0 16px", fontSize: 12, color: GRAY, minHeight: 36, lineHeight: 1.5 }}>{u.bio || "Pas de bio"}</p>
      <div style={{ display: "flex", justifyContent: "center", gap: 24, fontSize: 12, marginBottom: 16 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{u.nb_posts || 0}</div>
          <div style={{ color: GRAY }}>Questions</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{u.nb_followers || 0}</div>
          <div style={{ color: GRAY }}>Suiveurs</div>
        </div>
      </div>
      {!isMe && (
        <button onClick={() => onFollow(u.id, !u.est_suivi)} style={{
          width: "100%", padding: "8px",
          background: u.est_suivi ? "#fff" : ACCENT,
          color: u.est_suivi ? ACCENT : "#fff",
          border: `1.5px solid ${ACCENT}`,
          borderRadius: 6, cursor: "pointer",
          fontSize: 13, fontWeight: 600,
          transition: "all 0.15s"
        }}>
          {u.est_suivi ? "✓ Suivi" : "+ Suivre"}
        </button>
      )}
      {!isMe && u.est_mutuel && (
        <button
          onClick={() => ouvrirChat({ key: `dm-${u.id}`, type: "dm", id: u.id, titre: u.nom, sousTitre: "Membre SheTech" })}
          style={{
            width: "100%", padding: "8px", marginTop: 8,
            background: "transparent", color: ACCENT, border: `1.5px solid ${ACCENT}`,
            borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <FontAwesomeIcon icon={faComments} />
          Message
        </button>
      )}
      {!isMe && u.est_suivi && !u.est_suiveur && (
        <p style={{ margin: "8px 0 0", fontSize: 11, color: GRAY, lineHeight: 1.4 }}>
          La messagerie s'ouvrira quand {u.nom.split(" ")[0]} te suivra en retour.
        </p>
      )}
    </div>
  );
}

/* ── Modal nouvelle question ── */
function NewPostModal({ onClose, onSuccess, user }) {
  const [form, setForm] = useState({ title: "", content: "", category: "" });
  const [sending, setSending] = useState(false);
  const categories = [
    "Développement Web", "Intelligence Artificielle", "Marketing Digital",
    "E-commerce", "Leadership", "Freelance", "Design UI/UX", "Cybersécurité"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) return;
    setSending(true);
    try {
      await api.post(`/community/posts`, { titre: form.title, contenu: form.content, tags: form.category || null });
      onSuccess();
      onClose();
    } catch {}
    setSending(false);
  };

  return (
    <div className="st-community-project-card" style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      animation: "fadeIn 0.3s ease-out"
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#fff", borderRadius: 12, width: "100%", maxWidth: 600,
        padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        animation: "slideIn 0.3s ease-out"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#111827" }}>Poser une question</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: GRAY, fontSize: 20 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Titre *</label>
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Ex : Comment déployer une app React sur Netlify ?"
              required
              style={{
                width: "100%", padding: "10px 14px", border: `1px solid ${BORDER}`,
                borderRadius: 6, fontSize: 14, boxSizing: "border-box", fontFamily: "inherit",
                outline: "none"
              }}
              onFocus={e => e.target.style.borderColor = ACCENT}
              onBlur={e => e.target.style.borderColor = BORDER}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Catégorie</label>
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              style={{
                width: "100%", padding: "10px 14px", border: `1px solid ${BORDER}`,
                borderRadius: 6, fontSize: 14, boxSizing: "border-box",
                background: "#fff", outline: "none"
              }}
              onFocus={e => e.target.style.borderColor = ACCENT}
              onBlur={e => e.target.style.borderColor = BORDER}
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Détails *</label>
            <textarea
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              placeholder="Décris ton problème en détail. Plus tu es précise, meilleures seront les réponses."
              required
              rows={5}
              style={{
                width: "100%", padding: "10px 14px", border: `1px solid ${BORDER}`,
                borderRadius: 6, fontSize: 14, boxSizing: "border-box",
                fontFamily: "inherit", resize: "vertical", outline: "none"
              }}
              onFocus={e => e.target.style.borderColor = ACCENT}
              onBlur={e => e.target.style.borderColor = BORDER}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button type="button" onClick={onClose} style={{
              padding: "10px 20px", borderRadius: 6, border: `1px solid ${BORDER}`,
              background: "#fff", cursor: "pointer", fontSize: 14, color: GRAY, fontWeight: 600
            }}>Annuler</button>
            <button type="submit" disabled={sending} style={{
              padding: "10px 24px", borderRadius: 6, border: "none",
              background: ACCENT, color: "#fff", cursor: "pointer",
              fontSize: 14, fontWeight: 600, opacity: sending ? 0.7 : 1
            }}>
              {sending ? "Publication..." : "Publier la question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── COMPOSANT PROJET CARD ── */
function ProjectCard({ projet, user, index }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  // Stocker les commentaires localement pour affichage immédiat
  const [commentaires, setCommentaires] = useState(projet.commentaires || []);
  const [likesCount, setLikesCount] = useState(projet.nb_likes || 0);
  const [userLiked, setUserLiked] = useState(projet.user_liked || false);
  const livrables = (projet.livrables || []).filter(livrable => livrable.fichier_url || livrable.lien);

  // Synchroniser si le parent recharge
  useEffect(() => {
    setCommentaires(projet.commentaires || []);
    setLikesCount(projet.nb_likes || 0);
    setUserLiked(projet.user_liked || false);
  }, [projet]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSending(true);

    try {
      const res = await api.post(`/projets/${projet.id}/commentaires`, { contenu: commentText });
      // Afficher le commentaire immédiatement sans recharger toute la page
      const newComment = res.data?.commentaire || {
        id: Date.now(),
        auteur_nom: user?.nom || "Moi",
        contenu: commentText,
        created_at: new Date().toISOString(),
      };
      setCommentaires(prev => [...prev, newComment]);
      setCommentText("");
    } catch (err) {
      console.error("Erreur commentaire:", err);
      alert("Erreur lors de l'envoi du commentaire");
    }
    setSending(false);
  };

  const handleLike = async () => {
    const wasLiked = userLiked;
    setUserLiked(!wasLiked);
    setLikesCount(prev => wasLiked ? prev - 1 : prev + 1);
    try {
      const res = await api.post(`/projets/${projet.id}/like`, {});
      setUserLiked(res.data.liked);
      setLikesCount(res.data.nb_likes);
    } catch (err) {
      console.error("Erreur like:", err);
      // Annuler si erreur
      setUserLiked(wasLiked);
      setLikesCount(projet.nb_likes || 0);
    }
  };

  return (
    <div style={{
      background: "#fff",
      borderRadius: 12,
      border: `1px solid ${BORDER}`,
      padding: "20px",
      transition: "all 0.3s ease",
      transform: "translateY(0)",
      animation: `slideIn 0.3s ease-out ${index * 0.05}s both`
    }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* En-tête */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={projet.nom_auteur || "Utilisatrice"} size={32} />
          <div>
            <strong style={{ fontSize: 14, color: "#111827" }}>{projet.titre}</strong>
            <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
              <span style={{ fontSize: 11, color: GRAY }}>par {projet.nom_auteur || "Anonyme"}</span>
              <span style={{ fontSize: 11, color: GRAY }}>• {timeAgo(projet.created_at)}</span>
            </div>
          </div>
        </div>
        <CategoryTag cat={projet.domaine || "Autre"} />
      </div>

      {/* Description */}
      <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: "0 0 16px" }}>
        {projet.description}
      </p>

      {/* Liens */}
      {(projet.lien_github || projet.lien_demo) && (
        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          {projet.lien_github && (
            <a href={projet.lien_github} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: ACCENT, textDecoration: "none" }}>
              GitHub →
            </a>
          )}
          {projet.lien_demo && (
            <a href={projet.lien_demo} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: ACCENT, textDecoration: "none" }}>
              Démo →
            </a>
          )}
        </div>
      )}

      {/* Livrables soumis */}
      {livrables.length > 0 && (
        <div style={{
          background: "#F9FAFB",
          border: `1px solid ${BORDER}`,
          borderRadius: 8,
          padding: "12px",
          marginBottom: 16
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
            Livrables soumis
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {livrables.map((livrable) => (
              <a
                key={livrable.id}
                href={livrable.fichier_url ? `${api.defaults.baseURL}${livrable.fichier_url}` : livrable.lien}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "8px 10px",
                  borderRadius: 6,
                  background: "#fff",
                  border: `1px solid ${BORDER}`,
                  color: "#374151",
                  textDecoration: "none",
                  fontSize: 12
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <FontAwesomeIcon icon={livrable.fichier_url ? faFileArrowDown : faLink} style={{ color: ACCENT }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {livrable.titre}
                  </span>
                </span>
                <span style={{ color: ACCENT, fontWeight: 700, flexShrink: 0 }}>{livrable.fichier_url ? "Ouvrir" : "Lien"}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: showComments ? 16 : 0 }}>
        {/* ✅ Bouton like avec état local */}
        <button onClick={handleLike} style={{
          background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
          color: userLiked ? ACCENT : "#9CA3AF", fontSize: 13, padding: 0,
          transition: "color 0.15s"
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24"
            fill={userLiked ? ACCENT : "none"}
            stroke={userLiked ? ACCENT : "#9CA3AF"}
            strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          {likesCount} J'aime
        </button>

        <button onClick={() => setShowComments(!showComments)} style={{
          background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
          color: showComments ? ACCENT : "#9CA3AF", fontSize: 13, padding: 0,
          transition: "color 0.15s"
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke={showComments ? ACCENT : "#9CA3AF"} strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {commentaires.length} commentaire{commentaires.length !== 1 ? "s" : ""}
        </button>
      </div>

      {/* ✅ Commentaires — s'affichent immédiatement après envoi */}
      {showComments && (
        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16, marginTop: 8 }}>
          {commentaires.length === 0 ? (
            <p style={{ fontSize: 12, color: GRAY, fontStyle: "italic", margin: "0 0 12px" }}>
              Pas encore de commentaire. Sois la première à donner ton avis !
            </p>
          ) : (
            commentaires.map((c, idx) => (
              <div key={c.id || idx} style={{
                padding: "10px 0",
                borderBottom: idx < commentaires.length - 1 ? `1px solid ${BORDER}` : "none"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Avatar name={c.auteur_nom} size={20} />
                  <strong style={{ fontSize: 12, color: "#111827" }}>{c.auteur_nom}</strong>
                  <span style={{ fontSize: 10, color: GRAY }}>{timeAgo(c.created_at)}</span>
                </div>
                <p style={{ fontSize: 12, color: "#374151", margin: "0 0 0 28px", lineHeight: 1.5 }}>{c.contenu}</p>
              </div>
            ))
          )}

          {/* Formulaire commentaire */}
          {user ? (
            <form onSubmit={handleSubmitComment} style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <Avatar name={user.nom} size={28} />
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Donne ton avis sur ce projet..."
                style={{
                  flex: 1, padding: "8px 12px", border: `1px solid ${BORDER}`,
                  borderRadius: 6, fontSize: 12, outline: "none",
                  fontFamily: "inherit"
                }}
                onFocus={e => e.target.style.borderColor = ACCENT}
                onBlur={e => e.target.style.borderColor = BORDER}
              />
              <button type="submit" disabled={sending || !commentText.trim()} style={{
                background: ACCENT, color: "#fff", border: "none",
                borderRadius: 6, padding: "6px 14px",
                cursor: "pointer", fontSize: 12, fontWeight: 600,
                opacity: sending || !commentText.trim() ? 0.6 : 1
              }}>
                {sending ? "..." : "Envoyer"}
              </button>
            </form>
          ) : (
            <p style={{ fontSize: 11, color: GRAY, marginTop: 12 }}>
              Connecte-toi pour commenter ce projet
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── PAGE PRINCIPALE ── */
export default function Community() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("forum");
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projetsLoading, setProjetsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("tous");

  const categories = [
    "Développement Web", "Intelligence Artificielle", "Marketing Digital",
    "E-commerce", "Leadership", "Freelance", "Design UI/UX", "Cybersécurité"
  ];

  const load = async () => {
    setLoading(true);
    try {
      if (activeTab === "forum") {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (filterCat && filterCat !== "tous") params.set("tag", filterCat);
        const res = await api.get(`/community/posts?${params.toString()}`);
        setPosts(res.data);
      } else if (activeTab === "profils") {
        const res = await api.get(`/community/users`);
        setUsers(res.data);
      }
    } catch {}
    setLoading(false);
  };

  // Projets personnels partagés par les membres (jamais les projets SheTech)
  const loadProjets = async () => {
    setProjetsLoading(true);
    try {
      const res = await api.get(`/projets/publics`);
      setProjets(res.data);
    } catch (err) {
      console.error("Erreur chargement projets:", err);
    }
    setProjetsLoading(false);
  };

  const handleVote = async (post) => {
    try {
      await api.post(`/community/vote`, {
        target_type: "post",
        target_id: post.id,
        valeur: post.mon_vote === 1 ? 0 : 1,
      });
      load();
    } catch {}
  };

  const handleFollow = async (userId, follow) => {
    try {
      if (follow) await api.post(`/community/users/${userId}/follow`);
      else await api.delete(`/community/users/${userId}/follow`);
      load();
    } catch {}
  };

  useEffect(() => {
    load();
    if (activeTab === "projets") {
      loadProjets();
    }
  }, [activeTab, filterCat]);

  const tabs = [
    { id: "forum", label: "Forum", icon: "" },
    { id: "projets", label: "Projets", icon: "" },
    { id: "profils", label: "Membres", icon: "" },
  ];

  const forumStats = {
    total: posts.length,
    resolved: posts.filter(p => p.est_resolu).length,
  };

  return (
    <div className="st-soft-page" style={{ minHeight: "100vh", background: "#F3F4F6" }}>
      {/* Header bandeau */}
      <div className="st-community-hero" style={{
        background: `linear-gradient(115deg, rgba(43,27,36,0.96) 0%, rgba(74,25,66,0.84) 46%, rgba(43,27,36,0.38) 100%), url(${homeHero}) center/cover`,
        padding: "40px 24px 0",
        color: "#fff"
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          <button
            onClick={() => navigate("/dashboard")}
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.18)",
              color: "rgba(255,255,255,0.8)",
              padding: "8px 16px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 20,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              backdropFilter: "blur(8px)",
              transition: "all 0.18s ease",
            }}
          >
            ← Tableau de bord
          </button>

          <div className="st-community-hero-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
            <div>
              <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px" }}>
                Communauté SheTech
              </h1>
              <p style={{ margin: 0, fontSize: 14, opacity: 0.75 }}>
                Pose tes questions, partage tes projets, connecte-toi
              </p>
            </div>
            <div className="st-community-stats" style={{ display: "flex", gap: 24 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{forumStats.total}</div>
                <div style={{ fontSize: 11, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.5px" }}>Questions</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#6EE7B7" }}>{forumStats.resolved}</div>
                <div style={{ fontSize: 11, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.5px" }}>Résolues</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{users.length || "—"}</div>
                <div style={{ fontSize: 11, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.5px" }}>Membres</div>
              </div>
            </div>
          </div>

          <div className="st-community-tabs" style={{ display: "flex", gap: 4 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                background: activeTab === t.id ? "#fff" : "transparent",
                color: activeTab === t.id ? "#2B1B24" : "rgba(255,255,255,0.7)",
                border: "none", borderRadius: "8px 8px 0 0",
                padding: "10px 20px", cursor: "pointer",
                fontSize: 13, fontWeight: 600,
                transition: "all 0.15s"
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px" }}>

        {/* ── FORUM ── */}
        {activeTab === "forum" && (
          <div className="st-community-layout" style={{ display: "flex", gap: 24 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="st-community-toolbar" style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                <div style={{ flex: 1, position: "relative", minWidth: 200 }}>
                  <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }}
                    width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && load()}
                    placeholder="Rechercher une question..."
                    style={{
                      width: "100%", padding: "9px 12px 9px 36px",
                      border: `1px solid ${BORDER}`, borderRadius: 6,
                      fontSize: 13, background: "#fff", boxSizing: "border-box",
                      outline: "none"
                    }}
                  />
                </div>
                {user && (
                  <button onClick={() => setShowModal(true)} style={{
                    background: ACCENT, color: "#fff", border: "none",
                    borderRadius: 6, padding: "9px 18px",
                    cursor: "pointer", fontSize: 13, fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 6,
                    whiteSpace: "nowrap"
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                    Nouvelle question
                  </button>
                )}
              </div>

              <div className="st-community-domaines" style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                {["tous", ...categories].map((c, index) => (
                  <button key={c} className={filterCat === c ? "is-active" : ""} onClick={() => setFilterCat(c)} style={{
                    background: filterCat === c ? ACCENT : "#fff",
                    color: filterCat === c ? "#fff" : GRAY,
                    border: `1px solid ${filterCat === c ? ACCENT : BORDER}`,
                    borderRadius: 20, padding: "4px 12px",
                    cursor: "pointer", fontSize: 12, fontWeight: 500,
                    transition: "all 0.15s",
                    animationDelay: `${index * 45}ms`
                  }}>
                    {c === "tous" ? "Tout" : c}
                  </button>
                ))}
              </div>

              {loading ? (
                <div style={{ textAlign: "center", padding: 48, color: GRAY, animation: "fadeIn 0.5s ease-in" }}>
                  <div style={{
                    width: 32, height: 32, border: `3px solid ${BORDER}`,
                    borderTop: `3px solid ${ACCENT}`, borderRadius: "50%",
                    animation: "spin 1s linear infinite", margin: "0 auto 12px"
                  }}></div>
                  Chargement...
                </div>
              ) : posts.length === 0 ? (
                <div style={{ textAlign: "center", padding: 48, color: GRAY, background: "#fff", borderRadius: 8, border: `1px solid ${BORDER}`, animation: "fadeIn 0.5s ease-in" }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={GRAY} strokeWidth="1.5" style={{ marginBottom: 12 }}>
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  <p style={{ margin: 0, fontWeight: 600, color: "#374151" }}>Aucune question trouvée</p>
                  <p style={{ margin: "8px 0 0", fontSize: 13 }}>Sois la première à poser une question !</p>
                </div>
              ) : posts.map((p, index) => (
                <div key={p.id} style={{ animation: `slideIn 0.3s ease-out ${index * 0.1}s both` }}>
                  <ForumThread post={p} onVote={handleVote} user={user} onRefresh={load} />
                </div>
              ))}
            </div>

            {/* Sidebar */}
            <div className="st-community-sidebar" style={{ width: 260, flexShrink: 0 }}>
              <div style={{ background: "#fff", borderRadius: 8, border: `1px solid ${BORDER}`, padding: 20, marginBottom: 16 }}>
                <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                  Bien poser sa question
                </h4>
                {[
                  "Sois précise et concise",
                  "Indique ce que tu as déjà essayé",
                  "Choisis la bonne catégorie",
                  "Marque comme résolu quand c'est bon",
                ].map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 12, color: GRAY, alignItems: "flex-start" }}>
                    <span style={{ color: ACCENT, fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                    {tip}
                  </div>
                ))}
              </div>

              <div style={{ background: "#fff", borderRadius: 8, border: `1px solid ${BORDER}`, padding: 20 }}>
                <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2">
                    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                  Statistiques
                </h4>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: GRAY }}>Total questions</span>
                  <strong>{forumStats.total}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: GRAY }}>Résolues</span>
                  <strong style={{ color: GREEN }}>{forumStats.resolved}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: GRAY }}>Taux résolution</span>
                  <strong style={{ color: ACCENT }}>
                    {forumStats.total ? Math.round(forumStats.resolved / forumStats.total * 100) : 0}%
                  </strong>
                </div>
                <div style={{ marginTop: 12, height: 6, background: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", background: GREEN, borderRadius: 3,
                    width: `${forumStats.total ? Math.round(forumStats.resolved / forumStats.total * 100) : 0}%`,
                    transition: "width 0.5s"
                  }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PROJETS ── */}
        {activeTab === "projets" && (
          <div>
            <p style={{ margin: "0 0 20px", color: GRAY, fontSize: 14 }}>
              {projets.length} projet{projets.length !== 1 ? "s" : ""} partagé{projets.length !== 1 ? "s" : ""} par la communauté
            </p>

            {projetsLoading ? (
              <div style={{ textAlign: "center", padding: 48, color: GRAY }}>
                <div style={{
                  width: 32, height: 32, border: `3px solid ${BORDER}`,
                  borderTop: `3px solid ${ACCENT}`, borderRadius: "50%",
                  animation: "spin 1s linear infinite", margin: "0 auto 12px"
                }}></div>
                Chargement des projets...
              </div>
            ) : projets.length === 0 ? (
              <div style={{ textAlign: "center", padding: 48, color: GRAY, background: "#fff", borderRadius: 8, border: `1px solid ${BORDER}` }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={GRAY} strokeWidth="1.5" style={{ marginBottom: 12 }}>
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p style={{ margin: 0, fontWeight: 600, color: "#374151" }}>Aucun projet partagé</p>
                <p style={{ margin: "8px 0 0", fontSize: 13 }}>
                  Partage un de tes projets depuis "Mes Projets" pour demander conseil à la communauté.
                </p>
                <button onClick={() => navigate("/dashboard/projets")} style={{
                  marginTop: 16, background: ACCENT, color: "#fff", border: "none",
                  borderRadius: 6, padding: "9px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600
                }}>
                  Aller à Mes Projets
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {projets.map((projet, index) => (
                  <ProjectCard
                    key={projet.id}
                    projet={projet}
                    user={user}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MEMBRES ── */}
        {activeTab === "profils" && (
          <div>
            <p style={{ margin: "0 0 20px", color: GRAY, fontSize: 14 }}>
              {users.length} membre{users.length !== 1 ? "s" : ""} dans la communauté
            </p>
            {loading ? (
              <div style={{ textAlign: "center", padding: 48, color: GRAY, animation: "fadeIn 0.5s ease-in" }}>
                <div style={{
                  width: 32, height: 32, border: `3px solid ${BORDER}`,
                  borderTop: `3px solid ${ACCENT}`, borderRadius: "50%",
                  animation: "spin 1s linear infinite", margin: "0 auto 12px"
                }}></div>
                Chargement...
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, animation: "fadeIn 0.5s ease-in" }}>
                {users.map((u, index) => (
                  <div key={u.id} style={{ animation: `slideIn 0.3s ease-out ${index * 0.05}s both` }}>
                    <ProfileCard u={u} onFollow={handleFollow} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {showModal && (
        <NewPostModal
          user={user}
          onClose={() => setShowModal(false)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
