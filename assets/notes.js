(() => {
  const storageKey = 'sasu-notes-v1';
  const highlightStorageKey = 'sasu-highlights-v1';

  const loadObject = (key) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch {
      return {};
    }
  };

  let notes = loadObject(storageKey);
  let highlights = loadObject(highlightStorageKey);
  const hasNote = (slug) => Boolean(String(notes[slug] || '').trim());
  const highlightCount = (slug) => Array.isArray(highlights[slug]) ? highlights[slug].length : 0;
  const saveObject = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* optional */ }
  };
  const saveNotes = () => saveObject(storageKey, notes);
  const saveHighlights = () => saveObject(highlightStorageKey, highlights);

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

  function addHighlightIndicator(container, slug) {
    const count = highlightCount(slug);
    if (!container || !count || container.querySelector('[data-highlight-indicator]')) return;
    const indicator = document.createElement('span');
    indicator.dataset.highlightIndicator = '';
    indicator.textContent = `🖍 マーカー ${count}`;
    indicator.style.display = 'block';
    indicator.style.marginTop = '4px';
    indicator.style.color = 'var(--indigo)';
    indicator.style.font = '10.5px/1.5 var(--sans)';
    indicator.style.letterSpacing = '.03em';
    container.append(indicator);
  }

  function annotateArchive() {
    document.querySelectorAll('#article-list tr[data-slug]').forEach((row) => {
      row.querySelector('[data-note-indicator]')?.remove();
      row.querySelector('[data-highlight-indicator]')?.remove();
      const slug = row.dataset.slug;
      const cell = row.querySelector('.title-cell');
      if (hasNote(slug)) addNoteIndicator(cell);
      addHighlightIndicator(cell, slug);
    });

    const featured = document.querySelector('#featured-article');
    featured?.querySelector('[data-note-indicator]')?.remove();
    featured?.querySelector('[data-highlight-indicator]')?.remove();
    const featuredHref = featured?.querySelector('h2 a')?.getAttribute('href') || '';
    const match = featuredHref.match(/articles\/([^/]+)\.html$/);
    if (match) {
      const slug = match[1];
      const copy = featured.querySelector('.entry-copy');
      if (hasNote(slug)) addNoteIndicator(copy);
      addHighlightIndicator(copy, slug);
    }
  }

  function initArchiveIndicators() {
    annotateArchive();
    const list = document.querySelector('#article-list');
    const featured = document.querySelector('#featured-article');
    if (list) new MutationObserver(annotateArchive).observe(list, { childList: true });
    if (featured) new MutationObserver(annotateArchive).observe(featured, { childList: true });
    window.addEventListener('storage', (event) => {
      if (event.key === storageKey) notes = loadObject(storageKey);
      if (event.key === highlightStorageKey) highlights = loadObject(highlightStorageKey);
      if (event.key === storageKey || event.key === highlightStorageKey) annotateArchive();
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

  function initArticleHighlighter() {
    const slug = document.body.dataset.slug;
    const body = document.querySelector('.article-body');
    const rail = document.querySelector('.article-rail');
    if (!slug || !body || !rail) return;

    const supported = Boolean(window.CSS?.highlights && window.Highlight);
    const markerName = 'sasu-reading-marker';

    const style = document.createElement('style');
    style.textContent = `
      ::highlight(${markerName}) { background: rgba(232, 202, 92, .48); color: inherit; }
      [data-highlight-toolbar] { position: fixed; z-index: 9999; padding: 7px 10px; border: 1px solid rgba(45,74,62,.38); background: #F6F6F1; color: #2D4A3E; box-shadow: 0 4px 18px rgba(31,38,33,.14); font: 700 11px/1.2 var(--sans); cursor: pointer; }
      [data-highlight-toolbar][hidden] { display: none; }
    `;
    document.head.append(style);

    const articleText = () => {
      const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
      let text = '';
      let node;
      while ((node = walker.nextNode())) text += node.nodeValue || '';
      return text;
    };

    const pointAtOffset = (offset) => {
      const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
      let consumed = 0;
      let node;
      let last = null;
      while ((node = walker.nextNode())) {
        last = node;
        const length = (node.nodeValue || '').length;
        if (offset <= consumed + length) return { node, offset: Math.max(0, offset - consumed) };
        consumed += length;
      }
      return last ? { node: last, offset: (last.nodeValue || '').length } : null;
    };

    const rangeFromOffsets = (start, end) => {
      const a = pointAtOffset(start);
      const b = pointAtOffset(end);
      if (!a || !b) return null;
      try {
        const range = document.createRange();
        range.setStart(a.node, a.offset);
        range.setEnd(b.node, b.offset);
        return range;
      } catch {
        return null;
      }
    };

    const rangeOffsets = (range) => {
      if (!body.contains(range.startContainer) || !body.contains(range.endContainer)) return null;
      try {
        const beforeStart = document.createRange();
        beforeStart.selectNodeContents(body);
        beforeStart.setEnd(range.startContainer, range.startOffset);
        const beforeEnd = document.createRange();
        beforeEnd.selectNodeContents(body);
        beforeEnd.setEnd(range.endContainer, range.endOffset);
        return { start: beforeStart.toString().length, end: beforeEnd.toString().length };
      } catch {
        return null;
      }
    };

    const resolve = (item, raw) => {
      let start = Number(item.start);
      let end = Number(item.end);
      if (Number.isFinite(start) && Number.isFinite(end) && raw.slice(start, end) === item.text) return { start, end };
      if (!item.text) return null;
      const candidates = [];
      let from = 0;
      while (from <= raw.length) {
        const index = raw.indexOf(item.text, from);
        if (index < 0) break;
        candidates.push(index);
        from = index + Math.max(1, item.text.length);
      }
      if (!candidates.length) return null;
      if (candidates.length === 1) return { start: candidates[0], end: candidates[0] + item.text.length };
      let best = candidates[0];
      let bestScore = -1;
      for (const index of candidates) {
        let score = 0;
        if (item.prefix && raw.slice(Math.max(0, index - item.prefix.length), index) === item.prefix) score += 2;
        const finish = index + item.text.length;
        if (item.suffix && raw.slice(finish, finish + item.suffix.length) === item.suffix) score += 2;
        if (score > bestScore) { best = index; bestScore = score; }
      }
      return { start: best, end: best + item.text.length };
    };

    const currentItems = () => Array.isArray(highlights[slug]) ? highlights[slug] : [];
    const resolvedItems = () => {
      const raw = articleText();
      return currentItems().map((item) => {
        const found = resolve(item, raw);
        return found ? { item, ...found } : null;
      }).filter(Boolean);
    };

    let status;
    let clearAll;
    const syncCard = () => {
      if (!status || !clearAll) return;
      const count = currentItems().length;
      status.textContent = count ? `${count}か所 保存済み` : 'まだありません';
      clearAll.hidden = count === 0;
    };

    const renderHighlights = () => {
      if (!supported) return;
      const ranges = resolvedItems().map(({ start, end }) => rangeFromOffsets(start, end)).filter(Boolean);
      CSS.highlights.delete(markerName);
      if (ranges.length) CSS.highlights.set(markerName, new Highlight(...ranges));
      syncCard();
    };

    const card = document.createElement('section');
    card.className = 'rail-card';
    card.dataset.readingHighlights = slug;
    const heading = document.createElement('span');
    heading.textContent = 'マーカー';
    const help = document.createElement('p');
    help.textContent = supported ? '本文をドラッグして選択すると「マーカー」が出ます。選んだ範囲はこのブラウザに保存されます。' : 'このブラウザは本文マーカー表示に対応していません。';
    help.style.margin = '10px 0 0';
    help.style.color = 'var(--mist-strong)';
    help.style.font = '10.5px/1.7 var(--sans)';
    const footer = document.createElement('div');
    footer.style.display = 'flex';
    footer.style.alignItems = 'center';
    footer.style.justifyContent = 'space-between';
    footer.style.gap = '12px';
    footer.style.marginTop = '9px';
    status = document.createElement('small');
    status.style.color = 'var(--indigo)';
    status.style.font = '10px/1.5 var(--sans)';
    clearAll = document.createElement('button');
    clearAll.type = 'button';
    clearAll.textContent = 'すべて消去';
    clearAll.style.padding = '3px 0';
    clearAll.style.border = '0';
    clearAll.style.borderBottom = '1px solid var(--line)';
    clearAll.style.background = 'transparent';
    clearAll.style.color = 'var(--mist-strong)';
    clearAll.style.font = '10px var(--sans)';
    clearAll.addEventListener('click', () => {
      if (!currentItems().length) return;
      delete highlights[slug];
      saveHighlights();
      renderHighlights();
    });
    footer.append(status, clearAll);
    card.append(heading, help, footer);
    const sourceLink = rail.querySelector('.source-link');
    if (sourceLink) rail.insertBefore(card, sourceLink);
    else rail.append(card);
    syncCard();

    if (!supported) return;

    const toolbar = document.createElement('button');
    toolbar.type = 'button';
    toolbar.dataset.highlightToolbar = '';
    toolbar.hidden = true;
    document.body.append(toolbar);
    let pending = null;

    const hideToolbar = () => {
      toolbar.hidden = true;
      pending = null;
    };

    const showToolbarForSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) { hideToolbar(); return; }
      const range = selection.getRangeAt(0);
      const offsets = rangeOffsets(range);
      if (!offsets || offsets.end <= offsets.start) { hideToolbar(); return; }
      const raw = articleText();
      let start = offsets.start;
      let end = offsets.end;
      let text = raw.slice(start, end);
      const leading = text.match(/^\s+/)?.[0].length || 0;
      const trailing = text.match(/\s+$/)?.[0].length || 0;
      start += leading;
      end -= trailing;
      text = raw.slice(start, end);
      if (!text) { hideToolbar(); return; }

      const overlappingIds = resolvedItems().filter((item) => start < item.end && item.start < end).map((item) => item.item.id);
      pending = { start, end, text, overlappingIds };
      toolbar.textContent = overlappingIds.length ? 'マーカー解除' : 'マーカー';
      const rect = range.getBoundingClientRect();
      if (!rect.width && !rect.height) { hideToolbar(); return; }
      const width = overlappingIds.length ? 92 : 66;
      toolbar.style.left = `${Math.max(8, Math.min(window.innerWidth - width - 8, rect.left + rect.width / 2 - width / 2))}px`;
      toolbar.style.top = `${Math.max(8, rect.top - 40)}px`;
      toolbar.hidden = false;
    };

    toolbar.addEventListener('pointerdown', (event) => event.preventDefault());
    toolbar.addEventListener('click', () => {
      if (!pending) return;
      if (pending.overlappingIds.length) {
        const remove = new Set(pending.overlappingIds);
        highlights[slug] = currentItems().filter((item) => !remove.has(item.id));
        if (!highlights[slug].length) delete highlights[slug];
      } else {
        const raw = articleText();
        const item = {
          id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          start: pending.start,
          end: pending.end,
          text: pending.text,
          prefix: raw.slice(Math.max(0, pending.start - 32), pending.start),
          suffix: raw.slice(pending.end, pending.end + 32)
        };
        if (!Array.isArray(highlights[slug])) highlights[slug] = [];
        highlights[slug].push(item);
      }
      saveHighlights();
      renderHighlights();
      window.getSelection()?.removeAllRanges();
      hideToolbar();
    });

    body.addEventListener('mouseup', () => setTimeout(showToolbarForSelection, 0));
    body.addEventListener('keyup', () => setTimeout(showToolbarForSelection, 0));
    document.addEventListener('pointerdown', (event) => {
      if (event.target !== toolbar) hideToolbar();
    });
    window.addEventListener('scroll', hideToolbar, { passive: true });
    window.addEventListener('resize', hideToolbar);
    window.addEventListener('storage', (event) => {
      if (event.key !== highlightStorageKey) return;
      highlights = loadObject(highlightStorageKey);
      renderHighlights();
    });

    renderHighlights();
  }

  if (document.body.dataset.page === 'article') {
    initArticleNote();
    initArticleHighlighter();
  } else {
    initArchiveIndicators();
  }
})();
