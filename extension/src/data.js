// OG Studio: ALL reading of Studio data lives in this file.
// If YouTube changes something, this is the only file that should need fixing.
(() => {
  const ORIGIN = 'https://studio.youtube.com';
  // Built per load so month and year names stay current. `type` = Studio's period name.
  function buildPeriods(now = new Date()) {
    const mon = (k) => new Date(now.getFullYear(), now.getMonth() - k, 1).toLocaleDateString('en-US', { month: 'long' });
    return {
      week: { type: 'WEEK', url: 'week', label: 'Last 7 days', days: 7 },
      month: { type: 'FOUR_WEEKS', url: '4_weeks', label: 'Last 28 days', days: 28 },
      quarter: { type: 'QUARTER', url: 'quarter', label: 'Last 90 days', days: 90 },
      year: { type: 'YEAR', url: 'year', label: 'Last 365 days', days: 365 },
      lifetime: { type: 'LIFETIME', url: 'lifetime', label: 'Lifetime', days: null, gap: true, noPrev: true },
      y0: { type: 'CURRENT_YEAR', url: 'current_year', label: String(now.getFullYear()), days: null },
      y1: { type: 'MINUS_1_YEAR', url: 'minus_1_year', label: String(now.getFullYear() - 1), days: null, gap: true },
      m0: { type: 'CURRENT_MONTH', url: 'current_month', label: mon(0), days: null },
      m1: { type: 'MINUS_1_MONTH', url: 'minus_1_month', label: mon(1), days: null },
      m2: { type: 'MINUS_2_MONTH', url: 'minus_2_month', label: mon(2), days: null, gap: true },
    };
  }
  const PERIODS = buildPeriods();
  // Custom ranges are keyed "custom:20261012,20261021" (end date is exclusive, as Studio sends it).
  const periodOf = (key) => {
    if (!String(key).startsWith('custom:')) return PERIODS[key];
    const [a, b] = key.slice(7).split(',').map(Number);
    const d = (n) => new Date(Math.floor(n / 1e4), Math.floor(n / 100) % 100 - 1, n % 100).getTime();
    return { custom: { inclusiveStart: a, exclusiveEnd: b }, url: `${d(a)},${d(b) - 864e5}`, label: 'Custom', days: null, noPrev: true };
  };
  const METRICS = {
    EXTERNAL_VIEWS: { key: 'views', label: 'Views' },
    EXTERNAL_WATCH_TIME: { key: 'watch', label: 'Watch time (hours)' },
    SUBSCRIBERS_NET_CHANGE: { key: 'subs', label: 'Subscribers' },
    TOTAL_ESTIMATED_EARNINGS: { key: 'revenue', label: 'Estimated revenue' },
    VIDEO_THUMBNAIL_IMPRESSIONS: { key: 'count', label: 'Thumbnail impressions' },
    VIDEO_THUMBNAIL_IMPRESSIONS_VTR: { key: 'pct', label: 'Thumbnail click-through rate' },
    AVERAGE_WATCH_TIME: { key: 'time', label: 'Average view duration' },
    ESTIMATED_UNIQUE_VIEWERS_LAST28_DAYS: { key: 'count', label: 'Monthly audience' },
    POST_IMPRESSIONS: { key: 'count', label: 'Impressions' },
    POST_LIKES: { key: 'count', label: 'Likes' },
    POST_SUBSCRIBERS_NET_CHANGE: { key: 'subs', label: 'Subscribers' },
    RATINGS_LIKES: { key: 'count', label: 'Likes' },
    ENGAGED_VIEWS: { key: 'views', label: 'Engaged views' },
    MEMBERS_NET_CHANGE: { key: 'count', label: 'Total members' },
    TRANSACTION_COUNT: { key: 'count', label: 'Purchases' },
    APPROVED_REVENUE: { key: 'revenue', label: 'Earned revenue' },
    TOTAL_SALES: { key: 'revenue', label: 'Total sales' },
    ORDERS_COUNT: { key: 'count', label: 'Orders' },
    AFFILIATE_OFFER_CLICKS: { key: 'count', label: 'Product clicks' },
  };
  const metricDef = (name) => METRICS[name] || { key: 'count', label: name.toLowerCase().replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) };

  const cookie = (n) => (document.cookie.split('; ').find((c) => c.startsWith(n + '=')) || '').slice(n.length + 1);
  const sha1 = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(s)))]
    .map((b) => b.toString(16).padStart(2, '0')).join('');

  async function headers() {
    const sid = cookie('SAPISID') || cookie('__Secure-3PAPISID');
    if (!sid) throw new Error('not signed in');
    const ts = Math.floor(Date.now() / 1000);
    const h = {
      'Content-Type': 'application/json',
      Authorization: `SAPISIDHASH ${ts}_${await sha1(`${ts} ${sid} ${ORIGIN}`)}`,
      'X-Origin': ORIGIN,
      'X-Goog-AuthUser': String(window.ytcfg.get('SESSION_INDEX') ?? 0),
    };
    const page = window.ytcfg.get('DELEGATED_SESSION_ID');
    if (page) h['X-Goog-PageId'] = page;
    return h;
  }

  async function post(path, body) {
    const r = await fetch('/youtubei/v1/' + path + '?alt=json', {
      method: 'POST', credentials: 'include', headers: await headers(),
      body: JSON.stringify({ ...body, context: window.ytcfg.get('INNERTUBE_CONTEXT') }),
    });
    if (!r.ok) throw new Error(path + ' ' + r.status);
    return r.json();
  }

  const currency = () => window.ytcfg.get('USER_SETTINGS')?.cmsSettings?.currency || 'USD';
  const timePeriod = (periodKey) => {
    const p = periodOf(periodKey);
    return p.custom ? { dateIdRange: p.custom } : { timePeriodType: 'ANALYTICS_TIME_PERIOD_TYPE_' + p.type };
  };

  function getScreen(channelId, periodKey, tab = 'OVERVIEW') {
    return post('yta_web/get_screen', {
      screenConfig: {
        currency: currency(), entity: { channelId },
        timePeriod: timePeriod(periodKey),
        timeZoneOffsetSecs: -new Date().getTimezoneOffset() * 60,
      },
      desktopState: { tabId: 'ANALYTICS_TAB_ID_' + tab },
      fetchingType: 'FETCHING_TYPE_FOREGROUND',
    });
  }

  // Revenue shows on monetized channels, and on channels that lost monetization after earning.
  // true / false, or null if the check failed. The rebuilt page treats null as no revenue,
  // so it never shows an invented $0.00 as if it were a real number.
  const monCache = {};
  function revenueStatus(channelId) {
    return (monCache[channelId] ||= (async () => {
      try {
        const d = await post('creator/get_creator_channels', { channelIds: [channelId], mask: { channelId: true, monetizationStatus: true } });
        if (d.channels?.[0]?.monetizationStatus === 'CHANNEL_MONETIZATION_STATUS_ACTIVE') return true;
        const life = await getScreen(channelId, 'lifetime');
        return (readMetrics(life.cards).find((m) => m.key === 'revenue')?.total || 0) > 0;
      } catch (e) { console.warn('[OG Studio]', e); delete monCache[channelId]; return null; }
    })());
  }
  const isMonetized = async (channelId) => (await revenueStatus(channelId)) === true;

  const colValues = (col) => {
    for (const v of Object.values(col || {})) if (v && Array.isArray(v.values)) return v.values;
    return [];
  };
  const firstCard = (cards, type) => cards.find((c) => c.loggingConfig?.cardType === 'ANALYTICS_CARD_CONFIG_TYPE_' + type);
  const videoMap = (card) => {
    const m = {};
    for (const v of card?.sideEntities?.videos || []) {
      const e = v.entityData;
      if (!e?.videoId) continue;
      const t = e.thumbnailDetails?.thumbnails || [];
      m[e.videoId] = {
        id: e.videoId, title: e.title || '', lengthSeconds: Number(e.lengthSeconds) || 0,
        published: Number(e.timePublishedSeconds) * 1000 || null,
        thumb: (t.find((x) => x.width >= 160) || t[t.length - 1] || {}).url || '',
        thumb43: (t.find((x) => x.width && Math.abs(x.width / x.height - 4 / 3) < 0.02 && x.width >= 300) || {}).url || '',
      };
    }
    return m;
  };

  function metricsOf(card) {
    const tabs = card?.keyMetricCardData?.keyMetricTabs;
    if (!tabs?.length) throw new Error('no key metrics');
    return tabs.map((t) => {
      const p = t.primaryContent;
      const r = p?.typicalPerformanceTotal?.typicalRange;
      return {
        ...metricDef(t.metricTabConfig?.metric || ''),
        total: typeof p?.total === 'number' && !(t.metricTabConfig?.metric === 'POST_SUBSCRIBERS_NET_CHANGE' && !p.total) ? p.total : null,
        previous: typeof p?.previousTotal === 'number' ? p.previousTotal : null,
        typical: r ? { low: r.lowerBound, high: r.upperBound } : null,
        series: (p?.mainSeries?.datums || []).map((d) => ({ x: d.x, y: d.y })),
        monthly: null,
        clock: (p?.anomalies || []).some((a) => /TEMP/.test(a.permanence || '')),
        warn: (p?.anomalies || []).find((a) => /PERMANENT/.test(a.permanence || '') && /INFORMATION/.test(a.impact || '') && a.endDate > (p?.mainSeries?.datums?.[0]?.x || 0)) ? true : false,
        // Days YouTube hasn't finished counting: the old chart stops the line and shades them grey.
        missingFrom: (p?.anomalies || []).find((a) => /TEMP/.test(a.permanence || '') && /DATA_MI/.test(a.impact || ''))?.startDate ?? null,
      };
    });
  }
  const readMetrics = (cards) => metricsOf(firstCard(cards, 'KEY_METRIC_CARD'));

  function readTop(cards) {
    const card = firstCard(cards, 'TABLE_CARD');
    const t = card?.tableCardData?.mainTableData;
    if (!t) return [];
    const ids = colValues(t.dimensionColumns?.[0]);
    const col = (type) => colValues(t.metricColumns?.find((c) => c.metric?.type === type));
    const avg = col('AVERAGE_WATCH_TIME'), pct = col('AVERAGE_WATCH_PERCENTAGE'), views = col('EXTERNAL_VIEWS');
    const vids = videoMap(card);
    return ids.map((id, i) => ({ ...(vids[id] || { id, title: '' }), avgMs: avg[i] ?? null, avgPct: pct[i] ?? null, views: views[i] ?? null }));
  }

  function readRealtime(cards) {
    const card = firstCard(cards, 'LATEST_ACTIVITY_CARD');
    const d = card?.latestActivityCardData;
    const data = d?.datas?.[0];
    if (!data) return null;
    const hours = colValues(data.mainChartData?.metricColumns?.[0]);
    const ids = colValues(data.topEntitiesData?.dimensionColumns?.[0]);
    const counts = colValues(data.topEntitiesData?.metricColumns?.[0]);
    const vids = videoMap(card);
    return {
      subs: colValues(d.lifetimeSubsData?.metricColumns?.[0])[0] ?? null,
      hours, views48: hours.reduce((a, b) => a + b, 0),
      top: ids.map((id, i) => ({ ...(vids[id] || { id, title: '' }), views: counts[i] ?? null })),
    };
  }

  function readLatest(cards) {
    const card = firstCard(cards, 'ENTITY_SNAPSHOT_CARD');
    const d = card?.entitySnapshotCardData;
    const id = d?.video?.externalVideoId;
    if (!id) return null;
    const rank = d.ranking?.entities || [];
    return {
      ...(videoMap(card)[id] || { id, title: '' }),
      rank: rank.find((e) => e.entity?.videoId === id)?.rank ?? null, rankOf: rank.length,
      rows: (d.metricsTable?.metricRows || []).map((r) => ({ type: r.metric?.type, value: r.value?.double ?? null, trend: r.trend })),
    };
  }

  function readDriver(cards) {
    const card = firstCard(cards, 'ANALYSIS_DRIVER_CARD');
    const c = card?.driverContainer;
    if (!c?.title || card.isHidden) return null;
    const m = card.analysisDriverCardData?.metricTypicalPerformanceCardData;
    const r = m?.stats?.typicalRange;
    return {
      title: c.title, subtitle: c.subtitle || '',
      rows: (c.rows || []).map((x) => ({ text: (x.paragraphs || []).join(' '), link: x.buttonLabel || '', url: x.externalUrl || '' })),
      metric: m && r ? { title: m.title, subtitle: m.subtitle, value: m.value, low: r.lowerBound, high: r.upperBound, typical: m.stats.typicalValue } : null,
    };
  }

  function readUploads(card) {
    const vids = videoMap(card);
    return (card?.keyMetricCardData?.recentVideoIds || []).map((id) => vids[id]?.published).filter(Boolean);
  }

  function readAnalyses(card) {
    const list = card?.metricsAnalysesCardData?.metricAnalyses;
    if (!list?.length) return null;
    return {
      title: card.driverContainer?.title || '',
      items: list.map((a) => ({
        title: a.title, insight: a.insight || '', subs: a.subInsights || [],
        data: (a.metricDriver?.metricDriverCard?.metricData || []).map((d) => ({ type: d.type, title: d.title, value: d.currentValue, low: d.stats?.typicalRange?.lowerBound, high: d.stats?.typicalRange?.upperBound, typical: d.stats?.typicalValue })),
      })),
    };
  }

  async function getOverview(channelId, periodKey) {
    const [raw, monetized] = await Promise.all([getScreen(channelId, periodKey), isMonetized(channelId)]);
    let cards = raw.cards;
    if (!Array.isArray(cards)) throw new Error('no cards');
    // Past-month reports use the second half of the response: a longer header, monthly chart and analyses.
    const month = raw.layout?.desktopLayout?.defaultDesktopState?.selectedAnalysis === 'ANALYSIS_TYPE_MONTH';
    if (month) { const i = cards.findIndex((c) => c.analysisVariant && c.personalizedHeaderCardData?.hint); if (i > 0) cards = cards.slice(i); }
    const h = firstCard(cards, 'PERSONALIZED_HEADER_CARD')?.personalizedHeaderCardData;
    const part = (fn) => { try { return fn(cards); } catch (e) { console.warn('[OG Studio]', e); return null; } };
    const km = firstCard(cards, 'KEY_METRIC_CARD');
    const metrics = readMetrics(cards).filter((m) => m.total !== null && (monetized || m.key !== 'revenue')); // required: failing here falls back to normal Studio
    if (month && km?.keyMetricCardData?.secondaryMetricData) {
      const daily = metricsOf(km.keyMetricCardData.secondaryMetricData.keyMetricTabs ? { keyMetricCardData: km.keyMetricCardData.secondaryMetricData } : km);
      metrics.forEach((m) => { const d = daily.find((x) => x.label === m.label); if (d) { m.monthly = m.series; m.series = d.series; } });
    }
    return {
      monetized, title: h?.title || '', subtitle: h?.subtitle || '', hint: h?.hint || '', metrics, uploads: part(() => readUploads(km)) || [],
      top: part(readTop) || [], realtime: part(readRealtime), latest: part(readLatest), driver: month ? null : part(readDriver),
      analyses: month ? part(() => readAnalyses(firstCard(cards, 'METRICS_ANALYSES_CARD'))) : null,
    };
  }

  async function getRealtime(channelId) {
    const r = await post('yta_web/get_cards', {
      screenConfig: { currency: currency(), entity: { channelId }, timePeriod: { timePeriodType: 'ANALYTICS_TIME_PERIOD_TYPE_FOUR_WEEKS' }, timeZoneOffsetSecs: -new Date().getTimezoneOffset() * 60 },
      cardConfigs: [{ autoUpdateInterval: 'ANALYTICS_AUTO_UPDATE_INTERVAL_REALTIME', failureMode: 'ANALYTICS_CARD_FAILURE_MODE_HIDE', latestActivityCardConfig: { includeSubsData: true, tableLimit: 3 } }],
      fetchingType: 'FETCHING_TYPE_BACKGROUND',
    });
    return readRealtime(r.cards || []);
  }

  const TAB_IDS = { Content: 'CONTENT', Audience: 'AUDIENCE', Revenue: 'REVENUE', Trends: 'CONTENT_INSPIRATION' };

  // The response lists cards in layout order: header, top, left, right, for each layout.
  async function getTab(channelId, periodKey, name) {
    const id = TAB_IDS[name];
    const [raw, monetized] = await Promise.all([getScreen(channelId, periodKey, id), isMonetized(channelId)]);
    if (!Array.isArray(raw.cards)) throw new Error('no cards');
    const tab = raw.layout?.desktopLayout?.tabs?.find((t) => t.tabId === 'ANALYTICS_TAB_ID_' + id);
    if (!tab) throw new Error('no layout');
    // Cards come back in layout order, but some layouts carry extra cards, so match each slot by its config.
    const queue = [...raw.cards];
    const cfgName = (c) => Object.keys(c || {}).find((k) => /CardConfig$/.test(k));
    const take = (cfg) => {
      const name = cfgName(cfg), want = JSON.stringify(cfg[name]);
      let i = queue.findIndex((c) => cfgName(c.config) === name && JSON.stringify(c.config[name]) === want);
      if (i < 0) i = queue.findIndex((c) => cfgName(c.config) === name);
      return i < 0 ? null : queue.splice(i, 1)[0];
    };
    const slot = (list) => (list || []).map(take).filter(Boolean);
    const layouts = (tab.analysisLayouts || [{ cardSection: tab.cardSection }]).map((L) => {
      if (L.headerCardConfig) take(L.headerCardConfig);
      const c = L.cardSection || {};
      return {
        key: L.contentAnalysisType || L.monetizationType || 'MAIN', row: !!c.showRowTopSection,
        top: slot(c.topSectionCards), left: slot(c.leftSectionCards), right: slot(c.rightSectionCards),
      };
    });
    return { monetized, layouts };
  }

  // Generic readers for table style cards.
  const tableOf = (card) => card?.tableCardData?.mainTableData || null;
  function tableRows(t) {
    if (!t) return [];
    const dims = colValues(t.dimensionColumns?.[0]);
    const vals = t.metricColumns?.map((c) => colValues(c)) || [];
    return dims.map((d, i) => ({ dim: d, values: vals.map((v) => v[i]) }));
  }
  const entityMaps = (card) => {
    const videos = videoMap(card), channels = {}, playlists = {};
    for (const c of card?.sideEntities?.channels || []) {
      const e = c.entityData; if (e?.channelId) channels[e.channelId] = { id: e.channelId, title: e.title, thumb: e.thumbnailDetails?.thumbnails?.[0]?.url || '', subs: e.metric?.subscriberCount != null ? Number(e.metric.subscriberCount) : null };
    }
    for (const p of card?.sideEntities?.playlists || []) {
      const e = p.entityData; if (e) playlists[e.playlistId || e.id] = e;
    }
    return { videos, channels, playlists };
  };

  window.OGData = { PERIODS, periodOf, revenueStatus, currency, getOverview, getRealtime, getTab, metricsOf, tableOf, tableRows, colValues, entityMaps };
})();
