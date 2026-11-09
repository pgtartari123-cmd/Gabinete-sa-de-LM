/* Documentos do cidadão — armazenamento privado na nuvem com cópia local para uso offline */
(function(){
'use strict';
const N='GabineteDigitalDocumentos',S='arquivos',CFG='gabineteSupabaseConfig',AT='gabineteAccessToken',SES='gabineteSupabaseSession';
let dbp;
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
function cfg(){try{return JSON.parse(localStorage.getItem(CFG)||'{}')}catch(_){return{}}}
function token(){try{return localStorage.getItem(AT)||JSON.parse(localStorage.getItem(SES)||'null')?.access_token||''}catch(_){return''}}
function base(){const c=cfg();return c.url?String(c.url).replace(/\/+$/,''):''}
function headers(extra={}){const c=cfg(),t=token();if(!c.url||!c.anonKey||!t)throw Error('Entre novamente no sistema para acessar os documentos na nuvem.');return Object.assign({apikey:c.anonKey,Authorization:'Bearer '+t},extra)}
async function api(path,opt={}){const h=headers(Object.assign({'Content-Type':'application/json'},opt.headers||{}));const r=await fetch(base()+'/rest/v1/'+path,Object.assign({},opt,{headers:h,cache:'no-store'}));const txt=await r.text();let j;try{j=txt?JSON.parse(txt):null}catch(_){j=txt}if(!r.ok)throw Error(j?.message||j?.error_description||j?.details||'Falha ao acessar o arquivo na nuvem.');return j}
function db(){if(dbp)return dbp;dbp=new Promise((ok,no)=>{const r=indexedDB.open(N,1);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains(S)){const s=d.createObjectStore(S,{keyPath:'id'});s.createIndex('cidadao_id','cidadao_id')}};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});return dbp}
async function get(cid){const d=await db();return new Promise((ok,no)=>{const q=d.transaction(S,'readonly').objectStore(S).index('cidadao_id').getAll(cid);q.onsuccess=()=>ok(q.result||[]);q.onerror=()=>no(q.error)})}
async function save(x){const d=await db();return new Promise((ok,no)=>{const q=d.transaction(S,'readwrite').objectStore(S).put(x);q.onsuccess=ok;q.onerror=()=>no(q.error)})}
async function remove(id){const d=await db();return new Promise((ok,no)=>{const q=d.transaction(S,'readwrite').objectStore(S).delete(id);q.onsuccess=ok;q.onerror=()=>no(q.error)})}
function size(n){return n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(1)+' MB'}
function mime(file,name){if(file.type&&file.type!=='application/octet-stream')return file.type;const ext=String(name||'').split('.').pop().toLowerCase();return({pdf:'application/pdf',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xls:'application/vnd.ms-excel',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})[ext]||'application/octet-stream'}
function safeName(name){return String(name||'arquivo').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]+/g,'_').slice(0,120)||'arquivo'}
function pathUrl(path){return path.split('/').map(encodeURIComponent).join('/')}
async function cloudList(cid){return await api('cidadao_documentos?cidadao_id=eq.'+encodeURIComponent(cid)+'&excluido_em=is.null&select=id,cidadao_id,nome,tipo,tamanho,mime_type,storage_path,criado_em&order=criado_em.desc')}
async function uploadCloud(cid,file,tipo,id=uid(),nome=file.name||'arquivo'){
 const c=cfg(),t=token(),m=mime(file,nome),path=cid+'/'+id+'/'+safeName(nome),now=new Date().toISOString();
 const allowed=['application/pdf','image/jpeg','image/png','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
 if(!allowed.includes(m))throw Error('Formato não permitido. Use PDF, JPG, PNG, WEBP, DOC, DOCX, XLS ou XLSX.');
 await api('cidadao_documentos',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({id,cidadao_id:cid,nome,tipo,tamanho:file.size,mime_type:m,storage_path:path,criado_em:now,atualizado_em:now})});
 try{
  const r=await fetch(base()+'/storage/v1/object/cidadao-documentos/'+pathUrl(path),{method:'POST',headers:headers({'Content-Type':m,'x-upsert':'false','cache-control':'3600'}),body:file});
  if(!r.ok){const t=await r.text();throw Error(t||'O armazenamento recusou o arquivo.')}
 }catch(e){
  try{await api('cidadao_documentos?id=eq.'+encodeURIComponent(id),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({excluido_em:new Date().toISOString(),atualizado_em:new Date().toISOString()})})}catch(_){}
  throw e;
 }
 await save({id,cidadao_id:cid,nome,tipo,tamanho:file.size,mime_type:m,criadoEm:now,storage_path:path,cloud:true,blob:file});
 return{id,cidadao_id:cid,nome,tipo,tamanho:file.size,mime_type:m,criado_em:now,storage_path:path,cloud:true,blob:file};
}
async function downloadCloud(doc){const r=await fetch(base()+'/storage/v1/object/authenticated/cidadao-documentos/'+pathUrl(doc.storage_path),{headers:headers(),cache:'no-store'});if(!r.ok)throw Error('Não foi possível baixar o documento da nuvem.');return await r.blob()}
async function softDeleteCloud(doc){const now=new Date().toISOString();await api('cidadao_documentos?id=eq.'+encodeURIComponent(doc.id),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({excluido_em:now,atualizado_em:now})});await remove(doc.id).catch(()=>{})}
async function list(cid,box){
 let local=await get(cid),cloud=[],cloudError='';
 try{cloud=await cloudList(cid)}catch(e){cloudError=e.message||String(e)}
 const localMap=new Map(local.map(x=>[String(x.id),x]));
 const docs=cloud.map(x=>Object.assign({},x,localMap.get(String(x.id))||{},{cloud:true}));
 const cloudIds=new Set(cloud.map(x=>String(x.id)));
 local.filter(x=>!cloudIds.has(String(x.id))).forEach(x=>docs.push(Object.assign({},x,{cloud:!!x.storage_path})));
 docs.sort((a,b)=>new Date(b.criado_em||b.criadoEm||0)-new Date(a.criado_em||a.criadoEm||0));
 box.innerHTML=(cloudError?'<p class="docs-aviso">⚠️ Nuvem indisponível neste momento. Os arquivos locais continuam acessíveis. '+esc(cloudError)+'</p>':'')+(docs.length?docs.map(x=>'<div class="doc-item"><div><b>📎 '+esc(x.nome)+'</b><small>'+esc(x.tipo)+' • '+size(Number(x.tamanho||0))+' • '+new Date(x.criado_em||x.criadoEm||Date.now()).toLocaleDateString('pt-BR')+' • '+(x.cloud?'☁️ Sincronizado':'📱 Somente neste aparelho')+'</small></div><div><button data-o="'+esc(x.id)+'">Abrir</button> '+(x.cloud?'<button data-d="'+esc(x.id)+'" class="btn-cancelar">Arquivar</button>':'<button data-s="'+esc(x.id)+'">☁️ Enviar à nuvem</button> <button data-d="'+esc(x.id)+'" class="btn-cancelar">Excluir local</button>')+'</div></div>').join(''):'<div class="docs-vazio">📂 Nenhum documento anexado.</div>');
 box.querySelectorAll('[data-o]').forEach(b=>b.onclick=async()=>{const doc=docs.find(z=>String(z.id)===String(b.dataset.o));if(!doc)return;const win=window.open('about:blank','_blank');try{const blob=doc.blob||await downloadCloud(doc);const url=URL.createObjectURL(blob);if(win)win.location=url;else{const a=document.createElement('a');a.href=url;a.target='_blank';a.click()}setTimeout(()=>URL.revokeObjectURL(url),60000)}catch(e){win?.close();alert(e.message||String(e))}});
 box.querySelectorAll('[data-s]').forEach(b=>b.onclick=async()=>{const doc=docs.find(z=>String(z.id)===String(b.dataset.s));if(!doc?.blob)return;try{b.disabled=true;await uploadCloud(cid,doc.blob,doc.tipo,doc.id,doc.nome);await list(cid,box)}catch(e){alert('Não foi possível sincronizar este documento: '+(e.message||e))}finally{b.disabled=false}});
 box.querySelectorAll('[data-d]').forEach(b=>b.onclick=async()=>{const doc=docs.find(z=>String(z.id)===String(b.dataset.d));if(!doc)return;if(!confirm(doc.cloud?'Arquivar este documento? Ele deixará de aparecer e não ficará acessível pela pasta.':'Excluir este arquivo somente deste aparelho?'))return;try{b.disabled=true;if(doc.cloud)await softDeleteCloud(doc);else await remove(doc.id);await list(cid,box)}catch(e){alert('Não foi possível concluir: '+(e.message||e))}finally{b.disabled=false}});
}
async function abrir(cid){
 let m=document.getElementById('modalDocumentos')||document.body.appendChild(Object.assign(document.createElement('div'),{id:'modalDocumentos',className:'modal-ficha'}));
 m.innerHTML='<div class="ficha docs-modal"><div class="ficha-topo"><div><span class="eyebrow">ARQUIVO DO CIDADÃO</span><h2>📎 Documentos e anexos</h2><p>Os novos arquivos serão sincronizados na nuvem privada do gabinete.</p></div><button id="fechaDoc">✕</button></div><div class="doc-form"><select id="docTipo"><option>RG</option><option>CPF</option><option>Cartão SUS</option><option>Comprovante de residência</option><option>Encaminhamento</option><option>Exame / laudo</option><option>Outro</option></select><input id="docFile" type="file" accept="image/jpeg,image/png,image/webp,.pdf,.doc,.docx,.xls,.xlsx"><button id="docEnviar">📎 Anexar</button></div><div id="docsStatus" role="status"></div><div id="docsLista"></div></div>';
 const box=m.querySelector('#docsLista'),status=m.querySelector('#docsStatus');await list(cid,box);
 m.querySelector('#fechaDoc').onclick=()=>m.remove();
 m.querySelector('#docEnviar').onclick=async()=>{const f=m.querySelector('#docFile').files[0];if(!f)return alert('Selecione um arquivo.');if(f.size>15*1024*1024)return alert('Limite de 15 MB por arquivo.');const btn=m.querySelector('#docEnviar');btn.disabled=true;status.textContent='Enviando documento para a nuvem privada…';try{await uploadCloud(cid,f,m.querySelector('#docTipo').value);m.querySelector('#docFile').value='';status.textContent='Documento enviado e sincronizado com sucesso.';await list(cid,box)}catch(e){const local={id:uid(),cidadao_id:cid,nome:f.name,tipo:m.querySelector('#docTipo').value,tamanho:f.size,mime_type:mime(f,f.name),criadoEm:new Date().toISOString(),blob:f,cloud:false};try{await save(local);status.textContent='⚠️ O documento ficou salvo somente neste aparelho. Para sincronizar, tente “Enviar à nuvem” quando a conexão estiver disponível. '+(e.message||String(e));await list(cid,box)}catch(localError){status.textContent='Falha ao salvar o documento: '+(localError.message||localError)}}finally{btn.disabled=false}};
}
window.abrirDocumentosCidadao=abrir;
const observer=new MutationObserver(()=>{const f=document.querySelector('#fichaCidadao .ficha-acoes');if(f&&!f.querySelector('.btn-documentos')){const b=document.createElement('button');b.className='btn-documentos';b.textContent='📎 Documentos';b.onclick=()=>{const name=document.querySelector('#fichaCidadao h2')?.textContent;let p;try{p=(JSON.parse(localStorage.getItem('gabineteDigitalDemo')||'{"people":[]}').people||[]).find(x=>x.nome===name)}catch(_){}if(p)abrir(p.id)};f.prepend(b)}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>observer.observe(document.documentElement,{childList:true,subtree:true}),{once:true});else observer.observe(document.documentElement,{childList:true,subtree:true});
})();