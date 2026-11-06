// OG Studio: runs before Studio starts. Turns off the flags that swap the old Channel
// analytics and Channel content pages for the new ones, so Studio's own old pages load.
// If this ever stops working, main.js rebuilds the old page instead.
(() => {
  const FLAG = 'WebFEAllStudioByChannel__enable_analytics_hub_web';
  const OTHERS = [
    'WebFEAllStudioByChannel__enable_content_hub_web',
    'WebFEAllStudioByChannel__enable_content_hub_web_oac',
    'WebFEAllStudioByChannel__enable_content_hub_drafts_shelf',
  ];
  const SKIP = 'og.rebuilt.until';
  const HUB = /^(\/channel\/[^/]+\/analytics\/)hub_[^/]*\/?(explore)?\/?$/;

  let skip = false;
  try { skip = Number(sessionStorage.getItem(SKIP) || 0) > Date.now() || localStorage.getItem('og.mode') === 'rebuilt'; } catch { /* optional */ }
  if (skip) return;

  function patch(cfg) {
    const flags = cfg?.d?.()?.EXPERIMENT_FLAGS;
    if (!flags) return;
    const off = (k) => Object.defineProperty(flags, k, { value: false, writable: false, configurable: true, enumerable: true });
    const content = OTHERS.filter((k) => flags[k] === true);
    content.forEach(off);
    if (content.length) document.documentElement.dataset.ogContent = '1';
    if (flags[FLAG] !== true) return;
    off(FLAG);
    document.documentElement.dataset.ogNative = '1';
    const m = location.pathname.match(HUB);
    if (m) history.replaceState(history.state, '', `${m[1]}tab-overview/period-default${m[2] ? '/explore' : ''}${location.search}`);
  }

  function wrap(cfg) {
    if (!cfg || typeof cfg.set !== 'function' || cfg.ogWrapped) return;
    const set = cfg.set;
    cfg.set = function (...a) { const r = set.apply(this, a); patch(cfg); return r; };
    cfg.ogWrapped = true;
    patch(cfg);
  }

  let current = window.ytcfg;
  wrap(current);
  Object.defineProperty(window, 'ytcfg', {
    configurable: true,
    get: () => current,
    set: (v) => { current = v; wrap(v); },
  });
})();
