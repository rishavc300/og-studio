// OG Studio: draws the classic pages from data.js. Sizes come from measuring the real old page at 1920 wide.
// No innerHTML anywhere (Studio uses Trusted Types).
(() => {
  const SVG = 'http://www.w3.org/2000/svg';
  const el = (tag, cls, ...kids) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    for (const k of kids) if (k != null) e.append(k);
    return e;
  };
  const svg = (tag, attrs) => {
    const e = document.createElementNS(SVG, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  };
  const ICON = {
    down: 'M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1Zm0 5a1 1 0 011 1v7.586l2.293-2.293a1 1 0 111.414 1.414L12 18.414l-4.707-4.707a1 1 0 111.414-1.414L11 14.586V7a1 1 0 011-1Z',
    caret: 'M18.707 8.793a1 1 0 00-1.414 0L12 14.086 6.707 8.793a1 1 0 10-1.414 1.414L12 16.914l6.707-6.707a1 1 0 000-1.414Z',
    more: 'M12 4a2 2 0 100 4 2 2 0 000-4Zm0 6a2 2 0 100 4 2 2 0 000-4Zm0 6a2 2 0 100 4 2 2 0 000-4Z',
    spark: 'M12 1.5 14.6 9.4 22.5 12l-7.9 2.6L12 22.5l-2.6-7.9L1.5 12l7.9-2.6L12 1.5Z',
    warn: 'M12 2 1 21h22L12 2Zm0 4.2L19.5 19h-15L12 6.2ZM11 10v5h2v-5h-2Zm0 6v2h2v-2h-2Z',
    heart: 'M12 21s-8.5-5.2-10-10.3C1 7.2 3.2 4 6.6 4c2.1 0 3.9 1 5.4 3 1.5-2 3.3-3 5.4-3C20.8 4 23 7.2 22 10.7 20.5 15.8 12 21 12 21Zm0-2.4c3.2-2.1 7.2-5.3 8.1-8.4.7-2.3-.6-4.2-2.7-4.2-1.7 0-3 1-4.3 3L12 10l-1.1-1c-1.3-2-2.6-3-4.3-3-2.1 0-3.4 1.9-2.7 4.2.9 3.1 4.9 6.3 8.1 8.4Z',
    search: 'M11 3a8 8 0 105 14.2l4.4 4.4 1.4-1.4-4.4-4.4A8 8 0 0011 3Zm0 2a6 6 0 110 12 6 6 0 010-12Z',
    cap: 'M12 3 1 9l11 6 9-4.9V17h2V9L12 3Zm-6.8 10.2V17c0 1.7 3 3.5 6.8 3.5s6.8-1.8 6.8-3.5v-3.8L12 17l-6.8-3.8Z',
    clock: 'M12 2a10 10 0 100 20 10 10 0 000-20Zm0 2a8 8 0 110 16 8 8 0 010-16Zm-1 3v6l5 3 1-1.7-4-2.4V7h-2Z',
    check: 'M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1Zm5.207 8.207-6 6a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L10.5 13.086l5.293-5.293a1 1 0 111.414 1.414Z',
  };
  const icon = (name, size, cls, flip) => {
    const s = svg('svg', { width: size, height: size, viewBox: '0 0 24 24', class: 'og-ic' + (cls ? ' ' + cls : '') });
    if (flip) s.style.transform = 'rotate(180deg)';
    s.append(svg('path', { d: ICON[name] }));
    return s;
  };

  const compact = (n) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
  const int = (n) => new Intl.NumberFormat('en-US').format(Math.round(n));
  const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: window.OGData.currency() }).format(n);
  const hours = (ms) => ms / 3.6e6;
  const clock = (ms) => {
    const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = String(s % 60).padStart(2, '0');
    return h ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`;
  };
  const day = (ms, year = true) => new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(year ? { year: 'numeric' } : {}) });

  const show = {
    views: (v) => compact(v), watch: (v) => compact(hours(v)), count: (v) => compact(v),
    subs: (v) => (v > 0 ? '+' : '') + compact(v), revenue: (v) => money(v / 1000),
    pct: (v) => v.toFixed(1) + '%', time: (v) => clock(v),
  };
  const showFull = { ...show, views: (v) => int(v), count: (v) => int(v), subs: (v) => int(v) };
  const showDiff = { ...showFull, views: (v) => compact(v), subs: (v) => compact(v), count: (v) => compact(v) };

  // Same wording rules as the old page: distance from the usual range, else % vs the previous period.
  function delta(m, period, prevRange) {
    if (m.typical) {
      const { low, high } = m.typical;
      if (m.total < low) return { dir: 'down', text: `${showDiff[m.key](low - m.total)} less than usual` };
      if (m.total > high) return { dir: 'up', text: `${showDiff[m.key](m.total - high)} more than usual` };
      return { dir: null, text: 'About the same as usual' };
    }
    if (period.noPrev || m.key === 'pct' || m.key === 'time' || !m.previous) return null;
    if (m.key === 'revenue' && (period.days || m.clock)) return null;
    const what = period.days ? `previous ${period.days} days` : prevRange;
    if (!what) return null;
    const p = Math.round(Math.abs(m.total / m.previous - 1) * 100);
    if (!p) return { dir: null, text: `About the same as ${what}` };
    const up = m.total > m.previous;
    return { dir: up ? 'up' : 'down', text: `${p}% ${up ? 'more' : 'less'} than ${what}` };
  }

  const button = (label, onClick, cls) => {
    const b = el('button', 'og-btn' + (cls ? ' ' + cls : ''), label);
    b.type = 'button';
    if (onClick) b.onclick = onClick;
    return b;
  };

  const measure = (() => { let c; return (t) => { c = c || document.createElement('canvas').getContext('2d'); c.font = '12px Roboto, Noto, sans-serif'; return c.measureText(t).width; }; })();
  const longDay = (ms) => new Date(ms).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const monthName = (ms, y) => new Date(ms).toLocaleDateString('en-US', { month: 'short', ...(y ? { year: 'numeric' } : {}) });
  const fitEnd = (t, w) => { if (measure(t) <= w) return t; let s = t; while (s.length > 1 && measure(s + '...') > w) s = s.slice(0, -1); return s + '...'; };

  // Measured from the old chart: 16px above the plot, 4 grid rows, y labels 20px past the plot,
  // 7 date labels with the outer two cut to fit, upload markers in a 30px band under the plot.
  function chart(host, m, opts = {}) {
    host.replaceChildren();
    const pts = opts.monthly ? m.monthly : m.series;
    if (!pts || pts.length < 2) return;
    const uploads = (opts.uploads || []).filter((t) => t >= pts[0].x && t <= pts[pts.length - 1].x + 864e5);
    const band = uploads.length ? 30 : 0;
    const W = host.clientWidth, L = 20, T = 16, PH = band ? 108 : 114, H = T + PH + band + 24;
    const ys = pts.map((p) => p.y);
    const scale = m.key === 'watch' ? hours : m.key === 'revenue' ? (v) => v / 1000 : m.key === 'time' ? (v) => v / 1000 : (v) => v;
    const unit = 1 / scale(1);
    const lo = Math.min(...ys, 0), hi = Math.max(...ys, unit);
    const want = scale((hi - lo) / 3), pow = 10 ** Math.floor(Math.log10(want || 1));
    const step = ([1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10].find((k) => k * pow >= want) * pow) / scale(1);
    const min = Math.floor(lo / step) * step, max = min + step * 3 >= hi ? min + step * 3 : Math.ceil(hi / step) * step;
    const axis = (v) => (m.key === 'revenue' ? money(scale(v)) : m.key === 'pct' ? scale(v).toFixed(0) + '%' : compact(scale(v)));
    const labels = [];
    for (let v = min; v <= max + step / 2; v += step) labels.push(v);
    const lw = Math.max(...labels.map((v) => measure(axis(v))));
    const PW = W - 21 - lw - 20 - L;
    const n = pts.length - 1;
    const X = (i) => L + (i / n) * PW, Y = (v) => T + PH - ((v - min) / (max - min)) * PH;
    const s = svg('svg', { width: W, height: H, class: 'og-svg' });
    labels.forEach((v, k) => {
      const y = Y(v);
      s.append(svg('line', { x1: L, x2: L + PW, y1: y, y2: y, class: k ? 'og-grid' : 'og-base' }));
      const t = svg('text', { x: L + PW + 20, y: y + 4, class: 'og-axis' });
      t.textContent = axis(v);
      s.append(t);
    });
    let last = n;
    if (m.missingFrom) { const k = pts.findIndex((p) => p.x >= m.missingFrom); if (k > 0) last = k - 1; }
    if (last < n) s.append(svg('rect', { x: X(last), y: T, width: X(n) - X(last), height: PH, class: 'og-band' }));
    const line = pts.slice(0, last + 1).map((p, i) => `${i ? 'L' : 'M'}${X(i)},${Y(p.y)}`).join('');
    s.append(svg('path', { d: `${line}L${X(last)},${Y(min)}L${X(0)},${Y(min)}Z`, class: 'og-area' }));
    s.append(svg('path', { d: line, class: 'og-line' }));
    const axisY = T + PH + band;
    if (band) s.append(svg('line', { x1: L, x2: L + PW, y1: axisY, y2: axisY, class: 'og-base' }));
    const ticks = Math.min(7, pts.length);
    const idx = Array.from({ length: ticks }, (_, i) => Math.floor((i * n) / (ticks - 1) + 0.5));
    idx.forEach((k, i) => {
      const edge = opts.monthly ? false : i === 0 || i === ticks - 1;
      const gap = i === 0 ? X(idx[1]) - X(k) : i === ticks - 1 ? X(k) - X(idx[ticks - 2]) : 0;
      const full = opts.monthly ? monthName(pts[k].x, i === 0) : day(pts[k].x);
      const t = svg('text', { x: X(k), y: T + PH + band + 21, class: 'og-axis', 'text-anchor': edge ? (i === 0 ? 'start' : 'end') : 'middle' });
      t.textContent = edge ? fitEnd(full, gap / 2 - 3) : full;
      s.append(t, svg('line', { x1: X(k), x2: X(k), y1: axisY, y2: axisY + 6, class: 'og-base' }));
    });
    // Upload markers: one box per video, nearby uploads merge into a count.
    if (band) {
      const span = pts[n].x - pts[0].x || 1;
      const groups = [];
      for (const t of [...uploads].sort((a, b) => a - b)) {
        const x = L + ((t - pts[0].x) / span) * PW;
        const g = groups[groups.length - 1];
        if (g && x - g.x0 < 21) { g.n++; g.x = (g.x0 + x) / 2; } else groups.push({ x, x0: x, n: 1 });
      }
      for (const g of groups) {
        const bx = Math.min(Math.max(g.x - 8, L), L + PW - 16), by = T + PH + 7;
        s.append(svg('rect', { x: bx, y: by, width: 16, height: 16, rx: 2, class: 'og-mk' }));
        if (g.n === 1) s.append(svg('path', { d: `M${bx + 5.5} ${by + 3.5}v9l6-4.5z`, class: 'og-mk-p' }));
        else { const t = svg('text', { x: bx + 8, y: by + 12, class: 'og-mk-t', 'text-anchor': 'middle' }); t.textContent = g.n > 9 ? '9+' : String(g.n); s.append(t); }
      }
    }
    const guide = svg('line', { y1: T - 4, y2: T + PH, class: 'og-guide', visibility: 'hidden' });
    const dot = svg('circle', { r: 5, class: 'og-dot', visibility: 'hidden' });
    s.append(guide, dot);
    const tip = el('div', 'og-tip');
    tip.hidden = true;
    s.addEventListener('mousemove', (e) => {
      const b = s.getBoundingClientRect();
      const i = Math.max(0, Math.min(last, Math.round(((e.clientX - b.left - L) / PW) * n)));
      dot.setAttribute('cx', X(i)); dot.setAttribute('cy', Y(pts[i].y)); dot.setAttribute('visibility', 'visible');
      guide.setAttribute('x1', X(i)); guide.setAttribute('x2', X(i)); guide.setAttribute('visibility', 'visible');
      tip.replaceChildren(el('div', 'og-tip-date', opts.monthly ? monthName(pts[i].x, true) : longDay(pts[i].x)), el('div', 'og-tip-val', showFull[m.key](pts[i].y)));
      tip.hidden = false;
      tip.style.left = Math.max(0, Math.min(X(i) - tip.offsetWidth / 2, W - tip.offsetWidth)) + 'px';
      tip.style.top = Math.max(-68, Y(pts[i].y) - tip.offsetHeight - 16) + 'px';
    });
    s.addEventListener('mouseleave', () => { tip.hidden = true; dot.setAttribute('visibility', 'hidden'); guide.setAttribute('visibility', 'hidden'); });
    host.style.height = H + 'px';
    host.style.marginBottom = band ? '12px' : '';
    host.append(s, tip);
    return band;
  }

  function keyCard(data, period, ctx, opts = {}) {
    const graph = el('div', 'og-chart');
    const foot = el('div', 'og-card-foot');
    const list = data.metrics;
    const hasMonthly = list.some((m) => m.monthly);
    let monthly = hasMonthly;
    const deltas = list.map((m) => (m.total === null || (m.total === 0 && !m.previous) ? null : delta(m, period, opts.prevRange)));
    const blocks = list.map((m, i) => {
      const d = deltas[i];
      const b = el('button', 'og-metric',
        el('div', 'og-metric-label', m.label, m.clock ? icon('clock', 16, 'og-clock') : null, m.warn && opts.prevRange !== undefined ? icon('warn', 16, 'og-clock') : null),
        el('div', 'og-metric-row', el('div', 'og-metric-total', m.total === null || (m.total === 0 && !m.previous && m.key !== 'subs') ? '—' : show[m.key](m.total)), d?.dir ? icon('down', 18, 'og-trend', d.dir === 'up') : null),
        d ? el('div', 'og-metric-delta', d.text) : null);
      b.type = 'button';
      b.onclick = () => pick(i);
      return b;
    });
    // Old block height: 108 with no comparison line, 110 with one, 114 when Views has one.
    const bh = deltas.some((d, i) => d && list[i].label === 'Views') ? 114 : deltas.some(Boolean) ? 110 : 108;
    let cur = 0;
    const draw = () => chart(graph, list[cur], { uploads: data.uploads, monthly });
    const pick = (i) => { cur = i; blocks.forEach((b, k) => b.classList.toggle('og-on', k === i)); draw(); };
    ctx.onResize(draw);
    foot.append(button('See more', opts.more || ctx.advanced));
    if (hasMonthly) {
      const t = el('div', 'og-gran');
      const mk = (name, v) => { const b = el('button', v === monthly ? 'og-on' : '', name); b.type = 'button'; b.onclick = () => { monthly = v; [...t.children].forEach((c) => c.classList.toggle('og-on', c === b)); draw(); }; return b; };
      t.append(mk('Monthly', true), mk('Daily', false));
      foot.append(t);
    }
    const n = el('div', 'og-card og-keycard', el('div', 'og-metrics', ...blocks), graph, foot);
    n.style.setProperty('--bh', bh + 'px');
    if (opts.color) n.style.setProperty('--ac', opts.color);
    if (opts.fill) n.style.setProperty('--acf', opts.fill);
    return { node: n, start: () => pick(0) };
  }

  function driverCard(d) {
    if (!d) return null;
    let bar = null;
    if (d.metric) {
      const { value, low, high, typical } = d.metric;
      // Bar geometry from the old page: 197px below usual, 262px usual, 197px above; bounds at 202 and 464.
      const off = (v) => 197 * Math.min(1, v / (typical || high));
      const x = value < low ? 202 - off(low - value) : value > high ? 464 + off(value - high) : 202 + 262 * ((value - low) / (high - low || 1));
      const point = el('div', 'og-range-point');
      point.style.left = x - 7 + 'px';
      const label = el('div', 'og-range-label', icon('down', 24, 'og-trend', value > high),
        el('div', null, el('div', 'og-range-title', d.metric.title), el('div', 'og-range-sub', d.metric.subtitle)));
      label.style.left = Math.max(0, Math.min(x - 27, 362)) + 'px';
      bar = el('div', 'og-range', label,
        el('div', 'og-range-bar', el('div', 'og-range-lo'), el('div', 'og-range-mid'), el('div', 'og-range-hi')), point,
        el('div', 'og-range-bounds', el('span', null, compact(low)), el('span', null, compact(high))));
    }
    return el('div', 'og-driver', el('h2', 'og-h18', d.title), el('div', 'og-driver-sub', d.subtitle), bar,
      ...d.rows.map((r) => {
        let link = null;
        if (r.link) { link = el('a', 'og-driver-link', r.link); link.target = '_blank'; link.rel = 'noopener'; if (/^https:/.test(r.url)) link.href = r.url; }
        return el('div', 'og-driver-row', icon('cap', 24, 'og-cap'), el('div', null, el('p', null, r.text), link));
      }));
  }

  const thumb = (v, cls) => { const i = el('img', cls); if (v.thumb) i.src = v.thumb; i.alt = ''; return i; };

  function topTable(rows, ctx) {
    if (!rows.length) return null;
    const head = el('div', 'og-row og-row-head', el('div', 'og-c-title', 'Content'),
      el('div', 'og-c-num', el('span', 'og-wrap2', 'Average view duration')), el('div', 'og-c-views og-strong', 'Views'));
    const body = rows.map((r, i) => el('div', 'og-row',
      el('div', 'og-c-title', el('div', 'og-rank', String(i + 1)), thumb(r, 'og-thumb'),
        el('div', 'og-t', el('div', 'og-t-name', r.title), r.published ? el('div', 'og-t-date', day(r.published)) : null)),
      el('div', 'og-c-num', r.avgMs == null ? '' : clock(r.avgMs), r.avgPct == null ? null : el('span', 'og-pct', `(${r.avgPct.toFixed(1)}%)`)),
      el('div', 'og-c-views', r.views == null ? '' : int(r.views))));
    return el('div', 'og-top', el('div', 'og-startline'), el('h2', 'og-h18 og-top-title', 'Your top content in this period'),
      el('div', 'og-top-table', head, ...body), el('div', 'og-top-foot', button('See more', () => ctx.explore('top'))));
  }

  function realtimeCard(rt, ctx) {
    if (!rt) return null;
    const max = Math.max(...rt.hours, 1);
    const bars = el('div', 'og-bars', ...rt.hours.map((v) => { const b = el('i'); b.style.height = (v / max) * 100 + '%'; return b; }));
    return el('div', 'og-card og-rt',
      el('h2', 'og-h18', 'Realtime'),
      el('div', 'og-live', el('span', 'og-pulse'), el('span', 'og-sub', 'Updating live')),
      rt.subs == null ? null : el('div', 'og-sec',
        el('div', 'og-big', int(rt.subs)), el('div', 'og-sub', 'Subscribers'), button('See live count', () => ctx.explore('live'), 'og-rt-btn')),
      el('div', 'og-sec', el('div', 'og-big', int(rt.views48)), el('div', 'og-sub', 'Views · Last 48 hours')),
      el('div', 'og-rt-chart', bars, el('div', 'og-barlabels', el('span', null, '-48h'), el('span', null, 'Now'))),
      rt.top.length ? el('div', 'og-rt-top', el('div', 'og-rt-head', el('span', null, 'Top content'), el('span', null, 'Views')),
        ...rt.top.map((v) => el('div', 'og-rt-row', thumb(v, 'og-rt-thumb'), el('span', 'og-rt-name', v.title), el('span', 'og-rt-val', v.views == null ? '' : int(v.views))))) : null,
      el('div', 'og-rt-foot', button('See more', () => ctx.explore('latest'))));
  }

  const ROWS = {
    EXTERNAL_VIEWS: ['Views', (v) => compact(v)],
    VIDEO_THUMBNAIL_IMPRESSIONS_VTR: ['Thumbnail click-through rate', (v) => (v * 100).toFixed(1) + '%'],
    AVERAGE_WATCH_TIME: ['Average view duration', (v) => clock(v)],
  };
  const age = (ms) => {
    const h = Math.max(0, Math.floor((Date.now() - ms) / 3.6e6)), d = Math.floor(h / 24);
    return `First ${d ? `${d} days ` : ''}${h % 24} hours`;
  };
  function latestCard(v, ctx) {
    if (!v) return null;
    const trend = (t) => (t === 'TREND_TYPE_DOWN' ? icon('down', 18, 'og-trend') : t === 'TREND_TYPE_UP' ? icon('down', 18, 'og-trend', true) : t === 'TREND_TYPE_TYPICAL' ? icon('check', 18, 'og-good') : el('span', 'og-noicon'));
    return el('div', 'og-card og-latest',
      el('div', 'og-latest-head', 'Latest content'),
      el('div', 'og-latest-thumb', thumb({ thumb: v.thumb43 || v.thumb }, 'og-latest-img'), el('div', 'og-latest-name', v.title)),
      v.published ? el('div', 'og-latest-age', age(v.published)) : null,
      ...v.rows.filter((r) => ROWS[r.type] && r.value != null).map((r) => el('div', 'og-kv', el('span', null, ROWS[r.type][0]),
        el('span', 'og-kv-v', ROWS[r.type][1](r.value), trend(r.trend)))),
      el('div', 'og-latest-foot', button('See video analytics', () => ctx.video(v.id))));
  }

  // Old custom range dialog: two dates on top, scrolling months, Cancel and Apply.
  function dateDialog(start, end, onApply, onClose) {
    const iso = (d) => d.getFullYear() * 1e4 + (d.getMonth() + 1) * 100 + d.getDate();
    let a = start, z = end, next = 'a';
    const box = el('div', 'og-dlg');
    const ia = el('div', 'og-dlg-in'), iz = el('div', 'og-dlg-in'), count = el('div', 'og-dlg-n');
    const cells = [];
    const paint = () => {
      ia.textContent = day(a); iz.textContent = day(z);
      const days = Math.round((z - a) / 864e5) + 1;
      count.textContent = `${days} day${days > 1 ? 's' : ''} selected`;
      for (const [c, t] of cells) {
        c.classList.toggle('og-in', t >= +a && t <= +z);
        c.classList.toggle('og-end', t === +a || t === +z);
      }
    };
    const scroll = el('div', 'og-dlg-sc');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let k = 119; k >= 0; k--) {
      const f = new Date(today.getFullYear(), today.getMonth() - k, 1);
      const grid = el('div', 'og-dlg-m');
      const head = el('div', 'og-dlg-mh', f.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase());
      head.style.gridColumn = `1 / ${Math.max(f.getDay(), 3) + 1}`;
      grid.append(head);
      const count0 = new Date(f.getFullYear(), f.getMonth() + 1, 0).getDate();
      for (let d = 1; d <= count0; d++) {
        const date = new Date(f.getFullYear(), f.getMonth(), d);
        const c = el('button', 'og-dlg-d', String(d));
        c.type = 'button'; c.style.gridColumn = String(date.getDay() + 1);
        if (date > today) c.disabled = true;
        c.onclick = () => {
          if (next === 'a') { a = date; z = date; next = 'z'; } else { if (date < a) { z = a; a = date; } else z = date; next = 'a'; }
          paint();
        };
        cells.push([c, +date]);
        grid.append(c);
      }
      scroll.append(grid);
    }
    const apply = el('button', 'og-dlg-b', 'Apply'), cancel = el('button', 'og-dlg-b', 'Cancel');
    apply.type = cancel.type = 'button';
    apply.onclick = () => { const e = new Date(z); e.setDate(e.getDate() + 1); onApply(`custom:${iso(a)},${iso(e)}`); onClose(); };
    cancel.onclick = onClose;
    box.onclick = (e) => e.stopPropagation();
    box.append(el('div', 'og-dlg-top', ia, el('span', null, '–'), iz), count,
      el('div', 'og-dlg-w', ...['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((x) => el('span', null, x))), scroll, el('div', 'og-dlg-foot', cancel, apply));
    paint();
    box.show = () => { const t = cells.find(([, v]) => v === +a); if (t) scroll.scrollTop = t[0].parentElement.offsetTop - scroll.offsetTop; };
    return box;
  }

  function periodPicker(PERIODS, cur, range, onPick, seriesEnds) {
    const list = el('div', 'og-menu');
    list.hidden = true;
    const wrap = el('div', 'og-period-wrap');
    for (const k in PERIODS) {
      const b = el('button', k === cur ? 'og-on' : '', PERIODS[k].label);
      b.type = 'button';
      b.onclick = () => { list.hidden = true; onPick(k); };
      list.append(b);
      if (PERIODS[k].gap) list.append(el('hr'));
    }
    const custom = el('button', String(cur).startsWith('custom:') ? 'og-on' : '', 'Custom');
    custom.type = 'button';
    custom.onclick = (e) => {
      e.stopPropagation();
      list.hidden = true;
      const mid = (ms) => { const x = new Date(ms); x.setHours(0, 0, 0, 0); return x; };
      const d = dateDialog(mid(seriesEnds?.[0] ?? Date.now() - 27 * 864e5), mid(seriesEnds?.[1] ?? Date.now()), onPick, () => d.remove());
      wrap.append(d);
      d.show();
    };
    list.append(custom);
    const name = String(cur).startsWith('custom:') ? 'Custom' : PERIODS[cur].label;
    const btn = el('button', 'og-period', el('span', 'og-period-range', range), el('span', 'og-period-now', name), icon('caret', 24, 'og-caret'));
    btn.type = 'button';
    btn.onclick = (e) => { e.stopPropagation(); list.hidden = !list.hidden; };
    document.addEventListener('click', () => { list.hidden = true; wrap.querySelector('.og-dlg')?.remove(); });
    wrap.append(btn, list);
    return wrap;
  }

  // "Oct 8 – Nov 4, 2026" or "Oct 12 – 20, 2026" when both dates share a month.
  function rangeText(a, b) {
    const A = new Date(a), B = new Date(b);
    const same = A.getMonth() === B.getMonth() && A.getFullYear() === B.getFullYear();
    return same ? `${day(a, false)} – ${B.getDate()}, ${B.getFullYear()}` : `${day(a, A.getFullYear() !== B.getFullYear())} – ${day(b)}`;
  }

  function analysesCard(a) {
    if (!a) return null;
    const bar = (d) => {
      const fmt = d.type === 'TOTAL_ESTIMATED_EARNINGS' ? (v) => money(v / 1000) : compact;
      return el('div', 'og-an-m', el('div', 'og-an-t', d.title, ' ', el('b', null, fmt(d.value))),
        d.low != null ? el('div', 'og-sub2', `Usual range ${fmt(d.low)}–${fmt(d.high)}`) : null);
    };
    return el('div', 'og-an', el('h2', 'og-h18 og-an-h', a.title), ...a.items.map((x) => {
      const more = el('div', 'og-an-more', ...x.data.map(bar));
      more.hidden = true;
      const chev = el('button', 'og-an-chev', icon('caret', 24));
      chev.type = 'button';
      chev.onclick = () => { more.hidden = !more.hidden; chev.classList.toggle('og-on', !more.hidden); };
      return el('div', 'og-an-c', icon('down', 18, 'og-an-ic'), chev, el('div', 'og-an-title', x.title),
        el('div', 'og-an-body', icon('spark', 18, 'og-an-sp'), el('div', 'og-an-i', x.insight)),
        ...(x.subs || []).map((t) => el('div', 'og-an-i og-an-sub', t)), more);
    }));
  }

  const CHIPS = ['How did viewers find my content?', 'How many new viewers did I reach?', 'Summarize my latest video performance'];

  function shell(root, s, body) {
    const { periodKey, PERIODS, onPeriod, onTab, range, active, monetized, onAsk, advanced, ends } = s;
    const names = ['Overview', 'Content', 'Audience', ...(monetized ? ['Revenue'] : []), 'Trends'];
    const tabs = names.map((t) => {
      const b = el('button', t === active ? 'og-tab og-on' : 'og-tab', t);
      b.type = 'button';
      if (t !== active) b.onclick = () => onTab(t);
      return b;
    });
    root.replaceChildren(
      el('div', 'og-head', el('h1', 'og-h1', 'Channel analytics'), active === 'Trends' ? null : button('Advanced mode', advanced, 'og-adv')),
      el('div', 'og-chips', ...CHIPS.map((c) => { const b = button(c, onAsk); b.prepend(icon('spark', 24)); return b; }), (() => { const m = el('button', 'og-more', icon('more', 24)); m.type = 'button'; m.onclick = onAsk; return m; })()),
      el('div', 'og-sticky', el('div', 'og-tabs', ...tabs), active === 'Trends' ? null : periodPicker(PERIODS, periodKey, range, onPeriod, ends)),
      body);
  }

  function renderOverview(root, s) {
    const { data, periodKey } = s;
    const period = window.OGData.periodOf(periodKey);
    const pts = data.metrics[0].series;
    const range = pts.length ? rangeText(pts[0].x, pts[pts.length - 1].x) : '';
    // Years and months compare against the same number of days just before them.
    let prevRange = '';
    if (pts.length > 1 && !period.days) {
      const start = pts[0].x;
      const b = start - 864e5, a0 = new Date(start); a0.setDate(a0.getDate() - pts.length);
      prevRange = rangeText(+a0, b);
    }
    const key = keyCard(data, period, s, { prevRange, more: () => s.explore('key') });
    shell(root, { ...s, range, active: 'Overview', monetized: data.monetized, ends: pts.length ? [pts[0].x, pts[pts.length - 1].x] : null },
      el('div', 'og-cols',
        el('div', 'og-main',
          data.hint ? el('div', 'og-hint', data.hint) : null,
          data.title ? el('h2', 'og-title', data.title) : null,
          data.subtitle ? el('div', 'og-subtitle', data.subtitle) : null,
          key.node, driverCard(data.driver), analysesCard(data.analyses), topTable(data.top, s)),
        el('div', 'og-rail', realtimeCard(data.realtime, s), latestCard(data.latest, s))));
    key.start();
  }

  window.OGUI = { render: renderOverview, realtimeCard, rangeText, el, svg, icon, button, thumb, keyCard, shell, compact, int, money, clock, day, hours };
})();
