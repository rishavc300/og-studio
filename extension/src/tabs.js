// OG Studio: Content, Audience, Revenue and Trends. Card titles are not in Studio's data, so they are mapped here.
(() => {
  const D = () => window.OGData;
  const U = () => window.OGUI;
  const COLORS = { Content: ['rgb(91,84,213)', 'rgba(91,84,213,.1)'], Revenue: ['rgb(0,180,162)', 'rgba(0,180,162,.1)'], Audience: ['rgb(145,47,192)', 'rgba(145,47,192,.1)'] };
  const STACK = ['rgb(45,6,70)', 'rgb(127,53,177)', 'rgb(191,116,241)', 'rgb(202,47,127)'];
  const TRAFFIC = {
    SUBSCRIBER: 'Browse features', YT_RELATED: 'Suggested videos', YT_SEARCH: 'YouTube search', UNKNOWN_MOBILE_OR_DIRECT: 'Direct or unknown',
    YT_OTHER_PAGE: 'Other YouTube features', EXT_URL: 'External', PLAYLIST: 'Playlists', NOTIFICATION: 'Notifications', END_SCREEN: 'End screens',
    YT_CHANNEL: 'Channel pages', SHORTS: 'Shorts feed', NO_LINK_OTHER: 'Direct or unknown',
  };
  const CTYPE = { VIDEO_ON_DEMAND: 'Videos', SHORTS: 'Shorts', LIVE_STREAM: 'Live', POST: 'Posts' };
  const SUBSTATE = { SUBSCRIBED: 'Subscribed', NOT_SUBSCRIBED: 'Not subscribed' };
  const DEVICE = { TV: 'TV', MOBILE: 'Mobile phone', DESKTOP: 'Computer', TABLET: 'Tablet', GAME_CONSOLE: 'Game console' };
  const AD = { AUCTION_TRUEVIEW_INSTREAM: 'Skippable video ads (Auction)', AUCTION_INSTREAM: 'Non-skippable video ads (Auction)', AUCTION_BUMPER_INSTREAM: 'Bumper ads (Auction)', AUCTION_DISPLAY: 'Display ads (Auction)', RESERVED_INSTREAM: 'Non-skippable video ads (Reserved)' };
  const region = new Intl.DisplayNames(['en'], { type: 'region' });
  const lang = new Intl.DisplayNames(['en'], { type: 'language' });
  const safe = (fn, v, f) => { try { return fn(v) || f; } catch { return f; } };

  function label(type, v, now) {
    switch (type) {
      case 'TRAFFIC_SOURCE_TYPE': return TRAFFIC[v] || v;
      case 'CREATOR_CONTENT_TYPE': return CTYPE[v] || v;
      case 'SUBSCRIBED_TO_UPLOADER_STATE': return SUBSTATE[v] || v;
      case 'DEVICE_PLATFORM_TYPE': return DEVICE[v] || v;
      case 'COUNTRY': return safe((x) => region.of(x), v, v);
      case 'ADTYPES': return AD[v] || v;
      case 'EARNINGS_SOURCE_ALL': return { ADS: 'Watch Page ads', YOUTUBE_RED: 'YouTube Premium' }[v] || v;
      case 'EARNINGS_SOURCE_GROUPED': return { WATCH_PAGE_ADS: 'Watch Page ads', SHORTS_FEED_ADS: 'Shorts Feed ads' }[v] || v;
      case 'CAPTION_LANGUAGE': {
        if (!v) return 'No subtitles/CC';
        const auto = v.endsWith('#');
        const n = safe((x) => lang.of(x), v.replace('#', ''), v);
        return auto ? `${n} (auto-translated)` : n;
      }
      case 'MONTH': {
        const y = +String(v).slice(0, 4), m = +String(v).slice(4, 6) - 1;
        const name = new Date(y, m, 1).toLocaleDateString('en-US', { month: 'long' });
        return now.getFullYear() === y && now.getMonth() === m ? `${name} (ongoing)` : name;
      }
      default: return String(v);
    }
  }
  const FMT = {
    EXTERNAL_VIEWS: (v) => U().compact(v), RECENT_VIEWERS: (v) => U().compact(v), FREQUENT_VIEWERS: (v) => U().compact(v),
    SUBSCRIBERS_NET_CHANGE: (v) => (v > 0 ? '+' : '') + U().compact(v), TOTAL_ESTIMATED_EARNINGS: (v) => (v ? U().money(v / 1000) : '$0'), AD_GROSS_REVENUE: (v) => U().money(v / 1000),
    EXTERNAL_WATCH_TIME: (v) => U().compact(U().hours(v)), VIDEO_COUNT_FIRST_PUBLISHED: (v) => U().int(v),
    APPROVED_REVENUE: (v) => (v ? U().money(v / 1000) : '$0'), SHOPPING_ESTIMATED_EARNINGS: (v) => (v ? U().money(v / 1000) : '$0'),
  };

  function card(title, sub, body, foot, cls) {
    const { el } = U();
    const clocked = /earning|Content performance|make money|ads revenue|Membership revenue/i.test(title || '');
    return el('div', 'og-c' + (cls ? ' ' + cls : ''), el('div', 'og-c-h', title, clocked ? U().icon('clock', 18, 'og-h-clock') : null), sub ? el('span', 'og-c-s', sub) : el('div', 'og-c-nosub'), ...[].concat(body), foot || null);
  }
  const note = (text, cls) => { const { el } = U(); const a = el('a', 'og-link', 'Learn more'); a.href = 'https://support.google.com/youtube/'; a.target = '_blank'; a.rel = 'noopener'; return el('div', 'og-tabnote ' + (cls || ''), el('span', null, text, ' '), a); };
  const seeMore = (s, c) => U().el('div', 'og-c-foot', U().button('See more', () => s.explore('card', c)));
  const empty = (t) => U().el('div', 'og-empty', t);

  function chipRow(items, cur, onPick, cls) {
    const { el } = U();
    return el('div', cls || 'og-chips2', ...items.map(([k, t]) => {
      const b = el('button', k === cur ? 'og-chip og-on' : 'og-chip', t);
      b.type = 'button';
      if (onPick) b.onclick = () => onPick(k);
      return b;
    }));
  }

  // rows: [{label, value, text, thumb, extra, grey}]
  function barRows(rows, barMax = 154) {
    const { el } = U();
    const max = Math.max(...rows.filter((r) => !r.grey).map((r) => Math.abs(r.value)), 1e-9);
    return rows.map((r) => {
      const bar = el('div', 'og-bar' + (r.grey ? ' og-grey' : ''));
      bar.style.width = Math.max((Math.abs(r.value) / max) * barMax, 8) + 'px';
      if (!r.value) bar.style.visibility = 'hidden';
      const val = el('div', 'og-val', r.text, r.extra ? el('small', null, r.extra) : null);
      return el('div', 'og-trow', el('div', 'og-trow-l', r.thumb !== undefined ? U().thumb({ thumb: r.thumb }, 'og-trow-th') : null, el('div', 'og-trow-t', r.label)),
        el('div', 'og-trow-r', bar, val));
    });
  }

  function rowsFrom(c, t, opts = {}) {
    const { tableRows, entityMaps } = D();
    const now = new Date();
    const type = t?.dimensionColumns?.[0]?.dimension?.type;
    const mtype = t?.metricColumns?.[0]?.metric?.type;
    const asPct = !!t?.metricColumns?.[0]?.metric?.asPercentagesOfTotal;
    const ent = entityMaps(c);
    let rows = tableRows(t).filter((r) => r.values[0] != null);
    const total = opts.pctOfTotal ? rows.reduce((a, r) => a + r.values[0], 0) : 0;
    rows = rows.map((r) => {
      const v = r.values[0];
      const vid = type === 'VIDEO' ? ent.videos[r.dim] : null;
      const base = { label: vid ? vid.title : label(type, r.dim, now), value: v };
      if (vid) base.thumb = vid.thumb;
      if (asPct) { base.value = v; base.text = v.toFixed(1) + '%'; } else if (opts.pctOfTotal) { const p = (v / (total || 1)) * 100; base.value = p; base.text = p.toFixed(1) + '%'; } else base.text = (FMT[mtype] || U().compact)(v);
      return base;
    });
    if (opts.share) { const sum = rows.reduce((a, r) => a + r.value, 0) || 1; rows = rows.map((r) => ({ ...r, extra: `(${Math.round((r.value / sum) * 100)}%)` })); }
    if (opts.max) rows = rows.slice(0, opts.max);
    return rows;
  }

  function table(c, title, sub, s, opts = {}) {
    const rows = rowsFrom(c, D().tableOf(c), opts);
    return card(title, sub, rows.length ? barRows(rows, opts.barMax) : empty(opts.empty || 'Nothing to show for these dates'), seeMore(s, c));
  }

  function trafficCard(c, sub, s) {
    const { el, svg } = U();
    let rows = rowsFrom(c, D().tableOf(c), { pctOfTotal: true });
    const top = rows.slice(0, 5), rest = rows.slice(5).reduce((a, r) => a + r.value, 0);
    if (!rows.length) return card('How viewers find your content', sub, empty('Nothing to show for these dates'), seeMore(s, c));
    const list = rest > 0 ? [...top, { label: 'Others', value: rest, text: rest.toFixed(1) + '%', grey: true }] : top;
    const W = 554, R = 70, r0 = 50, cx = W / 2, cy = 70, s0 = svg('svg', { width: W, height: 140, class: 'og-svg' });
    let a0 = -Math.PI / 2;
    const alpha = [1, .8, .6, .4, .2];
    list.forEach((x, i) => {
      const a1 = a0 + (x.value / 100) * Math.PI * 2, big = a1 - a0 > Math.PI ? 1 : 0;
      const p = (rad, a) => `${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`;
      const seg = svg('path', { d: `M${p(R, a0)}A${R},${R},0,${big},1,${p(R, a1)}L${p(r0, a1)}A${r0},${r0},0,${big},0,${p(r0, a0)}Z`, class: 'og-seg' });
      seg.style.fill = x.grey ? 'rgba(0,0,0,.1)' : `rgba(91,84,213,${alpha[i]})`;
      s0.append(seg); a0 = a1;
    });
    return card('How viewers find your content', sub, [el('div', 'og-donut', s0, el('div', 'og-donut-c', 'Traffic Sources')), ...barRows(list)], seeMore(s, c));
  }

  const SRC = [[0, 'Overall'], [1, 'External'], [2, 'YouTube search'], [3, 'Suggested videos'], [4, 'Playlists']];
  function carousel(c, title, sub, s) {
    const { el } = U();
    const data = c.tableCarouselCardData;
    const tables = data?.tableCards || [];
    const host = el('div');
    const show = (i) => {
      const t = tables[i]?.mainTableData;
      const type = t?.dimensionColumns?.[0]?.dimension?.type;
      let rows = rowsFrom(c, t, { max: 5 });
      if (type === 'TRAFFIC_SOURCE_DETAIL') rows = rows.map((r) => ({ ...r, label: String(r.label).replace(/^[A-Z_]+\./, '') }));
      if (i === 0 && rows.length) {
        const sum = rows.reduce((a, r) => a + r.value, 0);
        if (sum > 0 && sum < 99.95) rows = [...rows, { label: 'Others', value: 100 - sum, text: (100 - sum).toFixed(1) + '%', grey: true }];
      }
      const chips = chipRow(SRC, i, show, 'og-chips2 og-c-chips');
      [...chips.children].forEach((b, k) => { if (!D().tableRows(tables[k]?.mainTableData).length) { b.disabled = true; b.classList.add('og-off'); } });
      host.replaceChildren(chips, ...(rows.length ? barRows(rows) : [empty('Nothing to show for these dates')]));
    };
    show(0);
    return card(title, sub, host, seeMore(s, c));
  }

  function stacked(c, title, sub, s) {
    const { el } = U();
    const o = c.stackedBarCardData?.overviewCardData;
    const v = o?.values;
    if (!v?.length) return card(title, sub, empty('Not enough data to show this report.'));
    const names = ['New viewers', 'Casual viewers', 'Regular viewers'];
    const sum = v.reduce((a, b) => a + b, 0) || 1;
    return card(title, sub, [
      el('div', 'og-stack', ...v.map((x, i) => { const b = el('i'); b.style.flex = String(x / sum); b.style.background = STACK[i]; return b; })),
      ...v.map((x, i) => { const dot = el('i'); dot.style.background = STACK[i]; return el('div', 'og-legend', dot, el('span', null, names[i]), el('b', null, ((x / sum) * 100).toFixed(1) + '%')); }),
    ], seeMore(s, c));
  }

  function byType(c, title, sub, s, render) {
    const { el } = U();
    const list = c.tableCardByContentTypeCardData?.tables || [];
    const host = el('div');
    const items = list.map((t, i) => [i, { CONTENT_ANALYSIS_TYPE_ALL_CONTENT: 'All', CONTENT_ANALYSIS_TYPE_VIDEO: 'Videos', CONTENT_ANALYSIS_TYPE_SHORTS: 'Shorts' }[t.contentType] || 'All']);
    const show = (i) => {
      const t = list[i]?.tableCard?.mainTableData;
      host.replaceChildren(chipRow(items, i, show, 'og-chips2 og-c-chips'), ...render(t));
    };
    show(0);
    return card(title, sub, host, seeMore(s, c));
  }

  function heat(c, title, sub) {
    const { el } = U();
    const h = c.audienceOnlineCardData?.hourlyUsersOnline;
    if (!h?.length) return card(title, sub, empty('Not enough data to show this report.'));
    // Studio stores this in UTC starting Sunday; rotate to the viewer's own clock.
    const rot = Math.round(new Date().getTimezoneOffset() / 60);
    const hh = h.map((_, i) => h[(((i + rot) % 168) + 168) % 168]);
    const sorted = [...h].sort((a, b) => a - b), lo = sorted[Math.floor(h.length / 3)], hi = sorted[Math.floor((h.length * 2) / 3)];
    const shade = (v) => (v >= hi ? 'rgb(145,47,192)' : v >= lo ? 'rgba(145,47,192,.65)' : 'rgba(145,47,192,.35)');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return card(title, sub, [
      el('div', 'og-heat', el('div', 'og-heat-h', ...['12:00 AM', '6:00 AM', '12:00 PM', '6:00 PM'].map((t) => el('span', null, t))),
        ...days.map((d, i) => el('div', null, el('div', 'og-heat-d', d), el('div', 'og-heat-col', ...hh.slice(i * 24, i * 24 + 24).map((v) => { const b = el('i'); b.style.background = shade(v); return b; }))))),
      note('Publish time is not known to directly affect the long-term performance of a video.', 'og-heat-note'),
    ]);
  }

  function funnel(c, title, s, range) {
    const { el, compact, clock, hours } = U();
    const col = (name) => { const m = c.funnelCardData?.totalData?.metricColumns?.find((x) => x.metric?.type === name); return D().colValues(m)[0]; };
    const imp = col('VIDEO_THUMBNAIL_IMPRESSIONS'), f = c.funnelCardData;
    if (imp == null) return card(title, null, empty('Not enough data to show this report.'));
    const home = D().colValues(f.homePageTrafficData?.metricColumns?.[0])[0] || 0, watch = D().colValues(f.watchPageTrafficData?.metricColumns?.[0])[0] || 0;
    const rec = imp ? ((home + watch) / imp) * 100 : 0;
    const a = el('i'), b = el('i');
    a.style.flex = String(rec); a.style.background = 'rgb(91,84,213)'; b.style.flex = String(100 - rec); b.style.background = 'rgb(144,144,144)';
    const at = (top, n) => { n.style.top = top + 'px'; return n; };
    return card(title, `Data available ${range}`, el('div', 'og-funnel',
      at(14, el('div', null, 'Thumbnail impressions')), at(31, el('div', 'og-f-big', compact(imp))), at(85, el('div', 'og-f-bar', a, b)),
      at(81, el('div', 'og-sub2', `${rec.toFixed(1)}% from YouTube recommending your content`)),
      at(135, el('div', 'og-sub2', `${(col('VIDEO_THUMBNAIL_IMPRESSIONS_VTR') || 0).toFixed(1)}% Thumbnail click-through rate`)),
      at(187, el('div', null, 'Engaged views from impressions')), at(204, el('div', 'og-f-big', compact(col('VIDEO_THUMBNAIL_IMPRESSED_VIEWS') || 0))),
      at(271, el('div', 'og-sub2', `${clock(col('AVERAGE_WATCH_TIME_FROM_VIDEO_THUMBNAIL_IMPRESSIONS') || 0)} average view duration`)),
      at(323, el('div', null, 'Watch time from impressions')), at(343, el('div', 'og-f-big', compact(hours(col('VIDEO_THUMBNAIL_IMPRESSED_WATCH_TIME') || 0))))));
  }

  function demographics(c, title, sub, s) {
    const { el } = U();
    const t = c.demographicsByContentTypeCardData?.tables?.[0]?.tableData;
    if (!t) return card(title, sub, empty('Not enough data to show this report.'));
    const ages = D().colValues(t.dimensionColumns[0]), gens = D().colValues(t.dimensionColumns[1]), vals = D().colValues(t.metricColumns[0]);
    const sum = (arr, k) => arr.reduce((a, x, i) => (x === k ? a + vals[i] : a), 0);
    const scale = vals.reduce((a, b) => a + b, 0) > 2 ? 1 : 100;
    const row = (l, v) => ({ label: l, value: v * scale, text: v * scale >= 0.05 ? (v * scale).toFixed(1) + '%' : '0%' });
    const g = [['Female', 'FEMALE'], ['Male', 'MALE'], ['User-specified', 'GENDER_USER_SPECIFIED']].map(([l, k]) => row(l, sum(gens, k)));
    const a = [['13–17 years', 'AGE_13_17'], ['18–24 years', 'AGE_18_24'], ['25–34 years', 'AGE_25_34'], ['35–44 years', 'AGE_35_44'], ['45–54 years', 'AGE_45_54'], ['55–64 years', 'AGE_55_64'], ['65+ years', 'AGE_65_']].map(([l, k]) => row(l, sum(ages, k)));
    return card(title, sub, el('div', 'og-demo', ...barRows(g, 120), el('div', 'og-spacer33'), ...barRows(a, 120),
      note('Viewer age is based on the age declared during account creation and includes an age estimation model to determine if a user is over or under the age of 18.', 'og-demo-note')), seeMore(s, c));
  }

  function multiTable(c, title, sub, s) {
    const { el, compact } = U();
    const list = c.multiTableCardData?.singleTableData || [];
    const ent = D().entityMaps(c).videos;
    const host = el('div');
    const items = [[0, 'New'], [1, 'Casual'], [2, 'Regular']];
    const show = (i) => {
      const rows = (list[i]?.rowData || []).map((r) => ({ label: ent[r.dimensionValue]?.title || '', thumb: ent[r.dimensionValue]?.thumb || '', value: r.metricValue?.[0] || 0, text: compact(r.metricValue?.[0] || 0) }));
      host.replaceChildren(chipRow(items, i, show, 'og-chips2 og-c-chips'), ...(rows.length ? barRows(rows) : [empty('Nothing to show for these dates')]));
    };
    show(0);
    return card(title, sub, host, seeMore(s, c));
  }

  function channels(c, title, sub) {
    const { el, thumb } = U();
    const ids = c.channelCompetitionCardData?.externalChannelIds || [];
    const ch = D().entityMaps(c).channels;
    if (!ids.length) return card(title, sub, empty('Not enough data to show this report.'));
    return card(title, sub, ids.map((id) => el('div', 'og-chan', thumb({ thumb: ch[id]?.thumb }, 'og-chan-img'),
      el('div', null, el('div', 'og-chan-n', ch[id]?.title || ''), ch[id]?.subs != null ? el('div', 'og-chan-s', `${U().compact(ch[id].subs)} subscribers`) : null))).concat(el('div', 'og-pager', '1/1')));
  }

  function revenuePerf(c, title, sub, s) {
    const { el, money, compact } = U();
    const entries = c.revenuePerformanceByContentTypeCardData?.entries || [];
    const host = el('div');
    const names = (e) => (e.contentType?.includes('SHORTS') ? 'Shorts' : 'Videos');
    const show = (i) => {
      const e = entries[i];
      if (!e) return host.replaceChildren(empty('Nothing to show for these dates'));
      const rows = rowsFrom(c, e.tableCardData?.mainTableData, { max: 5 });
      host.replaceChildren(chipRow(entries.map((x, k) => [k, names(x)]), i, show, 'og-chips2 og-c-chips'),
        el('div', 'og-perf', el('div', 'og-perf-big', money(e.revenue / 1000)), el('div', 'og-sub2', 'Estimated revenue'),
          el('div', 'og-perf-row', el('div', null, el('div', 'og-perf-n', compact(e.views)), el('div', 'og-sub2', 'Engaged views')),
            el('div', null, el('div', 'og-perf-n', money(e.rpm / 1000)), el('div', 'og-sub2', 'Revenue per 1K engaged views (RPM)')))),
        ...barRows(rows, 151));
    };
    show(0);
    return card(title, sub, host, seeMore(s, c));
  }

  const tz = () => { const m = -new Date().getTimezoneOffset(), a = Math.abs(m); return `${m < 0 ? '-' : '+'}${String(Math.floor(a / 60)).padStart(2, '0')}${String(a % 60).padStart(2, '0')}`; };
  function bell(c) {
    const { el, compact } = U();
    const t = c.belledSubscribersCardData?.resultTable;
    if (!t) return card('Subscriber bell notifications', 'Percent of total subscribers · Current', empty('Not enough data to show this report.'));
    const st = D().colValues(t.dimensionColumns[0]), re = D().colValues(t.dimensionColumns[1]), v = D().colValues(t.metricColumns[0]);
    const total = v.reduce((a, b) => a + b, 0) || 1;
    const on = v.reduce((a, x, i) => (st[i] === 'BELL_ENABLED' ? a + x : a), 0);
    const reach = v.reduce((a, x, i) => (st[i] === 'BELL_ENABLED' && re[i] === 'REACHABLE' ? a + x : a), 0);
    const row = (a, b, x) => el('div', 'og-bell', el('div', null, el('div', null, a), el('div', 'og-sub2', b)),
      el('div', 'og-bell-v', ((x / total) * 100).toFixed(1) + '%', el('small', null, `(${compact(x)})`)));
    return card('Subscriber bell notifications', 'Percent of total subscribers · Current', [
      row('Subscribers who turned on "All notifications" for your channel', 'Typical on YouTube: 10% - 30%', on),
      row('Subscribers who turned on "All notifications" for your channel and enabled notifications', 'Typical on YouTube: 5% - 20%', reach),
      note("Notifications can't reach subscribers who disabled notifications on the YouTube app or signed out.", 'og-bell-note'),
    ]);
  }

  function formats(c, P) {
    const { el } = U();
    const names = { VIDEO_ON_DEMAND: 'Videos', SHORTS: 'Shorts', LIVE_STREAM: 'Live' };
    const list = c.formatsAudienceWatchOnYtCardData?.formatAudienceData || [];
    if (!list.length) return null;
    return card('Formats your viewers watch on YouTube', P, list.map((x) => {
      const k = x.contentType.replace('CREATOR_CONTENT_TYPE_', '');
      const segs = Array.from({ length: 5 }, (_, i) => { const b = el('i'); if (i < x.interestLevel) b.className = 'og-on'; return b; });
      return el('div', 'og-fmt', el('div', null, names[k] || k), el('div', 'og-fmt-bar', ...segs),
        el('div', 'og-fmt-l', el('span', null, 'Nobody watches'), el('span', null, 'Everybody watches')));
    }));
  }

  function retention(c) {
    const { el, svg, thumb, clock } = U();
    const list = c.audienceRetentionHighlightsCardData?.videosData || [];
    const ent = D().entityMaps(c).videos;
    if (!list.length) return null;
    const host = el('div', 'og-ret-b');
    const chips = chipRow([[0, 'Intro'], [1, 'Top moments'], [2, 'Spikes'], [3, 'Dips']], 0, null, 'og-chips2 og-ret-chips');
    const show = (v) => {
      const e = ent[v.videoId] || {}, len = (e.lengthSeconds || 0) * 1000;
      const h = v.highlights?.[0], pts = v.retentionValues || [];
      const W = 478, H = 116, s0 = svg('svg', { width: 520, height: 150, class: 'og-svg' });
      [100, 66, 33, 0].forEach((p) => {
        const y = H - (p / 100) * H + 4;
        s0.append(svg('line', { x1: 0, x2: W, y1: y, y2: y, class: 'og-grid' }));
        const tx = svg('text', { x: W + 8, y: y + 4, class: 'og-axis' }); tx.textContent = p + '%'; s0.append(tx);
      });
      s0.append(svg('path', { d: pts.map((y, i) => `${i ? 'L' : 'M'}${(i / (pts.length - 1 || 1)) * W},${H - Math.min(y, 100) / 100 * H + 4}`).join(''), class: 'og-line og-line-tc' }));
      [[0, 'start', 0], [W / 2, 'middle', len / 2], [W, 'end', len]].forEach(([x, an, ms]) => { const tx = svg('text', { x, y: H + 26, class: 'og-axis', 'text-anchor': an }); tx.textContent = clock(ms); s0.append(tx); });
      const player = el('a', 'og-ret-player', thumb({ thumb: e.thumb43 || e.thumb }, 'og-ret-img'), el('span', 'og-ret-time', `0:00:00 / ${clock(len)}`));
      player.href = `https://youtu.be/${v.videoId}`; player.target = '_blank'; player.rel = 'noopener';
      const dot = (cl) => el('i', cl);
      host.replaceChildren(
        el('div', 'og-ret-l', el('div', 'og-ret-head', el('span', null, 'Content'), el('span', null, `Still watching at ${clock(Math.floor((h?.range?.endSec || 30) / 30) * 30000)}`)),
          ...list.map((x) => { const y = ent[x.videoId] || {}; const hh = x.highlights?.[0];
            return el('div', 'og-ret-row' + (x === v ? ' og-on' : ''), thumb({ thumb: y.thumb }, 'og-trow-th'), el('div', 'og-ret-t', y.title || ''), el('div', 'og-ret-p', hh ? Math.round(hh.score) + '%' : '')); })),
        el('div', 'og-ret-r', player, el('div', 'og-ret-legend', dot('og-d1'), el('span', null, 'This video'), dot('og-d2'), el('span', null, 'Typical retention not available'), el('span', 'og-ret-guide', 'Chart guide')), s0));
    };
    show(list[0]);
    return el('div', 'og-c og-ret', el('div', 'og-ret-top', el('div', null, el('div', 'og-c-h', 'Key moments for audience retention'), el('span', 'og-c-s', 'Latest videos (last 365 days)')), chips), host);
  }

  function posts(c, P, s) {
    const { el, day } = U();
    const list = c.postsEngagementRateCardData?.tables || [];
    const names = { IMAGE: 'Image', POLL: 'Poll', QUIZ: 'Quiz', NONE: 'Text', VIDEO_LINK: 'Video' };
    const info = {};
    for (const p of c.sideEntities?.posts || []) { const e = p.entityData; if (e?.postId) info[e.postId] = e; }
    const host = el('div');
    const items = list.map((t, i) => [i, names[String(t.postType).replace('POST_ATTACHMENT_TYPE_ENUM_', '')] || t.postType]);
    const show = (i) => {
      const rows = list[i]?.rows || [];
      host.replaceChildren(chipRow(items, i, show, 'og-chips2 og-c-chips og-post-chips'), el('div', 'og-post-head', el('span', null, 'Posts'), el('span', null, 'Likes')),
        ...(rows.length ? rows.map((r) => {
          const e = info[r.postId] || {};
          const text = (e.contentText?.runs || []).map((x) => x.text).join('');
          const att = e.attachment?.imagesAttachment; const img = (att?.images?.[0]?.thumbnails || att?.images?.[0]?.image?.thumbnails || [])[0]?.url || JSON.stringify(att || '').match(/https?:[^"]+/)?.[0] || '';
          return el('div', 'og-post', U().thumb({ thumb: img }, 'og-post-img'), el('div', 'og-post-t', el('div', 'og-post-n', text), e.publishTime ? el('div', 'og-t-date', day(+e.publishTime * 1000)) : null), el('div', null, String(r.engagementCount ?? '')));
        }) : [empty('Nothing to show for these dates')]));
    };
    show(0);
    return card('Top posts', P, host, seeMore(s, c));
  }

  function playlists(c, s) {
    const { el, int } = U();
    const t = D().tableOf(c), rows = D().tableRows(t);
    const info = {};
    for (const p of c.sideEntities?.playlists || []) { const e = p.entityData; if (e?.playlistId) info[e.playlistId] = e; }
    const ago = (sec) => { const d = (Date.now() / 1000 - sec) / 86400; if (d >= 365) { const y = Math.floor(d / 365); return `Updated ${y} year${y > 1 ? 's' : ''} ago`; } const m = Math.max(1, Math.floor(d / 30)); return `Updated ${m} month${m > 1 ? 's' : ''} ago`; };
    return el('div', 'og-pl', el('div', 'og-pl-h', 'Top playlists'),
      el('div', 'og-pl-row og-pl-head', el('div', null, 'Playlist'), el('div', 'og-pl-n og-strong', 'Views from playlist'), el('div', 'og-pl-n', 'Total views')),
      ...rows.map((r, i) => {
        const e = info[r.dim] || {};
        const th = e.playlistThumbnail?.thumbnails || [];
        const u = (th.find((x) => x.width >= 300) || th[0] || {}).url;
        const fix = u ? (u.startsWith('//') ? 'https:' + u : u) : '';
        return el('div', 'og-pl-row', el('div', 'og-pl-l', el('div', 'og-rank', String(i + 1)),
          el('div', 'og-pl-th', U().thumb({ thumb: fix }, 'og-pl-img'), el('span', null, e.videosCount != null ? String(e.videosCount) : '')),
          el('div', 'og-t', el('div', 'og-t-name', e.title || ''), e.lastTimeUpdated?.seconds ? el('div', 'og-t-date', ago(+e.lastTimeUpdated.seconds)) : null)),
          el('div', 'og-pl-n', r.values[0] == null ? '—' : int(r.values[0])), el('div', 'og-pl-n', r.values[1] ? int(r.values[1]) : '—'));
      }), el('div', 'og-pl-foot', U().button('See more', s.advanced)));
  }

  // Maps one card to its old look.  // Maps one card to its old look. `P` is the period label like "Last 28 days".
  function render1(c, s, P, range, view, ov) {
    const type = (c.loggingConfig?.cardType || '').replace('ANALYTICS_CARD_CONFIG_TYPE_', '').replace(/_CARD$/, '');
    if (c.isHidden) return null;
    const tc = c.config?.tableCardConfig;
    if (ov && type === 'TABLE') {
      const rows = rowsFrom(c, D().tableOf(c));
      const zero = rows.length && rows.every((r) => !r.value) && tc?.dimension !== 'MONTH';
      if (zero) return card(ov[0], ov[1], empty(ov[2] || 'Nothing to show for these dates'), seeMore(s, c));
      return table(c, ov[0], ov[1], s, { barMax: ov[3] || 146, empty: ov[2] });
    }
    if (ov && type === 'CPM') {
      const v = D().colValues(c.cpmCardData?.cpmData?.metricColumns?.[0])[0];
      return card(ov[0], ov[1], [U().el('div', 'og-cpm', v == null ? '—' : U().money(v / 1000)), U().el('span', 'og-sub2', 'Playback-based cost for every 1K views (CPM)')], seeMore(s), 'og-cpm-c');
    }
    switch (type) {
      case 'TABLE': {
        const m = tc?.metrics?.[0], d = tc?.dimension;
        if (d === 'CREATOR_CONTENT_TYPE') {
          const t = { RECENT_VIEWERS: 'New viewers', FREQUENT_VIEWERS: 'Regular viewers', SUBSCRIBERS_NET_CHANGE: 'Subscribers', EXTERNAL_VIEWS: 'Views', VIDEO_COUNT_FIRST_PUBLISHED: 'Published content' }[m];
          return table(c, t || m, P, s, { share: m === 'EXTERNAL_VIEWS', barMax: m === 'EXTERNAL_VIEWS' ? 138 : 80 });
        }
        if (d === 'TRAFFIC_SOURCE_TYPE') return trafficCard(c, `Views · ${P}`, s);
        if (d === 'PLAYLIST') return playlists(c, s);
        if (['PODCAST', 'COURSE', 'TV_SHOW'].includes(d)) return null;
        if (d === 'VIDEO' && m === 'EXTERNAL_VIEWS') return table(c, view === 'SHORTS' ? 'Top Shorts' : 'Top videos', `Views · ${P}`, s, {});
        if (d === 'VIDEO') return table(c, 'Top earning Shorts', P, s, { barMax: 146 });
        if (d === 'SUBSCRIBED_TO_UPLOADER_STATE') return table(c, 'Watch time from subscribers', `Watch time · ${P}`, s, { pctOfTotal: true });
        if (d === 'CAPTION_LANGUAGE') return table(c, 'Top subtitle/CC languages', `Views · ${P}`, s, { pctOfTotal: true });
        if (d === 'MONTH') return table(c, 'How much you’re earning', 'Estimated · Last 6 months', s, { barMax: 146 });
        if (d === 'ADTYPES') return table(c, 'Earnings by ad type', P, s, { barMax: 146 });
        if (d === 'EARNINGS_SOURCE_ALL') return table(c, view === 'SHORTS_FEED_ADS' ? 'Shorts Feed ads revenue' : 'Watch Page ads revenue', P, s, { barMax: 146 });
        return table(c, d ? d.toLowerCase().replace(/_/g, ' ').replace(/^./, (x) => x.toUpperCase()) : '', P, s, { barMax: 146 });
      }
      case 'TABLE_CAROUSEL': return carousel(c, view === 'SHORTS' ? 'How viewers find your Shorts' : 'How viewers find your videos', `Views · ${P}`, s);
      case 'STACKED_BAR': if (view === 'SHORTS') return card('How viewers engaged', P, empty('Nothing to show for these dates'), seeMore(s, c)); return stacked(c, 'Audience by watch behavior', `Monthly audience · ${range.split('–').pop().trim()}`, s);
      case 'AUDIENCE_ONLINE': return heat(c, 'When your viewers are on YouTube', `Your local time (GMT ${tz()}) · ${P}`);
      case 'DEMOGRAPHICS_BY_CONTENT_TYPE': return demographics(c, 'Age and gender', `Views · ${P}`, s);
      case 'MULTI_TABLE': return multiTable(c, 'Popular with different audiences', `Views · ${P}`, s);
      case 'CHANNEL_COMPETITION': return channels(c, 'Channels your audience watches', P);
      case 'BELLED_SUBSCRIBERS': return bell(c);
      case 'AUDIENCE_INTERESTS': { const e0 = empty('Not enough eligible audience data to show this report. '); const a = U().el('a', 'og-link', 'Learn more'); a.href = 'https://support.google.com/youtube/'; a.target = '_blank'; a.rel = 'noopener'; e0.append(a); return card('What your audience watches', 'Last 7 days', e0); }
      case 'FORMATS_AUDIENCE_WATCH_ON_YT': return formats(c, P);
      case 'AUDIENCE_RETENTION_HIGHLIGHTS': return retention(c);
      case 'POSTS_ENGAGEMENT_RATE': return posts(c, P, s);
      case 'SHORT_VIDEO_REMIX': return card('Top Remixed', `Your content used to create Shorts · ${P}`, empty('Nothing to show for these dates'), seeMore(s, c));
      case 'LIVE_CHANNEL_CCV': return null;
      case 'TABLE_CARD_BY_CONTENT_TYPE': {
        const dim = c.config?.tableCardByContentTypeCardConfig?.tableCardConfig?.dimension;
        const rows = (t) => { const r = rowsFrom(c, t, { max: 5, pctOfTotal: true }); return r.length ? barRows(r) : [empty('Nothing to show for these dates')]; };
        if (dim === 'COUNTRY') return card('Top geographies', `Views · ${P}`, rows(c.tableCardByContentTypeCardData?.tables?.[0]?.tableCard?.mainTableData), seeMore(s, c));
        if (dim === 'DEVICE_PLATFORM_TYPE') return byType(c, 'Device type', `Watch time (hours) · ${P}`, s, (t) => {
          const { el } = U(); const r = rowsFrom(c, t);
          if (!r.length) return [empty('Nothing to show for these dates')];
          return [el('div', 'og-stack', ...r.map((x, i) => { const b = el('i'); b.style.flex = String(x.value); b.style.background = STACK[i % 4]; return b; })),
            ...r.map((x, i) => { const dot = el('i'); dot.style.background = STACK[i % 4]; return el('div', 'og-legend', dot, el('span', null, x.label), el('b', null, x.text)); })];
        });
        return byType(c, 'How you make money', `Estimated · ${P}`, s, (t) => { const r = rowsFrom(c, t, { max: 5 }); return r.length ? barRows(r, 146) : [empty('Nothing to show for these dates')]; });
      }
      case 'REVENUE_PERFORMANCE_BY_CONTENT_TYPE': return revenuePerf(c, 'Content performance', P, s);
      case 'FUNNEL': return funnel(c, 'Impressions and how they led to watch time', s, `${range} (${s.PERIODS[s.periodKey].days || ''} days)`);
      case 'FORMATS_OVERLAP': return card('Viewers across formats', `Returning viewers · ${P}`, empty('Not enough data to show this report.'));
      case 'CONTENT_TYPE_PERFORMANCE': {
        const r = c.contentTypePerformanceCardData?.rows?.[0]?.stats?.[0]?.typicalRange;
        return card('Typical views', 'First 28 days', r ? U().el('div', 'og-trow', U().el('div', 'og-trow-t', 'Videos'), U().el('div', 'og-trow-r', `${U().compact(r.lowerBound)}–${U().compact(r.upperBound)}`)) : empty('Not enough data to show this report.'), seeMore(s, c));
      }
      default: return null;
    }
  }

  const CONTENT_SUBS = [['CONTENT_ANALYSIS_TYPE_ALL_CONTENT', 'All'], ['CONTENT_ANALYSIS_TYPE_VIDEO', 'Videos'], ['CONTENT_ANALYSIS_TYPE_SHORTS', 'Shorts'], ['CONTENT_ANALYSIS_TYPE_POSTS', 'Posts'], ['CONTENT_ANALYSIS_TYPE_PLAYLISTS', 'Playlists']];
  const REV_SUBS = [['MONETIZATION_TYPE_ALL', 'All'], ['MONETIZATION_TYPE_WATCH_PAGE_ADS', 'Watch Page ads'], ['MONETIZATION_TYPE_SHORTS_FEED_ADS', 'Shorts Feed ads'], ['MONETIZATION_TYPE_MEMBERSHIPS', 'Memberships'], ['MONETIZATION_TYPE_SUPERS_AND_GIFTS', 'Supers & gifts'], ['MONETIZATION_TYPE_AFFILIATE_SHOPPING', 'Affiliate program']];

  function trends(s) {
    const { el, icon, button, compact } = U();
    const f = s.data.layouts[0].top[0]?.contentInspirationFeedCardData;
    const shelves = f?.shelves || [];
    const q = shelves.find((x) => x.searchQueries)?.searchQueries?.searchQueries || [];
    const v = shelves.find((x) => x.videos)?.videos?.videos || [];
    const ago = (sec) => { const d = Math.max(0, (Date.now() / 1000 - sec) / 86400); if (d >= 30) return `${Math.floor(d / 30)} month${d >= 60 ? 's' : ''} ago`; if (d >= 7) return `${Math.floor(d / 7)} week${d >= 14 ? 's' : ''} ago`; return `${Math.max(1, Math.floor(d))} day${d >= 2 ? 's' : ''} ago`; };
    const qHost = el('div', 'og-trends-q'), vHost = el('div', 'og-trends-q');
    const fillQ = (n) => qHost.replaceChildren(...q.slice(0, n).map((x) => el('div', 'og-qcard', el('p', null, x.query), icon('heart', 24, 'og-heart'))));
    const fillV = (n) => vHost.replaceChildren(...v.slice(0, n).map((x) => {
      const t = x.thumbnailDetails?.thumbnails || [];
      const i = el('img'); i.alt = ''; const u = (t.find((y) => y.width >= 300) || t[t.length - 1] || {}).url; if (u) i.src = u;
      const sec = +x.videoLengthSeconds || 0;
      const card0 = el('a', 'og-vcard', el('div', 'og-vth', i), el('div', 'og-vt', x.title || ''), el('div', 'og-vs', x.uploaderChannelName || ''),
        el('div', 'og-vs', `${compact(+x.viewCount || 0)} views • ${ago(+x.timePublishedSeconds || 0)}`));
      card0.href = `https://youtu.be/${x.externalVideoId}`; card0.target = '_blank'; card0.rel = 'noopener';
      return card0;
    }));
    fillQ(4); fillV(4);
    const toggle = (fn, max) => { let open = false; return () => { open = !open; fn(open ? max : 4); }; };
    const saved = button('Saved (0)', () => s.research()); saved.prepend(icon('heart', 24));
    const input = el('input', 'og-trends-in'); input.placeholder = 'Search';
    input.onkeydown = (e) => { if (e.key === 'Enter') s.research(); };
    return el('div', 'og-trends', el('div', 'og-trends-h', el('div', null, 'Get ideas for your next video'), saved),
      el('div', 'og-trends-s', icon('search', 24), input),
      el('div', 'og-trends-t', 'What people are looking for', button('Show all', toggle(fillQ, q.length))), qHost,
      el('div', 'og-trends-t', 'New videos to inspire you', button('Show all', toggle(fillV, v.length))), vHost);
  }

  function render(root, s) {
    const { el, keyCard, shell, day } = U();
    const { data, tab } = s;
    const period = D().periodOf(s.periodKey);
    const P = period.label === 'Custom' ? '' : period.label;
    if (tab === 'Trends') {
      shell(root, { ...s, active: tab, range: '', monetized: data.monetized }, trends(s));
      return;
    }
    const subs = tab === 'Content' ? CONTENT_SUBS : tab === 'Revenue' ? REV_SUBS : null;
    const defKey = tab === 'Content' ? 'CONTENT_ANALYSIS_TYPE_VIDEO' : tab === 'Revenue' ? 'MONETIZATION_TYPE_ALL' : 'MAIN';
    const key = s.sub || defKey;
    const L = data.layouts.find((x) => x.key === key) || data.layouts[0];
    const view = (key || '').replace('CONTENT_ANALYSIS_TYPE_', '').replace('MONETIZATION_TYPE_', '');
    const [color, fill] = COLORS[tab];
    const allCards = [...L.top, ...L.left, ...L.right];
    const kc = allCards.find((c) => c.keyMetricCardData);
    let metrics = null, range = '', ends = null;
    if (kc) {
      metrics = D().metricsOf(kc);
      const p = metrics[0]?.series || [];
      if (p.length) { range = U().rangeText(p[0].x, p[p.length - 1].x); ends = [p[0].x, p[p.length - 1].x]; }
    }
    if (!range) {
      const any = data.layouts.flatMap((l) => [...l.top]).find((c) => c.keyMetricCardData);
      const p = any ? D().metricsOf(any)[0]?.series || [] : [];
      if (p.length) { range = U().rangeText(p[0].x, p[p.length - 1].x); ends = [p[0].x, p[p.length - 1].x]; }
    }
    const body = el('div', 'og-tabbody');
    body.style.setProperty('--tc', color);
    let key1 = null;
    if (metrics) { key1 = keyCard({ metrics, uploads: [] }, period, s, { color, fill, more: () => s.explore('card', kc) }); body.append(key1.node); }
    const end = range.split('–').pop().trim();
    const OV = {
      WATCH_PAGE_ADS: { left: [['Watch Page ads revenue', `Estimated · ${P}`], ['How much advertisers pay', P]], right: [['Earnings by ad type', `YouTube ad revenue · ${P}`, null, 154]] },
      SHORTS_FEED_ADS: { left: [['Shorts Feed ads revenue', `Estimated · ${P}`]], right: [['Top earning Shorts', `Shorts Feed ads · ${P}`]] },
      MEMBERSHIPS: { left: [['Membership revenue', `Estimated · ${P}`], ['Where members join from', P]], right: [['Membership levels', `Total members · ${end}`, 'Nothing to show for this date'], ['Why members left', `Exit surveys · ${P}`]] },
      SUPERS_AND_GIFTS: { left: [['How Supers & gifts make money', `Estimated · ${P}`]], right: [] },
      AFFILIATE_SHOPPING: { left: [['How much you’re earning', 'Earned revenue · Last 6 months'], ['Top earning content', `Estimated · ${P}`]], right: [['Top affiliate products', `Estimated · ${P}`], ['Top sellers', `Estimated · ${P}`]] },
    }[view];
    const r1 = (c) => render1(c, s, P, range, view);
    const tops = L.top.filter((c) => c !== kc).map(r1).filter(Boolean);
    if (tops.length) body.append(L.row ? el('div', 'og-toprow', ...tops) : el('div', 'og-colstack', ...tops));
    const left = L.left.map((c, i) => render1(c, s, P, range, view, OV?.left?.[i])).filter(Boolean), right = L.right.map((c, i) => render1(c, s, P, range, view, OV?.right?.[i])).filter(Boolean);
    if (left.length || right.length) body.append(el('div', 'og-2col', el('div', 'og-colstack', ...left), el('div', 'og-colstack', ...right)));
    const shown = subs?.filter(([k]) => data.layouts.some((x) => x.key === k));
    const page = el('div', null, subs ? chipRow(shown, key, s.onSub, tab === 'Content' ? 'og-subchips og-sep-last' : 'og-subchips') : el('div', 'og-gap24'), body);
    shell(root, { ...s, active: tab, range, ends, monetized: data.monetized }, page);
    key1?.start();
  }

  window.OGTabs = { render };
})();
