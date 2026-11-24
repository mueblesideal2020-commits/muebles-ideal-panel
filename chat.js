/* Chat en línea de Muebles Ideal.
   · Página de ventas: el cliente escribe sin cuenta (acceso anónimo de Firebase).
   · App de empleados: cada empleado escribe al dueño desde su teléfono.
   · Panel (dueño y equipo): ven todas las conversaciones y responden.

   Firestore (las reglas están en reglas-chat.txt):
   conversaciones/{id}   id = "c_" + uid del cliente  ·  "e_" + correo del empleado
     tipo ("visitante" | "empleado"), nombre, contacto, actualizada, ultimo,
     ultimoDe ("cliente" | "equipo"),
     noLeidaStaff  → el equipo tiene algo sin leer
     noLeidaParte  → quien escribió tiene una respuesta sin leer
   conversaciones/{id}/mensajes/{id}   texto, de ("cliente" | "equipo"), autor, creado */
(function () {
  "use strict";

  var LIMITE = 1000;
  var WHATSAPP = "584149442672";

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
  function leer(k) { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }
  function guardar(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function limpio(s) { return String(s == null ? "" : s).trim().slice(0, LIMITE); }
  function resumen(s) { return limpio(s).replace(/\s+/g, " ").slice(0, 140); }
  function datos(d) { return d.data({ serverTimestamps: "estimate" }); }

  /* ---------- Estilos (se inyectan una sola vez) ---------- */
  var CSS = [
    /* Botón flotante y ventana del cliente (página de ventas: siempre clara) */
    ".mc-launch{position:fixed;right:calc(18px + env(safe-area-inset-right,0px));bottom:calc(88px + env(safe-area-inset-bottom,0px));z-index:26;width:56px;height:56px;padding:0;border:0;border-radius:50%;background:#141414;color:#d4ad62;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(0,0,0,.25);cursor:pointer}",
    ".mc-launch svg{width:26px;height:26px}",
    ".mc-dot{position:absolute;top:-2px;right:-2px;width:15px;height:15px;border-radius:50%;background:#c0392b;border:2px solid #fff;box-sizing:border-box}",
    ".mc-box{position:fixed;right:calc(12px + env(safe-area-inset-right,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:27;width:min(380px,calc(100vw - 24px));height:min(580px,calc(100vh - 110px));display:flex;flex-direction:column;background:#fff;color:#1d1b18;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.3);overflow:hidden;font:15px/1.4 system-ui,'Helvetica Neue',Arial,sans-serif;text-align:left}",
    ".mc-head{display:flex;align-items:center;gap:10px;padding:14px 10px 14px 16px;background:#141414;color:#fff;flex:0 0 auto}",
    ".mc-head b{display:block;font-size:15px}",
    ".mc-head small{display:block;font-size:12px;color:#cfc8ba;margin-top:2px}",
    ".mc-x{margin-left:auto;width:40px;height:40px;padding:0;border:0;background:transparent;color:#fff;font-size:26px;line-height:1;cursor:pointer}",
    ".mc-intro{display:flex;flex-direction:column;gap:12px;padding:16px;overflow-y:auto}",
    ".mc-intro label{display:flex;flex-direction:column;gap:5px;font-size:13px;font-weight:600;color:#3d382f}",
    ".mc-aviso{margin:0;padding:10px 14px;font-size:14px;color:#5b5548;text-align:center}",
    ".mc-aviso a{color:#8a6a2c;font-weight:700}",
    ".mc-btn{align-self:flex-start;min-height:44px;padding:10px 18px;border:0;border-radius:999px;background:#141414;color:#fff;font-weight:700;cursor:pointer}",
    ".mc-intro input,.mc-form input{width:100%;min-width:0;box-sizing:border-box;padding:11px 12px;border:1px solid #cfc6b4;border-radius:10px;background:#fff;color:#141414;font:inherit}",
    ".mc-form{display:flex;gap:8px;align-items:center;padding:10px;background:#fff;border-top:1px solid #e3dccd;flex:0 0 auto}",
    ".mc-form input{border-radius:999px}",
    ".mc-form button{flex:0 0 auto;min-height:44px;padding:0 16px;border:0;border-radius:999px;background:#b8913f;color:#141414;font-weight:700;cursor:pointer}",
    ".mc-form button:disabled{opacity:.5}",
    ".mc-msgs{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;gap:8px;overflow-y:auto;padding:14px;background:#f5f1e8}",
    ".mc-m{max-width:82%;padding:9px 12px;border-radius:14px;font-size:15px;white-space:pre-wrap;overflow-wrap:anywhere}",
    ".mc-m.yo{align-self:flex-end;background:#141414;color:#fff;border-bottom-right-radius:4px}",
    ".mc-m.otro{align-self:flex-start;background:#fff;color:#1d1b18;border-bottom-left-radius:4px;box-shadow:0 1px 2px rgba(0,0,0,.08)}",
    ".mc-m small{display:block;margin-top:3px;font-size:11px;opacity:.7}",
    ".mc-err{margin:0;padding:0 14px 10px;color:#b3261e;font-size:13px;background:#fff}",

    /* Paneles del equipo y de empleados: toman los colores de tema.css (claro u oscuro) */
    ".mc-hilo,.mc-bandeja{--mc-fondo:var(--surface,#fff);--mc-texto:var(--ink,#1d1b18);--mc-suave:var(--soft,#f5f1e8);--mc-linea:var(--line,#e3dccd);--mc-campo:var(--campo,#fff);--mc-muted:var(--muted,#615d56);--mc-yo:var(--burbuja-yo,#141414);--mc-yo-txt:var(--burbuja-yo-texto,#fff);--mc-otro:var(--burbuja-otro,#fff);--mc-otro-txt:var(--burbuja-otro-texto,#1d1b18);--mc-bad:var(--bad,#b3261e);--mc-negro:var(--negro,#141414)}",
    ".mc-hilo{display:flex;flex-direction:column;background:var(--mc-fondo);color:var(--mc-texto);border:1px solid var(--mc-linea);border-radius:14px;overflow:hidden}",
    ".mc-hilo-cab{padding:12px 14px;border-bottom:1px solid var(--mc-linea)}",
    ".mc-hilo-cab b{display:block;font-size:15px}",
    ".mc-hilo-cab span{font-size:12px;color:var(--mc-muted)}",
    ".mc-hilo .mc-msgs{background:var(--mc-suave);min-height:260px;max-height:58vh}",
    ".mc-hilo .mc-form{background:var(--mc-fondo);border-top:1px solid var(--mc-linea)}",
    ".mc-hilo .mc-form input{background:var(--mc-campo);color:var(--mc-texto);border-color:var(--mc-linea)}",
    ".mc-hilo .mc-m.yo{background:var(--mc-yo);color:var(--mc-yo-txt)}",
    ".mc-hilo .mc-m.otro{background:var(--mc-otro);color:var(--mc-otro-txt)}",
    ".mc-hilo .mc-err{background:transparent;color:var(--mc-bad)}",
    ".mc-hilo .mc-aviso,.mc-bandeja .mc-aviso{color:var(--mc-muted)}",

    /* Bandeja del equipo */
    ".mc-bandeja{display:grid;grid-template-columns:minmax(250px,330px) 1fr;min-height:560px;background:var(--mc-fondo);color:var(--mc-texto);border:1px solid var(--mc-linea);border-radius:14px;overflow:hidden}",
    ".mc-col-lista{display:flex;flex-direction:column;min-width:0;border-right:1px solid var(--mc-linea)}",
    ".mc-filtros{display:flex;flex-wrap:wrap;gap:6px;padding:10px;border-bottom:1px solid var(--mc-linea)}",
    ".mc-filtros button{padding:6px 12px;border:1px solid var(--mc-linea);border-radius:999px;background:var(--mc-fondo);color:var(--mc-texto);font-size:13px;font-weight:600;cursor:pointer}",
    ".mc-filtros button[aria-pressed=true]{background:var(--mc-negro);color:#fff;border-color:var(--mc-negro)}",
    ".mc-lista{overflow-y:auto;max-height:70vh}",
    ".mc-fila{display:flex;flex-direction:column;gap:3px;width:100%;padding:12px 14px;border:0;border-bottom:1px solid var(--mc-linea);background:var(--mc-fondo);color:var(--mc-texto);text-align:left;font:inherit;cursor:pointer}",
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
    /* Ocultar respetando el atributo hidden aunque la página tenga display propio */
    ".mc-box[hidden],.mc-box [hidden],.mc-hilo [hidden],.mc-bandeja [hidden],.mc-launch [hidden],.mc-dot[hidden],.mc-n[hidden],.mc-dot-f[hidden]{display:none!important}"
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

  function mensajesDe(db, id, alCambiar, alFallar) {
    return docConv(db, id).collection("mensajes").orderBy("creado").limitToLast(200).onSnapshot(function (q) {
      alCambiar(q.docs.map(function (d) { return Object.assign({ id: d.id }, datos(d)); }));
    }, alFallar || function () {});
  }

  /* Un mensaje y el resumen de la conversación se guardan juntos (o ninguno) */
  function enviar(db, fv, id, de, autor, texto, cambios) {
    var lote = db.batch();
    lote.set(docConv(db, id).collection("mensajes").doc(), { texto: texto, de: de, autor: autor, creado: fv.serverTimestamp() });
    lote.set(docConv(db, id), cambios, { merge: true });
    return lote.commit();
  }

  /* Conecta el formulario: limpia el campo al enviar y devuelve el texto si falla */
  function conectarEnvio(form, input, errEl, alEnviar) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var t = limpio(input.value);
      if (!t) return;
      input.value = "";
      errEl.hidden = true;
      new Promise(function (ok) { ok(alEnviar(t)); }).catch(function (err) {
        console.warn("chat", err);
        if (!input.value) input.value = t;
        errEl.textContent = "No se pudo enviar. Revisa tu conexión e inténtalo otra vez.";
        errEl.hidden = false;
      });
    });
  }

  /* miLado: de qué lado están los mensajes "míos" ("cliente" o "equipo") */
  function pintarMensajes(cont, msgs, miLado, verAutor, vacio) {
    var cerca = cont.scrollHeight - cont.scrollTop - cont.clientHeight < 60;
    var primera = !cont.dataset.mc;
    if (!msgs.length) {
      cont.innerHTML = '<p class="mc-aviso">' + esc(vacio) + "</p>";
    } else {
      cont.innerHTML = msgs.map(function (m) {
        var yo = m.de === miLado;
        var quien = (!yo || verAutor) && m.autor ? esc(m.autor) + " · " : "";
        return '<div class="mc-m ' + (yo ? "yo" : "otro") + '">' + esc(m.texto) + "<small>" + quien + esc(hora(m.creado)) + "</small></div>";
      }).join("");
    }
    if (cerca || primera) cont.scrollTop = cont.scrollHeight;
    cont.dataset.mc = "1";
  }

  function hiloHTML(c) {
    return '<div class="mc-hilo">' +
      '<div class="mc-hilo-cab"><b>' + esc(c.titulo) + "</b>" + (c.sub ? "<span>" + esc(c.sub) + "</span>" : "") + "</div>" +
      '<div class="mc-msgs" aria-live="polite"></div>' +
      '<form class="mc-form" autocomplete="off"><input maxlength="' + LIMITE + '" placeholder="' + esc(c.placeholder) + '" aria-label="Mensaje"><button type="submit">Enviar</button></form>' +
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
      '<form class="mc-form" hidden autocomplete="off"><input maxlength="' + LIMITE + '" placeholder="Escribe tu duda…" aria-label="Mensaje"><button type="submit">Enviar</button></form>' +
      '<p class="mc-err" hidden></p>';
    var intro = caja.querySelector(".mc-intro"), errBox = caja.querySelector(".mc-err-box"),
        msgsEl = caja.querySelector(".mc-msgs"), form = caja.querySelector(".mc-form"),
        input = form.querySelector("input"), errEl = caja.querySelector(".mc-err");
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
      form.hidden = !listo;
      if (listo) pintarMensajes(msgsEl, est.msgs, "cliente", false, "Escribe tu duda sobre camas, sofás, medidas o precios. Te respondemos aquí mismo.");
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

    conectarEnvio(form, input, errEl, function (t) {
      if (!est.cid) throw new Error("Todavía conectando el chat");
      return enviar(db, fv, est.cid, "cliente", est.nombre, t, {
        tipo: "visitante", nombre: est.nombre, contacto: est.contacto || "",
        actualizada: fv.serverTimestamp(), ultimo: resumen(t), ultimoDe: "cliente",
        noLeidaStaff: true, noLeidaParte: false
      });
    });

    function marcarLeido() {
      docConv(db, est.cid).update({ noLeidaParte: false }).catch(function (err) { console.warn("chat", err); });
    }

    function escucharMensajes() {
      if (est.quitarMsgs || !est.cid) return;
      est.quitarMsgs = mensajesDe(db, est.cid, function (lista) {
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

  /* ---------- Empleado (app de empleados) ---------- */
  function empleado(opts) {
    var db = opts.db, fv = opts.firebase.firestore.FieldValue;
    var correo = String(opts.email || "").toLowerCase();
    var nombre = limpio(opts.nombre) || "Equipo";
    var id = "e_" + correo;
    var est = { el: null, msgs: [], noLeida: false };
    estilos();

    function visible() { return !!(est.el && est.el.isConnected); }
    function avisar() { if (opts.onNoLeidas) opts.onNoLeidas(est.noLeida ? 1 : 0); }
    function marcarLeido() {
      docConv(db, id).update({ noLeidaParte: false }).catch(function (err) { console.warn("chat", err); });
    }
    function pintar() {
      if (!visible()) return;
      var cont = est.el.querySelector(".mc-msgs");
      if (cont) pintarMensajes(cont, est.msgs, "cliente", false, "Aún no has escrito. Pregunta lo que necesites: medidas, un pedido, algo del taller.");
    }

    docConv(db, id).onSnapshot(function (s) {
      var d = s.exists ? s.data() : null;
      est.noLeida = !!(d && d.noLeidaParte);
      avisar();
      if (est.noLeida && visible()) marcarLeido();
    }, function (err) { console.warn("chat", err); });
    mensajesDe(db, id, function (lista) { est.msgs = lista; pintar(); });

    return {
      montar: function (el) {
        estilos();
        est.el = el;
        el.innerHTML = hiloHTML({
          titulo: "Escribe al dueño",
          sub: "Tus dudas y avisos llegan al panel del dueño",
          placeholder: "Escribe tu mensaje…"
        });
        var form = el.querySelector(".mc-form"), input = form.querySelector("input"), err = el.querySelector(".mc-err");
        conectarEnvio(form, input, err, function (t) {
          return enviar(db, fv, id, "cliente", nombre, t, {
            tipo: "empleado", nombre: nombre, contacto: correo, actualizada: fv.serverTimestamp(),
            ultimo: resumen(t), ultimoDe: "cliente", noLeidaStaff: true, noLeidaParte: false
          });
        });
        pintar();
        if (est.noLeida) marcarLeido();
      }
    };
  }

  /* ---------- Equipo (panel del dueño y ayudantes) ---------- */
  function bandeja(opts) {
    var el = opts.el, db = opts.db, fv = opts.firebase.firestore.FieldValue;
    if (!el) return null;
    estilos();
    var miNombre = limpio(opts.nombre) || "Equipo";
    el.innerHTML = '<div class="mc-bandeja" data-vista="lista">' +
      '<div class="mc-col-lista">' +
        '<div class="mc-filtros" role="group" aria-label="Ver">' +
          '<button type="button" data-f="todos" aria-pressed="true">Todas</button>' +
          '<button type="button" data-f="visitante" aria-pressed="false">Clientes</button>' +
          '<button type="button" data-f="empleado" aria-pressed="false">Equipo</button>' +
        "</div>" +
        '<div class="mc-lista"></div>' +
      "</div>" +
      '<div class="mc-col-hilo">' +
        '<button type="button" class="mc-volver">← Volver a la lista</button>' +
        '<p class="mc-sin-sel">Elige una conversación para leerla y responder.</p>' +
        '<div class="mc-hilo-zona" hidden></div>' +
      "</div></div>";
    var raiz = el.querySelector(".mc-bandeja"), lista = el.querySelector(".mc-lista"),
        zona = el.querySelector(".mc-hilo-zona"), sinSel = el.querySelector(".mc-sin-sel");
    var st = { convs: [], filtro: "todos", sel: "", msgs: [], quitarMsgs: null, quitarLista: null };

    function autorDe(c) { return c && c.tipo === "empleado" ? miNombre : "Muebles Ideal"; }
    function enSeleccion() { return st.convs.filter(function (x) { return x.id === st.sel; })[0]; }

    function marcarLeido() {
      var c = enSeleccion();
      if (c && c.noLeidaStaff) {
        docConv(db, st.sel).update({ noLeidaStaff: false }).catch(function (err) { console.warn("chat", err); });
      }
    }

    function pintarLista() {
      el.querySelectorAll(".mc-filtros button").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-f") === st.filtro));
      });
      var ver = st.convs.filter(function (c) { return st.filtro === "todos" || c.tipo === st.filtro; });
      if (!ver.length) {
        lista.innerHTML = '<p class="mc-aviso">Todavía no hay conversaciones en esta vista.</p>';
        return;
      }
      lista.innerHTML = ver.map(function (c) {
        return '<button type="button" class="mc-fila' + (c.id === st.sel ? " act" : "") + (c.noLeidaStaff ? " nueva" : "") + '" data-id="' + esc(c.id) + '">' +
          '<span class="mc-fila-top"><b>' + esc(c.nombre || "Sin nombre") + "</b>" +
            "<small>" + (c.noLeidaStaff ? '<i class="mc-dot-f"></i>' : "") + esc(c.tipo === "empleado" ? "Equipo" : "Cliente web") + "</small></span>" +
          '<span class="mc-fila-txt">' + esc((c.ultimoDe === "equipo" ? "Equipo: " : "") + (c.ultimo || "")) + "</span>" +
          '<span class="mc-fila-hora">' + esc(hora(c.actualizada)) + "</span></button>";
      }).join("");
    }

    function pintarHilo() {
      var cont = zona.querySelector(".mc-msgs");
      if (cont) pintarMensajes(cont, st.msgs, "equipo", true, "Sin mensajes todavía.");
    }

    function seleccionar(id) {
      var c = st.convs.filter(function (x) { return x.id === id; })[0];
      st.sel = id;
      raiz.setAttribute("data-vista", "hilo");
      sinSel.hidden = true;
      zona.hidden = false;
      zona.innerHTML = hiloHTML({
        titulo: c ? c.nombre || "Sin nombre" : "Conversación",
        sub: c && c.tipo === "empleado" ? "Equipo · " + (c.contacto || "") : (c && c.contacto) || "Cliente de la página",
        placeholder: "Escribe tu respuesta…"
      });
      var form = zona.querySelector(".mc-form"), input = form.querySelector("input"), err = zona.querySelector(".mc-err");
      conectarEnvio(form, input, err, function (t) {
        return enviar(db, fv, id, "equipo", autorDe(c), t, {
          ultimo: resumen(t), ultimoDe: "equipo", actualizada: fv.serverTimestamp(),
          noLeidaParte: true, noLeidaStaff: false
        });
      });
      if (st.quitarMsgs) st.quitarMsgs();
      st.msgs = [];
      st.quitarMsgs = mensajesDe(db, id, function (lista2) { st.msgs = lista2; pintarHilo(); });
      pintarHilo();
      marcarLeido();
      pintarLista();
    }

    lista.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("[data-id]") : null;
      if (b) seleccionar(b.getAttribute("data-id"));
    });
    el.querySelector(".mc-filtros").addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("button[data-f]") : null;
      if (!b) return;
      st.filtro = b.getAttribute("data-f");
      pintarLista();
    });
    el.querySelector(".mc-volver").addEventListener("click", function () {
      raiz.setAttribute("data-vista", "lista");
    });

    st.quitarLista = db.collection("conversaciones").orderBy("actualizada", "desc").limit(150).onSnapshot(function (q) {
      st.convs = q.docs.map(function (d) { return Object.assign({ id: d.id }, datos(d)); });
      if (st.sel) marcarLeido();
      pintarLista();
    }, function (err) {
      console.warn("chat", err);
      lista.innerHTML = '<p class="mc-aviso">No pudimos cargar los mensajes. Revisa tu conexión.</p>';
    });
    pintarLista();

    return {
      salir: function () {
        if (st.quitarLista) st.quitarLista();
        if (st.quitarMsgs) st.quitarMsgs();
      }
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

  window.MiChat = { visitante: visitante, empleado: empleado, bandeja: bandeja, sinLeerStaff: sinLeerStaff };
})();
