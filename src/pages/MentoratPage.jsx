import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faRotateRight, faUserGraduate, faEnvelopeOpenText } from '@fortawesome/free-solid-svg-icons';
import api from '../lib/api';
import { useAuth } from '../store/authStore';
import { useMesInscriptions } from '../hooks/useParcours';

const ACCENT = '#C45C7A';
const BG = '#F9F0F3';

export default function MentoratPage() {
  const { user } = useAuth();
  const isMentor = user?.role === 'mentor';
  const isLearner = user?.role === 'apprenante';
  const { data: inscriptions } = useMesInscriptions();
  const [sessions, setSessions] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [form, setForm] = useState({ parcours_id: '' });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    const results = isMentor
      ? await Promise.allSettled([api.get('/mentor/sessions'), api.get('/mentor/mentorat/demandes')])
      : await Promise.allSettled([api.get('/sessions'), api.get('/mentorat/mes-demandes')]);
    if (results[0].status === 'fulfilled') setSessions(results[0].value.data);
    if (results[1].status === 'fulfilled') setDemandes(results[1].value.data);
    const failed = results.find((result) => result.status === 'rejected');
    if (failed) setError(failed.reason?.response?.data?.message || 'Impossible de charger vos informations de mentorat.');
    setLoading(false);
  }, [isMentor]);

  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const submit = async (e) => {
    e.preventDefault(); setSending(true); setError(''); setNotice('');
    try {
      const { data } = await api.post('/mentorat/mes-demandes', { parcours_id: Number(form.parcours_id) });
      setNotice(data.message || 'Votre demande de suivi a été envoyée.');
      setForm({ parcours_id: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible d’envoyer votre demande de suivi.');
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

  const updateMentorDemand = async (demandeId, statut) => {
    setSending(true); setError(''); setNotice('');
    try {
      const { data } = await api.put(`/mentor/mentorat/demandes/${demandeId}`, { statut });
      setNotice(data.message); await load();
    } catch (err) { setError(err.response?.data?.message || 'Impossible de mettre à jour ce suivi.'); }
    finally { setSending(false); }
  };

  const parcoursInscrits = (inscriptions?.inscriptions || []).filter((item) => ['actif', 'termine'].includes(item.statut));
  const parcoursAvecDemande = new Set(demandes.map((demande) => demande.parcours?.id));
  const parcoursSansDemande = parcoursInscrits.filter((item) => !parcoursAvecDemande.has(item.parcours_id));
  const field = { width: '100%', padding: '11px 12px', border: '1px solid #e8dce2', borderRadius: 9, font: 'inherit', marginTop: 6, background: '#fff' };

  return <main style={{ background: BG, minHeight: '100vh', padding: '32px 24px', color: '#2B1B24' }}>
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div><h1 style={{ margin: 0, fontSize: 30 }}><FontAwesomeIcon icon={faUserGraduate} style={{ color: ACCENT, marginRight: 12 }} />Mentorat</h1>
          <p style={{ margin: '7px 0 0', color: '#74636b' }}>{isMentor ? 'Consultez les parcours qui vous sont confiés et assurez leur suivi.' : 'L’équipe SheTech attribue une mentor à chaque demande de suivi.'}</p></div>
        <button type="button" onClick={load} style={button}><FontAwesomeIcon icon={faRotateRight} /> Actualiser</button>
      </header>
      {error && <p role="alert" style={noticeStyle('#b42318', '#fff1f0')}>{error}</p>}
      {notice && <p role="status" style={noticeStyle('#16703b', '#effaf3')}>{notice}</p>}

      {isLearner && <section style={card}>
        <h2 style={h2}>Mes demandes de suivi</h2>
        <p style={muted}>Une demande est transmise automatiquement à l’équipe SheTech lorsque vous choisissez un parcours. Vous n’avez pas à choisir une mentor ni à indiquer un sujet.</p>
        {!loading && demandes.length === 0 && <p style={muted}>Aucune demande pour le moment. Choisissez un parcours dans la rubrique Formations pour transmettre votre demande.</p>}
        {!loading && demandes.map((d) => <DemandCard key={d.id} demande={d} />)}
        {!loading && parcoursSansDemande.length > 0 && <form onSubmit={submit} style={{ display: 'flex', alignItems: 'end', gap: 12, flexWrap: 'wrap', marginTop: 18, borderTop: '1px solid #f0e4ea', paddingTop: 16 }}>
          <label style={{ ...label, flex: '1 1 260px' }}>Demander un suivi pour un parcours déjà choisi
            <select required value={form.parcours_id} onChange={(e) => setForm({ parcours_id: e.target.value })} style={field}>
              <option value="">Sélectionnez un parcours</option>
              {parcoursSansDemande.map((item) => <option key={item.parcours_id} value={item.parcours_id}>{item.parcours?.titre}</option>)}
            </select>
          </label>
          <button type="submit" disabled={sending || !form.parcours_id} style={{ ...button, background: ACCENT, color: '#fff' }}>
            <FontAwesomeIcon icon={faEnvelopeOpenText} /> {sending ? 'Envoi…' : 'Envoyer la demande'}
          </button>
        </form>}
      </section>}

      {isMentor && <section style={card}>
        <h2 style={h2}>Parcours confiés</h2>
        {loading ? <p style={muted}>Chargement de vos suivis…</p> : demandes.length === 0 ? <p style={muted}>Aucun parcours ne vous a encore été confié.</p> :
          <div style={{ display: 'grid', gap: 10 }}>{demandes.map((d) => <MentorDemandCard key={d.id} demande={d} busy={sending} onUpdate={updateMentorDemand} />)}</div>}
      </section>}

      <section style={{ ...card, marginTop: 22 }}>
        <h2 style={h2}>{isMentor ? 'Sessions planifiées' : 'Mes sessions'}</h2>
        {loading ? <p style={muted}>Chargement des sessions…</p> : sessions.length === 0 ? <p style={muted}>Vous n’avez pas encore de session planifiée.</p> :
          <div style={{ display: 'grid', gap: 10 }}>{sessions.map((s) => isMentor ? <MentorSessionCard key={s.id} session={s} busy={sending} onUpdate={updateMentorSession} /> : <article key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, border: '1px solid #f0e4ea', borderRadius: 10, background: '#fff' }}>
            <div style={iconBox}><FontAwesomeIcon icon={faClock} /></div>
            <div style={{ flex: 1 }}><strong>Session de mentorat</strong><div style={muted}>Avec {s.mentor_nom || 'votre mentor'} · {s.type || 'individuel'} · {new Date(s.date_session).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</div>{s.lien_reunion && <a href={s.lien_reunion} target="_blank" rel="noreferrer" style={{ color: ACCENT, fontSize: 13 }}>Ouvrir le lien de réunion</a>}</div>
            <span style={badge}>{sessionLabel(s.statut)}</span>
            {['en_attente', 'réservé', 'confirmee'].includes(s.statut) && new Date(s.date_session) > new Date() && <button type="button" disabled={sending} onClick={() => cancelSession(s.id)} style={cancelButton}>Annuler</button>}
          </article>)}</div>}
      </section>
    </div>
  </main>;
}

function DemandCard({ demande }) {
  return <article style={{ border: '1px solid #f0e4ea', borderRadius: 10, padding: 14, marginTop: 10, background: '#fff' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <div><strong>{demande.parcours?.titre}</strong><div style={muted}>Demande envoyée le {formatDate(demande.created_at)}</div></div>
      <span style={badge}>{demandLabel(demande.statut)}</span>
    </div>
    {demande.mentor && <p style={{ ...muted, marginBottom: 0 }}>Votre mentor : <strong>{demande.mentor.nom}</strong></p>}
  </article>;
}

function MentorDemandCard({ demande, busy, onUpdate }) {
  return <article style={{ border: '1px solid #f0e4ea', borderRadius: 10, padding: 15, background: '#fff' }}>
    <div style={{ display: 'flex', alignItems: 'start', gap: 12 }}>
      <div style={iconBox}><FontAwesomeIcon icon={faClock} /></div>
      <div style={{ flex: 1 }}>
        <strong>{demande.apprenante?.nom} · {demande.parcours?.titre}</strong>
        <div style={muted}>{demande.apprenante?.email} · Attribué le {formatDate(demande.created_at)}</div>
        <p style={{ fontSize: 13, lineHeight: 1.6, margin: '10px 0', whiteSpace: 'pre-wrap' }}>{demande.message_suivi}</p>
        <span style={badge}>{demandLabel(demande.statut)}</span>
      </div>
    </div>
    {demande.statut !== 'terminee' && <div style={{ display: 'flex', justifyContent: 'end', gap: 8, marginTop: 12 }}>
      {demande.statut === 'attribuee' && <button type="button" disabled={busy} onClick={() => onUpdate(demande.id, 'en_cours')} style={button}>Prendre en charge</button>}
      <button type="button" disabled={busy} onClick={() => onUpdate(demande.id, 'terminee')} style={{ ...button, background: ACCENT, color: '#fff' }}>Terminer le suivi</button>
    </div>}
  </article>;
}

function MentorSessionCard({ session, busy, onUpdate }) {
  const [lien, setLien] = useState(session.lien_reunion || '');
  const [notes, setNotes] = useState(session.notes || '');
  const pending = ['en_attente', 'réservé'].includes(session.statut);
  const confirmed = session.statut === 'confirmee';
  const past = new Date(session.date_session) <= new Date();
  return <article style={{ padding: 16, border: '1px solid #f0e4ea', borderRadius: 10, background: '#fff' }}>
    <div style={{ marginBottom: 12 }}><strong>{session.apprenant_nom || 'Apprenante'}</strong><div style={muted}>{session.type || 'individuel'} · {new Date(session.date_session).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</div><span style={badge}>{sessionLabel(session.statut)}</span></div>
    {confirmed && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
      <label style={label}>Lien de réunion<input type="url" value={lien} onChange={(e) => setLien(e.target.value)} style={fieldStyle} placeholder="https://…" /></label>
      <label style={label}>Notes<textarea rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} style={fieldStyle} /></label>
    </div>}
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
      {pending && <><button type="button" disabled={busy} onClick={() => onUpdate(session.id, { statut: 'refusee' })} style={cancelButton}>Refuser</button><button type="button" disabled={busy} onClick={() => onUpdate(session.id, { statut: 'confirmee', lien_reunion: lien, notes })} style={primaryButton}>Confirmer</button></>}
      {confirmed && <><button type="button" disabled={busy} onClick={() => onUpdate(session.id, { statut: 'confirmee', lien_reunion: lien, notes })} style={secondaryButton}>Enregistrer les détails</button><button type="button" disabled={busy || !past} onClick={() => onUpdate(session.id, { statut: 'terminee', lien_reunion: lien, notes })} style={primaryButton}>Terminer</button></>}
    </div>
  </article>;
}

const card = { background: '#fff', border: '1px solid #f0e4ea', borderRadius: 14, padding: 22 };
const h2 = { fontSize: 20, color: '#2B1B24', margin: '0 0 12px' };
const label = { display: 'block', fontWeight: 650, fontSize: 13 };
const muted = { color: '#76656d', fontSize: 13, lineHeight: 1.5 };
const badge = { display: 'inline-block', background: '#f9f0f3', color: ACCENT, borderRadius: 99, padding: '5px 10px', fontSize: 11, fontWeight: 700 };
const button = { display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#fff', color: ACCENT, border: `1px solid ${ACCENT}`, borderRadius: 9, fontWeight: 700, cursor: 'pointer' };
const iconBox = { width: 42, height: 42, flexShrink: 0, borderRadius: 12, display: 'grid', placeItems: 'center', color: ACCENT, background: '#f9f0f3' };
const fieldStyle = { width: '100%', padding: '9px 10px', border: '1px solid #e8dce2', borderRadius: 8, font: 'inherit', marginTop: 5 };
const noticeStyle = (color, background) => ({ color, background, borderRadius: 9, padding: '11px 14px', margin: '0 0 14px', fontSize: 14 });
const cancelButton = { border: '1px solid #f0b8b5', background: '#fff1f0', color: '#b42318', borderRadius: 8, padding: '8px 10px', fontWeight: 700, cursor: 'pointer' };
const primaryButton = { border: 0, background: ACCENT, color: '#fff', borderRadius: 8, padding: '8px 12px', fontWeight: 700, cursor: 'pointer' };
const secondaryButton = { border: `1px solid ${ACCENT}`, background: '#fff', color: ACCENT, borderRadius: 8, padding: '8px 12px', fontWeight: 700, cursor: 'pointer' };
const sessionLabel = (status) => ({ en_attente: 'À confirmer', 'réservé': 'Réservée', confirmee: 'Confirmée', refusee: 'Refusée', annulee: 'Annulée', terminee: 'Terminée', 'terminé': 'Terminée' }[status] || status || 'À confirmer');
const demandLabel = (status) => ({ en_attente: 'En attente d’attribution', attribuee: 'Mentor attribuée', en_cours: 'Suivi en cours', terminee: 'Suivi terminé', annulee: 'Annulée', refusee: 'Refusée' }[status] || status || 'En attente');
const formatDate = (value) => value ? new Date(value).toLocaleDateString('fr-FR', { dateStyle: 'medium' }) : '—';
