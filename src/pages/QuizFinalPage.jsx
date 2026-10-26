import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullseye, faListCheck } from '@fortawesome/free-solid-svg-icons';
import api from '../lib/api';
import QuizRunner from '../components/QuizRunner';
import AbonnementGate from '../components/AbonnementGate';
import { useQuizFinalStatus } from '../hooks/useQuizFinal';
import { useAbonnementStatut } from '../hooks/useAbonnement';

const ACCENT = '#C45C7A';
const BG = '#F9F0F3';
const GOLD = '#E8A554';

// Page de quiz final, partagée entre formation (85 %) et parcours (100 %).
export function QuizFormationPage() {
  const { formationId } = useParams();
  return <QuizFinalPage type="formations" id={formationId} />;
}

export function QuizParcoursPage() {
  const { parcoursId } = useParams();
  return <QuizFinalPage type="parcours" id={parcoursId} />;
}

function QuizFinalPage({ type, id }) {
  const navigate = useNavigate();
  const estParcours = type === 'parcours';

  const { data: cible } = useQuery({
    queryKey: [type, id, 'titre'],
    queryFn: () => api.get(`/${type}/${id}`).then(r => r.data),
    enabled: !!id,
  });
  const { data: status } = useQuizFinalStatus(type, id);
  const { data: abonnement } = useAbonnementStatut();

  const seuil = status?.seuil ?? (estParcours ? 100 : 85);
  const certificatUrl = `/dashboard/${type === 'formations' ? 'formations' : 'parcours'}/${id}/certificat`;

  return (
    <div style={{ background: BG, minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: ACCENT, fontSize: '13px', fontWeight: 700, cursor: 'pointer', padding: 0, marginBottom: '18px' }}
        >
          ← Retour
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1a0f14', margin: 0 }}>
            <FontAwesomeIcon icon={faListCheck} style={{ color: ACCENT, marginRight: '12px' }} />
            {estParcours ? 'Quiz final du parcours' : 'Quiz final de la formation'}
          </h1>
          <span style={{
            background: estParcours ? GOLD : ACCENT, color: '#fff', borderRadius: '999px',
            padding: '5px 14px', fontSize: '12.5px', fontWeight: 800,
          }}>
            <FontAwesomeIcon icon={faBullseye} style={{ marginRight: '6px' }} />
            Réussite : {seuil}%
          </span>
        </div>
        {cible?.titre && (
          <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 8px' }}>{cible.titre}</p>
        )}
        <p style={{ color: '#9ca3af', fontSize: '13px', margin: '0 0 28px' }}>
          {estParcours
            ? 'Un sans-faute (100 %) débloque votre Grand Certificat de fin de parcours.'
            : 'Un score de 85 % ou plus débloque le certificat de cette formation.'}
          {status?.tentatives > 0 && ` • ${status.tentatives} tentative${status.tentatives > 1 ? 's' : ''} — meilleur score : ${status.score ?? 0}/100`}
        </p>

        {abonnement && !abonnement.acces ? (
          <AbonnementGate />
        ) : estParcours && status && status.formations_manquantes?.length > 0 ? (
          <div style={{ background: '#fffbeb', border: `1px solid ${GOLD}`, borderRadius: '12px', padding: '22px 24px' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#78350f', margin: '0 0 10px' }}>
              Avant de passer ce quiz, réussissez le quiz final de chaque formation du parcours :
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#78350f', fontSize: '13.5px', lineHeight: 2 }}>
              {status.formations_manquantes.map(f => (
                <li key={f.id}>
                  <button
                    onClick={() => navigate(`/dashboard/formations/${f.id}/quiz-final`)}
                    style={{ background: 'none', border: 'none', color: ACCENT, fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: '13.5px', textDecoration: 'underline' }}
                  >
                    {f.titre}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : estParcours && status && !status.inscrite ? (
          <div style={{ background: '#fff', border: '1px solid #f0e4ea', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px' }}>
              Inscrivez-vous à ce parcours pour passer son quiz final.
            </p>
            <button
              onClick={() => navigate('/dashboard/formations')}
              style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: '9px', padding: '11px 22px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
            >
              Voir les parcours
            </button>
          </div>
        ) : (
          <QuizRunner type={type} id={id} onReussi={() => navigate(certificatUrl)} />
        )}
      </div>
    </div>
  );
}
