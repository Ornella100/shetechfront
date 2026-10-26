import { useState, useEffect, useRef, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComments, faXmark, faPaperPlane, faUserGroup, faFolderOpen,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../store/authStore";
import { useMessagerie } from "../store/messagerieStore";
import { getSocket } from "../lib/socket";
import api from "../lib/api";

const ACCENT = "#C45C7A";
const DARK = "#2B1B24";
const GRAY = "#9A8090";
const BORDER = "#EDE3E7";

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} j`;
};

/* ── Une fenêtre de chat flottante (discussion membre ou projet) ── */
function ChatWindow({ fenetre, currentUserId, onClose, socket }) {
  const [messages, setMessages] = useState([]);
  const [texte, setTexte] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const endpoint = fenetre.type === "dm"
    ? `/messages/conversations/${fenetre.id}`
    : `/projets/${fenetre.id}/messages`;

  const charger = useCallback(() => {
    api.get(endpoint)
      .then((res) => {
        const list = fenetre.type === "dm"
          ? res.data
          : res.data.map((m) => ({ ...m, moi: m.user_id === currentUserId }));
        setMessages(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [endpoint, fenetre.type, currentUserId]);

  // Chargement initial + filet de secours si le websocket est momentanément coupé
  useEffect(() => {
    charger();
    const t = setInterval(charger, 30000);
    return () => clearInterval(t);
  }, [charger]);

  // Réception en temps réel : un nouveau message pour CETTE discussion recharge le fil
  useEffect(() => {
    if (!socket) return;
    const onDirect = ({ otherUserId }) => { if (fenetre.type === "dm" && otherUserId === fenetre.id) charger(); };
    const onProjet = ({ projetId }) => { if (fenetre.type === "projet" && projetId === fenetre.id) charger(); };
    socket.on("message:direct", onDirect);
    socket.on("message:projet", onProjet);
    return () => { socket.off("message:direct", onDirect); socket.off("message:projet", onProjet); };
  }, [socket, fenetre, charger]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: "end" }); }, [messages]);

  const envoyer = (e) => {
    e.preventDefault();
    if (!texte.trim() || sending) return;
    setSending(true);
    api.post(endpoint, { contenu: texte.trim() })
      .then((res) => {
        const nouveau = fenetre.type === "dm" ? res.data : { ...res.data, moi: true };
        setMessages((prev) => [...prev, nouveau]);
        setTexte("");
      })
      .catch((err) => alert(err.response?.data?.message || "Impossible d'envoyer le message"))
      .finally(() => setSending(false));
  };

  return (
    <div style={{
      width: 300, height: 400, background: "#fff", borderRadius: "12px 12px 0 0",
      boxShadow: "0 8px 30px rgba(43,27,36,0.22)", display: "flex", flexDirection: "column",
      overflow: "hidden", border: `1px solid ${BORDER}`, borderBottom: "none",
    }}>
      <div style={{
        background: fenetre.type === "projet" ? DARK : ACCENT, color: "#fff",
        padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {fenetre.titre}
          </div>
          {fenetre.sousTitre && (
            <div style={{ fontSize: 10.5, opacity: 0.8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {fenetre.sousTitre}
            </div>
          )}
        </div>
        <button onClick={() => onClose(fenetre.key)} style={{
          background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
          width: 22, height: 22, borderRadius: "50%", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11,
        }}>
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8, background: "#FBF7F8" }}>
        {loading ? (
          <p style={{ fontSize: 12, color: GRAY, margin: 0 }}>Chargement…</p>
        ) : messages.length === 0 ? (
          <p style={{ fontSize: 12, color: GRAY, margin: 0 }}>
            {fenetre.type === "dm" ? "Dites bonjour !" : "Aucun message pour le moment."}
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} style={{ display: "flex", justifyContent: m.moi ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "80%", padding: "7px 11px", borderRadius: 10,
                borderBottomRightRadius: m.moi ? 3 : 10, borderBottomLeftRadius: m.moi ? 10 : 3,
                background: m.moi ? ACCENT : "#fff", color: m.moi ? "#fff" : DARK,
                border: m.moi ? "none" : `1px solid ${BORDER}`, fontSize: 12.5, lineHeight: 1.45,
              }}>
                {fenetre.type === "projet" && !m.moi && (
                  <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 2, color: ACCENT }}>
                    {m.de_shetech ? `SheTech · ${m.auteur_nom}` : m.auteur_nom}
                  </div>
                )}
                {m.contenu}
                <div style={{ fontSize: 9.5, marginTop: 3, color: m.moi ? "rgba(255,255,255,0.75)" : GRAY, textAlign: "right" }}>
                  {timeAgo(m.created_at)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={envoyer} style={{ display: "flex", gap: 6, padding: 8, borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <input
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder="Message…"
          style={{ flex: 1, padding: "7px 10px", border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12.5, fontFamily: "inherit", outline: "none" }}
        />
        <button type="submit" disabled={sending || !texte.trim()} style={{
          background: sending || !texte.trim() ? GRAY : ACCENT, border: "none", color: "#fff",
          width: 32, height: 32, borderRadius: 8, cursor: sending || !texte.trim() ? "default" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </form>
    </div>
  );
}

/* ── Panel de liste (discussions + projets) ── */
function PanelListe({ conversations, projets, loading, onOpenChat, onRefresh }) {
  const [tab, setTab] = useState("discussions");

  const tabBtn = (id, label, count) => (
    <button onClick={() => setTab(id)} style={{
      flex: 1, padding: "9px 8px", border: "none", cursor: "pointer",
      background: tab === id ? "#fff" : "transparent",
      color: tab === id ? ACCENT : GRAY, fontWeight: 700, fontSize: 12,
      borderBottom: tab === id ? `2px solid ${ACCENT}` : "2px solid transparent",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    }}>
      {label}{count > 0 && (
        <span style={{ background: ACCENT, color: "#fff", borderRadius: 999, fontSize: 10, padding: "1px 6px" }}>{count}</span>
      )}
    </button>
  );

  const nbNonLus = conversations.reduce((s, c) => s + (c.nb_non_lus || 0), 0);

  return (
    <div style={{
      width: 320, height: 420, background: "#fff", borderRadius: 14, overflow: "hidden",
      boxShadow: "0 12px 40px rgba(43,27,36,0.25)", display: "flex", flexDirection: "column",
      border: `1px solid ${BORDER}`,
    }}>
      <div style={{ background: DARK, color: "#fff", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong style={{ fontSize: 14 }}>Messagerie</strong>
        <button onClick={onRefresh} title="Actualiser" style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: 13 }}>
          <FontAwesomeIcon icon={faRotateRight} />
        </button>
      </div>

      <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}` }}>
        {tabBtn("discussions", "Discussions", nbNonLus)}
        {tabBtn("projets", "Projets", 0)}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <p style={{ fontSize: 12.5, color: GRAY, padding: 16, margin: 0 }}>Chargement…</p>
        ) : tab === "discussions" ? (
          conversations.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center" }}>
              <FontAwesomeIcon icon={faUserGroup} style={{ color: BORDER, fontSize: 28, marginBottom: 10 }} />
              <p style={{ fontSize: 12.5, color: GRAY, margin: 0, lineHeight: 1.6 }}>
                Suis un membre et fais-toi suivre en retour dans l'onglet "Membres" de la communauté
                pour débloquer la messagerie avec lui.
              </p>
            </div>
          ) : conversations.map((c) => (
            <button key={c.user_id} onClick={() => onOpenChat({
              key: `dm-${c.user_id}`, type: "dm", id: c.user_id, titre: c.nom,
              sousTitre: c.role === "admin" ? "Admin SheTech" : c.role === "mentor" ? "Mentor" : "Membre",
            })} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px",
              border: "none", borderBottom: `1px solid ${BORDER}`, background: "transparent", cursor: "pointer", textAlign: "left",
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%", background: ACCENT, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0,
              }}>
                {c.nom?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: DARK }}>{c.nom}</div>
                <div style={{ fontSize: 11, color: GRAY, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.dernier_message || "Nouvelle discussion"}
                </div>
              </div>
              {c.nb_non_lus > 0 && (
                <span style={{ background: ACCENT, color: "#fff", borderRadius: 999, fontSize: 10, fontWeight: 700, padding: "2px 7px", flexShrink: 0 }}>
                  {c.nb_non_lus}
                </span>
              )}
            </button>
          ))
        ) : (
          projets.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center" }}>
              <FontAwesomeIcon icon={faFolderOpen} style={{ color: BORDER, fontSize: 28, marginBottom: 10 }} />
              <p style={{ fontSize: 12.5, color: GRAY, margin: 0, lineHeight: 1.6 }}>
                Aucun projet SheTech accepté pour le moment.
              </p>
            </div>
          ) : projets.map((p) => (
            <button key={p.id} onClick={() => onOpenChat({ key: `projet-${p.id}`, type: "projet", id: p.id, titre: p.titre, sousTitre: p.sousTitre })}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px",
                border: "none", borderBottom: `1px solid ${BORDER}`, background: "transparent", cursor: "pointer", textAlign: "left",
              }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8, background: "#EEE6FA", color: "#6D4FA1",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <FontAwesomeIcon icon={faFolderOpen} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: DARK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.titre}</div>
                <div style={{ fontSize: 11, color: GRAY }}>{p.sousTitre}</div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default function MessagerieWidget() {
  const { user } = useAuth();
  const { panelOpen, togglePanel, fenetres, ouvrir, fermer } = useMessagerie();
  const [conversations, setConversations] = useState([]);
  const [projetsThreads, setProjetsThreads] = useState([]);
  const [loadingListe, setLoadingListe] = useState(true);

  const chargerConversations = useCallback(() => {
    if (!user) return;
    api.get("/messages/conversations").then((r) => setConversations(r.data)).catch(() => {});
  }, [user]);

  const chargerProjets = useCallback(() => {
    if (!user) return;
    const estStaff = user.role === "admin" || user.role === "mentor";
    const requete = estStaff
      ? api.get("/admin/projets").then((r) => r.data
          .filter((p) => p.origine === "assigne" && p.statut_acceptation === "accepte")
          .map((p) => ({ id: p.id, titre: p.titre, sousTitre: p.nom_auteur })))
      : api.get("/projets?origine=assigne").then((r) => r.data
          .filter((p) => p.statut_acceptation === "accepte")
          .map((p) => ({ id: p.id, titre: p.titre, sousTitre: "Discussion avec SheTech" })));
    requete.then(setProjetsThreads).catch(() => {});
  }, [user]);

  const rafraichirTout = useCallback(() => {
    setLoadingListe(true);
    Promise.allSettled([chargerConversations(), chargerProjets()]).finally(() => setLoadingListe(false));
  }, [chargerConversations, chargerProjets]);

  useEffect(() => {
    if (!user) return;
    rafraichirTout();
    // Filet de secours si le websocket est momentanément coupé
    const t = setInterval(rafraichirTout, 45000);
    return () => clearInterval(t);
  }, [user, rafraichirTout]);

  // Temps réel : le socket met à jour la liste des discussions dès qu'un message arrive
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    if (!socket) return;
    const onDirect = () => chargerConversations();
    const onProjet = () => chargerProjets();
    socket.on("message:direct", onDirect);
    socket.on("message:projet", onProjet);
    return () => { socket.off("message:direct", onDirect); socket.off("message:projet", onProjet); };
  }, [user, chargerConversations, chargerProjets]);

  if (!user) return null;

  const socket = getSocket();
  const nbNonLus = conversations.reduce((s, c) => s + (c.nb_non_lus || 0), 0);

  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 1000, display: "flex", flexDirection: "row-reverse", alignItems: "flex-end", gap: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
        {panelOpen && (
          <PanelListe
            conversations={conversations}
            projets={projetsThreads}
            loading={loadingListe}
            onOpenChat={ouvrir}
            onRefresh={rafraichirTout}
          />
        )}
        <button onClick={togglePanel} style={{
          width: 56, height: 56, borderRadius: "50%", background: ACCENT, border: "none",
          color: "#fff", cursor: "pointer", boxShadow: "0 6px 20px rgba(196,92,122,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, position: "relative",
        }}>
          <FontAwesomeIcon icon={panelOpen ? faXmark : faComments} />
          {!panelOpen && nbNonLus > 0 && (
            <span style={{
              position: "absolute", top: -2, right: -2, background: "#E8A554", color: "#fff",
              borderRadius: 999, fontSize: 10, fontWeight: 700, minWidth: 18, height: 18,
              display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff",
            }}>
              {nbNonLus}
            </span>
          )}
        </button>
      </div>

      {fenetres.map((f) => (
        <ChatWindow key={f.key} fenetre={f} currentUserId={user.id} onClose={fermer} socket={socket} />
      ))}
    </div>
  );
}
