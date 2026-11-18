import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCrown, faCircleCheck, faCircleXmark, faMobileScreen, faReceipt,
} from '@fortawesome/free-solid-svg-icons';
import { useAbonnementStatut, useCheckoutAbonnement, useMesPaiements } from '../hooks/useAbonnement';

const ACCENT = '#C45C7A';
const BG = '#F9F0F3';
const GOLD = '#E8A554';

const STATUT_PAIEMENT = {
  approved: { label: 'Payé', color: '#16a34a', bg: '#f0fdf4' },
  pending: { label: 'En attente', color: '#b45309', bg: '#fffbeb' },
  declined: { label: 'Refusé', color: '#dc2626', bg: '#fef2f2' },
  canceled: { label: 'Annulé', color: '#6b7280', bg: '#f9fafb' },
};

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
}

export default function AbonnementPage() {
  const [params] = useSearchParams();
  const qc = useQueryClient();
  const { data: statut, isLoading } = useAbonnementStatut();
  const { mutate: checkout, isPending: checkoutEnCours, error: erreurCheckout } = useCheckoutAbonnement();
  const { data: paiements } = useMesPaiements();
  const pollRef = useRef(null);

  // Au retour du checkout FedaPay (?retour=1) : le webhook est asynchrone,
  // on re-vérifie le statut plusieurs fois pendant ~30 s.
  useEffect(() => {
    if (params.get('retour') !== '1') return;
    let restants = 6;
    pollRef.current = setInterval(() => {
      qc.invalidateQueries({ queryKey: ['abonnement'] });
      restants -= 1;
      if (restants <= 0) clearInterval(pollRef.current);
    }, 5000);
    return () => clearInterval(pollRef.current);
  }, [params, qc]);

  const lancerPaiement = () => {
    checkout(undefined, {
      onSuccess: (data) => {
        if (data.transaction_id) sessionStorage.setItem('fedapay_tx', String(data.transaction_id));
        window.location.href = data.url;
      },
    });
  };

  if (isLoading) {
    return (
      <div style={{ background: BG, minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div className="st-spinner" />
      </div>
    );
  }

  return (
    <div style={{ background: BG, minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1a0f14', marginBottom: '8px' }}>
          <FontAwesomeIcon icon={faCrown} style={{ color: GOLD, marginRight: '12px' }} />
          Mon accès SheTech
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '28px' }}>
          Un paiement unique de 150 000 FCFA donne accès à trois parcours, sans renouvellement.
        </p>

        {/* ===== Carte de statut ===== */}
        <div style={{
          background: '#fff', border: '1px solid #f0e4ea', borderRadius: '16px',
          padding: '28px', marginBottom: '24px', textAlign: 'center',
        }}>
          {statut?.type === 'staff' ? (
            <p style={{ fontSize: '15px', color: '#16a34a', fontWeight: 700, margin: 0 }}>
              <FontAwesomeIcon icon={faCircleCheck} style={{ marginRight: '8px' }} />
              Accès complet (équipe SheTech)
            </p>
          ) : statut?.type === 'test' ? (
            <>
              <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: '34px', color: '#16a34a', marginBottom: '12px' }} />
              <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#1a0f14', margin: '0 0 6px' }}>Accès de test actif</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Tu peux choisir jusqu’à trois parcours pour vérifier les cours.</p>
            </>
          ) : statut?.acces ? (
            <>
              <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: '34px', color: '#16a34a', marginBottom: '12px' }} />
              <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#1a0f14', margin: '0 0 6px' }}>Pack trois parcours activé</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                {statut.abonnementFin ? `Accès valable jusqu’au ${formatDate(statut.abonnementFin)}.` : 'Accès permanent, sans renouvellement.'}
              </p>
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faCircleXmark} style={{ fontSize: '34px', color: '#dc2626', marginBottom: '12px' }} />
              <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#1a0f14', margin: '0 0 6px' }}>Accès non activé</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 18px' }}>
                Effectue le paiement unique pour choisir tes trois parcours et commencer les formations.
              </p>
              <BoutonPayer onClick={lancerPaiement} enCours={checkoutEnCours} prix={statut?.prix_xof} />
            </>
          )}

          {erreurCheckout && (
            <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '14px' }}>
              {erreurCheckout.response?.data?.message || 'Erreur lors de la création du paiement.'}
            </p>
          )}
        </div>

        {/* ===== Historique des paiements ===== */}
        <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#1a0f14', margin: '0 0 14px' }}>
          <FontAwesomeIcon icon={faReceipt} style={{ color: ACCENT, marginRight: '10px' }} />
          Historique des paiements
        </h2>
        {!paiements?.length ? (
          <p style={{ color: '#9ca3af', fontSize: '13px' }}>Aucun paiement pour le moment.</p>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #f0e4ea', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#faf5f7', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontWeight: 700 }}>Date</th>
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontWeight: 700 }}>Montant</th>
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontWeight: 700 }}>Méthode</th>
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontWeight: 700 }}>Statut</th>
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontWeight: 700 }}>Accès</th>
                  </tr>
                </thead>
                <tbody>
                  {paiements.map(p => {
                    const s = STATUT_PAIEMENT[p.statut] || STATUT_PAIEMENT.pending;
                    return (
                      <tr key={p.id} style={{ borderTop: '1px solid #f0e4ea' }}>
                        <td style={{ padding: '12px 16px', color: '#374151' }}>{formatDate(p.createdAt)}</td>
                        <td style={{ padding: '12px 16px', color: '#1a0f14', fontWeight: 700 }}>
                          {Number(p.montant).toLocaleString('fr-FR')} {p.devise}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#374151' }}>{p.methode || '—'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: s.bg, color: s.color, borderRadius: '999px', padding: '4px 12px', fontSize: '12px', fontWeight: 700 }}>
                            {s.label}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                          {p.abonnement ? (p.abonnement.dateFin ? `Jusqu’au ${formatDate(p.abonnement.dateFin)}` : 'Pack permanent · 3 parcours') : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BoutonPayer({ onClick, enCours, prix }) {
  return (
    <button
      onClick={onClick}
      disabled={enCours}
      style={{
        background: GOLD, color: '#fff', border: 'none', borderRadius: '10px',
        padding: '14px 30px', fontSize: '15px', fontWeight: 800,
        cursor: enCours ? 'wait' : 'pointer', opacity: enCours ? 0.7 : 1,
        boxShadow: '0 8px 20px rgba(232, 165, 84, 0.35)',
      }}
    >
      <FontAwesomeIcon icon={faMobileScreen} style={{ marginRight: '10px' }} />
      {enCours ? 'Redirection...' : `Acheter le pack${prix ? ` — ${Number(prix).toLocaleString('fr-FR')} FCFA` : ''}`}
    </button>
  );
}
