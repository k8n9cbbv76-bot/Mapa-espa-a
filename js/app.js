/* Aplicación: pestañas, estado y conexión entre el mapa y el panel */
(function () {
  const D = window.DATA;
  const $ = (s) => document.querySelector(s);
  const panel = $("#panel-contenido");
  const migas = $("#migas");
  const leyenda = $("#leyenda");
  const hud = $("#hud");
  const zonaMapa = document.querySelector(".mapa-zona");

  $("#fecha-ine").textContent = D.ine.fecha;

  const mapa = Mapa.crear($("#mapa"));
  Colores.asegurarTramas(mapa.svg);

  // Colores de base para "Explorar": tonos suaves, sin repetir entre comunidades vecinas
  const TONO = { "12": 1, "09": 1, "08": 1, "03": 2, "17": 2, "10": 2, "18": 2, "06": 3, "02": 3, "11": 3, "19": 3, "16": 4, "13": 4, "14": 4, "05": 4, "15": 5, "01": 5, "04": 5, "07": 6 };
  const colorBase = (pid) => `var(--t${TONO[D.provincias[pid].ccaa]})`;

  const estado = {
    tab: "explorar",
    ccaa: null, prov: null, // explorar
    colorVar: "poblacion", colorNivel: "ccaa", colorSel: null, // colorear
    compA: "01", compB: "09", compTurno: 0, // comparar
  };

  const juego = Juego.crear({
    mapa, hud,
    alActualizarPanel: (html) => pintarPanel(html),
    alTerminar: () => { zonaMapa.classList.remove("jugando"); },
  });

  function pintarPanel(html, arriba = true) {
    panel.innerHTML = html;
    if (arriba) panel.scrollTop = 0;
  }

  function limpiarMapa() {
    ["atenuada", "sel", "comp-a", "comp-b", "hover", "acierto", "fallo", "solucion"].forEach((c) => mapa.marcar(c, () => false));
    mapa.marcarCcaa("foco", () => false);
    mapa.etiquetas([]);
  }

  // ---------- Explorar ----------
  function pintarMigas() {
    if (estado.tab !== "explorar" || !estado.ccaa) { migas.innerHTML = ""; return; }
    const c = D.ccaa[estado.ccaa];
    let h = `<button data-ir="espana">España</button><span class="sep">›</span>`;
    h += estado.prov ? `<button data-ccaa="${c.id}">${c.nombreCorto}</button><span class="sep">›</span><span>${D.provincias[estado.prov].nombre}</span>` : `<span>${c.nombreCorto}</span>`;
    migas.innerHTML = h;
  }

  function verEspana() {
    estado.ccaa = null; estado.prov = null;
    limpiarMapa();
    mapa.nivel = "ccaa";
    mapa.colorear(colorBase);
    mapa.reset();
    pintarMigas();
    pintarPanel(Fichas.portada());
  }

  function verCcaa(id, { zoom = true } = {}) {
    estado.ccaa = id; estado.prov = null;
    const c = D.ccaa[id];
    mapa.nivel = "prov";
    mapa.marcar("sel", () => false);
    mapa.marcar("atenuada", (pid) => D.provincias[pid].ccaa !== id);
    mapa.marcarCcaa("foco", (cid) => cid === id);
    mapa.etiquetas(c.provincias.length > 1 ? c.provincias.map((p) => ({ provId: p, texto: D.provincias[p].nombre })) : []);
    if (zoom) mapa.zoomCcaa(id);
    pintarMigas();
    pintarPanel(Fichas.comunidad(id));
    enfocarPanelEnMovil();
  }

  function verProv(pid) {
    const cid = D.provincias[pid].ccaa;
    if (estado.ccaa !== cid) verCcaa(cid);
    estado.prov = pid;
    mapa.marcar("sel", (p) => p === pid);
    pintarMigas();
    pintarPanel(Fichas.provincia(pid));
    enfocarPanelEnMovil();
  }

  function enfocarPanelEnMovil() {
    // En pantallas estrechas el panel está debajo del mapa: avisamos con un desplazamiento suave
    if (window.matchMedia("(max-width: 900px)").matches) {
      const r = $("#panel").getBoundingClientRect();
      if (r.top > window.innerHeight - 80) window.scrollTo({ top: window.scrollY + 120, behavior: "smooth" });
    }
  }

  // ---------- Colorear ----------
  function verColores() {
    const v = Colores.VARIABLES[estado.colorVar];
    const nivel = v.categorica ? "ccaa" : estado.colorNivel;
    limpiarMapa();
    mapa.nivel = nivel;
    mapa.colorear(Colores.relleno(estado.colorVar, nivel));
    leyenda.innerHTML = Colores.leyenda(estado.colorVar, nivel);
    leyenda.hidden = false;
    pintarPanel(Colores.panel(estado.colorVar, nivel, estado.colorSel), false);
  }

  // ---------- Comparar ----------
  function verComparador() {
    limpiarMapa();
    mapa.nivel = "ccaa";
    mapa.colorear(() => "var(--cat-neutral)");
    mapa.marcar("comp-a", (p) => D.provincias[p].ccaa === estado.compA);
    mapa.marcar("comp-b", (p) => D.provincias[p].ccaa === estado.compB);
    pintarPanel(Comparador.panel(estado.compA, estado.compB), false);
  }

  // ---------- Pestañas ----------
  function cambiarTab(tab) {
    if (juego.activo()) juego.salir();
    zonaMapa.classList.remove("jugando");
    estado.tab = tab;
    document.querySelectorAll(".pestanas button").forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === tab));
    leyenda.hidden = true;
    hud.hidden = true;
    migas.innerHTML = "";
    limpiarMapa();
    mapa.reset();
    if (tab === "explorar") verEspana();
    if (tab === "colorear") verColores();
    if (tab === "comparar") verComparador();
    if (tab === "jugar") {
      mapa.nivel = "ccaa";
      mapa.colorear(() => "var(--cat-neutral)");
      pintarPanel(Juego.panelInicio());
    }
    try { history.replaceState(null, "", "#" + tab); } catch (e) {}
  }

  // ---------- Tooltip del mapa ----------
  mapa.handlers.tip = (pid, nivel) => {
    if (estado.tab === "jugar") return null; // ¡sin pistas en el juego!
    if (estado.tab === "colorear") return Colores.tip(estado.colorVar, nivel, pid);
    if (nivel === "ccaa") {
      const c = D.ccaa[D.provincias[pid].ccaa];
      return `<b>${c.nombreCorto}</b><br><small>${c.capital.length > 24 ? "Capital compartida" : "Capital: " + c.capital} · ${D.corto(c.poblacion)} hab.</small>`;
    }
    const p = D.provincias[pid];
    return `<b>${p.nombre}</b><br><small>Capital: ${p.capital} · ${D.corto(p.poblacion)} hab.</small>`;
  };

  // ---------- Clic en el mapa ----------
  mapa.handlers.click = (pid) => {
    const cid = D.provincias[pid].ccaa;
    if (estado.tab === "explorar") {
      if (estado.ccaa === cid) {
        if (estado.prov === pid && D.ccaa[cid].provincias.length > 1) verCcaa(cid, { zoom: false });
        else verProv(pid);
      } else verCcaa(cid);
    } else if (estado.tab === "colorear") {
      const nivel = mapa.nivel;
      estado.colorSel = Colores.tip(estado.colorVar, nivel, pid).replace("<br>", " · ");
      mapa.marcar("sel", (p) => (nivel === "ccaa" ? D.provincias[p].ccaa === cid : p === pid));
      pintarPanel(Colores.panel(estado.colorVar, Colores.VARIABLES[estado.colorVar].categorica ? "ccaa" : estado.colorNivel, estado.colorSel), false);
    } else if (estado.tab === "comparar") {
      if (cid === estado.compA || cid === estado.compB) return;
      if (estado.compTurno === 0) estado.compA = cid; else estado.compB = cid;
      estado.compTurno = 1 - estado.compTurno;
      verComparador();
    } else if (estado.tab === "jugar") {
      juego.responder(pid);
    }
  };
  mapa.handlers.fondo = () => {
    if (estado.tab === "explorar" && estado.ccaa) verEspana();
  };

  // ---------- Eventos de la interfaz ----------
  document.querySelector(".pestanas").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-tab]");
    if (b) cambiarTab(b.dataset.tab);
  });
  // Flechas izquierda/derecha entre pestañas
  document.querySelector(".pestanas").addEventListener("keydown", (e) => {
    if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
    const tabs = [...document.querySelectorAll(".pestanas button")];
    const i = tabs.findIndex((t) => t.dataset.tab === estado.tab);
    const n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    n.focus(); cambiarTab(n.dataset.tab);
  });

  migas.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.ir === "espana") verEspana();
    else if (b.dataset.ccaa) verCcaa(b.dataset.ccaa);
  });

  panel.addEventListener("click", (e) => {
    const t = e.target.closest("[data-ccaa],[data-prov],[data-var],[data-nivel],[data-accion]");
    if (!t) return;
    if (estado.tab === "explorar") {
      if (t.dataset.prov) verProv(t.dataset.prov);
      else if (t.dataset.ccaa) verCcaa(t.dataset.ccaa);
    } else if (estado.tab === "colorear") {
      if (t.dataset.var) { estado.colorVar = t.dataset.var; estado.colorSel = null; verColores(); }
      else if (t.dataset.nivel) { estado.colorNivel = t.dataset.nivel; estado.colorSel = null; verColores(); }
      else if (t.dataset.ccaa || t.dataset.prov) {
        const pid = t.dataset.prov || D.ccaa[t.dataset.ccaa].provincias[0];
        mapa.handlers.click(pid);
        if (t.dataset.prov) mapa.zoomProv(pid); else mapa.zoomCcaa(t.dataset.ccaa);
      }
    } else if (estado.tab === "jugar") {
      if (t.dataset.nivel) { zonaMapa.classList.add("jugando"); juego.empezar(t.dataset.nivel); }
      else if (t.dataset.accion === "salir" || t.dataset.accion === "niveles") {
        juego.salir(); zonaMapa.classList.remove("jugando"); mapa.reset(); pintarPanel(Juego.panelInicio());
      }
    }
  });

  panel.addEventListener("change", (e) => {
    if (e.target.id === "comp-a") estado.compA = e.target.value;
    if (e.target.id === "comp-b") estado.compB = e.target.value;
    if (estado.compA === estado.compB) {
      // No tiene sentido comparar una comunidad consigo misma: cambiamos la otra
      const otra = Object.keys(D.ccaa).find((k) => k !== estado.compA);
      if (e.target.id === "comp-a") estado.compB = otra; else estado.compA = otra;
    }
    verComparador();
  });

  $("#zoom-mas").addEventListener("click", () => mapa.zoomPor(1.6));
  $("#zoom-menos").addEventListener("click", () => mapa.zoomPor(1 / 1.6));
  $("#zoom-reset").addEventListener("click", () => mapa.reset());

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && estado.tab === "explorar" && estado.ccaa) verEspana();
  });

  // ---------- Tema claro / oscuro ----------
  $("#btn-tema").addEventListener("click", () => {
    const html = document.documentElement;
    const actual = html.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const nuevo = actual === "dark" ? "light" : "dark";
    html.dataset.theme = nuevo;
    try { localStorage.setItem("tema", nuevo); } catch (e) {}
  });

  // ---------- Inicio ----------
  const inicial = (location.hash || "").slice(1);
  cambiarTab(["explorar", "colorear", "comparar", "jugar"].includes(inicial) ? inicial : "explorar");
})();
