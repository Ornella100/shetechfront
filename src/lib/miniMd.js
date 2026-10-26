// Rendu "mini markdown" du contenu des leçons (pattern GeekCoding4Kids).
// Accepte du HTML riche tel quel, sinon convertit un markdown simple
// (titres, listes, gras/italique, code, images, liens, citations) en HTML.

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineMd(s) {
  return s
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

const BLOCK_START = /^(#{1,4}\s|[-*]\s|\d+[.)]\s|>|```|---$|\*\*\*$)/;

export function miniMdToHtml(src) {
  if (!src) return '';
  // Contenu déjà en HTML (éditeur riche) : rendu tel quel
  if (/<\/?(p|div|h[1-6]|ul|ol|li|img|br|strong|em|a|table|blockquote|pre|span)\b/i.test(src)) {
    return src;
  }

  const out = [];
  const lines = src.split(/\r?\n/);
  let i = 0;
  let list = null;
  const closeList = () => {
    if (list) {
      out.push(`</${list}>`);
      list = null;
    }
  };

  while (i < lines.length) {
    const line = lines[i].trim();

    if (line.startsWith('```')) {
      closeList();
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      out.push(`<pre><code>${escapeHtml(buf.join('\n'))}</code></pre>`);
      continue;
    }

    if (!line) {
      closeList();
      i++;
      continue;
    }

    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) {
      closeList();
      const lvl = h[1].length + 1; // h2..h5, le h1 est réservé au titre de la page
      out.push(`<h${lvl}>${inlineMd(escapeHtml(h[2]))}</h${lvl}>`);
      i++;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      if (list !== 'ul') {
        closeList();
        out.push('<ul>');
        list = 'ul';
      }
      out.push(`<li>${inlineMd(escapeHtml(line.replace(/^[-*]\s+/, '')))}</li>`);
      i++;
      continue;
    }

    if (/^\d+[.)]\s+/.test(line)) {
      if (list !== 'ol') {
        closeList();
        out.push('<ol>');
        list = 'ol';
      }
      out.push(`<li>${inlineMd(escapeHtml(line.replace(/^\d+[.)]\s+/, '')))}</li>`);
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      closeList();
      out.push(`<blockquote>${inlineMd(escapeHtml(line.replace(/^>\s?/, '')))}</blockquote>`);
      i++;
      continue;
    }

    if (/^(---|\*\*\*)$/.test(line)) {
      closeList();
      out.push('<hr />');
      i++;
      continue;
    }

    closeList();
    const buf = [line];
    i++;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (!next || BLOCK_START.test(next)) break;
      buf.push(next);
      i++;
    }
    out.push(`<p>${buf.map((l) => inlineMd(escapeHtml(l))).join('<br />')}</p>`);
  }

  closeList();
  return out.join('\n');
}
