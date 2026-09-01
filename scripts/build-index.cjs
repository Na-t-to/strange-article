const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const articles = JSON.parse(fs.readFileSync(path.join(root, 'data/articles.json'), 'utf8'));
const daily = JSON.parse(fs.readFileSync(path.join(root, 'data/daily.json'), 'utf8'));
const esc = (v) => String(v ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
const rawStamp = String(daily.lastUpdated || `${daily.date} 10:00`);
const stamp = rawStamp.length >= 16 ? rawStamp.slice(0, 16).replace('T', ' ') : rawStamp;
const run = `自動収集 / 最終実行 ${stamp} / 候補${daily.candidateCount ?? 0}件・採用${daily.adoptedCount ?? 0}件`;

function todayBlock() {
  const article = articles.find((item) => item.featured === true);
  if (!article) return '<p class="empty-state"><strong>今日は採用なし。</strong>前回の追加は一覧から確認できます。</p>';
  const visual = article.image ? `<figure class="entry-visual"><img src="${esc(article.image)}" alt="${esc(article.imageAlt || '')}" width="1536" height="1024"><figcaption>${esc(article.imageCaption || '')}</figcaption></figure>` : '';
  return `${visual}<div class="entry-copy"><p class="entry-label">追加日 ${esc(article.publishedAt)}</p><h2><a href="articles/${esc(article.slug)}.html">${esc(article.title)}</a></h2><p class="original-title">${esc(article.originalTitle)}</p><p class="entry-excerpt">${esc(article.excerpt)}</p><div class="entry-meta"><span>${article.tags.map((tag) => `<span>${esc(tag)}</span>`).join('')}</span><span>${esc(article.authors.join(' / '))} · ${esc(article.year)} · 読了 ${esc(article.readingMinutes)}分</span><span class="row-actions"><button type="button" data-read="${esc(article.slug)}" aria-pressed="false">✓ <span data-label>未読</span></button><button type="button" data-favorite="${esc(article.slug)}" aria-pressed="false">♡ <span data-label>保存</span></button></span></div></div>`;
}

function tableBlock() {
  const rows = [...articles].sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)) || String(a.title).localeCompare(String(b.title), 'ja'));
  const body = rows.map((article) => `<tr data-slug="${esc(article.slug)}"><td class="date-cell">${esc(article.publishedAt)}</td><td class="title-cell"><a href="articles/${esc(article.slug)}.html">${esc(article.title)}</a><span class="original-title">${esc(article.originalTitle)}</span><div class="row-actions"><button type="button" data-read="${esc(article.slug)}" aria-pressed="false">✓ <span data-label>未読</span></button><button type="button" data-favorite="${esc(article.slug)}" aria-pressed="false">♡ <span data-label>保存</span></button></div></td><td class="tag-cell">${article.tags.map((tag) => `<span>${esc(tag)}</span>`).join('')}</td><td class="source-cell">${esc(article.authors.join(' / '))}<br><span>${esc(article.year)}</span></td><td class="length-cell">${esc(article.readingMinutes)}分</td></tr>`).join('');
  return `<div class="table-wrap"><table class="archive-table"><thead><tr><th><button type="button" data-sort-key="publishedAt">追加日</button></th><th><button type="button" data-sort-key="title">タイトル</button></th><th><button type="button" data-sort-key="tags">分野</button></th><th><button type="button" data-sort-key="year">出典・年</button></th><th><button type="button" data-sort-key="readingMinutes">分量</button></th></tr></thead><tbody id="article-list">${body}</tbody></table></div>`;
}

function replaceBetween(source, start, end, value) {
  const a = source.indexOf(start); const b = source.indexOf(end);
  if (a < 0 || b < 0 || b < a) throw new Error(`marker not found: ${start}`);
  return `${source.slice(0, a + start.length)}\n${value}\n${source.slice(b)}`;
}

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = replaceBetween(html, '<!-- GENERATED:today:start -->', '<!-- GENERATED:today:end -->', todayBlock());
html = replaceBetween(html, '<!-- GENERATED:table:start -->', '<!-- GENERATED:table:end -->', tableBlock());
html = html.replace(/<p class="issue-date" data-issue-date>.*?<\/p>/, `<p class="issue-date" data-issue-date>最終更新 ${esc(stamp)}</p>`);
html = html.replace(/<time data-issue-heading[^>]*>.*?<\/time>/, `<time data-issue-heading datetime="${esc(daily.lastUpdated || daily.date)}">最終更新 ${esc(stamp)}</time>`);
html = html.replace(/<span data-result-count>.*?<\/span>/, `<span data-result-count>全${articles.length}本</span>`);
html = html.replace(/<p data-collection-note>.*?<\/p>/, `<p data-collection-note>${esc(daily.collectionNote || '')}</p>`);
html = html.replace(/<ul data-selection-criteria>.*?<\/ul>/s, `<ul data-selection-criteria>${(daily.selectionCriteria || []).map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`);
html = html.replace(/<p data-run-summary>.*?<\/p>/g, `<p data-run-summary>${esc(run)}</p>`);
html = html.replace(/<p data-footer-run>.*?<\/p>/, `<p data-footer-run>${esc(run)}</p>`);
fs.writeFileSync(path.join(root, 'index.html'), html);
console.log(`built index: ${articles.length} articles, ${daily.adoptedCount ?? 0} adopted`);
