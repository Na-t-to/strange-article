(() => {
  const articlePage = document.body.dataset.page === 'article';
  const dataUrl = articlePage ? '../data/articles.json' : 'data/articles.json';
  const dailyUrl = 'data/daily.json';
  const articleHref = (slug) => articlePage ? `${slug}.html` : `articles/${slug}.html`;
  const keys = { favorites: 'sasu-favorites-v1', read: 'sasu-read-v1' };

  function loadSet(key) {
    try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); }
    catch { return new Set(); }
  }

  function saveSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify([...value])); }
    catch { /* local storage can be disabled; the page remains usable */ }
  }

  const state = { favorites: loadSet(keys.favorites), read: loadSet(keys.read), tag: 'すべて', savedOnly: false, query: '' };
  let articles = [];

  const escapeHtml = (value) => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  function syncButtons() {
    document.querySelectorAll('[data-favorite]').forEach((button) => {
      const active = state.favorites.has(button.dataset.favorite);
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
      const label = button.querySelector('[data-label]');
      if (label) label.textContent = active ? '保存済み' : '保存';
    });
    document.querySelectorAll('[data-read]').forEach((button) => {
      const active = state.read.has(button.dataset.read);
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
      const label = button.querySelector('[data-label]');
      if (label) label.textContent = active ? '既読' : '未読';
    });
    document.querySelectorAll('[data-saved-count]').forEach((node) => { node.textContent = String(state.favorites.size); });
  }

  function renderCards() {
    const container = document.querySelector('#article-list');
    if (!container) return;
    const query = state.query.trim().toLocaleLowerCase('ja');
    const filtered = articles.filter((article) => {
      const text = [article.title, article.originalTitle, ...article.authors, ...article.tags, article.excerpt].join(' ').toLocaleLowerCase('ja');
      return (!query || text.includes(query)) && (state.tag === 'すべて' || article.tags.includes(state.tag)) && (!state.savedOnly || state.favorites.has(article.slug));
    });
    const count = document.querySelector('[data-result-count]');
    if (count) count.textContent = `${filtered.length}本の記事`;
    if (!filtered.length) {
      container.innerHTML = '<div class="empty-state"><strong>該当する記事がありません</strong><p>検索語やタグを変えてみてください。</p></div>';
      return;
    }
    container.innerHTML = filtered.map((article, index) => `
      <article class="archive-card ${state.read.has(article.slug) ? 'is-read' : ''}">
        <div class="archive-card-top">
          <span class="number">${String(index + 1).padStart(2, '0')}</span>
          <div class="card-actions">
            <button class="icon-button" type="button" data-read="${article.slug}" aria-label="既読状態を切り替える" aria-pressed="${state.read.has(article.slug)}">✓</button>
            <button class="icon-button" type="button" data-favorite="${article.slug}" aria-label="お気に入りを切り替える" aria-pressed="${state.favorites.has(article.slug)}">♡</button>
          </div>
        </div>
        <a href="${articleHref(article.slug)}">
          <div class="tags">${article.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
          <h3>${escapeHtml(article.title)}</h3>
          <p class="card-original">${escapeHtml(article.originalTitle)}</p>
          <p class="card-excerpt">${escapeHtml(article.excerpt)}</p>
          <div class="card-meta"><span>${escapeHtml(article.authors.join(' / '))} · ${article.year}</span><span>読了 ${article.readingMinutes}分　<b>刺さり度 ${article.score}</b></span></div>
        </a>
      </article>`).join('');
    syncButtons();
  }

  function renderFeatured(article) {
    const container = document.querySelector('#featured-article');
    if (!container) return;
    if (!article) {
      container.innerHTML = '<div class="empty-state"><strong>今日のおすすめは準備中です</strong><p>featured: true の記事を1本指定してください。</p></div>';
      return;
    }
    container.innerHTML = `
      <div class="featured-visual" aria-hidden="true">
        <div class="visual-top"><span>${escapeHtml(article.featuredKicker || article.originalTitle)}</span><b>01</b></div>
        <span class="featured-issue-mark">本日の一篇</span>
      </div>
      <div class="featured-copy">
        <div class="featured-tools">
          <div class="tags">${article.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
          <div class="card-actions">
            <button class="icon-button labelled" type="button" data-read="${escapeHtml(article.slug)}" aria-pressed="${state.read.has(article.slug)}"><span>✓</span><span data-label>未読</span></button>
            <button class="icon-button labelled" type="button" data-favorite="${escapeHtml(article.slug)}" aria-pressed="${state.favorites.has(article.slug)}"><span>♡</span><span data-label>保存</span></button>
          </div>
        </div>
        <h2>${escapeHtml(article.title)}</h2>
        <p class="original-title">${escapeHtml(article.originalTitle)}</p>
        <p class="dek">${escapeHtml(article.excerpt)}</p>
        <div class="featured-footer">
          <p><strong>${escapeHtml(article.authors.join(' / '))} · ${article.year}</strong><small>読了 ${article.readingMinutes}分 ／ 刺さり度 ${article.score}</small></p>
          <a class="primary-button" href="${articleHref(article.slug)}">解説を読む ↗</a>
        </div>
      </div>`;
  }

  function renderDailyMeta(daily) {
    const [year, month, day] = String(daily.date).split('-').map(Number);
    const dateLabel = `${year}年${month}月${day}日`;
    const issueLabel = daily.issueLabel || `第${daily.issueNumber}号`;
    const issueDate = document.querySelector('[data-issue-date]');
    const issueHeading = document.querySelector('[data-issue-heading]');
    const editorTitle = document.querySelector('[data-editor-title]');
    const editorBody = document.querySelector('[data-editor-body]');
    if (issueDate) issueDate.textContent = `${dateLabel}　${issueLabel}`;
    if (issueHeading) {
      issueHeading.dateTime = daily.date;
      issueHeading.textContent = `${dateLabel}号`;
    }
    if (editorTitle) editorTitle.textContent = daily.editorNote?.title || '';
    if (editorBody) editorBody.textContent = daily.editorNote?.body || '';
  }

  function renderTags() {
    const container = document.querySelector('#tag-filters');
    if (!container) return;
    const tags = ['すべて', ...new Set(articles.flatMap((article) => article.tags))];
    container.innerHTML = tags.map((tag) => `<button type="button" class="tag-filter ${tag === state.tag ? 'is-active' : ''}" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`).join('');
  }

  function renderCounts() {
    const counts = new Map();
    articles.flatMap((article) => article.tags).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
    const list = document.querySelector('#theme-counts');
    if (list) list.innerHTML = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([tag, count]) => `<li><button type="button" data-theme-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button><span>${String(count).padStart(2, '0')}</span></li>`).join('');
  }

  document.addEventListener('click', (event) => {
    const favorite = event.target.closest('[data-favorite]');
    if (favorite) {
      event.preventDefault();
      const slug = favorite.dataset.favorite;
      state.favorites.has(slug) ? state.favorites.delete(slug) : state.favorites.add(slug);
      saveSet(keys.favorites, state.favorites); renderCards(); syncButtons(); return;
    }
    const read = event.target.closest('[data-read]');
    if (read) {
      event.preventDefault();
      const slug = read.dataset.read;
      state.read.has(slug) ? state.read.delete(slug) : state.read.add(slug);
      saveSet(keys.read, state.read); renderCards(); syncButtons(); return;
    }
    const tag = event.target.closest('[data-tag], [data-theme-tag]');
    if (tag) {
      state.tag = tag.dataset.tag || tag.dataset.themeTag;
      renderTags(); renderCards();
      document.querySelector('#archive')?.scrollIntoView({ behavior: 'smooth' }); return;
    }
    const saved = event.target.closest('[data-saved-filter]');
    if (saved) {
      state.savedOnly = !state.savedOnly;
      saved.classList.toggle('is-active', state.savedOnly);
      saved.setAttribute('aria-pressed', String(state.savedOnly)); renderCards(); return;
    }
    const random = event.target.closest('[data-random]');
    if (random && articles.length) {
      location.href = articleHref(articles[Math.floor(Math.random() * articles.length)].slug);
    }
  });

  document.querySelector('#archive-search')?.addEventListener('input', (event) => {
    state.query = event.target.value; renderCards();
  });

  const loadJson = (url) => fetch(url).then((response) => {
    if (!response.ok) throw new Error(`${url}を読み込めませんでした`);
    return response.json();
  });

  const initialData = articlePage
    ? Promise.all([loadJson(dataUrl), Promise.resolve(null)])
    : Promise.all([loadJson(dataUrl), loadJson(dailyUrl)]);

  initialData
    .then(([data, daily]) => {
      articles = data;
      if (!articlePage) {
        renderFeatured(articles.find((article) => article.featured === true));
        renderDailyMeta(daily);
      }
      renderTags(); renderCards(); renderCounts(); syncButtons();
    })
    .catch(() => {
      const container = document.querySelector('#article-list');
      if (container) container.innerHTML = '<div class="empty-state"><strong>記事一覧を読み込めませんでした</strong><p>ページを再読み込みしてください。</p></div>';
      const featured = document.querySelector('#featured-article');
      if (featured) featured.innerHTML = '<div class="empty-state"><strong>今日のおすすめを読み込めませんでした</strong><p>ページを再読み込みしてください。</p></div>';
      syncButtons();
    });
})();
