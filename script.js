(function(){
  const cfg = window.TANKG_CONFIG || {};
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

  const FIRED_KEY = 'tc_tankg_pixel_events';

  function getFiredEvents(){
    try { return JSON.parse(sessionStorage.getItem(FIRED_KEY) || '{}'); }
    catch(e) { return {}; }
  }

  function alreadyFired(eventName){
    return Boolean(getFiredEvents()[eventName]);
  }

  function markAsFired(eventName){
    const fired = getFiredEvents();
    fired[eventName] = Date.now();
    try { sessionStorage.setItem(FIRED_KEY, JSON.stringify(fired)); } catch(e) {}
  }

  function trackEvent(eventName, extraParams={}, options={}){
    if (options.once && alreadyFired(eventName)) return null;
    const eventId = window.truckerCapMeta.newEventId(eventName);
    const params = {
      content_name: 'Tank-G Tone Collection',
      content_category: 'Presets, Capturas e IRs para Tank-G',
      ...getTrackingContext(),
      ...extraParams
    };
    if (PIXEL_ENABLED && typeof fbq === 'function') {
      if (options.custom) fbq('trackCustom', eventName, params, {eventID: eventId});
      else fbq('track', eventName, params, {eventID: eventId});
    }
    if (options.once) markAsFired(eventName);
    return {eventId, capi: window.truckerCapMeta.capiPayload(eventName, eventId, params)};
  }

  window.tcTrackEvent = (eventName, params={}) => trackEvent(eventName, params, {custom:true});
  window.tcTrackStandardEvent = (eventName, params={}) => trackEvent(eventName, params);

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

  document.querySelectorAll('.buy-pro, .checkout-direct').forEach(a => {
    a.addEventListener('click', function(){
      const value = 67;
      const plan = 'Combo Guitarrista Pro';
      const clickData = {
        content_name: `Tank-G - ${plan}`,
        content_type: 'product',
        value, currency: 'BRL', quantity: 1,
        button_text: (this.textContent || '').trim(),
        destination: this.href,
        plan
      };
      trackEvent('BuyButtonClick', clickData, {custom:true});
      trackEvent('CalculatorBuyIntent', clickData, {custom:true});
      trackEvent('InitiateCheckout', clickData, {once:true});
      if (this.classList.contains('checkout-direct')) this.href = appendTrackingToCheckout(this.href, plan);
    });
  });

  document.querySelectorAll('.whatsapp-float').forEach(a => {
    a.addEventListener('click', function(){
      trackEvent('WhatsAppClick', {
        content_name: 'Atendimento Presets Tank-G',
        contact_channel: 'whatsapp',
        button_text: (this.textContent || this.getAttribute('aria-label') || '').trim(),
        destination: this.href
      }, {custom:true});
    });
  });

  // Purchase deve disparar SOMENTE após confirmação real do pagamento.
  // Na página de obrigado/retorno da Eduzz, chame:
  // window.truckerCapTrackPurchase({ value: 67, orderId: 'ID_DO_PEDIDO', plan: '...' })
  window.truckerCapTrackPurchase = function({value, orderId='', plan='Tank-G'}={}){
    if (!value) return;
    const eventId = orderId ? `Purchase_${orderId}` : window.truckerCapMeta.newEventId('Purchase');
    if (PIXEL_ENABLED) fbq('track', 'Purchase', {
      content_name: plan, content_type: 'product', value: Number(value), currency: 'BRL',
      ...getTrackingContext()
    }, {eventID: eventId});
    return { eventId, capi: window.truckerCapMeta.capiPayload('Purchase', eventId, {value:Number(value),currency:'BRL',content_name:plan}) };
  };

  function setupOptionalPurchaseByUrl(){
    const params = new URLSearchParams(location.search);
    if (params.get('tc_purchase') !== '1') return;
    window.truckerCapTrackPurchase({
      value: Number(params.get('value') || 67),
      orderId: params.get('order_id') || params.get('transaction_id') || '',
      plan: params.get('plan') || 'Tank-G Tone Collection'
    });
  }

  function setupTimeEvents(){
    [[30,30000],[60,60000],[120,120000]].forEach(([seconds, delay]) => {
      setTimeout(() => trackEvent(`Tempo${seconds}`, {tempo_segundos:seconds}, {custom:true, once:true}), delay);
    });
  }

  function setupScrollEvents(){
    const points = [25,50,75,90];
    function checkScroll(){
      const doc = document.documentElement;
      const body = document.body;
      const top = window.pageYOffset || doc.scrollTop || body.scrollTop || 0;
      const height = Math.max(body.scrollHeight, doc.scrollHeight, body.offsetHeight, doc.offsetHeight);
      const max = height - (window.innerHeight || doc.clientHeight);
      if (max <= 0) return;
      const percent = Math.round((top / max) * 100);
      points.forEach(point => {
        if (percent >= point) trackEvent(`Scroll${point}`, {scroll_percent:point}, {custom:true, once:true});
      });
    }
    window.addEventListener('scroll', checkScroll, {passive:true});
    window.addEventListener('resize', checkScroll);
    checkScroll();
  }

  function isVisible(element){
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && rect.width > 0 && rect.height > 0;
  }

  function setupUpsellViewWatcher(){
    const selectors = ['#upsellModal','.upsell-modal','[data-upsell-modal]','[data-meta-event="UpsellView"]'];
    function checkUpsell(){
      selectors.forEach(selector => document.querySelectorAll(selector).forEach(element => {
        if (isVisible(element)) trackEvent('UpsellView', {modal_selector:selector}, {custom:true, once:true});
      }));
    }
    const observer = new MutationObserver(checkUpsell);
    observer.observe(document.body, {attributes:true, childList:true, subtree:true, attributeFilter:['class','style','hidden','aria-hidden']});
    checkUpsell();
  }

  function setupEmbeddedCheckoutTracking(){
    const checkout = document.getElementById('checkout');
    if (!checkout || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
          trackEvent('InitiateCheckout', {
            content_name: 'Tank-G - Combo Guitarrista Pro',
            content_type: 'product',
            value: 67,
            currency: 'BRL',
            quantity: 1,
            source: 'checkout_eduzz_incorporado'
          }, {once:true});
          observer.disconnect();
        }
      });
    }, {threshold:[0.35]});
    observer.observe(checkout);
  }

  setupOptionalPurchaseByUrl();
  setupTimeEvents();
  setupScrollEvents();
  setupUpsellViewWatcher();
  setupEmbeddedCheckoutTracking();


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
