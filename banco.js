/* Camada de dados preparada para banco remoto. Mantém funcionamento offline e permite futura troca por Supabase sem reescrever a aplicação. */
window.GabineteDB={
 version:1,
 async init(){return true},
 exportar(){const raw=localStorage.getItem('gabineteDigitalDemo')||'{"people":[],"agenda":[]}';return JSON.parse(raw)},
 importar(data){if(!data||typeof data!=='object')throw new Error('Backup inválido');localStorage.setItem('gabineteDigitalDemo',JSON.stringify(data));location.reload()}
};
window.GabineteDB.init();