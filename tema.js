/* Apariencia de Muebles Ideal: claro, oscuro, o el que tenga el teléfono (por defecto: "sistema").
   La elección se guarda solo en este dispositivo. Pone data-tema-activo ("claro" | "oscuro") en <html>
   antes de pintar la página, así no parpadea. tema.css hace el resto. */
(function () {
  var CLAVE = "mi-tema";
  var OPCIONES = [["sistema", "Sistema"], ["claro", "Claro"], ["oscuro", "Oscuro"]];
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  var cambios = [];

  function leer() {
    try { var v = localStorage.getItem(CLAVE); return v === "claro" || v === "oscuro" ? v : "sistema"; }
    catch (e) { return "sistema"; }
  }
  function guardar(v) { try { localStorage.setItem(CLAVE, v); } catch (e) {} }
  function resuelto(pref) { return pref === "sistema" ? (mq && mq.matches ? "oscuro" : "claro") : pref; }

  function aplicar() {
    var pref = leer(), act = resuelto(pref), html = document.documentElement;
    html.setAttribute("data-tema", pref);
    html.setAttribute("data-tema-activo", act);
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      m.setAttribute("content", act === "oscuro" ? "#070f2a" : "#ffffff");
    });
  }

  function poner(v) {
    guardar(v);
    aplicar();
    cambios.forEach(function (f) { try { f(); } catch (e) {} });
  }

  function ciclo() {
    var orden = OPCIONES.map(function (o) { return o[0]; });
    poner(orden[(orden.indexOf(leer()) + 1) % orden.length]);
  }

  /* Pinta el selector de tres opciones dentro de "el" */
  function montar(el) {
    if (!el) return;
    el.innerHTML = '<div class="mt-seg" role="radiogroup" aria-label="Apariencia">' +
      OPCIONES.map(function (o) {
        return '<button type="button" role="radio" data-v="' + o[0] + '">' + o[1] + "</button>";
      }).join("") + "</div>";
    function pintar() {
      el.querySelectorAll("button[data-v]").forEach(function (b) {
        b.setAttribute("aria-checked", String(b.getAttribute("data-v") === leer()));
      });
    }
    el.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("button[data-v]") : null;
      if (b) poner(b.getAttribute("data-v"));
    });
    cambios.push(pintar);
    pintar();
  }

  aplicar();
  document.addEventListener("DOMContentLoaded", aplicar);
  if (mq) {
    var alCambiarSistema = function () { if (leer() === "sistema") poner("sistema"); };
    if (mq.addEventListener) mq.addEventListener("change", alCambiarSistema);
    else if (mq.addListener) mq.addListener(alCambiarSistema);
  }

  window.MI_TEMA = {
    actual: leer,
    resuelto: function () { return document.documentElement.getAttribute("data-tema-activo") || "claro"; },
    ciclo: ciclo,
    poner: poner,
    montar: montar,
    onCambio: function (f) { cambios.push(f); }
  };
})();
