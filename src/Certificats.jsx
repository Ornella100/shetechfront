import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAward, faDownload, faGraduationCap, faRoute, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { useQuery } from "@tanstack/react-query";
import api from "./lib/api";
import { useMesCertificats, telechargerCertificat } from "./hooks/useCertificats";
import { useMesInscriptions } from "./hooks/useParcours";

const ACCENT = "#C45C7A";
const BG = "#F9F0F3";
const GOLD = "#E8A554";

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "";
}

export default function Certificats() {
  const navigate = useNavigate();
  const { data: certificats, isLoading } = useMesCertificats();
  const { data: inscriptions } = useMesInscriptions();
  const { data: progressions } = useQuery({
    queryKey: ["progression"],
    queryFn: () => api.get("/progression").then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div style={{ background: BG, minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div className="st-spinner" />
          <p style={{ marginTop: "16px", color: "#6b7280", fontSize: "14px" }}>Chargement des certificats...</p>
        </div>
      </div>
    );
  }

  const certifsFormationIds = new Set((certificats || []).filter(c => c.type === "formation").map(c => c.formation_id));
  const certifsParcoursIds = new Set((certificats || []).filter(c => c.type === "parcours").map(c => c.parcours_id));
  const formationsEnCours = (progressions || []).filter(p => !certifsFormationIds.has(p.formation_id));
  const parcoursActifs = (inscriptions?.inscriptions || []).filter(
    i => i.statut !== "abandonne" && !certifsParcoursIds.has(i.parcours_id)
  );

  return (
    <div style={{ background: BG, minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#1a0f14", marginBottom: "8px" }}>
          <FontAwesomeIcon icon={faAward} style={{ color: GOLD, marginRight: "12px" }} />
          Mes certificats
        </h1>
        <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "32px" }}>
          Chaque formation offre un certificat (quiz final réussi à 85 %). Le Grand Certificat
          d'un parcours exige un sans-faute (100 %) à son quiz final.
        </p>

        {/* ===== Certificats obtenus ===== */}
        <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#1a0f14", margin: "0 0 14px" }}>
          Certificats obtenus
        </h2>
        {!certificats?.length ? (
          <p style={{ color: "#9ca3af", fontSize: "13px", marginBottom: "32px" }}>
            Aucun certificat pour le moment — réussissez un quiz final pour débloquer le vôtre !
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", marginBottom: "36px" }}>
            {certificats.map((c) => (
              <div key={c.id} style={{
                background: "#fff", borderRadius: "12px", padding: "20px",
                border: `1.5px solid ${c.type === "parcours" ? GOLD : "#f0e4ea"}`,
              }}>
                <p style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: c.type === "parcours" ? GOLD : ACCENT, margin: "0 0 8px" }}>
                  <FontAwesomeIcon icon={c.type === "parcours" ? faRoute : faGraduationCap} style={{ marginRight: "6px" }} />
                  {c.type === "parcours" ? "Grand Certificat de parcours" : "Certificat de formation"}
                </p>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1a0f14", margin: "0 0 6px" }}>{c.titre}</h3>
                <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 4px" }}>
                  Délivré à <strong>{c.nom_imprime}</strong>
                </p>
                <p style={{ fontSize: "11.5px", color: "#9ca3af", margin: "0 0 14px" }}>
                  {formatDate(c.date_obtention)} • N° {c.code_verification}
                </p>
                <button
                  onClick={() => telechargerCertificat(c.id, `certificat_${(c.titre || "shetech").replace(/\s+/g, "_")}.pdf`)}
                  style={{
                    width: "100%", background: ACCENT, color: "#fff", border: "none",
                    borderRadius: "9px", padding: "11px", fontSize: "13px", fontWeight: 700, cursor: "pointer",
                  }}
                >
                  <FontAwesomeIcon icon={faDownload} style={{ marginRight: "8px" }} />
                  Télécharger
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ===== Certificats de formation à débloquer ===== */}
        {formationsEnCours.length > 0 && (
          <>
            <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#1a0f14", margin: "0 0 14px" }}>
              <FontAwesomeIcon icon={faGraduationCap} style={{ color: ACCENT, marginRight: "10px" }} />
              Formations en cours
            </h2>
            <div style={{ display: "grid", gap: "10px", marginBottom: "36px" }}>
              {formationsEnCours.map((p) => (
                <button
                  key={p.formation_id}
                  onClick={() => navigate(`/dashboard/formations/${p.formation_id}/certificat`)}
                  style={{
                    display: "flex", alignItems: "center", gap: "14px", background: "#fff",
                    border: "1px solid #f0e4ea", borderRadius: "10px", padding: "14px 18px",
                    cursor: "pointer", textAlign: "left", transition: "border-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#f0e4ea"; }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "#1a0f14", margin: "0 0 4px" }}>
                      {p.formation_titre}
                    </p>
                    <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>
                      Progression : {p.pourcentage ?? 0}% — voir l'état de mon certificat
                    </p>
                  </div>
                  <FontAwesomeIcon icon={faChevronRight} style={{ color: ACCENT }} />
                </button>
              ))}
            </div>
          </>
        )}

        {/* ===== Grands Certificats de parcours ===== */}
        {parcoursActifs.length > 0 && (
          <>
            <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#1a0f14", margin: "0 0 14px" }}>
              <FontAwesomeIcon icon={faRoute} style={{ color: GOLD, marginRight: "10px" }} />
              Mes parcours
            </h2>
            <div style={{ display: "grid", gap: "10px" }}>
              {parcoursActifs.map((i) => (
                <button
                  key={i.parcours_id}
                  onClick={() => navigate(`/dashboard/parcours/${i.parcours_id}/certificat`)}
                  style={{
                    display: "flex", alignItems: "center", gap: "14px", background: "#fff",
                    border: `1px solid ${GOLD}40`, borderRadius: "10px", padding: "14px 18px",
                    cursor: "pointer", textAlign: "left", transition: "border-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = GOLD; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${GOLD}40`; }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "#1a0f14", margin: "0 0 4px" }}>
                      {i.parcours?.titre}
                    </p>
                    <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>
                      Grand Certificat de fin de parcours — quiz final à 100 %
                    </p>
                  </div>
                  <FontAwesomeIcon icon={faChevronRight} style={{ color: GOLD }} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
