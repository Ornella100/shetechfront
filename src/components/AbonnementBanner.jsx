import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation, faCreditCard } from '@fortawesome/free-solid-svg-icons';
import { useAbonnementStatut } from '../hooks/useAbonnement';

const GOLD = '#E8A554';

// Bannière affichée tant que le pack trois parcours n'a pas été acheté.
export default function AbonnementBanner() {
  const { data: statut } = useAbonnementStatut();
  if (!statut || statut.acces) return null;

  return (
    <div style={{
      background: '#fffbeb',
      borderBottom: `1px solid ${GOLD}`,
      padding: '10px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap',
    }}>
      <FontAwesomeIcon icon={faTriangleExclamation} style={{ color: GOLD }} />
      <span style={{ fontSize: '13px', color: '#78350f', fontWeight: 600 }}>
        Paie une fois 150 000 FCFA pour choisir jusqu’à trois parcours et commencer les cours.
      </span>
      <Link
        to="/dashboard/abonnement"
        style={{
          background: GOLD, color: '#fff', textDecoration: 'none', borderRadius: '8px',
          padding: '7px 16px', fontSize: '12.5px', fontWeight: 800,
        }}
      >
        <FontAwesomeIcon icon={faCreditCard} style={{ marginRight: '6px' }} />
        Acheter le pack
      </Link>
    </div>
  );
}
