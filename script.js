(function(){
  const cfg = window.TANKG_CONFIG || {};
  document.querySelectorAll('.buy-basic').forEach(a => a.href = cfg.checkoutBasico || '#');
  document.querySelectorAll('.buy-pro').forEach(a => a.href = cfg.checkoutProfissional || '#');
  document.getElementById('year').textContent = new Date().getFullYear();
  // =========================
  // META PIXEL + CAPI READY
  // =========================
  const META_PIXEL_ID = String(cfg.metaPixelId || '').trim();
  const PIXEL_ENABLED = /^\d+$/.test(META_PIXEL_ID);

  function uuid(){
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  }

  function getPersistentExternalId(){
    if (cfg.externalIdManual) return String(cfg.externalIdManual);
    const key = 'tc_external_id';
    let id = localStorage.getItem(key);
    if (!id) { id = uuid(); localStorage.setItem(key, id); }
    return id;
  }

  function getCookie(name){
    const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\/+^])/g,'\\$1') + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }

  function getTrackingContext(){
    const p = new URLSearchParams(location.search);
    const keys = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
    const utms = {};
    keys.forEach(k => { if (p.get(k)) { localStorage.setItem('tc_'+k, p.get(k)); utms[k] = p.get(k); } else if(localStorage.getItem('tc_'+k)) utms[k] = localStorage.getItem('tc_'+k); });
    const fbclid = p.get('fbclid') || '';
    let fbc = getCookie('_fbc');
    if (!fbc && fbclid) fbc = `fb.1.${Date.now()}.${fbclid}`;
    return { ...utms, fbp: getCookie('_fbp'), fbc, external_id: getPersistentExternalId() };
  }

  // Guarda contexto para uma futura implementação server-side da Conversions API.
  // IMPORTANTE: token de acesso da CAPI nunca deve ser colocado neste HTML/JS público.
  window.truckerCapMeta = {
    pixelId: META_PIXEL_ID,
    getContext: getTrackingContext,
    newEventId: (eventName) => `${eventName}_${Date.now()}_${uuid()}`,
    capiPayload: (eventName, eventId, customData={}) => ({
      event_name: eventName,
      event_time: Math.floor(Date.now()/1000),
      event_id: eventId,
      event_source_url: location.href,
      action_source: 'website',
      user_data: getTrackingContext(),
      custom_data: customData
    })
  };

  if (PIXEL_ENABLED) {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');

    fbq('init', META_PIXEL_ID, { external_id: getPersistentExternalId() });

    const pageViewId = window.truckerCapMeta.newEventId('PageView');
    fbq('track', 'PageView', getTrackingContext(), {eventID: pageViewId});

    const viewContentId = window.truckerCapMeta.newEventId('ViewContent');
    fbq('track', 'ViewContent', {
      content_name: 'Tank-G Tone Collection',
      content_category: 'Presets e Capturas Tank-G',
      content_type: 'product_group',
      currency: 'BRL',
      ...getTrackingContext()
    }, {eventID: viewContentId});
  } else {
    console.info('[Meta Pixel] Insira seu ID numérico em config.js > metaPixelId para ativar PageView/ViewContent/Checkout/Purchase.');
  }

  function appendTrackingToCheckout(rawUrl, plan){
    try {
      const u = new URL(rawUrl);
      const ctx = getTrackingContext();
      Object.entries(ctx).forEach(([k,v]) => { if(v && k.startsWith('utm_')) u.searchParams.set(k,v); });
      u.searchParams.set('tc_plan', plan);
      u.searchParams.set('tc_external_id', ctx.external_id);
      return u.toString();
    } catch(e){ return rawUrl; }
  }

  document.querySelectorAll('.buy-basic, .buy-pro').forEach(a => {
    a.addEventListener('click', function(){
      const isPro = this.classList.contains('buy-pro');
      const value = isPro ? 67 : 27;
      const plan = isPro ? 'Guitarrista Profissional' : 'Basico';
      const eventId = window.truckerCapMeta.newEventId('InitiateCheckout');
      if (PIXEL_ENABLED) fbq('track', 'InitiateCheckout', {
        content_name: `Tank-G - ${plan}`,
        content_type: 'product',
        value, currency: 'BRL', quantity: 1,
        ...getTrackingContext()
      }, {eventID: eventId});
      this.href = appendTrackingToCheckout(this.href, plan);
    });
  });

  // Purchase deve disparar SOMENTE após confirmação real do pagamento.
  // Na página de obrigado/retorno da Eduzz, chame:
  // window.truckerCapTrackPurchase({ value: 27 ou 67, orderId: 'ID_DO_PEDIDO', plan: '...' })
  window.truckerCapTrackPurchase = function({value, orderId='', plan='Tank-G'}={}){
    if (!value) return;
    const eventId = orderId ? `Purchase_${orderId}` : window.truckerCapMeta.newEventId('Purchase');
    if (PIXEL_ENABLED) fbq('track', 'Purchase', {
      content_name: plan, content_type: 'product', value: Number(value), currency: 'BRL',
      ...getTrackingContext()
    }, {eventID: eventId});
    return { eventId, capi: window.truckerCapMeta.capiPayload('Purchase', eventId, {value:Number(value),currency:'BRL',content_name:plan}) };
  };


  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e){
      const id=this.getAttribute('href');
      if(id && id.length>1){
        const el=document.querySelector(id);
        if(el){e.preventDefault();el.scrollIntoView({behavior:'smooth',block:'start'});}
      }
    });
  });
})();
