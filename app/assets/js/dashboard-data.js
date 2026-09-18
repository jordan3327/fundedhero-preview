/* ============================================================
   FHData — Data layer (DEMO seed).
   All values here are static demo data shown on the local replica.
   Swap this object for backend/API responses later WITHOUT touching
   the UI. Every read is demo-first; nothing broadcasts fake prices.
   ============================================================ */
(function () {
  'use strict';

  var D = {

    meta: {
      demo: true,
      label: 'Demo data',
      source: 'static local seed (no connection to any broker)'
    },

    statistics: {
      // Mirrors the real account state (captured from the live app, 2026-09-18):
      // two Step Two 50K challenges, both FAILED, no active balance -> "—".
      accountBalance: null,
      equity: null,
      todayPnl: null,
      totalPnl: -3929.60,
      maxDrawdown: null,
      dailyLossLimit: null,
      profitTarget: null,
      tradingDays: null,
      // Positional KPIs stay empty until real trades exist.
      winRate: null,
      lossRate: null,
      profitFactor: null,
      avgTrade: null,
      bestTrade: null,
      worstTrade: null,
      winningDays: null,
      losingDays: null
    },

    accounts: [
      { id: 'EVAL VOL | 785c33af-1f94-4fdc-ae71-8c732ad7540b | FDH03066',
        name: 'Step Two 50K - Phase 1', size: 50000, balance: null, pnl: null, progress: null,
        stage: '2-Step', status: 'FAILED', chip: 'red' },
      { id: 'EVAL VOL | 2d7d09c7-a2f7-4df8-b433-522fe9816274 | VOL_Phase_1_05e52e4b',
        name: 'Step Two 50K - Phase 1', size: 50000, balance: null, pnl: null, progress: null,
        stage: '2-Step', status: 'FAILED', chip: 'red' }
    ],

    monthly: [
      { m: 'Oct', v: 12.4 }, { m: 'Nov', v: 14.1 }, { m: 'Dec', v: 13.8 }, { m: 'Jan', v: 16.2 },
      { m: 'Feb', v: 18.9 }, { m: 'Mar', v: 17.4 }, { m: 'Apr', v: 21.3 }, { m: 'May', v: 24.8 },
      { m: 'Jun', v: 23.1 }, { m: 'Jul', v: 27.6 }, { m: 'Aug', v: 29.2 }, { m: 'Sep', v: 33.5 }
    ],

    payouts: [
      { method: 'PayPal', date: 'Sep 12, 2026', amt: 2500.00, status: 'paid' },
      { method: 'Bank Transfer', date: 'Aug 28, 2026', amt: 1850.00, status: 'paid' },
      { method: 'PayPal', date: 'Aug 09, 2026', amt: 2000.00, status: 'paid' }
    ],

    // Trade-level data intentionally EMPTY — the real page shows "No data found".
    // Do not invent trades here; the UI stays prepared to render them later.
    trades: [],

    positions: [],
    orders: [],

    notifications: [
      { type: 'payout_paid', title: 'Payout paid', body: 'Your $2,500.00 PayPal payout was paid.', time: '2 hours ago' },
      { type: 'account_funded', title: 'Account funded', body: 'Future 25K is now a funded account.', time: '3 days ago' },
      { type: 'payout_approved', title: 'Payout approved', body: 'Your bank transfer request was approved.', time: '4 days ago' },
      { type: 'target', title: 'Target progress', body: 'Future 25K is 64% toward the first payout target.', time: '1 week ago' },
      { type: 'drawdown', title: 'Drawdown notice', body: 'Simulated warning level sampled from demo data.', time: '2 weeks ago' },
      { type: 'system', title: 'System update', body: 'Platform maintenance completed without interruption.', time: '3 weeks ago' }
    ],

    calendar: {
      demo: true,
      year: 2026,
      month: 8, // Sep
      label: 'September 2026',
      days: [
        { d: 3, s: 'win' }, { d: 4, s: 'win' }, { d: 7, s: 'loss' }, { d: 8, s: 'win' },
        { d: 9, s: 'win' }, { d: 10, s: 'loss' }, { d: 14, s: 'win' }, { d: 15, s: 'win' },
        { d: 16, s: 'win' }, { d: 17, s: 'loss' }, { d: 21, s: 'win' }, { d: 22, s: 'win' },
        { d: 23, s: 'win' }, { d: 24, s: 'win' }, { d: 28, s: 'loss' }, { d: 29, s: 'win' }
      ]
    },

    risk: {
      dailyLossUsedPct: 19.6,   // derived from demo statistics
      drawdownUsedPct: 50.6,    // derived from demo statistics
      targetPct: 72.0,          // funded account progress (avg demo)
      status: 'normal'
    }

  };

  window.FHData = D;
})();