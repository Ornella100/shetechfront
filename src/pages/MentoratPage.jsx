import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faClock, faRotateRight, faUserGraduate } from '@fortawesome/free-solid-svg-icons';
import api from '../lib/api';
import { useAuth } from '../store/authStore';

const ACCENT = '#C45C7A';
const BG = '#F9F0F3';

export default function MentoratPage() {
  const { user } = useAuth();
  const isMentor = user?.role === 'mentor';
  const [mentors, setMentors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState({ mentor_id: '', date_session: '', type: 'individuel', sujet: '' });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [minimumDate] = useState(() => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16));

  const load = useCallback(async () => {
    setLoading(true); setError('');
    if (isMentor) {
      const [result] = await Promise.allSettled([api.get('/mentor/sessions')]);
      if (result.status === 'fulfilled') setSessions(result.value.data);
      else setError(result.reason?.response?.data?.message || 'Impossible de charger votre agenda.');
    } else {
      const results = await Promise.allSettled([api.get('/mentors'), api.get('/sessions')]);
      if (results[0].status === 'fulfilled') setMentors(results[0].value.data);
      if (results[1].status === 'fulfilled') setSessions(results[1].value.data);
      const failed = results.find((r) => r.status === 'rejected');
      if (failed) setError(failed.reason?.response?.data?.message || 'Impossible de charger les mentors ou vos sessions.');
    }
    setLoading(false);
  }, [isMentor]);

  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const submit = async (e) => {
    e.preventDefault(); setSending(true); setError(''); setNotice('');
    try {
      await api.post('/sessions', { ...form, date_session: new Date(form.date_session).toISOString() });
      setNotice('Votre demande de mentorat a été envoyée.');
      setForm((f) => ({ ...f, date_session: '', sujet: '' }));
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de réserver cette session. Vérifiez les informations et réessayez.');
    } finally { setSending(false); }
  };

  const cancelSession = async (sessionId) => {
    setSending(true); setError(''); setNotice('');
    try { await api.put(`/sessions/${sessionId}/annuler`); setNotice('La session a été annulée.'); await load(); }
    catch (err) { setError(err.response?.data?.message || 'Impossible d’annuler cette session.'); }
    finally { setSending(false); }
  };

  const updateMentorSession = async (sessionId, updates) => {
    setSending(true); setError(''); setNotice('');
    try { await api.put(`/mentor/sessions/${sessionId}`, updates); setNotice('La session a été mise à jour.'); await load(); }
    catch (err) { setError(err.response?.data?.message || 'Impossible de mettre à jour cette session.'); }
    finally { setSending(false); }
  };

  const field = { width: '100%', padding: '11px 12px', border: '1px solid #e8dce2', borderRadius: 9, font: 'inherit', marginTop: 6, background: '#fff' };
  return <main style={{ background: BG, minHeight: '100vh', padding: '32px 24px', color: '#2B1B24' }}>
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div><h1 style={{ margin: 0, fontSize: 30 }}><FontAwesomeIcon icon={faUserGraduate} style={{ color: ACCENT, marginRight: 12 }} />Mentorat</h1>
          <p style={{ margin: '7px 0 0', color: '#74636b' }}>{isMentor ? 'Consultez les demandes qui vous sont attribuées et gérez leur suivi.' : 'Choisissez une mentor et proposez un créneau d’accompagnement.'}</p></div>
        <button type="button" onClick={load} style={button}><FontAwesomeIcon icon={faRotateRight} /> Actualiser</button>
      </header>
      {error && <p role="alert" style={noticeStyle('#b42318', '#fff1f0')}>{error}</p>}
      {notice && <p role="status" style={noticeStyle('#16703b', '#effaf3')}>{notice}</p>}

      {!isMentor && <section style={card}>
        <h2 style={h2}>Demander une session</h2>
        <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px 18px' }}>
          <label style={label}>Mentor
            <select required value={form.mentor_id} onChange={(e) => setForm({ ...form, mentor_id: e.target.value })} style={field}>
              <option value="">{loading ? 'Chargement…' : 'Sélectionnez une mentor'}</option>
              {mentors.map((m) => <option key={m.id} value={m.id}>{m.nom}{m.niveau ? ` · Niveau ${m.niveau}` : ''}</option>)}
            </select>
          </label>
          <label style={label}>Date et heure
            <input required type="datetime-local" value={form.date_session} min={minimumDate} onChange={(e) => setForm({ ...form, date_session: e.target.value })} style={field} />
          </label>
          <label style={label}>Format
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={field}>
              <option value="individuel">Individuel</option><option value="groupe">En groupe</option>
            </select>
          </label>
          <label style={label}>Sujet de la session
            <input maxLength="180" value={form.sujet} onChange={(e) => setForm({ ...form, sujet: e.target.value })} placeholder="Ex. préparer mon portfolio" style={field} />
          </label>
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="submit" disabled={sending || loading || !mentors.length} style={{ ...button, background: ACCENT, color: '#fff', borderColor: ACCENT, opacity: sending || !mentors.length ? .6 : 1 }}>
              <FontAwesomeIcon icon={faCalendarCheck} /> {sending ? 'Envoi…' : 'Envoyer la demande'}
            </button>
          </div>
        </form>
        {!loading && mentors.length === 0 && <p style={muted}>Aucune mentor n’est disponible pour le moment.</p>}
      </section>}

      <section style={{ ...card, marginTop: 22 }}>
        <h2 style={h2}>{isMentor ? 'Demandes et agenda' : 'Mes sessions'}</h2>
        {loading ? <p style={muted}>Chargement de vos sessions…</p> : sessions.length === 0 ? <p style={muted}>Vous n’avez pas encore de session planifiée.</p> :
          <div style={{ display: 'grid', gap: 10 }}>{sessions.map((s) => isMentor ? <MentorSessionCard key={s.id} session={s} busy={sending} onUpdate={updateMentorSession} /> : <article key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, border: '1px solid #f0e4ea', borderRadius: 10, background: '#fff' }}>
            <div style={{ width: 42, height: 42, flexShrink: 0, borderRadius: 12, display: 'grid', placeItems: 'center', color: ACCENT, background: '#f9f0f3' }}><FontAwesomeIcon icon={faClock} /></div>
            <div style={{ flex: 1 }}><strong>{s.sujet || 'Session de mentorat'}</strong><div style={muted}>Avec {s.mentor_nom || 'votre mentor'} · {s.type || 'individuel'} · {new Date(s.date_session).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</div>{s.lien_reunion && <a href={s.lien_reunion} target="_blank" rel="noreferrer" style={{ color: ACCENT, fontSize: 13 }}>Ouvrir le lien de réunion</a>}</div>
            <span style={badge}>{sessionLabel(s.statut)}</span>
            {['en_attente', 'réservé', 'confirmee'].includes(s.statut) && new Date(s.date_session) > new Date() && <button type="button" disabled={sending} onClick={() => cancelSession(s.id)} style={cancelButton}>Annuler</button>}
          </article>)}</div>}
      </section>
    </div>
  </main>;
}

const card = { background: '#fff', border: '1px solid #f0e4ea', borderRadius: 14, padding: 22 };
const h2 = { fontSize: 20, color: '#2B1B24', margin: '0 0 16px' };
const label = { display: 'block', fontWeight: 650, fontSize: 13 };
const muted = { color: '#76656d', fontSize: 13, lineHeight: 1.5 };
const badge = { display: 'inline-block', background: '#f9f0f3', color: '#C45C7A', borderRadius: 99, padding: '5px 10px', fontSize: 11, fontWeight: 700 };
const button = { display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#fff', color: '#C45C7A', border: '1px solid #C45C7A', borderRadius: 9, fontWeight: 700, cursor: 'pointer' };
const noticeStyle = (color, background) => ({ color, background, borderRadius: 9, padding: '11px 14px', margin: '0 0 14px', fontSize: 14 });
const cancelButton = { border: '1px solid #f0b8b5', background: '#fff1f0', color: '#b42318', borderRadius: 8, padding: '8px 10px', fontWeight: 700, cursor: 'pointer' };
const sessionLabel = (status) => ({ en_attente: 'À confirmer', 'réservé': 'Réservée', confirmee: 'Confirmée', refusee: 'Refusée', annulee: 'Annulée', terminee: 'Terminée', 'terminé': 'Terminée' }[status] || status || 'À confirmer');

function MentorSessionCard({ session, busy, onUpdate }) {
  const [lien, setLien] = useState(session.lien_reunion || '');
  const [notes, setNotes] = useState(session.notes || '');
  const pending = ['en_attente', 'réservé'].includes(session.statut);
  const confirmed = session.statut === 'confirmee';
  const past = new Date(session.date_session) <= new Date();
  return <article style={{ padding: 16, border: '1px solid #f0e4ea', borderRadius: 10, background: '#fff' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
      <div style={{ width: 42, height: 42, flexShrink: 0, borderRadius: 12, display: 'grid', placeItems: 'center', color: ACCENT, background: '#f9f0f3' }}><FontAwesomeIcon icon={faClock} /></div>
      <div style={{ flex: 1 }}><strong>{session.sujet || 'Session de mentorat'}</strong><div style={muted}>Avec {session.apprenant_nom || 'une apprenante'} · {session.type || 'individuel'} · {new Date(session.date_session).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</div><span style={badge}>{sessionLabel(session.statut)}</span></div>
    </div>
    {confirmed && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
      <label style={label}>Lien de réunion<input type="url" value={lien} onChange={(e) => setLien(e.target.value)} style={fieldStyle} placeholder="https://…" /></label>
      <label style={label}>Notes<textarea rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} style={fieldStyle} /></label>
    </div>}
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
      {pending && <><button type="button" disabled={busy} onClick={() => onUpdate(session.id, { statut: 'refusee' })} style={cancelButton}>Refuser</button><button type="button" disabled={busy} onClick={() => onUpdate(session.id, { statut: 'confirmee', lien_reunion: lien, notes })} style={primaryButton}>Confirmer</button></>}
      {confirmed && <><button type="button" disabled={busy} onClick={() => onUpdate(session.id, { statut: 'confirmee', lien_reunion: lien, notes })} style={secondaryButton}>Enregistrer les détails</button><button type="button" disabled={busy || !past} title={!past ? 'Disponible après la date du rendez-vous' : undefined} onClick={() => onUpdate(session.id, { statut: 'terminee', lien_reunion: lien, notes })} style={primaryButton}>Terminer</button></>}
    </div>
  </article>;
}

const fieldStyle = { width: '100%', padding: '9px 10px', border: '1px solid #e8dce2', borderRadius: 8, font: 'inherit', marginTop: 5 };
const primaryButton = { border: 0, background: ACCENT, color: '#fff', borderRadius: 8, padding: '8px 12px', fontWeight: 700, cursor: 'pointer' };
const secondaryButton = { border: '1px solid #C45C7A', background: '#fff', color: ACCENT, borderRadius: 8, padding: '8px 12px', fontWeight: 700, cursor: 'pointer' };
