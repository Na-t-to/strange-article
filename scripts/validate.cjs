const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
function validateImageData(bytes, filename) {
 if(filename.endsWith('.webp')){
  if(bytes.length<12||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')return 'Invalid WebP header';
  if(bytes.readUInt32LE(4)+8!==bytes.length)return `Truncated/invalid WebP: header declares ${bytes.readUInt32LE(4)+8} bytes, actual ${bytes.length}`;
 }
 if(filename.endsWith('.png')){
  if(bytes.length<20||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')return 'Invalid PNG header';
  let pos=8;let ended=false;
  while(pos+12<=bytes.length){const n=bytes.readUInt32BE(pos);const type=bytes.toString('ascii',pos+4,pos+8);pos+=n+12;if(pos>bytes.length)return 'Truncated PNG chunk';if(type==='IEND'){ended=true;break;}}
  if(!ended||pos!==bytes.length)return 'Invalid PNG ending';
 }
 return null;
}
function validate({exists=(p)=>fs.existsSync(path.join(root,p)),catalog,daily,html,readArticle=(slug)=>fs.readFileSync(path.join(root,'articles',slug+'.html'),'utf8'),readAsset=(p)=>fs.readFileSync(path.join(root,p))}={}) {
 const articles=catalog??JSON.parse(fs.readFileSync(path.join(root,'data/articles.json'),'utf8'));
 daily??=JSON.parse(fs.readFileSync(path.join(root,'data/daily.json'),'utf8'));
 html??=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const errors=[];const warnings=[];const slugs=new Set();
 for(const a of articles){
  const validSlug=/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a.slug);
  if(!validSlug||slugs.has(a.slug))errors.push(`Invalid/duplicate slug: ${a.slug}`);slugs.add(a.slug);
  for(const k of ['title','originalTitle','publishedAt','sourceUrl','image','imageAlt'])if(typeof a[k]!=='string'||!a[k].trim())errors.push(`${a.slug}: missing ${k}`);
  if(!Array.isArray(a.authors)||!a.authors.length||!Array.isArray(a.tags)||!a.tags.length)errors.push(`${a.slug}: missing authors/tags`);
  if(!Number.isFinite(a.readingMinutes)||a.readingMinutes<=0)errors.push(`${a.slug}: invalid readingMinutes`);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(a.publishedAt))errors.push(`${a.slug}: invalid date`);
  if(!/^https:\/\//.test(a.sourceUrl))errors.push(`${a.slug}: invalid source URL`);
  const validImage=/^assets\/[a-z0-9._-]+\.(?:webp|png|jpg|jpeg|svg)$/i.test(a.image);
  if(!validImage)errors.push(`${a.slug}: invalid image path`);
  if(!exists(`articles/${a.slug}.html`))errors.push(`${a.slug}: missing article`);
  if(!exists(a.image))errors.push(`${a.slug}: missing image ${a.image}`);
  else if(validImage) {const issue=validateImageData(readAsset(a.image),a.image);if(issue)errors.push(`${a.slug}: ${issue}`);}
  if(validSlug&&exists(`articles/${a.slug}.html`)){
   const page=readArticle(a.slug);const expected='https://na-t-to.github.io/strange-article/'+a.image;
   for(const name of ['og:image','twitter:image']){
    const tag=page.match(new RegExp(`<meta\\b(?=[^>]*(?:property|name)=["']${name}["'])[^>]*>`,'i'));
    if(!tag||!tag[0].includes(`content="${expected}"`))errors.push(`${a.slug}: ${name} differs from adopted image`);
   }
   const body=page.match(/<figure\b[^>]*class="[^"]*article-visual[^"]*"[^>]*>[\s\S]*?<img\b[^>]*>/);
   if(!body||!body[0].includes(`src="../${a.image}"`))errors.push(`${a.slug}: body image differs from adopted image`);
  }
 }
 const featured=articles.filter(a=>a.featured===true);
 if(featured.length!==(daily.adoptedCount>0?1:0))errors.push(`Expected ${daily.adoptedCount>0?1:0} featured article; got ${featured.length}`);
 if(featured.some(a=>a.publishedAt!==daily.date))errors.push('Featured date differs from daily date');
 const count=articles.filter(a=>a.publishedAt===daily.date).length;
 if(daily.adoptedCount!==count)errors.push(`Daily adopted count ${daily.adoptedCount} differs from ${count} dated articles`);
 if(!Number.isInteger(daily.candidateCount)||daily.candidateCount<daily.adoptedCount)errors.push('Invalid candidateCount');
 const embedded=html.match(/<script type="application\/json" id="article-data">([\s\S]*?)<\/script>/);
 if(!embedded||JSON.stringify(JSON.parse(embedded[1]))!==JSON.stringify(articles))errors.push('Static embedded catalog is stale');
 const staticSlugs=[...html.matchAll(/<tr data-slug="([^"]+)"/g)].map(m=>m[1]);
 if(staticSlugs.length!==articles.length||articles.some(a=>!staticSlugs.includes(a.slug)))errors.push('Static table differs from catalog');
 return {errors,warnings,articles:articles.length};
}
module.exports={validate,validateImageData};
if(require.main===module){const result=validate();console.log(JSON.stringify(result,null,2));if(result.errors.length)process.exitCode=1;}
