import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleXmark, faRotateRight, faPaperPlane, faAward } from '@fortawesome/free-solid-svg-icons';
import { useQuizFinalQuestions, useSoumettreQuizFinal } from '../hooks/useQuizFinal';

const ACCENT = '#C45C7A';
const GOLD = '#E8A554';

// Déroule un quiz final (formation 85 % ou parcours 100 %).
// type: "formations" | "parcours" — onReussi(resultat) appelé après un succès.
export default function QuizRunner({ type, id, onReussi }) {
  const { data, isLoading, isError } = useQuizFinalQuestions(type, id);
  const { mutate: soumettre, isPending, data: resultat, reset, error } = useSoumettreQuizFinal(type, id);
  const [reponses, setReponses] = useState({});

  const questions = data?.questions || [];
  const seuil = data?.seuil ?? 85;

  if (isLoading) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center' }}>
        <div className="st-spinner" />
        <p style={{ marginTop: '14px', color: '#6b7280', fontSize: '13px' }}>Chargement du quiz...</p>
      </div>
    );
  }

  if (isError || questions.length === 0) {
    return (
      <p style={{ padding: '32px 0', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
        Ce quiz n'est pas encore disponible.
      </p>
    );
  }

  // ===== Écran de résultat =====
  if (resultat) {
    const ok = resultat.reussi;
    return (
      <div>
        <div style={{
          background: ok ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${ok ? '#bbf7d0' : '#fecaca'}`,
          borderRadius: '14px', padding: '28px', textAlign: 'center', marginBottom: '24px',
        }}>
          <FontAwesomeIcon icon={ok ? faAward : faCircleXmark} style={{ fontSize: '40px', color: ok ? '#16a34a' : '#dc2626', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1a0f14', margin: '0 0 6px' }}>
            {ok ? 'Félicitations !' : 'Pas encore...'}
          </h3>
          <p style={{ fontSize: '15px', color: '#374151', margin: '0 0 4px' }}>
            Score : <strong>{resultat.score}/100</strong> ({resultat.correct}/{resultat.total} bonnes réponses)
          </p>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{resultat.message}</p>
          <div style={{ marginTop: '18px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {!ok && (
              <button
                onClick={() => { reset(); setReponses({}); }}
                style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: '9px', padding: '11px 22px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
              >
                <FontAwesomeIcon icon={faRotateRight} style={{ marginRight: '8px' }} />
                Réessayer
              </button>
            )}
            {ok && onReussi && (
              <button
                onClick={() => onReussi(resultat)}
                style={{ background: GOLD, color: '#fff', border: 'none', borderRadius: '9px', padding: '11px 22px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
              >
                <FontAwesomeIcon icon={faAward} style={{ marginRight: '8px' }} />
                Voir mon certificat
              </button>
            )}
          </div>
        </div>

        {/* Correction détaillée */}
        <div style={{ display: 'grid', gap: '12px' }}>
          {resultat.details?.map((d, i) => (
            <div key={d.id} style={{
              background: '#fff', border: `1px solid ${d.correct ? '#bbf7d0' : '#fecaca'}`,
              borderRadius: '10px', padding: '14px 16px',
            }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#1a0f14', margin: '0 0 6px' }}>
                <FontAwesomeIcon icon={d.correct ? faCircleCheck : faCircleXmark} style={{ color: d.correct ? '#16a34a' : '#dc2626', marginRight: '8px' }} />
                {i + 1}. {d.question}
              </p>
              {d.explication && (
                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, paddingLeft: '22px' }}>{d.explication}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ===== Questionnaire =====
  const toutRepondu = questions.every(q => reponses[q.id] !== undefined);

  return (
    <div>
      <div style={{ display: 'grid', gap: '18px', marginBottom: '26px' }}>
        {questions.map((q, i) => (
          <div key={q.id} style={{ background: '#fff', border: '1px solid #f0e4ea', borderRadius: '12px', padding: '18px 20px' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#1a0f14', margin: '0 0 12px' }}>
              {i + 1}. {q.question}
            </p>
            <div style={{ display: 'grid', gap: '8px' }}>
              {q.options.map((opt, oi) => {
                const choisi = reponses[q.id] === oi;
                return (
                  <button
                    key={oi}
                    onClick={() => setReponses(r => ({ ...r, [q.id]: oi }))}
                    style={{
                      textAlign: 'left', padding: '11px 14px', borderRadius: '9px',
                      border: `1.5px solid ${choisi ? ACCENT : '#e5e7eb'}`,
                      background: choisi ? 'rgba(196, 92, 122, 0.08)' : '#fff',
                      color: choisi ? ACCENT : '#374151',
                      fontWeight: choisi ? 700 : 500, fontSize: '13.5px', cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {String.fromCharCode(65 + oi)}. {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p style={{ color: '#dc2626', fontSize: '13px', textAlign: 'center', marginBottom: '14px' }}>
          {error.response?.data?.message || 'Erreur lors de la soumission.'}
        </p>
      )}

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
          {Object.keys(reponses).length}/{questions.length} réponses — seuil de réussite : {seuil}%
        </p>
        <button
          onClick={() => soumettre(reponses)}
          disabled={!toutRepondu || isPending}
          style={{
            background: toutRepondu ? ACCENT : '#e5e7eb',
            color: toutRepondu ? '#fff' : '#9ca3af',
            border: 'none', borderRadius: '10px', padding: '14px 32px',
            fontSize: '15px', fontWeight: 800,
            cursor: toutRepondu && !isPending ? 'pointer' : 'not-allowed',
            boxShadow: toutRepondu ? '0 8px 20px rgba(196, 92, 122, 0.3)' : 'none',
          }}
        >
          <FontAwesomeIcon icon={faPaperPlane} style={{ marginRight: '8px' }} />
          {isPending ? 'Correction...' : 'Valider mes réponses'}
        </button>
      </div>
    </div>
  );
}
