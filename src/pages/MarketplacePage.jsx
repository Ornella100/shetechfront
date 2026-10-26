import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBagShopping, faBoxOpen, faCartShopping, faPlus, faRotateRight, faTrash } from '@fortawesome/free-solid-svg-icons';
import api from '../lib/api';

const ACCENT = '#C45C7A';
const BG = '#F9F0F3';
const card = { background: '#fff', border: '1px solid #f0e4ea', borderRadius: 14, padding: 20 };
const money = (value) => `${Number(value || 0).toLocaleString('fr-FR')} FCFA`;

export default function MarketplacePage() {
  const [products, setProducts] = useState([]);
  const [mine, setMine] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [sales, setSales] = useState([]);
  const [form, setForm] = useState({ titre: '', description: '', categorie: 'service', prix: '', image_url: '' });
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [params] = useSearchParams();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const results = await Promise.allSettled([
      api.get('/marketplace/produits'), api.get('/marketplace/mes-produits'),
      api.get('/marketplace/panier'), api.get('/marketplace/mes-commandes'), api.get('/marketplace/mes-ventes'),
    ]);
    const failed = results.find((r) => r.status === 'rejected');
    if (failed) setError(failed.reason?.response?.data?.message || 'Impossible de charger la marketplace. Vérifiez la connexion à l’API.');
    if (results[0].status === 'fulfilled') setProducts(results[0].value.data);
    if (results[1].status === 'fulfilled') setMine(results[1].value.data);
    if (results[2].status === 'fulfilled') setCart(results[2].value.data);
    if (results[3].status === 'fulfilled') setOrders(results[3].value.data);
    if (results[4].status === 'fulfilled') setSales(results[4].value.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (params.get('retour') !== '1') return undefined;
    const transactionId = sessionStorage.getItem('marketplace_transaction_id') || params.get('transaction_id');
    if (!transactionId) {
      const timer = setTimeout(() => setError('Retour de paiement reçu, mais la référence de transaction est introuvable. Actualisez vos commandes dans quelques instants.'), 0);
      return () => clearTimeout(timer);
    }
    let timer;
    let attempts = 0;
    let cancelled = false;
    const check = async () => {
      try {
        const { data } = await api.get(`/marketplace/verifier-transaction/${transactionId}`);
        const pending = data.commandes?.some((order) => order.statut === 'paiement_en_attente');
        if (!pending || attempts >= 6) {
          sessionStorage.removeItem('marketplace_transaction_id');
          if (!cancelled) {
            setNotice(pending ? 'Le paiement est encore en cours de confirmation. Actualisez vos commandes dans un instant.' : 'Le statut de votre paiement a été actualisé.');
            await load();
          }
          return;
        }
        attempts += 1;
        timer = setTimeout(check, 5000);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || 'Impossible de vérifier le paiement.');
      }
    };
    check();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [params, load]);

  const action = async (fn, success) => {
    setBusy(true); setError(''); setNotice('');
    try { await fn(); setNotice(success); await load(); }
    catch (e) { setError(e.response?.data?.message || 'L’opération a échoué. Réessayez.'); }
    finally { setBusy(false); }
  };

  const publish = (e) => {
    e.preventDefault();
    const wasEditing = Boolean(editingId);
    action(async () => {
      let image_url = form.image_url || null;
      if (imageFile) {
        const data = new FormData();
        data.append('image', imageFile);
        const uploaded = await api.post('/marketplace/images', data);
        image_url = uploaded.data.image_url;
      }
      const payload = { ...form, prix: Number(form.prix), image_url };
      if (editingId) await api.put(`/marketplace/produits/${editingId}`, payload);
      else await api.post('/marketplace/produits', payload);
      setForm({ titre: '', description: '', categorie: 'service', prix: '', image_url: '' });
      setEditingId(null);
      setImageFile(null);
    }, wasEditing ? 'Votre annonce a été mise à jour.' : 'Votre annonce est publiée.');
  };

  const editProduct = (product) => {
    setEditingId(product.id);
    setForm({ titre: product.titre || '', description: product.description || '', categorie: product.categorie || 'service', prix: product.prix || '', image_url: product.imageUrl || '' });
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = (id) => action(() => api.post('/marketplace/panier', { produit_id: id, quantite: 1 }), 'Article ajouté au panier.');
  const changeQuantity = (item, quantite) => action(() => api.put(`/marketplace/panier/${item.id}`, { quantite: Number(quantite) }), 'Panier mis à jour.');
  const removeFromCart = (id) => action(() => api.delete(`/marketplace/panier/${id}`), 'Article retiré du panier.');
  const removeProduct = (id) => action(() => api.delete(`/marketplace/produits/${id}`), 'Annonce supprimée.');
  const order = async () => {
    setBusy(true); setError(''); setNotice('');
    try {
      const { data } = await api.post('/marketplace/commander');
      sessionStorage.setItem('marketplace_transaction_id', String(data.transaction_id));
      window.location.assign(data.url);
    } catch (e) { setError(e.response?.data?.message || 'Impossible de démarrer le paiement.'); setBusy(false); }
  };
  const updateSale = (id, statut) => action(() => api.put(`/marketplace/commandes/${id}/statut`, { statut }), 'Statut de vente mis à jour.');

  const inputStyle = { width: '100%', padding: '11px 12px', border: '1px solid #e8dce2', borderRadius: 9, font: 'inherit', marginTop: 6 };
  const titleStyle = { fontSize: 20, color: '#2B1B24', margin: '0 0 14px' };

  return <main style={{ background: BG, minHeight: '100vh', padding: '32px 24px', color: '#2B1B24' }}>
    <div style={{ maxWidth: 1120, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div><h1 style={{ margin: 0, fontSize: 30 }}><FontAwesomeIcon icon={faBagShopping} style={{ color: ACCENT, marginRight: 12 }} />Marketplace</h1>
          <p style={{ margin: '7px 0 0', color: '#74636b' }}>Découvrez les services et créations de la communauté SheTech.</p></div>
        <button type="button" onClick={load} style={buttonStyle('#fff', ACCENT)}><FontAwesomeIcon icon={faRotateRight} /> Actualiser</button>
      </header>
      {error && <p role="alert" style={messageStyle('#b42318', '#fff1f0')}>{error}</p>}
      {notice && <p role="status" style={messageStyle('#16703b', '#effaf3')}>{notice}</p>}

      <section style={{ ...card, marginBottom: 22 }}>
        <h2 style={titleStyle}><FontAwesomeIcon icon={faCartShopping} style={{ color: ACCENT, marginRight: 9 }} />Panier <small style={{ color: '#8b7981', fontSize: 14 }}>({cart.reduce((n, i) => n + Number(i.quantite), 0)} article{cart.length > 1 ? 's' : ''})</small></h2>
        {!cart.length ? <p style={muted}>Votre panier est vide pour le moment.</p> : <>
          {cart.map((item) => <div key={item.id} style={rowStyle}>
            <div style={{ flex: 1 }}><strong>{item.produit_titre}</strong><div style={muted}>{item.vendeur_nom} · {money(item.produit_prix)} / unité</div></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}><span>Qté</span><button type="button" aria-label={`Diminuer ${item.produit_titre}`} disabled={busy || Number(item.quantite) <= 1} onClick={() => changeQuantity(item, Number(item.quantite) - 1)} style={quantityButton}>−</button><strong>{item.quantite}</strong><button type="button" aria-label={`Augmenter ${item.produit_titre}`} disabled={busy} onClick={() => changeQuantity(item, Number(item.quantite) + 1)} style={quantityButton}>+</button></div>
            <strong>{money(Number(item.produit_prix) * Number(item.quantite))}</strong>
            <button type="button" aria-label="Retirer du panier" onClick={() => removeFromCart(item.id)} style={iconButton}><FontAwesomeIcon icon={faTrash} /></button>
          </div>)}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16, paddingTop: 14 }}>
            <strong>Total : {money(cart.reduce((n, i) => n + Number(i.produit_prix) * Number(i.quantite), 0))}</strong>
            <button type="button" disabled={busy} onClick={order} style={buttonStyle(ACCENT, '#fff')}>{busy ? 'Préparation du paiement…' : 'Payer avec FedaPay'}</button>
          </div>
        </>}
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 310px', gap: 22, alignItems: 'start' }}>
        <section>
          <h2 style={titleStyle}>Annonces disponibles</h2>
          {loading ? <p style={muted}>Chargement des annonces…</p> : products.length === 0 ? <div style={card}><p style={muted}>Aucune annonce publiée pour le moment.</p></div> :
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(225px, 1fr))', gap: 14 }}>
              {products.map((p) => <article key={p.id} style={{ ...card, padding: 0, overflow: 'hidden' }}>
                {p.imageUrl ? <img src={p.imageUrl} alt="" style={{ width: '100%', height: 145, objectFit: 'cover' }} /> : <div style={{ height: 100, background: 'linear-gradient(135deg,#f6dce5,#f7efe6)', display: 'grid', placeItems: 'center', color: ACCENT }}><FontAwesomeIcon icon={faBoxOpen} size="2x" /></div>}
                <div style={{ padding: 16 }}><span style={badge}>{p.categorie}</span><h3 style={{ margin: '10px 0 5px', fontSize: 17 }}>{p.titre}</h3><p style={{ ...muted, minHeight: 40 }}>{p.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}><div><strong style={{ color: ACCENT }}>{money(p.prix)}</strong><div style={{ ...muted, fontSize: 12 }}>par {p.vendeur_nom || 'Membre'}</div></div>
                    {mine.some((m) => m.id === p.id) ? <div style={{ display: 'flex', gap: 6 }}><button type="button" onClick={() => editProduct(p)} disabled={busy} style={smallButton('#f9f0f3', ACCENT)}>Modifier</button><button type="button" onClick={() => removeProduct(p.id)} disabled={busy} style={smallButton('#fff1f0', '#b42318')}>Supprimer</button></div> : <button type="button" onClick={() => addToCart(p.id)} disabled={busy} style={smallButton(ACCENT, '#fff')}>Ajouter</button>}</div>
                </div>
              </article>)}
            </div>}
        </section>

        <aside style={card}>
          <h2 style={titleStyle}><FontAwesomeIcon icon={faPlus} style={{ color: ACCENT, marginRight: 8 }} />{editingId ? 'Modifier mon annonce' : 'Publier une annonce'}</h2>
          <form onSubmit={publish}>
            <label style={label}>Titre<input required maxLength="255" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} style={inputStyle} /></label>
            <label style={label}>Description<textarea required rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} /></label>
            <label style={label}>Catégorie<input required value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} style={inputStyle} /></label>
            <label style={label}>Prix (FCFA)<input required type="number" min="0" step="1" value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })} style={inputStyle} /></label>
            <label style={label}>Image de l’annonce (JPEG, PNG, WebP ou GIF)<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => setImageFile(e.target.files?.[0] || null)} style={inputStyle} /></label>
            {form.image_url && !imageFile && <div style={{ ...muted, marginTop: 8 }}>Image actuelle : <a href={form.image_url} target="_blank" rel="noreferrer" style={{ color: ACCENT }}>voir l’image</a></div>}
            <button disabled={busy} type="submit" style={{ ...buttonStyle(ACCENT, '#fff'), width: '100%', marginTop: 16 }}>{editingId ? 'Enregistrer les changements' : 'Publier'}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setImageFile(null); setForm({ titre: '', description: '', categorie: 'service', prix: '', image_url: '' }); }} style={{ ...buttonStyle('#fff', ACCENT), width: '100%', marginTop: 8 }}>Annuler la modification</button>}
          </form>
        </aside>
      </div>

      <section style={{ ...card, marginTop: 22 }}><h2 style={titleStyle}>Mes commandes</h2>
        {!orders.length ? <p style={muted}>Aucune commande enregistrée.</p> : orders.map((o) => <div key={o.id} style={rowStyle}><div style={{ flex: 1 }}><strong>{o.produit_titre}</strong><div style={muted}>Vendeur : {o.vendeur_nom || '—'} · {new Date(o.created_at).toLocaleDateString('fr-FR')}</div></div><span>{o.quantite} × {money(o.prixUnitaire)}</span><strong>{money(o.prix_total)}</strong><span style={badge}>{statusLabel(o.statut)}</span></div>)}
      </section>
      <section style={{ ...card, marginTop: 22 }}><h2 style={titleStyle}>Mes ventes</h2>
        {!sales.length ? <p style={muted}>Aucune vente pour le moment.</p> : sales.map((s) => <div key={s.id} style={rowStyle}>
          <div style={{ flex: 1 }}><strong>{s.produit_titre}</strong><div style={muted}>Acheteuse : {s.acheteur_nom || '—'} · {s.quantite} × {money(s.prixUnitaire)} · {new Date(s.created_at).toLocaleDateString('fr-FR')}</div></div>
          <strong>{money(s.prix_total)}</strong><span style={badge}>{statusLabel(s.statut)}</span>
          {nextSaleStatus(s.statut) && <select aria-label={`Mettre à jour la vente ${s.produit_titre}`} disabled={busy} value="" onChange={(e) => { if (e.target.value) updateSale(s.id, e.target.value); }} style={{ ...inputStyle, width: 190, margin: 0 }}><option value="">Mettre à jour…</option>{nextSaleStatus(s.statut).map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select>}
        </div>)}
      </section>
    </div>
  </main>;
}

const muted = { color: '#76656d', fontSize: 13, lineHeight: 1.5 };
const label = { display: 'block', fontWeight: 650, fontSize: 13, marginTop: 12 };
const badge = { display: 'inline-block', background: '#f9f0f3', color: ACCENT, borderRadius: 99, padding: '4px 9px', fontSize: 11, fontWeight: 700 };
const rowStyle = { display: 'flex', alignItems: 'center', gap: 16, borderTop: '1px solid #f1e8ec', padding: '12px 0' };
const iconButton = { border: 0, background: '#fff1f0', color: '#b42318', borderRadius: 8, width: 34, height: 34, cursor: 'pointer' };
const quantityButton = { border: '1px solid #e8dce2', background: '#fff', color: '#2B1B24', borderRadius: 7, width: 28, height: 28, cursor: 'pointer', fontSize: 16 };
const buttonStyle = (background, color) => ({ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '10px 14px', background, color, border: `1px solid ${background === '#fff' ? ACCENT : background}`, borderRadius: 9, fontWeight: 700, cursor: 'pointer' });
const smallButton = (background, color) => ({ background, color, border: 0, borderRadius: 8, padding: '8px 10px', fontWeight: 700, cursor: 'pointer' });
const messageStyle = (color, background) => ({ color, background, borderRadius: 9, padding: '11px 14px', margin: '0 0 14px', fontSize: 14 });
const STATUS_LABELS = { en_attente: 'Ancienne commande', paiement_en_attente: 'Paiement en attente', paiement_refuse: 'Paiement refusé', paiement_annule: 'Paiement annulé', payee: 'Payée', en_preparation: 'En préparation', expediee: 'Expédiée', terminee: 'Terminée', annulee: 'Annulée' };
const statusLabel = (status) => STATUS_LABELS[status] || status || 'Statut inconnu';
const nextSaleStatus = (status) => ({ payee: ['en_preparation'], en_preparation: ['expediee'], expediee: ['terminee'] }[status] || []);
