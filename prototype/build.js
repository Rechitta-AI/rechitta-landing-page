const fs=require('fs');
let tpl=fs.readFileSync('template.html','utf8');
const ta=fs.readdirSync('ta').sort().map(f=>'data:image/webp;base64,'+fs.readFileSync('ta/'+f).toString('base64'));
const stills={
  kf1:'data:image/webp;base64,'+fs.readFileSync('stills/KF1.webp').toString('base64'),
  kf3:'data:image/webp;base64,'+fs.readFileSync('stills/KF3.webp').toString('base64'),
  kf4:'data:image/webp;base64,'+fs.readFileSync('stills/KF4.webp').toString('base64'),
  kf5:'data:image/webp;base64,'+fs.readFileSync('stills/KF5.webp').toString('base64'),
  kf6:'data:image/webp;base64,'+fs.readFileSync('stills/KF-06.webp').toString('base64'),
  hand:'data:image/webp;base64,'+fs.readFileSync('plates/hand-cutout.webp').toString('base64'),
};
const plateNames=['mumbai','moscow','london','shanghai','riyadh','paris'];
const plates={};
plateNames.forEach(k=>{const p='plates/'+k+'.webp';
  if(fs.existsSync(p)) plates[k]='data:image/webp;base64,'+fs.readFileSync(p).toString('base64');});
const rt=fs.readFileSync('runtime.js').toString('base64');
let out=tpl.replace('"__TA__"',JSON.stringify(ta)).replace('"__STILLS__"',JSON.stringify(stills)).replace('"__PLATES__"',JSON.stringify(plates));
out=out.split('__RUNTIME__').join(rt);
// Output next to the sources so runtime.js is a real sibling file when served
// over HTTP (the runtime import prefers './runtime.js' — chunk-safe, see template).
fs.writeFileSync(__dirname+'/rechitta-scroll-prototype.html',out);
console.log('plates embedded:',Object.keys(plates).join(', ')||'none (gradient fallbacks)');
console.log('built:',(out.length/1048576).toFixed(2)+'MB','| TA frames:',ta.length,'| runtime embedded:',(rt.length/1048576).toFixed(2)+'MB b64');
