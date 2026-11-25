/* Chat en línea de Muebles Ideal.
   · Página de ventas: el cliente escribe sin cuenta (acceso anónimo de Firebase).
   · App de empleados: cada empleado escribe al dueño desde su teléfono.
   · Panel (dueño y equipo): ven todas las conversaciones y responden.
   · Chats privados: cualquier persona del equipo abre un "Nuevo chat" con otra; solo esas dos lo ven.
   · En todos se pueden adjuntar fotos y PDF.

   Firestore (las reglas están en reglas-firestore.txt):
   conversaciones/{id}   id = "c_" + uid del cliente  ·  "e_" + correo del empleado
     tipo ("visitante" | "empleado"), nombre, contacto, actualizada, ultimo,
     ultimoDe ("cliente" | "equipo"),
     noLeidaStaff  → el equipo tiene algo sin leer
     noLeidaParte  → quien escribió tiene una respuesta sin leer
   conversaciones/{id}/mensajes/{id}   texto, de ("cliente" | "equipo"), autor, creado, [adjunto]
   conversaciones/{id}/adjuntos/{id}   datos (archivo completo), tipo, nombre

   privados/{id}   id = "p_" + los dos correos en orden alfabético, unidos por "__"
     participantes [correo, correo], nombres [nombre, nombre], actualizada, ultimo, ultimoDe (correo),
     pendientes [correos que tienen algo sin leer]
   privados/{id}/mensajes/{id}   texto, de (correo), autor, creado, [adjunto]
   privados/{id}/adjuntos/{id}   datos, tipo, nombre

   directorio/{correo}   nombre, rol  → a quién se le puede escribir en "Nuevo chat"

   adjunto (dentro del mensaje) = { id, nombre, tipo ("img" | "pdf"), peso, mini (miniatura) } */
(function () {
  "use strict";

  var LIMITE = 1000;
  var WHATSAPP = "584149442672";
  var MAX_PDF = 650000;          /* bytes: el archivo completo debe caber en un documento */

  /* ---------- Ayudas ---------- */
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fecha(t) {
    if (!t) return null;
    if (t.toDate) return t.toDate();
    if (t.seconds != null) return new Date(t.seconds * 1000);
    var d = new Date(t);
    return isNaN(d) ? null : d;
  }
  function hora(t) {
    var d = fecha(t);
    if (!d) return "";
    return d.toDateString() === new Date().toDateString()
      ? d.toLocaleTimeString("es-VE", { hour: "numeric", minute: "2-digit" })
      : d.toLocaleDateString("es-VE", { day: "numeric", month: "short" });
  }
  function seg(t) { var d = fecha(t); return d ? d.getTime() : 0; }
  function leer(k) { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }
  function guardar(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function limpio(s) { return String(s == null ? "" : s).trim().slice(0, LIMITE); }
  function resumen(s) { return limpio(s).replace(/\s+/g, " ").slice(0, 140); }
  function resumenCon(t, adj) { return t ? resumen(t) : adj ? (adj.tipo === "img" ? "📷 Foto" : "📄 " + adj.nombre).slice(0, 140) : ""; }
  function datos(d) { return d.data({ serverTimestamps: "estimate" }); }
  function peso(n) { return n > 1048576 ? (n / 1048576).toFixed(1).replace(".", ",") + " MB" : Math.max(1, Math.round(n / 1024)) + " KB"; }
  function inicial(s) { return (String(s || "?").trim().charAt(0) || "?").toUpperCase(); }
  function idPrivado(a, b) { return "p_" + [a, b].sort().join("__"); }
  var ICO_CLIP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.5 12.5 21a5 5 0 0 1-7-7L14 5.5a3.3 3.3 0 0 1 4.7 4.7L10 18.9a1.7 1.7 0 0 1-2.4-2.4L15.5 8.6"/></svg>';
  var ICO_DOC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/></svg>';
  var ICO_CANDADO = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

  /* ---------- Archivos adjuntos: fotos comprimidas o PDF pequeños ---------- */
  function leerURL(f) { return new Promise(function (ok, no) { var r = new FileReader(); r.onload = function () { ok(r.result); }; r.onerror = no; r.readAsDataURL(f); }); }
  function cargarImg(url) { return new Promise(function (ok, no) { var im = new Image(); im.onload = function () { ok(im); }; im.onerror = no; im.src = url; }); }
  function aJPG(im, lado, q, tope) {
    var k = Math.min(1, lado / Math.max(im.width, im.height)), c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k));
    var x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
    var url = c.toDataURL("image/jpeg", q);
    while (url.length > tope && q > .35) { q -= .08; url = c.toDataURL("image/jpeg", q); }
    return url;
  }
  function prepararAdjunto(f) {
    var esPdf = f.type === "application/pdf" || /\.pdf$/i.test(f.name || "");
    if (esPdf) {
      if (f.size > MAX_PDF) return Promise.reject(new Error("El PDF pesa " + peso(f.size) + ". El máximo es " + peso(MAX_PDF) + ": mejor envía una foto."));
      return leerURL(f).then(function (u) { return { nombre: f.name || "documento.pdf", tipo: "pdf", peso: f.size, datos: u, mini: "" }; });
    }
    if (!/^image\//.test(f.type)) return Promise.reject(new Error("Solo se pueden enviar fotos o PDF."));
    return leerURL(f).then(cargarImg).then(function (im) {
      var d = aJPG(im, 1600, .82, 620000), m = aJPG(im, 360, .7, 36000);
      return { nombre: (f.name || "foto").replace(/\.[^.]+$/, "") + ".jpg", tipo: "img", peso: Math.round(d.length * .75), datos: d, mini: m };
    });
  }
  /* Abre un adjunto: foto en pantalla completa; PDF se comparte o se abre */
  function abrirAdjunto(baseRef, a) {
    var v = document.createElement("div");
    v.className = "mc-visor"; v.setAttribute("role", "dialog"); v.setAttribute("aria-modal", "true");
    v.innerHTML = '<div class="mc-visor-in"><div class="mc-visor-top"><b>' + esc(a.nombre) + '</b><button type="button" class="mc-x2" aria-label="Cerrar">×</button></div>' +
      '<div class="mc-visor-cont"><p class="mc-aviso">Abriendo…</p></div><div class="mc-visor-acc"></div></div>';
    document.body.appendChild(v);
    var url = "";
    function cerrar() { v.remove(); if (url) URL.revokeObjectURL(url); }
    v.addEventListener("click", function (e) { if (e.target === v || e.target.closest(".mc-x2")) cerrar(); });
    baseRef.collection("adjuntos").doc(a.id).get().then(function (s) {
      if (!s.exists) throw new Error("no existe");
      return fetch(s.data().datos).then(function (r) { return r.blob(); });
    }).then(function (blob) {
      url = URL.createObjectURL(blob);
      v.querySelector(".mc-visor-cont").innerHTML = a.tipo === "img" ? '<img src="' + url + '" alt="">' : '<p class="mc-aviso">' + ICO_DOC + "<br>Documento PDF · " + peso(blob.size) + "</p>";
      var acc = v.querySelector(".mc-visor-acc");
      acc.innerHTML = '<button type="button" class="mc-btn">' + (a.tipo === "pdf" ? "Abrir PDF" : "Guardar o compartir") + "</button>";
      acc.firstChild.addEventListener("click", function () {
        var file = new File([blob], a.nombre, { type: blob.type });
        if (navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: a.nombre }).catch(function () {}); return; }
        var l = document.createElement("a"); l.href = url; l.target = "_blank"; l.rel = "noopener"; if (a.tipo !== "pdf") l.download = a.nombre;
        document.body.appendChild(l); l.click(); l.remove();
      });
    }).catch(function (err) {
      console.warn("chat", err);
      v.querySelector(".mc-visor-cont").innerHTML = '<p class="mc-aviso">No se pudo abrir el archivo.</p>';
    });
  }

  /* ---------- Estilos (se inyectan una sola vez) ---------- */
  var CSS = [
    /* Botón flotante y ventana del cliente (página de ventas: siempre clara) */
    ".mc-launch{position:fixed;right:calc(18px + env(safe-area-inset-right,0px));bottom:calc(88px + env(safe-area-inset-bottom,0px));z-index:26;width:56px;height:56px;padding:0;border:0;border-radius:50%;background:#2a5bd7;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(0,0,0,.25);cursor:pointer}",
    ".mc-launch svg{width:26px;height:26px}",
    ".mc-dot{position:absolute;top:-2px;right:-2px;width:15px;height:15px;border-radius:50%;background:#c0392b;border:2px solid #fff;box-sizing:border-box}",
    ".mc-box{position:fixed;right:calc(12px + env(safe-area-inset-right,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:27;width:min(380px,calc(100vw - 24px));height:min(580px,calc(100vh - 110px));display:flex;flex-direction:column;background:#fff;color:#1d1b18;border-radius:20px;box-shadow:0 12px 40px rgba(0,0,0,.3);overflow:hidden;font:15px/1.4 system-ui,'Helvetica Neue',Arial,sans-serif;text-align:left}",
    ".mc-head{display:flex;align-items:center;gap:10px;padding:14px 10px 14px 16px;background:linear-gradient(135deg,#0c2572,#2a5bd7);color:#fff;flex:0 0 auto}",
    ".mc-head b{display:block;font-size:15px}",
    ".mc-head small{display:block;font-size:12px;color:#dbe6ff;margin-top:2px}",
    ".mc-x{margin-left:auto;width:40px;height:40px;padding:0;border:0;background:transparent;color:#fff;font-size:26px;line-height:1;cursor:pointer}",
    ".mc-intro{display:flex;flex-direction:column;gap:12px;padding:16px;overflow-y:auto}",
    ".mc-intro label{display:flex;flex-direction:column;gap:5px;font-size:13px;font-weight:600;color:#3d382f}",
    ".mc-aviso{margin:0;padding:10px 14px;font-size:14px;color:#5b5548;text-align:center}",
    ".mc-aviso svg{width:40px;height:40px}",
    ".mc-aviso a{color:#2a5bd7;font-weight:700}",
    ".mc-btn{align-self:flex-start;min-height:44px;padding:10px 18px;border:0;border-radius:999px;background:#2a5bd7;color:#fff;font-weight:700;cursor:pointer;font:inherit;font-weight:700}",
    ".mc-intro input,.mc-form input[type=text],.mc-form input:not([type]){width:100%;min-width:0;box-sizing:border-box;padding:11px 12px;border:1px solid #bccbe6;border-radius:10px;background:#fff;color:#141414;font:inherit}",
    ".mc-form{display:flex;gap:6px;align-items:center;padding:10px;background:#fff;border-top:1px solid #e1e6f7;flex:0 0 auto}",
    ".mc-form input:not([type=file]){flex:1;border-radius:999px}",
    ".mc-form button[type=submit]{flex:0 0 auto;min-height:44px;padding:0 16px;border:0;border-radius:999px;background:#f7c543;color:#0c2572;font-weight:700;cursor:pointer}",
    ".mc-form button:disabled{opacity:.5}",
    /* Botón del clip y vista previa del archivo */
    ".mc-clip{position:relative;flex:0 0 auto;width:42px;height:42px;border-radius:50%;display:grid;place-items:center;color:#2a5bd7;cursor:pointer;background:#e9efff}",
    ".mc-clip svg{width:20px;height:20px}",
    ".mc-clip input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}",
    ".mc-prev{display:flex;align-items:center;gap:10px;margin:0 10px 0;padding:8px 8px 8px 10px;border-radius:14px;background:#e9efff;color:#0f1a3d;font-size:13px}",
    ".mc-prev .mc-pi{width:40px;height:40px;flex:none;border-radius:10px;background:#fff center/cover;display:grid;place-items:center;color:#2a5bd7}",
    ".mc-prev .mc-pi svg{width:20px;height:20px}",
    ".mc-prev span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".mc-prev small{display:block;opacity:.7}",
    ".mc-prev button{flex:none;width:32px;height:32px;border:0;border-radius:50%;background:none;font-size:20px;cursor:pointer;color:inherit}",
    ".mc-msgs{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;gap:8px;overflow-y:auto;padding:14px;background:#eff1fe}",
    ".mc-m{max-width:82%;padding:9px 12px;border-radius:16px;font-size:15px;white-space:pre-wrap;overflow-wrap:anywhere}",
    ".mc-m.yo{align-self:flex-end;background:#2a5bd7;color:#fff;border-bottom-right-radius:4px}",
    ".mc-m.otro{align-self:flex-start;background:#fff;color:#1d1b18;border-bottom-left-radius:4px;box-shadow:0 1px 2px rgba(0,0,0,.08)}",
    ".mc-m small{display:block;margin-top:3px;font-size:11px;opacity:.7}",
    /* Adjuntos dentro del mensaje */
    ".mc-adj{display:block;border:0;padding:0;margin:-3px -6px 6px;background:none;cursor:pointer;color:inherit;font:inherit;text-align:left}",
    ".mc-adj img{display:block;max-width:220px;max-height:260px;width:100%;border-radius:12px;object-fit:cover}",
    ".mc-adj.doc{display:flex;align-items:center;gap:8px;margin:-2px -4px 6px;padding:8px 10px;border-radius:12px;background:rgba(127,140,190,.18)}",
    ".mc-adj.doc svg{width:22px;height:22px;flex:none}",
    ".mc-adj.doc span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700;font-size:13px}",
    ".mc-adj.doc small{margin:0;font-weight:400}",
    ".mc-err{margin:0;padding:0 14px 10px;color:#b3261e;font-size:13px;background:#fff}",
    /* Visor de adjuntos */
    ".mc-visor{position:fixed;inset:0;z-index:90;background:rgba(7,15,42,.85);display:flex;align-items:center;justify-content:center;padding:14px}",
    ".mc-visor-in{width:min(640px,100%);max-height:100%;display:flex;flex-direction:column;gap:10px;color:#fff}",
    ".mc-visor-top{display:flex;align-items:center;gap:10px}",
    ".mc-visor-top b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".mc-x2{width:44px;height:44px;border:0;border-radius:50%;background:rgba(255,255,255,.15);color:#fff;font-size:26px;cursor:pointer}",
    ".mc-visor-cont{min-height:0;overflow:auto;display:grid;place-items:center}",
    ".mc-visor-cont img{max-width:100%;max-height:72vh;border-radius:14px}",
    ".mc-visor-cont .mc-aviso{color:#dbe6ff}",
    ".mc-visor-acc{display:flex;justify-content:center}",
    ".mc-visor-acc .mc-btn{align-self:auto;background:#f7c543;color:#0c2572}",

    /* Paneles del equipo y de empleados: toman los colores de tema.css (claro u oscuro) */
    ".mc-hilo,.mc-bandeja,.mc-picker{--mc-fondo:var(--surface,#fff);--mc-texto:var(--ink,#1d1b18);--mc-suave:var(--soft,#e9efff);--mc-linea:var(--line,#e1e6f7);--mc-campo:var(--campo,#fff);--mc-muted:var(--muted,#615d56);--mc-yo:var(--burbuja-yo,#2a5bd7);--mc-yo-txt:var(--burbuja-yo-texto,#fff);--mc-otro:var(--burbuja-otro,#fff);--mc-otro-txt:var(--burbuja-otro-texto,#1d1b18);--mc-bad:var(--bad,#b3261e);--mc-negro:var(--azul,#2a5bd7)}",
    ".mc-hilo{display:flex;flex-direction:column;background:var(--mc-fondo);color:var(--mc-texto);border:1px solid var(--mc-linea);border-radius:20px;overflow:hidden}",
    ".mc-hilo-cab{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--mc-linea)}",
    ".mc-hilo-cab .mc-av{width:40px;height:40px}",
    ".mc-hilo-cab b{display:block;font-size:15px}",
    ".mc-hilo-cab span{font-size:12px;color:var(--mc-muted)}",
    ".mc-hilo .mc-msgs{background:var(--mc-suave);min-height:260px;max-height:58vh}",
    ".mc-hilo .mc-form{background:var(--mc-fondo);border-top:1px solid var(--mc-linea)}",
    ".mc-hilo .mc-form input:not([type=file]){background:var(--mc-campo);color:var(--mc-texto);border-color:var(--mc-linea)}",
    ".mc-hilo .mc-clip,.mc-hilo .mc-prev{background:var(--mc-suave);color:var(--mc-negro)}",
    ".mc-hilo .mc-prev{color:var(--mc-texto);margin-top:8px}",
    ".mc-hilo .mc-m.yo{background:var(--mc-yo);color:var(--mc-yo-txt)}",
    ".mc-hilo .mc-m.otro{background:var(--mc-otro);color:var(--mc-otro-txt)}",
    ".mc-hilo .mc-err{background:transparent;color:var(--mc-bad)}",
    ".mc-hilo .mc-aviso,.mc-bandeja .mc-aviso,.mc-picker .mc-aviso{color:var(--mc-muted)}",
    ".mc-av{width:44px;height:44px;flex:none;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#c9b6ff,#9fb7ff);color:#0c2572;font-weight:700;font-size:16px}",
    ".mc-priv{display:inline-flex;align-items:center;gap:3px;color:var(--mc-negro)}",

    /* Bandeja del equipo */
    ".mc-bandeja{display:grid;grid-template-columns:minmax(260px,340px) 1fr;min-height:560px;background:var(--mc-fondo);color:var(--mc-texto);border:1px solid var(--mc-linea);border-radius:20px;overflow:hidden}",
    ".mc-col-lista{display:flex;flex-direction:column;min-width:0;border-right:1px solid var(--mc-linea)}",
    ".mc-arriba{display:flex;flex-direction:column;gap:8px;padding:10px;border-bottom:1px solid var(--mc-linea)}",
    ".mc-nuevo{display:flex;align-items:center;justify-content:center;gap:8px;min-height:44px;border:0;border-radius:999px;background:var(--amarillo,#f7c543);color:var(--amarillo-txt,#0c2572);font:inherit;font-weight:700;cursor:pointer}",
    ".mc-nuevo svg{width:18px;height:18px}",
    ".mc-filtros{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none}",
    ".mc-filtros::-webkit-scrollbar{display:none}",
    ".mc-filtros button{flex:none;padding:6px 12px;border:1px solid var(--mc-linea);border-radius:999px;background:var(--mc-fondo);color:var(--mc-texto);font-size:13px;font-weight:600;cursor:pointer}",
    ".mc-filtros button[aria-pressed=true]{background:var(--mc-negro);color:#fff;border-color:var(--mc-negro)}",
    ".mc-lista{overflow-y:auto;max-height:70vh}",
    ".mc-fila{display:flex;align-items:center;gap:12px;width:100%;padding:12px 14px;border:0;border-bottom:1px solid var(--mc-linea);background:var(--mc-fondo);color:var(--mc-texto);text-align:left;font:inherit;cursor:pointer}",
    ".mc-fila .mc-av{width:42px;height:42px;font-size:15px}",
    ".mc-fila-in{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}",
    ".mc-fila.act{background:var(--mc-suave)}",
    ".mc-fila-top{display:flex;justify-content:space-between;align-items:baseline;gap:8px;min-width:0}",
    ".mc-fila-top b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px}",
    ".mc-fila-top small{flex:0 0 auto;font-size:11px;color:var(--mc-muted);white-space:nowrap}",
    ".mc-fila.nueva b{font-weight:800}",
    ".mc-dot-f{display:inline-block;width:8px;height:8px;margin-right:6px;border-radius:50%;background:#c0392b;vertical-align:middle}",
    ".mc-fila-txt{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;color:var(--mc-muted)}",
    ".mc-fila-hora{font-size:11px;color:var(--mc-muted)}",
    ".mc-col-hilo{display:flex;flex-direction:column;min-width:0}",
    ".mc-col-hilo .mc-hilo{flex:1;border:0;border-radius:0}",
    ".mc-col-hilo .mc-msgs{min-height:0;max-height:none}",
    ".mc-sin-sel{margin:auto;padding:24px;text-align:center;color:var(--mc-muted)}",
    ".mc-volver{display:none}",
    ".mc-n{display:inline-block;margin-left:8px;padding:1px 8px;border-radius:999px;background:#b3261e;color:#fff;font-size:12px;vertical-align:middle}",
    "@media (max-width:760px){",
    ".mc-bandeja{grid-template-columns:1fr;min-height:0}",
    ".mc-bandeja[data-vista=lista] .mc-col-hilo{display:none}",
    ".mc-bandeja[data-vista=hilo] .mc-col-lista{display:none}",
    ".mc-volver{display:inline-flex;align-self:flex-start;margin:10px;padding:8px 14px;border:1px solid var(--mc-linea);border-radius:999px;background:var(--mc-fondo);color:var(--mc-texto);font-weight:600;cursor:pointer}",
    ".mc-col-hilo .mc-msgs{min-height:55vh}",
    ".mc-lista{max-height:none}",
    "}",
    /* Selector de persona para "Nuevo chat" */
    ".mc-picker{position:fixed;inset:0;z-index:80;background:rgba(7,15,42,.55);display:flex;align-items:flex-end;justify-content:center}",
    ".mc-picker-in{width:min(480px,100%);max-height:86vh;display:flex;flex-direction:column;background:var(--mc-fondo);color:var(--mc-texto);border-radius:24px 24px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom,0px));box-shadow:0 -10px 40px rgba(0,0,0,.25)}",
    "@media (min-width:700px){.mc-picker{align-items:center}.mc-picker-in{border-radius:24px}}",
    ".mc-picker-top{display:flex;align-items:center;gap:10px;margin-bottom:6px}",
    ".mc-picker-top b{flex:1;font-size:17px}",
    ".mc-picker-top button{width:40px;height:40px;border:0;border-radius:50%;background:var(--mc-suave);color:var(--mc-texto);font-size:22px;cursor:pointer}",
    ".mc-picker p.mc-nota{margin:0 0 10px;font-size:13px;color:var(--mc-muted)}",
    ".mc-picker input{width:100%;box-sizing:border-box;min-height:46px;padding:0 14px;border:1.5px solid var(--mc-linea);border-radius:999px;background:var(--mc-campo);color:var(--mc-texto);font:inherit;margin-bottom:10px}",
    ".mc-picker-lista{overflow-y:auto;display:flex;flex-direction:column;gap:4px}",
    ".mc-picker-lista button{display:flex;align-items:center;gap:12px;padding:10px;border:0;border-radius:14px;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer}",
    ".mc-picker-lista button:hover{background:var(--mc-suave)}",
    ".mc-picker-lista b{display:block}",
    ".mc-picker-lista small{color:var(--mc-muted)}",
    /* Ocultar respetando el atributo hidden aunque la página tenga display propio */
    ".mc-box[hidden],.mc-box [hidden],.mc-hilo [hidden],.mc-bandeja [hidden],.mc-launch [hidden],.mc-dot[hidden],.mc-n[hidden],.mc-dot-f[hidden],.mc-prev[hidden]{display:none!important}"
  ].join("");

  var hechoCSS = false;
  function estilos() {
    if (hechoCSS) return;
    hechoCSS = true;
    var s = document.createElement("style");
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ---------- Firestore ---------- */
  function docConv(db, id) { return db.collection("conversaciones").doc(id); }
  function docPriv(db, id) { return db.collection("privados").doc(id); }

  function mensajesDe(ref, alCambiar, alFallar) {
    return ref.collection("mensajes").orderBy("creado").limitToLast(200).onSnapshot(function (q) {
      alCambiar(q.docs.map(function (d) { return Object.assign({ id: d.id }, datos(d)); }));
    }, alFallar || function (err) { console.warn("chat", err); });
  }

  /* Un mensaje (con su archivo, si trae) y el resumen de la conversación se guardan juntos, o ninguno */
  function enviar(db, fv, ref, de, autor, texto, cambios, adj) {
    var lote = db.batch(), msg = { texto: texto, de: de, autor: autor, creado: fv.serverTimestamp() };
    if (adj) {
      var a = ref.collection("adjuntos").doc();
      lote.set(a, { datos: adj.datos, tipo: adj.tipo, nombre: adj.nombre });
      msg.adjunto = { id: a.id, nombre: adj.nombre, tipo: adj.tipo, peso: adj.peso, mini: adj.mini };
    }
    lote.set(ref.collection("mensajes").doc(), msg);
    lote.set(ref, cambios, { merge: true });
    return lote.commit();
  }

  /* Formulario: texto + clip. Limpia al enviar y devuelve el texto (y el archivo) si falla */
  function formHTML(placeholder) {
    return '<div class="mc-prev" hidden></div>' +
      '<form class="mc-form" autocomplete="off">' +
        '<label class="mc-clip" title="Adjuntar foto o PDF" aria-label="Adjuntar foto o PDF">' + ICO_CLIP + '<input type="file" accept="image/*,application/pdf"></label>' +
        '<input maxlength="' + LIMITE + '" placeholder="' + esc(placeholder) + '" aria-label="Mensaje">' +
        '<button type="submit">Enviar</button></form>';
  }
  function conectarEnvio(raiz, alEnviar) {
    var form = raiz.querySelector(".mc-form"), input = form.querySelector("input:not([type=file])"), arch = form.querySelector("input[type=file]"),
        prev = raiz.querySelector(".mc-prev"), errEl = raiz.querySelector(".mc-err"), boton = form.querySelector("button[type=submit]"), pend = null;
    function error(t) { errEl.textContent = t; errEl.hidden = !t; }
    function pintarPrev() {
      prev.hidden = !pend;
      if (!pend) { prev.innerHTML = ""; return; }
      prev.innerHTML = '<i class="mc-pi"' + (pend.mini ? ' style="background-image:url(\'' + pend.mini + '\')"' : "") + ">" + (pend.mini ? "" : ICO_DOC) + "</i>" +
        "<span>" + esc(pend.nombre) + "<small>" + (pend.tipo === "img" ? "Foto" : "PDF") + " · " + peso(pend.peso) + "</small></span>" +
        '<button type="button" aria-label="Quitar archivo">×</button>';
      prev.querySelector("button").addEventListener("click", function () { pend = null; pintarPrev(); });
    }
    arch.addEventListener("change", function () {
      var f = arch.files[0]; arch.value = ""; if (!f) return;
      error(""); prev.hidden = false; prev.innerHTML = "<span>Preparando " + esc(f.name || "archivo") + "…</span>";
      prepararAdjunto(f).then(function (a) { pend = a; pintarPrev(); input.focus(); })
        .catch(function (e) { pend = null; pintarPrev(); error(e.message || "No se pudo leer el archivo."); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var t = limpio(input.value), a = pend;
      if (!t && !a) return;
      input.value = ""; pend = null; pintarPrev(); error(""); boton.disabled = true;
      new Promise(function (ok) { ok(alEnviar(t, a)); }).then(function () { boton.disabled = false; }, function (err) {
        console.warn("chat", err);
        boton.disabled = false;
        if (!input.value) input.value = t;
        if (a && !pend) { pend = a; pintarPrev(); }
        error(/size|large|exceed|maximum/i.test(err && err.message || "") ? "El archivo es muy pesado. Intenta con una foto." : "No se pudo enviar. Revisa tu conexión e inténtalo otra vez.");
      });
    });
  }

  /* miLado: de qué lado están los mensajes "míos" ("cliente", "equipo" o un correo) */
  function pintarMensajes(cont, msgs, miLado, verAutor, vacio, ref) {
    var cerca = cont.scrollHeight - cont.scrollTop - cont.clientHeight < 60;
    var primera = !cont.dataset.mc;
    cont._ref = ref;
    cont._adj = {};
    if (!msgs.length) {
      cont.innerHTML = '<p class="mc-aviso">' + esc(vacio) + "</p>";
    } else {
      cont.innerHTML = msgs.map(function (m) {
        var yo = m.de === miLado;
        var quien = (!yo || verAutor) && m.autor ? esc(m.autor) + " · " : "";
        var a = m.adjunto, adj = "";
        if (a && a.id) {
          cont._adj[a.id] = a;
          adj = a.tipo === "img" && a.mini
            ? '<button type="button" class="mc-adj" data-adj="' + esc(a.id) + '" aria-label="Ver foto"><img src="' + a.mini + '" alt="Foto"></button>'
            : '<button type="button" class="mc-adj doc" data-adj="' + esc(a.id) + '">' + ICO_DOC + "<span>" + esc(a.nombre) + "<small>" + peso(a.peso || 0) + "</small></span></button>";
        }
        return '<div class="mc-m ' + (yo ? "yo" : "otro") + '">' + adj + esc(m.texto) + "<small>" + quien + esc(hora(m.creado)) + "</small></div>";
      }).join("");
    }
    if (!cont.dataset.mcClic) {
      cont.dataset.mcClic = "1";
      cont.addEventListener("click", function (e) {
        var b = e.target.closest ? e.target.closest("[data-adj]") : null;
        if (b && cont._ref && cont._adj[b.getAttribute("data-adj")]) abrirAdjunto(cont._ref, cont._adj[b.getAttribute("data-adj")]);
      });
      cont.addEventListener("load", function () { if (cont.scrollHeight - cont.scrollTop - cont.clientHeight < 300) cont.scrollTop = cont.scrollHeight; }, true);
    }
    if (cerca || primera) cont.scrollTop = cont.scrollHeight;
    cont.dataset.mc = "1";
  }

  function hiloHTML(c) {
    return '<div class="mc-hilo">' +
      '<div class="mc-hilo-cab">' + (c.av ? '<span class="mc-av">' + esc(c.av) + "</span>" : "") + "<div><b>" + esc(c.titulo) + "</b>" + (c.sub ? "<span>" + c.sub + "</span>" : "") + "</div></div>" +
      '<div class="mc-msgs" aria-live="polite"></div>' +
      formHTML(c.placeholder) +
      '<p class="mc-err" hidden></p></div>';
  }

  /* ---------- Cliente (página de ventas) ---------- */
  function visitante(opts) {
    if (!opts || !opts.db || !opts.firebase || document.querySelector(".mc-launch")) return;
    estilos();
    var db = opts.db, fb = opts.firebase, fv = fb.firestore.FieldValue;
    var wa = opts.whatsapp || WHATSAPP;
    var est = {
      cid: "", abierto: false, msgs: [], noLeida: false, error: "",
      nombre: leer("mc-nombre"), contacto: leer("mc-contacto"),
      escuchandoConv: false, quitarMsgs: null
    };

    var lanz = document.createElement("button");
    lanz.type = "button";
    lanz.className = "mc-launch";
    lanz.setAttribute("aria-label", "Abrir chat con Muebles Ideal");
    lanz.setAttribute("aria-expanded", "false");
    lanz.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg><span class="mc-dot" hidden></span>';
    var punto = lanz.querySelector(".mc-dot");

    var caja = document.createElement("section");
    caja.className = "mc-box";
    caja.hidden = true;
    caja.setAttribute("aria-label", "Chat con Muebles Ideal");
    caja.innerHTML =
      '<header class="mc-head"><div><b>Muebles Ideal</b><small>Escríbenos y te respondemos aquí</small></div>' +
        '<button type="button" class="mc-x" aria-label="Cerrar chat">×</button></header>' +
      '<div class="mc-err-box" hidden></div>' +
      '<form class="mc-intro" hidden>' +
        '<p class="mc-aviso">Para responderte, dinos tu nombre y un teléfono o correo (opcional).</p>' +
        '<label>Tu nombre<input name="nombre" maxlength="60" required autocomplete="name"></label>' +
        '<label>Teléfono o correo (opcional)<input name="contacto" maxlength="80" autocomplete="tel"></label>' +
        '<button type="submit" class="mc-btn">Empezar el chat</button>' +
      "</form>" +
      '<div class="mc-msgs" hidden></div>' +
      '<div class="mc-pie" hidden>' + formHTML("Escribe tu duda…") + '<p class="mc-err" hidden></p></div>';
    var intro = caja.querySelector(".mc-intro"), errBox = caja.querySelector(".mc-err-box"),
        msgsEl = caja.querySelector(".mc-msgs"), pie = caja.querySelector(".mc-pie"),
        input = pie.querySelector(".mc-form input:not([type=file])");
    document.body.appendChild(lanz);
    document.body.appendChild(caja);

    function pintar() {
      punto.hidden = !(est.noLeida && !est.abierto);
      errBox.hidden = !est.error;
      if (est.error) {
        errBox.innerHTML = '<p class="mc-aviso">' + esc(est.error) + '</p><p class="mc-aviso">Mientras tanto, <a href="https://wa.me/' + esc(wa) + '" target="_blank" rel="noopener">escríbenos por WhatsApp</a>.</p>';
      }
      var listo = !est.error && !!est.nombre;
      intro.hidden = !!est.error || listo;
      msgsEl.hidden = !listo;
      pie.hidden = !listo;
      if (listo) pintarMensajes(msgsEl, est.msgs, "cliente", false, "Escribe tu duda sobre camas, sofás, medidas o precios. También puedes enviarnos una foto del espacio. Te respondemos aquí mismo.", est.cid ? docConv(db, est.cid) : null);
    }

    function fallar(msg, err) {
      if (err) console.warn("chat", err);
      est.error = msg;
      pintar();
    }

    intro.addEventListener("submit", function (e) {
      e.preventDefault();
      var n = limpio(intro.elements.nombre.value), c = limpio(intro.elements.contacto.value);
      if (!n) { intro.elements.nombre.focus(); return; }
      est.nombre = n;
      est.contacto = c;
      guardar("mc-nombre", n);
      guardar("mc-contacto", c);
      pintar();
      input.focus();
    });

    conectarEnvio(pie, function (t, adj) {
      if (!est.cid) throw new Error("Todavía conectando el chat");
      return enviar(db, fv, docConv(db, est.cid), "cliente", est.nombre, t, {
        tipo: "visitante", nombre: est.nombre, contacto: est.contacto || "",
        actualizada: fv.serverTimestamp(), ultimo: resumenCon(t, adj), ultimoDe: "cliente",
        noLeidaStaff: true, noLeidaParte: false
      }, adj);
    });

    function marcarLeido() {
      docConv(db, est.cid).update({ noLeidaParte: false }).catch(function (err) { console.warn("chat", err); });
    }

    function escucharMensajes() {
      if (est.quitarMsgs || !est.cid) return;
      est.quitarMsgs = mensajesDe(docConv(db, est.cid), function (lista) {
        est.msgs = lista;
        pintar();
      }, function (err) {
        est.quitarMsgs = null;
        fallar("No pudimos cargar tus mensajes en este momento.", err);
      });
    }

    function escucharConv() {
      if (est.escuchandoConv) return;
      est.escuchandoConv = true;
      docConv(db, est.cid).onSnapshot(function (s) {
        var d = s.exists ? s.data() : null;
        est.noLeida = !!(d && d.noLeidaParte);
        if (est.noLeida && est.abierto) marcarLeido();
        if (est.abierto) escucharMensajes();
        pintar();
      }, function (err) {
        est.escuchandoConv = false;
        fallar("No pudimos conectar el chat en este momento.", err);
      });
    }

    function abrir(on) {
      est.abierto = on;
      caja.hidden = !on;
      lanz.setAttribute("aria-expanded", String(on));
      if (on) {
        escucharMensajes();
        if (est.noLeida) marcarLeido();
      }
      pintar();
    }

    lanz.addEventListener("click", function () { abrir(!est.abierto); });
    caja.querySelector(".mc-x").addEventListener("click", function () { abrir(false); });

    if (typeof fb.auth !== "function") {
      fallar("El chat no está disponible en este momento.");
    } else {
      var auth = fb.auth();
      auth.onAuthStateChanged(function (u) {
        if (u) {
          est.cid = "c_" + u.uid;
          escucharConv();
          return;
        }
        auth.signInAnonymously().catch(function (err) {
          fallar("El chat no está disponible en este momento.", err);
        });
      });
    }
    pintar();
  }

  /* ---------- Empleado (app de empleados): su chat con el dueño ---------- */
  function empleado(opts) {
    var db = opts.db, fv = opts.firebase.firestore.FieldValue;
    var correo = String(opts.email || "").toLowerCase();
    var nombre = limpio(opts.nombre) || "Equipo";
    var id = "e_" + correo, ref = docConv(db, id);
    var est = { el: null, msgs: [], noLeida: false };
    estilos();
    registrar(db, correo, nombre, opts.rol || "Taller");

    function visible() { return !!(est.el && est.el.isConnected); }
    function avisar() { if (opts.onNoLeidas) opts.onNoLeidas(est.noLeida ? 1 : 0); }
    function marcarLeido() {
      ref.update({ noLeidaParte: false }).catch(function (err) { console.warn("chat", err); });
    }
    function pintar() {
      if (!visible()) return;
      var cont = est.el.querySelector(".mc-msgs");
      if (cont) pintarMensajes(cont, est.msgs, "cliente", false, "Aún no has escrito. Pregunta lo que necesites: medidas, un pedido, algo del taller. Puedes enviar fotos.", ref);
    }

    ref.onSnapshot(function (s) {
      var d = s.exists ? s.data() : null;
      est.noLeida = !!(d && d.noLeidaParte);
      avisar();
      if (est.noLeida && visible()) marcarLeido();
    }, function (err) { console.warn("chat", err); });
    mensajesDe(ref, function (lista) { est.msgs = lista; pintar(); });

    return {
      montar: function (el) {
        estilos();
        est.el = el;
        el.innerHTML = hiloHTML({
          titulo: "Escribe al dueño",
          sub: "Tus dudas y avisos llegan al panel del dueño",
          placeholder: "Escribe tu mensaje…"
        });
        conectarEnvio(el.querySelector(".mc-hilo"), function (t, adj) {
          return enviar(db, fv, ref, "cliente", nombre, t, {
            tipo: "empleado", nombre: nombre, contacto: correo, actualizada: fv.serverTimestamp(),
            ultimo: resumenCon(t, adj), ultimoDe: "cliente", noLeidaStaff: true, noLeidaParte: false
          }, adj);
        });
        pintar();
        if (est.noLeida) marcarLeido();
      }
    };
  }

  /* ---------- Directorio: quién aparece en "Nuevo chat" ---------- */
  function registrar(db, correo, nombre, rol) {
    if (!correo) return Promise.resolve();
    return db.collection("directorio").doc(correo).set({ nombre: limpio(nombre).slice(0, 60) || correo.split("@")[0], rol: String(rol || "").slice(0, 60) }, { merge: true })
      .catch(function (err) { console.warn("chat directorio", err); });
  }
  /* El dueño y el administrador anotan en el directorio a todo el personal con acceso */
  function sincronizarDirectorio(db, dueno) {
    var lote = db.batch(), n = 0;
    var p1 = db.collection("empleados").get().then(function (q) {
      q.docs.forEach(function (d) {
        var x = d.data(), em = String((x.acceso && x.acceso.email) || "").toLowerCase();
        if (em && x.activo !== false && (!x.acceso || x.acceso.activo !== false) && n < 400) { n++; lote.set(db.collection("directorio").doc(em), { nombre: x.nombre || em, rol: (x.roles || []).join(", ") || "Taller" }, { merge: true }); }
      });
    }).catch(function () {});
    var p2 = dueno ? db.collection("equipo").get().then(function (q) {
      q.docs.forEach(function (d) {
        var x = d.data();
        if (x.activo !== false && n < 400) { n++; lote.set(db.collection("directorio").doc(d.id.toLowerCase()), { nombre: x.nombre || d.id, rol: x.rol === "administrador" ? "Administrador" : "Ayudante" }, { merge: true }); }
      });
    }).catch(function () {}) : Promise.resolve();
    return Promise.all([p1, p2]).then(function () { return n ? lote.commit() : null; }).catch(function (err) { console.warn("chat directorio", err); });
  }

  /* Ventana para elegir con quién hablar */
  function elegirPersona(db, yo, alElegir) {
    estilos();
    var v = document.createElement("div");
    v.className = "mc-picker"; v.setAttribute("role", "dialog"); v.setAttribute("aria-modal", "true"); v.setAttribute("aria-label", "Nuevo chat");
    v.innerHTML = '<div class="mc-picker-in"><div class="mc-picker-top"><b>Nuevo chat privado</b><button type="button" aria-label="Cerrar">×</button></div>' +
      '<p class="mc-nota">' + ICO_CANDADO + ' Solo tú y la persona que elijas verán esta conversación.</p>' +
      '<input type="search" placeholder="Buscar por nombre o cargo" aria-label="Buscar persona"><div class="mc-picker-lista"><p class="mc-aviso">Cargando…</p></div></div>';
    document.body.appendChild(v);
    var lista = v.querySelector(".mc-picker-lista"), buscar = v.querySelector("input"), gente = [];
    function cerrar() { v.remove(); }
    v.addEventListener("click", function (e) { if (e.target === v || e.target.closest(".mc-picker-top button")) cerrar(); });
    function pintar() {
      var q = buscar.value.trim().toLowerCase();
      var ls = gente.filter(function (p) { return !q || (p.nombre + " " + p.rol + " " + p.id).toLowerCase().indexOf(q) >= 0; });
      lista.innerHTML = ls.length ? ls.map(function (p) {
        return '<button type="button" data-em="' + esc(p.id) + '"><span class="mc-av">' + esc(inicial(p.nombre)) + "</span><span><b>" + esc(p.nombre) + "</b><small>" + esc(p.rol || "") + "</small></span></button>";
      }).join("") : '<p class="mc-aviso">' + (gente.length ? "Nadie coincide con la búsqueda." : "Todavía no hay más personas. Aparecen cuando entran a la app o cuando el dueño abre Mensajes.") + "</p>";
    }
    lista.addEventListener("click", function (e) {
      var b = e.target.closest("[data-em]"); if (!b) return;
      var p = gente.filter(function (x) { return x.id === b.getAttribute("data-em"); })[0];
      cerrar(); alElegir(p);
    });
    buscar.addEventListener("input", pintar);
    db.collection("directorio").get().then(function (q) {
      gente = q.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); })
        .filter(function (p) { return p.id !== yo; })
        .sort(function (a, b) { return String(a.nombre).localeCompare(String(b.nombre), "es"); });
      pintar(); buscar.focus();
    }).catch(function (err) { console.warn("chat", err); lista.innerHTML = '<p class="mc-aviso">No se pudo cargar la lista de personas.</p>'; });
  }

  /* ---------- Bandeja: panel del dueño y equipo, o solo privados (portal de empleados) ---------- */
  function bandeja(opts) {
    var el = opts.el, db = opts.db, fv = opts.firebase.firestore.FieldValue;
    if (!el) return null;
    estilos();
    var miNombre = limpio(opts.nombre) || "Equipo";
    var yo = String(opts.email || "").toLowerCase();
    var soloPriv = !!opts.soloPrivados;
    if (yo) registrar(db, yo, miNombre, opts.rol || "");
    if (opts.gestor) sincronizarDirectorio(db, !!opts.dueno);
    var filtros = soloPriv ? [] : [["todos", "Todas"], ["visitante", "Clientes"], ["empleado", "Equipo"], ["privado", "Privados"]];
    el.innerHTML = '<div class="mc-bandeja" data-vista="lista">' +
      '<div class="mc-col-lista">' +
        '<div class="mc-arriba">' +
          (yo ? '<button type="button" class="mc-nuevo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Nuevo chat</button>' : "") +
          (filtros.length ? '<div class="mc-filtros" role="group" aria-label="Ver">' + filtros.map(function (f, i) { return '<button type="button" data-f="' + f[0] + '" aria-pressed="' + (i === 0) + '">' + f[1] + "</button>"; }).join("") + "</div>" : "") +
        "</div>" +
        '<div class="mc-lista"></div>' +
      "</div>" +
      '<div class="mc-col-hilo">' +
        '<button type="button" class="mc-volver">← Volver a la lista</button>' +
        '<p class="mc-sin-sel">' + (soloPriv ? "Elige una conversación o toca «Nuevo chat» para escribirle a alguien en privado." : "Elige una conversación para leerla y responder.") + "</p>" +
        '<div class="mc-hilo-zona" hidden></div>' +
      "</div></div>";
    var raiz = el.querySelector(".mc-bandeja"), lista = el.querySelector(".mc-lista"),
        zona = el.querySelector(".mc-hilo-zona"), sinSel = el.querySelector(".mc-sin-sel");
    var st = { convs: [], priv: [], filtro: "todos", sel: "", msgs: [], quitarMsgs: null, quitarLista: null, quitarPriv: null, cargada: soloPriv, cargadaPriv: !yo };

    function privado(d) {
      var i = (d.participantes || []).indexOf(yo), o = i === 0 ? 1 : 0;
      return Object.assign({}, d, { _priv: true, tipo: "privado", otro: (d.participantes || [])[o] || "", nombre: (d.nombres || [])[o] || (d.participantes || [])[o] || "Privado",
        nueva: (d.pendientes || []).indexOf(yo) >= 0 });
    }
    function todas() {
      var ls = st.convs.map(function (c) { return Object.assign({}, c, { nueva: !!c.noLeidaStaff }); }).concat(st.priv.map(privado));
      return ls.sort(function (a, b) { return seg(b.actualizada) - seg(a.actualizada); });
    }
    function autorDe(c) { return c && (c.tipo === "empleado" || c._priv) ? miNombre : "Muebles Ideal"; }
    function enSeleccion() { return todas().filter(function (x) { return x.id === st.sel; })[0]; }
    function refDe(c) { return c && c._priv ? docPriv(db, c.id) : docConv(db, c.id); }

    function marcarLeido() {
      var c = enSeleccion();
      if (!c || !c.nueva) return;
      var cambio = c._priv ? { pendientes: fv.arrayRemove(yo) } : { noLeidaStaff: false };
      refDe(c).update(cambio).catch(function (err) { console.warn("chat", err); });
    }

    function pintarLista() {
      el.querySelectorAll(".mc-filtros button").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-f") === st.filtro));
      });
      var ver = todas().filter(function (c) { return st.filtro === "todos" || c.tipo === st.filtro; });
      if (!ver.length) {
        lista.innerHTML = '<p class="mc-aviso">' + (!st.cargada || !st.cargadaPriv ? "Cargando…" : soloPriv || st.filtro === "privado" ? "No tienes chats privados todavía. Toca «Nuevo chat»." : "Todavía no hay conversaciones en esta vista.") + "</p>";
        return;
      }
      lista.innerHTML = ver.map(function (c) {
        var etiqueta = c._priv ? '<span class="mc-priv">' + ICO_CANDADO + "Privado</span>" : esc(c.tipo === "empleado" ? "Equipo" : "Cliente web");
        var prefijo = c._priv ? (c.ultimoDe === yo ? "Tú: " : "") : c.ultimoDe === "equipo" ? "Equipo: " : "";
        return '<button type="button" class="mc-fila' + (c.id === st.sel ? " act" : "") + (c.nueva ? " nueva" : "") + '" data-id="' + esc(c.id) + '">' +
          '<span class="mc-av">' + esc(inicial(c.nombre)) + "</span>" +
          '<span class="mc-fila-in"><span class="mc-fila-top"><b>' + esc(c.nombre || "Sin nombre") + "</b>" +
            "<small>" + (c.nueva ? '<i class="mc-dot-f"></i>' : "") + etiqueta + "</small></span>" +
          '<span class="mc-fila-txt">' + esc(prefijo + (c.ultimo || (c._priv ? "Conversación nueva" : ""))) + "</span>" +
          '<span class="mc-fila-hora">' + esc(hora(c.actualizada)) + "</span></span></button>";
      }).join("");
    }

    function pintarHilo() {
      var c = enSeleccion(), cont = zona.querySelector(".mc-msgs");
      if (cont && c) pintarMensajes(cont, st.msgs, c._priv ? yo : "equipo", !c._priv, c._priv ? "Escribe el primer mensaje. Solo ustedes dos lo verán." : "Sin mensajes todavía.", refDe(c));
    }

    function seleccionar(id) {
      var c = todas().filter(function (x) { return x.id === id; })[0];
      if (!c) return;
      st.sel = id;
      raiz.setAttribute("data-vista", "hilo");
      sinSel.hidden = true;
      zona.hidden = false;
      zona.innerHTML = hiloHTML({
        av: c._priv ? inicial(c.nombre) : "",
        titulo: c.nombre || "Sin nombre",
        sub: c._priv ? ICO_CANDADO + " Conversación privada · solo ustedes dos" : esc(c.tipo === "empleado" ? "Equipo · " + (c.contacto || "") : c.contacto || "Cliente de la página"),
        placeholder: c._priv ? "Escribe en privado…" : "Escribe tu respuesta…"
      });
      var ref = refDe(c);
      conectarEnvio(zona.querySelector(".mc-hilo"), function (t, adj) {
        var cambios = c._priv
          ? { ultimo: resumenCon(t, adj), ultimoDe: yo, actualizada: fv.serverTimestamp(), pendientes: fv.arrayUnion(c.otro) }
          : { ultimo: resumenCon(t, adj), ultimoDe: "equipo", actualizada: fv.serverTimestamp(), noLeidaParte: true, noLeidaStaff: false };
        return enviar(db, fv, ref, c._priv ? yo : "equipo", c._priv ? miNombre : autorDe(c), t, cambios, adj);
      });
      if (st.quitarMsgs) st.quitarMsgs();
      st.msgs = [];
      st.quitarMsgs = mensajesDe(ref, function (lista2) { st.msgs = lista2; pintarHilo(); });
      pintarHilo();
      marcarLeido();
      pintarLista();
    }

    /* Abre (o crea) el chat privado con esa persona */
    function abrirPrivado(p) {
      if (!p || !yo) return;
      var id = idPrivado(yo, p.id);
      if (st.priv.some(function (x) { return x.id === id; })) { st.filtro = soloPriv ? "todos" : st.filtro; seleccionar(id); return; }
      var par = [yo, p.id].sort(), nombres = par.map(function (e) { return e === yo ? miNombre : p.nombre || e; });
      var d = { participantes: par, nombres: nombres, actualizada: fv.serverTimestamp(), ultimo: "", ultimoDe: "", pendientes: [] };
      docPriv(db, id).set(d).then(function () {
        if (!st.priv.some(function (x) { return x.id === id; })) st.priv.push(Object.assign({ id: id }, d, { actualizada: { seconds: Date.now() / 1000 } }));
        seleccionar(id);
      }).catch(function (err) { console.warn("chat", err); alert("No se pudo abrir el chat privado. Revisa tu conexión."); });
    }

    lista.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("[data-id]") : null;
      if (b) seleccionar(b.getAttribute("data-id"));
    });
    var fl = el.querySelector(".mc-filtros");
    if (fl) fl.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("button[data-f]") : null;
      if (!b) return;
      st.filtro = b.getAttribute("data-f");
      pintarLista();
    });
    var nb = el.querySelector(".mc-nuevo");
    if (nb) nb.addEventListener("click", function () { elegirPersona(db, yo, abrirPrivado); });
    el.querySelector(".mc-volver").addEventListener("click", function () {
      raiz.setAttribute("data-vista", "lista");
    });

    if (!soloPriv) {
      st.quitarLista = db.collection("conversaciones").orderBy("actualizada", "desc").limit(150).onSnapshot(function (q) {
        st.convs = q.docs.map(function (d) { return Object.assign({ id: d.id }, datos(d)); });
        st.cargada = true;
        if (st.sel) marcarLeido();
        pintarLista();
      }, function (err) {
        console.warn("chat", err);
        lista.innerHTML = '<p class="mc-aviso">No pudimos cargar los mensajes. Revisa tu conexión.</p>';
      });
    }
    if (yo) {
      st.quitarPriv = db.collection("privados").where("participantes", "array-contains", yo).onSnapshot(function (q) {
        st.priv = q.docs.map(function (d) { return Object.assign({ id: d.id }, datos(d)); });
        st.cargadaPriv = true;
        if (st.sel) marcarLeido();
        pintarLista();
      }, function (err) { console.warn("chat privados", err); st.cargadaPriv = true; pintarLista(); });
    }
    pintarLista();

    return {
      salir: function () {
        if (st.quitarLista) st.quitarLista();
        if (st.quitarPriv) st.quitarPriv();
        if (st.quitarMsgs) st.quitarMsgs();
      },
      nuevo: function () { elegirPersona(db, yo, abrirPrivado); }
    };
  }

  /* Cuántas conversaciones tienen algo sin leer para el equipo (para el globito del panel) */
  function sinLeerStaff(db, cb) {
    return db.collection("conversaciones").where("noLeidaStaff", "==", true).onSnapshot(function (q) {
      cb(q.size);
    }, function (err) {
      console.warn("chat", err);
      cb(0);
    });
  }
  /* Cuántos chats privados tiene esta persona sin leer */
  function sinLeerPrivados(db, correo, cb) {
    correo = String(correo || "").toLowerCase();
    /* Se busca por participantes (así lo permiten las reglas) y se cuentan los pendientes aquí */
    return db.collection("privados").where("participantes", "array-contains", correo).onSnapshot(function (q) {
      cb(q.docs.filter(function (d) { return (d.data().pendientes || []).indexOf(correo) >= 0; }).length);
    }, function (err) {
      console.warn("chat", err);
      cb(0);
    });
  }

  window.MiChat = { visitante: visitante, empleado: empleado, bandeja: bandeja, sinLeerStaff: sinLeerStaff, sinLeerPrivados: sinLeerPrivados, registrar: registrar };
})();
