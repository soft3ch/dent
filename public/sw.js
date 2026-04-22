const CACHE_NAME = 'serenity-dental-v1';
const DASHBOARD_SCOPE = '/dashboard';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { url } = event.request;
  const isDashboard = url.includes(DASHBOARD_SCOPE);
  const isSupabaseAPI = url.includes('supabase.co');
  const isRelevantAPI = isSupabaseAPI && (url.includes('appointments') || url.includes('patients') || url.includes('treatments'));

  if (isDashboard || isRelevantAPI) {
    // Intercept and handle cache-then-network or other strategy if needed
    // For now, we just ensure it's "intercepted" by the service worker
    // A simple network-first strategy for dynamic data
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
  }
});
