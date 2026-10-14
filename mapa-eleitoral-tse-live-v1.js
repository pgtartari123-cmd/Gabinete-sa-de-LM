/* Integração simplificada ao portal oficial do TSE.
   O portal oficial é a fonte principal de consulta; a comparação local permanece
   no módulo mapa-eleitoral-resultados-v1.js, usando arquivos oficiais importados.
*/
(function(){
'use strict';
const OFFICIAL='https://resultados.tse.jus.br/oficial/app/index.html';
function inject(){
 const host=document.getElementById('mapaEleitoralGabinete');
 if(!host||document.getElementById('tsePortalOficialPainel'))return;
 const panel=document.createElement('section');
 panel.id='tsePortalOficialPainel';
 panel.className='card';
 panel.style.cssText='padding:14px;margin:0 0 16px';
 panel.innerHTML=
  '<h3>🗳️ Portal oficial de apuração do TSE</h3>'+
  '<p>Para consultar eleições, turnos, municípios, cargos, candidatos e resultados usando as ferramentas oficiais do Tribunal Superior Eleitoral, abra o portal abaixo. Se o portal não carregar dentro desta tela, use o botão para abri-lo diretamente.</p>'+
  '<div style="display:flex;gap:10px;flex-wrap:wrap;margin:12px 0">'+
  '<button type="button" id="tseAbrirPortalOficial">Abrir portal oficial do TSE ↗</button>'+
  '<button type="button" class="btn-secundario" id="tseRecarregarPortal">Recarregar portal</button></div>'+
  '<div id="tsePortalAviso" role="status" style="font-size:13px;margin:8px 0">Carregando o portal oficial. Alguns navegadores podem bloquear a exibição incorporada.</div>'+
  '<div style="width:100%;height:72vh;min-height:480px;border:1px solid #d7dbe5;border-radius:12px;overflow:hidden;background:#fff">'+
  '<iframe id="tsePortalFrame" title="Portal oficial de resultados eleitorais do TSE" src="'+OFFICIAL+'" style="display:block;width:100%;height:100%;border:0;background:white" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="fullscreen"></iframe></div>'+
  '<p style="font-size:12px;color:#666;margin-top:10px">Fonte oficial: resultados.tse.jus.br. O Gabinete Online não altera nem estima os votos apresentados pelo TSE.</p>';
 host.insertBefore(panel,host.firstChild);
 document.getElementById('tseAbrirPortalOficial').addEventListener('click',function(){window.open(OFFICIAL,'_blank','noopener,noreferrer')});
 document.getElementById('tseRecarregarPortal').addEventListener('click',function(){
  const frame=document.getElementById('tsePortalFrame');
  if(frame)frame.src=OFFICIAL+'?atualizar='+Date.now();
 });
 const frame=document.getElementById('tsePortalFrame');
 frame.addEventListener('load',function(){document.getElementById('tsePortalAviso').textContent='O portal foi carregado, se permitido pelo navegador. Caso apareça uma tela vazia, toque em “Abrir portal oficial do TSE”.'});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject,{once:true});else inject();
})();
