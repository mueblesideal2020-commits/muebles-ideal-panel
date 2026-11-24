/* Menú común del panel de Muebles Ideal: une las secciones de cada rol, con íconos y el cambio de apariencia.
   Cada quien ve solo las secciones de su rol. Se carga después de iniciar Firebase. */
(function () {
  var DUENO = "mueblesideal2020@gmail.com";
  var aqui = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (aqui === "index.html" || aqui === "") return;
  var ICO = {
    inicio: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    catalogo: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/>',
    conta: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    inventario: '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    planos: '<path d="M3 21V3h18v18z"/><path d="M3 9h18M9 21V9"/>',
    mensajes: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'
  };
  var TEMA_ICO = {
    sistema: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
    claro: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    oscuro: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'
  };
  var ITEMS = [
    ["index.html", "Inicio", ["dueno", "admin", "ayudante"], "inicio"],
    ["catalogo.html", "Catálogo", ["dueno"], "catalogo"],
    ["contabilidad.html", "Contabilidad", ["dueno", "admin", "ayudante"], "conta"],
    ["inventario.html", "Inventario", ["dueno", "admin", "ayudante"], "inventario"],
    ["planos.html", "Planos", ["dueno", "admin"], "planos"],
    ["mensajes.html", "Mensajes", ["dueno", "admin", "ayudante"], "mensajes"]
  ];
  function svg(d, tam) {
    return '<svg viewBox="0 0 24 24" width="' + tam + '" height="' + tam + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>";
  }
  var css = document.createElement("style");
  css.textContent = ".mi-menu{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:6px;background:var(--barra-bg,rgba(255,255,255,.92));-webkit-backdrop-filter:blur(14px) saturate(1.5);backdrop-filter:blur(14px) saturate(1.5);border-bottom:1px solid var(--barra-linea,#e6eaf8);padding:8px 12px;padding-top:calc(8px + env(safe-area-inset-top,0px));overflow-x:auto;scrollbar-width:none;font-family:Karla,system-ui,sans-serif;font-size:13.5px;font-weight:700}"
    + ".mi-menu::-webkit-scrollbar{display:none}"
    + ".mi-menu .mi-marca{display:inline-flex;align-items:center;gap:8px;margin-right:6px;color:var(--titulo,#0c2572);font-family:Lexend,system-ui,sans-serif;font-weight:600;letter-spacing:.02em;font-size:14px;white-space:nowrap;text-decoration:none}"
    + ".mi-menu .mi-marca img{width:30px;height:30px;border-radius:9px;object-fit:contain;background:#fff;box-shadow:0 2px 8px -3px rgba(12,37,114,.35)}"
    + ".mi-menu a.mi-it{color:var(--barra-txt,#5e6889);text-decoration:none;padding:8px 14px;border-radius:999px;white-space:nowrap;min-height:38px;display:inline-flex;align-items:center;transition:background .2s,color .2s}"
    + ".mi-menu a.mi-it:hover{background:var(--barra-act-bg,#e3eaff);color:var(--barra-act-txt,#1d47b8)}.mi-menu a.mi-it[aria-current=page]{background:var(--barra-act-bg,#e3eaff);color:var(--barra-act-txt,#1d47b8)}"
    + ".mi-menu a.mi-it svg{margin-right:7px;transition:transform .3s cubic-bezier(.3,1.5,.5,1)}"
    + ".mi-menu a.mi-it:hover svg{transform:translateY(-2px) scale(1.08)}"
    + ".mi-menu a.mi-it[aria-current=page] svg{animation:mi-salta .55s cubic-bezier(.3,1.4,.5,1)}"
    + "@keyframes mi-salta{0%{transform:scale(.8)}45%{transform:translateY(-2px) scale(1.14)}75%{transform:scale(.97)}100%{transform:none}}"
    + ".mi-tema{margin-left:auto;flex:0 0 auto;width:38px;height:38px;padding:0;border-radius:50%;border:0;background:linear-gradient(135deg,#c9b6ff,#9fb7ff);color:#0c2572;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .25s;box-shadow:0 4px 12px -6px rgba(80,60,200,.7)}"
    + ".mi-tema:active{transform:scale(.9)}"
    + "@media (prefers-reduced-motion:reduce){.mi-menu a,.mi-menu a svg,.mi-tema{animation:none!important;transition:none!important}}"
    + "@media print{.mi-menu{display:none}}";
  document.head.appendChild(css);
  var nav = document.createElement("nav");
  nav.className = "mi-menu"; nav.setAttribute("aria-label", "Secciones del panel"); nav.hidden = true;
  document.body.insertBefore(nav, document.body.firstChild);
  /* Si la página ya tiene su propia barra fija (Documentos, Planos), el menú se desplaza con el contenido */
  if ([].some.call(document.querySelectorAll(".barra"), function (e) { return getComputedStyle(e).position === "sticky"; })) nav.style.position = "relative";

  var boton = document.createElement("button");
  boton.type = "button"; boton.className = "mi-tema";
  boton.addEventListener("click", function () { if (window.MI_TEMA) MI_TEMA.ciclo(); });
  function pintarTema() {
    if (!window.MI_TEMA) return;
    var p = MI_TEMA.actual();
    var txt = { sistema: "automática, como tu teléfono", claro: "clara", oscuro: "oscura" }[p] || "automática";
    boton.innerHTML = svg(TEMA_ICO[p] || TEMA_ICO.sistema, 18);
    boton.setAttribute("aria-label", "Apariencia " + txt + ". Toca para cambiar");
    boton.title = boton.getAttribute("aria-label");
  }
  if (window.MI_TEMA) MI_TEMA.onCambio(pintarTema);
  pintarTema();

  function pintar(rol) {
    var ls = rol ? ITEMS.filter(function (i) { return i[2].indexOf(rol) >= 0; }) : [ITEMS[0]];
    nav.innerHTML = '<a class="mi-marca" href="index.html" aria-label="Inicio del panel"><img src="logo-mark.png" alt="">Muebles Ideal</a>' + ls.slice(1).map(function (i) {
      return '<a class="mi-it" href="' + i[0] + '"' + (i[0] === aqui ? ' aria-current="page"' : "") + ">" + svg(ICO[i[3]], 16) + i[1] + "</a>";
    }).join("");
    boton.hidden = !window.MI_TEMA;
    nav.appendChild(boton);
    nav.hidden = ls.length < 2 && rol !== null;
  }
  window.MI_MENU = { pintar: pintar };

  if (!(window.firebase && firebase.apps && firebase.apps.length && firebase.auth)) { pintar(null); return; }
  firebase.auth().onAuthStateChanged(function (u) {
    if (!u) { nav.hidden = true; return; }
    var em = (u.email || "").toLowerCase();
    if (em === DUENO) return pintar("dueno");
    if (!firebase.firestore) return pintar(null);
    firebase.firestore().collection("equipo").doc(em).get().then(function (d) {
      var x = d.exists ? d.data() : null;
      pintar(x && x.activo !== false ? (x.rol === "administrador" ? "admin" : "ayudante") : null);
    }).catch(function () { pintar(null); });
  });
})();
