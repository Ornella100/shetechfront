import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';

const EMPTY = { titre: '', contenu: '', image_principale: '', publie: false };

export default function AdminActualites() {
  const [articles, setArticles] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const { data } = await api.get('/admin/actualites'); setArticles(data); }
    catch (e) { setError(e.response?.data?.message || 'Impossible de charger les articles.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const payload = { ...form, image_principale: form.image_principale.trim() || null };
      if (editingId) await api.put(`/admin/actualites/${editingId}`, payload);
      else await api.post('/admin/actualites', payload);
      setNotice(editingId ? 'Article mis à jour.' : (form.publie ? 'Article publié.' : 'Brouillon enregistré.'));
      setForm(EMPTY); setEditingId(null); await load();
    } catch (err) { setError(err.response?.data?.message || 'Impossible d’enregistrer cet article.'); }
    finally { setBusy(false); }
  };

  const edit = (article) => {
    setEditingId(article.id);
    setForm({ titre: article.titre, contenu: article.contenu, image_principale: article.image_principale || '', publie: article.publie });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (article) => {
    if (!window.confirm(`Supprimer « ${article.titre} » ?`)) return;
    setBusy(true); setError(''); setNotice('');
    try { await api.delete(`/admin/actualites/${article.id}`); setNotice('Article supprimé.'); await load(); }
    catch (err) { setError(err.response?.data?.message || 'Impossible de supprimer cet article.'); }
    finally { setBusy(false); }
  };

  const input = { width: '100%', border: '1px solid #EDE3E7', borderRadius: 8, padding: '10px 12px', marginTop: 6, font: 'inherit', color: '#2B1B24' };
  const label = { display: 'block', color: '#6D2E46', fontSize: 12, fontWeight: 700, marginBottom: 14 };

  return <div style={{ maxWidth: 1100, color: '#2B1B24' }}>
    <p style={{ color: '#76656d', marginTop: 0 }}>Rédigez les nouvelles de SheTech, gardez-les en brouillon ou publiez-les immédiatement.</p>
    {error && <p role="alert" style={feedback('#b42318', '#fff1f0')}>{error}</p>}
    {notice && <p role="status" style={feedback('#16703b', '#effaf3')}>{notice}</p>}
    <section style={panel}>
      <h2 style={{ margin: '0 0 18px', fontSize: 19 }}>{editingId ? 'Modifier l’article' : 'Nouvel article'}</h2>
      <form onSubmit={submit}>
        <label style={label}>Titre<input required maxLength="255" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} style={input} /></label>
        <label style={label}>Contenu<textarea required rows="10" value={form.contenu} onChange={(e) => setForm({ ...form, contenu: e.target.value })} style={{ ...input, resize: 'vertical', lineHeight: 1.6 }} /></label>
        <label style={label}>URL de l’image principale (facultatif)<input type="url" value={form.image_principale} onChange={(e) => setForm({ ...form, image_principale: e.target.value })} placeholder="https://…" style={input} /></label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 9, color: '#6D2E46', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
          <input type="checkbox" checked={form.publie} onChange={(e) => setForm({ ...form, publie: e.target.checked })} /> Publier maintenant
        </label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY); }} style={secondaryButton}>Annuler</button>}
          <button type="submit" disabled={busy} style={primaryButton}>{busy ? 'Enregistrement…' : editingId ? 'Enregistrer les modifications' : form.publie ? 'Publier l’article' : 'Enregistrer le brouillon'}</button>
        </div>
      </form>
    </section>

    <section style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 19, margin: '0 0 14px' }}>Articles ({articles.length})</h2>
      {loading ? <p>Chargement…</p> : articles.length === 0 ? <p style={{ color: '#76656d' }}>Aucun article pour l’instant.</p> :
        <div style={{ display: 'grid', gap: 10 }}>{articles.map((article) => <article key={article.id} style={{ ...panel, display: 'flex', alignItems: 'center', gap: 14 }}>
          {article.image_principale && <img src={article.image_principale} alt="" style={{ width: 72, height: 58, objectFit: 'cover', borderRadius: 7 }} />}
          <div style={{ flex: 1, minWidth: 0 }}><strong>{article.titre}</strong><div style={{ color: '#8b7981', fontSize: 12, marginTop: 4 }}>{article.publie ? 'Publié' : 'Brouillon'} · Modifié le {new Date(article.updated_at).toLocaleDateString('fr-FR')}</div></div>
          <button type="button" disabled={busy} onClick={() => edit(article)} style={secondaryButton}>Modifier</button>
          <button type="button" disabled={busy} onClick={() => remove(article)} style={deleteButton}>Supprimer</button>
        </article>)}</div>}
    </section>
  </div>;
}

const panel = { background: '#fff', border: '1px solid #EDE3E7', borderRadius: 10, padding: 18 };
const primaryButton = { border: 0, background: '#C45C7A', color: '#fff', borderRadius: 8, padding: '10px 14px', fontWeight: 700, cursor: 'pointer' };
const secondaryButton = { border: '1px solid #D9B8C6', background: '#fff', color: '#6D2E46', borderRadius: 8, padding: '9px 13px', fontWeight: 700, cursor: 'pointer' };
const deleteButton = { border: '1px solid #f4c7c3', background: '#fff1f0', color: '#b42318', borderRadius: 8, padding: '9px 13px', fontWeight: 700, cursor: 'pointer' };
const feedback = (color, background) => ({ color, background, borderRadius: 8, padding: '11px 14px', fontSize: 13 });
