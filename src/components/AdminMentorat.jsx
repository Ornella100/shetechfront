import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';

export default function AdminMentorat() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async (silencieux = false) => {
    if (!silencieux) setLoading(true);
    setError('');
    try { const { data } = await api.get('/admin/sessions'); setSessions(data); }
    catch (e) { setError(e.response?.data?.message || 'Impossible de charger les sessions.'); }
    finally { if (!silencieux) setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    const refresh = setInterval(() => { void load(true); }, 15000);
    return () => { clearTimeout(timer); clearInterval(refresh); };
  }, [load]);

  const update = async (session) => {
    setBusyId(session.id); setError(''); setNotice('');
    try {
      await api.put(`/admin/sessions/${session.id}`, {
        statut: session.statut, notes: session.notes,
        lien_reunion: session.lien_reunion, sujet: session.sujet,
      });
      setNotice('Session mise à jour.'); await load();
    } catch (e) { setError(e.response?.data?.message || 'La mise à jour a échoué.'); }
    finally { setBusyId(null); }
  };

  const remove = async (session) => {
    if (!window.confirm(`Supprimer la session de ${session.apprenant_nom || 'cette apprenante'} ?`)) return;
    setBusyId(session.id); setError(''); setNotice('');
    try { await api.delete(`/admin/sessions/${session.id}`); setNotice('Session supprimée.'); await load(); }
    catch (e) { setError(e.response?.data?.message || 'La suppression a échoué.'); }
    finally { setBusyId(null); }
  };

  return <section style={{ maxWidth: 1000 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
      <p style={{ color: '#76656d', margin: 0 }}>Les nouvelles demandes arrivent par courriel et apparaissent ici automatiquement. Confirmez ou refusez chaque demande.</p>
      <button type="button" onClick={load} style={button}>Actualiser</button>
    </div>
    {error && <p role="alert" style={{ color: '#b42318' }}>{error}</p>}
    {notice && <p role="status" style={{ color: '#16703b' }}>{notice}</p>}
    {loading ? <p>Chargement des sessions…</p> : sessions.length === 0 ? <p>Aucune session de mentorat enregistrée.</p> :
      <div style={{ display: 'grid', gap: 14 }}>{sessions.map((s) => <SessionCard key={s.id} session={s} busy={busyId === s.id} onSave={update} onDelete={remove} />)}</div>}
  </section>;
}

function SessionCard({ session, busy, onSave, onDelete }) {
  const [draft, setDraft] = useState({
    ...session,
    statut: ['en_attente', 'confirmee', 'refusee', 'annulee', 'terminee'].includes(session.statut)
      ? session.statut
      : ['terminé', 'termine'].includes(session.statut) ? 'terminee' : 'réservé',
    notes: session.notes || '', lien_reunion: session.lien_reunion || '', sujet: session.sujet || '',
  });
  const field = { display: 'block', width: '100%', border: '1px solid #EDE3E7', borderRadius: 7, padding: '9px 10px', marginTop: 5, font: 'inherit' };
  const label = { display: 'block', color: '#6D2E46', fontSize: 12, fontWeight: 700 };
  return <article style={{ background: '#fff', border: '1px solid #EDE3E7', borderRadius: 10, padding: 18 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
      <div><strong>{session.apprenant_nom || 'Apprenante'} avec {session.mentor_nom || 'Mentor'}</strong>
        <div style={{ color: '#76656d', fontSize: 13, marginTop: 4 }}>
          {session.user?.email && <a href={`mailto:${session.user.email}`} style={{ color: '#C45C7A' }}>{session.user.email}</a>}
          {session.user?.telephone && <> · <a href={`tel:${session.user.telephone}`} style={{ color: '#C45C7A' }}>{session.user.telephone}</a></>}
        </div>
        <div style={{ color: '#76656d', fontSize: 13, marginTop: 4 }}>{session.date_session ? new Date(session.date_session).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : 'Date à confirmer'} · {session.type || 'individuel'}</div></div>
      <button type="button" disabled={busy} onClick={() => onDelete(session)} style={{ ...button, color: '#b42318', borderColor: '#f4c7c3' }}>Supprimer</button>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
      <label style={label}>Sujet<input value={draft.sujet} onChange={(e) => setDraft({ ...draft, sujet: e.target.value })} style={field} /></label>
      <label style={label}>Statut<select value={draft.statut} onChange={(e) => setDraft({ ...draft, statut: e.target.value })} style={field}><option value="en_attente">À confirmer</option><option value="confirmee">Confirmée</option><option value="refusee">Refusée</option><option value="annulee">Annulée</option><option value="réservé">Réservé (ancien)</option><option value="terminee">Terminé</option></select></label>
      <label style={label}>Lien de réunion<input type="url" value={draft.lien_reunion} onChange={(e) => setDraft({ ...draft, lien_reunion: e.target.value })} style={field} /></label>
      <label style={label}>Notes<textarea rows="2" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} style={field} /></label>
    </div>
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
      {['en_attente', 'réservé'].includes(draft.statut) && <>
        <button type="button" disabled={busy} onClick={() => onSave({ ...draft, statut: 'refusee' })} style={{ ...button, color: '#b42318', borderColor: '#f4c7c3' }}>Refuser la demande</button>
        <button type="button" disabled={busy} onClick={() => onSave({ ...draft, statut: 'confirmee' })} style={{ ...button, background: '#C45C7A', color: '#fff', borderColor: '#C45C7A' }}>Confirmer la demande</button>
      </>}
      <button type="button" disabled={busy} onClick={() => onSave(draft)} style={{ ...button, background: '#C45C7A', color: '#fff', borderColor: '#C45C7A' }}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
    </div>
  </article>;
}

const button = { border: '1px solid #C45C7A', borderRadius: 7, padding: '8px 12px', color: '#C45C7A', background: '#fff', cursor: 'pointer', fontWeight: 700 };
