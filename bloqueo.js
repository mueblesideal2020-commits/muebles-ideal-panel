/* Bloqueo con Face ID / huella / patrón para la app de Muebles Ideal.
   Usa el desbloqueo del propio teléfono (passkeys / WebAuthn). Se activa en cada teléfono, por usuario.
   Es un candado de la app en ese teléfono: la contraseña de siempre sigue funcionando como respaldo.
   Se carga justo después de <body> para tapar la pantalla antes de que se vea nada. */
(function () {
  var CLAVE = "mi-bloqueo", SES = "mi-desbloqueado", OCULTO = "mi-oculto", MINUTOS = 2;
  var lee = function (k, s) { try { return JSON.parse((s || localStorage).getItem(k) || "null"); } catch (e) { return null; } };
  var pon = function (k, v, s) { try { (s || localStorage).setItem(k, JSON.stringify(v)); } catch (e) {} };
  var quita = function (k, s) { try { (s || localStorage).removeItem(k); } catch (e) {} };
  var b64 = function (buf) { var s = "", a = new Uint8Array(buf); for (var i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
  var deb64 = function (t) { t = t.replace(/-/g, "+").replace(/_/g, "/"); while (t.length % 4) t += "="; var s = atob(t), a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; };
  var azar = function (n) { var a = new Uint8Array(n); crypto.getRandomValues(a); return a; };
  var esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var NOMBRE = esIOS ? "Face ID" : "huella o patrón";

  var cfg = lee(CLAVE);                 // { email, cred } si este teléfono tiene el bloqueo activo
  var usuario = null, vioSinSesion = false, capa = null, pidiendo = null;
  var desbloqueado = function () { return !!lee(SES, sessionStorage); };
  var marcarDesbloqueo = function () { pon(SES, Date.now(), sessionStorage); };

  /* ---------- Pantalla de bloqueo ---------- */
  var css = document.createElement("style");
  css.textContent = ".mi-lock{position:fixed;inset:0;z-index:9999;background:#3a63d9;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:24px;text-align:center;font-family:Karla,system-ui,sans-serif}"
    + ".mi-lock img{width:120px;height:auto}.mi-lock h1{font-family:Lexend,system-ui,sans-serif;font-weight:500;font-size:1.3rem;margin:0;letter-spacing:.04em}"
    + ".mi-lock p{margin:0;color:#dbe6ff;max-width:300px;font-size:.95rem}.mi-lock button{font:inherit;cursor:pointer;border-radius:999px;min-height:50px;padding:12px 26px}"
    + ".mi-lock .ok{background:#fff;color:#2a4fbd;border:0;font-family:Lexend,system-ui,sans-serif;font-weight:500;font-size:1rem;display:inline-flex;align-items:center;gap:10px}"
    + ".mi-lock .ok svg{width:22px;height:22px}.mi-lock .alt{background:none;border:1px solid rgba(255,255,255,.45);color:#fff;font-size:.9rem;min-height:42px}"
    + ".mi-lock .err{color:#ffd9d4;min-height:1.3em;font-size:.9rem}";
  document.head.appendChild(css);
  var ICONO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3H5a2 2 0 0 0-2 2v2M17 3h2a2 2 0 0 1 2 2v2M7 21H5a2 2 0 0 1-2-2v-2M17 21h2a2 2 0 0 0 2-2v-2"/><path d="M9 9v1M15 9v1M12 9v4h-1M9 16c1.6 1.2 4.4 1.2 6 0"/></svg>';

  function mostrar() {
    if (capa || !cfg) return;
    capa = document.createElement("div");
    capa.className = "mi-lock"; capa.setAttribute("role", "dialog"); capa.setAttribute("aria-modal", "true"); capa.setAttribute("aria-label", "App bloqueada");
    capa.innerHTML = '<img src="logo-mark-blanco.png" alt=""><h1>MUEBLES IDEAL</h1><p>La app está bloqueada en este teléfono.</p>'
      + '<button type="button" class="ok" id="mi-lock-ok">' + ICONO + 'Desbloquear con ' + NOMBRE + '</button>'
      + '<p class="err" id="mi-lock-err" aria-live="polite"></p>'
      + '<button type="button" class="alt" id="mi-lock-pass">Entrar con mi contraseña</button>';
    (document.body || document.documentElement).appendChild(capa);
    document.documentElement.style.overflow = "hidden";
    document.getElementById("mi-lock-ok").addEventListener("click", desbloquear);
    document.getElementById("mi-lock-pass").addEventListener("click", conContrasena);
    setTimeout(desbloquear, 350);   // intenta de una vez; si el teléfono pide tocar, queda el botón
  }
  function ocultar() { if (capa) { capa.remove(); capa = null; document.documentElement.style.overflow = ""; } }
  function error(t) { var e = document.getElementById("mi-lock-err"); if (e) e.textContent = t; }

  function desbloquear() {
    if (!cfg) return; error("");
    if (pidiendo) { try { pidiendo.abort(); } catch (e) {} }        // si quedó un intento pendiente, empieza de nuevo
    var ctl = window.AbortController ? new AbortController() : null; pidiendo = ctl || true;
    navigator.credentials.get({ signal: ctl ? ctl.signal : undefined, publicKey: { challenge: azar(32), timeout: 60000, userVerification: "required",
      allowCredentials: [{ type: "public-key", id: deb64(cfg.cred), transports: ["internal", "hybrid"] }] } })
      .then(function (c) { if (pidiendo === (ctl || true)) pidiendo = null; if (c) { marcarDesbloqueo(); ocultar(); } })
      .catch(function (e) { if (pidiendo === (ctl || true)) pidiendo = null; if (e && e.name === "AbortError") return;
        if (e && e.name !== "NotAllowedError") console.error(e);
        error(e && e.name === "NotAllowedError" ? "" : "No se pudo verificar. Inténtalo de nuevo o entra con tu contraseña."); });
  }
  function conContrasena() {
    quita(SES, sessionStorage);
    var fin = function () { location.href = location.pathname.indexOf("personal.html") >= 0 ? "personal.html" : "index.html"; };
    try { if (window.firebase && firebase.auth) return firebase.auth().signOut().then(fin, fin); } catch (e) {}
    fin();
  }

  /* Tapa la pantalla de inmediato si este teléfono tiene bloqueo y aún no se desbloqueó en esta sesión */
  if (cfg && !desbloqueado()) mostrar();

  /* Al volver a la app después de un rato, se vuelve a bloquear */
  document.addEventListener("visibilitychange", function () {
    if (!cfg) return;
    if (document.visibilityState === "hidden") pon(OCULTO, Date.now(), sessionStorage);
    else { var t = lee(OCULTO, sessionStorage); if (t && Date.now() - t > MINUTOS * 60000 && usuario) { quita(SES, sessionStorage); mostrar(); } }
  });

  /* Se engancha a la sesión de Firebase cuando esté lista */
  function conectar() {
    if (!(window.firebase && firebase.apps && firebase.apps.length && firebase.auth)) return setTimeout(conectar, 120);
    firebase.auth().onAuthStateChanged(function (u) {
      usuario = u;
      if (!u) { vioSinSesion = true; ocultar(); return; }                 // sin sesión: la pantalla de inicio pide la contraseña
      var em = (u.email || "").toLowerCase();
      if (!cfg || cfg.email !== em) { ocultar(); return; }               // otro usuario en este teléfono: no aplica
      if (vioSinSesion) { marcarDesbloqueo(); ocultar(); return; }        // acaba de entrar con su contraseña
      if (!desbloqueado()) mostrar();
    });
  }
  conectar();

  /* ---------- Para activar / desactivar desde la app ---------- */
  window.MI_BLOQUEO = {
    nombre: NOMBRE,
    soportado: function () {
      if (!(window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable)) return Promise.resolve(false);
      return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().catch(function () { return false; });
    },
    activo: function () { var u = usuario || (window.firebase && firebase.apps && firebase.apps.length && firebase.auth().currentUser);
      return !!(cfg && u && cfg.email === (u.email || "").toLowerCase()); },
    activar: function () {
      var u = window.firebase && firebase.auth().currentUser; if (!u) return Promise.reject(new Error("sin sesión"));
      var em = (u.email || "").toLowerCase();
      return navigator.credentials.create({ publicKey: {
        challenge: azar(32), rp: { name: "Muebles Ideal" },
        user: { id: azar(16), name: em, displayName: u.displayName || em },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "preferred" },
        timeout: 60000, attestation: "none" } })
        .then(function (c) { cfg = { email: em, cred: b64(c.rawId), desde: Date.now() }; pon(CLAVE, cfg); marcarDesbloqueo(); return true; });
    },
    desactivar: function () { cfg = null; quita(CLAVE); return Promise.resolve(true); },
    /* Bloque listo para pintar en Inicio (panel) o en Perfil (portal) */
    bloqueHTML: function (cls) {
      return '<div class="' + (cls || "") + '" id="mi-bloqueo-ui"><h2 style="font-size:1.05rem;margin:0 0 6px">Bloqueo con ' + NOMBRE + '</h2>'
        + '<p id="mi-bl-txt" style="margin:0 0 12px;color:#6a655d;font-size:.92rem">Revisando este teléfono…</p>'
        + '<button type="button" class="btn oro" id="mi-bl-btn" hidden></button><p id="mi-bl-msg" style="margin:10px 0 0;font-size:.88rem" aria-live="polite"></p></div>';
    },
    conectarUI: function () {
      var txt = document.getElementById("mi-bl-txt"), btn = document.getElementById("mi-bl-btn"), msg = document.getElementById("mi-bl-msg"), self = this;
      if (!txt) return;
      var pintar = function () {
        self.soportado().then(function (ok) {
          if (!ok) { txt.textContent = esIOS ? "Para usar Face ID, instala la app en la pantalla de inicio (Compartir → Agregar a pantalla de inicio) y ábrela desde el ícono." : "Este teléfono no tiene huella ni bloqueo de pantalla disponible para la app."; btn.hidden = true; return; }
          var on = self.activo();
          txt.innerHTML = on ? "<b>Activo en este teléfono.</b> Al abrir la app te pide " + NOMBRE + " antes de mostrar nada. Si falla, puedes entrar con tu contraseña."
            : "Pide " + NOMBRE + " cada vez que abras la app en este teléfono, para que nadie más vea tus datos si toma tu teléfono.";
          btn.textContent = on ? "Desactivar bloqueo" : "Activar bloqueo con " + NOMBRE;
          btn.className = on ? "btn borde" : "btn oro"; btn.hidden = false;
        });
      };
      btn.addEventListener("click", function () {
        msg.textContent = ""; msg.style.color = "";
        var p = self.activo() ? self.desactivar() : self.activar();
        btn.disabled = true;
        p.then(function () { msg.textContent = self.activo() ? "Listo. La próxima vez que abras la app te pedirá " + NOMBRE + "." : "Bloqueo desactivado en este teléfono."; msg.style.color = "#2e7d32"; })
         .catch(function (e) { console.error(e); msg.style.color = "#b3261e"; msg.textContent = e && e.name === "NotAllowedError" ? "Se canceló. Vuelve a intentarlo." : "No se pudo activar en este teléfono."; })
         .then(function () { btn.disabled = false; pintar(); });
      });
      pintar();
    }
  };
})();
