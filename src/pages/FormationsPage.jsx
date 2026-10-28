import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faPlus, faRoute, faAward, faListCheck } from '@fortawesome/free-solid-svg-icons';
import {
  useParcoursList, useParcoursDetail,
  useMesInscriptions, useInscriptionParcours, useDesinscriptionParcours,
} from '../hooks/useParcours';

const ACCENT = '#C45C7A';
const BG = '#F9F0F3';
const GOLD = '#E8A554';

export default function FormationsPage() {
  const [selectedParcoursId, setSelectedParcoursId] = useState(null);
  const [searchParams] = useSearchParams();
  const onboarding = searchParams.get('onboarding') === '1';
  const { data: parcours, isLoading, isError: parcoursError } = useParcoursList();
  const { data: inscriptions, isLoading: inscriptionsLoading, isError: inscriptionsError } = useMesInscriptions();
  const { mutate: inscrire, isPending: inscriptionEnCours, error: erreurInscription, reset: resetInscription } = useInscriptionParcours();
  const { mutate: desinscrire } = useDesinscriptionParcours();

  const inscrits = new Set(
    (inscriptions?.inscriptions || []).filter(i => ['actif', 'termine'].includes(i.statut)).map(i => i.parcours_id)
  );
  const termines = new Set(
    (inscriptions?.inscriptions || []).filter(i => i.statut === 'termine').map(i => i.parcours_id)
  );
  const actifs = inscriptions?.actifs ?? 0;
  const max = inscriptions?.max ?? 3;
  const limiteAtteinte = actifs >= max;
  const inscriptionEtatInconnu = inscriptionsLoading || inscriptionsError;

  if (isLoading) {
    return (
      <div style={{ background: BG, minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="st-spinner" />
          <p style={{ marginTop: '16px', color: '#6b7280', fontSize: '14px' }}>
            Chargement des parcours...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: BG, minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1a0f14', margin: 0 }}>
             Parcours d'apprentissage
          </h1>
          <span style={{
            background: limiteAtteinte ? '#fef2f2' : '#fff',
            border: `1.5px solid ${limiteAtteinte ? '#fecaca' : ACCENT}`,
            color: limiteAtteinte ? '#dc2626' : ACCENT,
            borderRadius: '999px', padding: '7px 16px', fontSize: '13px', fontWeight: 800,
          }}>
            <FontAwesomeIcon icon={faRoute} style={{ marginRight: '8px' }} />
            {actifs}/{max} parcours suivis
          </span>
        </div>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: onboarding ? '16px' : '32px' }}>
          Choisissez jusqu'à {max} parcours à suivre, puis découvrez leurs formations.
        </p>

        {onboarding && (
          <div style={{
            background: '#fff', border: `1.5px solid ${GOLD}`, borderRadius: '12px',
            padding: '16px 20px', marginBottom: '28px',
          }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#1a0f14', margin: '0 0 4px' }}>
              🎉 Bienvenue sur SheTech !
            </p>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
              Choisissez jusqu'à <strong>{max} parcours</strong> qui vous intéressent pour commencer votre
              apprentissage. Vous profitez d'un <strong>mois d'essai gratuit</strong> sur toutes les formations.
            </p>
          </div>
        )}

        {erreurInscription && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
            <p style={{ color: '#dc2626', fontSize: '13px', margin: 0 }}>
              {erreurInscription.response?.data?.message || 'Erreur lors de l\'inscription.'}
            </p>
            <button onClick={() => resetInscription()} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 800 }}>✕</button>
          </div>
        )}

        {inscriptionsError && (
          <div style={{ background: '#fff', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#991b1b', fontSize: '13px' }}>
            Impossible de vérifier vos inscriptions. Réessayez avant de suivre un nouveau parcours.
          </div>
        )}

        {parcoursError ? (
          <div style={{ background: '#fff', border: '1px solid #fecaca', borderRadius: '12px', padding: '24px', color: '#991b1b' }}>
            Le catalogue n’a pas pu être chargé. Réessayez dans quelques instants.
          </div>
        ) : parcours?.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #f0dce4', borderRadius: '12px', padding: '24px', color: '#6b7280' }}>
            Le catalogue des formations est en cours de préparation. Revenez bientôt pour choisir votre parcours.
          </div>
        ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {parcours?.map(p => (
            <div
              key={p.id}
              onClick={() => setSelectedParcoursId(p.id)}
              style={{
                background: '#fff',
                borderRadius: '10px',
                padding: '24px',
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(196, 92, 122, 0.18)';
                e.currentTarget.style.borderColor = ACCENT;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              <div style={{ marginBottom: '16px', fontSize: '28px' }}></div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1a0f14', marginBottom: '8px' }}>
                {p.titre}
              </h3>
              <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.5, margin: 0 }}>
                {p.description}
              </p>
              <div style={{ fontSize: '12px', color: ACCENT, fontWeight: 600, marginTop: '12px' }}>
                {p.nb_formations ?? p.formations?.length ?? 0} formation{(p.nb_formations ?? p.formations?.length ?? 0) !== 1 ? 's' : ''} →
              </div>

              {/* Suivre / Suivi (max 3 parcours actifs) */}
              {termines.has(p.id) ? (
                <div
                  aria-label="Parcours terminé"
                  style={{ marginTop: '14px', width: '100%', boxSizing: 'border-box', textAlign: 'center', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '9px', fontSize: '12.5px', fontWeight: 800 }}
                >
                  <FontAwesomeIcon icon={faCircleCheck} style={{ marginRight: '8px' }} />
                  Parcours terminé
                </div>
              ) : inscrits.has(p.id) ? (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    if (window.confirm(`Ne plus suivre le parcours « ${p.titre} » ?`)) desinscrire(p.id);
                  }}
                  style={{
                    marginTop: '14px', width: '100%', background: '#f0fdf4', color: '#16a34a',
                    border: '1px solid #bbf7d0', borderRadius: '8px', padding: '9px',
                    fontSize: '12.5px', fontWeight: 800, cursor: 'pointer',
                  }}
                  title="Cliquez pour ne plus suivre ce parcours"
                >
                  <FontAwesomeIcon icon={faCircleCheck} style={{ marginRight: '8px' }} />
                  Suivi
                </button>
              ) : (
                <button
                  onClick={e => { e.stopPropagation(); setSelectedParcoursId(p.id); }}
                  style={{
                    marginTop: '14px', width: '100%',
                    background: ACCENT,
                    color: '#fff',
                    border: 'none', borderRadius: '8px', padding: '9px',
                    fontSize: '12.5px', fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} style={{ marginRight: '8px' }} />
                  Voir les formations
                </button>
              )}
            </div>
          ))}
        </div>
        )}
      </div>

      {selectedParcoursId && (
        <ParcoursModal
          parcoursId={selectedParcoursId}
          isInscrit={inscrits.has(selectedParcoursId)}
          limiteAtteinte={limiteAtteinte}
          inscriptionEtatInconnu={inscriptionEtatInconnu}
          inscriptionsError={inscriptionsError}
          max={max}
          inscriptionEnCours={inscriptionEnCours}
          onInscrire={() => inscrire(selectedParcoursId)}
          onClose={() => setSelectedParcoursId(null)}
        />
      )}
    </div>
  );
}

function ParcoursModal({ parcoursId, isInscrit, limiteAtteinte, inscriptionEtatInconnu, inscriptionsError, max, inscriptionEnCours, onInscrire, onClose }) {
  const navigate = useNavigate();
  const { data: parcours, isLoading, isError } = useParcoursDetail(parcoursId);
  const contientLecons = parcours?.formations?.some(formation =>
    formation.modules?.some(module => module.cours?.some(cours => cours.lecons?.length > 0))
  ) || false;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="st-modal-overlay" onClick={onClose}>
      <div className="st-modal" onClick={e => e.stopPropagation()}>
        {/* En-tête de la modale */}
        <div style={{
          position: 'sticky',
          top: 0,
          background: '#fff',
          padding: '24px 28px 16px',
          borderBottom: '1px solid #f0e4ea',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          zIndex: 1,
        }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1a0f14', margin: 0 }}>
              {isLoading ? 'Chargement...' : ` ${parcours?.titre ?? ''}`}
            </h2>
            {!isLoading && parcours?.description && (
              <p style={{ color: '#6b7280', fontSize: '13px', lineHeight: 1.6, margin: '8px 0 0' }}>
                {parcours.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              flex: 'none',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              border: '1px solid #e5e7eb',
              background: '#f9fafb',
              color: '#6b7280',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '20px 28px 28px' }}>
          {isLoading && (
            <div style={{ padding: '48px 0', textAlign: 'center' }}>
              <div className="st-spinner" />
              <p style={{ marginTop: '14px', color: '#6b7280', fontSize: '13px' }}>
                Chargement du parcours...
              </p>
            </div>
          )}

          {isError && (
            <p style={{ padding: '32px 0', textAlign: 'center', color: '#ef4444', fontSize: '14px' }}>
              Impossible de charger ce parcours. Réessayez plus tard.
            </p>
          )}

          {!isLoading && !isError && (
            <>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1a0f14', margin: '0 0 16px' }}>
                📚 Formations du parcours
              </h3>

              {!parcours?.formations?.length && (
                <p style={{ color: '#9ca3af', fontSize: '13px' }}>
                  Aucune formation disponible pour le moment.
                </p>
              )}

              {!isInscrit && parcours?.formations?.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', background: '#fdf7f9', border: '1px solid #f0dce4', borderRadius: '10px', padding: '14px 16px', marginBottom: '14px' }}>
                  <span style={{ color: inscriptionsError ? '#991b1b' : '#6b7280', fontSize: '13px' }}>
                    {inscriptionsError
                      ? 'Impossible de vérifier vos inscriptions. Réessayez dans quelques instants.'
                      : contientLecons
                        ? 'Inscrivez-vous à ce parcours pour démarrer une formation.'
                        : 'Les formations de ce parcours attendent encore leurs premières leçons.'}
                  </span>
                  <button
                    onClick={onInscrire}
                    disabled={!contientLecons || limiteAtteinte || inscriptionEtatInconnu || inscriptionEnCours}
                    style={{ background: contientLecons && !limiteAtteinte && !inscriptionEtatInconnu ? ACCENT : '#f3f4f6', color: contientLecons && !limiteAtteinte && !inscriptionEtatInconnu ? '#fff' : '#9ca3af', border: 'none', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', fontWeight: 800, cursor: contientLecons && !limiteAtteinte && !inscriptionEtatInconnu && !inscriptionEnCours ? 'pointer' : 'not-allowed' }}
                  >
                    {inscriptionEnCours ? 'Inscription...' : inscriptionEtatInconnu ? 'Vérification...' : limiteAtteinte ? `Limite de ${max} parcours atteinte` : contientLecons ? 'Suivre ce parcours' : 'En préparation'}
                  </button>
                </div>
              )}

              <div style={{ display: 'grid', gap: '14px' }}>
                {parcours?.formations?.map(formation => {
                  const nbModules = formation.modules?.length || 0;
                  const nbLecons = formation.modules?.reduce(
                    (acc, m) => acc + (m.cours?.reduce((a, c) => a + (c.lecons?.length || 0), 0) || 0),
                    0
                  ) || 0;
                  const open = () => navigate(`/dashboard/formations/${formation.id}`);

                  return (
                    <div
                      key={formation.id}
                      onClick={() => { if (isInscrit && nbLecons > 0) open(); }}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '10px',
                        padding: '16px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '16px',
                        cursor: isInscrit && nbLecons > 0 ? 'pointer' : 'default',
                        transition: 'all 0.2s ease',
                        background: '#fff',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = ACCENT;
                        e.currentTarget.style.background = '#fdf7f9';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.background = '#fff';
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1a0f14', margin: '0 0 4px' }}>
                          {formation.titre}
                        </h4>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                          {nbModules} module{nbModules !== 1 ? 's' : ''} • {nbLecons} leçon{nbLecons !== 1 ? 's' : ''} • Niveau : {formation.niveau}
                        </p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); if (isInscrit && nbLecons > 0) open(); }}
                        disabled={!isInscrit || nbLecons === 0}
                        style={{
                          flex: 'none',
                          background: isInscrit && nbLecons > 0 ? ACCENT : '#f3f4f6',
                          color: isInscrit && nbLecons > 0 ? '#fff' : '#9ca3af',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '10px 16px',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: isInscrit && nbLecons > 0 ? 'pointer' : 'not-allowed',
                        }}
                      >
                        {nbLecons === 0 ? 'Contenu à préparer' : isInscrit ? 'Commencer →' : 'Inscrivez-vous d’abord'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Quiz final & Grand Certificat du parcours */}
              {!!parcours?.formations?.length && isInscrit && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '22px' }}>
                <button
                  onClick={() => navigate(`/dashboard/parcours/${parcoursId}/quiz-final`)}
                  style={{
                    background: '#fff', color: ACCENT, border: `1.5px solid ${ACCENT}`,
                    borderRadius: '10px', padding: '12px', fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                  }}
                >
                  <FontAwesomeIcon icon={faListCheck} style={{ marginRight: '8px' }} />
                  Quiz final du parcours
                </button>
                <button
                  onClick={() => navigate(`/dashboard/parcours/${parcoursId}/certificat`)}
                  style={{
                    background: '#fff', color: GOLD, border: `1.5px solid ${GOLD}`,
                    borderRadius: '10px', padding: '12px', fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                  }}
                >
                  <FontAwesomeIcon icon={faAward} style={{ marginRight: '8px' }} />
                  Grand Certificat
                </button>
              </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
