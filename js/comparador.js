/* Comparador de dos comunidades con barras horizontales */
window.Comparador = (function () {
  const D = window.DATA;
  const METRICAS = [
    { k: "poblacion", nombre: "Población", u: "habitantes", f: (v) => D.fmt(v), c: D.corto },
    { k: "superficie", nombre: "Superficie", u: "km²", f: (v) => D.fmt(v) },
    { k: "densidad", nombre: "Densidad de población", u: "hab./km²", f: (v) => D.fmt1(v) },
    { k: "numProv", nombre: "Provincias", u: "", f: (v) => D.fmt(v), val: (c) => c.provincias.length },
    { k: "numMunicipios", nombre: "Municipios", u: "", f: (v) => D.fmt(v) },
    { k: "numLenguas", nombre: "Lenguas oficiales", u: "", f: (v) => D.fmt(v), val: (c) => c.lenguas.length },
    { k: "numPatrimonio", nombre: "Bienes Patrimonio de la Humanidad", u: "", f: (v) => D.fmt(v) },
  ];
  const valor = (m, c) => (m.val ? m.val(c) : c[m.k]);

  function opciones(sel) {
    return Object.values(D.ccaa)
      .map((c) => `<option value="${c.id}"${c.id === sel ? " selected" : ""}>${c.nombreCorto}</option>`)
      .join("");
  }

  function panel(a, b) {
    const A = D.ccaa[a], B = D.ccaa[b];
    const filas = METRICAS.map((m) => {
      const va = valor(m, A), vb = valor(m, B);
      const max = Math.max(va, vb) || 1;
      const ratio = Math.min(va, vb) > 0 ? Math.max(va, vb) / Math.min(va, vb) : null;
      const gana = va === vb ? "Empate" : `${(va > vb ? A : B).nombreCorto} tiene más${ratio && ratio >= 1.5 ? ` (×${D.fmt1(ratio)})` : ""}`;
      const linea = (c, v, serie) =>
        `<div class="linea" title="${c.nombreCorto}: ${m.f(v)} ${m.u}"><div class="pista"><div class="barra" style="width:${Math.max(1.5, (v / max) * 100)}%;background:var(--serie-${serie})"></div></div><span class="valor">${m.f(v)}</span></div>`;
      return `<div class="metrica"><h4>${m.nombre}<span>${m.u}</span></h4><div class="par">${linea(A, va, "a")}${linea(B, vb, "b")}</div><div class="ganador">${gana}</div></div>`;
    }).join("");
    return `
      <p class="eyebrow">Comparador</p>
      <h2>Compara dos comunidades</h2>
      <p class="intro">Elige dos comunidades en las listas o <b>haz clic en el mapa</b> (cada clic cambia una de las dos, por turnos).</p>
      <div class="selectores" style="margin-top:14px">
        <label class="a">Comunidad A<select id="comp-a">${opciones(a)}</select></label>
        <span class="vs">vs</span>
        <label class="b">Comunidad B<select id="comp-b">${opciones(b)}</select></label>
      </div>
      <div class="leyenda-comp"><span><i style="background:var(--serie-a)"></i>${A.nombreCorto}</span><span><i style="background:var(--serie-b)"></i>${B.nombreCorto}</span></div>
      ${filas}
      <p class="nota" style="margin-top:16px">Cada barra se compara con la mayor de las dos. Población: INE, ${D.ine.fecha}.</p>`;
  }

  return { panel };
})();
