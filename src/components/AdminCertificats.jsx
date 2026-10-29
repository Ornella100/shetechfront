import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';

export default function AdminCertificats() {
  const [eligible, setEligible] = useState([]);
  const [issued, setIssued] = useState([]);
  const [parcours, setParcours] = useState([]);
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [e, i, p] = await Promise.all([
        api.get('/admin/certificats/parcours/eligibles'),
        api.get('/admin/certificats'),
        api.get('/admin/certificats/parcours'),
      ]);
      setEligible(e.data); setIssued(i.data); setParcours(p.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les certificats.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const uploadTemplate = async (item) => {
    const file = files[item.id];
    if (!file) return;
    const form = new FormData(); form.append('certificat', file);
    setBusy(`template:${item.id}`); setError(''); setNotice('');
    try {
      const { data } = await api.post(`/admin/certificats/parcours/${item.id}/modele`, form);
      setNotice(data.message); setFiles((current) => ({ ...current, [item.id]: null })); await load();
    } catch (err) { setError(err.response?.data?.message || 'Le téléversement du certificat a échoué.'); }
    finally { setBusy(''); }
  };

  const issue = async (item) => {
    const key = `${item.user_id}:${item.parcours_id}`;
    setBusy(key); setError(''); setNotice('');
    try {
      const { data } = await api.post('/admin/certificats/parcours', {
        user_id: item.user_id, parcours_id: item.parcours_id,
      });
      setNotice(data.message); await load();
    } catch (err) { setError(err.response?.data?.message || 'L’émission du certificat a échoué.'); }
    finally { setBusy(''); }
  };

  const download = async (certificat) => {
    setBusy(`download:${certificat.id}`); setError('');
    try {
      const { data } = await api.get(`/admin/certificats/${certificat.id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const link = document.createElement('a'); link.href = url;
      link.download = `certificat_${certificat.id}.pdf`; link.click(); URL.revokeObjectURL(url);
    } catch (err) { setError(err.response?.data?.message || 'Téléchargement impossible.'); }
    finally { setBusy(''); }
  };

  return <section style={{ maxWidth: 1050 }}>
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <p style={{ margin: 0, color: '#76656d' }}>Déposez un modèle PDF par parcours et gérez aussi les certificats individuels déjà émis.</p>
      <button type="button" onClick={load} style={button}>Actualiser</button>
    </header>
    {error && <p role="alert" style={{ color: '#b42318' }}>{error}</p>}
    {notice && <p role="status" style={{ color: '#16703b' }}>{notice}</p>}
    {loading ? <p>Chargement…</p> : <>
      <h2 style={heading}>Modèles de certificats par parcours</h2>
      <p style={muted}>Déposez un PDF pour chaque parcours. Il sera proposé aux apprenantes qui réussissent le quiz final.</p>
      {parcours.length ? <div style={{ ...grid, marginTop: 12 }}>{parcours.map((item) => <article key={item.id} style={{ ...card, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}><strong>{item.titre}</strong><div style={muted}>{item.certificat_disponible ? `Modèle disponible${item.nom_fichier ? ` : ${item.nom_fichier}` : ''}` : 'Aucun modèle téléversé'}</div></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <input type="file" accept="application/pdf,.pdf" onChange={(e) => setFiles((current) => ({ ...current, [item.id]: e.target.files?.[0] || null }))} />
          <button type="button" disabled={!files[item.id] || busy === `template:${item.id}`} onClick={() => uploadTemplate(item)} style={primary}>
            {busy === `template:${item.id}` ? 'Envoi…' : item.certificat_disponible ? 'Remplacer le PDF' : 'Téléverser le PDF'}
          </button>
        </div>
      </article>)}</div> : <p style={muted}>Aucun parcours disponible.</p>}

      <h2 style={{ ...heading, marginTop: 32 }}>Émissions individuelles en attente ({eligible.length})</h2>
      {eligible.length ? <div style={grid}>{eligible.map((item) => {
        const key = `${item.user_id}:${item.parcours_id}`;
        return <article key={key} style={card}>
          <div><strong>{item.nom}</strong><div style={muted}>{item.email}</div>
            <div style={{ marginTop: 10 }}>{item.parcours_titre}</div>
            <div style={muted}>Quiz réussi · score {item.score}%</div></div>
          <button type="button" disabled={busy === key} onClick={() => issue(item)} style={primary}>{busy === key ? 'Émission…' : 'Émettre et envoyer'}</button>
        </article>;
      })}</div> : <p style={muted}>Aucune apprenante n’attend actuellement un certificat de parcours.</p>}

      <h2 style={{ ...heading, marginTop: 32 }}>Certificats déjà émis ({issued.length})</h2>
      {issued.length ? <div style={grid}>{issued.map((item) => <article key={item.id} style={card}>
        <div><strong>{item.nom}</strong><div style={muted}>{item.email}</div>
          <div style={{ marginTop: 8 }}>{item.titre} · {item.type === 'parcours' ? 'Parcours' : 'Formation'}</div>
          <div style={muted}>Émis le {new Date(item.date_obtention).toLocaleDateString('fr-FR')} · {item.code_verification}</div></div>
        <button type="button" disabled={busy === `download:${item.id}`} onClick={() => download(item)} style={button}>Télécharger</button>
      </article>)}</div> : <p style={muted}>Aucun certificat enregistré.</p>}
    </>}
  </section>;
}

const button = { border: '1px solid #C45C7A', borderRadius: 7, padding: '8px 12px', color: '#C45C7A', background: '#fff', cursor: 'pointer', fontWeight: 700 };
const primary = { ...button, background: '#C45C7A', color: '#fff' };
const heading = { fontSize: 18, color: '#2B1B24', marginBottom: 12 };
const grid = { display: 'grid', gap: 12 };
const card = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, background: '#fff', border: '1px solid #EDE3E7', borderRadius: 10, padding: 16 };
const muted = { color: '#76656d', fontSize: 13, marginTop: 4 };
