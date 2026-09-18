/* FH glass nav: alterna sombra/profundidad al desplazar. Sin dependencias. */
(function () {
  var header = document.getElementById('masthead');
  var mobile = document.getElementById('mobile-header');
  function onScroll() {
    var y = window.scrollY || window.pageYOffset || 0;
    var past = y > 24;
    if (header) header.classList.toggle('fh-nav-scrolled', past);
    if (mobile) mobile.classList.toggle('fh-nav-scrolled', past);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
