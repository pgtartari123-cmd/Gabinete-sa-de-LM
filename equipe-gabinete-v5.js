/* Equipe v5 — compatibilidade: sempre abre o gerenciador cloud atual */
(function(){'use strict';
function admin(){try{const p=JSON.parse(localStorage.getItem('gabinetePerfilAtual')||'null');return ['admin','administrador'].includes(String(p?.perfil||'').toLowerCase())}catch(e){return false}}
function open(){
  if(!admin()){alert('Apenas o administrador pode gerenciar a equipe.');return}
  if(typeof window.abrirEquipeMembrosV6==='function'){window.abrirEquipeMembrosV6();return}
  const s=document.createElement('script');s.src='equipe-gabinete-v6.js?v=12002';
  s.onload=()=>{if(typeof window.abrirEquipeMembrosV6==='function')window.abrirEquipeMembrosV6();else alert('Não foi possível carregar o gerenciador da equipe. Recarregue a página e tente novamente.')};
  s.onerror=()=>alert('Não foi possível carregar o gerenciador da equipe.');
  document.body.appendChild(s);
}
window.abrirEquipeMembrosV4=open;
window.abrirEquipeMembrosV5=open;
})();
