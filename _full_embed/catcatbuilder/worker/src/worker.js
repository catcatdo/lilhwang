export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowedOrigins = (env.ALLOWED_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean);
    const corsHeaders = buildCorsHeaders(origin, allowedOrigins);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    if (url.pathname === '/api/posts.json') {
      if (request.method !== 'GET') {
        return jsonResponse({ message: 'Method Not Allowed' }, 405, corsHeaders);
      }
      try {
        const payload = await fetchPublicPosts(env);
        return jsonResponse(payload, 200, corsHeaders);
      } catch (error) {
        return jsonResponse({ message: 'Failed to load posts' }, 500, corsHeaders);
      }
    }

    if (url.pathname === '/api/latest.json') {
      if (request.method !== 'GET') {
        return jsonResponse({ message: 'Method Not Allowed' }, 405, corsHeaders);
      }
      try {
        const payload = await fetchPublicPosts(env);
        const posts = normalizePostArray(payload);
        const latest = posts
          .slice()
          .sort((a, b) => getPublishedTime(b) - getPublishedTime(a))
          .slice(0, 10);
        return jsonResponse({ posts: latest, total: latest.length }, 200, corsHeaders);
      } catch (error) {
        return jsonResponse({ message: 'Failed to load latest posts' }, 500, corsHeaders);
      }
    }

    if (url.pathname === '/api/search') {
      if (request.method !== 'GET') {
        return jsonResponse({ message: 'Method Not Allowed' }, 405, corsHeaders);
      }
      const q = String(url.searchParams.get('q') || '').trim();
      if (!q) {
        return jsonResponse({ message: 'q query is required' }, 400, corsHeaders);
      }
      try {
        const payload = await fetchPublicPosts(env);
        const posts = normalizePostArray(payload);
        const query = q.toLowerCase();
        const matched = posts
          .filter(post => searchableText(post).includes(query))
          .sort((a, b) => getPublishedTime(b) - getPublishedTime(a));
        return jsonResponse({ q, total: matched.length, posts: matched }, 200, corsHeaders);
      } catch (error) {
        return jsonResponse({ message: 'Search failed' }, 500, corsHeaders);
      }
    }

    if (url.pathname === '/auth/login') {
      if (request.method !== 'POST') {
        return jsonResponse({ message: 'Method Not Allowed' }, 405, corsHeaders);
      }

      let payload;
      try {
        payload = await request.json();
      } catch (error) {
        return jsonResponse({ ok: false, message: 'Invalid JSON' }, 400, corsHeaders);
      }

      const username = String(payload?.username || '').trim();
      const password = String(payload?.password || '');
      if (!isAdminCredentialValid(env, username, password)) {
        return jsonResponse({ ok: false, message: 'Unauthorized' }, 401, corsHeaders);
      }

      if (!env.JWT_SECRET) {
        return jsonResponse({ ok: false, message: 'JWT is not configured' }, 500, corsHeaders);
      }

      const token = await createHmacJwt(
        {
          sub: username || 'admin',
          role: 'admin'
        },
        env.JWT_SECRET
      );
      return jsonResponse(
        {
          ok: true,
          token,
          tokenType: 'Bearer',
          expiresIn: 60 * 60 * 12
        },
        200,
        corsHeaders
      );
    }

    if (url.pathname === '/push/public-key') {
      if (request.method !== 'GET') {
        return jsonResponse({ message: 'Method Not Allowed' }, 405, corsHeaders);
      }

      if (!env.VAPID_PUBLIC_KEY) {
        return jsonResponse({ ok: false, message: 'Push is not configured' }, 500, corsHeaders);
      }

      return jsonResponse({ ok: true, publicKey: env.VAPID_PUBLIC_KEY }, 200, corsHeaders);
    }

    if (url.pathname === '/push/subscribe') {
      if (request.method !== 'POST') {
        return jsonResponse({ message: 'Method Not Allowed' }, 405, corsHeaders);
      }

      if (!env.PUSH_SUBSCRIPTIONS) {
        return jsonResponse({ ok: false, message: 'PUSH_SUBSCRIPTIONS KV is missing' }, 500, corsHeaders);
      }

      let payload;
      try {
        payload = await request.json();
      } catch (error) {
        return jsonResponse({ ok: false, message: 'Invalid JSON' }, 400, corsHeaders);
      }

      const subscription = normalizePushSubscription(payload?.subscription);
      if (!subscription) {
        return jsonResponse({ ok: false, message: '유효한 구독 정보가 필요합니다.' }, 400, corsHeaders);
      }

      const key = await buildPushSubscriptionKey(subscription.endpoint);
      await env.PUSH_SUBSCRIPTIONS.put(key, JSON.stringify({
        subscription,
        source: String(payload?.source || 'unknown'),
        userAgent: String(payload?.userAgent || request.headers.get('User-Agent') || ''),
        createdAt: new Date().toISOString()
      }));

      return jsonResponse({ ok: true, message: '푸시 구독이 저장되었습니다.' }, 200, corsHeaders);
    }

    if (url.pathname === '/push/unsubscribe') {
      if (request.method !== 'POST') {
        return jsonResponse({ message: 'Method Not Allowed' }, 405, corsHeaders);
      }

      if (!env.PUSH_SUBSCRIPTIONS) {
        return jsonResponse({ ok: false, message: 'PUSH_SUBSCRIPTIONS KV is missing' }, 500, corsHeaders);
      }

      let payload;
      try {
        payload = await request.json();
      } catch (error) {
        return jsonResponse({ ok: false, message: 'Invalid JSON' }, 400, corsHeaders);
      }

      const endpoint = String(payload?.endpoint || '').trim();
      if (!endpoint) {
        return jsonResponse({ ok: false, message: 'endpoint is required' }, 400, corsHeaders);
      }

      const key = await buildPushSubscriptionKey(endpoint);
      await env.PUSH_SUBSCRIPTIONS.delete(key);
      return jsonResponse({ ok: true }, 200, corsHeaders);
    }

    if (url.pathname === '/most-active-stocks') {
      if (request.method !== 'GET') {
        return jsonResponse({ message: 'Method Not Allowed' }, 405, corsHeaders);
      }
      try {
        const [us, kr] = await Promise.all([
          fetchNewsHotStocks(env, 'us', 'ko', getUsCompanies()),
          fetchNewsHotStocks(env, 'kr', 'ko', getKrCompanies())
        ]);
        return jsonResponse({ us, kr }, 200, corsHeaders);
      } catch (error) {
        return jsonResponse({ message: 'Failed to load stocks' }, 500, corsHeaders);
      }
    }

    // ===== Image Proxy (for keyword-based generated images) =====
    if (url.pathname === '/image-proxy') {
      if (request.method !== 'GET') {
        return jsonResponse({ message: 'Method Not Allowed' }, 405, corsHeaders);
      }

      const targetUrlRaw = url.searchParams.get('url') || '';
      if (!targetUrlRaw) {
        return jsonResponse({ message: 'url query is required' }, 400, corsHeaders);
      }

      let targetUrl;
      try {
        targetUrl = new URL(targetUrlRaw);
      } catch (error) {
        return jsonResponse({ message: 'Invalid target url' }, 400, corsHeaders);
      }

      if (!['https:', 'http:'].includes(targetUrl.protocol)) {
        return jsonResponse({ message: 'Unsupported protocol' }, 400, corsHeaders);
      }

      const allowedHosts = [
        'image.pollinations.ai',
        'loremflickr.com',
        'picsum.photos'
      ];
      const host = targetUrl.hostname.toLowerCase();
      const isAllowed = allowedHosts.some(item => host === item || host.endsWith(`.${item}`));
      if (!isAllowed) {
        return jsonResponse({ message: 'Host not allowed' }, 403, corsHeaders);
      }

      try {
        const upstream = await fetch(targetUrl.toString(), {
          method: 'GET',
          headers: {
            'User-Agent': 'catcatbuilder-image-proxy/1.0'
          },
          cf: { cacheTtl: 86400, cacheEverything: true }
        });

        if (!upstream.ok) {
          return jsonResponse({ message: `Upstream error: ${upstream.status}` }, 502, corsHeaders);
        }

        const contentType = upstream.headers.get('content-type') || '';
        if (!contentType.toLowerCase().startsWith('image/')) {
          return jsonResponse({ message: 'Upstream is not image' }, 502, corsHeaders);
        }

        const headers = new Headers(corsHeaders);
        headers.set('Content-Type', contentType);
        headers.set('Cache-Control', 'public, max-age=86400');

        return new Response(upstream.body, { status: 200, headers });
      } catch (error) {
        return jsonResponse({ message: 'Failed to proxy image' }, 502, corsHeaders);
      }
    }

    // ===== Rankings API =====
    if (url.pathname === '/rankings') {
      const gameKey = url.searchParams.get('game') || 'poop-dodge';
      const kvKey = `rankings:${gameKey}`;

      if (request.method === 'GET') {
        try {
          const data = await env.RANKINGS.get(kvKey, 'json');
          return jsonResponse(data || [], 200, corsHeaders);
        } catch (error) {
          return jsonResponse([], 200, corsHeaders);
        }
      }

      if (request.method === 'POST') {
        try {
          const body = await request.json();
          const name = String(body.name || '익명').slice(0, 10);
          const score = parseInt(body.score, 10);
          if (isNaN(score) || score < 1) {
            return jsonResponse({ message: '유효하지 않은 점수입니다.' }, 400, corsHeaders);
          }

          const existing = await env.RANKINGS.get(kvKey, 'json') || [];
          existing.push({ name, score, date: new Date().toLocaleDateString('ko-KR') });
          existing.sort((a, b) => b.score - a.score);
          const top10 = existing.slice(0, 10);
          await env.RANKINGS.put(kvKey, JSON.stringify(top10));
          return jsonResponse(top10, 200, corsHeaders);
        } catch (error) {
          return jsonResponse({ message: '랭킹 저장 실패' }, 500, corsHeaders);
        }
      }
    }

    // ===== Newsletter Subscribe API =====
    if (url.pathname === '/newsletter/subscribe') {
      if (request.method !== 'POST') {
        return jsonResponse({ message: 'Method Not Allowed' }, 405, corsHeaders);
      }

      let payload;
      try {
        payload = await request.json();
      } catch (error) {
        return jsonResponse({ ok: false, message: 'Invalid JSON' }, 400, corsHeaders);
      }

      const email = String(payload?.email || '').trim().toLowerCase();
      if (!isValidEmail(email)) {
        return jsonResponse({ ok: false, message: '유효한 이메일을 입력해 주세요.' }, 400, corsHeaders);
      }

      const forwarded = {
        email,
        source: String(payload?.source || 'unknown'),
        subscribedAt: payload?.subscribedAt || new Date().toISOString(),
        referrer: String(payload?.referrer || ''),
        userAgent: String(payload?.userAgent || request.headers.get('User-Agent') || '')
      };

      if (env.NEWSLETTER_SUBSCRIBERS) {
        const subscriberKey = await buildEmailSubscriberKey(email);
        await env.NEWSLETTER_SUBSCRIBERS.put(
          subscriberKey,
          JSON.stringify({
            email,
            source: forwarded.source,
            referrer: forwarded.referrer,
            userAgent: forwarded.userAgent,
            subscribedAt: forwarded.subscribedAt
          })
        );
      }

      if (!env.NEWSLETTER_SHEETS_WEBHOOK_URL) {
        return jsonResponse({ ok: true, message: '구독이 저장되었습니다.' }, 200, corsHeaders);
      }

      try {
        const upstream = await fetch(env.NEWSLETTER_SHEETS_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(forwarded)
        });

        if (!upstream.ok) {
          const text = await upstream.text();
          return jsonResponse(
            { ok: false, message: `Sheets 연동 실패 (${upstream.status})`, detail: text.slice(0, 300) },
            502,
            corsHeaders
          );
        }

        return jsonResponse({ ok: true, message: '구독이 저장되었습니다.' }, 200, corsHeaders);
      } catch (error) {
        return jsonResponse({ ok: false, message: '구독 저장 중 오류가 발생했습니다.' }, 502, corsHeaders);
      }
    }

    if (url.pathname !== '/save-posts') {
      return new Response('Not Found', { status: 404, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ message: 'Method Not Allowed' }, 405, corsHeaders);
    }

    const isAuthorized = await authorizeAdminRequest(request, env);
    if (!isAuthorized) {
      return jsonResponse({ message: 'Unauthorized' }, 401, corsHeaders);
    }

    let payload;
    try {
      payload = await request.json();
    } catch (error) {
      return jsonResponse({ message: 'Invalid JSON' }, 400, corsHeaders);
    }

    if (!payload || !Array.isArray(payload.posts)) {
      return jsonResponse({ message: 'posts 배열이 필요합니다.' }, 400, corsHeaders);
    }

    try {
      const nextPosts = payload.posts;
      const content = JSON.stringify({ posts: nextPosts }, null, 2);
      const commitMessage = payload.message || `Update posts.json (${new Date().toISOString().slice(0, 10)})`;
      const previousPosts = await readExistingPosts(env);
      const newPosts = detectNewPosts(previousPosts, nextPosts);
      const result = await savePostsToGithub(env, content, commitMessage);

      let rssCommit = null;
      try {
        const rssXml = buildBlogRssXml(nextPosts, env.SITE_URL || 'https://lilhwang.com');
        rssCommit = await saveTextFileToGithub(env, env.RSS_PATH || 'rss.xml', rssXml, `${commitMessage} [rss]`);
      } catch (error) {
        // RSS regeneration errors should not block post publishing.
      }

      let pushResult = { attempted: 0, sent: 0, failed: 0 };
      let emailResult = { attempted: 0, sent: 0, failed: 0 };
      if (newPosts.length) {
        pushResult = await broadcastNewPostPush(env, newPosts[0]);
        emailResult = await sendNewPostEmails(env, newPosts);
      }

      return jsonResponse(
        {
          message: 'ok',
          commit: result.commit,
          commitUrl: result.commitUrl,
          rssCommit: rssCommit?.commit || null,
          rssCommitUrl: rssCommit?.commitUrl || null,
          newPostCount: newPosts.length,
          push: pushResult,
          email: emailResult
        },
        200,
        corsHeaders
      );
    } catch (error) {
      return jsonResponse({ message: error.message || 'GitHub update failed' }, 500, corsHeaders);
    }
  }
};

function buildCorsHeaders(origin, allowedOrigins) {
  const headers = {
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password, Authorization'
  };

  if (allowedOrigins.includes('*')) {
    headers['Access-Control-Allow-Origin'] = '*';
  } else if (allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }

  return headers;
}

async function fetchPublicPosts(env) {
  const explicitUrl = String(env.PUBLIC_POSTS_URL || '').trim();
  const sourceUrl = explicitUrl || buildDefaultPostsUrl(env);
  const response = await fetch(sourceUrl, {
    headers: {
      'User-Agent': 'catcatbuilder-api/1.0'
    },
    cf: {
      cacheTtl: 60,
      cacheEverything: true
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Posts fetch failed: ${response.status} ${text.slice(0, 120)}`);
  }
  return response.json();
}

function buildDefaultPostsUrl(env) {
  const owner = env.GITHUB_OWNER || 'catcatdo';
  const repo = env.GITHUB_REPO || 'catcatbuilder';
  const branch = env.GITHUB_BRANCH || 'main';
  const path = env.POSTS_PATH || 'posts.json';
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}

function normalizePostArray(payload) {
  return Array.isArray(payload?.posts) ? payload.posts : [];
}

function searchableText(post) {
  const tags = Array.isArray(post?.tags) ? post.tags.join(' ') : '';
  return [
    post?.title || '',
    post?.excerpt || '',
    post?.content || '',
    post?.category || '',
    tags
  ].join(' ').toLowerCase();
}

function getPublishedTime(post) {
  const ts = new Date(post?.publishedAt || post?.date || 0).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

function isAdminCredentialValid(env, username, password) {
  const configuredUsername = String(env.ADMIN_USERNAME || 'catcatdo').trim();
  const usernameValid = username ? username === configuredUsername : true;
  const passwordValid = !!env.ADMIN_PASSWORD && password === env.ADMIN_PASSWORD;
  return usernameValid && passwordValid;
}

async function authorizeAdminRequest(request, env) {
  const authHeader = String(request.headers.get('Authorization') || '').trim();
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token && env.JWT_SECRET) {
      const payload = await verifyHmacJwt(token, env.JWT_SECRET);
      if (payload?.role === 'admin') {
        return true;
      }
    }
  }

  const adminPassword = request.headers.get('X-Admin-Password') || '';
  return !!env.ADMIN_PASSWORD && adminPassword === env.ADMIN_PASSWORD;
}

async function createHmacJwt(claims, secret) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    iat: now,
    exp: now + (60 * 60 * 12),
    ...claims
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await signHmacSha256(signingInput, secret);
  return `${signingInput}.${signature}`;
}

async function verifyHmacJwt(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, givenSignature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = await signHmacSha256(signingInput, secret);

  if (!safeEqual(givenSignature, expectedSignature)) {
    return null;
  }

  try {
    const header = JSON.parse(new TextDecoder().decode(base64UrlDecodeToBytes(encodedHeader)));
    if (header?.alg !== 'HS256') return null;
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecodeToBytes(encodedPayload)));
    const now = Math.floor(Date.now() / 1000);
    if (!payload || typeof payload !== 'object') return null;
    if (typeof payload.exp !== 'number' || payload.exp <= now) return null;
    return payload;
  } catch (error) {
    return null;
  }
}

async function signHmacSha256(data, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return base64UrlEncodeBytes(new Uint8Array(signature));
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function fetchNewsHotStocks(env, country, language, companies) {
  const key = env.NEWSDATA_API_KEY;
  if (!key) throw new Error('Missing NEWSDATA_API_KEY');

  const url = new URL('https://newsdata.io/api/1/news');
  url.searchParams.set('apikey', key);
  url.searchParams.set('country', country);
  url.searchParams.set('language', language);
  url.searchParams.set('category', 'business');
  url.searchParams.set('page', '1');

  const response = await fetch(url.toString());
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`NewsData fetch failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  const items = Array.isArray(data.results) ? data.results : [];
  const scores = new Map();

  items.forEach(article => {
    const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
    companies.forEach(company => {
      const matched = company.aliases.some(alias => text.includes(alias));
      if (matched) {
        scores.set(company.symbol, (scores.get(company.symbol) || 0) + 1);
      }
    });
  });

  const ranked = companies
    .map(company => ({
      ...company,
      score: scores.get(company.symbol) || 0
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const symbols = ranked.map(item => item.symbol);
  const quoteMap = await fetchYahooQuotes(symbols);

  return ranked.map(item => {
    const quote = quoteMap[item.symbol] || {};
    return {
      symbol: item.symbol,
      name: item.name,
      price: quote.regularMarketPrice ?? null,
      change: quote.regularMarketChange ?? 0,
      changePercent: quote.regularMarketChangePercent ?? 0
    };
  });
}

function getUsCompanies() {
  return [
    { symbol: 'AAPL', name: 'Apple', aliases: ['apple', '아이폰', '애플'] },
    { symbol: 'MSFT', name: 'Microsoft', aliases: ['microsoft', 'windows', '마이크로소프트'] },
    { symbol: 'NVDA', name: 'NVIDIA', aliases: ['nvidia', '엔비디아'] },
    { symbol: 'AMZN', name: 'Amazon', aliases: ['amazon', '아마존', 'aws'] },
    { symbol: 'GOOGL', name: 'Alphabet', aliases: ['google', 'alphabet', '구글'] },
    { symbol: 'TSLA', name: 'Tesla', aliases: ['tesla', '테슬라'] },
    { symbol: 'META', name: 'Meta', aliases: ['meta', 'facebook', '메타'] },
    { symbol: 'NFLX', name: 'Netflix', aliases: ['netflix', '넷플릭스'] },
    { symbol: 'AMD', name: 'AMD', aliases: ['amd', '라이젠'] },
    { symbol: 'INTC', name: 'Intel', aliases: ['intel', '인텔'] }
  ].map(item => ({ ...item, aliases: item.aliases.map(a => a.toLowerCase()) }));
}

function getKrCompanies() {
  return [
    { symbol: '005930.KS', name: '삼성전자', aliases: ['삼성전자', 'samsung electronics'] },
    { symbol: '000660.KS', name: 'SK하이닉스', aliases: ['sk하이닉스', 'sk hynix'] },
    { symbol: '035420.KS', name: 'NAVER', aliases: ['naver', '네이버'] },
    { symbol: '035720.KS', name: '카카오', aliases: ['kakao', '카카오'] },
    { symbol: '051910.KS', name: 'LG화학', aliases: ['lg화학', 'lg chem'] },
    { symbol: '068270.KS', name: '셀트리온', aliases: ['셀트리온', 'celltrion'] },
    { symbol: '005380.KS', name: '현대차', aliases: ['현대차', 'hyundai motor'] },
    { symbol: '207940.KS', name: '삼성바이오로직스', aliases: ['삼성바이오로직스', 'samsung biolo'] },
    { symbol: '105560.KS', name: 'KB금융', aliases: ['kb금융', 'kb financial'] },
    { symbol: '323410.KS', name: '카카오뱅크', aliases: ['카카오뱅크', 'kakaobank'] }
  ].map(item => ({ ...item, aliases: item.aliases.map(a => a.toLowerCase()) }));
}

async function fetchYahooQuotes(symbols) {
  if (!symbols.length) return {};
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(',')}`;
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Yahoo quote failed: ${response.status} ${text}`);
  }
  const data = await response.json();
  const list = data.quoteResponse?.result || [];
  const map = {};
  list.forEach(item => {
    if (item && item.symbol) {
      map[item.symbol] = item;
    }
  });
  return map;
}

function jsonResponse(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

function normalizePushSubscription(value) {
  if (!value || typeof value !== 'object') return null;
  const endpoint = String(value.endpoint || '').trim();
  const p256dh = String(value?.keys?.p256dh || '').trim();
  const auth = String(value?.keys?.auth || '').trim();
  if (!endpoint || !p256dh || !auth) return null;
  return { endpoint, expirationTime: value.expirationTime || null, keys: { p256dh, auth } };
}

async function buildPushSubscriptionKey(endpoint) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
  return `push:${toHex(new Uint8Array(digest))}`;
}

async function buildEmailSubscriberKey(email) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email.toLowerCase()));
  return `subscriber:${toHex(new Uint8Array(digest))}`;
}

function toHex(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

async function readExistingPosts(env) {
  try {
    const appJwt = await createAppJwt(env.GITHUB_APP_ID, env.GITHUB_APP_PRIVATE_KEY);
    const installationToken = await getInstallationToken(env, appJwt);
    const path = env.POSTS_PATH || 'posts.json';
    const { owner, repo, branch } = getRepoInfo(env);
    const existing = await getFileInfo({ owner, repo, path, branch, token: installationToken });
    if (!existing?.content) return [];
    const raw = atob(String(existing.content).replace(/\n/g, ''));
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
    const json = JSON.parse(new TextDecoder().decode(bytes));
    return Array.isArray(json?.posts) ? json.posts : [];
  } catch (error) {
    return [];
  }
}

function detectNewPosts(previousPosts, nextPosts) {
  const beforeIds = new Set(
    (Array.isArray(previousPosts) ? previousPosts : [])
      .map(post => Number(post?.id))
      .filter(Number.isFinite)
  );

  return (Array.isArray(nextPosts) ? nextPosts : [])
    .filter(post => {
      const id = Number(post?.id);
      const category = String(post?.category || '').trim().toLowerCase();
      if (!Number.isFinite(id) || beforeIds.has(id)) return false;
      if (category === 'template' || category === 'diary') return false;
      return true;
    })
    .sort((a, b) => toDateValue(b?.date) - toDateValue(a?.date));
}

function toDateValue(value) {
  const ts = new Date(value || '').getTime();
  return Number.isFinite(ts) ? ts : 0;
}

function buildBlogRssXml(posts, siteUrl) {
  const base = String(siteUrl || 'https://lilhwang.com').replace(/\/$/, '');
  const blogPosts = (Array.isArray(posts) ? posts : [])
    .filter(post => {
      const category = String(post?.category || '').trim().toLowerCase();
      return category !== 'issue' && category !== 'template' && category !== 'diary';
    })
    .sort((a, b) => toDateValue(b?.date) - toDateValue(a?.date))
    .slice(0, 50);

  const items = blogPosts.map(post => {
    const id = Number(post?.id);
    const title = escapeXml(String(post?.title || '제목 없음'));
    const excerpt = escapeXml(String(post?.excerpt || post?.title || '').slice(0, 220));
    const pubDate = toRfc2822(post?.date);
    const link = `${base}/blog.html#post-${Number.isFinite(id) ? id : ''}`;
    const image = String(post?.image || '').trim();
    const imageUrl = image ? toAbsoluteUrl(image, base) : '';

    let enclosure = '';
    if (imageUrl) {
      enclosure = `<enclosure url="${escapeXml(imageUrl)}" type="image/jpeg" length="0" />`;
    }

    return (
      '<item>' +
      `<title>${title}</title>` +
      `<link>${escapeXml(link)}</link>` +
      `<guid isPermaLink="false">${escapeXml(`blog-${Number.isFinite(id) ? id : title}`)}</guid>` +
      `<description>${excerpt}</description>` +
      `<pubDate>${pubDate}</pubDate>` +
      enclosure +
      '</item>'
    );
  });

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n' +
    '<channel>\n' +
    '<title>릴황 블로그 RSS</title>\n' +
    `<link>${escapeXml(`${base}/blog.html`)}</link>\n` +
    '<description>릴황 블로그 최신 글 피드</description>\n' +
    `<atom:link href="${escapeXml(`${base}/rss.xml`)}" rel="self" type="application/rss+xml" />\n` +
    '<language>ko-KR</language>\n' +
    `<lastBuildDate>${toRfc2822(new Date().toISOString())}</lastBuildDate>\n` +
    `${items.join('\n')}\n` +
    '</channel>\n' +
    '</rss>\n'
  );
}

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toRfc2822(value) {
  const date = new Date(value || '');
  const target = Number.isFinite(date.getTime()) ? date : new Date();
  return target.toUTCString();
}

function toAbsoluteUrl(value, base) {
  const raw = String(value || '').trim();
  if (!raw) return base;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `${base}/${raw.replace(/^\/+/, '')}`;
}

async function broadcastNewPostPush(env, post) {
  if (!env.PUSH_SUBSCRIPTIONS || !env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    return { attempted: 0, sent: 0, failed: 0 };
  }

  const list = await env.PUSH_SUBSCRIPTIONS.list({ prefix: 'push:' });
  const keys = Array.isArray(list?.keys) ? list.keys : [];
  let sent = 0;
  let failed = 0;

  for (const item of keys) {
    try {
      const raw = await env.PUSH_SUBSCRIPTIONS.get(item.name, 'json');
      const subscription = normalizePushSubscription(raw?.subscription);
      if (!subscription) {
        await env.PUSH_SUBSCRIPTIONS.delete(item.name);
        failed += 1;
        continue;
      }

      const status = await sendWebPushWithoutPayload(env, subscription.endpoint);
      if (status >= 200 && status < 300) {
        sent += 1;
      } else {
        failed += 1;
        if (status === 404 || status === 410) {
          await env.PUSH_SUBSCRIPTIONS.delete(item.name);
        }
      }
    } catch (error) {
      failed += 1;
    }
  }

  return { attempted: keys.length, sent, failed };
}

async function sendWebPushWithoutPayload(env, endpoint) {
  const endpointUrl = new URL(endpoint);
  const aud = `${endpointUrl.protocol}//${endpointUrl.host}`;
  const now = Math.floor(Date.now() / 1000);
  const token = await createVapidJwt(env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY, {
    aud,
    exp: now + 12 * 60 * 60,
    sub: env.VAPID_SUBJECT || 'mailto:admin@lilhwang.com'
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      TTL: '60',
      Authorization: `vapid t=${token}, k=${env.VAPID_PUBLIC_KEY}`,
      'Crypto-Key': `p256ecdsa=${env.VAPID_PUBLIC_KEY}`,
      Urgency: 'high'
    }
  });
  return response.status;
}

async function createVapidJwt(publicKeyB64Url, privateKeyB64Url, payload) {
  const header = { alg: 'ES256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const key = await importVapidPrivateKey(publicKeyB64Url, privateKeyB64Url);
  const signatureDer = new Uint8Array(await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(signingInput)
  ));
  const signatureJose = derToJose(signatureDer, 32);
  return `${signingInput}.${base64UrlEncodeBytes(signatureJose)}`;
}

async function importVapidPrivateKey(publicKeyB64Url, privateKeyB64Url) {
  const publicKey = base64UrlDecodeToBytes(publicKeyB64Url);
  if (publicKey.length !== 65 || publicKey[0] !== 0x04) {
    throw new Error('Invalid VAPID public key');
  }
  const x = publicKey.slice(1, 33);
  const y = publicKey.slice(33, 65);

  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    d: bytesToBase64Url(base64UrlDecodeToBytes(privateKeyB64Url)),
    x: bytesToBase64Url(x),
    y: bytesToBase64Url(y),
    ext: true
  };

  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
}

function derToJose(signatureDer, size) {
  const bytes = signatureDer;
  let offset = 0;
  if (bytes[offset++] !== 0x30) throw new Error('Invalid DER signature');
  offset += bytes[offset] > 0x7f ? 1 + (bytes[offset] & 0x7f) : 1;
  if (bytes[offset++] !== 0x02) throw new Error('Invalid DER signature');
  const rLen = bytes[offset++];
  let r = bytes.slice(offset, offset + rLen);
  offset += rLen;
  if (bytes[offset++] !== 0x02) throw new Error('Invalid DER signature');
  const sLen = bytes[offset++];
  let s = bytes.slice(offset, offset + sLen);

  if (r.length > size) r = r.slice(r.length - size);
  if (s.length > size) s = s.slice(s.length - size);
  if (r.length < size) r = concatBytes(new Uint8Array(size - r.length), r);
  if (s.length < size) s = concatBytes(new Uint8Array(size - s.length), s);
  return concatBytes(r, s);
}

function concatBytes(a, b) {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

function base64UrlDecodeToBytes(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
    + '='.repeat((4 - (value.length % 4 || 4)) % 4);
  const raw = atob(normalized);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

function bytesToBase64Url(bytes) {
  return base64UrlEncodeBytes(bytes);
}

async function sendNewPostEmails(env, newPosts) {
  if (!env.NEWSLETTER_SUBSCRIBERS || !env.RESEND_API_KEY || !env.EMAIL_FROM) {
    return { attempted: 0, sent: 0, failed: 0 };
  }

  const subscribers = await listSubscriberEmails(env);
  if (!subscribers.length) {
    return { attempted: 0, sent: 0, failed: 0 };
  }

  const latest = newPosts[0];
  const siteUrl = (env.SITE_URL || 'https://lilhwang.com').replace(/\/$/, '');
  const postUrl = `${siteUrl}/blog.html#post-${encodeURIComponent(String(latest?.id || ''))}`;
  const title = String(latest?.title || '새 글');
  const excerpt = String(latest?.excerpt || '').slice(0, 240);
  const subjectPrefix = env.EMAIL_SUBJECT_PREFIX || '[릴황 블로그]';
  const subject = `${subjectPrefix} 새 글이 발행되었습니다: ${title}`;
  const html = [
    '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">',
    `<h2 style="margin:0 0 12px;">${escapeXml(title)}</h2>`,
    `<p style="margin:0 0 14px;">${escapeXml(excerpt || '새 글이 발행되었습니다. 아래 링크에서 확인하세요.')}</p>`,
    `<p style="margin:0 0 16px;"><a href="${escapeXml(postUrl)}">글 보러 가기</a></p>`,
    '<hr style="border:none;border-top:1px solid #ddd;margin:18px 0;">',
    `<p style="font-size:12px;color:#666;margin:0;">수신 거부는 문의 메일로 요청해 주세요.</p>`,
    '</div>'
  ].join('');

  let sent = 0;
  let failed = 0;
  for (const email of subscribers.slice(0, 1000)) {
    try {
      const ok = await sendEmailViaResend(env, { to: email, subject, html });
      if (ok) sent += 1;
      else failed += 1;
    } catch (error) {
      failed += 1;
    }
  }

  return { attempted: Math.min(subscribers.length, 1000), sent, failed };
}

async function sendEmailViaResend(env, { to, subject, html }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [to],
      subject,
      html
    })
  });
  return response.ok;
}

async function listSubscriberEmails(env) {
  const list = await env.NEWSLETTER_SUBSCRIBERS.list({ prefix: 'subscriber:' });
  const keys = Array.isArray(list?.keys) ? list.keys : [];
  const emails = [];
  for (const item of keys) {
    const payload = await env.NEWSLETTER_SUBSCRIBERS.get(item.name, 'json');
    const email = String(payload?.email || '').trim().toLowerCase();
    if (isValidEmail(email)) emails.push(email);
  }
  return [...new Set(emails)];
}

async function savePostsToGithub(env, content, commitMessage) {
  return saveTextFileToGithub(env, env.POSTS_PATH || 'posts.json', content, commitMessage);
}

async function saveTextFileToGithub(env, path, content, commitMessage) {
  const appJwt = await createAppJwt(env.GITHUB_APP_ID, env.GITHUB_APP_PRIVATE_KEY);
  const installationToken = await getInstallationToken(env, appJwt);
  const { owner, repo, branch } = getRepoInfo(env);

  const existing = await getFileInfo({ owner, repo, path, branch, token: installationToken });
  const encoded = base64Encode(new TextEncoder().encode(content));

  const body = {
    message: commitMessage,
    content: encoded,
    branch
  };

  if (existing && existing.sha) {
    body.sha = existing.sha;
  }

  const updateResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${installationToken}`,
      'Accept': 'application/vnd.github+json'
    },
    body: JSON.stringify(body)
  });

  if (!updateResponse.ok) {
    const text = await updateResponse.text();
    throw new Error(`GitHub update failed: ${updateResponse.status} ${text}`);
  }

  const result = await updateResponse.json();
  const commitSha = result.commit?.sha;
  const commitUrl = commitSha
    ? `https://github.com/${owner}/${repo}/commit/${commitSha}`
    : null;
  return { commit: commitSha, commitUrl };
}

async function getFileInfo({ owner, repo, path, branch, token }) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json'
    }
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub read failed: ${response.status} ${text}`);
  }

  return response.json();
}

function getRepoInfo(env) {
  const owner = env.GITHUB_OWNER || 'catcatdo';
  const repo = env.GITHUB_REPO || 'catcatbuilder';
  const branch = env.GITHUB_BRANCH || 'main';
  return { owner, repo, branch };
}

async function getInstallationToken(env, appJwt) {
  if (!env.GITHUB_INSTALLATION_ID) {
    throw new Error('Missing GITHUB_INSTALLATION_ID');
  }

  const response = await fetch(`https://api.github.com/app/installations/${env.GITHUB_INSTALLATION_ID}/access_tokens`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${appJwt}`,
      'Accept': 'application/vnd.github+json'
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Installation token failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  if (!data.token) {
    throw new Error('Installation token missing in response');
  }

  return data.token;
}

async function createAppJwt(appId, privateKeyPem) {
  if (!appId || !privateKeyPem) {
    throw new Error('Missing GitHub App credentials');
  }

  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60,
    exp: now + 600,
    iss: appId
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;

  const key = await importPrivateKey(privateKeyPem);
  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(data)
  );

  const sigB64 = base64UrlEncodeBytes(new Uint8Array(signature));
  return `${data}.${sigB64}`;
}

async function importPrivateKey(pem) {
  const pemBody = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '');

  const binary = base64Decode(pemBody);
  return crypto.subtle.importKey(
    'pkcs8',
    binary,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

function base64UrlEncode(value) {
  return base64UrlEncodeBytes(new TextEncoder().encode(value));
}

function base64UrlEncodeBytes(bytes) {
  return base64Encode(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64Encode(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64Decode(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
