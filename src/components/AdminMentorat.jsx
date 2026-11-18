import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';

const ACCENT = '#C45C7A';
const MUTED = '#76656d';

export default function AdminMentorat() {
  const [sessions, setSessions] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [selectedMentors, setSelectedMentors] = useState({});
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async (silencieux = false) => {
    if (!silencieux) setLoading(true);
    setError('');
    const results = await Promise.allSettled([
      api.get('/admin/mentorat/demandes'), api.get('/mentors'), api.get('/admin/sessions'),
    ]);
    if (results[0].status === 'fulfilled') setDemandes(results[0].value.data);
    if (results[1].status === 'fulfilled') setMentors(results[1].value.data);
    if (results[2].status === 'fulfilled') setSessions(results[2].value.data);
    const failed = results.find((result) => result.status === 'rejected');
    if (failed) setError(failed.reason?.response?.data?.message || 'Impossible de charger les demandes de mentorat.');
    if (!silencieux) setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    const refresh = setInterval(() => { void load(true); }, 20000);
    return () => { clearTimeout(timer); clearInterval(refresh); };
  }, [load]);

  const attribuer = async (demande) => {
    const mentorId = selectedMentors[demande.id] || demande.mentor?.id;
    const message = (messages[demande.id] ?? demande.message_suivi ?? '').trim();
    if (!mentorId || !message) {
      setError('Choisissez une mentor et écrivez le message de suivi à lui transmettre.');
      return;
    }
    setBusyId(demande.id); setError(''); setNotice('');
    try {
      const { data } = await api.put(`/admin/mentorat/demandes/${demande.id}`, { mentor_id: Number(mentorId), message });
      setNotice(data.message); await load(true);
    } catch (e) { setError(e.response?.data?.message || 'Impossible d’attribuer la mentor.'); }
    finally { setBusyId(null); }
  };

  const updateSession = async (session) => {
    setBusyId(`session-${session.id}`); setError(''); setNotice('');
    try {
      await api.put(`/admin/sessions/${session.id}`, {
        statut: session.statut, notes: session.notes, lien_reunion: session.lien_reunion,
      });
      setNotice('Session mise à jour.'); await load(true);
    } catch (e) { setError(e.response?.data?.message || 'La mise à jour de la session a échoué.'); }
    finally { setBusyId(null); }
  };

  const removeSession = async (session) => {
    if (!window.confirm(`Supprimer la session de ${session.apprenant_nom || 'cette apprenante'} ?`)) return;
    setBusyId(`session-${session.id}`); setError(''); setNotice('');
    try { await api.delete(`/admin/sessions/${session.id}`); setNotice('Session supprimée.'); await load(true); }
    catch (e) { setError(e.response?.data?.message || 'La suppression a échoué.'); }
    finally { setBusyId(null); }
  };

  return <section style={{ maxWidth: 1000 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, marginBottom: 18 }}>
      <p style={{ color: MUTED, margin: 0 }}>Attribuez chaque demande à une mentor et envoyez-lui les consignes de suivi de l’apprenante.</p>
      <button type="button" onClick={() => load()} style={button}>Actualiser</button>
    </div>
    {error && <p role="alert" style={noticeStyle('#b42318', '#fff1f0')}>{error}</p>}
    {notice && <p role="status" style={noticeStyle('#16703b', '#effaf3')}>{notice}</p>}

    <h3 style={heading}>Demandes de suivi par parcours</h3>
    {loading ? <p>Chargement des demandes…</p> : demandes.length === 0 ? <p style={muted}>Aucune demande pour le moment. Les demandes seront créées lors du choix d’un parcours.</p> :
      <div style={{ display: 'grid', gap: 14 }}>{demandes.map((d) => <article key={d.id} style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          <div>
            <strong>{d.apprenante?.nom || 'Apprenante'} · {d.parcours?.titre || 'Parcours'}</strong>
            <div style={muted}>{d.apprenante?.email} · Demande du {formatDate(d.created_at)}</div>
          </div>
          <span style={statusBadge(d.statut)}>{statusLabel(d.statut)}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) minmax(260px, 2fr)', gap: 12 }}>
          <label style={label}>Choisir une mentor
            <select value={selectedMentors[d.id] ?? d.mentor?.id ?? ''} onChange={(e) => setSelectedMentors({ ...selectedMentors, [d.id]: e.target.value })} style={field}>
              <option value="">Sélectionner dans la liste</option>
              {mentors.map((m) => <option key={m.id} value={m.id}>{m.nom}{m.niveau ? ` · ${m.niveau}` : ''}</option>)}
            </select>
          </label>
          <label style={label}>Message de suivi à la mentor
            <textarea rows="3" maxLength="2000" value={messages[d.id] ?? d.message_suivi ?? ''} onChange={(e) => setMessages({ ...messages, [d.id]: e.target.value })} placeholder={`Bonjour, merci de prendre en charge le suivi de ${d.apprenante?.nom || 'cette apprenante'} sur le parcours ${d.parcours?.titre || ''}.`} style={{ ...field, resize: 'vertical' }} />
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button type="button" disabled={busyId === d.id || mentors.length === 0} onClick={() => attribuer(d)} style={{ ...button, background: ACCENT, color: '#fff', opacity: busyId === d.id || !mentors.length ? .6 : 1 }}>
            {busyId === d.id ? 'Envoi…' : d.mentor ? 'Mettre à jour et renvoyer' : 'Attribuer et envoyer le message'}
          </button>
        </div>
      </article>)}</div>}

    <h3 style={{ ...heading, marginTop: 32 }}>Sessions planifiées</h3>
    {loading ? <p>Chargement des sessions…</p> : sessions.length === 0 ? <p style={muted}>Aucune session planifiée.</p> :
      <div style={{ display: 'grid', gap: 14 }}>{sessions.map((s) => <SessionCard key={s.id} session={s} busy={busyId === `session-${s.id}`} onSave={updateSession} onDelete={removeSession} />)}</div>}
  </section>;
}

function SessionCard({ session, busy, onSave, onDelete }) {
  const [draft, setDraft] = useState({ ...session, notes: session.notes || '', lien_reunion: session.lien_reunion || '' });
  return <article style={card}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
      <div><strong>{session.apprenant_nom || 'Apprenante'} avec {session.mentor_nom || 'Mentor'}</strong>
        <div style={muted}>{session.user?.email || ''}</div>
        <div style={muted}>{session.date_session ? new Date(session.date_session).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : 'Date à confirmer'} · {session.type || 'individuel'} · {statusLabel(session.statut)}</div>
      </div>
      <button type="button" disabled={busy} onClick={() => onDelete(session)} style={{ ...button, color: '#b42318', borderColor: '#f4c7c3' }}>Supprimer</button>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <label style={label}>Statut<select value={draft.statut} onChange={(e) => setDraft({ ...draft, statut: e.target.value })} style={field}><option value="en_attente">À confirmer</option><option value="confirmee">Confirmée</option><option value="refusee">Refusée</option><option value="annulee">Annulée</option><option value="réservé">Réservée (ancienne)</option><option value="terminee">Terminée</option></select></label>
      <label style={label}>Lien de réunion<input type="url" value={draft.lien_reunion} onChange={(e) => setDraft({ ...draft, lien_reunion: e.target.value })} style={field} /></label>
      <label style={label}>Notes<textarea rows="2" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} style={field} /></label>
    </div>
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
      <button type="button" disabled={busy} onClick={() => onSave(draft)} style={{ ...button, background: ACCENT, color: '#fff' }}>{busy ? 'Enregistrement…' : 'Enregistrer la session'}</button>
    </div>
  </article>;
}

const card = { background: '#fff', border: '1px solid #EDE3E7', borderRadius: 10, padding: 18 };
const field = { display: 'block', width: '100%', border: '1px solid #EDE3E7', borderRadius: 7, padding: '9px 10px', marginTop: 5, font: 'inherit', background: '#fff' };
const label = { display: 'block', color: '#6D2E46', fontSize: 12, fontWeight: 700 };
const button = { border: `1px solid ${ACCENT}`, borderRadius: 7, padding: '9px 12px', color: ACCENT, background: '#fff', cursor: 'pointer', fontWeight: 700 };
const heading = { color: '#2B1B24', margin: '0 0 14px', fontSize: 17 };
const muted = { color: MUTED, fontSize: 13, marginTop: 5, lineHeight: 1.5 };
const noticeStyle = (color, background) => ({ color, background, borderRadius: 9, padding: '11px 14px', margin: '0 0 14px', fontSize: 14 });
const statusLabel = (status) => ({ en_attente: 'En attente d’attribution', attribuee: 'Mentor attribuée', en_cours: 'Suivi en cours', terminee: 'Suivi terminé', annulee: 'Annulée', refusee: 'Refusée' }[status] || status || 'En attente');
const statusBadge = (status) => ({ display: 'inline-flex', alignItems: 'center', height: 28, borderRadius: 99, padding: '0 11px', background: status === 'en_attente' ? '#fff5e5' : '#effaf3', color: status === 'en_attente' ? '#8a5a00' : '#16703b', fontSize: 12, fontWeight: 700 });
const formatDate = (value) => value ? new Date(value).toLocaleDateString('fr-FR', { dateStyle: 'medium' }) : '—';
