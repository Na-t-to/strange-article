(() => {
  const storageKey = 'sasu-notes-v1';

  const loadNotes = () => {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch {
      return {};
    }
  };

  let notes = loadNotes();
  const hasNote = (slug) => Boolean(String(notes[slug] || '').trim());
  const saveNotes = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(notes)); } catch { /* optional */ }
  };

  function addNoteIndicator(container) {
    if (!container || container.querySelector('[data-note-indicator]')) return;
    const indicator = document.createElement('span');
    indicator.dataset.noteIndicator = '';
    indicator.textContent = '📝 メモあり';
    indicator.style.display = 'block';
    indicator.style.marginTop = '6px';
    indicator.style.color = 'var(--rust)';
    indicator.style.font = '10.5px/1.5 var(--sans)';
    indicator.style.letterSpacing = '.03em';
    container.append(indicator);
  }

  function annotateArchive() {
    document.querySelectorAll('#article-list tr[data-slug]').forEach((row) => {
      row.querySelector('[data-note-indicator]')?.remove();
      if (hasNote(row.dataset.slug)) addNoteIndicator(row.querySelector('.title-cell'));
    });

    const featured = document.querySelector('#featured-article');
    featured?.querySelector('[data-note-indicator]')?.remove();
    const featuredHref = featured?.querySelector('h2 a')?.getAttribute('href') || '';
    const match = featuredHref.match(/articles\/([^/]+)\.html$/);
    if (match && hasNote(match[1])) addNoteIndicator(featured.querySelector('.entry-copy'));
  }

  function initArchiveIndicators() {
    annotateArchive();
    const list = document.querySelector('#article-list');
    const featured = document.querySelector('#featured-article');
    if (list) new MutationObserver(annotateArchive).observe(list, { childList: true });
    if (featured) new MutationObserver(annotateArchive).observe(featured, { childList: true });
    window.addEventListener('storage', (event) => {
      if (event.key !== storageKey) return;
      notes = loadNotes();
      annotateArchive();
    });
  }

  function initArticleNote() {
    const slug = document.body.dataset.slug;
    const rail = document.querySelector('.article-rail');
    if (!slug || !rail || rail.querySelector('[data-reading-note]')) return;

    const card = document.createElement('section');
    card.className = 'rail-card';
    card.dataset.readingNote = slug;

    const heading = document.createElement('span');
    heading.textContent = '読書メモ';

    const help = document.createElement('p');
    help.textContent = '要点・疑問・仕事との接続などを自由に。入力内容はこのブラウザに自動保存されます。';
    help.style.margin = '10px 0 0';
    help.style.color = 'var(--mist-strong)';
    help.style.font = '10.5px/1.7 var(--sans)';

    const textarea = document.createElement('textarea');
    textarea.rows = 9;
    textarea.value = notes[slug] || '';
    textarea.placeholder = '例：\n・要するに何の話か\n・まだ分からないところ\n・仕事で使えそうな点';
    textarea.setAttribute('aria-label', 'この記事の読書メモ');
    textarea.style.width = '100%';
    textarea.style.minHeight = '220px';
    textarea.style.marginTop = '12px';
    textarea.style.padding = '10px 11px';
    textarea.style.resize = 'vertical';
    textarea.style.border = '1px solid var(--line)';
    textarea.style.borderRadius = '0';
    textarea.style.outline = 'none';
    textarea.style.background = 'rgba(246,246,241,.45)';
    textarea.style.color = 'var(--sumi-strong)';
    textarea.style.font = '13px/1.8 var(--serif)';

    const footer = document.createElement('div');
    footer.style.display = 'flex';
    footer.style.alignItems = 'center';
    footer.style.justifyContent = 'space-between';
    footer.style.gap = '12px';
    footer.style.marginTop = '8px';

    const status = document.createElement('small');
    status.style.color = 'var(--moss)';
    status.style.font = '10px/1.5 var(--sans)';

    const clear = document.createElement('button');
    clear.type = 'button';
    clear.textContent = 'メモを消去';
    clear.style.padding = '3px 0';
    clear.style.border = '0';
    clear.style.borderBottom = '1px solid var(--line)';
    clear.style.background = 'transparent';
    clear.style.color = 'var(--mist-strong)';
    clear.style.font = '10px var(--sans)';

    const sync = () => {
      const active = hasNote(slug);
      status.textContent = active ? '保存済み' : '未入力';
      clear.hidden = !active;
    };

    textarea.addEventListener('focus', () => { textarea.style.borderColor = 'var(--moss)'; });
    textarea.addEventListener('blur', () => { textarea.style.borderColor = 'var(--line)'; });
    textarea.addEventListener('input', () => {
      if (textarea.value.trim()) notes[slug] = textarea.value;
      else delete notes[slug];
      saveNotes();
      sync();
    });

    clear.addEventListener('click', () => {
      if (!hasNote(slug)) return;
      delete notes[slug];
      textarea.value = '';
      saveNotes();
      sync();
      textarea.focus();
    });

    footer.append(status, clear);
    card.append(heading, help, textarea, footer);
    const sourceLink = rail.querySelector('.source-link');
    if (sourceLink) rail.insertBefore(card, sourceLink);
    else rail.append(card);
    sync();
  }

  if (document.body.dataset.page === 'article') initArticleNote();
  else initArchiveIndicators();
})();
