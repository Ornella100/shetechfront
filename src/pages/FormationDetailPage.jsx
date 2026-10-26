import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faListCheck, faAward } from '@fortawesome/free-solid-svg-icons';
import {
  useFormationDetail,
  useFormationProgressionLecons,
  useMarquerLeconComplete,
} from '../hooks/useFormations';
import { miniMdToHtml } from '../lib/miniMd';
import AbonnementGate from '../components/AbonnementGate';

const ACCENT = '#C45C7A';
const GOLD = '#E8A554';

function isYoutube(url = '') {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

function getYoutubeEmbed(url = '') {
  const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

function isVimeo(url = '') {
  return url.includes('vimeo.com');
}

function getVimeoEmbed(url = '') {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? `https://player.vimeo.com/video/${match[1]}` : url;
}

const FILE_ICONS = {
  pdf: '', doc: '', docx: '', txt: '📃',
  png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️',
  zip: '📦', mp3: '🎵', mp4: '',
};

function fileIcon(pj) {
  const ext = (pj.nom || pj.url || '').split('.').pop()?.toLowerCase();
  return FILE_ICONS[pj.type] || FILE_ICONS[ext] || '';
}

// Icônes affichées dans la mini sidebar selon les ressources de la leçon
function leconIcons(lecon) {
  const icons = [];
  if (lecon.videos?.length) icons.push('');
  if (lecon.contenuTexte) icons.push('');
  if (lecon.audios?.length) icons.push('🎵');
  if (lecon.pieceJointes?.length) icons.push('');
  return icons.length ? icons.join(' ') : '';
}

export default function FormationDetailPage() {
  const { formationId } = useParams();
  const navigate = useNavigate();
  const { data: formation, isLoading, isError } = useFormationDetail(formationId);
  const { data: leconsFaites } = useFormationProgressionLecons(formationId);
  const { mutate: marquerComplete, isPending } = useMarquerLeconComplete(formationId);

  const [openModules, setOpenModules] = useState({});
  const [selectedLeconId, setSelectedLeconId] = useState(null);

  // Liste plate ordonnée de toutes les leçons (pour navigation précédent/suivant)
  const flat = useMemo(() => {
    if (!formation) return [];
    const arr = [];
    formation.modules?.forEach((module) =>
      module.cours?.forEach((cours) =>
        cours.lecons?.forEach((lecon) => arr.push({ module, cours, lecon }))
      )
    );
    return arr;
  }, [formation]);

  // Première leçon sélectionnée par défaut (valeur dérivée, pas d'effet)
  const effectiveLeconId = selectedLeconId ?? flat[0]?.lecon.id ?? null;

  const doneSet = useMemo(() => new Set(leconsFaites || []), [leconsFaites]);
  const idx = flat.findIndex((x) => x.lecon.id === effectiveLeconId);
  const current = idx >= 0 ? flat[idx] : null;
  const precedente = idx > 0 ? flat[idx - 1] : null;
  const suivante = idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null;

  const selectLecon = (entry) => {
    setSelectedLeconId(entry.lecon.id);
    setOpenModules((o) => ({ ...o, [entry.module.id]: true }));
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#F9F0F3' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="st-spinner" />
          <p style={{ marginTop: '16px', color: '#6b7280', fontSize: '14px' }}>Chargement de la formation...</p>
        </div>
      </div>
    );
  }

  if (isError || !formation) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#F9F0F3' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#ef4444', marginBottom: '16px' }}>Impossible de charger cette formation.</p>
          <button
            onClick={() => navigate('/dashboard/formations')}
            style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}
          >
            ← Retour aux formations
          </button>
        </div>
      </div>
    );
  }

  const nbDone = flat.filter((x) => doneSet.has(x.lecon.id)).length;
  const percent = flat.length ? Math.round((nbDone / flat.length) * 100) : 0;
  const lecon = current?.lecon;
  const hasResources = !!(lecon && (lecon.audios?.length || lecon.pieceJointes?.length || current.cours.quiz));

  return (
    <div className="fd-layout">
      {/* ===== Mini sidebar : modules & leçons ===== */}
      <aside className="fd-sidebar">
        <button
          onClick={() => navigate('/dashboard/formations')}
          style={{ background: 'none', border: 'none', color: ACCENT, fontSize: '13px', fontWeight: 700, cursor: 'pointer', padding: 0, marginBottom: '14px' }}
        >
          ← Formations
        </button>

        <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#1a0f14', margin: '0 0 6px' }}>
          {formation.titre}
        </h2>
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 14px' }}>
          Niveau : {formation.niveau} • {flat.length} leçon{flat.length !== 1 ? 's' : ''}
        </p>

        {/* Barre de progression */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6b7280', marginBottom: '6px' }}>
            <span>Progression</span>
            <span style={{ fontWeight: 700, color: ACCENT }}>{percent}%</span>
          </div>
          <div style={{ height: '6px', background: '#f0e4ea', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${percent}%`, background: ACCENT, borderRadius: '3px', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Quiz final (85 %) & certificat de la formation */}
        <div style={{ display: 'grid', gap: '8px', marginBottom: '20px' }}>
          <button
            onClick={() => navigate(`/dashboard/formations/${formationId}/quiz-final`)}
            style={{
              width: '100%', background: '#fff', color: ACCENT, border: `1.5px solid ${ACCENT}`,
              borderRadius: '9px', padding: '10px', fontSize: '12.5px', fontWeight: 800, cursor: 'pointer',
            }}
          >
            <FontAwesomeIcon icon={faListCheck} style={{ marginRight: '8px' }} />
            Quiz final (85 %)
          </button>
          <button
            onClick={() => navigate(`/dashboard/formations/${formationId}/certificat`)}
            style={{
              width: '100%', background: '#fff', color: GOLD, border: `1.5px solid ${GOLD}`,
              borderRadius: '9px', padding: '10px', fontSize: '12.5px', fontWeight: 800, cursor: 'pointer',
            }}
          >
            <FontAwesomeIcon icon={faAward} style={{ marginRight: '8px' }} />
            Mon certificat
          </button>
        </div>

        {/* Modules */}
        {formation.modules?.map((module) => {
          // Ouvert si togglé explicitement, sinon ouvert par défaut quand il contient la leçon courante
          const containsCurrent = module.id === current?.module.id;
          const open = module.id in openModules ? !!openModules[module.id] : containsCurrent;
          const moduleLecons = module.cours?.reduce((a, c) => a + (c.lecons?.length || 0), 0) || 0;
          return (
            <div key={module.id} style={{ marginBottom: '10px' }}>
              <button
                onClick={() => setOpenModules((o) => ({ ...o, [module.id]: !open }))}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '11px 12px',
                  background: open ? (module.couleur || ACCENT) : '#faf5f7',
                  color: open ? '#fff' : '#1a0f14',
                  border: '1px solid #f0e4ea',
                  borderRadius: '9px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: 700,
                  fontSize: '13px',
                  transition: 'all 0.25s ease',
                }}
              >
                <span style={{ fontSize: '16px' }}>{module.icone || '📚'}</span>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {module.titre}
                </span>
                <span style={{ fontSize: '10px', opacity: 0.75 }}>{moduleLecons}</span>
                <span style={{ fontSize: '11px', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.25s ease' }}>▶</span>
              </button>

              {open && (
                <div className="fd-module-lecons" style={{ padding: '8px 0 4px 8px' }}>
                  {module.cours?.map((cours) => (
                    <div key={cours.id} style={{ marginBottom: '8px' }}>
                      <p style={{ fontSize: '10px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '6px 4px' }}>
                        {cours.titre}
                      </p>
                      {cours.lecons?.map((l) => {
                        const active = l.id === effectiveLeconId;
                        const done = doneSet.has(l.id);
                        return (
                          <button
                            key={l.id}
                            onClick={() => selectLecon({ module, cours, lecon: l })}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '9px 10px',
                              marginBottom: '3px',
                              background: active ? 'rgba(196, 92, 122, 0.12)' : 'transparent',
                              border: 'none',
                              borderLeft: active ? `3px solid ${ACCENT}` : '3px solid transparent',
                              borderRadius: '0 7px 7px 0',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: '12.5px',
                              color: active ? ACCENT : '#374151',
                              fontWeight: active ? 700 : 500,
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <span style={{ fontSize: '11px', flex: 'none' }}>{leconIcons(l)}</span>
                            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {l.titre}
                            </span>
                            {done && <span style={{ color: '#16a34a', flex: 'none', fontSize: '12px' }}>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </aside>

      {/* ===== Contenu de la leçon (affichage adaptatif selon les ressources) ===== */}
      <main className="fd-content">
        {!lecon ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>👈</div>
            <p>Sélectionnez une leçon dans le menu pour commencer.</p>
          </div>
        ) : formation.accesRestreint || lecon.verrouille ? (
          <AbonnementGate />
        ) : (
          <div className="fd-pane" key={lecon.id} style={{ maxWidth: 780, margin: '0 auto' }}>
            {/* Fil d'Ariane */}
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 14px' }}>
              {current.module.titre} <span style={{ margin: '0 4px' }}>›</span> {current.cours.titre}
            </p>

            {/* En-tête */}
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1a0f14', margin: '0 0 10px' }}>
              {lecon.titre}
            </h1>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
              {lecon.dureeMinutes > 0 && (
                <span style={{ fontSize: '12px', background: '#fff', border: '1px solid #f0e4ea', padding: '5px 12px', borderRadius: '999px', color: '#6b7280' }}>
                   {lecon.dureeMinutes} min
                </span>
              )}
              {doneSet.has(lecon.id) && (
                <span style={{ fontSize: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '5px 12px', borderRadius: '999px', color: '#16a34a', fontWeight: 700 }}>
                  ✓ Complétée
                </span>
              )}
            </div>

            {lecon.description && (
              <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: 1.7, margin: '0 0 22px' }}>
                {lecon.description}
              </p>
            )}

            {/* Vidéo principale */}
            {lecon.videos?.[0] && <VideoBlock video={lecon.videos[0]} principal />}

            {/* Contenu texte en mini markdown */}
            {lecon.contenuTexte && (
              <div
                style={{ background: '#fff', border: '1px solid #f0e4ea', borderRadius: '12px', padding: '26px 28px', marginBottom: '22px' }}
              >
                <div className="fd-prose" dangerouslySetInnerHTML={{ __html: miniMdToHtml(lecon.contenuTexte) }} />
              </div>
            )}

            {/* Autres vidéos */}
            {lecon.videos?.slice(1).map((video) => (
              <VideoBlock key={video.id} video={video} />
            ))}

            {/* Marquer comme terminée */}
            <div style={{ margin: '30px 0', textAlign: 'center' }}>
              {doneSet.has(lecon.id) ? (
                <p style={{ color: '#16a34a', fontWeight: 700, fontSize: '15px' }}>🎉 Leçon complétée !</p>
              ) : (
                <button
                  onClick={() => marquerComplete(lecon.id)}
                  disabled={isPending}
                  style={{
                    background: ACCENT,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '14px 32px',
                    fontSize: '15px',
                    fontWeight: 800,
                    cursor: isPending ? 'wait' : 'pointer',
                    opacity: isPending ? 0.7 : 1,
                    boxShadow: '0 8px 20px rgba(196, 92, 122, 0.3)',
                  }}
                >
                  {isPending ? 'Enregistrement...' : '✓ Marquer comme terminée'}
                </button>
              )}
            </div>

            {/* Navigation précédent / suivant */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '30px' }}>
              {precedente ? (
                <NavCard label="Précédent" titre={precedente.lecon.titre} onClick={() => selectLecon(precedente)} />
              ) : <div />}
              {suivante ? (
                <NavCard label="Suivant" titre={suivante.lecon.titre} right onClick={() => selectLecon(suivante)} />
              ) : (
                <div style={{ textAlign: 'right', alignSelf: 'center', color: '#9ca3af', fontSize: '13px' }}>
                  🏁 Fin de la formation
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ===== Panneau ressources de la leçon ===== */}
      {lecon && (
        <aside className="fd-resources" key={`res-${lecon.id}`}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1a0f14', margin: '0 0 18px' }}>
             Ressources de la leçon
          </h3>

          {!hasResources && (
            <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.6 }}>
              Aucune ressource supplémentaire pour cette leçon.
            </p>
          )}

          {lecon.audios?.length > 0 && (
            <div style={{ marginBottom: '22px' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
                🎵 Audios
              </p>
              {lecon.audios.map((audio) => (
                <div key={audio.id} style={{ background: '#faf5f7', border: '1px solid #f0e4ea', borderRadius: '10px', padding: '12px', marginBottom: '10px' }}>
                  {audio.titre && <p style={{ fontSize: '12px', fontWeight: 700, margin: '0 0 8px', color: '#1a0f14' }}>{audio.titre}</p>}
                  <audio controls style={{ width: '100%', height: '34px' }} src={audio.url} />
                </div>
              ))}
            </div>
          )}

          {lecon.pieceJointes?.length > 0 && (
            <div style={{ marginBottom: '22px' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
                 Fichiers
              </p>
              {lecon.pieceJointes.map((pj) => (
                <a
                  key={pj.id}
                  href={pj.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: '#faf5f7',
                    border: '1px solid #f0e4ea',
                    borderRadius: '10px',
                    padding: '11px 12px',
                    marginBottom: '8px',
                    textDecoration: 'none',
                    transition: 'border-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#f0e4ea'; }}
                >
                  <span style={{ fontSize: '18px' }}>{fileIcon(pj)}</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: '12.5px', fontWeight: 600, color: '#1a0f14', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pj.nom}
                  </span>
                  <span style={{ color: ACCENT, fontWeight: 800 }}>↓</span>
                </a>
              ))}
            </div>
          )}

          {current.cours.quiz && (
            <div style={{ background: `linear-gradient(135deg, ${ACCENT}, #a34462)`, borderRadius: '12px', padding: '18px', color: '#fff' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px', opacity: 0.85 }}>
                ❓ Quiz du cours
              </p>
              <p style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 6px' }}>{current.cours.quiz.titre}</p>
              {current.cours.quiz.questions?.length > 0 && (
                <p style={{ fontSize: '12px', margin: '0 0 12px', opacity: 0.85 }}>
                  {current.cours.quiz.questions.length} question{current.cours.quiz.questions.length !== 1 ? 's' : ''}
                </p>
              )}
              <p style={{ fontSize: '11.5px', margin: 0, opacity: 0.8 }}>
                Terminez les leçons du cours pour valider vos acquis.
              </p>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}

function VideoBlock({ video, principal = false }) {
  const url = video.url || '';
  const embed = video.type === 'embed' || isYoutube(url) || isVimeo(url);
  const embedUrl = isYoutube(url) ? getYoutubeEmbed(url) : isVimeo(url) ? getVimeoEmbed(url) : url;
  const isFile = /\.(mp4|webm|ogg)(\?|$)/i.test(url);

  return (
    <div style={{ marginBottom: '22px' }}>
      {video.titre && (
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#1a0f14', margin: '0 0 8px' }}>
          {video.titre}
        </p>
      )}
      {embed ? (
        <div style={{ aspectRatio: '16 / 9', borderRadius: '12px', overflow: 'hidden', background: '#000', boxShadow: principal ? '0 12px 30px rgba(26, 15, 20, 0.18)' : 'none' }}>
          <iframe
            src={embedUrl}
            title={video.titre || 'Vidéo'}
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : isFile ? (
        <video src={url} controls style={{ width: '100%', borderRadius: '12px', maxHeight: '480px', background: '#000' }} />
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: ACCENT, fontWeight: 700, fontSize: '14px' }}>
          Voir la vidéo ↗
        </a>
      )}
    </div>
  );
}

function NavCard({ label, titre, right = false, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: right ? 'flex-end' : 'flex-start',
        gap: '3px',
        background: '#fff',
        border: '1px solid #f0e4ea',
        borderRadius: '10px',
        padding: '13px 16px',
        cursor: 'pointer',
        textAlign: right ? 'right' : 'left',
        transition: 'border-color 0.15s ease',
        minWidth: 0,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#f0e4ea'; }}
    >
      <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700 }}>
        {right ? `${label} →` : `← ${label}`}
      </span>
      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1a0f14', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {titre}
      </span>
    </button>
  );
}
