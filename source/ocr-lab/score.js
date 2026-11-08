// node score.js <variant-dir> [ocrmodule]
const fs=require('fs'),path=require('path');
const O=require(path.resolve(process.argv[3]||'./ocr_cur.js'));
const dir=process.argv[2];
const GT=process.env.GT||'pages/gt.json';const gt=JSON.parse(fs.readFileSync(GT,'utf8'));
const known=['kyllingebryst','løg','hvidløg','karry','kokosmælk','ris','mælk','olie','salt','persille','gulerødder','hakket oksekød','tomatpuré','spidskommen','vand','peberfrugt','majs','chiliflager','pasta','spinat','feta','citron','olivenolie','pinjekerner','fløde','muskatnød','parmesan','laksfilet','kartofler','dild','smør','cremefraiche','squash','sennep','honning','hakket svinekød','æg','æble','mel','bouillon','piskefløde','banan','porre','blomkål','selleri','hønsebouillon','rugbrød','hakkede tomater','kidneybønner'];
const L=O.loose;
let tot={n:0,name:0,qty:0,extra:0,found:0};
const rows=[];
gt.forEach((g,i)=>{
  const f=path.join(dir,'p'+i+'.txt');if(!fs.existsSync(f))return;
  const txt=fs.readFileSync(f,'utf8');
  const kn=process.env.NOKNOWN?null:(process.env.COMMON?O.commonKnown([]):(O.commonKnown?O.commonKnown(known):known));const parts=txt.split('@@PASS@@');const out=(O.parseMulti&&!process.env.SIMPLE)?O.parseMulti(parts,kn):O.parseText(txt.replace(/@@PASS@@/g,''),kn);
  const exp=g.ings.map(s=>O.parseLine(s)).filter(Boolean);       // ingredients the parser can express (with amount)
  const expNoQ=g.ings.filter(s=>!O.parseLine(s)).length;
  let nm=0,qy=0;const used={};
  exp.forEach(e=>{
    const hit=out.ingredients.find(o=>!used[o.n]&&(L(o.n)===L(e.n)||(L(o.n).length>=5&&L(e.n).length>=5&&(L(o.n).includes(L(e.n))||L(e.n).includes(L(o.n))))));
    if(hit){used[hit.n]=1;nm++;if(Math.abs(hit.q-e.q)<=0.01*Math.max(1,e.q)&&hit.u===e.u)qy++}
  });
  const extra=out.ingredients.filter(o=>!used[o.n]).length;
  rows.push([path.basename(g.file),exp.length,nm,qy,extra,out.name===g.title?'T':'-',out.ingredients.length]);
  tot.n+=exp.length;tot.name+=nm;tot.qty+=qy;tot.extra+=extra;
});
rows.forEach(r=>console.log(r[0].padEnd(24),'forventet',r[1],'navn ok',r[2],'mængde ok',r[3],'ekstra',r[4],'titel',r[5],'fundet',r[6]));
console.log('I ALT: navn',(100*tot.name/tot.n).toFixed(0)+'%','mængde',(100*tot.qty/tot.n).toFixed(0)+'%','ekstra linjer',tot.extra);
