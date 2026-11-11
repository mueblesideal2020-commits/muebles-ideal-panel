/* Menú común del panel de Muebles Ideal: une Catálogo, Contabilidad y Planos.
   Cada quien ve solo las secciones de su rol. Se carga después de iniciar Firebase. */
(function () {
  var DUENO = "mueblesideal2020@gmail.com";
  var aqui = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (aqui === "index.html" || aqui === "") return;
  var ITEMS = [
    ["index.html", "Inicio", ["dueno", "admin", "ayudante"]],
    ["catalogo.html", "Catálogo", ["dueno"]],
    ["contabilidad.html", "Contabilidad", ["dueno", "admin", "ayudante"]],
    ["planos.html", "Planos", ["dueno", "admin"]]
  ];
  var css = document.createElement("style");
  css.textContent = ".mi-menu{position:relative;z-index:30;display:flex;align-items:center;gap:4px;background:#0b0b0b;padding:6px 12px;overflow-x:auto;scrollbar-width:none;font-family:Karla,system-ui,sans-serif;font-size:13px;font-weight:700}"
    + ".mi-menu::-webkit-scrollbar{display:none}.mi-menu b{color:#d4ad62;font-family:Lexend,system-ui,sans-serif;font-weight:500;letter-spacing:.08em;font-size:12px;margin-right:8px;white-space:nowrap}"
    + ".mi-menu a{color:#d8d3c8;text-decoration:none;padding:7px 13px;border-radius:999px;white-space:nowrap;min-height:30px;display:inline-flex;align-items:center}"
    + ".mi-menu a:hover{background:#222;color:#fff}.mi-menu a[aria-current=page]{background:#b8913f;color:#141414}@media print{.mi-menu{display:none}}";
  document.head.appendChild(css);
  var nav = document.createElement("nav");
  nav.className = "mi-menu"; nav.setAttribute("aria-label", "Secciones del panel"); nav.hidden = true;
  document.body.insertBefore(nav, document.body.firstChild);

  function pintar(rol) {
    var ls = rol ? ITEMS.filter(function (i) { return i[2].indexOf(rol) >= 0; }) : [ITEMS[0]];
        nav.innerHTML = "<b>MUEBLES IDEAL</b>" + ls.map(function (i) {
      return '<a href="' + i[0] + '"' + (i[0] === aqui ? ' aria-current="page"' : "") + ">" + i[1] + "</a>";
    }).join("");
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
