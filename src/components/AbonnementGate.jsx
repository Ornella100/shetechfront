import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faCrown } from '@fortawesome/free-solid-svg-icons';

const ACCENT = '#C45C7A';
const GOLD = '#E8A554';

// Écran affiché à la place du contenu quand l'accès a expiré (402 ABONNEMENT_REQUIS).
export default function AbonnementGate({ message }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #f0e4ea', borderRadius: '16px',
      padding: '56px 32px', textAlign: 'center', maxWidth: 560, margin: '40px auto',
    }}>
      <div style={{
        width: '72px', height: '72px', borderRadius: '50%',
        background: 'rgba(196, 92, 122, 0.1)', display: 'grid', placeItems: 'center', margin: '0 auto 20px',
      }}>
        <FontAwesomeIcon icon={faLock} style={{ fontSize: '28px', color: ACCENT }} />
      </div>
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1a0f14', margin: '0 0 10px' }}>
        Contenu réservé aux abonnées
      </h2>
      <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.7, margin: '0 0 24px' }}>
        {message || 'Votre mois d\'essai gratuit est terminé. Abonnez-vous pour continuer à suivre vos formations et débloquer vos certificats.'}
      </p>
      <Link
        to="/dashboard/abonnement"
        style={{
          display: 'inline-block', background: GOLD, color: '#fff', textDecoration: 'none',
          borderRadius: '10px', padding: '13px 28px', fontSize: '15px', fontWeight: 800,
          boxShadow: '0 8px 20px rgba(232, 165, 84, 0.35)',
        }}
      >
        <FontAwesomeIcon icon={faCrown} style={{ marginRight: '8px' }} />
        Découvrir l'abonnement
      </Link>
    </div>
  );
}
