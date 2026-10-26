import { useState, useEffect } from "react";
import api from "./lib/api";

export default function CertificatForm({ formation, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState(null);

  useEffect(() => {
    api.get(`/certificat/verifier/${formation.id}`)
      .then((res) => setVerification(res.data))
      .catch((error) => setVerification({
        eligible: false,
        message: error.response?.data?.message || "Verification impossible.",
      }));
  }, [formation.id]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await api.post(
        "/certificat/generer-auto",
        { formationId: formation.id },
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      const nomFichier = (formation?.titre || "formation_shetech").replace(/[\\/:*?"<>|]/g, "_");
      link.href = url;
      link.setAttribute("download", `certificat_${nomFichier}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      alert("Certificat généré avec succès !");
      onSuccess?.();
      onClose?.();
    } catch (error) {
      alert(error.response?.data?.message || "Erreur lors de la génération du certificat.");
    } finally {
      setLoading(false);
    }
  };

  if (!verification) {
    return (
      <div style={styles.modalOverlay}>
        <div style={styles.modal}>
          <div style={styles.center}>Vérification en cours...</div>
        </div>
      </div>
    );
  }

  if (!verification.eligible) {
    return (
      <div style={styles.modalOverlay}>
        <div style={styles.modal}>
          <div style={styles.modalHeader}>
            <h2 style={styles.modalTitle}>Certificat non disponible</h2>
            <button onClick={onClose} style={styles.closeBtn}>×</button>
          </div>
          <p style={styles.modalSubtitle}>
            Pour obtenir votre certificat, vous devez réussir tous les quiz de la formation.
          </p>
          <div style={styles.progressBox}>
            Progression : {verification.progression?.modules_reussis || 0} / {verification.progression?.modules_total || 0} quiz réussis
          </div>
          <button onClick={onClose} style={styles.btnClose}>Fermer</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Obtenir mon certificat</h2>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>
        <p style={styles.modalSubtitle}>
          Félicitations ! Votre formation est terminée. Votre certificat sera rempli automatiquement avec vos informations.
        </p>
        <div style={styles.summaryBox}>
          <strong>{formation?.titre || "Formation SheTech"}</strong>
          <span>{formation?.domaine || "Domaine SheTech"}</span>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          style={loading ? styles.btnDisabled : styles.btnPrimary}
        >
          {loading ? "Génération en cours..." : "Télécharger mon certificat"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  modalOverlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#fff", borderRadius: 16,
    width: 500, maxWidth: "90%",
    padding: 24,
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  center: { textAlign: "center", padding: 20, color: "#7A6570" },
  modalHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { margin: 0, fontSize: 20, fontWeight: 700, color: "#2B1B24" },
  closeBtn: {
    background: "#F9F0F3", border: "none",
    width: 30, height: 30, borderRadius: "50%",
    cursor: "pointer", fontSize: 16, color: "#6D2E46",
  },
  modalSubtitle: { color: "#7A6570", marginBottom: 20, fontSize: 14, lineHeight: 1.5 },
  summaryBox: {
    display: "flex", flexDirection: "column", gap: 4,
    background: "#F9F4F6", border: "1px solid #EDE3E7",
    borderRadius: 10, padding: 14, marginBottom: 18, color: "#2B1B24",
  },
  progressBox: {
    background: "#F9F0F3", padding: 12, borderRadius: 8,
    marginBottom: 20, color: "#6D2E46",
  },
  btnPrimary: {
    width: "100%", padding: 12,
    background: "#C45C7A", color: "#fff",
    border: "none", borderRadius: 8,
    fontSize: 14, fontWeight: 700, cursor: "pointer",
  },
  btnDisabled: {
    width: "100%", padding: 12,
    background: "#EDE3E7", color: "#9A8090",
    border: "none", borderRadius: 8,
    fontSize: 14, fontWeight: 700, cursor: "not-allowed",
  },
  btnClose: {
    padding: "8px 20px",
    background: "#C45C7A", color: "#fff",
    border: "none", borderRadius: 8,
    cursor: "pointer", fontSize: 14,
  },
};
