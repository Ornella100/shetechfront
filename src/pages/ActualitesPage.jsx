import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faMagnifyingGlass, faNewspaper, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import api from '../lib/api';

const ACCENT = '#C45C7A';
const BG = '#F9F0F3';

export default function ActualitesPage() {
  const [articles, setArticles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (query = '') => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/actualites', { params: query ? { search: query } : {} });
      setArticles(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Impossible de charger les actualités.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const openArticle = async (article) => {
    setSelected(article);
    try { const { data } = await api.get(`/actualites/${article.id}`); setSelected(data); }
    catch (e) { setError(e.response?.data?.message || 'Impossible de charger cet article.'); }
  };

  const date = (value) => value ? new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  return <main style={{ minHeight: '100vh', background: BG, color: '#2B1B24', padding: '36px 22px 64px' }}>
    <div style={{ maxWidth: 1050, margin: '0 auto' }}>
      {selected ? <>
        <button type="button" onClick={() => setSelected(null)} style={backButton}><FontAwesomeIcon icon={faArrowLeft} /> Toutes les actualités</button>
        <article style={articleDetail}>
          {selected.image_principale && <img src={selected.image_principale} alt="" style={detailImage} />}
          <div style={{ padding: 'clamp(22px, 5vw, 54px)' }}>
            <div style={meta}>{date(selected.created_at)}{selected.auteur_nom ? ` · Par ${selected.auteur_nom}` : ''}</div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(30px, 5vw, 48px)', lineHeight: 1.12, margin: '12px 0 24px' }}>{selected.titre}</h1>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.85, fontSize: 16, color: '#493a41' }}>{selected.contenu}</div>
          </div>
        </article>
      </> : <>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 18, flexWrap: 'wrap', marginBottom: 28 }}>
          <div><div style={eyebrow}><FontAwesomeIcon icon={faNewspaper} /> Le journal SheTech</div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(34px, 5vw, 52px)', margin: '12px 0 8px' }}>Actualités</h1>
            <p style={{ margin: 0, color: '#76656d', maxWidth: 580 }}>Nouvelles, conseils et histoires de la communauté SheTech.</p></div>
          <form onSubmit={(e) => { e.preventDefault(); load(search.trim()); }} style={{ display: 'flex', gap: 8, minWidth: 'min(100%, 300px)' }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un article" aria-label="Rechercher un article" style={searchInput} />
            <button type="submit" aria-label="Rechercher" style={searchButton}><FontAwesomeIcon icon={faMagnifyingGlass} /></button>
            <button type="button" aria-label="Actualiser" onClick={() => load(search.trim())} style={refreshButton}><FontAwesomeIcon icon={faRotateRight} /></button>
          </form>
        </header>
        {error && <p role="alert" style={{ color: '#b42318', background: '#fff1f0', borderRadius: 9, padding: 12 }}>{error}</p>}
        {loading ? <p style={{ color: '#76656d' }}>Chargement des actualités…</p> : articles.length === 0 ?
          <section style={emptyState}><FontAwesomeIcon icon={faNewspaper} style={{ color: '#d5a9b8', fontSize: 30 }} /><h2>Aucun article pour le moment</h2><p>Revenez bientôt pour découvrir les nouvelles de SheTech.</p></section> :
          <div style={grid}>{articles.map((article, index) => <article key={article.id} style={{ ...card, gridColumn: index === 0 ? '1 / -1' : undefined, display: index === 0 ? 'grid' : 'block', gridTemplateColumns: index === 0 ? 'minmax(0, 1fr) minmax(0, 1fr)' : undefined }}>
            {article.image_principale && <img src={article.image_principale} alt="" style={index === 0 ? leadImage : cardImage} />}
            <div style={{ padding: 22 }}><div style={meta}>{date(article.created_at)}{article.auteur_nom ? ` · ${article.auteur_nom}` : ''}</div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: index === 0 ? 30 : 22, lineHeight: 1.2, margin: '10px 0' }}>{article.titre}</h2>
              <p style={{ color: '#76656d', lineHeight: 1.65, margin: '0 0 18px' }}>{article.contenu.length > 190 ? `${article.contenu.slice(0, 190).trim()}…` : article.contenu}</p>
              <button type="button" onClick={() => openArticle(article)} style={readButton}>Lire l’article <FontAwesomeIcon icon={faArrowRight} /></button>
            </div>
          </article>)}</div>}
      </>}
    </div>
  </main>;
}

const eyebrow = { display: 'inline-flex', gap: 9, alignItems: 'center', color: ACCENT, background: '#fff', borderRadius: 99, padding: '8px 12px', fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase' };
const meta = { color: '#967d88', fontSize: 12, fontWeight: 650 };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 310px), 1fr))', gap: 18 };
const card = { background: '#fff', border: '1px solid #f0e4ea', borderRadius: 16, overflow: 'hidden', boxShadow: '0 12px 35px rgba(43,27,36,.05)' };
const articleDetail = { background: '#fff', borderRadius: 18, overflow: 'hidden', border: '1px solid #f0e4ea', marginTop: 18 };
const detailImage = { width: '100%', maxHeight: 440, objectFit: 'cover', display: 'block' };
const leadImage = { width: '100%', height: '100%', minHeight: 280, objectFit: 'cover' };
const cardImage = { width: '100%', height: 190, objectFit: 'cover', display: 'block' };
const searchInput = { flex: 1, minWidth: 0, padding: '11px 13px', border: '1px solid #eadde3', borderRadius: 9, font: 'inherit' };
const searchButton = { width: 44, border: 0, borderRadius: 9, color: '#fff', background: ACCENT, cursor: 'pointer' };
const refreshButton = { width: 42, border: '1px solid #eadde3', borderRadius: 9, color: ACCENT, background: '#fff', cursor: 'pointer' };
const backButton = { border: 0, background: 'transparent', color: ACCENT, fontWeight: 750, cursor: 'pointer', padding: '8px 0', display: 'inline-flex', gap: 9, alignItems: 'center' };
const readButton = { border: 0, padding: 0, background: 'transparent', color: ACCENT, font: 'inherit', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', gap: 9, alignItems: 'center' };
const emptyState = { background: '#fff', borderRadius: 16, padding: 50, textAlign: 'center', color: '#76656d' };
