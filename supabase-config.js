/* Configuração pública do cliente Supabase.
   Nunca coloque service_role/secret key neste arquivo. */
(function () {
  try {
    if (!localStorage.getItem('gabineteSupabaseConfig')) {
      localStorage.setItem('gabineteSupabaseConfig', JSON.stringify({
        url: 'https://qizakldwyeqbummhtpsg.supabase.co',
        anonKey: 'sb_publishable_ZEM5lEJsiveCFkU9sClkCA_sn3v2M4X'
      }));
    }
  } catch (_) {}
})();
