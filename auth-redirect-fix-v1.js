/* Gabinete Digital — corrige o retorno do e-mail de confirmação do Supabase */
(function(){
  'use strict';
  const originalFetch = window.fetch;
  window.fetch = async function(input, init){
    try {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      if (url.includes('/auth/v1/signup') && init && typeof init.body === 'string') {
        const body = JSON.parse(init.body);
        body.options = body.options || {};
        body.options.emailRedirectTo = window.location.origin + window.location.pathname;
        init.body = JSON.stringify(body);
      }
    } catch (_) {}
    return originalFetch.apply(this, arguments);
  };
})();
