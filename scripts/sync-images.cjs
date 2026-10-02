const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname,'..');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/articles.json'),'utf8'));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
let changed=0;
for(const a of catalog){
 const file=path.join(root,'articles',a.slug+'.html');let html=fs.readFileSync(file,'utf8');const old=html;
 const url='https://na-t-to.github.io/strange-article/'+a.image;
 const metas=[['property','og:image',url],['name','twitter:card','summary_large_image'],['name','twitter:image',url]];
 for(const [key,name,value] of metas){
  const re=new RegExp(`<meta\\b(?=[^>]*(?:property|name)=["']${name}["'])[^>]*>`,'gi');
  const tag=`<meta ${key}="${name}" content="${esc(value)}">`;
  if(re.test(html)){re.lastIndex=0;html=html.replace(re,tag);}else html=html.replace('</head>',tag+'\n</head>');
 }
 html=html.replace(/(<figure\b[^>]*class="[^"]*article-visual[^\"]*"[^>]*>[\s\S]*?<img\b)([^>]*)(>)/,(match,start,attrs,end)=>start+attrs.replace(/\bsrc="[^"]*"/,`src="../${a.image}"`).replace(/\balt="[^"]*"/,`alt="${esc(a.imageAlt)}"`)+end);
 if(html!==old){fs.writeFileSync(file,html);changed++;}
}
console.log(`Synchronized adopted images in ${changed} articles`);
