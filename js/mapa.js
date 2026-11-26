/*
 * Mapa de España con D3: provincias + contornos de comunidades.
 * Canarias, Ceuta y Melilla se dibujan en recuadros con su propia proyección,
 * pero en el mismo sistema de coordenadas, así el zoom funciona igual en todas partes.
 */
window.Mapa = (function () {
  const W = 1000, H = 780;
  const topo = window.ES_TOPO;
  const provFeatures = topojson.feature(topo, topo.objects.provinces).features;
  const ccaaFeatures = topojson.feature(topo, topo.objects.autonomous_regions).features;

  // ¿En qué recuadro va cada territorio?
  const ZONA_CCAA = { "05": "canarias", "18": "ceuta", "19": "melilla" };
  const ZONA_PROV = { "35": "canarias", "38": "canarias", "51": "ceuta", "52": "melilla" };

  // Recuadros (x, y, ancho, alto) en coordenadas del SVG
  const RECUADROS = {
    canarias: { x: 628, y: 606, w: 360, h: 162, titulo: "Canarias" },
    ceuta: { x: 346, y: 674, w: 104, h: 94, titulo: "Ceuta" },
    melilla: { x: 462, y: 674, w: 104, h: 94, titulo: "Melilla" },
  };

  const principales = ccaaFeatures.filter((f) => !ZONA_CCAA[f.id]);
  const proj = {
    main: d3.geoConicConformal().parallels([38, 43]).rotate([3.5, 0])
      .fitExtent([[20, 12], [W - 20, 660]], { type: "FeatureCollection", features: principales }),
  };
  for (const [zona, r] of Object.entries(RECUADROS)) {
    const fs = ccaaFeatures.filter((f) => ZONA_CCAA[f.id] === zona);
    const pad = zona === "canarias" ? 14 : 18;
    proj[zona] = d3.geoMercator().fitExtent(
      [[r.x + pad, r.y + pad + 8], [r.x + r.w - pad, r.y + r.h - pad]],
      { type: "FeatureCollection", features: fs }
    );
  }
  const paths = Object.fromEntries(Object.entries(proj).map(([k, p]) => [k, d3.geoPath(p)]));
  const pathProv = (f) => paths[ZONA_PROV[f.id] || "main"](f);
  const pathCcaa = (f) => paths[ZONA_CCAA[f.id] || "main"](f);
  const boundsProv = (f) => paths[ZONA_PROV[f.id] || "main"].bounds(f);
  const boundsCcaa = (f) => paths[ZONA_CCAA[f.id] || "main"].bounds(f);
  const ccaaDe = (pid) => window.DATA.provincias[pid].ccaa;

  function crear(contenedor) {
    const svg = d3.select(contenedor).append("svg")
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("class", "mapa-svg")
      .attr("role", "img")
      .attr("aria-label", "Mapa de las comunidades autónomas y provincias de España");

    const root = svg.append("g").attr("class", "root");

    // Recuadros de Canarias, Ceuta y Melilla
    const gRec = root.append("g").attr("class", "recuadros");
    for (const [zona, r] of Object.entries(RECUADROS)) {
      const g = gRec.append("g").attr("class", "recuadro").attr("data-zona", zona);
      g.append("rect").attr("x", r.x).attr("y", r.y).attr("width", r.w).attr("height", r.h).attr("rx", 10);
      g.append("text").attr("x", r.x + 10).attr("y", r.y + 18).text(r.titulo);
    }

    const gProv = root.append("g").attr("class", "provincias");
    const gCcaa = root.append("g").attr("class", "ccaa-bordes");
    const gEtiq = root.append("g").attr("class", "etiquetas");

    const provSel = gProv.selectAll("path").data(provFeatures).join("path")
      .attr("class", "prov")
      .attr("d", pathProv)
      .attr("data-id", (d) => d.id)
      .attr("data-ccaa", (d) => ccaaDe(d.id))
      .attr("tabindex", -1);

    const ccaaSel = gCcaa.selectAll("path").data(ccaaFeatures).join("path")
      .attr("class", "ccaa")
      .attr("d", pathCcaa)
      .attr("data-id", (d) => d.id);

    // Zoom (rueda, pellizco y programático)
    const zoom = d3.zoom()
      .scaleExtent([1, 40])
      .translateExtent([[-200, -200], [W + 200, H + 200]])
      .on("zoom", (ev) => {
        root.attr("transform", ev.transform);
        svg.style("--k", ev.transform.k);
        gEtiq.selectAll("text").attr("font-size", tamEtiqueta(ev.transform.k));
      });
    svg.call(zoom).on("dblclick.zoom", null);

    function zoomA(b, maxK = 12) {
      const [[x0, y0], [x1, y1]] = b;
      const dx = Math.max(x1 - x0, 1), dy = Math.max(y1 - y0, 1);
      const k = Math.min(maxK, 0.82 / Math.max(dx / W, dy / H));
      const t = d3.zoomIdentity.translate(W / 2, H / 2).scale(k).translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
      svg.transition().duration(850).ease(d3.easeCubicInOut).call(zoom.transform, t);
    }

    // Tamaño de letra de las etiquetas: ~13 px en pantalla, sea cual sea el zoom o el ancho del mapa
    function tamEtiqueta(k) {
      const ancho = svg.node().getBoundingClientRect().width || W;
      return (13 * Math.max(1, W / ancho)) / k;
    }

    // Tooltip
    const tip = d3.select(contenedor).append("div").attr("class", "tooltip").attr("role", "status");
    function mostrarTip(ev, html) {
      if (!html) return ocultarTip();
      const box = contenedor.getBoundingClientRect();
      tip.html(html).classed("visible", true)
        .style("left", ev.clientX - box.left + "px")
        .style("top", ev.clientY - box.top + "px");
    }
    function ocultarTip() { tip.classed("visible", false); }

    // ---- API pública ----
    const api = {
      svg, provSel, ccaaSel,
      handlers: { hover: null, click: null, tip: null },
      nivel: "ccaa", // "ccaa" | "prov" → qué se resalta al pasar el ratón
      foco: null, // id de la comunidad en la que estamos (zoom)

      colorear(fnProv) {
        // Se usa style (no attr) para poder usar variables CSS; la transición la hace CSS
        provSel.style("fill", (d) => fnProv(d.id));
      },
      // Clases para dar estado visual a provincias y comunidades
      marcar(clase, fnProv) {
        provSel.classed(clase, (d) => !!fnProv(d.id));
      },
      marcarCcaa(clase, fnCcaa) {
        ccaaSel.classed(clase, (d) => !!fnCcaa(d.id));
      },
      zoomCcaa(id) {
        const f = ccaaFeatures.find((x) => x.id === id);
        const maxK = id === "18" || id === "19" ? 5 : 12;
        zoomA(boundsCcaa(f), maxK);
      },
      zoomProv(id) {
        const f = provFeatures.find((x) => x.id === id);
        zoomA(boundsProv(f), 6);
      },
      reset() {
        svg.transition().duration(750).ease(d3.easeCubicInOut).call(zoom.transform, d3.zoomIdentity);
      },
      zoomPor(f) {
        svg.transition().duration(300).call(zoom.scaleBy, f);
      },
      etiquetas(lista) {
        // lista: [{ provId, texto }] → texto en el centroide de la provincia
        const k = d3.zoomTransform(svg.node()).k;
        gEtiq.selectAll("text").data(lista, (d) => d.provId).join(
          (enter) => enter.append("text").attr("opacity", 0).call((s) => s.transition().duration(400).attr("opacity", 1)),
          (update) => update,
          (exit) => exit.remove()
        )
          .attr("x", (d) => pathCentroide(d.provId)[0])
          .attr("y", (d) => pathCentroide(d.provId)[1])
          .attr("font-size", tamEtiqueta(k))
          .text((d) => d.texto);
      },
    };

    function pathCentroide(pid) {
      const f = provFeatures.find((x) => x.id === pid);
      const p = paths[ZONA_PROV[pid] || "main"];
      // Para provincias con islas, el centroide del polígono más grande queda mejor
      if (f.geometry.type === "MultiPolygon") {
        const mayor = f.geometry.coordinates
          .map((c) => ({ type: "Polygon", coordinates: c }))
          .sort((a, b) => p.area(b) - p.area(a))[0];
        return p.centroid(mayor);
      }
      return p.centroid(f);
    }
    api.centroide = pathCentroide;

    function idsHover(pid) {
      return api.nivel === "ccaa" ? { ccaa: ccaaDe(pid), prov: null } : { ccaa: null, prov: pid };
    }

    provSel
      .on("pointerenter pointermove", function (ev, d) {
        const h = idsHover(d.id);
        provSel.classed("hover", (p) => (h.prov ? p.id === h.prov : ccaaDe(p.id) === h.ccaa));
        ccaaSel.classed("hover", (c) => c.id === h.ccaa);
        if (ev.pointerType !== "touch") mostrarTip(ev, api.handlers.tip && api.handlers.tip(d.id, api.nivel));
      })
      .on("pointerleave", function () {
        provSel.classed("hover", false);
        ccaaSel.classed("hover", false);
        ocultarTip();
      })
      .on("click", function (ev, d) {
        ocultarTip();
        if (api.handlers.click) api.handlers.click(d.id, ev);
      });

    svg.on("click", (ev) => {
      if (ev.target === svg.node() && api.handlers.fondo) api.handlers.fondo();
    });

    return api;
  }

  return { crear, provFeatures, ccaaFeatures, W, H };
})();
