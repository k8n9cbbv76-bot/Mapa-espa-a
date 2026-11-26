/* Mapa de colores (coropletas): población, superficie, densidad o lengua cooficial */
window.Colores = (function () {
  const D = window.DATA;
  const SEQ = ["var(--seq-1)", "var(--seq-2)", "var(--seq-3)", "var(--seq-4)", "var(--seq-5)", "var(--seq-6)"];

  const VARIABLES = {
    poblacion: {
      nombre: "Población", ico: "👥", unidad: "hab.",
      umbrales: { ccaa: [500e3, 1e6, 2e6, 4e6, 7e6], prov: [150e3, 300e3, 600e3, 1e6, 2e6] },
      valor: (x) => x.poblacion, formato: (v) => D.fmt(v) + " hab.", corto: D.corto,
    },
    superficie: {
      nombre: "Superficie", ico: "📐", unidad: "km²",
      umbrales: { ccaa: [5000, 10000, 25000, 45000, 80000], prov: [4000, 7000, 10000, 13000, 16000] },
      valor: (x) => x.superficie, formato: (v) => D.fmt(v) + " km²", corto: (v) => D.fmt(v),
    },
    densidad: {
      nombre: "Densidad", ico: "🏙️", unidad: "hab./km²",
      umbrales: { ccaa: [25, 50, 100, 200, 500], prov: [25, 50, 100, 200, 500] },
      valor: (x) => x.densidad, formato: (v) => D.fmt1(v) + " hab./km²", corto: (v) => D.fmt(v),
    },
    lengua: { nombre: "Lengua cooficial", ico: "🗣️", categorica: true },
  };

  // Colores de las lenguas: gris = solo castellano; las variantes "parciales" llevan trama
  const LENGUA_COLOR = {
    castellano: "var(--cat-neutral)",
    catalan: "var(--cat-2)",
    "catalan-aranes": "url(#trama-catalan)",
    gallego: "var(--cat-1)",
    euskera: "var(--cat-3)",
    "euskera-parcial": "url(#trama-euskera)",
  };
  const LENGUA_MUESTRA = {
    castellano: "background:var(--cat-neutral)",
    catalan: "background:var(--cat-2)",
    "catalan-aranes": "background:repeating-linear-gradient(45deg,var(--cat-2) 0 3px,var(--surface) 3px 5px)",
    gallego: "background:var(--cat-1)",
    euskera: "background:var(--cat-3)",
    "euskera-parcial": "background:repeating-linear-gradient(45deg,var(--cat-3) 0 3px,var(--surface) 3px 5px)",
  };

  function asegurarTramas(svg) {
    if (svg.select("#trama-catalan").size()) return;
    const defs = svg.append("defs");
    for (const [id, col] of [["trama-catalan", "--cat-2"], ["trama-euskera", "--cat-3"]]) {
      const p = defs.append("pattern").attr("id", id).attr("patternUnits", "userSpaceOnUse")
        .attr("width", 6).attr("height", 6).attr("patternTransform", "rotate(45)");
      p.append("rect").attr("width", 6).attr("height", 6).style("fill", "var(--surface)");
      p.append("rect").attr("width", 3.6).attr("height", 6).style("fill", `var(${col})`);
    }
  }

  const claseDe = (v, umbrales) => d3.bisectRight(umbrales, v);

  function entidad(nivel, pid) {
    return nivel === "ccaa" ? D.ccaaDeProvincia(pid) : D.provincias[pid];
  }

  // Devuelve la función de relleno por provincia
  function relleno(variable, nivel) {
    const v = VARIABLES[variable];
    if (v.categorica) return (pid) => LENGUA_COLOR[D.ccaaDeProvincia(pid).lenguaGrupo];
    const u = v.umbrales[nivel];
    return (pid) => SEQ[claseDe(v.valor(entidad(nivel, pid)), u)];
  }

  function leyenda(variable, nivel) {
    const v = VARIABLES[variable];
    if (v.categorica) {
      return `<h4>Lenguas oficiales además del castellano</h4><ul>${D.LENGUAS.map(
        (l) => `<li><i style="${LENGUA_MUESTRA[l.id]}"></i>${l.nombre}</li>`
      ).join("")}</ul>`;
    }
    const u = v.umbrales[nivel];
    // Cada casilla se etiqueta con su valor inicial: "< 25", "25+", "50+"...
    const etiquetas = [`< ${v.corto(u[0])}`, ...u.map((x) => `${v.corto(x)}+`)];
    return `<h4>${v.nombre} por ${nivel === "ccaa" ? "comunidad" : "provincia"} (${v.unidad})</h4>
      <div class="escala">${SEQ.map((c, i) => `<div><i style="background:${c}"></i><span>${etiquetas[i]}</span></div>`).join("")}</div>`;
  }

  function tip(variable, nivel, pid) {
    const v = VARIABLES[variable];
    const e = entidad(nivel, pid);
    if (v.categorica) {
      const c = D.ccaaDeProvincia(pid);
      return `<b>${c.nombreCorto}</b><br><small>${c.lenguas.join(" · ")}</small>`;
    }
    return `<b>${e.nombreCorto || e.nombre}</b><br><small>${v.formato(v.valor(e))}</small>`;
  }

  function panel(variable, nivel, seleccion) {
    const v = VARIABLES[variable];
    const botones = Object.entries(VARIABLES)
      .map(([k, x]) => `<button data-var="${k}" aria-pressed="${k === variable}"><span aria-hidden="true">${x.ico}</span>${x.nombre}</button>`)
      .join("");
    let cuerpo = "";
    if (v.categorica) {
      const grupos = D.LENGUAS.map((l) => {
        const cs = Object.values(D.ccaa).filter((c) => c.lenguaGrupo === l.id);
        return `<div class="grupo"><b><i style="${LENGUA_MUESTRA[l.id]}"></i>${l.nombre} <span class="n">${cs.length}</span></b><small>${cs.map((c) => c.nombreCorto).join(", ")}</small></div>`;
      }).join("");
      cuerpo = `<h3>Comunidades por lengua</h3><div class="grupos-lengua">${grupos}</div>
        <p class="nota">En Aragón (aragonés, catalán) y Asturias (asturiano) hay lenguas protegidas por ley que no son cooficiales.</p>`;
    } else {
      const lista = (nivel === "ccaa" ? Object.values(D.ccaa) : Object.values(D.provincias))
        .slice().sort((a, b) => v.valor(b) - v.valor(a));
      const u = v.umbrales[nivel];
      cuerpo = `<h3>Ranking <span class="n">${lista.length}</span></h3>
        <ol class="ranking">${lista.map((e) => `<li data-${nivel === "ccaa" ? "ccaa" : "prov"}="${e.id}"><span><i style="background:${SEQ[claseDe(v.valor(e), u)]}"></i>${e.nombreCorto || e.nombre}</span><span>${v.formato(v.valor(e))}</span></li>`).join("")}</ol>`;
    }
    return `
      <p class="eyebrow">Mapa de colores</p>
      <h2>Colorea España por datos</h2>
      <p class="intro">Elige qué quieres ver. Cuanto más oscuro el azul, mayor es el valor.</p>
      <h3>¿Qué dato?</h3>
      <div class="segmentado">${botones}</div>
      ${v.categorica ? "" : `<div class="interruptor" role="group" aria-label="Nivel"><button data-nivel="ccaa" aria-pressed="${nivel === "ccaa"}">Comunidades</button><button data-nivel="prov" aria-pressed="${nivel === "prov"}">Provincias</button></div>`}
      ${seleccion ? `<div class="dato-curioso" style="margin-top:14px">${seleccion}</div>` : ""}
      ${cuerpo}
      <p class="nota">Población: INE, ${D.ine.fecha}. Superficie: IGN/INE.</p>`;
  }

  return { VARIABLES, relleno, leyenda, tip, panel, asegurarTramas };
})();
