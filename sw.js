/* App del panel Muebles Ideal: guarda las pantallas para abrir rápido.
   Las páginas se buscan primero en internet (así siempre ves la última versión);
   si no hay señal, se abre la copia guardada. Los datos (Firebase) no se guardan aquí. */
const VERSION = "mi-panel-v2";
const ARCHIVOS = ["./", "index.html", "contabilidad.html", "personal.html", "catalogo.html", "planos.html", "menu.js", "estructura.js",
  "logo-mark.png", "logo-mark-blanco.png", "logo-v.png", "icono-192.png", "icono-512.png", "apple-touch-icon.png", "manifest.webmanifest"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => { if (res.ok) { const copia = res.clone(); caches.open(VERSION).then(c => c.put(r, copia)); } return res; })
    .catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match("index.html"))));
});
