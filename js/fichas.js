/* Fichas de comunidades y provincias (HTML para el panel lateral) */
window.Fichas = (function () {
  const D = window.DATA;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const stat = (k, v, extra = "", ancho = false) =>
    `<div class="stat${ancho ? " ancho" : ""}"><div class="k">${k}</div><div class="v">${v}${extra ? ` <small>${extra}</small>` : ""}</div></div>`;

  function portada() {
    const lista = Object.values(D.ccaa)
      .map((c) => `<button data-ccaa="${c.id}">${Simbolos.bandera(c.id)}<span>${esc(c.nombreCorto)}</span></button>`)
      .join("");
    return `
      <p class="eyebrow">Explora</p>
      <h2>17 comunidades, 2 ciudades autónomas y 50 provincias</h2>
      <p class="intro">Pasa el ratón por el mapa para ver cada comunidad y <b>haz clic</b> para acercarte y descubrir sus provincias. En el móvil, toca y pellizca para hacer zoom.</p>
      <div class="stats" style="margin-top:16px">
        ${stat("Población de España", D.fmt(D.ine.totalEspana), "hab.", true)}
        ${stat("Comunidades", "17", "+ Ceuta y Melilla")}
        ${stat("Provincias", "50", "+ 2 ciudades")}
      </div>
      <p class="nota">Población oficial a ${D.ine.fecha} (INE, Padrón municipal).</p>
      <h3>Elige una comunidad</h3>
      <div class="rejilla-ccaa">${lista}</div>`;
  }

  function comunidad(id) {
    const c = D.ccaa[id];
    const provs = c.provincias.map((p) => D.provincias[p]);
    const prov = provs
      .map((p) => `<li><button data-prov="${p.id}"><b>${esc(p.nombre)}</b><span class="pob">${D.fmt(p.poblacion)} hab.</span><small>Capital: ${esc(p.capital)}</small></button></li>`)
      .join("");
    const est = c.estatuto;
    return `
      <p class="eyebrow">${esc(c.tipo)}</p>
      <div class="cabecera-ficha"><h2>${esc(c.nombre)}</h2></div>
      <div class="bloque-simbolos simbolos">
        <figure class="bandera">${Simbolos.bandera(id)}<figcaption>Bandera</figcaption></figure>
        <figure class="escudo">${Simbolos.escudo(id)}<figcaption>Escudo (simplificado)</figcaption></figure>
      </div>
      <div class="stats">
        ${stat("Capital", esc(c.capital), "", c.capital.length > 18)}
        ${stat("Población", D.fmt(c.poblacion), "hab.")}
        ${stat("Superficie", D.fmt(c.superficie), "km²")}
        ${stat("Densidad", D.fmt1(c.densidad), "hab./km²")}
        ${stat("Municipios", D.fmt(c.numMunicipios))}
        ${stat("Estatuto de Autonomía", D.fecha(est.fecha), "", true)}
      </div>
      ${c.capitalNota ? `<p class="nota">${esc(c.capitalNota)}</p>` : ""}
      <p class="nota">${esc(est.ley)}${est.reforma ? " · " + esc(est.reforma) : ""}. Día de la comunidad: ${esc(c.diaComunidad)}.</p>

      <h3>🗣️ Lenguas oficiales</h3>
      <ul class="chips">${c.lenguas.map((l) => `<li class="chip">${esc(l)}</li>`).join("")}</ul>
      ${c.lenguasNota ? `<p class="nota">${esc(c.lenguasNota)}</p>` : ""}

      <h3>📍 Provincias <span class="n">${provs.length}</span></h3>
      <ul class="lista-prov">${prov}</ul>

      <h3>🍽️ Gastronomía típica</h3>
      <ul class="chips">${c.gastronomia.map((g) => `<li class="chip">${esc(g)}</li>`).join("")}</ul>

      <h3>🎉 Fiestas</h3>
      <ul class="lista">${c.fiestas.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>

      <h3>🏛️ Patrimonio de la Humanidad <span class="n">${c.numPatrimonio}</span></h3>
      <ul class="lista">${c.patrimonio.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>

      <h3>💡 ¿Sabías que…?</h3>
      <ol class="curiosidades">${c.curiosidades.map((f) => `<li>${esc(f)}</li>`).join("")}</ol>`;
  }

  function provincia(id) {
    const p = D.provincias[id];
    const c = D.ccaa[p.ccaa];
    const max = p.principales[0][1];
    const barras = p.principales
      .map(([n, v], i) => `<div class="fila"><div><span>${esc(n)}</span><span>${D.fmt(v)}</span></div><i class="barra" style="width:${Math.max(2, (v / max) * 100)}%;animation-delay:${i * 60}ms"></i></div>`)
      .join("");
    const esCiudad = id === "51" || id === "52";
    return `
      <button class="volver" data-ccaa="${c.id}">← ${esc(c.nombreCorto)}</button>
      <p class="eyebrow">${esCiudad ? "Ciudad autónoma" : "Provincia"} · ${esc(c.nombreCorto)}</p>
      <h2>${esc(p.nombre)}</h2>
      ${p.oficial && p.oficial !== p.nombre ? `<p class="nota">Nombre oficial: ${esc(p.oficial)}</p>` : ""}
      <div class="stats" style="margin-top:16px">
        ${stat("Capital", esc(p.capital), `${D.fmt(p.poblacionCapital)} hab.`, true)}
        ${stat("Población", D.fmt(p.poblacion), "hab.")}
        ${stat("Superficie", D.fmt(p.superficie), "km²")}
        ${stat("Densidad", D.fmt1(p.densidad), "hab./km²")}
        ${stat("Municipios", D.fmt(p.numMunicipios))}
      </div>
      <h3>🏘️ Municipios más poblados</h3>
      <div class="barras-mun" role="list">${barras}</div>
      <p class="nota">Habitantes a ${D.ine.fecha} (INE).</p>
      <h3>💡 Dato curioso</h3>
      <p class="dato-curioso">${esc(p.curiosidad)}</p>`;
  }

  return { portada, comunidad, provincia, esc };
})();
