(() => {
  const articlePage = document.body.dataset.page === 'article';
  const noteScript = document.createElement('script');
  noteScript.src = articlePage ? '../assets/notes.js?v=20260904-1' : 'assets/notes.js?v=20260904-1';
  document.head.append(noteScript);
  const articleHref = (slug) => articlePage ? `${slug}.html` : `articles/${slug}.html`;
  const keys = { favorites: 'sasu-favorites-v1', read: 'sasu-read-v1' };
  const loadSet = (key) => { try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch { return new Set(); } };
  const saveSet = (key, value) => { try { localStorage.setItem(key, JSON.stringify([...value])); } catch { /* optional */ } };
  const esc = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const state = { favorites: loadSet(keys.favorites), read: loadSet(keys.read), query: '', tag: 'すべて', date: 'すべて', savedOnly: false, sort: 'publishedAt', direction: 'desc', page: 1, pageSize: 25 };
  let articles = [];

  function syncButtons() {
    document.querySelectorAll('[data-favorite]').forEach((button) => {
      const active = state.favorites.has(button.dataset.favorite);
      button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active));
      const label = button.querySelector('[data-label]'); if (label) label.textContent = active ? '保存済み' : '保存';
    });
    document.querySelectorAll('[data-read]').forEach((button) => {
      const active = state.read.has(button.dataset.read);
      button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active));
      const label = button.querySelector('[data-label]'); if (label) label.textContent = active ? '既読' : '未読';
    });
    document.querySelectorAll('[data-saved-count]').forEach((node) => { node.textContent = String(state.favorites.size); });
    document.querySelectorAll('[data-saved-wrap]').forEach((node) => { node.hidden = state.favorites.size === 0; });
    document.querySelectorAll('[data-saved-utility]').forEach((node) => { node.hidden = state.favorites.size === 0; });
  }

  function filteredArticles() {
    const query = state.query.trim().toLocaleLowerCase('ja');
    return articles.filter((article) => {
      const text = [article.title, article.originalTitle, ...(article.authors || []), ...(article.tags || []), article.excerpt].join(' ').toLocaleLowerCase('ja');
      return (!query || text.includes(query)) && (state.tag === 'すべて' || article.tags.includes(state.tag)) && (state.date === 'すべて' || article.publishedAt === state.date) && (!state.savedOnly || state.favorites.has(article.slug));
    });
  }

  function compare(a, b) {
    const av = state.sort === 'tags' ? a.tags.join('、') : a[state.sort];
    const bv = state.sort === 'tags' ? b.tags.join('、') : b[state.sort];
    if (av === bv) return 0;
    const result = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv), 'ja');
    return state.direction === 'asc' ? result : -result;
  }

  function row(article) {
    const read = state.read.has(article.slug);
    const author = article.authors.length > 2 ? `${article.authors[0]} ほか${article.authors.length - 1}名` : article.authors.join(' / ');
    return `<tr data-slug="${esc(article.slug)}" class="${read ? 'is-read' : ''}"><td class="date-cell">${esc(article.publishedAt)}</td><td class="title-cell"><a href="${esc(articleHref(article.slug))}">${esc(article.title)}</a><span class="original-title">${esc(article.originalTitle)}</span><div class="row-actions"><button type="button" data-read="${esc(article.slug)}" aria-pressed="${read}">✓ <span data-label>${read ? '既読' : '未読'}</span></button><button type="button" data-favorite="${esc(article.slug)}" aria-pressed="${state.favorites.has(article.slug)}">♡ <span data-label>${state.favorites.has(article.slug) ? '保存済み' : '保存'}</span></button></div></td><td class="tag-cell">${article.tags.map((tag) => `<span>${esc(tag)}</span>`).join('')}</td><td class="source-cell">${esc(author)}<br><span>${esc(article.year)}</span></td><td class="length-cell">${esc(article.readingMinutes)}分</td></tr>`;
  }

  function renderRows() {
    const body = document.querySelector('#article-list'); if (!body) return;
    const filtered = filteredArticles().sort(compare); const count = document.querySelector('[data-result-count]');
    if (count) count.textContent = `${filtered.length}本`;
    const pages = Math.max(1, Math.ceil(filtered.length / state.pageSize)); state.page = Math.min(state.page, pages);
    const visible = filtered.slice((state.page - 1) * state.pageSize, state.page * state.pageSize);
    body.innerHTML = visible.map(row).join('');
    const empty = document.querySelector('[data-empty-state]'); if (empty) empty.hidden = visible.length !== 0;
    renderPagination(pages); syncButtons();
  }

  function renderPagination(pages) {
    const nav = document.querySelector('[data-pagination]'); if (!nav) return;
    if (pages <= 1) { nav.innerHTML = ''; return; }
    nav.innerHTML = `<button type="button" data-page-action="prev" ${state.page === 1 ? 'disabled' : ''}>前へ</button><span>${state.page} / ${pages}</span><button type="button" data-page-action="next" ${state.page === pages ? 'disabled' : ''}>次へ</button>`;
  }

  function renderFeatured() {
    const container = document.querySelector('#featured-article'); if (!container) return;
    const article = articles.find((item) => item.featured === true);
    if (!article) { container.innerHTML = '<p class="empty-state"><strong>今日は採用なし。</strong>前回の追加は一覧から確認できます。</p>'; return; }
    const visual = article.image ? `<figure class="entry-visual"><img src="${esc(article.image)}" alt="${esc(article.imageAlt || '')}" width="800" height="533"><figcaption>${esc(article.imageCaption || '図版：自動生成')}</figcaption></figure>` : '';
    container.innerHTML = `${visual}<div class="entry-copy"><p class="entry-label">追加日 ${esc(article.publishedAt)}</p><h2><a href="${esc(articleHref(article.slug))}">${esc(article.title)}</a></h2><p class="original-title">${esc(article.originalTitle)}</p><p class="entry-excerpt">${esc(article.excerpt)}</p><div class="entry-meta"><span>${article.tags.map((tag) => `<span>${esc(tag)}</span>`).join('')}</span><span>${esc(article.authors.join(' / '))} · ${esc(article.year)} · 読了 ${esc(article.readingMinutes)}分</span><span class="row-actions"><button type="button" data-read="${esc(article.slug)}" aria-pressed="${state.read.has(article.slug)}">✓ <span data-label>${state.read.has(article.slug) ? '既読' : '未読'}</span></button><button type="button" data-favorite="${esc(article.slug)}" aria-pressed="${state.favorites.has(article.slug)}">♡ <span data-label>${state.favorites.has(article.slug) ? '保存済み' : '保存'}</span></button></span></div></div>`;
    syncButtons();
  }

  function renderFilters() {
    const tagSelect = document.querySelector('#tag-filter');
    if (tagSelect) tagSelect.innerHTML = ['すべて', ...new Set(articles.flatMap((article) => article.tags))].map((tag) => `<option value="${esc(tag)}" ${tag === state.tag ? 'selected' : ''}>${esc(tag)}</option>`).join('');
    const dateSelect = document.querySelector('#date-filter');
    if (dateSelect) dateSelect.innerHTML = ['すべて', ...new Set(articles.map((article) => article.publishedAt).sort().reverse())].map((date) => `<option value="${esc(date)}" ${date === state.date ? 'selected' : ''}>${esc(date)}</option>`).join('');
  }

  function renderCollectionMeta(daily) {
    if (!daily || typeof daily !== 'object') return;
    const rawStamp = String(daily.lastUpdated || `${daily.date || ''} 10:00`);
    const stamp = rawStamp.length >= 16 ? rawStamp.slice(0, 16).replace('T', ' ') : rawStamp;
    const run = `自動収集 / 最終実行 ${stamp} / 候補${daily.candidateCount ?? 0}件・採用${daily.adoptedCount ?? 0}件`;
    document.querySelectorAll('[data-run-summary]').forEach((node) => { node.textContent = run; });
    document.querySelectorAll('[data-collection-note]').forEach((node) => { node.textContent = daily.collectionNote || ''; });
    const tracks = daily.selectionTracks || [];
    const renderedTracks = tracks.map((track, index) => `<section class="criteria-track"><h3>${index + 1}. ${esc(track.title)}</h3><p>${esc(track.summary || '')}</p><ul>${(track.criteria || []).map((item) => `<li>${esc(item)}</li>`).join('')}</ul></section>`).join('');
    const fallback = (daily.selectionCriteria || []).length ? `<ul>${daily.selectionCriteria.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>` : '';
    const adoption = daily.adoptionRule ? `<p class="adoption-rule"><strong>採用条件</strong>${esc(daily.adoptionRule)}</p>` : '';
    document.querySelectorAll('[data-selection-criteria]').forEach((node) => { node.innerHTML = `${renderedTracks || fallback}${adoption}`; });
  }

  document.addEventListener('click', (event) => {
    const favorite = event.target.closest('[data-favorite]');
    if (favorite) { event.preventDefault(); const slug = favorite.dataset.favorite; state.favorites.has(slug) ? state.favorites.delete(slug) : state.favorites.add(slug); saveSet(keys.favorites, state.favorites); renderRows(); renderFeatured(); syncButtons(); return; }
    const read = event.target.closest('[data-read]');
    if (read) { event.preventDefault(); const slug = read.dataset.read; state.read.has(slug) ? state.read.delete(slug) : state.read.add(slug); saveSet(keys.read, state.read); renderRows(); renderFeatured(); syncButtons(); return; }
    const sort = event.target.closest('[data-sort-key]');
    if (sort) { const key = sort.dataset.sortKey; if (state.sort === key) state.direction = state.direction === 'asc' ? 'desc' : 'asc'; else { state.sort = key; state.direction = key === 'title' || key === 'tags' ? 'asc' : 'desc'; } state.page = 1; renderRows(); return; }
    const page = event.target.closest('[data-page-action]');
    if (page) { state.page += page.dataset.pageAction === 'next' ? 1 : -1; renderRows(); document.querySelector('#archive')?.scrollIntoView({ behavior: 'smooth' }); return; }
    const saved = event.target.closest('[data-saved-filter]');
    if (saved) { state.savedOnly = !state.savedOnly; document.querySelectorAll('[data-saved-filter]').forEach((node) => { node.classList.toggle('is-active', state.savedOnly); node.setAttribute('aria-pressed', String(state.savedOnly)); }); state.page = 1; renderRows(); return; }
  });
  document.querySelector('#archive-search')?.addEventListener('input', (event) => { state.query = event.target.value; state.page = 1; renderRows(); });
  document.querySelector('#tag-filter')?.addEventListener('change', (event) => { state.tag = event.target.value; state.page = 1; renderRows(); });
  document.querySelector('#date-filter')?.addEventListener('change', (event) => { state.date = event.target.value; state.page = 1; renderRows(); });

  if (articlePage) { syncButtons(); return; }

  const renderArchive = () => { renderFilters(); renderRows(); renderFeatured(); syncButtons(); };
  const embeddedArticles = () => JSON.parse(document.querySelector('#article-data')?.textContent || '[]');

  (async () => {
    try {
      const [articleResponse, additionsResponse, dailyResponse] = await Promise.all([
        fetch('data/articles.json', { cache: 'no-store' }),
        fetch('data/additions.json', { cache: 'no-store' }),
        fetch('data/daily-current.json', { cache: 'no-store' })
      ]);
      const base = articleResponse.ok ? await articleResponse.json() : embeddedArticles();
      const additions = additionsResponse.ok ? await additionsResponse.json() : [];
      const seen = new Set();
      articles = [...additions, ...base].filter((article) => {
        if (seen.has(article.slug)) return false;
        seen.add(article.slug);
        return true;
      });
      if (dailyResponse.ok) renderCollectionMeta(await dailyResponse.json());
      renderArchive();
    } catch {
      try { articles = embeddedArticles(); renderArchive(); } catch { syncButtons(); }
    }
  })();
})();
