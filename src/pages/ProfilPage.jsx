import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAward } from "@fortawesome/free-solid-svg-icons";
import { useProfil, useUpdateProfil, useUpdateAvatar } from "../hooks/useProfil";

const ACCENT = "#C45C7A";
const TEXT_MAIN = "#2B1B24";
const TEXT_MID = "#7A6570";
const BORDER = "#EDE3E7";
const NIVEAUX = ["débutante", "intermédiaire", "avancée", "experte"];

export default function ProfilPage() {
  const { data: profil, isLoading } = useProfil();
  const updateProfil = useUpdateProfil();
  const updateAvatar = useUpdateAvatar();
  const fileRef = useRef(null);
  const [feedback, setFeedback] = useState(null);

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm({
    defaultValues: { nom: "", telephone: "", bio: "", niveau: "débutante" },
  });

  useEffect(() => {
    if (profil) {
      reset({
        nom: profil.nom || "",
        telephone: profil.telephone || "",
        bio: profil.bio || "",
        niveau: profil.niveau || "débutante",
      });
    }
  }, [profil, reset]);

  const onSubmit = (data) => {
    setFeedback(null);
    updateProfil.mutate(data, {
      onSuccess: () => setFeedback({ type: "ok", msg: "Profil mis à jour." }),
      onError: (e) => setFeedback({ type: "err", msg: e.response?.data?.message || "Erreur." }),
    });
  };

  const onAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFeedback(null);
    updateAvatar.mutate(file, {
      onSuccess: () => setFeedback({ type: "ok", msg: "Photo de profil mise à jour." }),
      onError: (err) => setFeedback({ type: "err", msg: err.response?.data?.message || "Échec de l'upload." }),
    });
  };

  if (isLoading) {
    return <div style={{ padding: 40, color: TEXT_MID }}>Chargement du profil…</div>;
  }

  const initiale = (profil?.nom || "?").charAt(0).toUpperCase();

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: TEXT_MAIN, marginBottom: 6 }}>Mon profil</h1>
      <p style={{ fontSize: 14, color: TEXT_MID, marginBottom: 28 }}>Gérez vos informations personnelles et votre photo.</p>

      {/* Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32, padding: 20, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12 }}>
        <div style={{ width: 88, height: 88, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
          background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 32, fontWeight: 700 }}>
          {profil?.avatar
            ? <img src={profil.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : initiale}
        </div>
        <div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onAvatarChange} style={{ display: "none" }} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={updateAvatar.isPending}
            style={{ padding: "9px 18px", borderRadius: 8, border: `1.5px solid ${ACCENT}`,
              background: "transparent", color: ACCENT, fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit" }}>
            {updateAvatar.isPending ? "Envoi…" : "Changer la photo"}
          </button>
          <p style={{ fontSize: 12, color: TEXT_MID, margin: "8px 0 0" }}>JPEG, PNG, WebP — 2 Mo max.</p>
        </div>
      </div>

      {/* Badges obtenus */}
      <section style={{ marginBottom: 28, padding: 22, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 750, color: TEXT_MAIN }}>Mes badges</h2>
        <p style={{ margin: "0 0 18px", fontSize: 13, color: TEXT_MID }}>Vos réussites au fil de votre apprentissage.</p>
        {profil?.badges?.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
            {profil.badges.map((badge) => (
              <div key={badge.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, border: `1px solid ${BORDER}`, borderRadius: 10, background: "#fffafd" }}>
                <span style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: ACCENT, background: "#F9F0F3", flexShrink: 0 }}>
                  <FontAwesomeIcon icon={faAward} />
                </span>
                <span>
                  <strong style={{ display: "block", color: TEXT_MAIN, fontSize: 14 }}>{badge.nom}</strong>
                  <span style={{ display: "block", color: TEXT_MID, fontSize: 12, marginTop: 3 }}>{badge.description}</span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, padding: "14px 16px", borderRadius: 9, background: "#fffafd", color: TEXT_MID, fontSize: 13 }}>
            Aucun badge pour le moment. Termine une leçon ou réussis un quiz pour obtenir ton premier badge.
          </p>
        )}
      </section>

      {/* Formulaire */}
      <form onSubmit={handleSubmit(onSubmit)} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
        <Champ label="Nom complet">
          <input {...register("nom", { required: true })} style={inputStyle} />
        </Champ>
        <Champ label="Email">
          <input value={profil?.email || ""} disabled style={{ ...inputStyle, background: "#f7f4f5", color: TEXT_MID }} />
        </Champ>
        <Champ label="Téléphone">
          <input {...register("telephone")} placeholder="+225 07 00 00 00" style={inputStyle} />
        </Champ>
        <Champ label="Niveau">
          <select {...register("niveau")} style={{ ...inputStyle, cursor: "pointer" }}>
            {NIVEAUX.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Champ>
        <Champ label="Bio">
          <textarea {...register("bio")} rows={4} maxLength={500} placeholder="Parlez un peu de vous…"
            style={{ ...inputStyle, resize: "vertical" }} />
        </Champ>

        {feedback && (
          <div style={{ marginBottom: 16, fontSize: 13, fontWeight: 500,
            color: feedback.type === "ok" ? "#15803d" : "#dc2626" }}>
            {feedback.msg}
          </div>
        )}

        <button type="submit" disabled={updateProfil.isPending || !isDirty}
          style={{ padding: "11px 26px", borderRadius: 8, border: "none",
            background: ACCENT, color: "#fff", fontSize: 14, fontWeight: 700,
            cursor: updateProfil.isPending || !isDirty ? "not-allowed" : "pointer",
            opacity: updateProfil.isPending || !isDirty ? 0.6 : 1, fontFamily: "inherit" }}>
          {updateProfil.isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}

function Champ({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: TEXT_MID,
        marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 13px", borderRadius: 8,
  border: `1px solid ${BORDER}`, fontSize: 14, fontFamily: "inherit",
  color: TEXT_MAIN, outline: "none", boxSizing: "border-box", background: "#fff",
};
