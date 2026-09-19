/* pages-upgrade.js — additive premium hero + container marker for the
   static content pages (certificates, my-stats, offers, affiliates,
   subscriptions, account-settings). Does NOT touch existing ids/hrefs. */
(function () {
  if (window.FHPagesUpgraded) return;

  var MAP = {
    'certificates': {
      t: 'Certificates',
      s: 'Milestones, payouts and completed phases — every achievement unlocked along your journey.'
    },
    'my-stats': {
      t: 'My Stats',
      s: 'Deep-dive performance: equity line, risk profile, recent trades and the trading calendar.'
    },
    'offers': {
      t: 'Offers',
      s: 'Exclusive discounts and promotions available for your account.'
    },
    'affiliates': {
      t: 'Affiliates',
      s: 'Refer trades, track commissions and grow your payout stream.'
    },
    'subscriptions': {
      t: 'Subscriptions',
      s: 'Active plans, billing cycles and account add-ons at a glance.'
    },
    'account-settings': {
      t: 'Account Settings',
      s: 'Manage your personal details and payment information.'
    },
    'trade-history': {
      t: 'Trade History',
      s: 'Full execution log: sort, search and paginate through your past trades.'
    }
  };

  function detectSlug() {
    var file = (location.pathname || '').split('/').pop() || '';
    if (file) {
      if (file.indexOf('.html') !== -1) file = file.slice(0, -5);
      if (MAP[file]) return file;
    }
    var active = document.querySelector('aside a[href][class*="bg-primary-bg"], aside a[href][class*="bg-primary-bg/"]');
    var h = active ? (active.getAttribute('href') || '') : '';
    for (var k in MAP) {
      if (h && h.indexOf(k + '.html') !== -1 && h.indexOf('pages/') === -1) return k;
    }
    var t = (document.title || '').toLowerCase();
    for (var k2 in MAP) {
      if (t.indexOf(k2.replace(/-/g, ' ')) !== -1) return k2;
    }
    return null;
  }

  var slug = detectSlug();
  if (!slug) return;
  var cfg = MAP[slug];
  document.body.classList.add('fh-pg', 'fh-pg-' + slug);

  function findScroller() {
    var mains = document.querySelectorAll('main');
    for (var i = 0; i < mains.length; i++) {
      var sel = 'div.flex-1.w-full, .flex-1.w-full, div[class*="overflow-y-auto"][class*="lg:p-8"], div[class*="overflow-y-auto"][class*="p-4"]';
      var cand = mains[i].querySelector(sel);
      if (cand) return cand;
    }
    return document.querySelector('main .flex-1') || document.querySelector('main');
  }

  function boot() {
    var scroller = findScroller();
    if (!scroller) return;
    if (scroller.querySelector('.fh-pg-head')) return;
    var hd = document.createElement('div');
    hd.className = 'fh-pg-head';
    hd.innerHTML =
      '<div class="fh-pg-head-t"><h1>' + cfg.t + '</h1><p>' + cfg.s + '</p></div>' +
      '<span class="fh-chip-demo">demo &middot; mockup</span>';
    scroller.insertBefore(hd, scroller.firstChild);
    window.FHPagesUpgraded = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();