const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {validate}=require('../scripts/validate.cjs');const root=path.resolve(__dirname,'..');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/articles.json')));const daily=JSON.parse(fs.readFileSync(path.join(root,'data/daily.json')));const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const check=(changes={})=>validate({catalog,daily,html,exists:()=>true,...changes});
test('canonical catalog and static index agree',()=>assert.deepEqual(check().errors,[]));
test('duplicate slugs are rejected',()=>assert(check({catalog:[...catalog,catalog[0]]}).errors.some(e=>e.includes('duplicate'))));
test('missing image blocks publishing',()=>assert(check({exists:p=>!p.startsWith('assets/')}).errors.some(e=>e.includes('missing image'))));
test('multiple featured entries rejected',()=>assert(check({catalog:catalog.map(a=>({...a,featured:true}))}).errors.some(e=>e.includes('featured'))));
test('stale static catalog rejected',()=>assert(check({html:html.replace('id="article-data"','id="stale-data"')}).errors.some(e=>e.includes('stale'))));
test('mismatched adopted count rejected',()=>assert(check({daily:{...daily,adoptedCount:99}}).errors.some(e=>e.includes('adopted count'))));
test('malformed source rejected',()=>assert(check({catalog:catalog.map((a,i)=>i?a:{...a,sourceUrl:'javascript:bad'})}).errors.some(e=>e.includes('source URL'))));

test('mismatched social image rejected',()=>assert(check({readArticle:slug=>fs.readFileSync(path.join(root,'articles',slug+'.html'),'utf8').replaceAll('og:image','og:old-image')}).errors.some(e=>e.includes('og:image'))));

test('runtime reads only canonical feeds and preserves reader storage',()=>{const app=fs.readFileSync(path.join(root,'assets/app.js'),'utf8');assert(!app.includes('data/additions'));assert(!app.includes('daily-current.json'));assert(app.includes("'sasu-favorites-v1'"));assert(app.includes("'sasu-read-v1'"));assert(app.includes("getJson('data/articles.json',null)"));});

test('truncated existing WebP detected even when file exists',()=>{const {validateImageData}=require('../scripts/validate.cjs');const b=Buffer.alloc(20);b.write('RIFF');b.writeUInt32LE(40,4);b.write('WEBP',8);assert(validateImageData(b,'test.webp').includes('Truncated'));});
