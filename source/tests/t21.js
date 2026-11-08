const T=require('./pw9.js');const {launch,ok,owner}=T;
(async()=>{
 const P0='data/users/uA/u/';const D=owner('uA');
 // a dish measured with kitchen measures; stock in grams and litres
 D[P0+'recipes/mtest']={name:'Måletest',kind:'hverdag',minutes:20,ing:[{n:'sukker',q:30,u:'ml'},{n:'mælk',q:150,u:'ml'},{n:'hvedemel',q:200,u:'ml'},{n:'olivenolie',q:30,u:'ml'},{n:'salt',q:5,u:'ml'}]};
 const {b,pg,errs}=await launch({uid:'uA',docs:D,wait:1500});const q=f=>pg.evaluate(f);
 const r=await q(()=>{const A=__TEST__.api;return{
   m:[5,10,15,30,45,50,75,100,150,250,1000,1500,2.5,7.5].map(x=>x+' ml → '+A.measureOf(x)).join(' | '),
   a:[['sukker',30],['mælk',150],['hvedemel',200],['olivenolie',30],['salt',5],['havregryn',100],['eddike',5]].map(([n,x])=>n+': '+A.amtTxt(n,x,'ml')).join(' | '),
   b:JSON.stringify([A.baseQU(2,'spsk'),A.baseQU(1.5,'dl'),A.baseQU(1,'tsk'),A.baseQU(0.5,'l'),A.baseQU(1.2,'kg')])}});
 console.log(r.m);console.log(r.a);console.log(r.b);
 ok(/1 tsk/.test(r.m)&&/2 spsk/.test(r.m)&&/1½ dl/.test(r.m)&&/½ tsk/.test(r.m),'Mål genkendes: tsk, spsk, dl, brøker');
 ok(/sukker: 26 g \(2 spsk\)/.test(r.a)&&/mælk: 0,15 l \(1½ dl\)/.test(r.a)&&/olivenolie: 0,03 l \(2 spsk\)/.test(r.a),'Visning: tørvarer i gram, væske i liter, opskriftens mål i parentes');
 // stock vs. need: sukker 10 g in stock, need 25.5 g -> on the shopping list; mælk 1 l in stock -> not
 const s=await q(()=>{const A=__TEST__.api,S=A.S,w=A.weekId(A.S.mon);
   const set=(k,qty)=>{const p=S.pantry.items[k]||S.praw[k];if(!p)return 'mangler '+k;p.qty=qty;p.use=0;p.min=0;p.rule='never';p.ex=true;return p.unit};
   const u1=set('sukker',10),u2=set('maelk',1000);
   S.plans[w]={week:w,days:[{r:'mtest'},null,null,null,null,null,null]};
   const need=A.aggNeeds(['mtest']),list=A.computeList(w);
   const f=k=>{const x=list.find(i=>i.k===k);return x?x.qty+' '+x.unit:'ikke på listen'};
   return{units:[u1,u2],need:Object.values(need).map(n=>n.k+' '+Math.round(n.need*10)/10+' '+n.unit).join(', '),sukker:f('sukker'),maelk:f('maelk'),mel:f('hvedemel')||f('mel')}});
 console.log(JSON.stringify(s));
 ok(/sukker 25.5 g/.test(s.need)&&/maelk 150 ml/.test(s.need),'Behov regnes i lagerets enhed (sukker i g, mælk i ml)');
 ok(s.sukker!=='ikke på listen'&&/g$/.test(s.sukker),'For lidt sukker på lager (10 g af 25,5 g) → sukker på indkøbslisten: '+s.sukker);
 ok(s.maelk==='ikke på listen','Nok mælk på lager (1 l af 0,15 l) → ikke på listen');
 ok(errs.length===0,'ingen JS-fejl '+errs.slice(0,2).join('|'));
 await b.close();T.done();
})();
