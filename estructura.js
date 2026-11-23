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
   - SOFÁ EN L CON DIVÁN Y SOFÁ CAMA ("divanL" y "sofaCama"): diseños fijos del plano v7; no usan las medidas del formulario.
   - CAMA: base de un solo cajón (largo × ancho del colchón) y cabecero: tablero
     entre dos cartelas trapecio (fondo abajo, tramo recto, fondo arriba).
   Todas las medidas en centímetros.
   ===================================================================== */
(function (g) {
  "use strict";
  const BASE = {
    tipo: "recto",          // "recto" | "divan" | "cama"
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
    altoCabecero: 120, anchoCabecero: 145,   // cama: alto del cabecero desde el piso (su ancho = ancho interior + 2 × grosor de la madera)
    grosorMadera: 2.5,                        // cama: grosor de la madera del marco, por cada lado
    cantGavetas: 0, fondoGaveta: 40, anchoGaveta: 35, altoGaveta: 25, grosorGaveta: 1.5,   // cama: gavetas en la mitad de la cabecera, del otro lado de la línea del medio, frente hacia el lateral: fondo, frente, alto y grosor del MDF
    grosorCabecero: 15, grosorCabeceroArriba: 7, rectoCabecero: 50,   // cama: fondo abajo, fondo arriba y tramo recto de la cartela
    la: 2.5, lb: 5,         // sección del listón (grueso × ancho)
    cartela: 10,            // largo de la cartela (corte a 45°)
    mdf: 0.4,               // grosor del MDF (cm)
    largoListon: 300,       // largo del listón que se compra
    sierra: 0.3             // pérdida por corte
  };
  const NUM = ["largo", "fondo", "puestos", "anchoBrazo", "altoBrazo", "altoBase", "altoBastidor", "extraBastidor", "gomaPulg", "altoPata", "cinchaAncho", "cinchaSep", "altoEspaldar", "fondoEspaldar", "topeEspaldar", "divanLargo", "altoCabecero", "anchoCabecero", "grosorCabecero", "grosorCabeceroArriba", "rectoCabecero", "grosorMadera", "cantGavetas", "fondoGaveta", "anchoGaveta", "altoGaveta", "grosorGaveta", "la", "lb", "cartela", "mdf", "largoListon", "sierra"];
  const r1 = n => Math.round(n * 10) / 10;
  const fmt = n => String(r1(n)).replace(".", ",");
  /* Tamaños estándar de cama (los mismos de la tienda): ancho × largo del colchón */
  /* Camas de la fábrica: ancho INTERIOR y largo EXTERNO (todas a 2 m). El cabecero y el marco externo suman 5 cm al ancho. */
  const CAMAS = { individual: { nombre: "Individual", ancho: 100, largo: 200 }, matrimonial: { nombre: "Matrimonial", ancho: 140, largo: 200 }, queen: { nombre: "Queen", ancho: 160, largo: 200 }, king: { nombre: "King", ancho: 200, largo: 200 } };
  const nombreCama = (largo, ancho) => { const k = Object.values(CAMAS).find(c => c.largo === +largo && c.ancho === +ancho); return k ? k.nombre : "a medida"; };

  function normal(p) {
    const q = Object.assign({}, p || {});
    if (q.altoAsiento != null && q.altoBase == null) q.altoBase = q.altoAsiento;   /* enlaces viejos */
    const x = Object.assign({}, BASE, q);
    NUM.forEach(k => { const v = parseFloat(String(x[k]).replace(",", ".")); x[k] = isFinite(v) ? v : BASE[k]; });
    x.puestos = Math.max(1, Math.round(x.puestos));
    x.baul = x.baul === true || x.baul === "1" || x.baul === "true";
    if (x.tipo !== "divan" && x.tipo !== "cama") x.tipo = "recto";
    if (x.tipo === "cama") { x.puestos = 1; x.brazos = "ninguno"; x.baul = false; x.altoBase = 35; x.anchoCabecero = x.fondo + 2 * x.grosorMadera; x.cantGavetas = Math.max(0, Math.round(x.cantGavetas)); }   /* cama: una base y un cabecero, sin brazos ni asientos; cajas de 35 cm; ancho de la cama = interior */
    return x;
  }
  /* Lados con brazo */
  const ladosBrazo = x => x.brazos === "ambos" ? ["izquierda", "derecha"] : x.brazos === "izquierdo" ? ["izquierda"] : x.brazos === "derecho" ? ["derecha"] : [];

  function calcular(p) {
    if (p && p.tipo === "divanL") return calcularDivanL();
    if (p && p.tipo === "sofaCama") return calcularSofaCama();
    const x = normal(p), a = x.la, b = x.lb, sec = `${fmt(a)}×${fmt(b)}`;
    const cama = x.tipo === "cama";
    const lados = ladosBrazo(x), nb = lados.length, divan = x.tipo === "divan";
    const L = x.largo - nb * x.anchoBrazo;                 // largo de la zona de asientos = largo del espaldar
    const W = L / x.puestos;                               // ancho de cada módulo
    const D = cama ? x.fondo : x.fondo - x.fondoEspaldar;  // fondo de la base y del bastidor (en cama, el ancho de la cama)
    const Dd = divan ? x.divanLargo - x.fondoEspaldar : D; // fondo del diván
    const H = x.altoBase, Hs = x.altoBastidor;
    const goma = x.gomaPulg * 2.54;
    const alturas = { pata: x.altoPata, base: H, bastidor: cama ? 0 : Hs + x.extraBastidor, goma: cama ? 0 : r1(goma) };
    alturas.asiento = r1(alturas.pata + alturas.base + alturas.bastidor + alturas.goma);
    const avisos = [];
    if (W < 40) avisos.push("Cada puesto queda de menos de 40 cm: revisa el largo o la cantidad de puestos.");
    if (D < 45) avisos.push("El fondo del asiento queda de menos de 45 cm.");
    if (H - 2 * b < 3) avisos.push("La base es muy baja para dos marcos de canto: los parales quedan muy cortos.");
    if (divan && Dd <= D) avisos.push("El largo del diván debe ser mayor que el fondo del sofá.");
    if (cama && x.altoCabecero <= x.altoPata + H) avisos.push("El cabecero debe quedar más alto que la base.");

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
      const cajas = cama ? Math.ceil(x.largo / 100 - 1e-9) : 1;   /* cama: cajas de 1 m como máximo */
      const Lb = (W * nNormales) / cajas;
      grupos.push({ id: "base", comp: cama ? 1 : nNormales, Lb, t: cama ? "Caja de la base" : "Base completa", cant: cajas, med: cama ? `${fmt(Lb)} × ${fmt(D)} × ${fmt(H)} cm (largo × ancho × alto) · ${cajas} cajas de ${fmt(Lb)} cm` :`${fmt(Lb)} × ${fmt(D)} × ${fmt(H)} cm (largo × fondo × alto) · ${nNormales} compartimiento${nNormales === 1 ? "" : "s"} de ${fmt(W)}`,
        piezas: base(Lb, D, cama ? 1 : nNormales), mdf: [M("Frente de la base", 1, Lb, H)], herrajes: [] });
    }
    if (divan) {
      const g2 = { id: "basediv", comp: 1, Lb: W, t: "Base del diván" + (x.baul ? " con baúl" : ""), cant: 1, med: `${fmt(W)} × ${fmt(Dd)} × ${fmt(H)} cm (ancho × fondo × alto)`,
        piezas: base(W, Dd, 1), mdf: [M("Frente del diván", 1, W, H), M("Lateral visto del diván", 1, Dd - D, H, "Solo el tramo que sobresale del sofá")], herrajes: [] };
      if (x.baul) { g2.mdf.push(M("Fondo del baúl", 1, W, Dd)); g2.herrajes.push({ n: "Bisagras (el bastidor del diván hace de tapa)", c: 2 }, { n: "Pistones de gas para baúl", c: 2 }); }
      grupos.push(g2);
    }
    /* --- Gavetas (solo cama): en la mitad de la cabecera, del otro lado de la línea del medio. Frente = anchoGaveta a lo largo de la cama,
       fondo = fondoGaveta hacia adentro desde el lateral. Se alternan izquierda y derecha, apiladas hacia la cabecera. --- */
    const nGav = cama ? x.cantGavetas : 0;
    if (nGav > 0) {
      const bcaja = grupos.find(gr => gr.id === "base"), mitadL = bcaja.Lb * bcaja.cant / 2;
      const pg = x.fondoGaveta, wg = x.anchoGaveta, Hg = x.altoGaveta, gg = x.grosorGaveta;
      const MG = (n, c, an, al, nota) => Object.assign(M(n, c, an, al, nota), { g: gg });
      grupos.push({ id: "gaveta", t: "Gaveta (mitad de la cabecera)", cant: nGav, Lg: pg, wg, med: `${fmt(wg)} × ${fmt(pg)} × ${fmt(Hg)} cm (frente × fondo × alto) · frente hacia el lateral · MDF ${fmt(gg * 10)} mm`,
        piezas: [], tablas: [],
        mdf: [MG("Frente de la gaveta", 1, wg, Hg), MG("Laterales de la gaveta", 2, pg, Hg), MG("Trasera de la gaveta", 1, wg - 2 * gg, Hg), MG("Fondo de la gaveta", 1, wg - 2 * gg, pg)],
        herrajes: [{ n: `Guía telescópica ${fmt(pg)} cm (par)`, c: 1 }, { n: "Tirador de gaveta", c: 1 }] });
      const porLado = Math.floor(mitadL / (wg + 1));
      if (nGav > 2 * porLado) avisos.push("Hay más gavetas de las que caben en la mitad de la cabecera: revisa la cantidad.");
      if (2 * pg + 2 > D) avisos.push("El fondo de las gavetas es muy grande para el ancho de la cama: revisa el fondo.");
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
    if (nNormales > 0 && !cama) { const bs = bastidor(W, D); bastidores.push(Object.assign({ id: "bastidor", t: "Bastidor de asiento", cant: nNormales, an: W, fo: D }, bs)); }
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
    if (!cama) grupos.push({ id: "espaldar", t: "Espaldar", cant: 1, med: `${fmt(L)} × ${fmt(Fe)} × ${fmt(He)} cm (largo × fondo abajo × alto) · arriba ${fmt(Ft)} cm`, ang,
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
    /* --- Cabecero (solo cama): tablero entre dos cartelas trapecio --- */
    if (cama) {
      const an = x.anchoCabecero, Hc = x.altoCabecero, g0 = x.grosorCabecero, g1 = Math.min(x.grosorCabeceroArriba, g0), rc = Math.min(x.rectoCabecero, Hc);
      grupos.push({ id: "cabecero", t: "Cabecero", cant: 1, an, Hc, g0, g1, rc, med: `${fmt(an)} × ${fmt(Hc)} cm (ancho × alto desde el piso)`,
        piezas: [P("Riel superior · entre cartelas", 1, an - 2 * a), P("Riel inferior · entre cartelas", 1, an - 2 * a)],
        tablas: [{ n: "Cartela lateral del cabecero (trapecio)", c: 2, med: `base ${fmt(g0)} · tramo recto ${fmt(rc)} · arriba ${fmt(g1)} · alto ${fmt(Hc)} cm`, nota: "Tabla de 2,5 cm. Se atornilla a la base." }],
        mdf: [M("Tablero del cabecero", 1, an, Hc)], herrajes: [] });
    }

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
    const areaMdf = grupos.filter(gr => gr.id !== "gaveta").reduce((s, gr) => s + gr.mdf.reduce((t, m) => t + m.c * m.an * m.al, 0) * gr.cant, 0);
    const laminas = Math.ceil(areaMdf * 1.15 / (122 * 244));
    const perimetroMdf = grupos.reduce((s, gr) => s + gr.mdf.reduce((t, m) => t + m.c * 2 * (m.an + m.al), 0) * gr.cant, 0);
    const nPiezas = grupos.reduce((s, gr) => s + gr.piezas.filter(pz => !/Cartela/.test(pz.n)).reduce((t, pz) => t + pz.c, 0) * gr.cant, 0);
    const nCartelas = grupos.reduce((s, gr) => s + gr.piezas.filter(pz => /Cartela/.test(pz.n)).reduce((t, pz) => t + pz.c, 0) * gr.cant, 0);
    const nModulos = x.puestos;   /* bastidores */
    const t2 = nPiezas * 4 + nCartelas * 2;
    const t3 = cama ? 4 : nb * 4 + x.puestos * 2 + (divan ? 4 : 0);
    const t4 = nb * 2 + (nb < 2 ? 2 : 0);
    const compra = [
      { n: `Listón ${sec} cm de ${fmt(x.largoListon)} cm`, c: barras.length, u: "unid.", nota: `${fmt(metros)} m en cortes · desperdicio aprox. ${Math.round(desperdicio)}%` },
      { n: `Lámina de MDF ${String(x.mdf * 10).replace(".", ",")} mm (1,22 × 2,44 m)`, c: laminas, u: "lám.", nota: `${fmt(areaMdf / 10000)} m² + 15% de desperdicio` },
      ...(cama ? [{ n: "Tabla de 2,5 cm para cartelas del cabecero", c: 1, u: "pieza", nota: `2 trapecios de ${fmt(x.grosorCabecero)} a ${fmt(x.grosorCabeceroArriba)} × ${fmt(x.altoCabecero)} cm` }]
        : [{ n: "Tabla de 2,5 cm para cartelas del espaldar", c: 1, u: "pieza", nota: `2 trapecios de ${fmt(Fe)} × ${fmt(He)} cm` }]),
      { n: 'Tornillo drywall 2"', c: Math.ceil(t2 / 10) * 10, u: "unid.", nota: "Marcos, parales y cartelas (≈4 por pieza, 2 por cartela)" },
      { n: 'Tornillo drywall 3"', c: Math.ceil(t3 / 5) * 5, u: "unid.", nota: cama ? "Cabecero a la base" : "Brazos a la base, espaldar a la base" + (divan ? " y diván a la base" : "") },
      ...(cama ? [] : [{ n: 'Tornillo 4"', c: t4, u: "unid.", nota: "Cartelas del espaldar a los brazos" }]),
      { n: "Grapas para MDF", c: Math.ceil(perimetroMdf / 8 / 50) * 50, u: "unid.", nota: "Una cada 8 cm de borde" },
      { n: "Cola blanca de carpintería", c: 1, u: "L", nota: "En todas las uniones" }
    ];
    const gavs = grupos.filter(gr => gr.id === "gaveta"), areaGav = gavs.reduce((s, gr) => s + gr.mdf.reduce((t, m) => t + m.c * m.an * m.al, 0) * gr.cant, 0);
    if (areaGav) compra.splice(2, 0, { n: "Lámina de MDF 15 mm (1,22 × 2,44 m)", c: Math.ceil(areaGav * 1.15 / (122 * 244)), u: "lám.", nota: `${fmt(areaGav / 10000)} m² de gavetas + 15% de desperdicio` });
    const cinchaTot = bastidores.reduce((t, bs) => t + bs.cincha * bs.cant, 0), sacoTot = bastidores.reduce((t, bs) => t + bs.saco * bs.cant, 0);
    if (bastidores.length) compra.splice(3, 0, { n: `Cincha de ${fmt(x.cinchaAncho)} cm`, c: Math.ceil(cinchaTot), u: "m", nota: "Bastidores de asiento, tejida en ambos sentidos" },
      { n: "Saco (arpillera)", c: Math.ceil(sacoTot * 1.2 * 10) / 10, u: "m²", nota: "Bastidores + 20% para doblar" },
      { n: `Goma espuma ${fmt(x.gomaPulg)}" para asientos`, c: bastidores.reduce((t, bs) => t + bs.cant, 0), u: "piezas", nota: bastidores.map(bs => `${bs.cant} de ${fmt(bs.an)} × ${fmt(bs.fo)}`).join(" + ") });
    grupos.forEach(gr => gr.herrajes.forEach(h => compra.push({ n: h.n, c: h.c * gr.cant, u: "unid.", nota: gr.t })));
    return { x, W, D, Dd, H, L, nb, lados, divan, cama, interno: cama ? { largo: x.largo - 2 * x.grosorMadera, ancho: x.fondo } : null, grupos, barras, metros, desperdicio, areaMdf, laminas, compra, avisos, alturas };
  }

  /* ===================== Diseños fijos (plano v7): sofá en L con diván y sofá cama ===================== */
  /* No usan las medidas del formulario: sus medidas vienen del plano v7. Se dibujan en centímetros, con Y hacia arriba. */
  const DIB = { WOOD: "#e9d6ab", WOOD2: "#d8bf8a", GOMA: "#f6f0e3", GOMA_AZ: "#cfe3e8", INK: "#3b2f20", GRIS: "#8a8175", PATA: "#6b5a40", AZUL: "#1f4f8a", AZUL_G: "#6f9aa5" };
  const escS = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  class Lienzo {
    constructor(xmin, xmax, ymin, ymax, pad = 6) {
      this.xmin = xmin; this.ymax = ymax; this.pad = pad; this.k = 1.6;   /* escala de los textos: que se lean en el teléfono */
      this.W = xmax - xmin + 2 * pad; this.H = ymax - ymin + 2 * pad; this.it = [];
    }
    X(x) { return x - this.xmin + this.pad; }
    Y(y) { return this.ymax - y + this.pad; }
    rect(x, y, w, h, fill = DIB.WOOD, stroke = DIB.INK, dash = null, sw = 0.4) {
      const d = dash ? ` stroke-dasharray="${dash}"` : "";
      this.it.push(`<rect x="${this.X(x).toFixed(2)}" y="${this.Y(y + h).toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${d}/>`);
    }
    poly(pts, fill = DIB.WOOD, stroke = DIB.INK, dash = null, sw = 0.4) {
      const d = dash ? ` stroke-dasharray="${dash}"` : "";
      const p = pts.map(([x, y]) => `${this.X(x).toFixed(2)},${this.Y(y).toFixed(2)}`).join(" ");
      this.it.push(`<polygon points="${p}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${d}/>`);
    }
    line(x1, y1, x2, y2, stroke = DIB.GRIS, sw = 0.35, dash = null) {
      const d = dash ? ` stroke-dasharray="${dash}"` : "";
      this.it.push(`<line x1="${this.X(x1).toFixed(2)}" y1="${this.Y(y1).toFixed(2)}" x2="${this.X(x2).toFixed(2)}" y2="${this.Y(y2).toFixed(2)}" stroke="${stroke}" stroke-width="${sw}"${d}/>`);
    }
    text(x, y, t, size = 3, fill = DIB.INK, weight = 500, anchor = "middle", rot = 0) {
      const tr = rot ? ` transform="rotate(${rot} ${this.X(x).toFixed(2)} ${this.Y(y).toFixed(2)})"` : "";
      this.it.push(`<text x="${this.X(x).toFixed(2)}" y="${this.Y(y).toFixed(2)}" font-size="${(size * this.k).toFixed(2)}" fill="${fill}" font-weight="${weight}" text-anchor="${anchor}"${tr}>${escS(t)}</text>`);
    }
    /* Cota horizontal: la etiqueta va arriba (dy negativo) o abajo (dy positivo) de la línea */
    hdim(x1, x2, y, label, dy = -1.6) {
      const a = this.X(x1), b = this.X(x2), yy = this.Y(y), A = DIB.AZUL;
      this.it.push(`<g stroke="${A}" stroke-width="0.35"><line x1="${a.toFixed(2)}" y1="${yy.toFixed(2)}" x2="${b.toFixed(2)}" y2="${yy.toFixed(2)}"/><line x1="${a.toFixed(2)}" y1="${(yy - 1.2).toFixed(2)}" x2="${a.toFixed(2)}" y2="${(yy + 1.2).toFixed(2)}"/><line x1="${b.toFixed(2)}" y1="${(yy - 1.2).toFixed(2)}" x2="${b.toFixed(2)}" y2="${(yy + 1.2).toFixed(2)}"/></g>`);
      this.it.push(`<text x="${((a + b) / 2).toFixed(2)}" y="${(yy + dy).toFixed(2)}" font-size="${(3 * this.k).toFixed(2)}" fill="${A}" font-weight="700" text-anchor="middle">${escS(label)}</text>`);
    }
    /* Cota vertical: a la izquierda (side -1) o a la derecha (side 1) de la línea */
    vdim(x, y1, y2, label, side = -1) {
      const xx = this.X(x), a = this.Y(y1), b = this.Y(y2), m = (a + b) / 2, tx = side < 0 ? xx - 1.2 : xx + 4.2, A = DIB.AZUL;
      this.it.push(`<g stroke="${A}" stroke-width="0.35"><line x1="${xx.toFixed(2)}" y1="${a.toFixed(2)}" x2="${xx.toFixed(2)}" y2="${b.toFixed(2)}"/><line x1="${(xx - 1.2).toFixed(2)}" y1="${a.toFixed(2)}" x2="${(xx + 1.2).toFixed(2)}" y2="${a.toFixed(2)}"/><line x1="${(xx - 1.2).toFixed(2)}" y1="${b.toFixed(2)}" x2="${(xx + 1.2).toFixed(2)}" y2="${b.toFixed(2)}"/></g>`);
      this.it.push(`<text x="${tx.toFixed(2)}" y="${m.toFixed(2)}" font-size="${(3 * this.k).toFixed(2)}" fill="${A}" font-weight="700" text-anchor="middle" transform="rotate(-90 ${tx.toFixed(2)} ${m.toFixed(2)})">${escS(label)}</text>`);
    }
    svg() {
      return `<svg viewBox="0 0 ${this.W.toFixed(1)} ${this.H.toFixed(1)}" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" style="width:100%;height:auto;display:block">${this.it.join("")}</svg>`;
    }
  }
  /* Piezas, tableros y grupos con el mismo formato que los demás diseños */
  const pzF = (n, c, l, sec, nota) => ({ n, c, l, corte: "Recto", sec: sec || "2,5 × 5", nota: nota || "" });
  const lamF = (n, c, an, al, nota, mat) => ({ n, c, an, al, nota: nota || "", mat: mat || "Tablero 2,5 cm" });
  const grupoF = (id, t, med, piezas, mdf, tablas, herrajes) => ({ id, t, cant: 1, med, piezas: piezas || [], mdf: mdf || [], tablas: tablas || [], herrajes: herrajes || [], svg: "" });
  /* Acomodo de listones: el más largo primero, con sierra entre cortes (igual que el cálculo general) */
  function acomodarListones(cortes, largo, sierra) {
    const barras = [];
    cortes.slice().sort((p1, p2) => p2 - p1).forEach(l => {
      if (l > largo) { barras.push({ usado: l, cortes: [l], largo: true }); return; }
      const bar = barras.find(bb => !bb.largo && largo - bb.usado >= l + (bb.cortes.length ? sierra : 0));
      if (bar) { bar.usado += l + (bar.cortes.length ? sierra : 0); bar.cortes.push(l); } else barras.push({ usado: l, cortes: [l] });
    });
    return barras;
  }
  /* Cierra un diseño fijo: listones, tableros, cincha, saco, herrajes y lista de compra */
  function cerrarFijo(b) {
    const grupos = b.grupos, LARGO = 300, SIERRA = 0.3;
    const cortes = [];
    grupos.forEach(gr => gr.piezas.forEach(pz => { for (let i = 0; i < pz.c * gr.cant; i++) cortes.push(pz.l); }));
    const barras = acomodarListones(cortes, LARGO, SIERRA);
    const sumaCortes = cortes.reduce((s, l) => s + l, 0), metros = sumaCortes / 100;
    const desperdicio = barras.length ? 100 - (sumaCortes / (barras.length * LARGO)) * 100 : 0;
    const area = grupos.reduce((s, gr) => s + gr.mdf.reduce((t, m) => t + m.c * m.an * m.al, 0) * gr.cant, 0);
    const perim = grupos.reduce((s, gr) => s + gr.mdf.reduce((t, m) => t + m.c * 2 * (m.an + m.al), 0) * gr.cant, 0);
    const laminas = Math.max(1, Math.ceil(area * 1.15 / (122 * 244)));
    const compra = [
      { n: `Listón 2,5 × 5 cm de ${LARGO} cm`, c: barras.length, u: "unid.", nota: `${fmt(metros)} m en cortes · desperdicio aprox. ${Math.round(desperdicio)}%` },
      { n: "Tablero (lámina de 1,22 × 2,44 m)", c: laminas, u: "lám.", nota: `${fmt(area / 10000)} m² + 15% de desperdicio · grosores en la lista de cortes` },
      { n: 'Tornillo drywall 2"', c: Math.ceil(cortes.length * 4 / 10) * 10, u: "unid.", nota: "Marcos y parales (≈4 por pieza)" },
      { n: 'Tornillo drywall 3"', c: Math.ceil(cortes.length * 2 / 5) * 5, u: "unid.", nota: "Brazos, espaldar y base (estimado)" },
      { n: "Grapas para tablero", c: Math.ceil(perim / 8 / 50) * 50, u: "unid.", nota: "Una cada 8 cm de borde" },
      { n: "Cola blanca de carpintería", c: 1, u: "L", nota: "En todas las uniones" }
    ];
    /* Cincha y saco de los bastidores (cincha de 5 cm cada 8 cm, igual que el cálculo general) */
    const bast = b.bastidores || [];
    if (bast.length) {
      const cincha = bast.reduce((t, bs) => t + (Math.ceil((bs.an - 5) / 8) * (bs.fo + 6) + Math.ceil((bs.fo - 5) / 8) * (bs.an + 6)) / 100 * bs.cant, 0);
      const saco = bast.reduce((t, bs) => t + bs.an * bs.fo / 10000 * bs.cant, 0);
      compra.splice(2, 0, { n: "Cincha de 5 cm", c: Math.ceil(cincha), u: "m", nota: "Bastidores de asiento, tejida en ambos sentidos" },
        { n: "Saco (arpillera)", c: Math.ceil(saco * 1.2 * 10) / 10, u: "m²", nota: "Bastidores + 20% para doblar" });
    }
    grupos.forEach(gr => {
      gr.tablas.forEach(t => compra.push({ n: t.n, c: t.c * gr.cant, u: "piezas", nota: `${t.med}${t.nota ? " · " + t.nota : ""}` }));
      gr.herrajes.forEach(h => compra.push({ n: h.n, c: h.c * gr.cant, u: "unid.", nota: gr.t }));
    });
    return { x: b.x, W: 0, D: 0, Dd: 0, H: 0, L: 0, nb: 0, lados: [], divan: !!b.divan, cama: false, interno: null, grupos, barras, metros, desperdicio, areaMdf: area, laminas, compra, avisos: [], alturas: b.alturas, custom: b.custom, titulo: b.titulo, pie: b.pie, notas: b.notas, kpiMat: b.kpiMat };
  }
  /* Sofá en L con diván a la izquierda, 3 puestos (plano v7) */
  function calcularDivanL() {
    const t = new Lienzo(-14, 296, -6, 192), c = new Lienzo(-14, 104, -24, 80);
    /* Vista desde arriba: diván a la izquierda, fila de 3 puestos y brazo a la derecha, espaldar al fondo */
    t.rect(20, 0, 60, 170, DIB.WOOD2);
    t.text(50, 84, "DIVÁN", 4, DIB.INK, 700); t.text(50, 76, "base 60 × 170", 3);
    t.rect(0, 85, 20, 85, DIB.WOOD2); t.text(10, 120, "BRAZO", 2.8, DIB.INK, 700); t.text(10, 113, "85", 3);
    [80, 140, 200].forEach((x0, i) => { t.rect(x0, 85, 60, 60, DIB.GOMA); t.text(x0 + 30, 118, `PUESTO ${i + 1}`, 3.2, DIB.INK, 700); t.text(x0 + 30, 110, "60 × 60", 3); });
    t.rect(260, 85, 20, 85, DIB.WOOD2); t.text(270, 120, "BRAZO", 2.8, DIB.INK, 700); t.text(270, 113, "85", 3);
    t.rect(20, 145, 240, 25, DIB.WOOD); t.rect(20, 145, 240, 5, DIB.GOMA_AZ, DIB.AZUL_G);
    t.text(140, 158, "ESPALDAR 240 × 25 · goma de 2 pulgadas al frente", 3.2, DIB.INK, 700);
    t.hdim(0, 280, 186, "280 cm de largo");
    t.hdim(0, 20, 176, "20"); t.hdim(20, 80, 176, "60 diván"); t.hdim(80, 140, 176, "60"); t.hdim(140, 200, 176, "60"); t.hdim(200, 260, 176, "60"); t.hdim(260, 280, 176, "20");
    t.vdim(-4, 0, 170, "170 cm", -1);
    t.vdim(284, 85, 170, "85 cm de fondo", 1);
    /* Corte lateral de un puesto: espaldar montado sobre la base (25 atrás); bastidor y goma al frente (60) */
    c.line(-10, 0, 96, 0, DIB.GRIS, 0.5);
    c.rect(2, 0, 5, 5, DIB.PATA); c.rect(78, 0, 5, 5, DIB.PATA);
    c.rect(0, 5, 85, 21, DIB.WOOD2); c.text(42.5, 13.5, "BASE 21 · fondo 85", 3, DIB.INK, 700);
    c.rect(25, 26, 60, 7, DIB.WOOD); c.text(55, 28.6, "BASTIDOR 7", 2.6);
    c.rect(25, 33, 60, 10.2, DIB.GOMA_AZ, DIB.AZUL_G); c.text(55, 37.4, 'GOMA 4" (10,2)', 3, DIB.INK, 700);
    c.poly([[0, 26], [25, 26], [25, 43.2], [10, 65], [0, 65]], DIB.WOOD2);
    c.poly([[25, 43.2], [10, 65], [15, 65], [30, 43.2]], DIB.GOMA_AZ, DIB.AZUL_G);
    c.text(12, 44, "ESPALDAR", 2.6, DIB.INK, 700);
    c.text(33, 71, 'goma del espaldar 2" (5,08)', 2.8, DIB.INK, 500, "start");
    c.line(-6, 55, 92, 55, DIB.GRIS, 0.35, "2 1.5");
    c.text(90, 57.5, "brazo 55 (por confirmar)", 2.6, DIB.GRIS, 400, "end");
    c.hdim(0, 85, -12, "85 cm de fondo", 4);
    c.hdim(25, 85, -4, "60 asiento", 4); c.hdim(0, 25, -4, "25 espalda", 4);
    c.vdim(-4, 0, 65, "65 cm", -1);
    c.vdim(91, 0, 43.2, "asiento 43,2", 1);

    const brazo = (titulo, nota) => grupoF("brazo", titulo, "20 × 85 × 55 cm (ancho × fondo × alto)", [], [
      lamF("Caras laterales", 2, 85, 55, nota), lamF("Frente", 1, 20, 55), lamF("Tapa superior", 1, 20, 85)]);
    const grupos = [
      brazo("Brazo del último puesto", ""),
      brazo("Brazo del lado del diván", "Igual que el otro. Altura por confirmar"),
      grupoF("espaldar", "Espaldar", "240 × 25 × 65 cm (largo × fondo × alto)", [], [
        lamF("Tablero del espaldar", 1, 240, 65, "Montado sobre la base, en sus últimos 25 cm"),
        lamF("Cartelas (trapecio)", 2, 25, 65, "base 25 · tope 10 · alto 65")],
        [{ n: 'Goma espuma 2"', c: 1, med: "240 × 65 × 5,08", nota: "Al frente del espaldar" }]),
      grupoF("basediv", "Base del diván", "60 × 170 × 21 cm (ancho × largo × alto)", [
        pzF("Marco largo", 2, 170), pzF("Marco corto", 2, 60), pzF("Parales", 4, 21)]),
      grupoF("base", "Base de los 3 puestos", "60 × 85 × 21 cm por puesto (fondo 85)", [
        pzF("Marco de frente y fondo (arriba y abajo)", 12, 60, "2,5 × 5", "4 por puesto"),
        pzF("Laterales de la caja (fondo 85)", 12, 85, "2,5 × 5", "4 por puesto · agregado, confirmar"),
        pzF("Parales", 12, 21, "2,5 × 5", "4 por puesto")]),
      grupoF("bastidor", "Bastidores de asiento (3 puestos)", "60 × 60 cm por puesto · alto 7", [
        pzF("Largueros (frente y fondo)", 6, 60, "2,5 × 5", "Con cincha"), pzF("Travesaños (laterales)", 6, 50, "2,5 × 5")], [], [
        { n: 'Goma espuma 4" (10,2 cm) para puestos', c: 3, med: "60 × 65 × 10,2", nota: "Llega a la goma del espaldar" }]),
      grupoF("bastidordiv", "Bastidor del diván", "60 × 145 cm · alto 7 · agregado, confirmar", [
        pzF("Largueros (frente y fondo)", 2, 60, "2,5 × 5", "Agregado: el plano no lo lista"), pzF("Laterales", 2, 145, "2,5 × 5", "Agregado: el plano no lo lista")], [], [
        { n: 'Goma espuma 4" (10,2 cm) para diván', c: 1, med: "60 × 145 × 10,2", nota: "Goma espuma de 4 pulgadas" }])
    ];
    return cerrarFijo({
      x: { tipo: "divan", largo: 280, fondo: 85, divanLargo: 170, divanLado: "izquierda", la: 2.5, lb: 5, mdf: 0.4, largoListon: 300, sierra: 0.3 },
      divan: true, grupos,
      bastidores: [{ an: 60, fo: 60, cant: 3 }, { an: 60, fo: 145, cant: 1 }],
      alturas: { pata: 5, base: 21, bastidor: 7, goma: 10.2, asiento: 43.2 },
      custom: { general: t.svg(), alturas: c.svg() },
      titulo: "Sofá en L con diván izquierdo · 3 puestos (plano v7)",
      pie: "Izquierda: vista desde arriba, con el espaldar al fondo. Derecha: corte lateral de un puesto. Medidas en centímetros.",
      kpiMat: "Tablero 2,5 cm",
      notas: [
        { t: "Medidas y supuestos", l: [
          "Largo 280 = brazo 20 + diván 60 + 3 puestos de 60 + brazo 20.",
          "Diván de 80 de ancho (brazo 20 + asiento 60) por 170 de largo, con el espaldar al fondo.",
          "Base de 85 de fondo: 60 para el bastidor del asiento y 25 para montar el espaldar.",
          "Asiento 43,2 = patas 5 + base 21 + bastidor 7 + goma 10,2 (4 pulgadas).",
          "Goma del espaldar de 2 pulgadas (5,08), en la cara de enfrente; la goma del asiento llega a ella.",
          "Bastidores encinchados en ambos sentidos, como los demás del calculador.",
          "Las cantidades son estimadas: revisar antes de cortar." ] },
        { t: "Pendientes para cerrar los planos", l: [
          "Altura de los brazos: el plano usa 55 cm; confirmar si se mide desde el piso o desde la base.",
          "Altura del espaldar: el plano usa 65 cm desde el piso.",
          "Grosor de tableros: se tomó 2,5 cm en brazos, espaldar y cartelas; confirmar.",
          "Base de los puestos: el plano lista los marcos de 60, pero la caja tiene 85 de fondo. Se agregaron los laterales de 85 (12 piezas), para confirmar.",
          "Bastidor del diván (60 × 145): el plano no lista sus piezas. Se agregaron 2 largueros de 60 y 2 laterales de 145, para confirmar.",
          "¿El diván lleva baúl?",
          "Cartelas del espaldar: el plano las pone (2 de 2,5 cm); confirmar que se quedan." ] }
      ]
    });
  }
  /* Sofá cama matrimonial, 180 × 100 cm de medida externa (plano v7) */
  function calcularSofaCama() {
    /* Vista frontal (arriba) y sofá reclinado visto desde arriba */
    const f = new Lienzo(-14, 204, -12, 104);
    f.line(-10, 0, 190, 0, DIB.GRIS, 0.5);
    [3, 60, 120, 172].forEach(x0 => f.rect(x0, 0, 5, 5, DIB.PATA));
    f.rect(0, 5, 20, 50, DIB.WOOD2); f.rect(160, 5, 20, 50, DIB.WOOD2);
    f.text(10, 36, "brazo", 2.8, DIB.INK, 700); f.text(10, 30, "20 × 55", 2.6);
    f.text(170, 36, "brazo", 2.8, DIB.INK, 700); f.text(170, 30, "20 × 55", 2.6);
    f.rect(20, 5, 140, 28, DIB.WOOD2); f.text(90, 16, "caja base 28 · la cama sale por el frente", 3, DIB.INK, 700);
    f.rect(20, 33, 140, 10.2, DIB.GOMA); f.text(90, 38.2, 'goma 4" (10,2)', 2.8);
    f.rect(20, 43.2, 140, 46.8, DIB.GOMA); f.text(90, 70, "espaldar 140 × 45 × 7 + goma 10 (desmontable)", 3);
    f.hdim(0, 180, 100, "180 cm de ancho");
    f.hdim(20, 160, -4, "140 entre brazos", 4);
    f.vdim(-4, 0, 90, "90", -1); f.vdim(184, 0, 43.2, "43,2 asiento", 1);

    const p = new Lienzo(-40, 190, -10, 214);
    p.rect(-20, 70, 20, 110, DIB.WOOD2); p.rect(140, 70, 20, 110, DIB.WOOD2);
    p.text(-10, 125, "brazo", 2.8, DIB.INK, 700); p.text(150, 125, "brazo", 2.8, DIB.INK, 700);
    p.rect(0, 135, 140, 45, DIB.GOMA); p.text(70, 157, "espaldar 45 × 7 + goma 10", 3.2, DIB.INK, 700);
    p.rect(0, 70, 140, 65, DIB.WOOD2); p.text(70, 102, "asiento 65", 3.2, DIB.INK, 700);
    p.rect(0, 0, 140, 70, DIB.WOOD); p.text(70, 35, "cama 70", 3.2, DIB.INK, 700); p.text(70, 27, "sale hacia los pies", 2.6, DIB.GRIS, 400);
    p.hdim(-20, 160, 194, "180 cm de ancho (con brazos)");
    p.vdim(170, 0, 180, "180 cm reclinado", 1);
    p.vdim(-30, 135, 180, "45", -1); p.vdim(-30, 70, 135, "65", -1); p.vdim(-30, 0, 70, "70", -1);

    /* Cortes laterales: cama guardada (dentro de la caja) y cama afuera (con herraje tijera) */
    const g = new Lienzo(-18, 110, -16, 104);
    g.line(-8, 0, 106, 0, DIB.GRIS, 0.5);
    g.rect(2, 0, 5, 5, DIB.PATA); g.rect(93, 0, 5, 5, DIB.PATA);
    g.rect(0, 5, 100, 28, DIB.WOOD2);
    g.rect(8, 7.5, 70, 20, DIB.WOOD, DIB.AZUL, "5 3", 0.5); g.text(43, 17.5, "cama guardada", 3, DIB.AZUL, 700);
    g.rect(0, 33, 83, 10.2, DIB.GOMA); g.text(40, 38.2, "goma 10,2", 2.6);
    g.rect(83, 43.2, 10, 46.8, DIB.GOMA); g.rect(93, 33, 7, 57, DIB.WOOD2);
    g.line(-6, 55, 106, 55, DIB.GRIS, 0.35, "2 1.5");
    g.text(-4, 57.5, "brazo 55 (por confirmar)", 2.5, DIB.GRIS, 400, "start");
    g.text(79, 80, "espaldar + goma 10", 2.6, DIB.INK, 500, "end");
    g.hdim(0, 100, -8, "100 cm de fondo", 4); g.vdim(-6, 0, 90, "90", -1); g.vdim(-14, 0, 43.2, "43,2", -1);

    const a = new Lienzo(-84, 110, -22, 104);
    a.line(-80, 0, 106, 0, DIB.GRIS, 0.5);
    a.rect(2, 0, 5, 5, DIB.PATA); a.rect(93, 0, 5, 5, DIB.PATA);
    a.rect(0, 5, 100, 28, DIB.WOOD2);
    a.rect(0, 33, 83, 10.2, DIB.GOMA);
    a.rect(83, 43.2, 10, 46.8, DIB.GOMA); a.rect(93, 33, 7, 57, DIB.WOOD2);
    a.rect(-70, 18, 70, 15, DIB.WOOD);
    a.rect(-70, 33, 70, 10.2, DIB.GOMA);
    a.line(-64, 18, -56, 0, DIB.INK, 0.8); a.line(-56, 18, -64, 0, DIB.INK, 0.8);
    a.line(-16, 18, -8, 0, DIB.INK, 0.8); a.line(-8, 18, -16, 0, DIB.INK, 0.8);
    a.line(-71, 18, -71, 8, DIB.INK, 1);
    a.text(-35, 25.5, "marco 15", 2.8, DIB.INK, 700);
    a.text(-35, 38.2, "goma 4 pulg. (10,2)", 2.6, DIB.INK, 700);
    a.text(-40, -6, "herraje tijera", 2.8, DIB.AZUL, 700);
    a.line(-80, 55, 106, 55, DIB.GRIS, 0.35, "2 1.5");
    a.text(-78, 57.5, "brazo 55 (por confirmar)", 2.5, DIB.GRIS, 400, "start");
    a.text(80, 80, "espaldar + goma 10", 2.6, DIB.INK, 500, "end");
    a.hdim(-70, 0, -12, "70 cm cama afuera", 4); a.vdim(-76, 0, 43.2, "43,2 cm", -1);

    const grupos = [
      grupoF("brazos", "Brazos (2)", "20 × 100 × 55 cm (ancho × fondo × alto)", [], [
        lamF("Caras laterales", 4, 100, 55, "2 por brazo"), lamF("Frente", 2, 20, 55), lamF("Tapa", 2, 20, 100)]),
      grupoF("caja", "Caja base", "140 × 100 × 28 cm (ancho × fondo × alto)", [
        pzF("Marco largo", 4, 140), pzF("Marco corto", 4, 100), pzF("Parales", 4, 28)], [
        lamF("Fondo de la caja (liso, para los rodines)", 1, 140, 100)]),
      grupoF("bastidor", "Bastidor del asiento", "140 × 83 cm · a nivel de la caja", [
        pzF("Largueros", 2, 140, "2,5 × 5", "Con cincha"), pzF("Travesaños", 2, 83)], [], [
        { n: 'Goma espuma 4" (10,2 cm) del asiento', c: 1, med: "140 × 83 × 10,2", nota: "Llega a la goma del espaldar" }]),
      grupoF("espaldar", "Espaldar", "140 × 45 × 7 cm (desmontable)", [], [
        lamF("Espaldar", 1, 140, 45, "Desmontable · fijación por confirmar", "Grosor 7 cm (armado por confirmar)")], [
        { n: "Goma del espaldar de 10 cm", c: 1, med: "45 × 140 × 10", nota: "Goma espuma de 10 cm" }]),
      grupoF("cama", "Cama (marco y tapa)", "140 × 70 cm · marco de 15 de alto", [
        pzF("Laterales", 2, 70, "2,5 × 5", "Alto 15: listones apilados, por confirmar"), pzF("Travesaños (frente, fondo e intermedio)", 3, 140)], [
        lamF("Tapa de la cama", 1, 140, 70, "Material por confirmar")], [
        { n: 'Goma espuma 4" (10,2 cm) de la cama', c: 1, med: "140 × 70 × 10,2", nota: "Va sobre el marco al sacar la cama" },
        { n: "Cintas para jalar la cama", c: 2, med: "30 × 4 cm", nota: "Cinta de tela o correa, por confirmar" }],
        [{ n: "Rodines", c: 4 }, { n: "Herraje tijera abatible", c: 2 }, { n: "Pernos del espaldar", c: 4 }])
    ];
    return cerrarFijo({
      x: { tipo: "sofaCama", largo: 180, fondo: 100, divanLargo: 0, la: 2.5, lb: 5, mdf: 0.4, largoListon: 300, sierra: 0.3 },
      divan: false, grupos,
      bastidores: [{ an: 140, fo: 83, cant: 1 }],
      alturas: { pata: 5, base: 28, bastidor: 0, goma: 10.2, asiento: 43.2 },
      custom: { general: `<div style="display:grid;gap:12px">${f.svg()}${p.svg()}</div>`, alturas: `<div style="display:grid;gap:12px">${g.svg()}${a.svg()}</div>` },
      titulo: "Sofá cama matrimonial · 180 × 100 cm (plano v7)",
      pie: "Izquierda: vista frontal (arriba) y sofá reclinado visto desde arriba (abajo). Derecha: cama guardada (arriba) y cama afuera (abajo). Medidas en centímetros.",
      kpiMat: "Tablero 2,5 y 7 cm",
      notas: [
        { t: "Cómo funciona (según el dibujo)", l: [
          "Cama guardada: entra dentro de la caja, sobre rodines.",
          "Para sacarla se jalan las cintas del frente.",
          "Afuera, el herraje tijera la sostiene a 43,2 cm del piso.",
          "Para guardarla, el herraje se pliega y la cama vuelve a entrar en la caja."] },
        { t: "Medidas y supuestos", l: [
          "Ancho 180 = brazo 20 + asiento 140 + brazo 20.",
          "Brazos de 20 × 55 de alto y 100 de fondo; espaldar de 140 × 45 × 7, desmontable.",
          "Goma del espaldar de 10 cm (45 × 140).",
          "Asiento 43,2 = patas 5 + caja 28 + goma 10,2 (4 pulgadas). El bastidor va a nivel de la caja.",
          "Cama afuera 43,2 = herraje 18 + marco 15 a nivel de la caja + goma 10,2.",
          "Cama guardada = marco 15 + rodines 5 = 20, dentro de la caja de 28 (con tapas de 2,5)."] },
        { t: "Pendientes para cerrar los planos", l: [
          "Largo de la cama: el plano v7 dibuja 70 cm de cama fuera de la caja (marco 140 × 70). Confirmar si ese es el largo que se quiere.",
          "Altura del herraje plegado: tiene que caber en la caja con la cama guardada.",
          "Goma de la cama al guardar: la cama (20) más la goma (10,2) no caben en la caja de 28. Decidir dónde va la goma.",
          "Altura del marco de 15 cm: confirmar con una pieza real.",
          "Cantidad de herrajes (2 o 4) y tipo de rodines.",
          "Grosor de tableros: 2,5 cm en brazos, caja y tapa; 7 cm en el espaldar (según el plano). Confirmar.",
          "Material de la tapa de la cama y de las cintas."] }
      ]
    });
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
  /* ===================== CAMA: base y cabecero (SVG) ===================== */
  /* Vista desde arriba: el cabecero va detrás de la cabecera y la base debajo. Horizontal = ancho, vertical = largo. */
  function dibujarCama(r) {
    const { x, D, L: Lb } = r, an = x.anchoCabecero, g0 = x.grosorCabecero, e = x.la, Wt = Math.max(an, D), ox = (Wt - D) / 2, cx = (Wt - an) / 2;
    K = Math.max(1, Math.max(Wt, Lb) / 110);
    const k = Math.max(0, Math.ceil(D / 65) - 1);
    let s = txt(Wt / 2, -18 * K, "VISTA DESDE ARRIBA · cabecero arriba", 3.4, "middle", 0, C.gris, 700);
    s += rect(cx, 0, an, g0, "#cdb88f", C.maderaB, 0.6) + txt(Wt / 2, g0 / 2 + 1 * K, "CABECERO", 2.8, "middle", 0, C.txt, 700);
    s += rect(ox, g0, D, Lb, C.madera, C.maderaB, 0.6);
    for (let i = 0; i < k; i++) { const rx = ox + D * (i + 1) / (k + 1); s += rect(rx - e / 2, g0 + e, e, Lb - 2 * e, "#c9b89a", "#8c7a5c", 0.3); }
    s += txt(Wt / 2, g0 + r.grupos.find(g => g.id === "base").Lb / 2 + 1 * K, "BASE", 3.2, "middle", 0, C.txt, 700);
    /* Cajas de la base: cortes entre cajas y medida de cada una */
    const cg = r.grupos.find(g => g.id === "base"), bl = cg.Lb, nc = cg.cant;
    for (let i = 1; i < nc; i++) s += rect(ox, g0 + i * bl - e / 2, D, e, "#8c7a5c", "#8c7a5c", 0.2);
    s += cota(cx, 0, cx + an, 0, -8, fmt(an), 3) + cota(ox, g0 + Lb, ox + D, g0 + Lb, 8, fmt(D));
    for (let i = 0; i < nc; i++) s += cota(ox + D, g0 + i * bl, ox + D, g0 + (i + 1) * bl, 8, fmt(bl));
    /* Gavetas: en la mitad de la cabecera (del otro lado de la línea del medio), frente hacia el lateral; se alternan izquierda y derecha */
    const gv = r.grupos.find(g => g.id === "gaveta");
    if (gv) for (let i = 0; i < gv.cant; i++) {
      const izq = i % 2 === 0, j = Math.floor(i / 2), pg = gv.Lg, wg = gv.wg;
      const gx = izq ? ox + 1 : ox + D - 1 - pg, gy = g0 + Lb / 2 - 1 - (j + 1) * wg - j;
      s += `<rect x="${r1(gx)}" y="${r1(gy)}" width="${r1(pg)}" height="${r1(wg)}" fill="rgba(122,92,40,.12)" stroke="#7a5c28" stroke-width="${0.4 * K}" stroke-dasharray="${2 * K} ${1.5 * K}"/>`;
      s += rect(izq ? gx : gx + pg - e * 0.6, gy, e * 0.6, wg, "#7a5c28", "#7a5c28", 0.2);
      s += txt(gx + pg / 2, gy + wg / 2 + 1 * K, "GAVETA", 2.6, "middle", 0, C.txt, 700);
    }
    return lienzo(Wt, g0 + Lb, 22 * K, s);
  }
  /* Corte lateral: cabecero (trapecio) a la izquierda y base a su lado, con patas */
  function dibujarCamaAlturas(r) {
    const { x, L: Lb, alturas: A } = r, g0 = x.grosorCabecero, g1 = Math.min(x.grosorCabeceroArriba, g0), Hc = x.altoCabecero, rc = Math.min(x.rectoCabecero, Hc), F = g0 + Lb;
    K = Math.max(1, F / 80);
    const piso = Math.max(Hc, A.pata + x.altoBase) + 10 * K, y = h => piso - h;
    let s = txt(F / 2, -6 * K, "CORTE LATERAL · cabecero y base", 3.4, "middle", 0, C.gris, 700);
    s += `<line x1="${-8 * K}" y1="${r1(piso)}" x2="${r1(F + 6 * K)}" y2="${r1(piso)}" stroke="${C.gris}" stroke-width="${0.5 * K}"/>`;
    s += poly([[0, piso], [g0, piso], [g0, y(rc)], [g1, y(Hc)], [0, y(Hc)]], "#cdb88f", C.maderaB, 0.5);
    s += txt(g0 * 0.55, y(Hc / 2), "CABECERO", 2.6, "middle", -90, C.txt, 700);
    s += rect(g0 + 3 * K, y(A.pata), 3 * K, A.pata, "#555", "#333") + rect(F - 6 * K, y(A.pata), 3 * K, A.pata, "#555", "#333");
    s += rect(g0, y(A.pata + A.base), Lb, A.base) + txt(g0 + Lb / 2, y(A.pata + A.base / 2) + 1 * K, "BASE", 3, "middle", 0, C.txt, 700);
    s += cota(0, piso, 0, y(Hc), -6, fmt(Hc), 2.8) + cota(g0, piso, F, piso, 7, fmt(Lb), 2.8) + cota(F, piso, F, y(A.pata + A.base), 8, fmt(A.pata + A.base), 2.8);
    return lienzo(F, piso + 8 * K, 22 * K, s);
  }
  /* Cabecero de frente: tablero MDF, cartelas de canto y rieles */
  function dibujarCabecero(r, gr) {
    const { x } = r, w = x.la, an = gr.an, Hc = gr.Hc;
    K = Math.max(1, Math.max(an, Hc) / 70);
    let s = txt(an / 2, -10 * K, "VISTA DE FRENTE · cabecero", 3.4, "middle", 0, C.gris, 700);
    s += rect(0, 0, an, Hc, C.mdf, "#8c7a5c", 0.4);
    s += rect(0, 0, w, Hc) + rect(an - w, 0, w, Hc);
    s += rect(w, 0, an - 2 * w, x.lb) + rect(w, Hc - x.lb, an - 2 * w, x.lb);
    s += cota(0, Hc, an, Hc, 8, fmt(an)) + cota(an, 0, an, Hc, 8, fmt(Hc));
    return lienzo(an, Hc + 14 * K, 18 * K, s);
  }
  /* Gaveta vista desde arriba: fondo a lo ancho, frente al lateral (a la izquierda; la derecha es igual en espejo) */
  function dibujarGaveta(r, gr) {
    const { x } = r, w = gr.Lg, l = gr.wg, gg = x.grosorGaveta, Hg = x.altoGaveta; K = Math.max(1, Math.max(w, l) / 70);
    let s = txt(w / 2, -10 * K, "VISTA SUPERIOR · gaveta, frente al lateral", 3.4, "middle", 0, C.gris, 700);
    s += rect(0, 0, w, l, "#efe0c0", C.maderaB, 0.5);
    s += rect(0, 0, gg * 2, l, "#8c7a5c", "#8c7a5c", 0.2);
    s += txt(w / 2 + 2 * K, l / 2 - 1 * K, "GAVETA", 3, "middle", 0, C.txt, 700) + txt(w / 2 + 2 * K, l / 2 + 4 * K, `alto ${fmt(Hg)} cm`, 2.6, "middle", 0, C.gris);
    s += cota(0, l, w, l, 8, fmt(w)) + cota(w, 0, w, l, 8, fmt(l));
    return lienzo(w, l, 18 * K, s);
  }
  function planos(r) {
    if (r.custom) return r.custom;
    const out = r.cama ? { general: dibujarCama(r), alturas: dibujarCamaAlturas(r) } : { general: dibujarGeneral(r), alturas: dibujarAlturas(r) };
    r.grupos.forEach(gr => {
      if (gr.id === "base") gr.svg = dibujarBase(r, gr, r.D);
      else if (gr.id === "basediv") gr.svg = dibujarBase(r, gr, r.Dd);
      else if (gr.id === "bastidor" || gr.id === "bastidordiv") gr.svg = dibujarBastidor(r, gr);
      else if (gr.id === "brazo") gr.svg = dibujarBrazo(r, gr);
      else if (gr.id === "espaldar") gr.svg = dibujarEspaldar(r);
      else if (gr.id === "cabecero") gr.svg = dibujarCabecero(r, gr);
      else if (gr.id === "gaveta") gr.svg = dibujarGaveta(r, gr);
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
  g.Estructura = { BASE, calcular, planos, desdeModelo, aHash, deHash, fmt, CAMAS, nombreCama, fijos: ["divanL", "sofaCama"] };
})(window);
