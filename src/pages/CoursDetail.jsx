import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import AbonnementGate from '../components/AbonnementGate';

const ACCENT = '#C45C7A';

export default function CoursDetail() {
  const { formationId, moduleId, coursId, leconId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formation, setFormation] = useState(null);
  const [module, setModule] = useState(null);
  const [cours, setCours] = useState(null);
  const [lecon, setLecon] = useState(null);
  const [activeTab, setActiveTab] = useState('content');
  const [error, setError] = useState('');
  const [abonnementRequis, setAbonnementRequis] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [formRes, modRes, courRes, lecRes] = await Promise.all([
          formationId ? api.get(`/formations/${formationId}`) : Promise.resolve(null),
          moduleId ? api.get(`/modules/${moduleId}`) : Promise.resolve(null),
          coursId ? api.get(`/cours/${coursId}`) : Promise.resolve(null),
          leconId ? api.get(`/lecons/${leconId}`) : Promise.resolve(null),
        ]);
        
        if (formRes) setFormation(formRes.data);
        if (modRes) setModule(modRes.data);
        if (courRes) setCours(courRes.data);
        if (lecRes) setLecon(lecRes.data);
      } catch (err) {
        if (err.response?.status === 402) {
          setAbonnementRequis(true);
        } else {
          setError('Erreur lors du chargement des données');
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [formationId, moduleId, coursId, leconId]);

  const handleCompleteLecon = async () => {
    if (!leconId) return;
    try {
      await api.post(`/lecons/${leconId}/complete`, { tempsPasseMinutes: 0 });
      alert('Leçon marquée comme complète!');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
        Chargement...
      </div>
    );
  }

  if (abonnementRequis) {
    return <AbonnementGate />;
  }

  if (error) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#ef4444' }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '24px', fontSize: '14px', color: '#6b7280' }}>
        <span onClick={() => navigate('/dashboard/formations')} style={{ cursor: 'pointer', color: ACCENT }}>
          Formations
        </span>
        {formation && (
          <>
            <span> / {formation.titre}</span>
            {module && <span> / {module.titre}</span>}
            {cours && <span> / {cours.titre}</span>}
            {lecon && <span> / {lecon.titre}</span>}
          </>
        )}
      </div>

      {/* Header */}
      {lecon && (
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>
            {lecon.titre}
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
            {lecon.description}
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', background: '#f3f4f6', padding: '6px 12px', borderRadius: '4px' }}>
              {lecon.type}
            </span>
            {lecon.dureeMinutes > 0 && (
              <span style={{ fontSize: '12px', background: '#f3f4f6', padding: '6px 12px', borderRadius: '4px' }}>
                 {lecon.dureeMinutes} min
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' }}>
        {['content', 'resources', 'quiz'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 16px',
              background: activeTab === tab ? 'transparent' : 'transparent',
              borderBottom: activeTab === tab ? `2px solid ${ACCENT}` : 'transparent',
              color: activeTab === tab ? ACCENT : '#6b7280',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
            }}
          >
            {tab === 'content' && ' Contenu'}
            {tab === 'resources' && ' Ressources'}
            {tab === 'quiz' && '❓ Quiz'}
          </button>
        ))}
      </div>

      {/* Content Tab */}
      {activeTab === 'content' && lecon && (
        <div>
          {lecon.contenuTexte && (
            <div style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              marginBottom: '24px',
            }}>
              <p style={{ color: '#374151', lineHeight: 1.8 }}>
                {lecon.contenuTexte}
              </p>
            </div>
          )}

          {lecon.videos && lecon.videos.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
                📹 Vidéos
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {lecon.videos.map(video => (
                  <div key={video.id} style={{
                    background: '#fff',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}>
                    {video.titre && <p style={{ fontWeight: 600, marginBottom: '8px' }}>{video.titre}</p>}
                    {video.type === 'embed' ? (
                      <iframe
                        width="100%"
                        height="300"
                        src={video.url}
                        title={video.titre || 'Vidéo'}
                        style={{ borderRadius: '4px' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    ) : (
                      <a href={video.url} target="_blank" rel="noopener noreferrer" style={{ color: ACCENT }}>
                        Voir la vidéo
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && lecon && (
        <div>
          {lecon.audios && lecon.audios.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
                🎵 Audios
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {lecon.audios.map(audio => (
                  <div key={audio.id} style={{
                    background: '#fff',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}>
                    {audio.titre && <p style={{ fontWeight: 600, marginBottom: '8px' }}>{audio.titre}</p>}
                    <audio controls style={{ width: '100%' }} src={audio.url} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {lecon.pieceJointes && lecon.pieceJointes.length > 0 && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
                 Fichiers
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {lecon.pieceJointes.map(piece => (
                  <a
                    key={piece.id}
                    href={piece.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#fff',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      textDecoration: 'none',
                      color: ACCENT,
                      fontWeight: 600,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>{piece.nom}</span>
                    <span>↓</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quiz Tab */}
      {activeTab === 'quiz' && cours?.quiz && (
        <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
            {cours.quiz.titre}
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>
            {cours.quiz.description}
          </p>
          <button
            onClick={() => setActiveTab('content')}
            style={{
              background: ACCENT,
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Commencer le quiz
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
        <button
          onClick={handleCompleteLecon}
          style={{
            background: ACCENT,
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          ✓ Marquer comme complète
        </button>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: '#f3f4f6',
            color: '#374151',
            border: '1px solid #e5e7eb',
            padding: '12px 24px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          ← Retour
        </button>
      </div>
    </div>
  );
}
