/* Put the decision moment immediately after proof without altering content. */
(function () {
  'use strict';

  function moveAfter(reference, element) {
    if (reference && element && reference !== element) {
      reference.insertAdjacentElement('afterend', element);
    }
    return element || reference;
  }

  function arrangeHomepage() {
    var stats = document.querySelector('.fh-stats');
    var pricing = document.getElementById('pricing-plan');
    if (!stats || !pricing || pricing.dataset.fhPositioned === 'true') return;
    var steps = document.querySelector('.fh-steps');
    var live = document.querySelector('.fh-hero');
    var community = document.querySelector('.fh-community');
    var cursor = moveAfter(stats, pricing);
    cursor = moveAfter(cursor, steps);
    cursor = moveAfter(cursor, live);
    moveAfter(cursor, community);
    pricing.dataset.fhPositioned = 'true';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrangeHomepage, { once: true });
  } else {
    arrangeHomepage();
  }
})();

/* Discord CTA markup from the MIT-licensed Uiverse component by MrD4rio.
 * It remains an anchor so the existing Discord destination and accessibility stay intact. */
(function () {
  'use strict';
  function buildDiscordButton() {
    var button = document.querySelector('a.gb-button.gb-button-8f7a7fff.cta-button');
    if (!button || button.dataset.fhDiscordReady === 'true') return;
    button.innerHTML = '<span class="svg-wrapper-1"><span class="svg-wrapper"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" aria-hidden="true"><path fill="none" d="M0 0h24v24H0z"></path><path fill="currentColor" d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z"></path></svg></span></span><span class="gb-button-text">Discord</span>';
    button.setAttribute('aria-label', 'Join the FundedHero Discord community');
    button.dataset.fhDiscordReady = 'true';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildDiscordButton, { once: true });
  else buildDiscordButton();
})();
