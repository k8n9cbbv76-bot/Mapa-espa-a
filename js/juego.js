/* Modo juego: localizar comunidades, provincias y capitales en el mapa */
window.Juego = (function () {
  const D = window.DATA;
  const N_PREGUNTAS = 10;

  const NIVELES = [
    {
      id: "comunidades", nombre: "Comunidades", ico: "🗺️", dif: "Nivel 1 · Fácil",
      desc: "Encuentra las comunidades y ciudades autónomas.",
      mapa: "ccaa",
      preguntas: () => Object.values(D.ccaa).map((c) => ({ obj: c.id, texto: `¿Dónde está <em>${c.nombreCorto}</em>?`, sol: c.nombreCorto })),
      correcta: (q, pid) => D.provincias[pid].ccaa === q.obj,
      solucion: (q) => (pid) => D.provincias[pid].ccaa === q.obj,
    },
    {
      id: "capitales-ccaa", nombre: "Capitales autonómicas", ico: "🏛️", dif: "Nivel 2 · Medio",
      desc: "¿De qué comunidad es capital esta ciudad?",
      mapa: "ccaa",
      preguntas: () => Object.values(D.ccaa).map((c) => ({ obj: c.id, texto: `¿De qué comunidad es capital <em>${c.capital}</em>?`, sol: c.nombreCorto })),
      correcta: (q, pid) => D.provincias[pid].ccaa === q.obj,
      solucion: (q) => (pid) => D.provincias[pid].ccaa === q.obj,
    },
    {
      id: "provincias", nombre: "Provincias", ico: "📍", dif: "Nivel 3 · Medio",
      desc: "Localiza las 50 provincias (y Ceuta y Melilla).",
      mapa: "prov",
      preguntas: () => Object.values(D.provincias).map((p) => ({ obj: p.id, texto: `¿Dónde está la provincia de <em>${p.nombre}</em>?`, sol: p.nombre })),
      correcta: (q, pid) => pid === q.obj,
      solucion: (q) => (pid) => pid === q.obj,
    },
    {
      id: "capitales-prov", nombre: "Capitales de provincia", ico: "🏙️", dif: "Nivel 4 · Difícil",
      desc: "Toca la provincia de la que es capital cada ciudad.",
      mapa: "prov",
      preguntas: () => Object.values(D.provincias)
        .filter((p) => p.id !== "51" && p.id !== "52")
        .map((p) => ({ obj: p.id, texto: `¿De qué provincia es capital <em>${p.capital}</em>?`, sol: `${p.capital} → ${p.nombre}` })),
      correcta: (q, pid) => pid === q.obj,
      solucion: (q) => (pid) => pid === q.obj,
    },
    {
      id: "ciudades", nombre: "Grandes ciudades", ico: "🌆", dif: "Nivel 5 · Experto",
      desc: "¿En qué provincia está? (el municipio más poblado que no es capital).",
      mapa: "prov",
      preguntas: () => Object.values(D.provincias)
        .filter((p) => p.principales.length > 1)
        .map((p) => {
          const capital = p.capital.split("/")[0].toLowerCase();
          const m = p.principales.find(([n]) => !n.toLowerCase().includes(capital) && !capital.includes(n.split("/")[0].toLowerCase())) || p.principales[1];
          return { obj: p.id, texto: `¿En qué provincia está <em>${m[0]}</em>?`, sol: `${m[0]} → ${p.nombre}` };
        }),
      correcta: (q, pid) => pid === q.obj,
      solucion: (q) => (pid) => pid === q.obj,
    },
  ];

  // ---------- Récords (localStorage, con protección por si no está disponible) ----------
  function leerRecord(id) {
    try { return JSON.parse(localStorage.getItem("record-" + id)) || null; } catch (e) { return null; }
  }
  function guardarRecord(id, r) {
    try { localStorage.setItem("record-" + id, JSON.stringify(r)); } catch (e) { /* sin almacenamiento */ }
  }

  const fmtTiempo = (ms) => {
    const s = ms / 1000;
    return s < 60 ? s.toFixed(1) + " s" : Math.floor(s / 60) + " min " + Math.round(s % 60) + " s";
  };

  function barajar(a) {
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  }

  // ---------- Paneles ----------
  function panelInicio() {
    const niveles = NIVELES.map((n) => {
      const r = leerRecord(n.id);
      return `<button class="nivel" data-nivel="${n.id}">
        <span class="ico" aria-hidden="true">${n.ico}</span>
        <span><b>${n.nombre}</b><small>${n.dif} · ${n.desc}</small></span>
        <span class="record">Récord<strong>${r ? D.fmt(r.puntos) : "—"}</strong>${r ? fmtTiempo(r.tiempo) : ""}</span>
      </button>`;
    }).join("");
    return `
      <p class="eyebrow">Modo juego</p>
      <h2>¿Cuánto sabes de España?</h2>
      <p class="intro">Cada partida tiene ${N_PREGUNTAS} preguntas. Ganas <b>100 puntos</b> por acierto y hasta <b>50 de bonus</b> si respondes rápido. Tu récord se guarda en este navegador.</p>
      <h3>Elige un nivel</h3>
      <div class="niveles">${niveles}</div>
      <p class="nota">Consejo: haz zoom con la rueda del ratón o pellizcando para acertar las provincias pequeñas.</p>`;
  }

  function panelPartida(st) {
    const n = st.nivel;
    return `
      <p class="eyebrow">${n.dif}</p>
      <h2>${n.ico} ${n.nombre}</h2>
      <div class="progreso" aria-hidden="true"><i style="width:${(st.i / st.preguntas.length) * 100}%"></i></div>
      <div class="marcador">
        <div class="stat"><div class="k">Pregunta</div><div class="v">${Math.min(st.i + 1, st.preguntas.length)}/${st.preguntas.length}</div></div>
        <div class="stat"><div class="k">Aciertos</div><div class="v">${st.aciertos}</div></div>
        <div class="stat"><div class="k">Puntos</div><div class="v">${D.fmt(st.puntos)}</div></div>
      </div>
      <div class="acciones"><button class="btn sec" data-accion="salir">Abandonar</button></div>`;
  }

  function panelFinal(st, nuevo) {
    const r = leerRecord(st.nivel.id);
    const fallos = st.historial.filter((h) => !h.ok);
    return `
      <p class="eyebrow">Fin de la partida</p>
      <h2>${st.aciertos === st.preguntas.length ? "¡Perfecto! 🏆" : st.aciertos >= 7 ? "¡Muy bien! 🎉" : st.aciertos >= 4 ? "¡Bien! 👍" : "¡Sigue practicando! 💪"}</h2>
      <div class="resultado-grande">${D.fmt(st.puntos)} <small style="font-size:1rem;color:var(--text-2)">puntos</small></div>
      ${nuevo ? `<span class="nuevo-record">⭐ ¡Nuevo récord!</span>` : ""}
      <div class="marcador">
        <div class="stat"><div class="k">Aciertos</div><div class="v">${st.aciertos}/${st.preguntas.length}</div></div>
        <div class="stat"><div class="k">Tiempo</div><div class="v">${fmtTiempo(st.tiempo)}</div></div>
        <div class="stat"><div class="k">Récord</div><div class="v">${r ? D.fmt(r.puntos) : "—"}</div></div>
      </div>
      ${fallos.length ? `<h3>Para repasar</h3><ul class="lista">${fallos.map((f) => `<li>${f.sol}</li>`).join("")}</ul>` : ""}
      <div class="acciones">
        <button class="btn" data-nivel="${st.nivel.id}">Jugar otra vez</button>
        <button class="btn sec" data-accion="niveles">Elegir otro nivel</button>
      </div>`;
  }

  // ---------- Lógica ----------
  function crear({ mapa, hud, alActualizarPanel, alTerminar }) {
    let st = null;
    let reloj = null;

    function pintarHud(feedback = "", tipo = "") {
      if (!st) return;
      const q = st.preguntas[st.i];
      const t = Date.now() - st.inicio;
      hud.hidden = false;
      hud.innerHTML = `
        <div class="pregunta">${q ? q.texto : "¡Terminado!"}</div>
        <div class="datos"><span>⏱ <b data-reloj>${fmtTiempo(t)}</b></span><span>⭐ ${D.fmt(st.puntos)}</span><span>✔ ${st.aciertos}/${st.preguntas.length}</span></div>
        <div class="feedback ${tipo}">${feedback}</div>`;
    }

    function empezar(idNivel) {
      const nivel = NIVELES.find((n) => n.id === idNivel);
      st = {
        nivel,
        preguntas: barajar(nivel.preguntas()).slice(0, N_PREGUNTAS),
        i: 0, puntos: 0, aciertos: 0, historial: [],
        inicio: Date.now(), tPregunta: Date.now(), bloqueado: false,
      };
      mapa.nivel = nivel.mapa;
      limpiarMarcas();
      mapa.reset();
      pintarHud("Toca el mapa para responder");
      alActualizarPanel(panelPartida(st));
      clearInterval(reloj);
      reloj = setInterval(() => {
        const el = hud.querySelector("[data-reloj]");
        if (el && st) el.textContent = fmtTiempo(Date.now() - st.inicio);
      }, 100);
    }

    function limpiarMarcas() {
      mapa.marcar("acierto", () => false);
      mapa.marcar("fallo", () => false);
      mapa.marcar("solucion", () => false);
    }

    function responder(pid) {
      if (!st || st.bloqueado || st.i >= st.preguntas.length) return;
      const q = st.preguntas[st.i];
      const nivel = st.nivel;
      const ok = nivel.correcta(q, pid);
      const seg = (Date.now() - st.tPregunta) / 1000;
      st.bloqueado = true;
      const grupo = nivel.mapa === "ccaa" ? (p) => D.provincias[p].ccaa === D.provincias[pid].ccaa : (p) => p === pid;
      if (ok) {
        const bonus = Math.max(0, Math.round(50 - seg * 5));
        st.puntos += 100 + bonus;
        st.aciertos++;
        mapa.marcar("acierto", grupo);
        pintarHud(`¡Correcto! +${100 + bonus}${bonus ? ` (bonus rapidez ${bonus})` : ""}`, "ok");
      } else {
        mapa.marcar("fallo", grupo);
        mapa.marcar("solucion", nivel.solucion(q));
        pintarHud(`No… la respuesta era ${q.sol}`, "ko");
      }
      st.historial.push({ ok, sol: q.sol });
      setTimeout(siguiente, ok ? 900 : 1900);
    }

    function siguiente() {
      if (!st) return;
      limpiarMarcas();
      st.i++;
      st.bloqueado = false;
      st.tPregunta = Date.now();
      if (st.i >= st.preguntas.length) return terminar();
      pintarHud();
      alActualizarPanel(panelPartida(st));
    }

    function terminar() {
      clearInterval(reloj);
      st.tiempo = Date.now() - st.inicio;
      const r = leerRecord(st.nivel.id);
      const nuevo = !r || st.puntos > r.puntos || (st.puntos === r.puntos && st.tiempo < r.tiempo);
      if (nuevo) guardarRecord(st.nivel.id, { puntos: st.puntos, tiempo: st.tiempo, fecha: new Date().toISOString() });
      hud.hidden = true;
      alActualizarPanel(panelFinal(st, nuevo));
      if (alTerminar) alTerminar(st);
      st = null;
    }

    function salir() {
      clearInterval(reloj);
      st = null;
      hud.hidden = true;
      limpiarMarcas();
    }

    return { empezar, responder, salir, activo: () => !!st, panelInicio };
  }

  return { crear, NIVELES, panelInicio, leerRecord };
})();
