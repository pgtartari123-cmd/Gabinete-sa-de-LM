(function(){
  function adicionarBotoes(){
    document.querySelectorAll('#listaPessoas .card').forEach(card=>{
      if(card.dataset.fichaAcao==='1')return;
      const h=card.querySelector('h3');if(!h)return;
      const nome=h.textContent.trim();
      try{
        const db=JSON.parse(localStorage.getItem('gabineteDigitalDemo')||'{"people":[]}');
        const p=(db.people||[]).find(x=>String(x.nome||'').trim()===nome);if(!p)return;
        const a=card.querySelector('.acoes');if(!a)return;
        const b=document.createElement('button');b.type='button';b.textContent='📋 Ficha completa';b.onclick=()=>window.verFichaCidadao?.(p.id);a.insertBefore(b,a.firstChild);card.dataset.fichaAcao='1';
      }catch(e){}
    });
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(adicionarBotoes,250));
  const antigo=window.render;
  if(typeof antigo==='function')window.render=function(){antigo();setTimeout(adicionarBotoes,0)};
  setInterval(adicionarBotoes,1500);
})();
