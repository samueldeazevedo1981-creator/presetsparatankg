(function(){
  const cfg = window.TANKG_CONFIG || {};
  document.querySelectorAll('.buy-basic').forEach(a => a.href = cfg.checkoutBasico || '#');
  document.querySelectorAll('.buy-pro').forEach(a => a.href = cfg.checkoutProfissional || '#');
  document.getElementById('year').textContent = new Date().getFullYear();

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
