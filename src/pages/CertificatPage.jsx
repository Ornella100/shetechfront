import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAward, faDownload, faLock, faListCheck, faCircleCheck, faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import NomCertificatModal from '../components/NomCertificatModal';
import { useEligibiliteCertificat, useGenererCertificat, telechargerCertificat } from '../hooks/useCertificats';

const ACCENT = '#C45C7A';
const BG = '#F9F0F3';
const GOLD = '#E8A554';

// Page dédiée au certificat de formation (débloqué par le quiz final ≥ 85 %).
export function CertificatFormationPage() {
  const { formationId } = useParams();
  return <CertificatPage type="formations" id={formationId} />;
}

// Page dédiée au Grand Certificat de parcours (quiz final à 100 %).
export function CertificatParcoursPage() {
  const { parcoursId } = useParams();
  return <CertificatPage type="parcours" id={parcoursId} />;
}

function CertificatPage({ type, id }) {
  const navigate = useNavigate();
  const estParcours = type === 'parcours';
  const [modalOuverte, setModalOuverte] = useState(false);

  const { data: elig, isLoading, refetch } = useEligibiliteCertificat(type, id);
  const { mutate: generer, isPending, error: erreurGeneration } = useGenererCertificat(type, id);

  const titre = estParcours ? elig?.parcours_titre : elig?.formation_titre;
  const quizUrl = `/dashboard/${type === 'formations' ? 'formations' : 'parcours'}/${id}/quiz-final`;
  const nomCertificat = estParcours ? 'Grand Certificat de fin de parcours' : 'Certificat de formation';

  const confirmerGeneration = (nomComplet) => {
    generer(nomComplet, {
      onSuccess: async (data) => {
        setModalOuverte(false);
        await refetch();
        telechargerCertificat(data.certificat_id, `certificat_${(titre || 'shetech').replace(/\s+/g, '_')}.pdf`);
      },
      onError: async (err) => {
        // Déjà généré dans une autre session : on rafraîchit pour afficher l'état réel
        if (err.response?.status === 409) {
          setModalOuverte(false);
          await refetch();
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div style={{ background: BG, minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="st-spinner" />
          <p style={{ marginTop: '16px', color: '#6b7280', fontSize: '14px' }}>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: BG, minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: ACCENT, fontSize: '13px', fontWeight: 700, cursor: 'pointer', padding: 0, marginBottom: '18px' }}
        >
          ← Retour
        </button>

        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '84px', height: '84px', borderRadius: '50%', margin: '0 auto 16px',
            background: elig?.eligible || elig?.deja_genere ? `linear-gradient(135deg, ${GOLD}, #d18f3d)` : '#f0e4ea',
            display: 'grid', placeItems: 'center',
            boxShadow: elig?.eligible || elig?.deja_genere ? '0 12px 30px rgba(232, 165, 84, 0.4)' : 'none',
          }}>
            <FontAwesomeIcon
              icon={elig?.eligible || elig?.deja_genere ? faAward : faLock}
              style={{ fontSize: '36px', color: elig?.eligible || elig?.deja_genere ? '#fff' : '#9ca3af' }}
            />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1a0f14', margin: '0 0 6px' }}>
            {nomCertificat}
          </h1>
          {titre && <p style={{ color: '#6b7280', fontSize: '15px', margin: 0 }}>{titre}</p>}
        </div>

        {/* ===== Certificat déjà généré : re-téléchargement uniquement ===== */}
        {elig?.deja_genere ? (
          <div style={{ background: '#fff', border: '1px solid #f0e4ea', borderRadius: '16px', padding: '30px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: '#16a34a', fontWeight: 700, margin: '0 0 16px' }}>
              <FontAwesomeIcon icon={faCircleCheck} style={{ marginRight: '8px' }} />
              Certificat obtenu
            </p>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 6px' }}>Délivré au nom de :</p>
            <p style={{ fontSize: '22px', fontWeight: 800, color: '#1a0f14', margin: '0 0 20px' }}>
              {elig.nom_imprime}
            </p>
            <button
              onClick={() => telechargerCertificat(elig.certificat_id, `certificat_${(titre || 'shetech').replace(/\s+/g, '_')}.pdf`)}
              style={{
                background: ACCENT, color: '#fff', border: 'none', borderRadius: '10px',
                padding: '13px 28px', fontSize: '15px', fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(196, 92, 122, 0.3)',
              }}
            >
              <FontAwesomeIcon icon={faDownload} style={{ marginRight: '10px' }} />
              Télécharger à nouveau
            </button>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '18px 0 0' }}>
              <FontAwesomeIcon icon={faTriangleExclamation} style={{ marginRight: '6px', color: GOLD }} />
              La génération est unique : le nom imprimé ne peut plus être modifié.
            </p>
          </div>
        ) : elig?.eligible ? (
          /* ===== Éligible : lancement de la génération (nom + avertissement) ===== */
          <div style={{ background: '#fff', border: '1px solid #f0e4ea', borderRadius: '16px', padding: '30px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.7, margin: '0 0 22px' }}>
              {estParcours
                ? 'Bravo ! Vous avez réussi le quiz final du parcours à 100 %. Votre Grand Certificat est prêt à être généré.'
                : 'Bravo ! Vous avez réussi le quiz final de la formation. Votre certificat est prêt à être généré.'}
              {elig.quiz_final_score != null && (
                <span style={{ display: 'block', marginTop: '6px', fontSize: '13px', color: '#6b7280' }}>
                  Score au quiz final : <strong>{elig.quiz_final_score}/100</strong>
                </span>
              )}
            </p>
            <button
              onClick={() => setModalOuverte(true)}
              style={{
                background: GOLD, color: '#fff', border: 'none', borderRadius: '10px',
                padding: '14px 30px', fontSize: '15px', fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(232, 165, 84, 0.35)',
              }}
            >
              <FontAwesomeIcon icon={faAward} style={{ marginRight: '10px' }} />
              Générer mon certificat
            </button>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '16px 0 0' }}>
              Le nom exact à imprimer vous sera demandé — la génération est unique.
            </p>
          </div>
        ) : (
          /* ===== Non éligible : progression + lien vers le quiz ===== */
          <div style={{ background: '#fff', border: '1px solid #f0e4ea', borderRadius: '16px', padding: '30px' }}>
            <p style={{ fontSize: '14px', color: '#374151', textAlign: 'center', lineHeight: 1.7, margin: '0 0 20px' }}>
              {elig?.message || 'Ce certificat n\'est pas encore débloqué.'}
            </p>

            {!estParcours && elig?.total > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
                  <span>Progression dans la formation</span>
                  <span style={{ fontWeight: 700, color: ACCENT }}>{elig.pourcentage}%</span>
                </div>
                <div style={{ height: '8px', background: '#f0e4ea', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${elig.pourcentage}%`, background: ACCENT, borderRadius: '4px' }} />
                </div>
              </div>
            )}

            {elig?.quiz_final_score != null && !elig?.quiz_final_reussi && (
              <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', margin: '0 0 18px' }}>
                Meilleur score au quiz final : <strong>{elig.quiz_final_score}/100</strong>
              </p>
            )}

            {elig?.quiz_final_existe && (
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => navigate(quizUrl)}
                  style={{
                    background: ACCENT, color: '#fff', border: 'none', borderRadius: '10px',
                    padding: '13px 26px', fontSize: '14px', fontWeight: 800, cursor: 'pointer',
                  }}
                >
                  <FontAwesomeIcon icon={faListCheck} style={{ marginRight: '10px' }} />
                  {elig?.quiz_final_score != null ? 'Repasser le quiz final' : 'Passer le quiz final'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {modalOuverte && (
        <NomCertificatModal
          titre={titre}
          onClose={() => setModalOuverte(false)}
          onConfirmer={confirmerGeneration}
          isPending={isPending}
          erreur={erreurGeneration?.response?.data?.message}
        />
      )}
    </div>
  );
}
