// OG Studio: decides when to take over the page. Any failure puts normal Studio back.
(() => {
  const PAGE = /^\/channel\/([^/]+)\/analytics\/hub_overview\/?$/;
  const ON = 'og-active';
  let root = null, token = 0, activeHref = '', resizeFn = null;

  const store = {
    get() { try { return localStorage.getItem('og.period'); } catch { return null; } },
    set(v) { try { localStorage.setItem('og.period', v); } catch { /* optional */ } },
  };

  // The old Realtime card keeps updating while the page is open.
  let liveChannel = null, liveCtx = null;
  setInterval(async () => {
    const old = root?.querySelector('.og-rt');
    if (!old || !liveChannel || document.hidden) return;
    try {
      const rt = await window.OGData.getRealtime(liveChannel);
      const fresh = rt && window.OGUI.realtimeCard(rt, liveCtx);
      if (fresh && old.isConnected) old.replaceWith(fresh);
    } catch (e) { /* keep the last numbers */ }
  }, 60000);

  function stop() {
    document.documentElement.classList.remove(ON);
    root?.remove();
    root = null; resizeFn = null;
  }

  // Reuses Studio's own buttons so these keep working however YouTube routes them.
  function clickReal(text) {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === text && !x.closest('#og-root'));
    if (b) b.click();
  }
  let state = { tab: 'Overview', sub: null };
  let tabCache = null;
  const go = (url) => { location.href = url; };

  // Same links the old See more buttons used. Studio still serves these reports on new-layout channels.
  function exploreUrl(ch, periodKey, kind, card) {
    const p = window.OGData.periodOf(periodKey).url;
    const base = `/channel/${ch}/analytics/tab-overview/period-${p}/explore?entity_type=CHANNEL&entity_id=${ch}&time_period=${p}`;
    const tail = (m, dim) => `&explore_type=TABLE_AND_CHART&metric=${m}&granularity=DAY&t_metrics=${m}${dim ? `&dimension=${dim}` : ''}&o_column=${m}&o_direction=ANALYTICS_ORDER_DIRECTION_DESC`;
    if (kind === 'live') return `${base}&explore_type=SUBSCRIBERS`;
    if (kind === 'latest') return `${base}&explore_type=LATEST_ACTIVITY`;
    if (kind === 'top') return `${base}${tail('EXTERNAL_VIEWS', 'VIDEO')}&t_metrics=AVERAGE_WATCH_TIME&t_metrics=AVERAGE_WATCH_PERCENTAGE`;
    if (kind === 'key') return `${base}${tail('EXTERNAL_VIEWS', 'VIDEO')}&metrics_computation_type=DELTA&t_metrics=EXTERNAL_WATCH_TIME&t_metrics=SUBSCRIBERS_NET_CHANGE&t_metrics=TOTAL_ESTIMATED_EARNINGS`;
    const cfg = card?.config || {};
    const tc = cfg.tableCardConfig || cfg.tableCardByContentTypeCardConfig?.tableCardConfig;
    const m = tc?.metrics?.[0] || cfg.keyMetricCardConfig?.metricTabConfigs?.[0]?.metric || 'EXTERNAL_VIEWS';
    return base + tail(m, tc?.dimension || 'VIDEO');
  }
  async function load(channelId, periodKey) {
    const mine = ++token;
    const { OGData, OGUI, OGTabs } = window;
    const ctx = {
      periodKey, PERIODS: OGData.PERIODS,
      onPeriod: (k) => { store.set(k); root.classList.add('og-busy'); load(channelId, k); },
      onTab: (t) => { state = { tab: t, sub: null }; root.classList.add('og-busy'); load(channelId, periodKey); },
      onSub: (k) => { state.sub = k; if (tabCache) window.OGTabs.render(root, { ...ctx, data: tabCache, tab: state.tab, sub: k }); },
      goTab: (t) => { state = { tab: t, sub: null }; load(channelId, periodKey); },
      advanced: () => clickReal('Advanced mode'),
      onAsk: () => clickReal('Ask Studio'),
      research: () => clickReal('Research'),
      explore: (kind, card) => go(exploreUrl(channelId, periodKey, kind, card)),
      video: (id) => go(`/video/${id}/analytics/tab-overview/period-default`),
      onResize: (fn) => { resizeFn = fn; },
    };
    try {
      if (state.tab === 'Overview') {
        const data = await OGData.getOverview(channelId, periodKey);
        if (mine !== token || !root) return;
        root.classList.remove('og-busy');
        OGUI.render(root, { ...ctx, data });
        liveChannel = channelId; liveCtx = ctx;
      } else {
        const data = await OGData.getTab(channelId, periodKey, state.tab);
        if (mine !== token || !root) return;
        tabCache = data;
        root.classList.remove('og-busy');
        OGTabs.render(root, { ...ctx, data, tab: state.tab, sub: state.sub });
      }
    } catch (e) {
      console.warn('[OG Studio] showing normal Studio:', e);
      if (mine === token) stop();
    }
  }

  function start(channelId) {
    const host = document.querySelector('main#main');
    if (!host || !window.ytcfg) return false;
    document.documentElement.classList.add(ON);
    root = window.OGUI.el('div', 'og-root');
    root.id = 'og-root';
    if (/DARK/.test(window.ytcfg.get('INNERTUBE_CONTEXT')?.client?.userInterfaceTheme || '')) root.classList.add('og-dark');
    root.append(window.OGUI.el('div', 'og-loading', 'Loading…'));
    host.append(root);
    const saved = store.get();
    load(channelId, window.OGData.PERIODS[saved] || String(saved).startsWith('custom:') ? saved : 'month');
    return true;
  }

  function renameNav() {
    if (!location.pathname.includes('/analytics')) return;
    for (const a of document.querySelectorAll('a[href*="/analytics/hub_overview"]')) {
      const w = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) if (n.nodeValue.trim() === 'Insights') n.nodeValue = n.nodeValue.replace('Insights', 'Analytics');
    }
    if (root && document.title.startsWith('Channel insights')) document.title = document.title.replace('Channel insights', 'Channel analytics');
  }

  // If Studio's own old page never shows up, stand down for an hour: Analytics gets the rebuilt
  // page, Content gets YouTube's current page.
  const NATIVE = /^\/channel\/([^/]+)\/analytics\/tab-[^/]+(\/period-[^/]+)?\/?$/;
  const LIST = /^\/channel\/[^/]+\/(videos|content)(\/|$)/;
  const waited = { analytics: 0, content: 0 }, seen = {};
  function watchNative() {
    if (document.hidden) return;
    const ds = document.documentElement.dataset, path = location.pathname;
    const m = ds.ogNative === '1' && path.match(NATIVE);
    const kind = m ? 'analytics' : ds.ogContent === '1' && LIST.test(path) ? 'content' : null;
    if (!kind || seen[kind]) return;
    if (document.querySelector(m ? 'yta-screen' : 'ytcp-content-section')?.getBoundingClientRect().height > 200) { seen[kind] = true; return; }
    waited[kind] += 400;
    if (waited[kind] < 30000) return;
    try { sessionStorage.setItem('og.rebuilt.until', String(Date.now() + 3600000)); } catch { /* optional */ }
    location.replace(m ? `/channel/${m[1]}/analytics/hub_overview` : location.href);
  }

  // Studio's own old page shows Revenue to every channel. Hide it on channels that never earned.
  let revChannel = null;
  function checkRevenue() {
    const html = document.documentElement, path = location.pathname;
    if (!path.includes('/analytics')) return;
    html.classList.toggle('og-overview', path.includes('/analytics/tab-overview'));
    const ch = window.ytcfg?.get?.('CHANNEL_ID');
    if (!ch) return;
    const key = `og.rev.${ch}`;
    if (revChannel !== ch) {
      revChannel = ch;
      try { html.classList.toggle('og-no-revenue', localStorage.getItem(key) === '0'); } catch { /* optional */ }
      window.OGData.revenueStatus(ch).then((has) => {
        if (has === null) return;
        html.classList.toggle('og-no-revenue', !has);
        try { localStorage.setItem(key, has ? '1' : '0'); } catch { /* optional */ }
      });
    }
    if (html.classList.contains('og-no-revenue') && path.includes('/analytics/tab-earn_revenue')) {
      location.replace(path.replace(/tab-earn_revenue/, 'tab-overview'));
    }
  }

  function tick() {
    renameNav();
    watchNative();
    checkRevenue();
    const m = location.pathname.match(PAGE);
    if (location.href === activeHref && (root || !m)) return;
    if (!m) { activeHref = location.href; stop(); return; }
    if (!root && start(m[1])) activeHref = location.href;
  }

  setInterval(tick, 400);
  let t;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => resizeFn?.(), 150); });
  tick();
})();
