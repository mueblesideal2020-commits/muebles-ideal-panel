/* App del panel Muebles Ideal: guarda las pantallas para abrir rápido.
   Las páginas se buscan primero en internet (así siempre ves la última versión);
   si no hay señal, se abre la copia guardada. Los datos (Firebase) no se guardan aquí. */
const VERSION = "mi-panel-v6";
const ARCHIVOS = ["./", "index.html", "contabilidad.html", "personal.html", "catalogo.html", "planos.html", "documentos.html", "menu.js", "estructura.js",
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

/* Notificaciones: avisos de pago y recordatorios que envía el encargado (llegan por Firebase Cloud Messaging) */
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) { d = { notification: { body: e.data && e.data.text() } }; }
  const n = d.notification || {}, data = d.data || {};
  const titulo = n.title || data.titulo || "Muebles Ideal", url = data.url || (d.fcmOptions && d.fcmOptions.link) || "personal.html#avisos";
  e.waitUntil(self.registration.showNotification(titulo, { body: n.body || data.texto || "Tienes un aviso nuevo.", icon: "icono-192.png", badge: "icono-192.png",
    tag: data.id || undefined, data: { url } }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "personal.html#avisos", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(ws => {
    const w = ws.find(c => c.url.includes("personal.html"));
    if (w) return w.focus().then(c => c && c.navigate ? c.navigate(url) : null).catch(() => self.clients.openWindow(url));
    return self.clients.openWindow(url);
  }));
});
