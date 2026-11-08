(async()=>{const r=await fetch('https://api.prej.app/openapi.json');const j=await r.json();
for(const p of ['/v1/products','/v1/products/batch','/v1/products/optimize']){const o=j.paths[p]&&j.paths[p].get;if(!o)continue;console.log('#### '+p+' '+(o.summary||''));(o.parameters||[]).forEach(x=>{const r=x.$ref?j.components.parameters[x.$ref.split('/').pop()]:x;console.log('  '+r.name+' ('+r.in+'): '+JSON.stringify(r.schema).slice(0,160)+' '+String(r.description||'').slice(0,240).replace(/\n/g,' '))})}
})();
