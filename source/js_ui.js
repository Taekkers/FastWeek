
/* ---------- rendering ---------- */
function render(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;draw()})}
function banner(){
  var b='';
  if(S.nodb)b+='<div class="banner warn">'+(window.UGEKURV_WEB?'Ingen forbindelse til databasen. Tjek nettet og åbn appen igen.':'Appen kan ikke gemme data her. Åbn den i Claude og log ind.')+'</div>';
  else if(S.slow&&!S.ready.pantry)b+='<div class="banner warn">Kan ikke nå databasen endnu. Data vises, når forbindelsen er tilbage.</div>';
  if(S.ro)b+='<div class="banner warn">Du kan kun se data. Bed ejeren give dig adgang som Contributor, så du kan lave din egen ugeplan.</div>';
  if(S.settings.example)b+='<div class="banner"><span>Eksempeldata. Ryd, når dine egne er lagt ind.</span><button class="btn ghost sm" data-act="clearex">Ryd</button></div>';
  return b;
}
function draw(){
  var f={week:viewWeek,stock:viewStock,shop:viewShop}[S.tab]||viewWeek;
  var oc=$('#view').querySelector('.stores'),ol=oc?oc.scrollLeft:0;
  $('#view').innerHTML=banner()+f();
  var nc=$('#view').querySelector('.stores');
  if(nc){var on=nc.querySelector('.sto[aria-pressed="true"]');
    if(on&&S.shownSel!==S.sel){nc.scrollLeft=Math.max(0,on.offsetLeft-nc.offsetLeft-(nc.clientWidth-on.offsetWidth)/2)}else nc.scrollLeft=ol;
    S.shownSel=S.sel}
  var cu=$('#cur');if(cu)cu.textContent={week:'Ugeplan',stock:'Lager',shop:'Indkøb'}[S.tab]||'Ugeplan';
}
function weekNav(){
  var w=isoWeek(S.mon),a=parseYmd(S.mon),b=parseYmd(addDays(S.mon,6));
  var rng=a.getUTCMonth()===b.getUTCMonth()?a.getUTCDate()+'.–'+b.getUTCDate()+'. '+MON[b.getUTCMonth()]:a.getUTCDate()+'. '+MON[a.getUTCMonth()]+' – '+b.getUTCDate()+'. '+MON[b.getUTCMonth()];
  var cur=mondayOf(todayStr()),tag=S.mon===cur?' · denne uge':S.mon===addDays(cur,7)?' · næste uge':'';
  return '<div class="wnav"><button class="x" data-act="wk" data-d="-1" aria-label="Forrige uge">‹</button><div class="c"><div class="wt">Uge '+w[1]+'</div><div class="wr">'+rng+tag+'</div></div><button class="x" data-act="wk" data-d="1" aria-label="Næste uge">›</button></div>';
}
function safeUrl(u){u=String(u||'').trim();return /^https?:\/\/[^\s"'<>]+$/i.test(u)?u:''}
function srcHost(u){return safeUrl(u).replace(/^https?:\/\/(www\.)?/i,'').split('/')[0]}
function kcTxt(r){var k=kcalOf(r);return k.k>KALLOW+5?'ca. '+k.k+' kcal':''}
function recMeta(r,withKc){var m=[];if(r.minutes)m.push(r.minutes+' min');if(r.book)m.push(esc(r.book));if(withKc){var k=kcTxt(r);if(k)m.push(k)}return m.join(' · ')}
function dayName(d){if(d.f){var fp=pan(d.f);return fp?fp.name:'Rest fra fryseren'}var r=d.r&&S.recipes[d.r];return r?r.name:''}
function artBox(r,id,cls){return '<span class="art'+(cls?' '+cls:'')+'">'+artHtml(r,id,cls==='wide')+'</span>'}

/* --- Ugeplan --- */
function stockCardHtml(w){
  var ids=planIds(w,true);if(!ids.length)return '';
  var su=stockUse(ids,ctxFor(w).exp);
  var us=su.used.slice().sort(function(a,b){return (b.urgent?1:0)-(a.urgent?1:0)||b.fr-a.fr}).slice(0,7),h='';
  if(us.length)h+='<div class="sline"><span class="slbl">Bruger fra lageret</span>'+us.map(function(x){return '<span class="chip'+(x.urgent?'':' ex')+'">'+esc(x.name)+'</span>'}).join('')+'</div>';
  var lf=su.left.filter(function(x){return x.urgent}).slice(0,5);
  if(lf.length)h+='<div class="sline"><span class="slbl">Skal bruges snart</span>'+lf.map(function(x){return '<span class="chip warn">'+esc(x.name)+'</span>'}).join('')+'</div>';
  return h?'<div class="stockuse">'+h+'</div>':'';
}
function wishesHtml(w){
  var sv=S.prefs[w];
  if(!sv||!sv.done)return '<button class="ask" data-act="wizard"><span class="ask-t"><b>Planlæg ugen</b><span>Efter tilbud eller egne valg</span></span><span class="ask-go" aria-hidden="true">›</span></button>';
  var P=getPrefs(w),self=P.mode==='self',bits=self?[]:prefsSummary(P);
  return '<div class="wishes"><span class="chip pm">'+(self?'Egne valg':'Efter tilbud')+'</span>'+bits.map(function(b){return '<span class="chip">'+esc(b)+'</span>'}).join('')+'<button class="edit-w" data-act="wizard">Ændr</button></div>';
}
function offerStat(w){var o=activeOffers(w),st={};o.forEach(function(x){st[x.store]=1});var n=Object.keys(st).length;return o.length?o.length+' tilbud hos '+n+(n===1?' butik':' butikker'):'Ingen tilbud hentet endnu'}
function offerPlanHtml(w,P){
  if(P.mode!=='offers')return '';
  if(!activeOffers(w).length)return '<div class="offcard none"><b>Ingen tilbud for ugen</b><span>Planen følger lager og ønsker. Tilbud hentes hver uge.</span></div>';
  var items=computeList(w);if(!items.length)return '';
  var sc=storeCosts(items,w);if(!(sc.norm>0))return '';
  var op=shopOptions(sc),rec=op.opts[op.rec],per={},sv=0;
  items.forEach(function(it){
    var key=it.k+'_'+it.unit,s=rec.assign?rec.assign[key]:rec.stores[0],ln=s&&sc.stores[s]&&sc.stores[s].lines[key];
    if(ln&&ln.via){(per[s]=per[s]||[]).push(it.name);sv+=Math.max(0,ln.norm-ln.cost)}
  });
  var ss=rec.stores.filter(function(x){return per[x]});
  if(!ss.length)return '<div class="offcard none"><b>Ingen tilbud passer til ugens retter</b><span>Tryk Lav ny plan for at prøve en anden sammensætning.</span></div>';
  return '<div class="offcard"><div class="oc-h"><b>Tilbud i planen</b><span class="oc-v">spar ca. '+kr(Math.round(sv))+'</span></div>'+
    ss.map(function(x){var a=per[x];return '<div class="oc-r"><b>'+esc(x)+'</b><span>'+esc(a.slice(0,6).join(', '))+(a.length>6?' +'+(a.length-6):'')+'</span></div>'}).join('')+
    '<button class="lnk" data-act="tab" data-tab="shop">Se indkøbslisten</button></div>';
}
function fanHtml(){
  var seen={},arts=[];
  Object.keys(S.recipes).sort().forEach(function(id){var r=S.recipes[id],k=artKey(r).k;if(arts.length<3&&!seen[k]&&!imgSrc(r)){seen[k]=1;arts.push(artBox(r,id))}});
  return arts.length?'<div class="fan">'+arts.join('')+'</div>':'';
}
function loFrom(d,i){var f=d.from!=null?d.from:i-1;return f<0?'søndag':DAYS[f].toLowerCase()}
var BOOK='<svg viewBox="0 0 24 24"><path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10"/></svg>';
function dietChip(r){
  if(!r)return '';var b=recBad(r),o='';
  if(b.length)o+='<span class="chip off">⚠ '+esc(b.map(function(k){return ALG[k].n}).join(', '))+'</span>';
  if(S.settings.veg&&!isVeg(r))o+='<span class="chip off">Ikke vegetar</span>';
  return o;
}
function dayRow(i,d,t,P){
  d=d||{};var date=addDays(S.mon,i),dd=parseYmd(date).getUTCDate(),dl=DS[i]+' '+dd+'.';
  var r=d.r&&S.recipes[d.r];
  if(d.off)return '<div class="dc none'+(date===t?' today':'')+'"><button class="dc-main" data-act="pick" data-i="'+i+'"><span class="art">'+PLATE+'</span><span class="dc-t"><span class="dc-d">'+dl+'</span><span class="dc-n muted">Ude eller ingen mad</span><span class="dc-m">Tryk for at vælge en ret</span></span></button><div class="dc-a"></div></div>';
  var cls='dc'+(isWeekend(i)?' wk':'')+(d.done?' done':'')+(date===t?' today':'')+(d.lo?' lo':'');
  if(!(r||d.f))return '<div class="dc none'+(date===t?' today':'')+'"><button class="dc-main" data-act="pick" data-i="'+i+'"><span class="art">'+PLATE+'</span><span class="dc-t"><span class="dc-d">'+dl+'</span><span class="dc-n muted">Vælg ret</span></span></button><div class="dc-a"></div></div>';
  var meta=d.lo?'Rester fra '+loFrom(d,i):d.f?'Fra fryseren':recMeta(r,P.low);
  var chips=(d.dbl?'<span class="chip">Dobbelt</span>':'')+(d.lo?'<span class="chip ex">Rester</span>':'')+(r&&r.fav?'<span class="hrt" aria-label="Favorit">♥</span>':'')+(r&&!d.lo?dietChip(r):'');
  var rate='';
  var art=d.f?artBox({name:'frost',ing:[]},'f'):artBox(r,d.r);
  var sec='';
  if(r&&!d.lo){
    if(r.method)sec='<button class="ol" data-act="cook" data-id="'+esc(d.r)+'" aria-label="Se opskriften">'+BOOK+'</button>';
    else if(safeUrl(r.url))sec='<a class="ol" href="'+esc(safeUrl(r.url))+'" target="_blank" rel="noopener noreferrer" aria-label="Åbn opskriften på '+esc(srcHost(r.url))+'">'+LINK+'</a>';
  }
  return '<div class="'+cls+'"><button class="dc-main" data-act="pick" data-i="'+i+'">'+art+'<span class="dc-t"><span class="dc-d">'+dl+chips+'</span><span class="dc-n">'+esc(dayName(d))+'</span>'+(meta?'<span class="dc-m">'+meta+'</span>':'')+rate+'</span></button>'+
    '<div class="dc-a">'+sec+
    '<button class="ck'+(d.done?' on':'')+'" data-act="done" data-i="'+i+'" aria-label="Markér som lavet" aria-pressed="'+(!!d.done)+'">'+CHECK+'</button></div></div>';
}
function viewWeek(){
  var w=wid(),plan=S.plans[w],days=(plan&&plan.days)||[],has=days.some(function(d){return d&&(d.r||d.f||d.off)}),t=todayStr(),h=weekNav();
  var nrec=Object.keys(S.recipes).length,P=getPrefs(w);
  var selfNow=P.mode==='self'&&P.done&&nrec>0;
  if(!has&&!selfNow){
    h+='<section class="card hero">'+fanHtml()+'<h2>Klar til uge '+isoWeek(S.mon)[1]+'?</h2>'+
      (nrec?'<p>Planlæg efter ugens tilbud, eller vælg retterne selv.</p><button class="btn block" data-act="wizard">Planlæg ugen</button><button class="alt" data-act="gen">Lav en plan nu</button>':(S.hasSettings===false&&!S.ro?'<p>Din egen ugeplan, dit eget lager og dine egne retter. Kun du kan se dem.</p><button class="btn block" data-act="onboard">Kom i gang</button>':'<p>Tilføj retter for at få en madplan.</p><button class="btn block" data-act="recs">Tilføj retter</button>'))+'</section>';
  }else{
    h+=wishesHtml(w);if(has)h+=offerPlanHtml(w,P);h+=stockCardHtml(w);
    h+='<div class="days">';for(var i=0;i<7;i++)h+=dayRow(i,days[i],t,P);h+='</div>';
    h+='<div class="foot"><button class="btn" data-act="gen">'+(P.mode==='self'?'Foreslå retter':'Lav ny plan')+'</button><button class="btn ghost" data-act="recs">Mine retter</button></div>';
  }
  return h;
}

/* --- Indkøb --- */
function storeTiles(sc,sel,best,pair){
  var act=byCost(sc,activeStores()),mx=Math.max.apply(null,act.map(function(s){return sc.stores[s].total}))||1;
  var h='<div class="stores" role="group" aria-label="Butikker">'+act.map(function(s){
    var x=sc.stores[s],on=s===sel;
    return '<button class="sto" data-act="pickstore" data-s="'+esc(s)+'" aria-pressed="'+on+'">'+(best===s&&act.length>1?'<span class="best">Billigst</span>':'')+
      '<b>'+esc(s)+'</b><span class="tot">'+nf(Math.round(x.total),0)+'<small>kr</small></span>'+
      '<span class="sv">'+(x.n?x.n+' tilbud · −'+nf(Math.round(x.save),0)+' kr':'Ingen tilbud')+'</span>'+
      '<span class="bar"><i style="width:'+Math.max(8,Math.round(x.total/mx*100))+'%"></i></span></button>'}).join('');
  if(pair)h+='<button class="sto pair" data-act="pickstore" data-s="'+pair.sel+'" aria-pressed="'+(sel===pair.sel)+'"><span class="best">Nemmest</span><b>'+esc(pair.stores.join(' + '))+'</b><span class="tot">'+nf(Math.round(pair.total),0)+'<small>kr</small></span><span class="sv">−'+nf(Math.round(pair.save),0)+' kr mod én butik</span><span class="bar"><i style="width:'+Math.max(8,Math.round(pair.total/mx*100))+'%"></i></span></button>';
  return h+'</div>';
}
var STSHORT={'Rema 1000':'Rema','Coop 365':'365','SuperBrugsen':'SuperB.','Løvbjerg':'Løvbj.'};
var SPON=false;
function stShort(s){return STSHORT[s]||s}
function nameList(a){a=a.map(function(x){return '<em>'+esc(x)+'</em>'});return a.length<2?a.join(''):a.slice(0,-1).join(', ')+' og '+a[a.length-1]}
function optsHtml(sc,w,op){
  var sv=op.sv,rec=op.opts[op.rec],act=byCost(sc,activeStores()),h='<div class="opts"><div class="lbl">Én butik eller flere?</div><div class="optl" role="group" aria-label="Sammenlign butikker">';
  op.opts.forEach(function(o,i){
    var on=S.sel===o.sel,nm=o.k===1?'Kun '+esc(o.stores[0]):esc(o.stores.join(' + '));
    var d=o.k+(o.k===1?' butik':' butikker')+(o.k>1?(o.save>=1?' · spar ca. '+kr(Math.round(o.save)):' · ingen besparelse')+(o.k>2&&o.extra>=1?' ('+kr(Math.round(o.extra))+' mere end '+(o.k-1)+')':''):'');
    var split=o.k>1?'<span class="o-s">'+o.stores.map(function(s){return esc(s)+' ca. '+kr(Math.round(o.sub[s]))}).join(' · ')+'</span>':'';
    h+='<button class="opt'+(i===op.rec?' rec':'')+'" data-act="pickstore" data-s="'+esc(o.sel)+'" aria-pressed="'+on+'"><span class="o-n">'+(i===op.rec?'<span class="best">Nemmest</span>':'')+nm+'</span><span class="o-t">'+nf(Math.round(o.total),0)+'<small> kr</small></span><span class="o-d">'+d+'</span>'+split+'</button>';
  });
  h+='</div>';
  var top=op.cheapest,msg;
  if(rec.k===1)msg=top.k>1?'Op til ca. '+kr(Math.round(top.save))+' kan spares med '+top.k+' butikker. Hver ekstra butik skal spare mindst '+MIN_EXTRA+' kr.':'Flere butikker sparer ikke noget mærkbart.';
  else msg=(rec.save>=1?'Du sparer ca. '+kr(Math.round(rec.save))+' mod kun '+esc(op.opts[0].stores[0])+'.':'Samme pris som i én butik.')+(top!==rec&&top.k>rec.k?' Med '+top.k+' butikker ca. '+kr(Math.round(top.save))+'.':'');
  h+='<p class="fine">'+msg+'</p>';
  var offSt=act.filter(function(s){return activeOffers(w).some(function(o){return o.store===s})}),noOff=act.filter(function(s){return offSt.indexOf(s)<0});
  h+='<p class="fine">'+(offSt.length?'Tilbud: '+esc(offSt.join(', '))+'.':'Ingen tilbud for de valgte butikker.')+(noOff.length&&offSt.length?' Ingen tilbud: '+esc(noOff.join(', '))+'.':'')+'</p>';
  return h+'</div>';
}
function recoHtml(sc,best,w,op){
  var bs=best?sc.stores[best]:null,act=activeStores(),rec=op&&op.opts[op.rec],h='<div class="card reco"><div class="lbl">Ugens indkøb</div>';
  if(rec&&rec.k>1){
    var fx=fixedN()===rec.k;
    h+='<div class="big">'+(fx?'Billigste pris i '+nameList(rec.stores):'Handl i '+rec.k+' butikker: '+nameList(rec.stores))+'</div><p>ca. '+kr(Math.round(rec.total))+(rec.save>=1?' · du sparer ca. '+kr(Math.round(rec.save))+' mod kun '+esc(rec.base):' · samme pris som i én butik')+'</p>';
  }else if(best){
    h+='<div class="big">Kør til <em>'+esc(best)+'</em></div><p>ca. '+kr(Math.round(bs.total))+(bs.save>=1?' · du sparer ca. '+kr(Math.round(bs.save))+' på tilbud':'')+'</p>';
  }else{
    h+='<div class="big">Samme pris i alle butikker</div><p>ca. '+kr(Math.round(sc.norm))+'. Vælg den butik, der ligger lettest.</p>';
  }
  if(op&&act.length>1&&op.opts.length>1)h+=optsHtml(sc,w,op);
  else if(act.length>1)h+='<p class="fine">Én butik er nok.</p>';
  return h+'</div>';
}
function budgetHtml(total){
  var B=weekBudget();if(!(B>0)||!(total>0))return '';
  var left=B-total,pct=Math.min(100,Math.round(total/B*100)),mo=S.settings.budgetPer==='month';
  return '<div class="card bud"><div class="lbl">Madbudget</div><div class="bud-r"><b>ca. '+kr(Math.round(total))+'</b> af '+kr(Math.round(B))+(mo?' (en uge af '+kr(S.settings.budget)+' om måneden)':'')+'</div>'+
    '<div class="bbar'+(left<0?' over':'')+'" role="img" aria-label="'+pct+' procent af budgettet"><i style="width:'+Math.max(4,pct)+'%"></i></div>'+
    '<p class="fine">'+(left>=0?'Du holder budgettet med ca. '+kr(Math.round(left))+' til overs.':'Ca. '+kr(Math.round(-left))+' over budgettet. Prøv Lav ny plan.')+'</p></div>';
}
function brandBtn(it){
  var b=brandsOf(it.k),nm=esc(it.name);
  return '<button type="button" class="chip bk'+(b.length?' on':'')+'" data-act="brand" data-k="'+esc(it.k)+'" data-n="'+nm+'" aria-label="'+(b.length?'Ret foretrukket mærke for ':'Vælg foretrukket mærke for ')+nm+'">'+(b.length?'★ '+esc(brandLabel(it.k)):'+ Mærke')+'</button>';
}
function viewShop(){
  SPON=hasSP();
  var w=wid(),items=computeList(w),L=S.lists[w]||{},chk=L.checked||{},extra=L.extra||[],h=weekNav();
  if(!planIds(w,false).length&&!items.length)h+='<section class="card hero"><h2>Listen er tom</h2><p>Lav en madplan, så beregner appen indkøb og pris.</p><button class="btn block" data-act="tab" data-tab="week">Til ugeplanen</button></section>';
  var sc=storeCosts(items,w),best=null,hasQ=false,act=activeStores(),op=null,recO=null;
  items.forEach(function(it){if(qual(it.k))hasQ=true});
  if(sc.norm>0){
    var tot=act.map(function(s){return sc.stores[s]}).sort(function(a,b){return a.total-b.total||b.n-a.n});
    if(tot.length===1||tot[0].total<tot[tot.length-1].total-.5)best=tot[0].store;
    op=shopOptions(sc);recO=op.opts[op.rec];
    if((S.sel==='pair'||S.sel==='trio')&&!op.opts.some(function(o){return o.sel===S.sel}))S.sel='';
    if(!S.sel||(S.sel!=='pair'&&S.sel!=='trio'&&act.indexOf(S.sel)<0)||!S.selSet)S.sel=recO.sel;
    h+=storeTiles(sc,S.sel,best,recO.k>1?recO:null)+recoHtml(sc,best,w,op)+budgetHtml(op.recTotal);
  }
  var sel=sc.norm>0?S.sel:'',combo=(op&&(sel==='pair'||sel==='trio'))?op.opts.filter(function(o){return o.sel===sel})[0]:null;
  var storeOf=function(it){return !sel?'':(combo?(combo.assign[it.k+'_'+it.unit]||combo.stores[0]):sel)};
  var nchk=0,doneRows=[],openN=0;
  var groupsHtml=function(list){
    var groups={},g='';list.forEach(function(it){(groups[it.cat]=groups[it.cat]||[]).push(it)});
    CATS.forEach(function(c){
      if(!groups[c])return;
      var rows=groups[c].sort(function(a,b){return a.name.localeCompare(b.name,'da')}).map(function(it){
        var key=it.k+'_'+it.unit,on=!!chk[key];if(on)nchk++;
        var so=storeOf(it),ln=so&&sc.stores[so]?sc.stores[so].lines[key]:null,via=ln&&ln.via,qt=it.pack>0?it.packs+' pk. · '+fq(it.qty,it.unit):fq(it.qty,it.unit);
        var cells=combo?'<span class="cmp-p" style="--n:'+combo.stores.length+'">'+combo.stores.map(function(s2){var l2=sc.stores[s2]&&sc.stores[s2].lines[key];return '<span class="cc'+(s2===so?' min':'')+(l2&&l2.via?' off':'')+(l2&&l2.est&&!l2.via&&SPON?' est':'')+'">'+(l2?(l2.est&&!l2.via&&SPON?'≈':'')+nf(Math.round(l2.cost),0):'–')+'</span>'}).join('')+'</span>':'';
        var price=ln?'<span class="pr'+(via?' off':'')+'">ca. '+kr(Math.round(ln.cost))+'</span>'+(via?'<span class="was">'+kr(Math.round(ln.norm))+'</span>':''):'';
        var ot=via?'<span class="it-o">'+esc(so)+' · '+esc(via.o.name)+(via.o.to?' · til '+esc(via.o.to):'')+'</span>':'';
        var rh='<label class="it'+(on?' on':'')+(combo?' cmp':'')+'"><input type="checkbox" data-chk="'+esc(key)+'"'+(on?' checked':'')+'><span class="it-main"><span class="it-n">'+esc(it.name)+'</span><span class="it-m"><span class="mono">'+qt+'</span>'+(qual(it.k)?'<span class="chip">'+qname(via&&via.o.q?via.o.q:qbest(pan(it.k)).q)+'</span>':'')+(via?'<span class="chip off">Tilbud</span>':'')+brandBtn(it)+'</span>'+ot+'</span>'+(combo?cells:'<span class="it-p">'+price+'</span>')+'</label>';
        if(on){doneRows.push(rh);return ''}openN++;return rh}).filter(Boolean);
      var lb=combo?'<div class="lbl cmp-l"><span>'+esc(c)+'</span><span class="cmp-p" style="--n:'+combo.stores.length+'">'+combo.stores.map(function(s2){return '<span>'+esc(stShort(s2))+'</span>'}).join('')+'</span></div>':'<div class="lbl">'+esc(c)+'</div>';
      if(rows.length)g+='<div class="sec">'+lb+'<div class="group">'+rows.join('')+'</div></div>';
    });
    return g;
  };
  if(combo){
    h+='<p class="legend"><span class="cc min">kr</span> billigste butik <span class="cc off">kr</span> tilbud'+(SPON?' <span class="cc est">≈kr</span> skøn':'')+'</p>';
    combo.stores.forEach(function(s){
      var part=items.filter(function(it){return storeOf(it)===s});
      if(!part.length)return;
      var openP=part.filter(function(it){return !chk[it.k+'_'+it.unit]}),rem=combo.sub[s];
      part.forEach(function(it){var key=it.k+'_'+it.unit;if(chk[key]){var ln=sc.stores[s]&&sc.stores[s].lines[key];if(ln)rem-=ln.cost}});
      if(openP.length)h+='<div class="storehead"><b>Køb i '+esc(s)+'</b><span>'+openP.length+(openP.length===1?' vare':' varer')+' · ca. '+kr(Math.max(0,Math.round(rem)))+'</span></div>';
      h+=groupsHtml(part);
    });
    var none=combo.stores.filter(function(s){return !items.some(function(it){return storeOf(it)===s})});
    if(none.length)h+='<p class="fine">Ingen varer er billigst i '+esc(none.join(' eller '))+'.</p>';
    var rest=items.filter(function(it){return !storeOf(it)});if(rest.length)h+=groupsHtml(rest);
  }else h+=groupsHtml(items);
  h+='<div class="sec"><div class="lbl">Ekstra</div><div class="group">'+extra.map(function(x){var on=!!chk['x_'+x.id];if(on)nchk++;
    var rh='<label class="it'+(on?' on':'')+'"><input type="checkbox" data-chk="x_'+esc(x.id)+'"'+(on?' checked':'')+'><span class="it-x"><span class="it-n">'+esc(x.name)+'</span><button class="x" data-act="delx" data-id="'+esc(x.id)+'" aria-label="Fjern '+esc(x.name)+'">×</button></span><span></span></label>';
    if(on){doneRows.push(rh);return ''}return rh}).join('')+'</div>'+
    '<div class="add-row"><input id="xin" type="text" placeholder="Tilføj vare, fx slik eller brød" aria-label="Ny ekstra vare"><button class="btn" data-act="addx">Tilføj</button></div></div>';
  if(items.length&&!openN&&doneRows.length)h+='<p class="hint">Alt fra madplanen er krydset af.</p>';
  if(doneRows.length)h+='<div class="sec bought"><div class="lbl">Købt ('+doneRows.length+')</div><div class="group">'+doneRows.join('')+'</div></div>';
  if(nchk)h+='<button class="btn block" data-act="tostock">Læg afkrydsede på lageret</button>';
  if(sc.norm>0){
    var od=S.offers[w],fine=SPON?'Normalpriser fra kædernes egne kataloger. ≈ er et skøn, hvor kæden ikke viser sin hyldepris (Coop-kæderne og Løvbjerg).':'Priserne er overslag.';
    if(!od||!(od.items||[]).length)fine+=' Ingen tilbud for uge '+isoWeek(S.mon)[1]+' endnu.';
    if(sc.unpriced)fine+=' '+sc.unpriced+(sc.unpriced===1?' vare':' varer')+' uden pris er udeladt.';
    h+='<p class="fine">'+esc(fine)+'</p>';
  }
  return h;
}

/* --- Lager --- */
function stockItems(){return Object.keys(S.pantry.items||{}).map(function(k){var p=S.pantry.items[k];return Object.assign({k:k},p)})}
function grp(p){return (p.leftover||p.loc==='fryser')?'Frost':(p.cat||'Andet')}
function stockListHtml(){
  var q=S.q.trim().toLowerCase(),t=todayStr(),byName=function(a,b){return a.name.localeCompare(b.name,'da')};
  var items=stockItems().filter(function(p){return !q||String(p.name).toLowerCase().indexOf(q)>-1}),h='';
  var have=items.filter(function(p){return curQty(p)>0}),gone=items.filter(function(p){return !(curQty(p)>0)});
  var row=function(p){
    var cq=curQty(p),low=isLow(p),soon=p.expires&&cq>0&&daysBetween(t,p.expires)<=4;
    var sub=(low?'<span class="chip off">'+((p.rule||'under')==='out'?'Brugt op':'Snart tom')+'</span>':'')+(soon?'<span class="chip warn">Udløber snart</span>':'')+(p.leftover&&p.frozen?'<span>frosset '+fmtDate(p.frozen)+'</span>':'');
    return '<button class="li" data-act="editstock" data-k="'+esc(p.k)+'"><span><span class="nm">'+esc(p.name)+'</span>'+(sub?'<span class="sub">'+sub+'</span>':'')+'</span><span class="qt">'+pq(p,cq)+'</span></button>';
  };
  CATS.forEach(function(c){
    var g=have.filter(function(p){return grp(p)===c}).sort(byName);
    if(!g.length)return;
    h+='<div class="sec"><div class="lbl">'+esc(c)+'</div><div class="list">'+g.map(row).join('')+'</div></div>';
  });
  if(gone.length)h+='<details class="gone" id="goneBox"'+((S.goneOpen||q)?' open':'')+'><summary><span class="lbl">Mangler ('+gone.length+')</span></summary><div class="list">'+gone.sort(byName).map(row).join('')+'</div></details>';
  return h||'<p class="muted">Ingen varer fundet.</p>';
}
function viewStock(){
  var items=stockItems();
  return '<div class="add-row"><input id="sq" type="text" placeholder="Søg i lageret" value="'+esc(S.q)+'" aria-label="Søg i lageret"><button class="btn" data-act="newstock">Ny vare</button></div>'+
    '<div id="stockList" style="display:flex;flex-direction:column;gap:18px">'+(items.length?stockListHtml():'<section class="card hero"><h2>Lageret er tomt</h2><p>Tilføj det, du har hjemme. Forbrug trækkes fra, når en ret er lavet.</p></section>')+'</div>';
}

/* ---------- sheets ---------- */
function openSheet(title,body){
  $('#sheet').innerHTML='<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><div class="sh-grab"></div><div class="sh-head"><h2>'+esc(title)+'</h2><button class="x" data-act="close" aria-label="Luk">×</button></div><div class="sh-body">'+body+'</div></div>';
  document.body.classList.add('lock');
}
function closeSheet(){scDrop();rfDrop();if(S.ctl){try{S.ctl.abort()}catch(e){}S.ctl=null}$('#sheet').innerHTML='';document.body.classList.remove('lock');S.wz=null}

/* ---------- side menu ---------- */
var MENU=[
  {id:'week',t:'Ugeplan',tab:1,ic:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'},
  {id:'stock',t:'Lager',tab:1,ic:'<path d="M3 7l9-4 9 4v10l-9 4-9-4V7z"/><path d="M3 7l9 4 9-4M12 11v10"/>'},
  {id:'shop',t:'Indkøb',tab:1,ic:'<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'},
  {sep:1},
  {id:'recs',t:'Mine retter',ic:'<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4z"/><path d="M5 17a3 3 0 0 1 3-3h11M9 8h6"/>'},
  {id:'scan',t:'Scan kogebog',ic:'<path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z"/><circle cx="12" cy="12.5" r="3.4"/>'},
  {id:'favs',t:'Favoritter',ic:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.600-7 10-7 10z"/>'},
  {sep:1},
  {id:'gear',t:'Indstillinger',ic:'<circle cx="12" cy="12" r="3"/><path d="M12 3v2.500M12 18.500V21M3 12h2.500M18.500 12H21M5.600 5.600l1.800 1.800M16.600 16.600l1.800 1.800M5.600 18.400l1.800-1.800M16.600 7.400l1.800-1.800"/>'}
];
function menuHtml(){
  var nd=0;try{nd=draftList().length}catch(e){}
  var h='<div class="scrim" data-act="menuclose"></div><aside class="dr" role="dialog" aria-modal="true" aria-label="Menu"><div class="dr-h"><div class="brand">Fast<i>Week</i></div><button class="icon-btn" data-act="menuclose" aria-label="Luk menu"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div><nav class="dr-nav" aria-label="Hovedmenu">';
  MENU.forEach(function(m){
    if(m.sep){h+='<hr>';return}
    var on=m.tab&&S.tab===m.id;
    h+='<button class="dr-i'+(on?' on':'')+'" data-act="mgo" data-go="'+m.id+'"'+(on?' aria-current="page"':'')+'><svg viewBox="0 0 24 24">'+m.ic+'</svg><span>'+m.t+'</span>'+(m.id==='recs'&&nd?'<b class="bdg" aria-label="'+nd+' udkast">'+nd+'</b>':'')+'</button>';
  });
  return h+'</nav></aside>';
}
function menuIsOpen(){return !!$('#menu').firstChild}
function openMenu(){
  var el=$('#menu');el.innerHTML=menuHtml();el.hidden=false;
  document.body.classList.add('lock');
  var b=$('#menubtn');if(b){b.setAttribute('aria-expanded','true');b.setAttribute('aria-label','Luk menu')}
  var f=el.querySelector('.dr-i.on')||el.querySelector('.dr-i');if(f)f.focus();
}
function closeMenu(){
  var el=$('#menu');if(!el.firstChild)return;
  el.innerHTML='';el.hidden=true;
  if(!$('#sheet').firstChild)document.body.classList.remove('lock');
  var b=$('#menubtn');if(b){b.setAttribute('aria-expanded','false');b.setAttribute('aria-label','Åbn menu')}
}
var opt=function(list,sel){return list.map(function(o){var v=Array.isArray(o)?o[0]:o,l=Array.isArray(o)?o[1]:o;return '<option value="'+esc(v)+'"'+(v===sel?' selected':'')+'>'+esc(l)+'</option>'}).join('')};

/* pick a recipe (or a freezer meal) for a day */
function openPick(i){
  var w=wid(),d=((S.plans[w]||{}).days||[])[i]||{},P=getPrefs(w);
  var ctx=ctxFor(w),list=Object.keys(S.recipes).map(function(id){return{id:id,s:fit(S.recipes[id],i,ctx,id)}}).sort(function(a,b){return b.s-a.s});
  var frz=stockItems().filter(function(p){return p.leftover&&curQty(p)>=1});
  var h='<p class="muted sm">'+DAYS[i]+' den '+parseYmd(addDays(S.mon,i)).getUTCDate()+'.</p>';
  if(d.r&&!d.lo)h+='<button class="lowcard" role="switch" aria-checked="'+(!!d.dbl)+'" data-act="togdbl" data-i="'+i+'"><span class="lc"><b>Dobbelt portion</b><span>Så er der rester til '+(i<6?DAYS[i+1].toLowerCase():'mandag i næste uge')+'.</span></span><span class="sw"></span></button>';
  h+='<div class="sec"><div class="list"><button class="li rec" data-act="setoff" data-i="'+i+'"><span class="art plate">'+PLATE+'</span><span><span class="nm">Ude eller ingen mad</span><span class="sub">Ingen indkøb til denne dag</span></span><span></span></button></div></div>';
  if(frz.length)h+='<div class="sec"><div class="lbl">Fra fryseren</div><div class="list">'+frz.map(function(p){return '<button class="li" data-act="setfrz" data-i="'+i+'" data-k="'+esc(p.k)+'"><span><span class="nm">'+esc(p.name)+'</span></span><span class="qt">'+pq(p,curQty(p))+'</span></button>'}).join('')+'</div></div>';
  h+='<div class="sec"><div class="lbl">Retter</div><div class="list">'+list.map(function(x){var r=S.recipes[x.id],m=recMeta(r,P.low);
    var ch=(r.fav?'<span class="hrt">♥</span>':'')+(ctx.tasteAny&&!r.fav&&ctx.taste[x.id]>.5?'<span class="chip">Passer din smag</span>':'')+(r.again==='no'?'<span class="chip off">Ikke igen</span>':'')+(r.again==='yes'?'<span class="chip ex">Gentag</span>':'')+dietChip(r);
    return '<button class="li rec" data-act="setday" data-i="'+i+'" data-id="'+x.id+'">'+artBox(r,x.id)+'<span><span class="nm">'+esc(r.name)+'</span>'+((m||ch)?'<span class="sub">'+m+ch+'</span>':'')+'</span><span></span></button>'}).join('')+'</div></div>';
  if(d.r||d.f)h+='<button class="btn danger" data-act="setday" data-i="'+i+'" data-id="">Fjern fra dagen</button>';
  openSheet('Vælg ret',h);
}

/* recipes */
function openRecipes(){
  var ids=Object.keys(S.recipes),h='<div class="btnrow"><button class="btn" data-act="newrec">Ny ret</button><button class="btn ghost" data-act="scanbook">Scan kogebog</button>'+(ids.length?'<button class="btn ghost" data-act="favs">♥ Favoritter</button>':''),ns=Object.keys(S.starter).filter(function(id){return !S.recipes[id]}).length;
  if(ns)h+='<button class="btn ghost" data-act="getstarter">Hent '+ns+(ns===1?' startret':' startretter')+'</button>';
  h+='</div>';
  if(ids.length){var tm=tasteModel(),tl=tm.any?tasteLabels(tm):[];
    h+='<p class="hint">'+(tl.length?'Din smag lige nu: '+esc(tl.join(', '))+'. Retterne varieres fra uge til uge.':'Markér favoritter, så lærer appen din smag.')+'</p>'}
  if(!ids.length)h+='<p class="muted">Ingen retter endnu. Scan en kogebog, eller tryk Ny ret.</p>';
  h+=draftsHtml();
  var books={};ids.forEach(function(id){var r=S.recipes[id],b=r.book||'Egne retter';(books[b]=books[b]||[]).push(id)});
  Object.keys(books).sort(function(a,b){return a==='Egne retter'?1:b==='Egne retter'?-1:a.localeCompare(b,'da')}).forEach(function(b){
    h+='<div class="sec"><div class="lbl">'+esc(b)+'</div><div class="list">'+books[b].sort(function(a,c){return (S.recipes[a].page||0)-(S.recipes[c].page||0)||S.recipes[a].name.localeCompare(S.recipes[c].name,'da')}).map(function(id){
      var r=S.recipes[id],kt=kcTxt(r);
      return '<button class="li rec" data-act="editrec" data-id="'+id+'">'+artBox(r,id)+'<span><span class="nm">'+esc(r.name)+'</span><span class="sub">'+(r.fav?'<span class="hrt">♥</span>':'')+(r.page?'<span class="mono">s. '+r.page+'</span>':'')+(r.minutes?'<span>'+r.minutes+' min</span>':'')+(kt?'<span>'+kt+'</span>':'')+(r.kind==='weekend'?'<span class="chip wk">Weekend</span>':'')+(r.prot==='vegetar'||r.prot==='aeg'?'<span class="chip">Vegetar</span>':'')+'</span></span><span></span></button>'}).join('')+'</div></div>';
  });
  openSheet('Mine retter',h);
}

function ruleHtml(p){
  var r=ruleOf(p);
  return '<div class="rule"><div class="field"><label>Hvornår kommer den på indkøbslisten?</label><select class="r-mode">'+opt([['under','Når lageret er under en grænse'],['days','Når der er få dage tilbage'],['out','Når den er brugt op'],['never','Aldrig automatisk']],r.rule)+'</select></div>'+
    '<div class="grid2"><div class="field r-f-under"'+(r.rule==='under'?'':' hidden')+'><label>Grænse</label><input class="r-min" inputmode="decimal" value="'+esc(dec(r.min))+'"></div>'+
    '<div class="field r-f-days"'+(r.rule==='days'?'':' hidden')+'><label>Dage tilbage</label><input class="r-days" inputmode="decimal" value="'+esc(dec(r.days))+'"></div>'+
    '<div class="field r-f-use"'+(r.rule==='never'?' hidden':'')+'><label>Forbrug pr. uge (valgfri)</label><input class="r-use" inputmode="decimal" value="'+(r.use?esc(dec(r.use)):'')+'"></div>'+
    '<div class="field"><label>Pakkestørrelse</label><input class="r-pack" inputmode="decimal" value="'+(r.pack?esc(dec(r.pack)):'')+'"></div></div></div>';
}
function readRule(el){var g=function(c){return el.querySelector(c)};return{rule:g('.r-mode').value,min:Math.max(0,num(g('.r-min').value)),days:Math.max(0,num(g('.r-days').value)),use:Math.max(0,num(g('.r-use').value)),pack:Math.max(0,num(g('.r-pack').value))}}
function syncRule(el){var m=el.querySelector('.r-mode').value;el.querySelector('.r-f-under').hidden=m!=='under';el.querySelector('.r-f-days').hidden=m!=='days';el.querySelector('.r-f-use').hidden=m==='never'}
function refreshSummary(row){
  if(!row)return;var s=row.querySelector('summary'),rule=row.querySelector('.rule'),u=row.querySelector('.i-u');
  if(s&&rule)s.textContent=ruleSummary(readRule(rule),u?u.value:'g');
}
function ingRow(g){
  g=g||{};var p=g.n?pan(slug(g.n)):null,u=g.u||(p&&p.unit)||'g',rp=p||{unit:u};
  return '<div class="ingw"><div class="ing"><input class="i-n" list="pl" placeholder="Ingrediens" aria-label="Ingrediens" value="'+esc(g.n||'')+'"><input class="i-q" inputmode="decimal" placeholder="Mængde" aria-label="Mængde" value="'+(g.q?esc(nf(g.q,2)):'')+'"><select class="i-u" aria-label="Enhed">'+opt(UNITS,u)+'</select><button class="x" data-act="ingdel" aria-label="Fjern ingrediens">×</button></div>'+
    '<details class="rl"><summary>'+esc(ruleSummary(ruleOf(rp),u))+'</summary>'+ruleHtml(rp)+'</details></div>';
}
function heroHtml(id,r){
  var canUp=!!S.assets||!!window.UGEKURV_WEB,own=ownImg(r),ph=!own&&!r.noweb&&r.photo&&r.photo.u?r.photo:null,h='';
  h+='<div class="hero-img"><span class="art wide">'+artHtml(r,id,true)+'</span>'+(canUp?'<button class="cam" data-act="photo" data-id="'+esc(id)+'">'+CAM+(own?'Skift foto':'Tilføj foto')+'</button>':'')+'</div>';
  if(canUp)h+='<input id="rf-photo" type="file" accept="image/*" hidden data-id="'+esc(id)+'">';
  h+='<div id="ph-st" aria-live="polite"></div>';
  if(own)h+='<button class="lnk" data-act="rmphoto" data-id="'+esc(id)+'">Fjern mit foto</button>';
  else if(ph)h+='<p class="credit">Foto: '+(ph.p?'<a href="'+esc(safeUrl(ph.p))+'" target="_blank" rel="noopener noreferrer">'+esc(ph.h||'kilde')+'</a>':esc(ph.h||''))+'. Fundet ved søgning på rettens navn. <button class="lnk" data-act="nextimg" data-id="'+esc(id)+'">Find et andet</button> <button class="lnk" data-act="noweb" data-id="'+esc(id)+'">Brug tegning</button></p>';
  else if(r.photoReq&&!r.noweb)h+='<p class="hint">Et nyt foto af retten hentes automatisk inden for en time.</p>';
  else if(r.noweb)h+='<p class="hint">Tegningen bruges. <button class="lnk" data-act="findimg" data-id="'+esc(id)+'">Brug et foto af retten</button></p>';
  else if(r.photo&&r.photo.none)h+='<p class="hint">Der blev ikke fundet et foto af retten. Tilføj dit eget.</p>';
  else if(id)h+='<p class="hint">Et foto af retten hentes automatisk inden for en time.</p>';
  return h;
}
function openRecipe(id,did){
  var dr=(!id&&did&&S.scans&&S.scans[did])||null,r=id?S.recipes[id]:null,v=r||dr,books={};Object.keys(S.recipes).forEach(function(k){if(S.recipes[k].book)books[S.recipes[k].book]=1});Object.keys(S.scans||{}).forEach(function(k){if(S.scans[k].book)books[S.scans[k].book]=1});
  var ing=(v&&v.ing&&v.ing.length?v.ing:[{},{}]);
  var h='<datalist id="pl">'+stockItems().filter(function(p){return !p.leftover}).map(function(p){return '<option value="'+esc(p.name)+'">'}).join('')+'</datalist><datalist id="bl">'+Object.keys(books).map(function(b){return '<option value="'+esc(b)+'">'}).join('')+'</datalist>';
  if(r){
    var k=kalc(r);
    h+='<button class="btn ghost sm" data-act="cook" data-id="'+esc(id)+'">Se opskrift</button>';
    h+='<div id="hero-box">'+heroHtml(id,r)+'</div><div class="stat">'+(r.minutes?'<span class="chip">'+r.minutes+' min</span>':'')+(k?'<span class="chip">'+k+'</span>':'')+(r.kind==='weekend'?'<span class="chip wk">Weekend</span>':'')+(r.rest?'<span class="chip ex">Holder sig godt</span>':'')+'</div>';
    if(k)h+='<p class="hint">Kalorier pr. portion er et overslag inkl. ca. '+KALLOW+' kcal til olie og krydderier.</p>';
  }
  if(dr)h+='<p class="hint">Udkast fra scanning af '+esc(dr.book)+'. Tjek oplysningerne, og tryk Gem ret.</p>'+(dr.raw?rawHtml(dr.raw):'');
  if(!r&&!dr)h+='<div class="photo"><b>Læs fra billede</b><p class="muted sm">'+(window.UGEKURV_WEB?'Vælg et billede af opskriften. Titel, tid og ingredienser udfyldes automatisk. Tjek mængderne.':'Vælg et billede af opskriften. Titel, tid og ingredienser udfyldes automatisk.')+'</p><input id="rf-file" type="file" accept="image/*" multiple aria-label="Billeder af opskrift"><div id="rf-th" class="ths"></div><div id="rf-st" aria-live="polite"></div><button class="btn ghost sm" data-act="readrec" id="rf-read" hidden>Læs igen</button></div>';
  h+='<div class="field"><label for="rf-name">Navn</label><input id="rf-name" type="text" value="'+esc(v?v.name||'':'')+'"></div>'+
    (r&&safeUrl(r.url)?'<a class="srcl" href="'+esc(safeUrl(r.url))+'" target="_blank" rel="noopener noreferrer">'+LINK+'<span>Åbn opskriften på '+esc(srcHost(r.url))+'</span></a>':'')+
    '<div class="grid2"><div class="field"><label for="rf-book">Kogebog</label><input id="rf-book" list="bl" type="text" value="'+esc(v?v.book||'':'')+'" placeholder="Fx titel på bogen"></div><div class="field"><label for="rf-page">Side</label><input id="rf-page" inputmode="numeric" value="'+(v&&v.page?v.page:'')+'"></div></div>'+
    '<div class="grid2"><div class="field"><label for="rf-kind">Type</label><select id="rf-kind">'+opt([['hverdag','Hverdag'],['weekend','Weekend']],v?v.kind:'hverdag')+'</select></div><div class="field"><label for="rf-min">Minutter</label><input id="rf-min" inputmode="numeric" value="'+(v&&v.minutes?v.minutes:'')+'"></div></div>'+
    '<div class="field"><label>Ingredienser til 2 personer</label><p class="hint">Mængder for 2 personer. Omregnes til '+hhLabel()+'.</p><div id="rf-ings" style="display:flex;flex-direction:column;gap:8px">'+ing.map(ingRow).join('')+'</div><div><button class="btn ghost sm" data-act="ingadd">Tilføj ingrediens</button></div></div>'+
    '<details class="more" id="rf-more"><summary><span class="lbl">Flere valg</span><span class="sub">Link, hovedingrediens, fremgangsmåde m.m.</span></summary><div class="more-in">'+
    '<div class="field"><label for="rf-url">Link til opskrift (valgfri)</label><input id="rf-url" type="text" inputmode="url" autocomplete="off" value="'+esc(r?safeUrl(r.url):'')+'" placeholder="https://"></div>'+
    '<div class="field"><label for="rf-prot">Hovedingrediens</label><select id="rf-prot">'+opt(PROTS,v?v.prot||'':'')+'</select></div>'+
    '<div class="grid2"><div class="field"><label for="rf-again">Skal den gentages?</label><select id="rf-again">'+opt([['','Ikke valgt'],['yes','Ja, gerne'],['maybe','Måske'],['no','Nej, ikke igen']],r?r.again||'':'')+'</select></div><div class="field"><label>&nbsp;</label><label class="chk"><input id="rf-fav" type="checkbox"'+(r&&r.fav?' checked':'')+'> Favorit ♥</label></div></div>'+
    '<label class="chk"><input id="rf-rest" type="checkbox"'+(r&&r.rest?' checked':'')+'> Holder sig godt og kan laves i dobbelt portion</label>'+
    '<div class="field"><label for="rf-method">Fremgangsmåde (valgfri)</label><textarea id="rf-method" rows="7" placeholder="Skriv ét trin pr. linje, så vises opskriften i ugeplanen">'+esc(r?r.method||'':'')+'</textarea></div>'+
    '</div></details>'+
    '<div class="foot"><button class="btn" data-act="saverec" data-id="'+esc(id||'')+'" data-did="'+esc(dr?did:'')+'">Gem ret</button>'+(r?'<button class="btn danger" data-act="delrec" data-id="'+esc(id)+'">Slet</button>':'')+(dr?'<button class="btn danger" data-act="deldraft" data-id="'+esc(did)+'">Slet udkast</button>':'')+'</div>';
  openSheet(r?'Ret':dr?'Udkast':'Ny ret',h);
}
function kalc(r){var k=kcalOf(r);return k.k>KALLOW+5?'ca. '+k.k+' kcal pr. portion':''}
function collectIng(){
  return Array.prototype.map.call(document.querySelectorAll('#rf-ings .ingw'),function(row){return{n:row.querySelector('.i-n').value.trim().toLowerCase(),q:num(row.querySelector('.i-q').value),u:row.querySelector('.i-u').value,rule:readRule(row.querySelector('.rule'))}}).filter(function(g){return g.n&&g.q>0});
}
function saveRecipe(id,did){
  var name=$('#rf-name').value.trim(),rows=collectIng();
  if(!name){toast('Giv retten et navn');return}
  if(!rows.length){toast('Tilføj mindst én ingrediens med mængde');return}
  var old=id?S.recipes[id]:null,rid=id||uid(),t=todayStr();
  var doc=Object.assign({},old||{},{name:name,book:$('#rf-book').value.trim(),page:Math.round(num($('#rf-page').value))||0,kind:$('#rf-kind').value,minutes:Math.round(num($('#rf-min').value))||0,prot:$('#rf-prot').value,rest:$('#rf-rest').checked,fav:$('#rf-fav').checked,again:$('#rf-again').value,method:$('#rf-method').value.replace(/\r/g,'').trim(),ing:rows.map(function(g){return{n:g.n,q:g.q,u:g.u}}),example:false,url:safeUrl($('#rf-url').value),made:(old&&old.made)||{count:0,last:'',wd:[0,0,0,0,0,0,0]}});
  save(function(){
    var patch={},items=S.praw||{};
    rows.forEach(function(g){var k=slug(g.n),o=items[k],r=g.rule;
      if(!o){var rf=(S.ref.items||{})[k];patch[k]=Object.assign({name:g.n,unit:g.u,qty:0,price:0,perish:!!(rf&&rf.perish&&rf.unit===g.u),cat:(rf&&rf.cat)||'Andet',expires:'',at:t},r)}
      else patch[k]=Object.assign({},r,(r.use>0&&!o.at)?{at:t}:{});
    });
    return up(udoc('store/pantry'),{items:patch}).then(function(){return udoc('recipes/'+rid).set(doc)}).then(function(){return did?udoc('scans/'+did).delete().catch(function(){}):null}).then(function(){if(did&&S.scans)delete S.scans[did];openRecipes();toast('Ret gemt')});
  });
}
var RFU=[];
function rawHtml(t){return '<details class="raw"><summary>Vis den læste tekst</summary><pre>'+esc(String(t).slice(0,6000))+'</pre><button type="button" class="btn ghost sm" data-act="copyraw">Kopiér teksten</button></details>'}
function rfDrop(){RFU.forEach(function(u){try{URL.revokeObjectURL(u)}catch(e){}});RFU=[]}
function rfSt(kind,title,sub,stop){
  var st=$('#rf-st');if(!st)return;
  st.innerHTML='<div class="up-sum '+kind+'">'+(kind==='run'?'<span class="spin"></span>':kind==='ok'?CHECK:'')+'<span><b>'+esc(title)+'</b>'+(sub?'<span>'+esc(sub)+'</span>':'')+'</span>'+(stop?'<button class="btn ghost sm" data-act="stopread">Stop</button>':'')+'</div>';
}
function rfPreview(files){
  rfDrop();var th=$('#rf-th');if(!th)return;
  th.innerHTML=[].slice.call(files||[]).map(function(f,i){var u=URL.createObjectURL(f);RFU.push(u);return '<figure><img src="'+u+'" alt="Billede '+(i+1)+'"><figcaption>'+upSize(f)+'</figcaption></figure>'}).join('');
}
function readRecipe(){
  var files=$('#rf-file').files,rb=$('#rf-read');
  if(!files||!files.length){rfSt('bad','Vælg et billede først');return}
  if(!S.sample||!S.imgOK){rfSt('bad','Fotolæsning er ikke tilgængelig her','Skriv ingredienserne ind selv.');return}
  if(S.ctl){rfSt('run','Læser stadig','Vent, til den er færdig.');return}
  var n=files.length;S.ctl=new AbortController();if(rb)rb.disabled=true;
  rfSt('run',(n===1?'Billedet er modtaget. Læser…':n+' billeder er modtaget. Læser…'),window.UGEKURV_WEB&&!window.UgekurvOCR?'Første gang hentes tekstlæseren.':'',true);
  var t0=Date.now();S.sample.json(RECIPE_PROMPT,{images:files,signal:S.ctl.signal,onStep:function(m){rfSt('run',m,'Det kan tage op til et minut.',true)}}).then(function(res){
    var rows=rowsFromRes(res);
    var addRaw=function(){var st=$('#rf-st');if(st&&res&&res.raw)st.insertAdjacentHTML('beforeend',rawHtml(res.raw))};
    if(!rows.length){rfSt('bad','Fandt ingen ingredienser','Prøv et skarpere billede.');addRaw();return}
    if(!$('#rf-name').value&&res.name)$('#rf-name').value=res.name;
    if(res.minutes)$('#rf-min').value=Math.round(num(res.minutes));
    $('#rf-ings').innerHTML=rows.map(ingRow).join('');
    rfSt('ok',rows.length+(rows.length===1?' ingrediens indsat':' ingredienser indsat'),'Billedet gemmes ikke. Tjek mængderne nedenfor, og tryk Gem ret.');addRaw();
    var ing=$('#rf-ings');if(ing&&ing.scrollIntoView)ing.scrollIntoView({block:'nearest'});
  }).catch(function(e){
    var c=e&&e.code;
    if(c==='cancelled')rfSt('bad','Stoppet');
    else if(c==='not_granted')rfSt('bad','Mangler tilladelse','Du har ikke givet appen lov til at bruge Claude.');
    else if(c==='rate_limited')rfSt('bad','For mange forsøg','Vent lidt og prøv igen.');
    else if(c==='invalid_json'||c==='refused'||c==='image_rejected')rfSt('bad','Kunne ikke læse billedet','Prøv et skarpere billede.');
    else if(c==='unavailable'&&window.UGEKURV_WEB)rfSt('bad','Tekstlæseren kunne ikke hentes','Tjek nettet. Første gang hentes en sprogfil.');
    else rfSt('bad','Noget gik galt','Prøv igen.');
  }).then(function(){S.ctl=null;var b=$('#rf-read');if(b){b.disabled=false;b.hidden=false}});
}

/* ---- scan a cookbook: one photo = one draft, saved under scans/ until it is checked ---- */
var RECIPE_PROMPT='Billederne viser en opskrift fra en kogebog, som tilhører brugeren, til privat brug. Udtræk KUN retnavn, sidetallet hvis det står på billedet, ca. tilberedningstid i minutter, antal portioner opskriften er skrevet til og ingredienslisten. Kopiér ikke fremgangsmåden. Omregn alle mængder til g, ml eller stk (1 dl = 100 ml, 1 spsk = 15 ml, 1 tsk = 5 ml, 1 kg = 1000 g, 1 l = 1000 ml). Udelad salt, peber og vand. Skriv ingrediensnavne med små bogstaver i ubestemt form, fx "hakket oksekød" eller "løg". Svar kun med JSON: {"name":string,"minutes":number|null,"servings":number,"page":number|null,"ingredients":[{"n":string,"q":number,"u":"g"|"ml"|"stk"}]}';
function rowsFromRes(res){
  var f=2/(num(res.servings)>0?num(res.servings):2);
  return (res.ingredients||[]).filter(function(g){return g&&g.n&&num(g.q)>0}).map(function(g){var u=UNITS.indexOf(g.u)>-1?g.u:'stk',q=num(g.q)*f;q=u==='stk'?Math.round(q*2)/2:q>=20?Math.round(q/5)*5:r1(q);return{n:String(g.n).toLowerCase(),q:q||1,u:u}});
}
/* Careful guess of the main ingredient. Stock cubes and sauces do not count. Never guesses vegetarian: isVeg() reads the ingredients instead. */
function guessProt(rows){
  var t=(rows||[]).map(function(g){return String(g.n||'').toLowerCase()}).filter(function(n){return !/bouillon|fond|terning|krydderi|sauce|jus\b/.test(n)}).join(' | ');
  if(/okse|kalv|bøf|culotte|entrecote|roastbeef/.test(t))return 'okse';
  if(/kylling|kalkun|ande(?:bryst|lår|konfit)|(?:^|[^a-zæøå])and(?![a-zæøå])/.test(t))return 'kylling';
  if(/svin|flæsk|bacon|skinke|medister|pølse|frikadelle|nakke|kotelet/.test(t))return 'svin';
  if(/laks|torsk|fisk|rejer|(?:^|[^a-zæøå])tun(?![a-zæøå])|makrel|sild|rødspætte|(?:^|[^a-zæøå])sej(?![a-zæøå])|muslinger/.test(t))return 'fisk';
  if(/(?:^|[^a-zæøå])æg(?![a-zæøå])/.test(t)&&!MEATRE.test(t))return 'aeg';
  return '';
}
function draftList(){
  return Object.keys(S.scans||{}).sort(function(a,c){var x=S.scans[a],y=S.scans[c];return String(x.book||'').localeCompare(String(y.book||''),'da')||(x.page||0)-(y.page||0)||(x.at||0)-(y.at||0)});
}
function draftsHtml(){
  var ids=draftList();if(!ids.length)return '';
  return '<div class="sec"><div class="lbl">Til gennemsyn ('+ids.length+')</div><div class="list">'+ids.map(function(id){var d=S.scans[id],n=(d.ing||[]).length;
    return '<button class="li rec" data-act="editdraft" data-id="'+esc(id)+'"><span class="art plate">'+PLATE+'</span><span><span class="nm">'+esc(d.name||'Uden navn')+'</span><span class="sub"><span>'+esc(d.book||'')+'</span>'+(d.page?'<span class="mono">s. '+d.page+'</span>':'')+'<span>'+n+(n===1?' ingrediens':' ingredienser')+'</span><span class="chip warn">Udkast</span></span></span><span></span></button>'}).join('')+'</div></div>';
}
function upSize(f){return f.size>=1048576?nf(f.size/1048576,1)+' MB':Math.max(1,Math.round(f.size/1024))+' kB'}
var UPS={queue:'I kø',run:'Læser…',ok:'Gemt som udkast',bad:'Kunne ikke læses',stop:'Stoppet'};
function upCard(it){
  var st=it.state,btn='';
  if(st==='ok')btn='<button class="btn ghost sm" data-act="editdraft" data-id="'+esc(it.draft)+'">Åbn</button>';
  else if(st==='bad'||st==='stop')btn='<button class="btn ghost sm" data-act="scretry" data-id="'+it.id+'">Prøv igen</button>';
  else if(st==='run')btn='<span class="spin" role="status" aria-label="Læser"></span>';
  return '<div class="up up-'+st+'" id="'+it.id+'"><img class="up-th" src="'+it.url+'" alt="Billede '+it.n+'"><div class="up-b"><b>Billede '+it.n+' <span class="up-z">· '+upSize(it.file)+'</span></b><span class="up-s">'+(st==='ok'?CHECK:'')+esc(UPS[st])+'</span>'+(it.msg?'<span class="up-m">'+esc(it.msg)+'</span>':'')+'</div>'+btn+'</div>';
}
function scSet(it,st,msg){
  it.state=st;it.msg=msg||'';var el=$('#'+it.id);if(el){el.outerHTML=upCard(it);if(st==='run'){var n=$('#'+it.id);if(n&&n.scrollIntoView)n.scrollIntoView({block:'nearest'})}}
}
function scSum(){
  var Q=S.sq,s=$('#sc-st');if(!Q||!s)return;
  var c={queue:0,run:0,ok:0,bad:0,stop:0};Q.q.forEach(function(x){c[x.state]++});
  var n=Q.q.length,fail=c.bad+c.stop,h;var ft=(c.bad?c.bad+' fejlede':'')+(c.bad&&c.stop?' · ':'')+(c.stop?c.stop+' ikke læst':'');
  if(c.queue+c.run>0)h='<div class="up-sum run"><span class="spin"></span><span><b>Læser billede '+(c.ok+fail+1)+' af '+n+'</b>'+(window.UGEKURV_WEB&&!window.UgekurvOCR?'<span>Første gang hentes tekstlæseren.</span>':'')+'</span><button class="btn ghost sm" data-act="stopread">Stop</button></div>';
  else if(c.ok)h='<div class="up-sum ok">'+CHECK+'<span><b>'+c.ok+' udkast gemt'+(fail?' · '+ft:'')+'</b><span>Find dem under Mine retter › Til gennemsyn.</span></span><button class="btn sm" data-act="scanreview">Gennemse</button></div>';
  else if(c.stop&&!c.bad)h='<div class="up-sum"><span><b>Læsning stoppet</b><span>Tryk Prøv igen på et billede for at læse det.</span></span></div>';
  else h='<div class="up-sum bad"><span><b>Ingen udkast gemt</b><span>Prøv et skarpere billede, hvor ingredienslisten fylder godt.</span></span></div>';
  s.innerHTML=h;
  var fb=$('#sc-rev');if(fb){var nd=draftList().length;fb.textContent='Gennemse udkast'+(nd?' ('+nd+')':'')}
}
function scBook(){
  var bk=$('#sc-book'),er=$('#sc-bk-err');if(!bk)return false;
  if(bk.value.trim()){if(er)er.hidden=true;bk.removeAttribute('aria-invalid');return true}
  if(er)er.hidden=false;bk.setAttribute('aria-invalid','true');bk.focus();return false;
}
function scDrop(){if(S.sq){S.sq.urls.forEach(function(u){try{URL.revokeObjectURL(u)}catch(e){}});S.sq=null}}
function openScan(){
  scDrop();
  var books={};Object.keys(S.recipes).forEach(function(k){if(S.recipes[k].book)books[S.recipes[k].book]=1});Object.keys(S.scans||{}).forEach(function(k){if(S.scans[k].book)books[S.scans[k].book]=1});
  var n=draftList().length;
  var h='<datalist id="bl">'+Object.keys(books).map(function(b){return '<option value="'+esc(b)+'">'}).join('')+'</datalist>'+
    '<p class="muted sm">Ét billede pr. opskrift. Hver bliver et udkast, du tjekker bagefter.</p>'+
    '<div class="field"><label for="sc-book">Kogebog</label><input id="sc-book" list="bl" type="text" value="'+esc(S.lastBook||'')+'" placeholder="Fx titel på bogen"><p class="err" id="sc-bk-err" role="alert" hidden>Skriv kogebogens navn først.</p></div>'+
    '<div class="btnrow"><button class="btn" data-act="sccam">Tag billede</button><button class="btn ghost" data-act="scpick">Vælg billeder</button></div>'+
    '<input id="sc-cam" type="file" accept="image/*" capture="environment" hidden aria-label="Tag billede af opskrift"><input id="sc-files" type="file" accept="image/*" multiple hidden aria-label="Vælg billeder af opskrifter">'+
    '<div id="sc-st" aria-live="polite"></div><div id="sc-res" class="ups"></div>'+
    '<p class="hint">Luk ikke vinduet under læsning.</p>'+
    '<div class="foot"><button class="btn ghost" id="sc-rev" data-act="scanreview">Gennemse udkast'+(n?' ('+n+')':'')+'</button></div>';
  openSheet('Scan kogebog',h);
}
function scanFiles(list){
  var files=[].slice.call(list||[]),st=$('#sc-st'),bk=$('#sc-book');
  if(!files.length||!st||!bk)return;
  if(!scBook())return;
  if(!S.sample||!S.imgOK){st.innerHTML='<div class="up-sum bad"><span><b>Fotolæsning er ikke tilgængelig her</b><span>Brug Ny ret, og skriv ingredienserne ind.</span></span></div>';return}
  var book=bk.value.trim();S.lastBook=book;
  var Q=S.sq=S.sq||{q:[],n:0,urls:[],stopped:false},o=$('#sc-res');
  files.forEach(function(f){var it={id:'up'+(++Q.n),n:Q.n,file:f,url:URL.createObjectURL(f),book:book,state:'queue',msg:'',draft:''};Q.urls.push(it.url);Q.q.push(it);o.insertAdjacentHTML('beforeend',upCard(it))});
  Q.stopped=false;scSum();
  toast(files.length+(files.length===1?' billede modtaget':' billeder modtaget'));
  scPump();
}
function scPump(){
  var Q=S.sq;if(!Q||S.ctl)return;
  var it=Q.q.filter(function(x){return x.state==='queue'})[0];
  if(Q.stopped){Q.q.forEach(function(x){if(x.state==='queue')scSet(x,'stop','Tryk Prøv igen for at læse den.')});it=null}
  if(!it){
    scSum();var ok=Q.q.filter(function(x){return x.state==='ok'}).length;
    if(ok&&$('#sc-st'))toast(ok+' udkast gemt');
    return;
  }
  scSet(it,'run');scSum();
  var ctl=new AbortController();S.ctl=ctl;
  S.sample.json(RECIPE_PROMPT,{images:[it.file],signal:ctl.signal,onStep:function(m){var c=$('#'+it.id+' .up-s');if(c)c.textContent=m}}).then(function(res){
    var rows=rowsFromRes(res);
    if(!rows.length){scSet(it,'bad','Fandt ingen ingredienser.');return}
    var id=uid(),d={book:it.book,page:Math.max(0,Math.round(num(res.page)))||0,name:String(res.name||'').trim().slice(0,80),minutes:Math.round(num(res.minutes))||0,kind:'hverdag',prot:guessProt(rows),ing:rows,raw:String(res.raw||'').slice(0,6000),at:Date.now()};
    return udoc('scans/'+id).set(d).then(function(){S.scans[id]=d;it.draft=id;scSet(it,'ok',(d.name||'Uden navn')+(d.page?' · s. '+d.page:'')+' · '+rows.length+(rows.length===1?' ingrediens':' ingredienser'))});
  }).catch(function(e){
    if(e&&e.code==='cancelled'){Q.stopped=true;scSet(it,'stop','');return}
    scSet(it,'bad',(e&&e.code==='unavailable'&&window.UGEKURV_WEB)?'Tjek nettet. Første gang hentes en sprogfil.':'');
  }).then(function(){if(S.ctl===ctl)S.ctl=null;scPump()});
}
/* own photo of a dish */
function resizeImage(file,max){
  return new Promise(function(res,rej){
    var url=URL.createObjectURL(file),im=new Image();
    im.onload=function(){var s=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*s));c.height=Math.max(1,Math.round(im.height*s));c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(url);c.toBlob(function(b){b?res(b):rej(new Error('blob'))},'image/jpeg',.82)};
    im.onerror=function(){URL.revokeObjectURL(url);rej(new Error('img'))};im.src=url;
  });
}
function phSt(kind,txt){var b=$('#ph-st');if(b)b.innerHTML=txt?'<div class="up-sum '+kind+'">'+(kind==='run'?'<span class="spin"></span>':kind==='ok'?CHECK:'')+'<span><b>'+esc(txt)+'</b></span></div>':''}
function smallJpeg(file,max,q){
  return new Promise(function(res,rej){
    var url=URL.createObjectURL(file),im=new Image();
    im.onload=function(){var s=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*s));c.height=Math.max(1,Math.round(im.height*s));c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(url);try{res(c.toDataURL('image/jpeg',q))}catch(e){rej(e)}};
    im.onerror=function(){URL.revokeObjectURL(url);rej(new Error('img'))};im.src=url;
  });
}
function handlePhoto(file,id){
  if(!file||!id||!S.recipes[id])return;
  phSt('run','Gemmer foto…');
  var done=function(img,old){
    S.recipes[id]=Object.assign({},S.recipes[id],{img:img});
    var el=$('#hero-box');if(el)el.innerHTML=heroHtml(id,S.recipes[id]);
    if(old&&old.id&&S.assets&&S.assets.delete)S.assets.delete(old.id).catch(function(){});
    phSt('ok','Foto gemt');toast('Foto gemt');draw();
  };
  var fail=function(e){console.error(e);phSt('bad','Kunne ikke gemme fotoet. Prøv et andet billede.')};
  var old=S.recipes[id].img;
  if(S.assets){
    resizeImage(file,1400).then(function(b){return S.assets.upload(b)}).then(function(res){return up(udoc('recipes/'+id),{img:{id:res.id}}).then(function(){done({id:res.id},old)})}).catch(fail);
    return;
  }
  /* web version: no file storage, so a small copy (max 640 px) is kept in the recipe itself */
  smallJpeg(file,640,.72).then(function(d){
    if(d.length>350000)return smallJpeg(file,480,.6);return d;
  }).then(function(d){return up(udoc('recipes/'+id),{img:{data:d}}).then(function(){done({data:d},old)})}).catch(fail);
}

/* stock sheet */
function openStock(k){
  var p=k?pan(k):null,h;
  if(p&&p.leftover){
    h='<div class="grid2"><div class="field"><label for="sf-qty">Portioner tilbage</label><input id="sf-qty" inputmode="decimal" value="'+esc(dec(r1(curQty(p))))+'"></div><div class="field"><label for="sf-frz">Frosset den</label><input id="sf-frz" type="date" value="'+esc(p.frozen||'')+'"></div></div>'+
      '<div class="foot"><button class="btn" data-act="savefrz" data-k="'+esc(k)+'">Gem</button><button class="btn danger" data-act="delstock" data-k="'+esc(k)+'">Slet</button></div>';
    openSheet(p.name,h);return;
  }
  var more='<details class="rl"><summary>Flere indstillinger</summary><div class="rule">'+
    '<div class="field"><label for="sf-kp">Normalpris (kr pr. kg, l eller stk)</label><input id="sf-kp" inputmode="decimal" value="'+(p&&p.kp?esc(dec(p.kp)):'')+'"></div>'+
    '<div class="grid2"><div class="field"><label for="sf-cat">Afdeling</label><select id="sf-cat">'+opt(CATS,p?p.cat||'Andet':'Andet')+'</select></div><div class="field"><label for="sf-loc">Opbevaring</label><select id="sf-loc">'+opt([['','Skab og køl'],['fryser','Fryser']],p?p.loc||'':'')+'</select></div></div>'+
    '<div class="grid2"><div class="field"><label for="sf-kpo">Pris for økologi</label><input id="sf-kpo" inputmode="decimal" value="'+(p&&qprices(p).oko?esc(dec(qprices(p).oko)):'')+'"></div><div class="field"><label for="sf-kpf">Pris for frilands</label><input id="sf-kpf" inputmode="decimal" value="'+(p&&qprices(p).god?esc(dec(qprices(p).god)):'')+'"></div></div>'+
    '<div class="field"><label for="sf-kc">Kalorier pr. 100 g eller ml (pr. stk., hvis enheden er stk)</label><input id="sf-kc" inputmode="decimal" value="'+(p&&p.kc!=null&&p.kc!==''?esc(dec(p.kc)):'')+'"></div>'+
    '<div class="field"><label for="sf-exp">Holdbar til</label><input id="sf-exp" type="date" value="'+esc(p?p.expires||'':'')+'"></div>'+
    '<label class="chk"><input id="sf-per" type="checkbox"'+(p&&p.perish?' checked':'')+'> Frisk vare, der hurtigt bliver dårlig</label></div></details>';
  var vare='<div class="field"><label for="sf-name">Navn</label><input id="sf-name" type="text" value="'+esc(p?p.name:'')+'"'+(p?' disabled':'')+'></div>'+
    '<div class="grid2"><div class="field"><label for="sf-qty">På lager nu</label><input id="sf-qty" inputmode="decimal" value="'+(p?esc(dec(r1(curQty(p)))):'0')+'"></div><div class="field"><label for="sf-unit">Enhed</label><select id="sf-unit">'+opt(UNITS,p?p.unit:'g')+'</select></div></div>'+
    '<div class="field"><label for="sf-br">Foretrukne mærker</label><input id="sf-br" type="text" autocomplete="off" placeholder="fx Barilla, De Cecco" value="'+esc(p?brandsOf(k).join(', '):'')+'"><p class="hint">Valgfrit. Kun tilbud på dette mærke tæller.</p></div>'+
    +
    ruleHtml(p||{})+more;
  if(p){
    h=vare+'<div class="foot"><button class="btn" data-act="savestock" data-k="'+esc(k)+'">Gem</button><button class="btn danger" data-act="delstock" data-k="'+esc(k)+'">Slet vare</button></div>';
    openSheet(p.name,h);return;
  }
  h='<div class="seg" role="group"><button class="on" data-act="kind" data-k="vare" aria-pressed="true">Vare</button><button data-act="kind" data-k="rest" aria-pressed="false">Rest i fryseren</button></div>'+
    '<div id="f-vare">'+vare+'</div>'+
    '<div id="f-rest" hidden><div class="field"><label for="fz-n">Hvad er det?</label><input id="fz-n" type="text" placeholder="Fx lasagne"></div><div class="grid2"><div class="field"><label for="fz-q">Portioner</label><input id="fz-q" inputmode="decimal" value="2"></div><div class="field"><label for="fz-d">Frosset den</label><input id="fz-d" type="date" value="'+todayStr()+'"></div></div></div>'+
    '<div class="foot"><button class="btn" data-act="savestock" data-k="">Gem</button></div>';
  openSheet('Ny vare',h);
}
function saveStock(k){
  if(!k&&$('#f-rest')&&!$('#f-rest').hidden){addFreezer();return}
  var name=k?pan(k).name:$('#sf-name').value.trim().toLowerCase();
  if(!name){toast('Giv varen et navn');return}
  var old=k?pan(k):null,key=k||slug(name),rule=readRule($('#sheet .rule'));
  var kcv=$('#sf-kc').value.trim();
  var nkp=Math.max(0,num($('#sf-kp').value)),nko=Math.max(0,num($('#sf-kpo').value)),nkf=Math.max(0,num($('#sf-kpf').value)),oq=qprices(old);
  var o=Object.assign({},old||{},{name:name,unit:$('#sf-unit').value,price:old?old.price||0:0,kp:nkp,kpo:nko,kpf:nkf,kpg:nko||nkf,pv:(old&&Math.abs((old.kp||0)-nkp)<1e-9&&Math.abs(oq.oko-nko)<1e-9&&Math.abs(oq.god-nkf)<1e-9)?(old.pv||''):'',perish:$('#sf-per').checked,cat:$('#sf-cat').value,loc:$('#sf-loc').value,expires:$('#sf-exp').value||'',ex:false},rule,qpatch(num($('#sf-qty').value)));
  if(kcv!=='')o.kc=Math.max(0,num(kcv));
  var kpC=!old?(o.kp>0||o.kpo>0||o.kpf>0):(Math.abs((old.kp||0)-o.kp)>1e-9||Math.abs(oq.oko-o.kpo)>1e-9||Math.abs(oq.god-o.kpf)>1e-9);if(kpC)o.kpx=true;
  var kcC=kcv!==''&&(!old||old.kc==null||Math.abs(Number(old.kc)-o.kc)>1e-9);if(kcC)o.kcx=true;
  var patch={};patch[key]=o;
  var nb=parseBrands($('#sf-br').value),bch=JSON.stringify(nb)!==JSON.stringify(brandsOf(key));
  save(function(){var ps=[up(udoc('store/pantry'),{items:patch})];if(bch)ps.push(setBrands(key,nb,name));return Promise.all(ps).then(function(){closeSheet();toast('Gemt')})});
}
/* preferred brands: one doc, store/brands = {b:{key:[brands]},n:{key:name}} */
function setBrands(k,list,name){
  var m=Object.assign({},S.brands),n=Object.assign({},S.bnames);
  if(list.length){m[k]=list;n[k]=name||n[k]||(pan(k)&&pan(k).name)||k}else{delete m[k];delete n[k]}
  S.brands=m;S.bnames=n;draw();
  return udoc('store/brands').set({b:m,n:n});
}
function brandName(k,nm){return nm||(pan(k)&&pan(k).name)||(S.bnames||{})[k]||k}
function openBrand(k,nm){
  nm=brandName(k,nm);
  var cur=brandsOf(k),sg=brandSuggest(k,nm,wid()),seen={},oth=[];
  sg.forEach(function(x){seen[bnorm(x.n)]=1});
  Object.keys(S.brands||{}).forEach(function(q){if(q===k)return;brandsOf(q).forEach(function(b){var n=bnorm(b);if(!seen[n]){seen[n]=1;oth.push(b)}})});
  oth=oth.slice(0,8);
  var chip=function(b,sub){var on=cur.some(function(x){return bnorm(x)===bnorm(b)});return '<button type="button" class="chip'+(on?' on':'')+'" data-act="brpick" data-b="'+esc(b)+'">'+esc(b)+(sub?' · '+esc(sub):'')+'</button>'};
  var h='<p class="muted">Foretrukket mærke for <b>'+esc(nm)+'</b>. Kun tilbud på mærket tæller. Det huskes.</p>'+
    '<div class="field"><label for="br-in">Foretrukne mærker</label><input id="br-in" type="text" autocomplete="off" placeholder="fx Barilla, De Cecco" value="'+esc(cur.join(', '))+'"><p class="hint">Flere mærker adskilles med komma. Tomt betyder alle.</p></div>';
  if(sg.length)h+='<div class="field"><label>Mærker i ugens tilbud</label><div class="brs">'+sg.map(function(x){return chip(x.n,x.s.join(', '))}).join('')+'</div><p class="hint">Foreslået ud fra tilbudsaviserne.</p></div>';
  else h+='<p class="hint">Ingen tilbud på '+esc(nm)+' i dine butikker denne uge.</p>';
  if(oth.length)h+='<div class="field"><label>Mærker, du har valgt andre steder</label><div class="brs">'+oth.map(function(b){return chip(b)}).join('')+'</div></div>';
  h+='<div class="foot"><button class="btn" data-act="brsave" data-k="'+esc(k)+'" data-n="'+esc(nm)+'">Gem</button>'+(cur.length?'<button class="btn danger" data-act="brdel" data-k="'+esc(k)+'">Fjern mærke</button>':'')+'</div>';
  openSheet(nm,h);
}
function openBrands(){
  var ks=Object.keys(S.brands||{}).filter(function(k){return brandsOf(k).length}).sort(function(a,b){return brandName(a).localeCompare(brandName(b),'da')});
  var h=ks.length?'<div class="list">'+ks.map(function(k){return '<button class="li" data-act="brand" data-k="'+esc(k)+'" data-n="'+esc(brandName(k))+'"><span><span class="nm">'+esc(brandName(k))+'</span><span class="sub">'+esc(brandsOf(k).join(', '))+'</span></span><span class="qt">Ret</span></button>'}).join('')+'</div>':'<p class="muted">Ingen mærker valgt. Tryk &quot;+ Mærke&quot; ved en vare på indkøbslisten.</p>';
  openSheet('Mine foretrukne mærker',h);
}
function addFreezer(){
  var n=$('#fz-n').value.trim(),q=num($('#fz-q').value);if(!n||!(q>0)){toast('Skriv hvad det er, og antal portioner');return}
  var k='fr-'+uid(),o={name:n,unit:'stk',qty:r1(q),at:todayStr(),min:0,pack:0,price:0,perish:false,cat:'Frost',loc:'fryser',frozen:$('#fz-d').value||todayStr(),rule:'never',leftover:true,expires:'',ex:false},patch={};patch[k]=o;
  save(function(){return up(udoc('store/pantry'),{items:patch}).then(function(){closeSheet();toast('Lagt i fryseren')})});
}

/* rate a dish after it was made */
function rateBody(){
  var rt=S.rt,r=S.recipes[rt.id]||{};
  return '<p class="muted">Hvordan var <b>'+esc(r.name||'retten')+'</b>?</p>'+
    '<div class="stars" role="group" aria-label="Stjerner">'+[1,2,3,4,5].map(function(n){return '<button class="'+(rt.s>=n?'on':'')+'" data-act="rate" data-s="'+n+'" aria-label="'+n+' af 5" aria-pressed="'+(rt.s===n)+'">'+(rt.s>=n?'★':'☆')+'</button>'}).join('')+'</div>'+
    '<div class="field"><label>Skal den med i en senere ugemenu?</label><div class="seg3" role="group" aria-label="Gentag">'+[['yes','Ja, gerne'],['maybe','Måske'],['no','Nej']].map(function(o){return '<button class="'+(rt.again===o[0]?'on':'')+(o[0]==='no'?' no':'')+'" data-act="again" data-v="'+o[0]+'" aria-pressed="'+(rt.again===o[0])+'">'+o[1]+'</button>'}).join('')+'</div></div>'+
    '<div class="foot"><button class="btn" data-act="ratesave">Gem</button><button class="btn ghost" data-act="close">Spring over</button></div>';
}
function rateDraw(){var b=document.querySelector('#sheet .sh-body');if(b)b.innerHTML=rateBody()}
function openRate(id,i){
  var r=S.recipes[id];if(!r)return;
  var w=wid(),d=((S.plans[w]||{}).days||[])[i]||{};
  S.rt={id:id,i:i,w:w,s:Number(d.rate)||0,again:r.again||'',touched:!!r.again};
  openSheet('Hvordan var den?',rateBody());
}
/* read-only recipe: ingredients for the user's number of persons, and the method */
function openCook(id){
  var r=S.recipes[id];if(!r)return;
  var pn=S.settings.persons||2,f=pn/2,k=kalc(r),al=recAlg(r);
  var h='<div class="stat">'+(r.minutes?'<span class="chip">'+r.minutes+' min</span>':'')+(k?'<span class="chip">'+k+'</span>':'')+(r.kind==='weekend'?'<span class="chip wk">Weekend</span>':'')+(r.fav?'<span class="hrt">♥</span>':'')+dietChip(r)+'</div>';
  h+='<div class="sec"><div class="lbl">Ingredienser til '+esc(hhLabel())+'</div><div class="list cookl">'+(r.ing||[]).map(function(g){return '<div class="ci"><span>'+esc(g.n)+'</span><span class="mono">'+esc(fq(g.q*f,g.u))+'</span></div>'}).join('')+'</div></div>';
  var st=String(r.method||'').split(/\n+/).map(function(x){return x.trim().replace(/^\d+[.)]\s*/,'')}).filter(Boolean);
  if(st.length)h+='<div class="sec"><div class="lbl">Fremgangsmåde</div><ol class="steps">'+st.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ol><p class="hint">Salt, peber, olie og krydderier står ikke på indkøbslisten.</p></div>';
  if(al.length)h+='<p class="hint">Kan indeholde (skøn): '+esc(al.map(function(k){return ALG[k].n.toLowerCase()}).join(', '))+'. Tjek varedeklarationen.</p>';
  if(safeUrl(r.url))h+='<a class="srcl" href="'+esc(safeUrl(r.url))+'" target="_blank" rel="noopener noreferrer">'+LINK+'<span>Åbn opskriften på '+esc(srcHost(r.url))+'</span></a>';
  if(r.book&&r.page)h+='<p class="hint">Står i '+esc(r.book)+', side '+r.page+'.</p>';
  h+='<div class="foot"><button class="btn ghost" data-act="editrec" data-id="'+esc(id)+'">Ret opskrift</button></div>';
  openSheet(r.name,h);
}

/* the form shared by Indstillinger (prefix st) and the welcome sheet (prefix ob) */
function hhNote(x){return 'Børn regnes som '+dec(KID_W)+' voksen i mængderne. Det giver '+nf(r1(x.adults+KID_W*x.kids),1)+' portioner.'}
function prefsForm(p,x){
  var stOn=function(n){return (x.stores||STORES).indexOf(n)>-1};
  return ''+
    '<div class="field"><label>Hvem spiser med?</label><div class="grid2"><div class="field"><label for="'+p+'-a">Voksne</label><input id="'+p+'-a" inputmode="numeric" value="'+esc(x.adults)+'"></div><div class="field"><label for="'+p+'-k">Børn</label><input id="'+p+'-k" inputmode="numeric" value="'+esc(x.kids)+'"></div></div><p class="hint" id="'+p+'-hh">'+esc(hhNote(x))+'</p></div>'+
    '<div class="field"><label>Butikker, du vil handle i</label><div class="algs">'+STORES.map(function(n){return '<label class="chk"><input type="checkbox" class="'+p+'-s" value="'+esc(n)+'"'+(stOn(n)?' checked':'')+'> '+esc(n)+'</label>'}).join('')+'</div><p class="hint">Fravælg butikker, du ikke har i nærheden.</p><p class="hint">Med 2–3 butikker sammenlignes alle varer dem imellem.</p></div>'+
    '<div class="field"><label for="'+p+'-bud">Madbudget</label><div class="grid2"><input id="'+p+'-bud" inputmode="numeric" placeholder="fx 900" value="'+(x.budget>0?esc(x.budget):'')+'" aria-label="Madbudget i kroner"><select id="'+p+'-bper" aria-label="Periode"><option value="week"'+(x.budgetPer==='month'?'':' selected')+'>kr pr. uge</option><option value="month"'+(x.budgetPer==='month'?' selected':'')+'>kr pr. måned</option></select></div><p class="hint">Valgfrit. Planen vælger billigere retter, hvis den ellers overskrider budgettet.</p></div>'+
    '<div class="field"><label>Kost</label><label class="chk"><input id="'+p+'-veg" type="checkbox"'+(x.veg?' checked':'')+'> Kun vegetarretter</label><label class="chk"><input id="'+p+'-quick" type="checkbox"'+(x.quick?' checked':'')+'> Hurtige hverdagsretter (højst 30 min.)</label></div>'+
    '<div class="field"><label>Allergener, der skal undgås</label><div class="algs">'+ALG_KEYS.map(function(k){return '<label class="chk"><input type="checkbox" class="'+p+'-al" value="'+k+'"'+((x.allergens||[]).indexOf(k)>-1?' checked':'')+'> '+esc(ALG[k].n)+'</label>'}).join('')+'</div><p class="hint">Retter med disse allergener udelades. Skønnet bygger på ingrediensnavne, så tjek varedeklarationen.</p></div>'+
    '<div class="field"><label>Kød, fisk og æg</label><label class="chk"><input id="'+p+'-o" type="checkbox"'+(x.oko?' checked':'')+'> Økologi</label><label class="chk"><input id="'+p+'-fr" type="checkbox"'+(x.free?' checked':'')+'> Frilands (3 hjerter, frilandsæg)</label><p class="hint">Vælg én eller begge. Priser og tilbud følger valget. Højst 4 kødretter om ugen.</p></div>'+
    '<div class="field"><label>Frugt og grønt</label><label class="chk"><input id="'+p+'-ov" type="checkbox"'+(x.okoVeg?' checked':'')+'> Økologi</label><p class="hint">Vælges for sig, uafhængigt af kødet.</p></div>';
}
function readForm(p){
  var g=function(id){return document.getElementById(p+'-'+id)};
  var st=[].map.call(document.querySelectorAll('.'+p+'-s:checked'),function(x){return x.value});
  return{
    adults:Math.max(1,Math.round(num(g('a').value))||1),kids:Math.max(0,Math.round(num(g('k').value))||0),
    budget:Math.max(0,Math.round(num(g('bud').value))),budgetPer:g('bper').value==='month'?'month':'week',
    veg:g('veg').checked,quick:g('quick').checked,
    allergens:[].map.call(document.querySelectorAll('.'+p+'-al:checked'),function(x){return x.value}),
    stores:st.length?st:STORES.slice(),oko:g('o').checked,free:g('fr').checked,okoVeg:g('ov').checked
  };
}
function hhUpdate(p){
  var a=$('#'+p+'-a'),k=$('#'+p+'-k'),n=$('#'+p+'-hh');if(!a||!k||!n)return;
  n.textContent=hhNote({adults:Math.max(1,Math.round(num(a.value))||1),kids:Math.max(0,Math.round(num(k.value))||0)});
}
/* settings */
function openSettings(){
  var s=S.settings;
  var h=prefsForm('st',s)+
    '<label class="chk"><input id="st-f" type="checkbox"'+(s.friWeekend?' checked':'')+'> Fredag tæller som weekend</label>'+
    '<label class="chk"><input id="st-c" type="checkbox"'+(s.candy?' checked':'')+'> Sæt weekendslik på indkøbslisten</label>'+
    '<div class="field"><label>Foretrukne mærker</label><p class="hint">Mærker vælges pr. vare og huskes.</p><button class="btn ghost sm" data-act="brands">Se mine mærker ('+Object.keys(S.brands||{}).filter(function(k){return brandsOf(k).length}).length+')</button></div>'+
    '<p class="hint">Retter, lager og ugeplan er private. Tilbud og priser deles.</p>'+
    webBlock()+
    '<div class="foot"><button class="btn" data-act="savesettings">Gem</button></div>';
  openSheet('Indstillinger',h);webRefresh();
}
/* only in the web app: notifications and log out */
function webBlock(){
  var W=window.UGEKURV_WEB;if(!W)return '';
  return '<div class="field"><label>Notifikationer</label><div id="pn-b">'+pnSwitch(false,true,'Tjekker…')+'</div><p class="hint" id="pn-t" hidden></p></div>'+
    '<div class="field"><label>Bruger</label><p class="hint">Logget ind som <b>'+esc(W.name||'')+'</b>. Koden kan ikke nulstilles, så husk den.</p><button class="btn ghost sm" data-act="logout">Log ud</button></div>';
}
function pnSwitch(on,dis,sub){return '<button class="lowcard pn" role="switch" aria-checked="'+(!!on)+'" data-act="pushtog"'+(dis?' disabled aria-disabled="true"':'')+'><span class="lc"><b>Ugentlig påmindelse</b><span>'+esc(sub||'Fredag aften, når ugens tilbud er klar.')+'</span></span><span class="sw" aria-hidden="true"></span></button>'}
function webRefresh(){
  var W=window.UGEKURV_WEB;if(!W||!$('#pn-t'))return;
  W.push.status().then(function(s){
    var t=$('#pn-t'),b=$('#pn-b');if(!t||!b)return;
    var no=function(msg){b.innerHTML=pnSwitch(false,true);t.hidden=false;t.textContent=msg};
    if(s.state==='unsupported')return no(s.msg||'Notifikationer virker ikke i denne browser.');
    if(s.state==='needhome')return no('På iPhone: læg appen på hjemmeskærmen (Del › Føj til hjemmeskærm), åbn den derfra, og slå notifikationer til.');
    if(s.state==='denied')return no('Notifikationer er blokeret. Slå dem til i telefonens indstillinger.');
    t.hidden=true;b.innerHTML=pnSwitch(s.state!=='off',false);
  }).catch(function(){var t=$('#pn-t'),b=$('#pn-b');if(b)b.innerHTML=pnSwitch(false,true);if(t){t.hidden=false;t.textContent='Kunne ikke tjekke notifikationer.'}});
}

/* ---------- velkommen og startpakke ---------- */
function maybeOnboard(){
  if(S.onb||S.ro)return;
  if(S.hasSettings!==false||S.hasPantry!==false)return;
  if(!(S.ready.settings&&S.ready.pantry&&S.ready.ref&&S.ready.starter))return;
  if($('#sheet').firstChild)return;
  S.onb=true;openOnboard();
}
var OB0={adults:2,kids:0,budget:0,budgetPer:'week',veg:false,quick:false,allergens:[],stores:null,oko:true,free:true,okoVeg:false};
function openOnboard(){
  var n=Object.keys(S.starter).length,ni=Object.keys((S.ref&&S.ref.items)||{}).length,o=Object.assign({},OB0,S.ob||{});
  var h='<p class="muted">Din egen ugeplan, dit eget lager og dine egne retter. Alt kan ændres under Indstillinger.</p>'+prefsForm('ob',o);
  var st=!(n||ni)||o.mode!=='empty';
  if(n||ni)h+='<div class="field"><label>Start</label><label class="chk"><input type="radio" name="ob-m" value="starter"'+(o.mode==='empty'?'':' checked')+'> Med standardvarer og '+n+' startretter</label><p class="hint">Startretter med links og enkelte opskrifter. Du kan slette dem og tilføje egne.</p><label class="chk"><input type="radio" name="ob-m" value="empty"'+(o.mode==='empty'?' checked':'')+'> Helt tomt</label></div>';
  h+='<div class="foot"><button class="btn" id="ob-go" data-act="obnext">'+(n&&st?'Næste: vælg favoritter':'Kom i gang')+'</button></div>';
  openSheet('Velkommen til FastWeek',h);
}
/* favourite dishes: chosen at start (from the starter dishes) or later (from my dishes) */
function favSource(){return S.fv.mode==='onboard'?S.starter:S.recipes}
function favRows(){
  var src=favSource(),ids=Object.keys(src),groups={},order=[['okse','Oksekød'],['kylling','Kylling'],['svin','Svinekød'],['fisk','Fisk'],['vegetar','Vegetar og æg'],['','Andet']];
  ids.forEach(function(id){var r=src[id],g=r.prot==='aeg'?'vegetar':(r.prot||'');(groups[g]=groups[g]||[]).push(id)});
  return order.map(function(o){var g=groups[o[0]];if(!g)return '';
    return '<div class="sec"><div class="lbl">'+esc(o[1])+'</div><div class="list">'+g.sort(function(a,b){return src[a].name.localeCompare(src[b].name,'da')}).map(function(id){
      var r=src[id],on=!!S.fv.sel[id];
      return '<button class="li rec fvrow" data-act="fvtog" data-id="'+esc(id)+'" aria-pressed="'+on+'">'+artBox(r,id)+'<span><span class="nm">'+esc(r.name)+'</span><span class="sub">'+(r.minutes?'<span>'+r.minutes+' min</span>':'')+(r.kind==='weekend'?'<span class="chip wk">Weekend</span>':'')+'</span></span><span class="hb" aria-hidden="true">'+(on?'♥':'♡')+'</span></button>'}).join('')+'</div></div>'}).join('');
}
function favCount(){return Object.keys(S.fv.sel).filter(function(k){return S.fv.sel[k]}).length}
function openFavs(mode){
  var sel={};
  if(mode==='edit')Object.keys(S.recipes).forEach(function(id){if(S.recipes[id].fav)sel[id]=true});
  S.fv={mode:mode,sel:sel,orig:JSON.parse(JSON.stringify(sel))};
  var intro=mode==='onboard'?'Tryk på hjertet ved jeres favoritter. Appen vælger lignende retter.':'Tryk på hjertet ved dine favoritter. Appen vælger lignende retter.';
  var h='<p class="muted">'+intro+'</p><p class="hint" id="fv-n"></p>'+favRows()+
    '<div class="foot">'+(mode==='onboard'?'<button class="btn" data-act="obfinish">Kom i gang</button><button class="btn ghost" data-act="obback">Tilbage</button>':'<button class="btn" data-act="fvsave">Gem favoritter</button>')+'</div>';
  openSheet(mode==='onboard'?'Dine favoritretter':'Favoritter',h);favNote();
}
function favNote(){var n=favCount(),e=$('#fv-n');if(e)e.textContent=n?n+(n===1?' valgt':' valgt')+(n<3?'. Vælg gerne 3 til 8.':'.'):'Vælg gerne 3 til 8 retter. Du kan springe over.'}
function missingItems(recs){
  var patch={},t=todayStr();
  recs.forEach(function(r){(r.ing||[]).forEach(function(g){var k=slug(g.n);if((S.praw&&S.praw[k])||patch[k])return;var rf=(S.ref.items||{})[k];
    patch[k]=rf?Object.assign({},rf,{qty:0,at:t,rule:'never',min:0,use:0,days:2,expires:'',ex:false,price:0}):{name:g.n,unit:g.u,qty:0,price:0,perish:false,cat:'Andet',expires:'',at:t,rule:'never',min:0}})});
  return patch;
}
function freshRecipe(r){var o=Object.assign({},r);delete o.img;o.example=false;o.rating=0;o.made={count:0,last:'',wd:[0,0,0,0,0,0,0]};return o}

/* ---------- ugens spørgsmål ---------- */
var TIMES=[[30,'30'],[45,'45'],[999,'60+']];
var CHOICES=[['0','Ingen'],['auto','Valgfri'],['1','1×'],['2','2×'],['3','3×']];
function wzSlots(P){var eff=effModes(P);return eff.filter(function(m){return m==='cook'||m==='dbl'}).length}
function wzRows(){
  var P=S.wz.P,eff=effModes(P),h='';
  for(var i=0;i<7;i++){
    var dd=parseYmd(addDays(S.wz.mon,i)).getUTCDate(),m=eff[i],lab='<div class="wd-l"><b>'+DS[i]+'</b><span>'+dd+'.</span></div>';
    if(m==='lo'){var cr=i===0&&P.carry&&S.recipes[P.carry];h+='<div class="wd lo">'+lab+'<div class="wd-lo">Rester fra '+(i===0?'søndag'+(cr?' ('+esc(cr.name)+')':''):DAYS[i-1].toLowerCase())+'</div></div>';continue}
    var off=m==='off',dp=P.days[i];
    h+='<div class="wd'+(isWeekend(i)?' wk':'')+(off?' off':'')+'">'+lab+
      '<div class="seg3" role="group" aria-label="Tid '+DAYS[i].toLowerCase()+'">'+TIMES.map(function(t){return '<button class="'+(dp.t===t[0]?'on':'')+'" data-act="wzt" data-i="'+i+'" data-t="'+t[0]+'"'+(off?' disabled':'')+' aria-pressed="'+(dp.t===t[0])+'">'+t[1]+'</button>'}).join('')+'</div>'+
      '<button class="tg'+(m==='dbl'?' on':'')+'" data-act="wzm" data-i="'+i+'" data-m="dbl" aria-pressed="'+(m==='dbl')+'" aria-label="Dobbelt portion '+DAYS[i].toLowerCase()+'"'+(off?' disabled':'')+'>2×</button>'+
      '<button class="tg'+(off?' on':'')+'" data-act="wzm" data-i="'+i+'" data-m="off" aria-pressed="'+off+'" aria-label="Ude eller ingen mad '+DAYS[i].toLowerCase()+'">Ude</button></div>';
  }
  return h;
}
function wzCtx(){
  var s=S.settings,b=[hhLabel(s)];
  if(s.budget>0)b.push('budget '+kr(s.budget)+(s.budgetPer==='month'?' om måneden':' om ugen'));
  if(s.veg)b.push('kun vegetarretter');
  if(s.quick)b.push('hurtige hverdagsretter');
  if((s.allergens||[]).length)b.push('uden '+s.allergens.map(function(k){return ALG[k].n.toLowerCase()}).join(', '));
  return 'Planen tager højde for: '+b.join(' · ')+'. Ret under Indstillinger.';
}
function wzN(){return S.wz.P.mode==='self'?1:3}
function modeCard(m,on,t,d,x){return '<button class="mode'+(on?' on':'')+'" role="radio" aria-checked="'+on+'" data-act="wzmode" data-m="'+m+'"><span class="mode-r" aria-hidden="true"></span><span class="mode-t"><b>'+t+'</b><span>'+d+'</span>'+(x?'<span class="mode-s">'+esc(x)+'</span>':'')+'</span></button>'}
function wzBody(){
  var P=S.wz.P,w=weekId(S.wz.mon);
  if(S.wz.step===1)
    return '<h2 class="wz-q">Hvordan vil du planlægge uge '+isoWeek(S.wz.mon)[1]+'?</h2><p class="wz-s">Du kan skifte, når du vil.</p><div class="modes" role="radiogroup" aria-label="Planlægning">'+
      modeCard('offers',P.mode!=='self','Efter ugens tilbud','Appen vælger retter ud fra tilbuddene og viser, hvor du skal handle.',offerStat(w))+
      modeCard('self',P.mode==='self','Jeg vælger selv','Du vælger retterne. Appen finder billigste butikker.','')+'</div>';
  if(S.wz.step===2)
    return '<h2 class="wz-q">Hvordan ser uge '+isoWeek(S.wz.mon)[1]+' ud?</h2><p class="wz-s">Hvor meget tid har du pr. dag? Dobbelt portion giver rester næste dag.</p>'+
      '<div class="wz-all"><span class="lbl">Alle dage · minutter</span><div class="seg3" role="group" aria-label="Tid på alle dage">'+TIMES.map(function(t){return '<button data-act="wzall" data-t="'+t[0]+'">'+t[1]+'</button>'}).join('')+'</div></div>'+wzRows();
  return '<h2 class="wz-q">Hvad har I lyst til?</h2><p class="wz-s">Hvor mange gange pr. uge? Vælg »Valgfri«, hvis appen må vælge.</p>'+
    ASK.map(function(a){var v=String(P.prot[a[0]]);return '<div class="pr-row"><b>'+a[1]+'</b><div class="seg5" role="group" aria-label="'+a[1]+' pr. uge">'+CHOICES.map(function(c){return '<button class="'+(v===c[0]?'on':'')+(c[0]==='0'?' no':'')+'" data-act="wzp" data-p="'+a[0]+'" data-v="'+c[0]+'" aria-pressed="'+(v===c[0])+'">'+c[1]+'</button>'}).join('')+'</div></div>'}).join('')+
    '<p class="hint">'+esc(wzCtx())+'</p>'+'<button class="lowcard" role="switch" aria-checked="'+(!!P.low)+'" data-act="wzlow"><span class="lc"><b>Kaloriefattigt</b><span>Kun retter under ca. '+LOW_MAX+' kcal pr. portion. Ingen weekendslik på listen.</span></span><span class="sw"></span></button>';
}
function wzFoot(){
  var P=S.wz.P,eff=effModes(P),slots=wzSlots(P),dbl=eff.filter(function(m){return m==='dbl'}).length,off=eff.filter(function(m){return m==='off'}).length;
  if(S.wz.step===1){
    var self=P.mode==='self',later=S.wz.auto?'<button class="lnk" data-act="wzclose">Spørg mig senere</button>':'';
    return '<div class="wz-sum">'+(self?'Du vælger retterne selv.':'Planen vægter tilbud, lager og dine ønsker.')+'</div>'+(self?'<button class="btn block" data-act="wzdone">Gem valg</button>':'<button class="btn block" data-act="wznext">Næste</button>')+later;
  }
  if(S.wz.step===2)
    return '<div class="wz-sum">'+slots+(slots===1?' aften med madlavning':' aftener med madlavning')+(dbl?' · '+dbl+' dobbelt':'')+(off?' · '+off+' uden mad':'')+'</div><button class="btn block" data-act="wznext">Næste</button><button class="btn ghost block" data-act="wzback">Tilbage</button>';
  var want=0;ASK.forEach(function(a){if(P.prot[a[0]]>0)want+=P.prot[a[0]]});
  var bits=prefsSummary(P).filter(function(b){return !/dobbelt|uden mad|hurtige/.test(b)});
  var sum=want>slots?'Du har bedt om '+want+' retter, men har kun '+slots+' aftener.':(bits.length?bits.join(' · '):'Appen vælger frit mellem alle retter');
  return '<div class="wz-sum">'+esc(sum)+'</div><button class="btn block" data-act="wzdone">Lav madplan</button><button class="btn ghost block" data-act="wzback">Tilbage</button>';
}
function wzDraw(fresh){
  var b=$('#wz-body');if(!b)return;var top=b.scrollTop;
  b.className='wz-body'+(fresh?' fresh':'');b.innerHTML=wzBody();b.scrollTop=fresh?0:top;
  $('#wz-foot').innerHTML=wzFoot();
  var n=wzN();$('#wz-step').textContent='Trin '+S.wz.step+' af '+n;
  var bar=$('#wz-bar'),bh='';for(var i=1;i<=n;i++)bh+='<i'+(i<=S.wz.step?' class="on"':'')+'></i>';bar.innerHTML=bh;
}
function openWizard(mon,auto){
  var w=weekId(mon),P=getPrefs(w);
  S.wz={mon:mon,w:w,step:1,auto:!!auto,P:JSON.parse(JSON.stringify({days:P.days,prot:P.prot,low:P.low,carry:P.carry,mode:P.mode}))};
  $('#sheet').innerHTML='<div class="scrim" data-act="wzclose"></div><div class="sheet wiz" role="dialog" aria-modal="true" aria-label="Ugens ønsker"><div class="sh-grab"></div><div class="wz-head"><div class="wz-top"><span class="wz-step" id="wz-step"></span><button class="x" data-act="wzclose" aria-label="Luk">×</button></div><div class="wz-bar" id="wz-bar"></div></div><div class="wz-body fresh" id="wz-body"></div><div class="wz-foot" id="wz-foot"></div></div>';
  document.body.classList.add('lock');
  wzDraw(true);
}
function skipKey(w){return 'ugk-skip-'+w}
function wasSkipped(w){if(S.skip[w])return true;try{return localStorage.getItem(skipKey(w))==='1'}catch(e){return false}}
function markSkipped(w){S.skip[w]=1;try{localStorage.setItem(skipKey(w),'1')}catch(e){}}
function maybeWizard(){
  if(S.wzChecked)return;
  if(!(S.ready.pantry&&S.ready.settings&&S.ready.recipes&&S.ready.plans&&S.ready.prefs))return;
  if(!Object.keys(S.recipes).length||$('#sheet').firstChild)return;
  S.wzChecked=true;
  var tm=targetMon(),w=weekId(tm),cur=weekId(mondayOf(todayStr()));
  if(S.prefs[w]&&S.prefs[w].done)return;
  var curPlan=((S.plans[cur]||{}).days||[]).some(function(d){return d&&(d.r||d.f||d.off)});
  if(wdIdx(todayStr())<3&&curPlan)return;
  if(wasSkipped(w))return;
  S.mon=tm;S.tab='week';draw();openWizard(tm,true);
}

/* ---------- actions ---------- */
function savePlanDays(w,days){return udoc('plans/'+w).set({week:w,start:monOfWeek(w),days:days,gen:Date.now()}).then(function(){return syncCarry(w,days)})}
/* Sunday double portion -> Monday next week is leftovers (and the other way round) */
function syncCarry(w,days){
  var nw=weekId(addDays(monOfWeek(w),7)),np=S.plans[nw];if(!np||!np.days)return;
  var sun=days[6],want=sun&&sun.r&&sun.dbl&&!sun.off&&!sun.lo&&!sun.f?sun.r:'',nd=fillDays(np.days.map(function(x){return Object.assign({},x)})),cur=nd[0]||{},isCarry=!!(cur.lo&&cur.from===-1);
  if(want){
    if(cur.r&&!isCarry&&(cur.lock||cur.done||cur.f))return;
    if(isCarry&&cur.r===want)return;
    nd[0]={r:want,lo:true,from:-1,done:!!(isCarry&&cur.done),lock:false};
  }else if(isCarry){nd[0]={r:'',done:false,lock:false}}
  else return;
  return udoc('plans/'+nw).set({week:nw,start:monOfWeek(nw),days:nd,gen:np.gen||Date.now()});
}
function daysOf(w){return (((S.plans[w]||{}).days)||[]).map(function(x){return Object.assign({},x)})}
function fillDays(days){while(days.length<7)days.push({r:'',done:false,lock:false});return days}
function makePlan(w,quiet){
  S.planNote='';
  var days=generate(w);if(!days){toast(GEN_WHY==='filter'?'Ingen af dine retter passer til dine valg (kost og allergener)':'Der er ingen retter at vælge imellem');return Promise.resolve(false)}
  var ids=daysIds(days),B=weekBudget(),nfree=days.filter(function(d){return d&&!d.r&&!d.off&&!d.f&&!d.lo}).length;
  if(GEN_WHY==='few'&&nfree)S.planNote='Kun '+(7-nfree)+' retter passer til dine valg. Tilføj flere retter.';
  else if(B>0){var est=planEst(ids);if(est>B*1.05)S.planNote='Ca. '+kr(Math.round(est-B))+' over dit budget.'}
  var su0=stockUse(ids,ctxFor(w).exp),un=su0.used.filter(function(x){return x.urgent});
  if(un.length)S.planNote=(S.planNote?S.planNote+' ':'')+'Bruger '+un.slice(0,3).map(function(x){return x.name.toLowerCase()}).join(', ')+' fra lageret.';
  var P=getPrefs(w),offM=P.mode==='offers'&&activeOffers(w).length>0;
  return save(function(){
    return savePlanDays(w,days).then(function(){
      var L=S.lists[w]||{};
      if(S.settings.candy&&!P.low&&!L.slik)return up(udoc('lists/'+w),{extra:(L.extra||[]).concat([{id:'slik',name:'Weekendslik'}]),slik:true});
    }).then(function(){if(!quiet)toast((offM?'Madplan lavet efter ugens tilbud':'Madplan lavet ud fra dit lager')+(S.planNote?'. '+S.planNote:''));return true});
  });
}
var ACT={
  tab:function(d){S.tab=d.tab;draw();window.scrollTo(0,0)},
  wk:function(d){S.mon=addDays(S.mon,7*Number(d.d));draw()},
  gear:openSettings,
  menu:function(){if(menuIsOpen())closeMenu();else openMenu()},
  menuclose:closeMenu,
  mgo:function(d){
    var g=d.go;closeMenu();
    if(g==='week'||g==='stock'||g==='shop')ACT.tab({tab:g});
    else if(g==='recs')ACT.recs({});
    else if(g==='scan')ACT.scanbook({});
    else if(g==='favs')ACT.favs({});
    else if(g==='gear')ACT.gear({});
  },
  close:closeSheet,
  stopread:function(){if(S.ctl)S.ctl.abort()},
  gen:function(){makePlan(wid())},
  pickstore:function(d){S.sel=d.s;S.selSet=true;draw()},
  wizard:function(){openWizard(S.mon,false)},
  wzclose:function(){if(S.wz&&S.wz.auto)markSkipped(S.wz.w);closeSheet()},
  wzt:function(d){S.wz.P.days[Number(d.i)].t=Number(d.t);wzDraw()},
  wzall:function(d){S.wz.P.days.forEach(function(x){x.t=Number(d.t)});wzDraw()},
  wzm:function(d){
    var i=Number(d.i),day=S.wz.P.days[i];day.m=day.m===d.m?'cook':d.m;wzDraw();
  },
  wzp:function(d){S.wz.P.prot[d.p]=d.v==='auto'?'auto':Number(d.v);wzDraw()},
  wzlow:function(){S.wz.P.low=!S.wz.P.low;wzDraw()},
  wzmode:function(d){S.wz.P.mode=d.m==='self'?'self':'offers';wzDraw()},
  wznext:function(){S.wz.step=Math.min(wzN(),S.wz.step+1);wzDraw(true)},
  wzback:function(){S.wz.step=Math.max(1,S.wz.step-1);wzDraw(true)},
  wzdone:function(){
    var z=S.wz,w=z.w,P=z.P;
    var self=P.mode==='self';
    S.prefs[w]={week:w,days:P.days,prot:P.prot,low:P.low,mode:self?'self':'offers',done:true,at:Date.now()};
    save(function(){
      return udoc('prefs/'+w).set(S.prefs[w]).then(function(){return self?null:makePlan(w,true)}).then(function(ok){
        closeSheet();S.mon=z.mon;S.tab='week';draw();window.scrollTo(0,0);
        toast(self?'Uge '+isoWeek(z.mon)[1]+': du vælger retterne selv':(ok?'Madplanen for uge '+isoWeek(z.mon)[1]+' er klar':'Valgene er gemt')+(ok&&S.planNote?'. '+S.planNote:''));
      });
    });
  },
  pick:function(d){openPick(Number(d.i))},
  setday:function(d){
    var w=wid(),days=fillDays(daysOf(w)),i=Number(d.i),old=days[i]||{};
    days[i]=d.id?{r:d.id,done:false,lock:true}:{r:'',done:false,lock:false};
    if(d.id&&old.dbl&&!old.lo)days[i].dbl=true;
    if(days[i+1]&&days[i+1].lo&&days[i+1].from===i){days[i+1]=d.id?Object.assign({},days[i+1],{r:d.id}):{r:'',done:false,lock:false};if(!d.id)delete days[i].dbl}
    closeSheet();save(function(){return savePlanDays(w,days)});
  },
  setoff:function(d){
    var w=wid(),days=fillDays(daysOf(w)),i=Number(d.i);
    if(days[i+1]&&days[i+1].lo&&days[i+1].from===i)days[i+1]={r:'',done:false,lock:false};
    days[i]={r:'',off:true,done:false,lock:true};
    closeSheet();save(function(){return savePlanDays(w,days)});
  },
  togdbl:function(d){
    var w=wid(),days=fillDays(daysOf(w)),i=Number(d.i),day=days[i];if(!day||!day.r||day.lo)return;
    if(!day.dbl){
      if(i<6&&days[i+1]&&days[i+1].done){toast(DAYS[i+1]+' er allerede markeret som lavet');return}
      day.dbl=true;day.lock=true;if(i<6)days[i+1]={r:day.r,lo:true,from:i,done:false,lock:false};
    }else{
      delete day.dbl;if(i<6&&days[i+1]&&days[i+1].lo&&days[i+1].from===i)days[i+1]={r:'',done:false,lock:false};
    }
    closeSheet();save(function(){return savePlanDays(w,days)});
  },
  setfrz:function(d){
    var w=wid(),days=fillDays(daysOf(w));
    days[Number(d.i)]={r:'',f:d.k,done:false,lock:true};
    closeSheet();save(function(){return savePlanDays(w,days)});
  },
  done:function(d){
    var w=wid(),days=daysOf(w),i=Number(d.i),day=days[i];if(!day||!(day.r||day.f))return;
    var sc=(S.settings.persons||2)/2,patch={},r=day.r&&S.recipes[day.r],mult=day.dbl?2:1;
    save(function(){
      var ps=[];
      if(day.lo){
        days[i]=Object.assign({},day,{done:!day.done});
        return savePlanDays(w,days).then(function(){toast(days[i].done?'Rester spist':'Fortrudt')});
      }
      if(!day.done){
        var used=[];
        if(day.f){var fp=pan(day.f);if(fp){var cq=curQty(fp);used.push({k:day.f,q:Math.min(1,cq)});patch[day.f]=qpatch(cq-1)}}
        else{
          if(!r)return;
          (r.ing||[]).forEach(function(g){var k=slug(g.n),p=pan(k);if(p&&p.unit===g.u){var cq=curQty(p),amt=Math.min(cq,g.q*sc*mult);used.push({k:k,q:r1(amt)});patch[k]=qpatch(cq-amt)}});
          var m=Object.assign({count:0,last:'',wd:[0,0,0,0,0,0,0]},r.made||{});m.wd=(m.wd||[0,0,0,0,0,0,0]).slice();m.wd[i]=(m.wd[i]||0)+1;m.count=(m.count||0)+1;m.last=addDays(S.mon,i);
          ps.push(udoc('recipes/'+day.r).set(Object.assign({},r,{made:m})));
        }
        days[i]=Object.assign({},day,{done:true,used:used});
      }else{
        (day.used||[]).forEach(function(u){var uk=Array.isArray(u)?u[0]:u.k,uq=Array.isArray(u)?u[1]:u.q,p=pan(uk);if(p)patch[uk]=qpatch(curQty(p)+(Number(uq)||0))});
        days[i]=Object.assign({},day,{done:false,used:[]});
      }
      if(Object.keys(patch).length)ps.push(up(udoc('store/pantry'),{items:patch}));
      return Promise.all(ps).then(function(){return savePlanDays(w,days)}).then(function(){toast(days[i].done?'Lavet. Lageret er opdateret':'Fortrudt. Lageret er rettet');});
    });
  },
  addx:function(){
    var v=($('#xin')||{}).value;v=(v||'').trim();if(!v)return;var w=wid(),L=S.lists[w]||{};
    save(function(){return up(udoc('lists/'+w),{extra:(L.extra||[]).concat([{id:uid(),name:v}])})});
  },
  delx:function(d,el,e){e.preventDefault();var w=wid(),L=S.lists[w]||{};save(function(){return up(udoc('lists/'+w),{extra:(L.extra||[]).filter(function(x){return x.id!==d.id})})})},
  tostock:function(){
    var w=wid(),items=computeList(w),chk=(S.lists[w]||{}).checked||{},patch={},cl={},n=0;
    items.forEach(function(it){var key=it.k+'_'+it.unit;if(!chk[key])return;var p=pan(it.k);n++;cl[key]=false;
      if(p&&p.unit===it.unit)patch[it.k]=qpatch(curQty(p)+it.qty);
      else if(!p)patch[it.k]=Object.assign({name:it.name,unit:it.unit,min:0,pack:0,price:0,perish:false,cat:'Andet',expires:'',rule:'under'},qpatch(it.qty))});
    if(!n){toast('Afkryds de varer, du har købt');return}
    save(function(){return up(udoc('store/pantry'),{items:patch}).then(function(){return up(udoc('lists/'+w),{checked:cl})}).then(function(){toast(n+' varer lagt på lageret')})});
  },
  newstock:function(){openStock('')},
  editstock:function(d){openStock(d.k)},
  brand:function(d){openBrand(d.k,d.n)},
  brands:function(){openBrands()},
  brpick:function(d){
    var inp=$('#br-in');if(!inp)return;
    var cur=parseBrands(inp.value),n=bnorm(d.b),has=cur.some(function(x){return bnorm(x)===n});
    cur=has?cur.filter(function(x){return bnorm(x)!==n}):cur.concat([d.b]);inp.value=cur.join(', ');
    [].forEach.call(document.querySelectorAll('[data-act="brpick"]'),function(b){b.classList.toggle('on',cur.some(function(x){return bnorm(x)===bnorm(b.dataset.b)}))});
  },
  brsave:function(d){var list=parseBrands($('#br-in').value);save(function(){return setBrands(d.k,list,d.n).then(function(){closeSheet();toast(list.length?'Mærke gemt':'Mærke fjernet')})})},
  brdel:function(d){save(function(){return setBrands(d.k,[]).then(function(){closeSheet();toast('Mærke fjernet')})})},
  savestock:function(d){saveStock(d.k)},
  kind:function(d){
    var rest=d.k==='rest';$('#f-vare').hidden=rest;$('#f-rest').hidden=!rest;
    Array.prototype.forEach.call(document.querySelectorAll('[data-act="kind"]'),function(b){var on=b.dataset.k===d.k;b.className=on?'on':'';b.setAttribute('aria-pressed',String(on))});
  },
  delstock:function(d){var items=Object.assign({},S.praw);delete items[d.k];save(function(){return udoc('store/pantry').set({items:items}).then(function(){closeSheet();toast('Varen er slettet')})})},
  savefrz:function(d){
    var patch={};patch[d.k]=Object.assign(qpatch(num($('#sf-qty').value)),{frozen:$('#sf-frz').value||''});
    save(function(){return up(udoc('store/pantry'),{items:patch}).then(function(){closeSheet();toast('Gemt')})});
  },
  recs:openRecipes,
  newrec:function(){openRecipe('')},
  scanbook:openScan,
  sccam:function(){if(!scBook())return;var f=$('#sc-cam');if(f)f.click()},
  scpick:function(){if(!scBook())return;var f=$('#sc-files');if(f)f.click()},
  scretry:function(d){var Q=S.sq,it=Q&&Q.q.filter(function(x){return x.id===d.id})[0];if(!it)return;Q.stopped=false;scSet(it,'queue','');scSum();scPump()},
  scanreview:openRecipes,
  editdraft:function(d){openRecipe('',d.id)},
  deldraft:function(d){save(function(){return udoc('scans/'+d.id).delete().then(function(){delete S.scans[d.id];openRecipes();toast('Udkastet er slettet')})})},
  editrec:function(d){openRecipe(d.id)},
  saverec:function(d){saveRecipe(d.id,d.did)},
  delrec:function(d){save(function(){return udoc('recipes/'+d.id).delete().then(function(){openRecipes();toast('Retten er slettet')})})},
  photo:function(){var f=$('#rf-photo');if(f)f.click()},
  noweb:function(d){var r=S.recipes[d.id];if(!r)return;save(function(){return up(udoc('recipes/'+d.id),{noweb:true}).then(function(){S.recipes[d.id]=Object.assign({},r,{noweb:true});openRecipe(d.id);draw()})})},
  findimg:function(d){var r=S.recipes[d.id];if(!r)return;save(function(){return up(udoc('recipes/'+d.id),{noweb:false}).then(function(){S.recipes[d.id]=Object.assign({},S.recipes[d.id],{noweb:false});openRecipe(d.id);draw()})})},
  nextimg:function(d){var r=S.recipes[d.id];if(!r||!r.photo)return;var sk=(Array.isArray(r.photoSkip)?r.photoSkip:[]).concat(r.photo.u).slice(-20);
    save(function(){return up(udoc('recipes/'+d.id),{photoReq:true,photoSkip:sk,noweb:false}).then(function(){S.recipes[d.id]=Object.assign({},S.recipes[d.id],{photoReq:true,photoSkip:sk});toast('Et andet foto hentes inden for en time');openRecipe(d.id)})})},
  copyraw:function(d,el){var pre=el&&el.parentNode&&el.parentNode.querySelector('pre'),tx=pre?pre.textContent:'';try{navigator.clipboard.writeText(tx).then(function(){toast('Teksten er kopieret')},function(){toast('Markér teksten og kopiér den')})}catch(e){toast('Markér teksten og kopiér den')}},
  rmphoto:function(d){
    var r=S.recipes[d.id];if(!r||!r.img)return;var old=r.img,o=Object.assign({},r);delete o.img;
    save(function(){return udoc('recipes/'+d.id).set(o).then(function(){S.recipes[d.id]=o;if(old.id&&S.assets&&S.assets.delete)S.assets.delete(old.id).catch(function(){});openRecipe(d.id);draw();toast('Fotoet er fjernet')})});
  },
  ingadd:function(){$('#rf-ings').insertAdjacentHTML('beforeend',ingRow())},
  ingdel:function(d,el){var row=el.closest('.ingw');if(row)row.remove()},
  readrec:readRecipe,
  savesettings:function(){
    var f=readForm('st');
    var st=normSettings(Object.assign({drive:S.settings.drive||40,friWeekend:$('#st-f').checked,candy:$('#st-c').checked,example:!!S.settings.example},f));
    save(function(){return udoc('store/settings').set(st).then(function(){closeSheet();toast('Indstillinger gemt')})});
  },
  onboard:function(){openOnboard()},
  pushon:function(){var W=window.UGEKURV_WEB;if(!W)return;W.push.enable().then(function(){toast('Notifikationer er slået til');webRefresh()}).catch(function(e){toast(e&&e.message?e.message:'Kunne ikke slå notifikationer til');webRefresh()})},
  pushoff:function(){var W=window.UGEKURV_WEB;if(!W)return;W.push.disable().then(function(){toast('Notifikationer er slået fra');webRefresh()}).catch(function(){toast('Kunne ikke slå dem fra')})},
  pushtog:function(d,el){var on=el&&el.getAttribute('aria-checked')==='true';if(el){el.setAttribute('aria-checked',String(!on));el.disabled=true}if(on)ACT.pushoff();else ACT.pushon()},
  logout:function(){var W=window.UGEKURV_WEB;if(W)W.signOut()},
  obnext:function(){
    var f=readForm('ob'),m=document.querySelector('input[name="ob-m"]:checked'),mode=m?m.value:'empty';
    S.ob=Object.assign(f,{mode:mode});
    if(mode==='starter'&&Object.keys(S.starter).length)openFavs('onboard');else ACT.obfinish();
  },
  obback:function(){openOnboard()},
  obfinish:function(){
    var o=Object.assign({},OB0,{stores:STORES.slice(),mode:'empty'},S.ob||{}),fav=(S.fv&&S.fv.mode==='onboard')?S.fv.sel:{};
    save(function(){
      var t=todayStr(),ps=[];
      if(o.mode==='starter'){
        var items={};Object.keys(S.ref.items||{}).forEach(function(k){items[k]=Object.assign({},S.ref.items[k],{qty:0,at:t,rule:'never',min:0,use:0,days:2,expires:'',ex:false,price:0})});
        if(Object.keys(items).length)ps.push(udoc('store/pantry').set({items:items}));
        Object.keys(S.starter).forEach(function(id){ps.push(udoc('recipes/'+id).set(Object.assign(freshRecipe(S.starter[id]),{fav:!!fav[id]})))});
      }
      var st=normSettings({adults:o.adults,kids:o.kids,budget:o.budget,budgetPer:o.budgetPer,veg:o.veg,quick:o.quick,allergens:o.allergens,oko:!!o.oko,free:!!o.free,okoVeg:!!o.okoVeg,friWeekend:true,candy:true,drive:40,stores:o.stores,example:false});
      return Promise.all(ps).then(function(){return udoc('store/settings').set(st)}).then(function(){S.ob=null;S.fv=null;closeSheet();S.wzChecked=false;maybeWizard();if(!$('#sheet').firstChild)toast('Klar. Lav din første madplan.')});
    });
  },
  favs:function(){openFavs('edit')},
  fvtog:function(d,el){
    if(!S.fv)return;var on=!S.fv.sel[d.id];S.fv.sel[d.id]=on;
    el.setAttribute('aria-pressed',String(on));var hb=el.querySelector('.hb');if(hb)hb.textContent=on?'♥':'♡';favNote();
  },
  fvsave:function(){
    var sel=S.fv.sel,orig=S.fv.orig,ps=[];
    Object.keys(S.recipes).forEach(function(id){var now=!!sel[id],was=!!orig[id];if(now!==was)ps.push(up(udoc('recipes/'+id),{fav:now}))});
    save(function(){return Promise.all(ps).then(function(){S.fv=null;openRecipes();toast(ps.length?'Favoritter gemt':'Ingen ændringer')})});
  },
  cook:function(d){openCook(d.id)},
  rateopen:function(d,el,e){var w=wid(),day=((S.plans[w]||{}).days||[])[Number(d.i)];if(day&&day.r)openRate(day.r,Number(d.i))},
  rate:function(d){
    if(!S.rt)return;S.rt.s=Number(d.s);
    if(!S.rt.touched)S.rt.again=S.rt.s>=4?'yes':S.rt.s<=2?'no':'maybe';
    rateDraw();
  },
  again:function(d){if(!S.rt)return;S.rt.again=d.v;S.rt.touched=true;rateDraw()},
  ratesave:function(){
    var rt=S.rt;if(!rt)return;if(!(rt.s>0)){toast('Vælg antal stjerner');return}
    var r=S.recipes[rt.id];if(!r)return;
    var hist=(r.hist||[]).concat([{d:addDays(monOfWeek(rt.w),rt.i),s:rt.s}]).slice(-5),l3=hist.slice(-3),avg=Math.round(l3.reduce(function(a,x){return a+x.s},0)/l3.length*10)/10,ag=rt.again||'maybe';
    save(function(){
      return up(udoc('recipes/'+rt.id),{hist:hist,rating:avg,again:ag}).then(function(){
        var days=fillDays(daysOf(rt.w));if(days[rt.i]&&days[rt.i].r===rt.id){days[rt.i]=Object.assign({},days[rt.i],{rate:rt.s});return savePlanDays(rt.w,days)}
      }).then(function(){S.rt=null;closeSheet();toast(ag==='yes'?'Gemt. Retten kommer igen senere':ag==='no'?'Gemt. Retten vælges ikke igen':'Tak for din vurdering')});
    });
  },
  getstarter:function(){
    var ids=Object.keys(S.starter).filter(function(id){return !S.recipes[id]});if(!ids.length)return;
    save(function(){
      var recs=ids.map(function(id){return freshRecipe(S.starter[id])}),patch=missingItems(recs),ps=[];
      if(Object.keys(patch).length)ps.push(up(udoc('store/pantry'),{items:patch}));
      ids.forEach(function(id,i){ps.push(udoc('recipes/'+id).set(recs[i]))});
      return Promise.all(ps).then(function(){openRecipes();toast(ids.length+' startretter hentet')});
    });
  },
  clearex:function(){
    save(function(){
      var keep={},del=[];
      Object.keys(S.recipes).forEach(function(id){var r=S.recipes[id];if(r.example)del.push(id);else(r.ing||[]).forEach(function(g){keep[slug(g.n)]=1})});
      var items=Object.assign({},S.praw);Object.keys(items).forEach(function(k){if(!items[k].ex)return;if(keep[k])items[k]=Object.assign({},items[k],{qty:0,at:todayStr(),ex:false});else delete items[k]});
      return Promise.all(del.map(function(id){return udoc('recipes/'+id).delete()})).then(function(){return udoc('store/pantry').set({items:items})}).then(function(){return up(udoc('store/settings'),{example:false})}).then(function(){toast('Eksempeldata er ryddet')});
    });
  }
};
document.addEventListener('click',function(e){var sm=e.target.closest&&e.target.closest('#goneBox>summary');if(sm)S.goneOpen=!sm.parentNode.open});
var _sx=null;
document.addEventListener('touchstart',function(e){var d=e.target.closest&&e.target.closest('.dr');_sx=d&&e.touches[0]?e.touches[0].clientX:null},{passive:true});
document.addEventListener('touchend',function(e){if(_sx===null)return;var t=e.changedTouches[0];var dx=t?t.clientX-_sx:0;_sx=null;if(dx<-60)closeMenu()},{passive:true});
document.addEventListener('click',function(e){var el=e.target.closest('[data-act]');if(!el)return;var f=ACT[el.dataset.act];if(f)f(el.dataset,el,e)});
document.addEventListener('change',function(e){
  var t=e.target;if(!t.matches)return;
  if(t.matches('[data-chk]')){
    var w=wid(),key=t.dataset.chk,v=t.checked,L=S.lists[w]||{},c=Object.assign({},L.checked||{});c[key]=v;
    S.lists[w]=Object.assign({},L,{checked:c});draw();
    var p={};p[key]=v;save(function(){return up(udoc('lists/'+w),{checked:p})});
  }else if(t.id==='rf-photo'){handlePhoto(t.files&&t.files[0],t.dataset.id);t.value=''}
  else if(t.id==='rf-file'){rfPreview(t.files);if(t.files&&t.files.length)readRecipe()}
  else if(t.id==='sc-cam'||t.id==='sc-files'){scanFiles(t.files);t.value=''}
  else if(t.matches('.r-mode')){syncRule(t.closest('.rule'));refreshSummary(t.closest('.ingw'))}
  else if(t.name==='ob-m'){var g=$('#ob-go');if(g)g.textContent=t.value==='starter'&&Object.keys(S.starter).length?'Næste: vælg favoritter':'Kom i gang'}
  else if(t.matches('.i-u')){refreshSummary(t.closest('.ingw'))}
  else if(t.matches('.i-n')){
    var row=t.closest('.ingw'),p2=pan(slug(t.value));
    if(row&&p2){row.querySelector('.i-u').value=p2.unit;row.querySelector('.rl').innerHTML='<summary>'+esc(ruleSummary(ruleOf(p2),p2.unit))+'</summary>'+ruleHtml(p2)}
  }
});
document.addEventListener('input',function(e){
  var t=e.target;
  if(t.id==='sq'){S.q=t.value;var l=$('#stockList');if(l)l.innerHTML=stockListHtml()}
  else if(t.matches&&t.matches('.r-min,.r-days,.r-use,.r-pack')){refreshSummary(t.closest('.ingw'))}
  else if(/^(st|ob)-(a|k)$/.test(t.id||'')){hhUpdate(t.id.slice(0,2))}
});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'&&menuIsOpen()){closeMenu();var mb=$('#menubtn');if(mb)mb.focus();return}
  if(e.key==='Escape'&&$('#sheet').firstChild){if(S.wz)ACT.wzclose();else closeSheet()}
  if(e.key==='Enter'&&e.target.id==='xin'){e.preventDefault();ACT.addx()}
});
/* a photo that cannot load falls back to the drawn plate */
document.addEventListener('error',function(e){
  var t=e.target;if(!t||t.tagName!=='IMG'||t.dataset.fb===undefined)return;
  var id=t.dataset.fb,r=Object.assign({},S.recipes[id]||{});delete r.img;delete r.photo;var p=t.parentNode;var hb=p&&p.closest&&p.closest('#hero-box'),cr=hb&&hb.querySelector('.credit');if(cr)cr.remove();if(p)p.innerHTML=artSVG(Object.assign({id:id},r),p.classList&&p.classList.contains('wide'));
},true);

/* ---------- data ---------- */
function ready(k){S.ready[k]=1;render();maybeOnboard();maybeWizard()}
function fromCol(snap,key){var o={};snap.docs.forEach(function(d){o[d.id]=d.data()});S[key]=o;ready(key)}
function sub(q,fn){q.onSnapshot(fn,function(e){console.error(e);if(e&&e.code==='revoked'){S.ro=true}render()})}
function boot(){
  draw();
  var c=window.claude;
  if(!c||!c.use){S.nodb=true;draw();return}
  c.use('db').then(function(d){
    db=d;if(!db){S.nodb=true;draw();return}
    setTimeout(function(){if(!S.ready.pantry){S.slow=true;render()}},10000);
    return c.use('user').then(function(us){return us&&us.id?us.id():null}).catch(function(){return null}).then(function(id){
      if(!id){S.nodb=true;draw();return}
      S.uid=id;UB='data/users/'+id+'/u/';
      sub(udoc('store/pantry'),function(s){S.hasPantry=!!s.exists;var d=s.exists?s.data():{};S.praw=d.items||{};applyRef();ready('pantry')});
      sub(udoc('store/prices'),function(s){var d=s.exists?s.data():{};S.sp=d.items||{};S.spAt=d.at||'';render()});
      sub(udoc('store/brands'),function(s){var d=s.exists?s.data():{};S.brands=d.b||{};S.bnames=d.n||{};render()});
      sub(udoc('store/settings'),function(s){S.hasSettings=!!s.exists;S.settings=normSettings(s.exists?s.data():{});ready('settings')});
      sub(ucol('recipes'),function(s){fromCol(s,'recipes')});
      sub(ucol('scans'),function(s){var o={};s.docs.forEach(function(d){o[d.id]=d.data()});S.scans=o;render()});
      sub(ucol('plans'),function(s){fromCol(s,'plans')});
      sub(ucol('prefs'),function(s){fromCol(s,'prefs')});
      sub(ucol('lists'),function(s){fromCol(s,'lists')});
      sub(db.collection('offers'),function(s){fromCol(s,'offers')});
      sub(db.collection('ref'),function(s){var o={};s.docs.forEach(function(x){o[x.id]=x.data()});S.ref={stores:o.stores||{},items:(o.items&&o.items.items)||{}};applyRef();ready('ref')});
      sub(db.collection('starter'),function(s){fromCol(s,'starter')});
    });
  }).catch(function(){S.nodb=true;draw()});
  c.use('user').then(function(u){if(u&&u.can&&u.can('data.write')===false){S.ro=true;render()}}).catch(function(){});
  c.use('assets').then(function(a){S.assets=a||null;render()}).catch(function(){});
  c.use('sample').then(function(sm){
    S.sample=sm;if(sm&&sm.limits)return sm.limits().then(function(l){S.imgOK=!!(l&&l.images)}).catch(function(){})
  }).catch(function(){});
}
if(window.UGEKURV_WEB)window.UGEKURV_WEB.known=function(){var o=Object.keys((S.pantry&&S.pantry.items)||{}).map(function(k){return S.pantry.items[k].name});Object.keys(S.recipes||{}).forEach(function(id){(S.recipes[id].ing||[]).forEach(function(g){o.push(g.n)})});return o.filter(Boolean)};
if(window.__TEST__)window.__TEST__.api={MIN_EXTRA:MIN_EXTRA,spOf:spOf,realP:realP,handlePhoto:handlePhoto,heroHtml:heroHtml,pnSwitch:pnSwitch,webRefresh:webRefresh,qbest:qbest,qualOk:qualOk,pan:pan,setOFW:function(x){OFW=x},offerModel:offerModel,planOfferValue:planOfferValue,fixedN:fixedN,offerPlanHtml:offerPlanHtml,offerStat:offerStat,S:S,generate:generate,computeList:computeList,wasteOf:wasteOf,coverage:coverage,routeLine:routeLine,curQty:curQty,isLow:isLow,weekId:weekId,draw:draw,ruleSummary:ruleSummary,recCov:recCov,buyCalc:buyCalc,ACT:ACT,openStock:openStock,openRecipe:openRecipe,openRecipes:openRecipes,openScan:openScan,scanFiles:scanFiles,guessProt:guessProt,draftList:draftList,openPick:openPick,ruleHtml:ruleHtml,ingRow:ingRow,bestOffer:bestOffer,lineCost:lineCost,qual:qual,ppu:ppu,setDb:function(x){db=x},activeStores:activeStores,bestPair:bestPair,bestSet:bestSet,shopOptions:shopOptions,recoHtml:recoHtml,applyRef:applyRef,storeCosts:storeCosts,kcalOf:kcalOf,getPrefs:getPrefs,effModes:effModes,artKey:artKey,artSVG:artSVG,openWizard:openWizard,planIds:planIds,targetMon:targetMon,prefsSummary:prefsSummary,wzBody:wzBody,maybeWizard:maybeWizard,LOW_MAX:LOW_MAX,tasteModel:tasteModel,tasteLabels:tasteLabels,carryIn:carryIn,qbest:qbest,qprices:qprices,normSettings:normSettings,openRate:openRate,openCook:openCook,openFavs:openFavs,syncCarry:syncCarry,monOfWeek:monOfWeek,ctxFor:ctxFor,fit:fit,tagsOf:tagsOf,featOf:featOf,openOnboard:openOnboard,getPrefs:getPrefs,algOf:algOf,stockUse:stockUse,recAlg:recAlg,recBad:recBad,isVeg:isVeg,recAllowed:recAllowed,planEst:planEst,weekBudget:weekBudget,hhLabel:hhLabel,daysIds:daysIds,STORES:STORES,brandsOf:brandsOf,brandGuess:brandGuess,brandSuggest:brandSuggest,parseBrands:parseBrands,brandOk:brandOk,openBrand:openBrand,openBrands:openBrands,ALG_KEYS:ALG_KEYS,genWhy:function(){return GEN_WHY},makePlan:makePlan,openSettings:openSettings,viewShop:viewShop,pidx:pidx,budgetHtml:budgetHtml};
if(!window.__TEST__||window.__TEST__.boot)boot();
})();
