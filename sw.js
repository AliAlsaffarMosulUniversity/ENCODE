// عامل الخدمة: يتيح العمل دون إنترنت بعد أول زيارة
const V = 'encode-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  // لا نتدخل في قاعدة البيانات ولا في صفحة النتائج
  if (/googleapis\.com$|firebaseio\.com$|firestore|identitytoolkit|securetoken/.test(u.hostname) && !/fonts\./.test(u.hostname)) return;
  if (u.pathname.endsWith('results.html')) return;
  e.respondWith(
    caches.open(V).then(async c => {
      const hit = await c.match(r, { ignoreSearch: true });
      const net = fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(r, res.clone()); return res; }).catch(() => null);
      if (hit) { net.catch(() => {}); return hit; }
      const res = await net;
      return res || (r.mode === 'navigate' ? c.match('index.html') : Response.error());
    })
  );
});
