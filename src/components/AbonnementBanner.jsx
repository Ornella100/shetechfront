import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation, faCrown } from '@fortawesome/free-solid-svg-icons';
import { useAbonnementStatut } from '../hooks/useAbonnement';

const GOLD = '#E8A554';

// Bannière affichée dans le layout : essai qui se termine bientôt ou accès expiré.
export default function AbonnementBanner() {
  const { data: statut } = useAbonnementStatut();
  const [now] = useState(() => Date.now());
  if (!statut || statut.type === 'staff' || statut.type === 'abonnement') return null;
  const joursRestants = statut.trialEndsAt
    ? Math.ceil((new Date(statut.trialEndsAt).getTime() - now) / (24 * 60 * 60 * 1000))
    : 0;

  const expire = !statut.acces;
  if (!expire && joursRestants > 7) return null;

  return (
    <div style={{
      background: expire ? '#fef2f2' : '#fffbeb',
      borderBottom: `1px solid ${expire ? '#fecaca' : GOLD}`,
      padding: '10px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap',
    }}>
      <FontAwesomeIcon icon={faTriangleExclamation} style={{ color: expire ? '#dc2626' : GOLD }} />
      <span style={{ fontSize: '13px', color: expire ? '#7f1d1d' : '#78350f', fontWeight: 600 }}>
        {expire
          ? 'Votre période d\'essai gratuite est terminée. Abonnez-vous pour continuer à suivre les formations.'
          : `Votre essai gratuit se termine dans ${joursRestants} jour${joursRestants > 1 ? 's' : ''}.`}
      </span>
      <Link
        to="/dashboard/abonnement"
        style={{
          background: GOLD, color: '#fff', textDecoration: 'none', borderRadius: '8px',
          padding: '7px 16px', fontSize: '12.5px', fontWeight: 800,
        }}
      >
        <FontAwesomeIcon icon={faCrown} style={{ marginRight: '6px' }} />
        S'abonner
      </Link>
    </div>
  );
}
