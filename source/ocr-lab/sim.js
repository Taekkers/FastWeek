// simulate the new readRecipe flow with the tesseract CLI
const {execFileSync}=require('child_process'),fs=require('fs'),path=require('path');
const O=require('./ocr_new.js');const dir=process.argv[2],GT=process.argv[3],outdir=process.argv[4];
const gt=JSON.parse(fs.readFileSync(GT));fs.mkdirSync(outdir,{recursive:true});
const known=O.commonKnown([]);
const tes=(f,psm)=>{const t=execFileSync('tesseract',[f,'-','-l','eng','--psm',String(psm)],{encoding:'utf8',stdio:['ignore','pipe','ignore']});
  const tsv=execFileSync('tesseract',[f,'-','-l','eng','--psm',String(psm),'tsv'],{encoding:'utf8',stdio:['ignore','pipe','ignore']});
  const cs=tsv.split('\n').slice(1).map(l=>l.split('\t')).filter(c=>c.length>11&&c[11].trim()&&+c[10]>=0).map(c=>+c[10]);
  return{text:t,conf:cs.length?cs.reduce((a,b)=>a+b,0)/cs.length:0}};
let stats={rot:0,p11:0};
gt.forEach((g,i)=>{
  const f=r=>path.join(dir,`p${i}_r${r}.png`);
  let r0=tes(f(0),6),q0=O.quality(r0.text,r0.conf,known),best={q:q0,r:r0,rot:0};
  let r3=null;
  if(q0<300){r3=tes(f(0),3);const q3=O.quality(r3.text,r3.conf,known);best.q=Math.max(q0,q3);
    if(best.q<300){for(const rot of [90,270,180]){const r=tes(f(rot),6),q=O.quality(r.text,r.conf,known);if(q>=300&&q>best.q+150){best={q,r,rot};r3=null}}}}
  if(best.rot)stats.rot++;
  const mine=[best.r.text];mine.push(r3&&!best.rot?r3.text:tes(f(best.rot),3).text);
  if(O.parseMulti(mine,known).ingredients.length<8){mine.push(tes(f(best.rot),11).text);stats.p11++}
  fs.writeFileSync(path.join(outdir,`p${i}.txt`),mine.join('\n@@PASS@@\n'));
});
console.log(JSON.stringify(stats));
