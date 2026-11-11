/* =====================================================================
   Muebles Ideal · Motor de despiece de estructuras de sofá (versión 1)
   Basado en la estructura del taller:
   - BASE COMPLETA: un solo cajón del largo de los asientos (p. ej. 1,80 m × 28 cm
     de alto), con marco superior e inferior de listón de canto, una división
     por puesto, parales y cartelas a 45° en cada compartimiento.
   - BASTIDORES DE ASIENTO: uno por puesto (60 × 60 × 5 cm), se encinchan, llevan
     saco y goma espuma, se tapizan y se colocan encima de la base.
   - BRAZOS: cajón de dos caras (interior y exterior) con parales,
     travesaños y cartelas; tapa, frente y forro exterior de MDF.
   - ESPALDAR: cara trasera vertical + cara frontal inclinada, con una
     cartela lateral de tabla (trapecio) a cada lado que se atornilla al brazo.
   - DIVÁN (opcional): módulo largo con travesaños intermedios; puede llevar BAÚL.
   Todas las medidas en centímetros.
   ===================================================================== */
(function (g) {
  "use strict";
  const BASE = {
    tipo: "recto",          // "recto" | "divan"
    largo: 220,             // largo total del sofá
    fondo: 85,              // fondo total (asiento + espaldar)
    puestos: 3,             // cantidad de módulos de asiento (en diván, el diván cuenta como uno)
    brazos: "ambos",        // "ambos" | "izquierdo" | "derecho" | "ninguno"
    anchoBrazo: 20, altoBrazo: 50,
    altoBase: 28,           // alto de la base completa (sin patas)
    altoBastidor: 5,        // alto del bastidor de asiento (listón de canto)
    extraBastidor: 2,       // lo que suman cincha, saco y tela sobre el bastidor
    gomaPulg: 4,            // goma espuma del asiento, en pulgadas
    altoPata: 5,            // alto de las patas
    cinchaAncho: 5, cinchaSep: 3,   // cincha tejida en ambos sentidos: ancho y separación
    altoEspaldar: 60, fondoEspaldar: 25, topeEspaldar: 10,
    divanLado: "izquierda", divanLargo: 160, baul: false,
    la: 2.5, lb: 5,         // sección del listón (grueso × ancho)
    cartela: 10,            // largo de la cartela (corte a 45°)
    mdf: 0.4,               // grosor del MDF (cm)
    largoListon: 300,       // largo del listón que se compra
    sierra: 0.3             // pérdida por corte
  };
  const NUM = ["largo", "fondo", "puestos", "anchoBrazo", "altoBrazo", "altoBase", "altoBastidor", "extraBastidor", "gomaPulg", "altoPata", "cinchaAncho", "cinchaSep", "altoEspaldar", "fondoEspaldar", "topeEspaldar", "divanLargo", "la", "lb", "cartela", "mdf", "largoListon", "sierra"];
  const r1 = n => Math.round(n * 10) / 10;
  const fmt = n => String(r1(n)).replace(".", ",");

  function normal(p) {
    const q = Object.assign({}, p || {});
    if (q.altoAsiento != null && q.altoBase == null) q.altoBase = q.altoAsiento;   /* enlaces viejos */
    const x = Object.assign({}, BASE, q);
    NUM.forEach(k => { const v = parseFloat(String(x[k]).replace(",", ".")); x[k] = isFinite(v) ? v : BASE[k]; });
    x.puestos = Math.max(1, Math.round(x.puestos));
    x.baul = x.baul === true || x.baul === "1" || x.baul === "true";
    if (x.tipo !== "divan") x.tipo = "recto";
    return x;
  }
  /* Lados con brazo */
  const ladosBrazo = x => x.brazos === "ambos" ? ["izquierda", "derecha"] : x.brazos === "izquierdo" ? ["izquierda"] : x.brazos === "derecho" ? ["derecha"] : [];

  function calcular(p) {
    const x = normal(p), a = x.la, b = x.lb, sec = `${fmt(a)}×${fmt(b)}`;
    const lados = ladosBrazo(x), nb = lados.length, divan = x.tipo === "divan";
    const L = x.largo - nb * x.anchoBrazo;                 // largo de la zona de asientos = largo del espaldar
    const W = L / x.puestos;                               // ancho de cada módulo
    const D = x.fondo - x.fondoEspaldar;                   // fondo de la base y del bastidor
    const Dd = divan ? x.divanLargo - x.fondoEspaldar : D; // fondo del diván
    const H = x.altoBase, Hs = x.altoBastidor;
    const goma = x.gomaPulg * 2.54;
    const alturas = { pata: x.altoPata, base: H, bastidor: Hs + x.extraBastidor, goma: r1(goma) };
    alturas.asiento = r1(alturas.pata + alturas.base + alturas.bastidor + alturas.goma);
    const avisos = [];
    if (W < 40) avisos.push("Cada puesto queda de menos de 40 cm: revisa el largo o la cantidad de puestos.");
    if (D < 45) avisos.push("El fondo del asiento queda de menos de 45 cm.");
    if (H - 2 * b < 3) avisos.push("La base es muy baja para dos marcos de canto: los parales quedan muy cortos.");
    if (divan && Dd <= D) avisos.push("El largo del diván debe ser mayor que el fondo del sofá.");

    const grupos = [];
    const P = (n, c, l, corte, nota) => ({ n, c, l: r1(l), corte: corte || "Recto", sec, nota: nota || "" });
    const M = (n, c, an, al, nota) => ({ n, c, an: r1(an), al: r1(al), nota: nota || "" });
    const nNormales = divan ? x.puestos - 1 : x.puestos;

    /* --- Base completa: un cajón con una división por puesto --- */
    function base(largo, fondo, comp) {
      const k = Math.max(0, Math.ceil(fondo / 65) - 1);   /* en bases muy hondas (diván), travesaños cada ±60 cm */
      const piezas = [
        P("Larguero frente y fondo · marco superior", 2, largo),
        P("Larguero frente y fondo · marco inferior", 2, largo),
        P("Lateral y división · marco superior", comp + 1, fondo - 2 * a, "Recto", comp > 1 ? `${comp - 1} división${comp > 2 ? "es" : ""} entre puestos` : ""),
        P("Lateral y división · marco inferior", comp + 1, fondo - 2 * a),
        P("Paral (esquinas y divisiones)", 2 * (comp + 1), H - 2 * b),
        P("Cartela de esquina", 8 * comp, x.cartela, "45° en ambos extremos", "4 por compartimiento, arriba y abajo")
      ];
      if (k) { piezas.push(P("Travesaño intermedio · marcos sup. e inf.", 2 * k * comp, largo / comp - 2 * a)); piezas.push(P("Paral intermedio", 2 * k * (comp + 1), H - 2 * b)); }
      return piezas;
    }
    if (nNormales > 0) {
      const Lb = W * nNormales;
      grupos.push({ id: "base", comp: nNormales, Lb, t: "Base completa", cant: 1, med: `${fmt(Lb)} × ${fmt(D)} × ${fmt(H)} cm (largo × fondo × alto) · ${nNormales} compartimiento${nNormales === 1 ? "" : "s"} de ${fmt(W)}`,
        piezas: base(Lb, D, nNormales), mdf: [M("Frente de la base", 1, Lb, H)], herrajes: [] });
    }
    if (divan) {
      const g2 = { id: "basediv", comp: 1, Lb: W, t: "Base del diván" + (x.baul ? " con baúl" : ""), cant: 1, med: `${fmt(W)} × ${fmt(Dd)} × ${fmt(H)} cm (ancho × fondo × alto)`,
        piezas: base(W, Dd, 1), mdf: [M("Frente del diván", 1, W, H), M("Lateral visto del diván", 1, Dd - D, H, "Solo el tramo que sobresale del sofá")], herrajes: [] };
      if (x.baul) { g2.mdf.push(M("Fondo del baúl", 1, W, Dd)); g2.herrajes.push({ n: "Bisagras (el bastidor del diván hace de tapa)", c: 2 }, { n: "Pistones de gas para baúl", c: 2 }); }
      grupos.push(g2);
    }
    /* --- Bastidores de asiento (se encinchan, llevan saco y goma, se tapizan) --- */
    function bastidor(ancho, fondo) {
      const k = Math.max(0, Math.ceil(fondo / 65) - 1);
      const piezas = [P("Larguero frente y fondo", 2, ancho), P("Lateral", 2, fondo - 2 * a), P("Cartela de esquina", 4, x.cartela, "45° en ambos extremos")];
      if (k) piezas.push(P("Travesaño intermedio", k, ancho - 2 * a));
      const paso = x.cinchaAncho + x.cinchaSep;
      const nl = Math.ceil((ancho - 2 * a) / paso), nt = Math.ceil((fondo - 2 * a) / paso);
      const cincha = (nl * (fondo + 6) + nt * (ancho + 6)) / 100;   /* +6 cm para grapar */
      return { piezas, cincha, nl, nt, saco: ancho * fondo / 10000 };
    }
    const bastidores = [];
    if (nNormales > 0) { const bs = bastidor(W, D); bastidores.push(Object.assign({ id: "bastidor", t: "Bastidor de asiento", cant: nNormales, an: W, fo: D }, bs)); }
    if (divan) { const bs = bastidor(W, Dd); bastidores.push(Object.assign({ id: "bastidordiv", t: "Bastidor del diván", cant: 1, an: W, fo: Dd }, bs)); }
    bastidores.forEach(bs => grupos.push({ id: bs.id, t: bs.t, cant: bs.cant, an: bs.an, fo: bs.fo, nl: bs.nl, nt: bs.nt,
      med: `${fmt(bs.an)} × ${fmt(bs.fo)} × ${fmt(Hs)} cm · se encincha, saco y goma ${fmt(x.gomaPulg)}"`,
      piezas: bs.piezas, mdf: [],
      tablas: [{ n: "Cincha tejida (ambos sentidos)", c: bs.cant, med: `${fmt(bs.cincha)} m c/u`, nota: `${bs.nl} tiras de fondo y ${bs.nt} de lado, de ${fmt(x.cinchaAncho)} cm` },
        { n: "Saco (arpillera)", c: bs.cant, med: `${fmt(bs.an + 6)} × ${fmt(bs.fo + 6)} cm`, nota: "Sobre la cincha" },
        { n: `Goma espuma ${fmt(x.gomaPulg)}"`, c: bs.cant, med: `${fmt(bs.an)} × ${fmt(bs.fo)} cm`, nota: "Encima del saco" }],
      herrajes: [] }));
    /* --- Brazos --- */
    lados.forEach(lado => {
      const Pb = divan && lado === x.divanLado ? x.divanLargo : x.fondo, Ab = x.anchoBrazo, Hb = x.altoBrazo;
      const ya = grupos.find(gr => gr.id === "brazo" && gr.P === Pb);
      if (ya) { ya.cant++; ya.lados.push(lado); return; }
      grupos.push({ id: "brazo", P: Pb, lados: [lado], t: "Brazo", cant: 1, med: `${fmt(Ab)} × ${fmt(Pb)} × ${fmt(Hb)} cm (ancho × fondo × alto)`,
        piezas: [
          P("Paral · caras interior y exterior", 4, Hb),
          P("Travesaño sup., medio e inf. · por cara", 6, Pb - 2 * b),
          P("Separador entre caras", 4, Ab - 2 * a),
          P("Cartela de esquina", 8, x.cartela, "45° en ambos extremos")
        ],
        mdf: [M("Tapa superior", 1, Ab, Pb), M("Forro exterior", 1, Pb, Hb), M("Frente del brazo", 1, Ab, Hb)], herrajes: [] });
    });
    grupos.filter(gr => gr.id === "brazo").forEach(gr => { gr.t = gr.cant > 1 ? "Brazos (2 iguales)" : `Brazo ${gr.lados[0] === "izquierda" ? "izquierdo" : "derecho"}${divan && gr.lados[0] === x.divanLado ? " (lado del diván)" : ""}`; });
    /* --- Espaldar --- */
    const He = x.altoEspaldar, Fe = x.fondoEspaldar, Ft = Math.min(x.topeEspaldar, Fe);
    const inclinado = Math.hypot(He - b, Fe - Ft), ang = Math.round(Math.atan2(Fe - Ft, He - b) * 180 / Math.PI);
    const nPar = x.puestos + 1;
    grupos.push({ id: "espaldar", t: "Espaldar", cant: 1, med: `${fmt(L)} × ${fmt(Fe)} × ${fmt(He)} cm (largo × fondo abajo × alto) · arriba ${fmt(Ft)} cm`, ang,
      piezas: [
        P("Riel inferior · frente y fondo", 2, L),
        P("Riel superior", 1, L),
        P("Listón horizontal · cara inclinada", 2, L),
        P("Paral trasero vertical", nPar, He - 2 * b),
        P("Paral delantero inclinado", nPar, inclinado, `${ang}° en ambos extremos`, `Inclinación ${ang}° respecto a la vertical`),
        P("Traviesa de base", nPar, Fe - 2 * a)
      ],
      tablas: [{ n: "Cartela lateral del espaldar (trapecio)", c: 2, med: `base ${fmt(Fe)} · arriba ${fmt(Ft)} · alto ${fmt(He)} cm`, nota: "Tabla de 2,5 cm. Se atornilla al brazo." }],
      mdf: [M("Forro trasero", 1, L, He)], herrajes: [] });

    /* --- Totales --- */
    const cortes = [];
    grupos.forEach(gr => gr.piezas.forEach(pz => { for (let i = 0; i < pz.c * gr.cant; i++) cortes.push(pz.l); }));
    const metros = cortes.reduce((s, l) => s + l, 0) / 100;
    /* Acomodo de cortes en listones (el más largo primero) */
    const barras = [];
    cortes.slice().sort((p1, p2) => p2 - p1).forEach(l => {
      if (l > x.largoListon) { barras.push({ usado: l, cortes: [l], largo: true }); return; }
      const bar = barras.find(bb => !bb.largo && x.largoListon - bb.usado >= l + (bb.cortes.length ? x.sierra : 0));
      if (bar) { bar.usado += l + (bar.cortes.length ? x.sierra : 0); bar.cortes.push(l); } else barras.push({ usado: l, cortes: [l] });
    });
    const sobreLargo = barras.filter(bb => bb.largo).length;
    if (sobreLargo) avisos.push(`Hay ${sobreLargo} pieza(s) más largas que el listón de ${fmt(x.largoListon)} cm: hay que empatarlas o comprar listón más largo.`);
    const desperdicio = barras.length ? 100 - (cortes.reduce((s, l) => s + l, 0) / (barras.length * x.largoListon)) * 100 : 0;
    const areaMdf = grupos.reduce((s, gr) => s + gr.mdf.reduce((t, m) => t + m.c * m.an * m.al, 0) * gr.cant, 0);
    const laminas = Math.ceil(areaMdf * 1.15 / (122 * 244));
    const perimetroMdf = grupos.reduce((s, gr) => s + gr.mdf.reduce((t, m) => t + m.c * 2 * (m.an + m.al), 0) * gr.cant, 0);
    const nPiezas = grupos.reduce((s, gr) => s + gr.piezas.filter(pz => !/Cartela/.test(pz.n)).reduce((t, pz) => t + pz.c, 0) * gr.cant, 0);
    const nCartelas = grupos.reduce((s, gr) => s + gr.piezas.filter(pz => /Cartela/.test(pz.n)).reduce((t, pz) => t + pz.c, 0) * gr.cant, 0);
    const nModulos = x.puestos;   /* bastidores */
    const t2 = nPiezas * 4 + nCartelas * 2;
    const t3 = nb * 4 + x.puestos * 2 + (divan ? 4 : 0);
    const t4 = nb * 2 + (nb < 2 ? 2 : 0);
    const compra = [
      { n: `Listón ${sec} cm de ${fmt(x.largoListon)} cm`, c: barras.length, u: "unid.", nota: `${fmt(metros)} m en cortes · desperdicio aprox. ${Math.round(desperdicio)}%` },
      { n: `Lámina de MDF ${String(x.mdf * 10).replace(".", ",")} mm (1,22 × 2,44 m)`, c: laminas, u: "lám.", nota: `${fmt(areaMdf / 10000)} m² + 15% de desperdicio` },
      { n: "Tabla de 2,5 cm para cartelas del espaldar", c: 1, u: "pieza", nota: `2 trapecios de ${fmt(Fe)} × ${fmt(He)} cm` },
      { n: 'Tornillo drywall 2"', c: Math.ceil(t2 / 10) * 10, u: "unid.", nota: "Marcos, parales y cartelas (≈4 por pieza, 2 por cartela)" },
      { n: 'Tornillo drywall 3"', c: Math.ceil(t3 / 5) * 5, u: "unid.", nota: "Brazos a la base, espaldar a la base" + (divan ? " y diván a la base" : "") },
      { n: 'Tornillo 4"', c: t4, u: "unid.", nota: "Cartelas del espaldar a los brazos" },
      { n: "Grapas para MDF", c: Math.ceil(perimetroMdf / 8 / 50) * 50, u: "unid.", nota: "Una cada 8 cm de borde" },
      { n: "Cola blanca de carpintería", c: 1, u: "L", nota: "En todas las uniones" }
    ];
    const cinchaTot = bastidores.reduce((t, bs) => t + bs.cincha * bs.cant, 0), sacoTot = bastidores.reduce((t, bs) => t + bs.saco * bs.cant, 0);
    compra.splice(3, 0, { n: `Cincha de ${fmt(x.cinchaAncho)} cm`, c: Math.ceil(cinchaTot), u: "m", nota: "Bastidores de asiento, tejida en ambos sentidos" },
      { n: "Saco (arpillera)", c: Math.ceil(sacoTot * 1.2 * 10) / 10, u: "m²", nota: "Bastidores + 20% para doblar" },
      { n: `Goma espuma ${fmt(x.gomaPulg)}" para asientos`, c: bastidores.reduce((t, bs) => t + bs.cant, 0), u: "piezas", nota: bastidores.map(bs => `${bs.cant} de ${fmt(bs.an)} × ${fmt(bs.fo)}`).join(" + ") });
    grupos.forEach(gr => gr.herrajes.forEach(h => compra.push({ n: h.n, c: h.c * gr.cant, u: "unid.", nota: gr.t })));
    return { x, W, D, Dd, H, L, nb, lados, divan, grupos, barras, metros, desperdicio, areaMdf, laminas, compra, avisos, alturas };
  }

  /* ===================== PLANOS (SVG) ===================== */
  let K = 1;   /* escala de textos y cotas según el tamaño del dibujo */
  const C = { linea: "#141414", madera: "#e8d3a6", maderaB: "#9a7230", mdf: "#c9b89a", cota: "#b8913f", txt: "#141414", gris: "#6a655d" };
  function lienzo(w, h, pad, cuerpo) {
    return `<svg viewBox="${-pad} ${-pad} ${w + pad * 2} ${h + pad * 2}" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" style="width:100%;height:auto;display:block">${cuerpo}</svg>`;
  }
  const rect = (x, y, w, h, f, s, sw) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="${f || C.madera}" stroke="${s || C.maderaB}" stroke-width="${sw || 0.4}"/>`;
  const poly = (pts, f, s, sw) => `<polygon points="${pts.map(p => p.map(r1).join(",")).join(" ")}" fill="${f || C.madera}" stroke="${s || C.maderaB}" stroke-width="${sw || 0.4}"/>`;
  const txt = (x, y, t, sz, anc, rot, col, w) => `<text x="${r1(x)}" y="${r1(y)}" font-size="${r1(sz * K)}" text-anchor="${anc || "middle"}" fill="${col || C.txt}" ${w ? `font-weight="${w}"` : ""} ${rot ? `transform="rotate(${rot} ${r1(x)} ${r1(y)})"` : ""}>${t}</text>`;
  /* Cota horizontal (debajo/encima) o vertical (izq/der) */
  function cota(x1, y1, x2, y2, off, label, sz) {
    const hz = Math.abs(y2 - y1) < 0.01, s = (sz || 3.2) * K, t = 1.2 * K; off *= K;
    if (hz) { const y = y1 + off; return `<g stroke="${C.cota}" stroke-width="${r1(0.35 * K * 10) / 10}"><line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x1)}" y2="${r1(y + Math.sign(off) * t)}"/><line x1="${r1(x2)}" y1="${r1(y2)}" x2="${r1(x2)}" y2="${r1(y + Math.sign(off) * t)}"/><line x1="${r1(x1)}" y1="${r1(y)}" x2="${r1(x2)}" y2="${r1(y)}"/><line x1="${r1(x1 - t)}" y1="${r1(y + t)}" x2="${r1(x1 + t)}" y2="${r1(y - t)}"/><line x1="${r1(x2 - t)}" y1="${r1(y + t)}" x2="${r1(x2 + t)}" y2="${r1(y - t)}"/></g>${txt((x1 + x2) / 2, y + (off < 0 ? -1.2 * K : s + 0.6 * K), label, s / K, "middle", 0, C.txt, 700)}`; }
    const x = x1 + off; return `<g stroke="${C.cota}" stroke-width="${r1(0.35 * K * 10) / 10}"><line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x + Math.sign(off) * t)}" y2="${r1(y1)}"/><line x1="${r1(x2)}" y1="${r1(y2)}" x2="${r1(x + Math.sign(off) * t)}" y2="${r1(y2)}"/><line x1="${r1(x)}" y1="${r1(y1)}" x2="${r1(x)}" y2="${r1(y2)}"/><line x1="${r1(x - t)}" y1="${r1(y1 + t)}" x2="${r1(x + t)}" y2="${r1(y1 - t)}"/><line x1="${r1(x - t)}" y1="${r1(y2 + t)}" x2="${r1(x + t)}" y2="${r1(y2 - t)}"/></g>${txt(x + (off < 0 ? -1.3 * K : s + 0.3 * K), (y1 + y2) / 2, label, s / K, "middle", -90, C.txt, 700)}`;
  }
  /* Marco visto de frente: rectángulo de listones con cartelas en las esquinas */
  function marco(x0, y0, w, h, e, cart, rieles) {
    let s = rect(x0, y0, w, e) + rect(x0, y0 + h - e, w, e) + rect(x0, y0 + e, e, h - 2 * e) + rect(x0 + w - e, y0 + e, e, h - 2 * e);
    (rieles || []).forEach(ry => { s += rect(x0 + e, y0 + ry - e / 2, w - 2 * e, e); });
    if (cart) {
      const c = cart / Math.SQRT2, q = e * 0.9;
      [[x0 + e, y0 + e, 1, 1], [x0 + w - e, y0 + e, -1, 1], [x0 + e, y0 + h - e, 1, -1], [x0 + w - e, y0 + h - e, -1, -1]].forEach(([cx, cy, sx, sy]) => {
        s += poly([[cx + sx * c, cy], [cx + sx * (c + q), cy], [cx, cy + sy * (c + q)], [cx, cy + sy * c]]);
      });
    }
    return s;
  }
  /* Base completa: compartimientos (uno por puesto) con cartelas */
  function dibujarBase(r, gr, fondo) {
    const { x, H } = r, e = x.lb, w = x.la, Lb = gr.Lb, n = gr.comp, Wc = Lb / n;
    K = Math.max(1, Math.max(Lb, fondo) / 80); const gap = 22 * K;
    const k = Math.max(0, Math.ceil(fondo / 65) - 1), rieles = Array.from({ length: k }, (_, i) => fondo * (i + 1) / (k + 1));
    let s = txt(Lb / 2, -10 * K, "VISTA SUPERIOR · marco de la base", 3.4, "middle", 0, C.gris, 700);
    for (let i = 0; i < n; i++) s += marco(i * Wc, 0, Wc, fondo, w, x.cartela, rieles);
    s += rect(0, 0, Lb, w) + rect(0, fondo - w, Lb, w);   /* largueros enteros */
    s += txt(Lb / 2, fondo / 2 + 1.5 * K, "FRENTE ↓", 3, "middle", 0, C.gris);
    s += cota(0, fondo, Lb, fondo, 8, fmt(Lb)) + cota(Lb, 0, Lb, fondo, 8, fmt(fondo));
    if (n > 1) for (let i = 0; i < n; i++) s += cota(i * Wc, 0, (i + 1) * Wc, 0, -5, fmt(Wc), 2.8);
    const y2 = fondo + gap + 6 * K;
    s += txt(Lb / 2, y2 - 6 * K, "VISTA FRONTAL · base", 3.4, "middle", 0, C.gris, 700);
    s += rect(0, y2, Lb, e) + rect(0, y2 + H - e, Lb, e);
    for (let i = 0; i <= n; i++) { const qx = i === 0 ? 0 : i === n ? Lb - w * 1.4 : i * Wc - w * 0.7; s += rect(qx, y2 + e, w * 1.4, H - 2 * e); }
    s += cota(0, y2 + H, Lb, y2 + H, 8, fmt(Lb)) + cota(Lb, y2, Lb, y2 + H, 8, fmt(H));
    return lienzo(Lb, y2 + H, 16 * K, s);
  }
  /* Bastidor de asiento con el tejido de cincha */
  function dibujarBastidor(r, gr) {
    const { x } = r, w = x.la, an = gr.an, fo = gr.fo, Hs = x.altoBastidor;
    K = Math.max(1, Math.max(an, fo) / 70); const gap = 20 * K;
    const k = Math.max(0, Math.ceil(fo / 65) - 1), rieles = Array.from({ length: k }, (_, i) => fo * (i + 1) / (k + 1));
    let s = txt(an / 2, -10 * K, "VISTA SUPERIOR · bastidor encinchado", 3.4, "middle", 0, C.gris, 700);
    s += marco(0, 0, an, fo, w, x.cartela, rieles);
    const paso = x.cinchaAncho + x.cinchaSep, cw = x.cinchaAncho, col = "rgba(122,92,40,.28)", bor = "rgba(122,92,40,.6)";
    for (let i = 0; i < gr.nl; i++) { const cx = w + x.cinchaSep / 2 + i * paso; if (cx + cw > an - w + 0.1) break; s += rect(cx, 0, cw, fo, col, bor, 0.2); }
    for (let i = 0; i < gr.nt; i++) { const cy = w + x.cinchaSep / 2 + i * paso; if (cy + cw > fo - w + 0.1) break; s += rect(0, cy, an, cw, col, bor, 0.2); }
    s += cota(0, fo, an, fo, 8, fmt(an)) + cota(an, 0, an, fo, 8, fmt(fo));
    const y2 = fo + gap + 6 * K;
    s += txt(an / 2, y2 - 6 * K, "CORTE · capas del asiento", 3.4, "middle", 0, C.gris, 700);
    const g = r.alturas.goma, ex = x.extraBastidor;
    s += rect(0, y2 + g + ex, an, Hs) + txt(an / 2, y2 + g + ex + Hs / 2 + 1 * K, "bastidor", 2.8, "middle", 0, C.txt);
    s += rect(0, y2 + g, an, ex, "#b9a37a", "#7a5c28", 0.3);
    s += rect(0, y2, an, g, "#cfe3e8", "#6f9aa5", 0.4) + txt(an / 2, y2 + g / 2 + 1 * K, `goma ${fmt(x.gomaPulg)}"`, 2.8, "middle", 0, C.txt);
    s += cota(an, y2, an, y2 + g, 8, fmt(g), 2.8) + cota(an, y2 + g, an, y2 + g + ex + Hs, 8, fmt(ex + Hs), 2.8);
    s += txt(an / 2, y2 + g + ex + Hs + 6 * K, `franja oscura: cincha + saco + tela (${fmt(ex)} cm)`, 2.6, "middle", 0, C.gris);
    return lienzo(an, y2 + g + ex + Hs + 6 * K, 18 * K, s);
  }
  /* Corte de alturas: pata + base + bastidor + goma, con brazo y espaldar al fondo */
  function dibujarAlturas(r) {
    const { x, D, alturas: A } = r, Fe = x.fondoEspaldar, Ft = Math.min(x.topeEspaldar, Fe), F = x.fondo;
    K = Math.max(1, F / 80);
    const piso = A.pata + Math.max(x.altoBrazo, x.altoEspaldar) + 10, y = h => piso - h;
    let s = txt(F / 2, -6 * K, "CORTE LATERAL · alturas", 3.4, "middle", 0, C.gris, 700);
    s += `<line x1="${-8 * K}" y1="${r1(piso)}" x2="${r1(F + 6 * K)}" y2="${r1(piso)}" stroke="${C.gris}" stroke-width="${0.5 * K}"/>`;
    s += rect(3, y(A.pata), 3, A.pata, "#555", "#333") + rect(F - 6, y(A.pata), 3, A.pata, "#555", "#333");
    s += rect(0, y(A.pata + A.base), D, A.base) + txt(D / 2, y(A.pata + A.base / 2) + 1 * K, "BASE", 3, "middle", 0, C.txt, 700);
    s += rect(0, y(A.pata + A.base + A.bastidor), D, A.bastidor, "#d9c49b") ;
    s += rect(0, y(A.asiento), D, A.goma, "#cfe3e8", "#6f9aa5") + txt(D / 2, y(A.asiento - A.goma / 2) + 1 * K, "GOMA", 3, "middle", 0, C.txt, 700);
    const b0 = y(A.pata);
    s += poly([[F - Fe, b0], [F, b0], [F, b0 - x.altoEspaldar], [F - Ft, b0 - x.altoEspaldar]], "#cdb88f", C.maderaB, 0.5);
    s += txt(F - Fe / 2, b0 - x.altoEspaldar / 2, "ESPALDAR", 2.8, "middle", -90, C.txt, 700);
    s += `<rect x="0" y="${r1(b0 - x.altoBrazo)}" width="${r1(F)}" height="${r1(x.altoBrazo)}" fill="none" stroke="${C.gris}" stroke-width="${0.4 * K}" stroke-dasharray="${2 * K} ${1.5 * K}"/>`;
    s += txt(2 * K, b0 - x.altoBrazo - 1.5 * K, "contorno del brazo", 2.6, "start", 0, C.gris);
    s += cota(0, piso, 0, y(A.pata), -6, fmt(A.pata), 2.6) + cota(0, y(A.pata), 0, y(A.pata + A.base), -6, fmt(A.base), 2.6)
      + cota(0, y(A.pata + A.base), 0, y(A.pata + A.base + A.bastidor), -6, fmt(A.bastidor), 2.6) + cota(0, y(A.pata + A.base + A.bastidor), 0, y(A.asiento), -6, fmt(A.goma), 2.6);
    s += cota(0, piso, 0, y(A.asiento), -16, `asiento ${fmt(A.asiento)}`, 3);
    s += cota(F, piso, F, b0 - x.altoEspaldar, 8, fmt(A.pata + x.altoEspaldar), 3);
    s += cota(0, piso, D, piso, 7, fmt(D), 2.8) + cota(D, piso, F, piso, 7, fmt(Fe), 2.8);
    return lienzo(F, piso + 8 * K, 22 * K, s);
  }
  function dibujarBrazo(r, gr) {
    const { x } = r, e = x.lb, Pb = gr.P, Hb = x.altoBrazo, Ab = x.anchoBrazo; K = Math.max(1, (Pb + Ab) / 110); const gap = 22 * K;
    let s = txt(Pb / 2, -10 * K, "CARA LATERAL (interior y exterior)", 3.4, "middle", 0, C.gris, 700);
    s += marco(0, 0, Pb, Hb, e, x.cartela, [Hb / 2]);
    s += cota(0, Hb, Pb, Hb, 8, fmt(Pb)) + cota(Pb, 0, Pb, Hb, 8, fmt(Hb));
    const x2 = Pb + gap + 10 * K;
    s += txt(x2 + Ab / 2, -10 * K, "FRENTE", 3.4, "middle", 0, C.gris, 700);
    s += rect(x2, 0, Ab, Hb, C.mdf, "#8c7a5c") + rect(x2, 0, x.la, Hb) + rect(x2 + Ab - x.la, 0, x.la, Hb);
    s += cota(x2, Hb, x2 + Ab, Hb, 8, fmt(Ab));
    return lienzo(x2 + Ab, Hb, 16 * K, s);
  }
  function dibujarEspaldar(r) {
    const { x, L } = r, e = x.lb, He = x.altoEspaldar, Fe = x.fondoEspaldar, Ft = Math.min(x.topeEspaldar, Fe), n = x.puestos;
    K = Math.max(1, L / 110);
    const px = 0;
    let s = txt(px + Fe / 2, -8 * K, "PERFIL · cartela lateral", 3.4, "middle", 0, C.gris, 700);
    s += poly([[px, He], [px + Fe, He], [px + Fe, 0], [px + Fe - Ft, 0]], C.madera, C.maderaB, 0.5);
    s += txt(px - 3 * K, He * 0.55, "frente", 3, "end", 0, C.gris);
    s += cota(px, He, px + Fe, He, 8, fmt(Fe)) + cota(px + Fe, 0, px + Fe, He, 8, fmt(He));
    s += txt(px + Fe + 22 * K, 6 * K, `arriba ${fmt(Ft)} cm`, 3.2, "start", 0, C.txt, 700) + txt(px + Fe + 22 * K, 12 * K, `paral delantero a ${r.grupos.find(g => g.id === "espaldar").ang}°`, 3.2, "start", 0, C.gris);
    const y2 = He + 26 * K;
    s += txt(L / 2, y2 - 6 * K, "VISTA TRASERA · cara vertical", 3.4, "middle", 0, C.gris, 700);
    s += rect(0, y2, L, e) + rect(0, y2 + He - e, L, e);
    const w = x.la * 1.4;
    for (let i = 0; i <= n; i++) { const qx = i === 0 ? 0 : i === n ? L - w : i * L / n - w / 2; s += rect(qx, y2 + e, w, He - 2 * e); }
    s += cota(0, y2 + He, L, y2 + He, 8, fmt(L)) + cota(L, y2, L, y2 + He, 8, fmt(He));
    return lienzo(L, y2 + He, 16 * K, s);
  }
  function dibujarGeneral(r) {
    const { x, W, D, Dd, L, lados, divan } = r, Fe = x.fondoEspaldar, Ab = x.anchoBrazo;
    const fondoMax = divan ? x.divanLargo : x.fondo; K = Math.max(1, x.largo / 110);
    let s = "", cx = 0;
    const izq = lados.includes("izquierda"), der = lados.includes("derecha");
    const brazo = (bx, lado) => { const Pb = divan && lado === x.divanLado ? x.divanLargo : x.fondo; s += rect(bx, 0, Ab, Pb, "#d9c49b", C.maderaB, 0.6) + txt(bx + Ab / 2, Pb / 2, "BRAZO", 3, "middle", -90, C.txt, 700); };
    if (izq) { brazo(0, "izquierda"); cx = Ab; }
    s += rect(cx, 0, L, Fe, "#cdb88f", C.maderaB, 0.6) + txt(cx + L / 2, Fe / 2 + 1.2, "ESPALDAR", 3.4, "middle", 0, C.txt, 700);
    for (let i = 0; i < x.puestos; i++) {
      const esDiv = divan && ((x.divanLado === "izquierda" && i === 0) || (x.divanLado === "derecha" && i === x.puestos - 1));
      const fd = esDiv ? Dd : D;
      s += rect(cx + i * W, Fe, W, fd, esDiv ? "#efe0c0" : C.madera, C.maderaB, 0.6);
      s += txt(cx + i * W + W / 2, Fe + fd / 2, esDiv ? (x.baul ? "DIVÁN + BAÚL" : "DIVÁN") : `PUESTO ${i + 1}`, 3.2, "middle", 0, C.txt, 700);
      s += cota(cx + i * W, Fe + fd, cx + (i + 1) * W, Fe + fd, 7, fmt(W), 3.2);
    }
    if (der) brazo(cx + L, "derecha");
    s += cota(0, 0, x.largo, 0, -9, `${fmt(x.largo)} cm`, 3.6);
    s += cota(x.largo, 0, x.largo, x.fondo, 9, fmt(x.fondo), 3.2);
    if (divan) s += cota(0, 0, 0, x.divanLargo, -9, fmt(x.divanLargo), 3.2);
    return lienzo(x.largo, fondoMax + 10 * K, 18 * K, s);
  }
  function planos(r) {
    const out = { general: dibujarGeneral(r), alturas: dibujarAlturas(r) };
    r.grupos.forEach(gr => {
      if (gr.id === "base") gr.svg = dibujarBase(r, gr, r.D);
      else if (gr.id === "basediv") gr.svg = dibujarBase(r, gr, r.Dd);
      else if (gr.id === "bastidor" || gr.id === "bastidordiv") gr.svg = dibujarBastidor(r, gr);
      else if (gr.id === "brazo") gr.svg = dibujarBrazo(r, gr);
      else if (gr.id === "espaldar") gr.svg = dibujarEspaldar(r);
    });
    return out;
  }
  /* Parámetros a partir de un modelo de la página (FABRICACION) y la orden */
  function desdeModelo(fab, o) {
    const p = {};
    if (!fab) return p;
    const ancho = parseFloat(fab.ancho), fondo = parseFloat(fab.fondo);
    const conDivan = /div[aá]n|L\b|modular/i.test(fab.tipo || "") && fondo > 120;
    if (ancho) p.largo = ancho;
    if (conDivan) { p.tipo = "divan"; p.fondo = 95; p.divanLargo = fondo; p.brazos = "ambos"; }
    else if (fondo) p.fondo = fondo;
    if (o && /derecha/i.test(o.lado || "")) p.divanLado = "derecha"; else if (o && /izquierda/i.test(o.lado || "")) p.divanLado = "izquierda";
    return p;
  }
  const aHash = p => Object.entries(p).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
  const deHash = h => { const p = {}; String(h || "").replace(/^#/, "").split("&").filter(Boolean).forEach(kv => { const [k, v] = kv.split("="); if (k in BASE) p[k] = decodeURIComponent(v || ""); }); return p; };
  g.Estructura = { BASE, calcular, planos, desdeModelo, aHash, deHash, fmt };
})(window);
