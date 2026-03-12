const STATIC_CACHE = 'catcat-static-v1';
const DYNAMIC_CACHE = 'catcat-dynamic-v1';
const OFFLINE_PAGE = '/offline.html';

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/posts.json',
  '/api/posts.json',
  '/images/blog-fallback.svg',
  '/images/icons/icon-192.svg',
  '/images/icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(CORE_ASSETS);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
        .map((name) => caches.delete(name))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(handleNavigate(event.request));
    return;
  }

  if (isJsonRequest(url.pathname)) {
    event.respondWith(networkFirst(event.request, DYNAMIC_CACHE));
    return;
  }

  event.respondWith(cacheFirst(event.request, STATIC_CACHE));
});

self.addEventListener('push', (event) => {
  event.waitUntil(showLatestPostNotification());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/blog.html';
  event.waitUntil(openOrFocus(targetUrl));
});

async function handleNavigate(request) {
  try {
    const networkResponse = await fetch(request);
    const dynamicCache = await caches.open(DYNAMIC_CACHE);
    dynamicCache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (_) {
    const cachedPage = await caches.match(request);
    if (cachedPage) return cachedPage;
    const cachedHome = await caches.match('/index.html');
    if (cachedHome) return cachedHome;
    return caches.match(OFFLINE_PAGE);
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
    return response;
  } catch (_) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw _;
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  const cache = await caches.open(cacheName);
  cache.put(request, response.clone());
  return response;
}

function isJsonRequest(pathname) {
  return pathname.endsWith('.json') || pathname.startsWith('/api/');
}

async function showLatestPostNotification() {
  const fallback = {
    title: '새 글이 발행되었습니다',
    body: '최신 포스트를 확인해보세요.',
    url: '/blog.html'
  };

  try {
    const response = await fetch('/posts.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json();
    const posts = Array.isArray(payload?.posts) ? payload.posts : [];
    const blogPosts = posts
      .filter((post) => {
        const category = String(post?.category || '').trim().toLowerCase();
        return category !== 'issue' && category !== 'template' && category !== 'diary';
      })
      .sort((a, b) => toTime(b?.date) - toTime(a?.date));

    const latest = blogPosts[0];
    if (!latest) {
      await self.registration.showNotification(fallback.title, {
        body: fallback.body,
        data: { url: fallback.url },
        icon: '/images/blog-fallback.svg',
        badge: '/images/blog-fallback.svg',
        tag: 'new-post'
      });
      return;
    }

    const postId = String(latest.id || '').trim();
    const url = postId ? `/blog.html#post-${encodeURIComponent(postId)}` : '/blog.html';

    await self.registration.showNotification('새 글이 올라왔어요', {
      body: String(latest.title || '최신 글을 확인해보세요.'),
      data: { url },
      icon: '/images/blog-fallback.svg',
      badge: '/images/blog-fallback.svg',
      tag: `post-${postId || 'latest'}`,
      renotify: true
    });
  } catch (_) {
    await self.registration.showNotification(fallback.title, {
      body: fallback.body,
      data: { url: fallback.url },
      icon: '/images/blog-fallback.svg',
      badge: '/images/blog-fallback.svg',
      tag: 'new-post'
    });
  }
}

async function openOrFocus(url) {
  const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of allClients) {
    const clientUrl = new URL(client.url);
    if (clientUrl.origin === self.location.origin && 'focus' in client) {
      client.navigate(url);
      return client.focus();
    }
  }
  if (clients.openWindow) {
    return clients.openWindow(url);
  }
  return null;
}

function toTime(value) {
  const ts = new Date(value || '').getTime();
  return Number.isFinite(ts) ? ts : 0;
}
