/*
 * Une los datos del INE (data/ine.js) con el contenido educativo (data/comunidades.js y data/provincias.js)
 * y calcula los indicadores derivados (superficie total, densidad, nº de municipios...).
 */
(function () {
  const ine = window.INE;
  const provincias = {};
  for (const [id, info] of Object.entries(window.PROV_INFO)) {
    const d = ine.provincias[id];
    provincias[id] = {
      id,
      ...info,
      poblacion: d.poblacion,
      numMunicipios: d.numMunicipios,
      poblacionCapital: d.poblacionCapital,
      principales: d.principales,
      densidad: d.poblacion / info.superficie,
    };
  }

  const ccaa = {};
  for (const c of window.CCAA_INFO) {
    const ps = c.provincias.map((p) => provincias[p]);
    const poblacion = ps.reduce((s, p) => s + p.poblacion, 0);
    const superficie = ps.reduce((s, p) => s + p.superficie, 0);
    ccaa[c.id] = {
      ...c,
      nombreCorto: c.nombreCorto || c.nombre,
      poblacion,
      superficie,
      densidad: poblacion / superficie,
      numMunicipios: ps.reduce((s, p) => s + p.numMunicipios, 0),
      numPatrimonio: c.patrimonio.filter((x) => !/^Ninguno/.test(x)).length,
    };
  }

  // Grupos lingüísticos para el mapa de colores
  const LENGUAS = [
    { id: "castellano", nombre: "Solo castellano" },
    { id: "catalan", nombre: "Catalán / valenciano" },
    { id: "catalan-aranes", nombre: "Catalán y aranés (occitano)" },
    { id: "gallego", nombre: "Gallego" },
    { id: "euskera", nombre: "Euskera" },
    { id: "euskera-parcial", nombre: "Euskera (solo zona vascófona)" },
  ];

  const fmt = new Intl.NumberFormat("es-ES", { useGrouping: "always" });
  const fmt1 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1, useGrouping: "always" });
  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

  window.DATA = {
    ccaa,
    provincias,
    LENGUAS,
    ine,
    ccaaDeProvincia: (pid) => ccaa[provincias[pid].ccaa],
    fmt: (n) => fmt.format(Math.round(n)),
    fmt1: (n) => fmt1.format(n),
    fecha: (iso) => {
      const [y, m, d] = iso.split("-").map(Number);
      return `${d} de ${MESES[m - 1]} de ${y}`;
    },
    // Formato corto para ejes y leyendas: 1,2 M · 850 mil
    corto: (n) => (n >= 1e6 ? fmt1.format(n / 1e6) + " M" : n >= 1e4 ? fmt.format(Math.round(n / 1e3)) + " mil" : fmt.format(Math.round(n))),
  };
})();
