(function () {
  'use strict';

  var LOGIN_PAGE = 'index.html';
  var BUY_CHALLENGE_PAGE = '../index.html#gb-container-698ba205';

  function byExactText(selector, text) {
    var list = document.querySelectorAll(selector);
    var found = [];
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      var own = '';
      for (var j = 0; j < el.childNodes.length; j++) {
        if (el.childNodes[j].nodeType === 3) own += el.childNodes[j].nodeValue;
      }
      if (own.trim().toLowerCase() === text.toLowerCase()) found.push(el);
    }
    return found;
  }

  function wire(selector, text, dest) {
    byExactText(selector, text).forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = dest;
      });
    });
  }

  function init() {
    wire('button', 'Buy Challenge', BUY_CHALLENGE_PAGE);
    wire('button', 'New Challenge', BUY_CHALLENGE_PAGE);
    wire('a', 'Buy Challenge', BUY_CHALLENGE_PAGE);
    wire('button', 'Logout', LOGIN_PAGE);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();