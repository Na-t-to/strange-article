// Bounded serialization for GitHub connector uploads. This script never publishes.
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const MAX_CHARS=350000;
function exportBlob(bytes,{offset=0,limit=MAX_CHARS}={}){
 if(!Number.isSafeInteger(offset)||offset<0||!Number.isSafeInteger(limit)||limit<1||limit>MAX_CHARS)throw new Error('Invalid offset or chunk limit');
 const encoded=bytes.toString('base64');if(offset>encoded.length)throw new Error('Offset exceeds encoded length');
 const end=Math.min(offset+limit,encoded.length);
 return {bytes:bytes.length,gitBlobSha:crypto.createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex'),sha256:crypto.createHash('sha256').update(bytes).digest('hex'),encoding:'base64',offset,end,totalCharacters:encoded.length,content:encoded.slice(offset,end)};
}
module.exports={exportBlob};
if(require.main===module){
 const root=path.resolve(__dirname,'..'),relative=process.argv[2];
 if(!relative||path.isAbsolute(relative)||relative.split(/[\\/]/).includes('..'))throw new Error('Pass one repository-relative file path');
 const file=fs.realpathSync(path.join(root,relative));if(!file.startsWith(root+path.sep))throw new Error('File is outside repository');
 const result=exportBlob(fs.readFileSync(file),{offset:Number(process.argv[3]??0),limit:Number(process.argv[4]??MAX_CHARS)});
 console.log(JSON.stringify({path:relative,...result}));
}
