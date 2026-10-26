import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation, faUser, faAward, faPen, faCheck } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../store/authStore';

const ACCENT = '#C45C7A';
const GOLD = '#E8A554';

// Confirmation du nom exact à imprimer sur le certificat.
// La génération est UNIQUE : deux étapes (saisie → récapitulatif) + case de confirmation.
export default function NomCertificatModal({ titre, onConfirmer, onClose, isPending, erreur }) {
  const { user } = useAuth();
  const [nom, setNom] = useState(user?.nom || '');
  const [etape, setEtape] = useState(1); // 1 = saisie, 2 = récapitulatif
  const [confirme, setConfirme] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const nomPropre = nom.trim().replace(/\s+/g, ' ');
  const nomValide = nomPropre.length >= 2 && nomPropre.length <= 100;

  return (
    <div className="st-modal-overlay" onClick={onClose} style={{ zIndex: 60 }}>
      <div className="st-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div style={{ padding: '26px 28px' }}>
          <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#1a0f14', margin: '0 0 4px' }}>
            <FontAwesomeIcon icon={faAward} style={{ color: GOLD, marginRight: '10px' }} />
            Générer mon certificat
          </h2>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 18px' }}>{titre}</p>

          {/* Avertissement génération unique */}
          <div style={{
            background: '#fffbeb', border: `1.5px solid ${GOLD}`, borderRadius: '10px',
            padding: '14px 16px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'flex-start',
          }}>
            <FontAwesomeIcon icon={faTriangleExclamation} style={{ color: GOLD, fontSize: '18px', marginTop: '2px' }} />
            <p style={{ fontSize: '13px', color: '#78350f', margin: 0, lineHeight: 1.6 }}>
              <strong>La génération du certificat est UNIQUE.</strong> Le nom saisi ci-dessous
              sera imprimé définitivement et <strong>ne pourra plus être modifié</strong>.
              Vérifiez bien l'orthographe exacte avant de confirmer.
            </p>
          </div>

          {etape === 1 && (
            <>
              {/* Infos du compte pour comparaison */}
              <div style={{ background: '#faf5f7', border: '1px solid #f0e4ea', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px' }}>
                <p style={{ fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>
                  <FontAwesomeIcon icon={faUser} style={{ marginRight: '6px' }} />
                  Informations de votre compte
                </p>
                <p style={{ fontSize: '13px', color: '#1a0f14', margin: 0 }}>
                  Nom : <strong>{user?.nom || '—'}</strong>
                  {user?.email && <span style={{ color: '#9ca3af' }}> • {user.email}</span>}
                </p>
              </div>

              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1a0f14', marginBottom: '8px' }}>
                Nom exact à imprimer sur le certificat
              </label>
              <input
                value={nom}
                onChange={e => setNom(e.target.value)}
                placeholder="Ex : Marie Diallo"
                maxLength={100}
                autoFocus
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '13px 15px',
                  border: `1.5px solid ${nomValide ? '#e5e7eb' : '#fecaca'}`, borderRadius: '10px',
                  fontSize: '15px', fontWeight: 600, color: '#1a0f14', marginBottom: '18px',
                }}
              />

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={onClose} style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '9px', padding: '11px 20px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button
                  onClick={() => nomValide && setEtape(2)}
                  disabled={!nomValide}
                  style={{
                    background: nomValide ? ACCENT : '#e5e7eb', color: nomValide ? '#fff' : '#9ca3af',
                    border: 'none', borderRadius: '9px', padding: '11px 20px', fontSize: '14px', fontWeight: 700,
                    cursor: nomValide ? 'pointer' : 'not-allowed',
                  }}
                >
                  Vérifier →
                </button>
              </div>
            </>
          )}

          {etape === 2 && (
            <>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 10px' }}>
                Le certificat sera délivré au nom de :
              </p>
              <div style={{
                background: '#fff', border: `2px solid ${ACCENT}`, borderRadius: '12px',
                padding: '20px', textAlign: 'center', marginBottom: '18px',
              }}>
                <p style={{ fontSize: '22px', fontWeight: 800, color: '#1a0f14', margin: 0 }}>{nomPropre}</p>
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#374151', cursor: 'pointer', marginBottom: '20px' }}>
                <input
                  type="checkbox"
                  checked={confirme}
                  onChange={e => setConfirme(e.target.checked)}
                  style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: ACCENT }}
                />
                <span>
                  Je confirme que l'orthographe de ce nom est <strong>exacte</strong> et je comprends
                  qu'il ne pourra <strong>plus être modifié</strong> après la génération.
                </span>
              </label>

              {erreur && (
                <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '14px' }}>{erreur}</p>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => { setEtape(1); setConfirme(false); }} style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '9px', padding: '11px 20px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                  <FontAwesomeIcon icon={faPen} style={{ marginRight: '8px' }} />
                  Corriger
                </button>
                <button
                  onClick={() => confirme && onConfirmer(nomPropre)}
                  disabled={!confirme || isPending}
                  style={{
                    background: confirme ? GOLD : '#e5e7eb', color: confirme ? '#fff' : '#9ca3af',
                    border: 'none', borderRadius: '9px', padding: '11px 20px', fontSize: '14px', fontWeight: 800,
                    cursor: confirme && !isPending ? 'pointer' : 'not-allowed',
                  }}
                >
                  <FontAwesomeIcon icon={faCheck} style={{ marginRight: '8px' }} />
                  {isPending ? 'Génération...' : 'Générer définitivement'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
