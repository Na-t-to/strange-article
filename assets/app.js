(() => {
  const articlePage = document.body.dataset.page === 'article';
  const noteScript = document.createElement('script');
  noteScript.src = articlePage ? '../assets/notes.js?v=20260904-2' : 'assets/notes.js?v=20260904-2';
  document.head.append(noteScript);
  const hrefFor = (slug) => articlePage ? `${slug}.html` : `articles/${slug}.html`;
  const keys = { favorites: 'sasu-favorites-v1', read: 'sasu-read-v1' };
  const getSet = (key) => { try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch { return new Set(); } };
  const putSet = (key, set) => { try { localStorage.setItem(key, JSON.stringify([...set])); } catch {} };
  const esc = (v) => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const state = { favorites:getSet(keys.favorites), read:getSet(keys.read), query:'', tag:'すべて', date:'すべて', savedOnly:false, sort:'publishedAt', direction:'desc', page:1, pageSize:25 };
  let articles = [];

  function syncButtons(){
    document.querySelectorAll('[data-favorite]').forEach((b)=>{ const on=state.favorites.has(b.dataset.favorite); b.classList.toggle('is-active',on); b.setAttribute('aria-pressed',String(on)); const l=b.querySelector('[data-label]'); if(l) l.textContent=on?'保存済み':'保存'; });
    document.querySelectorAll('[data-read]').forEach((b)=>{ const on=state.read.has(b.dataset.read); b.classList.toggle('is-active',on); b.setAttribute('aria-pressed',String(on)); const l=b.querySelector('[data-label]'); if(l) l.textContent=on?'既読':'未読'; });
    document.querySelectorAll('[data-saved-count]').forEach((n)=>n.textContent=String(state.favorites.size));
    document.querySelectorAll('[data-saved-wrap],[data-saved-utility]').forEach((n)=>n.hidden=state.favorites.size===0);
  }
  if(articlePage){ syncButtons(); return; }

  const filtered = () => {
    const q=state.query.trim().toLocaleLowerCase('ja');
    return articles.filter((a)=>{
      const text=[a.title,a.originalTitle,...(a.authors||[]),...(a.tags||[]),a.excerpt].join(' ').toLocaleLowerCase('ja');
      return (!q||text.includes(q))&&(state.tag==='すべて'||a.tags.includes(state.tag))&&(state.date==='すべて'||a.publishedAt===state.date)&&(!state.savedOnly||state.favorites.has(a.slug));
    });
  };
  function compare(a,b){ const av=state.sort==='tags'?a.tags.join('、'):a[state.sort]; const bv=state.sort==='tags'?b.tags.join('、'):b[state.sort]; if(av===bv)return 0; const r=typeof av==='number'?av-bv:String(av).localeCompare(String(bv),'ja'); return state.direction==='asc'?r:-r; }
  function row(a){ const r=state.read.has(a.slug); const author=a.authors.length>2?`${a.authors[0]} ほか${a.authors.length-1}名`:a.authors.join(' / '); return `<tr data-slug="${esc(a.slug)}" class="${r?'is-read':''}"><td class="date-cell">${esc(a.publishedAt)}</td><td class="title-cell"><a href="${esc(hrefFor(a.slug))}">${esc(a.title)}</a><span class="original-title">${esc(a.originalTitle)}</span><div class="row-actions"><button type="button" data-read="${esc(a.slug)}" aria-pressed="${r}">✓ <span data-label>${r?'既読':'未読'}</span></button><button type="button" data-favorite="${esc(a.slug)}" aria-pressed="${state.favorites.has(a.slug)}">♡ <span data-label>${state.favorites.has(a.slug)?'保存済み':'保存'}</span></button></div></td><td class="tag-cell">${a.tags.map((t)=>`<span>${esc(t)}</span>`).join('')}</td><td class="source-cell">${esc(author)}<br><span>${esc(a.year)}</span></td><td class="length-cell">${esc(a.readingMinutes)}分</td></tr>`; }
  function renderRows(){ const body=document.querySelector('#article-list'); if(!body)return; const list=filtered().sort(compare); document.querySelector('[data-result-count]')?.replaceChildren(`${list.length}本`); const pages=Math.max(1,Math.ceil(list.length/state.pageSize)); state.page=Math.min(state.page,pages); const visible=list.slice((state.page-1)*state.pageSize,state.page*state.pageSize); body.innerHTML=visible.map(row).join(''); const empty=document.querySelector('[data-empty-state]'); if(empty)empty.hidden=visible.length!==0; const nav=document.querySelector('[data-pagination]'); if(nav) nav.innerHTML=pages<=1?'':`<button type="button" data-page-action="prev" ${state.page===1?'disabled':''}>前へ</button><span>${state.page} / ${pages}</span><button type="button" data-page-action="next" ${state.page===pages?'disabled':''}>次へ</button>`; syncButtons(); }
  function renderFeatured(){ const c=document.querySelector('#featured-article'); if(!c)return; const a=articles.find((x)=>x.featured===true); if(!a){c.innerHTML='<p class="empty-state"><strong>今日は採用なし。</strong>前回の追加は一覧から確認できます。</p>';return;} const visual=a.image?`<figure class="entry-visual"><img src="${esc(a.image)}" alt="${esc(a.imageAlt||'')}" width="800" height="533"><figcaption>${esc(a.imageCaption||'図版：自動生成')}</figcaption></figure>`:''; c.innerHTML=`${visual}<div class="entry-copy"><p class="entry-label">追加日 ${esc(a.publishedAt)}</p><h2><a href="${esc(hrefFor(a.slug))}">${esc(a.title)}</a></h2><p class="original-title">${esc(a.originalTitle)}</p><p class="entry-excerpt">${esc(a.excerpt)}</p><div class="entry-meta"><span>${a.tags.map((t)=>`<span>${esc(t)}</span>`).join('')}</span><span>${esc(a.authors.join(' / '))} · ${esc(a.year)} · 読了 ${esc(a.readingMinutes)}分</span><span class="row-actions"><button type="button" data-read="${esc(a.slug)}"><span data-label></span></button><button type="button" data-favorite="${esc(a.slug)}"><span data-label></span></button></span></div></div>`; syncButtons(); }
  function renderFilters(){ const tags=['すべて',...new Set(articles.flatMap((a)=>a.tags))]; const dates=['すべて',...new Set(articles.map((a)=>a.publishedAt).sort().reverse())]; const ts=document.querySelector('#tag-filter'); if(ts)ts.innerHTML=tags.map((t)=>`<option value="${esc(t)}">${esc(t)}</option>`).join(''); const ds=document.querySelector('#date-filter'); if(ds)ds.innerHTML=dates.map((d)=>`<option value="${esc(d)}">${esc(d)}</option>`).join(''); }
  function renderDaily(d){ if(!d)return; const raw=String(d.lastUpdated||`${d.date||''} 10:00`); const stamp=raw.length>=16?raw.slice(0,16).replace('T',' '):raw; document.querySelectorAll('[data-run-summary]').forEach((n)=>n.textContent=`自動収集 / 最終実行 ${stamp} / 候補${d.candidateCount??0}件・採用${d.adoptedCount??0}件`); document.querySelectorAll('[data-collection-note]').forEach((n)=>n.textContent=d.collectionNote||''); const tracks=(d.selectionTracks||[]).map((tr,i)=>`<section class="criteria-track"><h3>${i+1}. ${esc(tr.title)}</h3><p>${esc(tr.summary||'')}</p><ul>${(tr.criteria||[]).map((x)=>`<li>${esc(x)}</li>`).join('')}</ul></section>`).join(''); const rule=d.adoptionRule?`<p class="adoption-rule"><strong>採用条件</strong>${esc(d.adoptionRule)}</p>`:''; document.querySelectorAll('[data-selection-criteria]').forEach((n)=>n.innerHTML=tracks+rule); }
  function render(){ renderFilters(); renderRows(); renderFeatured(); }

  document.addEventListener('click',(e)=>{ const f=e.target.closest('[data-favorite]'); if(f){e.preventDefault(); const s=f.dataset.favorite; state.favorites.has(s)?state.favorites.delete(s):state.favorites.add(s); putSet(keys.favorites,state.favorites); renderRows(); renderFeatured(); return;} const r=e.target.closest('[data-read]'); if(r){e.preventDefault(); const s=r.dataset.read; state.read.has(s)?state.read.delete(s):state.read.add(s); putSet(keys.read,state.read); renderRows(); renderFeatured(); return;} const so=e.target.closest('[data-sort-key]'); if(so){const k=so.dataset.sortKey;if(state.sort===k)state.direction=state.direction==='asc'?'desc':'asc';else{state.sort=k;state.direction=(k==='title'||k==='tags')?'asc':'desc';}state.page=1;renderRows();return;} const p=e.target.closest('[data-page-action]');if(p){state.page+=p.dataset.pageAction==='next'?1:-1;renderRows();return;} const sf=e.target.closest('[data-saved-filter]');if(sf){state.savedOnly=!state.savedOnly;state.page=1;renderRows();return;} });
  document.querySelector('#archive-search')?.addEventListener('input',(e)=>{state.query=e.target.value;state.page=1;renderRows();});
  document.querySelector('#tag-filter')?.addEventListener('change',(e)=>{state.tag=e.target.value;state.page=1;renderRows();});
  document.querySelector('#date-filter')?.addEventListener('change',(e)=>{state.date=e.target.value;state.page=1;renderRows();});

  const getJson=async(path,fallback=[])=>{try{const r=await fetch(path,{cache:'no-store'});return r.ok?await r.json():fallback;}catch{return fallback;}};
  (async()=>{
    const paths=['data/additions-2026-09-24.json','data/additions-2026-09-23.json','data/additions-2026-09-21.json','data/additions-2026-09-20.json','data/additions-2026-09-19.json','data/additions-2026-09-12.json','data/additions.json','data/articles.json'];
    const [feeds,daily]=await Promise.all([Promise.all(paths.map((p)=>getJson(p,[]))),getJson('data/daily-current.json',null)]);
    const seen=new Set(); articles=feeds.flat().filter((a)=>a&&a.slug&&!seen.has(a.slug)&&seen.add(a.slug));
    if(!articles.length){try{articles=JSON.parse(document.querySelector('#article-data')?.textContent||'[]');}catch{articles=[];}}
    renderDaily(daily); render();
  })();
})();