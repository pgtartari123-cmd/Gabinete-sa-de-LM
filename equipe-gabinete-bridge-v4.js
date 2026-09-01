/* Bridge v4 — conecta a matriz de permissões com a gestão de membros */
(function(){'use strict';
function bridge(){const old=window.abrirEquipeGabinete;if(typeof old!=='function'||window.__eq4bridge)return;window.__eq4bridge=true;window.abrirEquipeGabinete=function(){old();setTimeout(()=>{const box=document.querySelector('#eqv3 .eqv3box');if(!box||box.querySelector('#abrirMembrosV4'))return;const b=document.createElement('button');b.id='abrirMembrosV4';b.textContent='👥 Gerenciar membros';b.className='eqv3save';b.style.marginLeft='8px';b.onclick=()=>window.abrirEquipeMembrosV4&&window.abrirEquipeMembrosV4();const bar=box.querySelector('.eqv3toolbar');if(bar)bar.appendChild(b)},60)}
bridge();window.addEventListener('load',bridge);})();
