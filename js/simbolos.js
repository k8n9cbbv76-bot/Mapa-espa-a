/*
 * Banderas y escudos dibujados en SVG.
 * Las banderas siguen el diseño oficial de forma simplificada (proporción 3:2).
 * Los escudos son versiones ESQUEMÁTICAS pensadas para reconocerlos, no reproducciones heráldicas exactas.
 */
(function () {
  const C = {
    rojo: "#da121a", amarillo: "#fcdd09", verde: "#007a3d", blanco: "#ffffff", negro: "#111111",
    azul: "#0033a0", celeste: "#6cace4", morado: "#7b2d82", carmesi: "#a6192e", oro: "#e8b923", plata: "#f2f2f2",
  };

  // ---------- Piezas reutilizables ----------
  const rect = (x, y, w, h, f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;

  // Barras de la Corona de Aragón (9 franjas: 5 amarillas y 4 rojas)
  function barras(x, y, w, h, vertical) {
    let s = rect(x, y, w, h, C.amarillo);
    for (let i = 1; i < 9; i += 2) {
      s += vertical ? rect(x + (w / 9) * i, y, w / 9, h, C.rojo) : rect(x, y + (h / 9) * i, w, h / 9, C.rojo);
    }
    return s;
  }

  // Castillo de tres torres, (x,y) = esquina inferior izquierda, w = ancho
  function castillo(x, y, w, fill, puerta) {
    const u = w / 10;
    const h = w * 0.9;
    const almenas = (bx, bw, top) => {
      let p = "";
      const n = 3, aw = bw / (n * 2 - 1);
      for (let i = 0; i < n; i++) p += rect(bx + i * 2 * aw, top - u, aw, u, fill);
      return p;
    };
    let s = "";
    s += rect(x, y - h * 0.55, w, h * 0.55, fill); // cuerpo
    s += almenas(x, w, y - h * 0.55);
    s += rect(x + w * 0.35, y - h, w * 0.3, h * 0.45, fill); // torre central
    s += almenas(x + w * 0.35, w * 0.3, y - h);
    s += rect(x + u * 0.3, y - h * 0.78, w * 0.2, h * 0.25, fill);
    s += almenas(x + u * 0.3, w * 0.2, y - h * 0.78);
    s += rect(x + w - u * 0.3 - w * 0.2, y - h * 0.78, w * 0.2, h * 0.25, fill);
    s += almenas(x + w - u * 0.3 - w * 0.2, w * 0.2, y - h * 0.78);
    if (puerta) {
      s += `<path d="M${x + w * 0.4} ${y} v${-h * 0.22} a${w * 0.1} ${w * 0.1} 0 0 1 ${w * 0.2} 0 v${h * 0.22}z" fill="${puerta}"/>`;
      s += rect(x + w * 0.18, y - h * 0.4, w * 0.08, h * 0.12, puerta) + rect(x + w * 0.74, y - h * 0.4, w * 0.08, h * 0.12, puerta);
    }
    return s;
  }

  // León rampante estilizado dentro de una caja de 100x100 escalada
  function leon(x, y, s, fill) {
    return `<g transform="translate(${x} ${y}) scale(${s / 100})"><path fill="${fill}" d="M34 96 L40 72 L31 62 L29 47 L19 43 L23 31 L34 33 L38 21 L49 14 L61 19 L60 29 L68 26 L76 18 L74 34 L64 40 L67 54 L77 59 L84 74 L73 71 L63 65 L60 79 L68 96 L56 96 L51 81 L46 96 Z M64 62 Q90 60 88 86 Q86 70 70 70 Z"/><path fill="${C.rojo}" d="M49 14 l4 -8 l3 6 l4 -7 l2 9z"/></g>`;
  }

  function corona(cx, y, w, fill = C.oro) {
    const h = w * 0.55;
    const x = cx - w / 2;
    return `<g><path fill="${fill}" stroke="#7a5a00" stroke-width="${w / 60}" d="M${x} ${y} L${x + w * 0.05} ${y - h * 0.65} L${x + w * 0.25} ${y - h * 0.35} L${x + w * 0.5} ${y - h} L${x + w * 0.75} ${y - h * 0.35} L${x + w * 0.95} ${y - h * 0.65} L${x + w} ${y} Z"/><rect x="${x}" y="${y}" width="${w}" height="${h * 0.22}" fill="${fill}" stroke="#7a5a00" stroke-width="${w / 60}"/><circle cx="${cx}" cy="${y - h * 1.05}" r="${w * 0.06}" fill="${fill}"/><circle cx="${cx}" cy="${y + h * 0.11}" r="${w * 0.04}" fill="${C.rojo}"/></g>`;
  }

  function estrella(cx, cy, r, fill) {
    let d = "";
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const rr = i % 2 ? r * 0.4 : r;
      d += (i ? "L" : "M") + (cx + rr * Math.cos(a)).toFixed(2) + " " + (cy + rr * Math.sin(a)).toFixed(2);
    }
    return `<path d="${d}Z" fill="${fill}"/>`;
  }

  function arbol(cx, y, s, fill = C.verde) {
    return `<g><rect x="${cx - s * 0.06}" y="${y - s * 0.45}" width="${s * 0.12}" height="${s * 0.45}" fill="#6b3e1d"/><circle cx="${cx}" cy="${y - s * 0.62}" r="${s * 0.3}" fill="${fill}"/><circle cx="${cx - s * 0.22}" cy="${y - s * 0.5}" r="${s * 0.2}" fill="${fill}"/><circle cx="${cx + s * 0.22}" cy="${y - s * 0.5}" r="${s * 0.2}" fill="${fill}"/></g>`;
  }

  function cadenas(x, y, w, h) {
    // Cadenas de Navarra: orla, cruz y aspa de cadenas de oro con una esmeralda en el centro
    const cx = x + w / 2, cy = y + h / 2;
    const st = `stroke="${C.oro}" stroke-width="${w / 18}" stroke-dasharray="${w / 22} ${w / 40}" fill="none"`;
    return `<rect x="${x + w * 0.06}" y="${y + h * 0.06}" width="${w * 0.88}" height="${h * 0.88}" ${st}/>
      <line x1="${cx}" y1="${y + h * 0.06}" x2="${cx}" y2="${y + h * 0.94}" ${st}/>
      <line x1="${x + w * 0.06}" y1="${cy}" x2="${x + w * 0.94}" y2="${cy}" ${st}/>
      <line x1="${x + w * 0.06}" y1="${y + h * 0.06}" x2="${x + w * 0.94}" y2="${y + h * 0.94}" ${st}/>
      <line x1="${x + w * 0.94}" y1="${y + h * 0.06}" x2="${x + w * 0.06}" y2="${y + h * 0.94}" ${st}/>
      <circle cx="${cx}" cy="${cy}" r="${w * 0.07}" fill="${C.verde}" stroke="${C.oro}" stroke-width="${w / 40}"/>`;
  }

  // ---------- Escudos (viewBox 0 0 100 130; el blasón ocupa y = 25..125) ----------
  const FORMA = "M8 28 H92 V78 Q92 116 50 126 Q8 116 8 78 Z";
  function escudo(id, contenido, conCorona = true, forma = FORMA) {
    return `<svg viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg" role="img">
      <defs><clipPath id="cl-${id}"><path d="${forma}"/></clipPath></defs>
      ${conCorona ? corona(50, 22, 46) : ""}
      <g clip-path="url(#cl-${id})">${contenido}</g>
      <path d="${forma}" fill="none" stroke="#3a2c00" stroke-width="2"/>
    </svg>`;
  }
  const cuartel = (n, f) => {
    const pos = [[8, 28], [50, 28], [8, 77], [50, 77]][n];
    return rect(pos[0], pos[1], 42, 49, f);
  };
  const castillaLeon = (k = "cyl") =>
    cuartel(0, C.rojo) + castillo(15, 70, 28, C.oro, C.azul) +
    cuartel(1, C.plata) + leon(52, 30, 38, C.morado) +
    cuartel(2, C.plata) + leon(10, 79, 38, C.morado) +
    cuartel(3, C.rojo) + castillo(57, 119, 28, C.oro, C.azul);

  const ESCUDOS = {
    "01": () => escudo("01",
      rect(0, 0, 100, 130, "#f5f0dc") +
      // columnas de Hércules
      rect(18, 55, 9, 55, "#c9b37a") + rect(15, 50, 15, 6, "#c9b37a") + rect(15, 108, 15, 5, "#c9b37a") +
      rect(73, 55, 9, 55, "#c9b37a") + rect(70, 50, 15, 6, "#c9b37a") + rect(70, 108, 15, 5, "#c9b37a") +
      // Hércules con dos leones (muy esquemático)
      `<circle cx="50" cy="52" r="6" fill="#d9a36b"/><path d="M42 60 h16 l-2 30 h-4 l-2 18 h-0 l-2 -18 h-4z" fill="#d9a36b"/>` +
      leon(31, 82, 22, "#c99a2e") + `<g transform="translate(118 0) scale(-1 1)">${leon(49, 82, 22, "#c99a2e")}</g>` +
      `<path d="M8 28 H92 V40 H8z" fill="${C.verde}"/>` +
      `<text x="50" y="37" font-size="5.2" text-anchor="middle" fill="#fff" font-family="serif">DOMINATOR HERCULES</text>`, false),
    "02": () => escudo("02",
      cuartel(0, C.oro) + arbol(29, 72, 36) + `<path d="M26 36 h6 v4 h4 v5 h-4 v6 h-6 v-6 h-4 v-5 h4z" fill="${C.rojo}"/>` +
      cuartel(1, C.azul) + `<path d="M68 33 h6 v12 h12 v6 h-12 v18 h-6 v-18 h-12 v-6 h12z" fill="${C.plata}"/>` +
      cuartel(2, C.plata) + rect(26, 77, 6, 49, C.rojo) + rect(8, 98, 42, 6, C.rojo) +
      `<circle cx="17" cy="88" r="4.5" fill="#222"/><circle cx="41" cy="88" r="4.5" fill="#222"/><circle cx="17" cy="114" r="4.5" fill="#222"/><circle cx="41" cy="114" r="4.5" fill="#222"/>` +
      barras(50, 77, 42, 49, true)),
    "03": () => escudo("03",
      rect(0, 0, 100, 130, C.azul) +
      `<path d="M46 40 h8 v14 h14 v8 h-14 v42 h-8 v-42 h-14 v-8 h14z" fill="${C.oro}" stroke="#7a5a00"/>` +
      `<text x="30" y="80" font-size="14" fill="${C.oro}" font-family="serif" text-anchor="middle">Α</text>` +
      `<text x="70" y="80" font-size="14" fill="${C.oro}" font-family="serif" text-anchor="middle">Ω</text>`),
    "04": () => escudo("04", barras(8, 28, 84, 100, true)),
    "05": () => escudo("05",
      rect(0, 0, 100, 130, C.azul) +
      [[30, 55], [50, 50], [70, 55], [25, 78], [45, 76], [65, 80], [50, 100]]
        .map(([x, y]) => `<path d="M${x - 7} ${y} q3 -6 7 -4 q5 -3 7 4 q-4 4 -14 0z" fill="${C.plata}"/>`).join("")),
    "06": () => escudo("06",
      rect(8, 28, 84, 50, "#2e6db4") + castillo(18, 70, 26, C.oro, C.rojo) +
      `<path d="M55 64 h30 l-5 8 h-20z" fill="#6b3e1d"/><path d="M68 40 v24 M68 42 l12 18 h-12" stroke="#fff" fill="#fff" stroke-width="1.5"/>` +
      rect(8, 78, 84, 50, C.rojo) +
      `<circle cx="50" cy="99" r="15" fill="none" stroke="${C.oro}" stroke-width="3"/><path d="M50 99 m-10 0 a10 10 0 0 1 20 0 a5 5 0 0 1 -10 0 a5 5 0 0 0 -10 0" fill="none" stroke="${C.oro}" stroke-width="2.5"/><rect x="46" y="114" width="8" height="12" fill="${C.oro}"/>`),
    "07": () => escudo("07", castillaLeon()),
    "08": () => escudo("08", rect(8, 28, 42, 100, C.carmesi) + castillo(13, 92, 32, C.oro, C.azul) + rect(50, 28, 42, 100, C.plata)),
    "09": () => escudo("09", barras(8, 22, 84, 104, true), true, "M50 24 L92 75 L50 126 L8 75 Z"),
    "10": () => escudo("10",
      `<g transform="rotate(-12 50 75)">${barras(0, 10, 100, 130, true)}</g>`),
    "11": () => escudo("11",
      cuartel(0, C.rojo) + castillo(15, 70, 28, C.oro, C.azul) + cuartel(1, C.plata) + leon(52, 30, 38, C.morado) +
      rect(8, 77, 84, 50, C.oro) + arbol(50, 120, 40) +
      rect(18, 86, 6, 32, "#c9b37a") + rect(76, 86, 6, 32, "#c9b37a")),
    "12": () => escudo("12",
      rect(0, 0, 100, 130, C.azul) +
      `<path d="M38 48 h24 q0 18 -9 22 v14 h8 v5 h-22 v-5 h8 v-14 q-9 -4 -9 -22z" fill="${C.oro}" stroke="#7a5a00"/><circle cx="50" cy="44" r="7" fill="${C.plata}"/>` +
      [[22, 45], [78, 45], [22, 68], [78, 68], [22, 92], [78, 92], [50, 108]]
        .map(([x, y]) => `<path d="M${x - 1.6} ${y - 6} h3.2 v4.4 h4.4 v3.2 h-4.4 v4.4 h-3.2 v-4.4 h-4.4 v-3.2 h4.4z" fill="${C.plata}"/>`).join("")),
    "13": () => escudo("13",
      rect(0, 0, 100, 130, C.carmesi) +
      [[26, 42], [42, 42], [58, 42], [74, 42], [34, 56], [50, 56], [66, 56]].map(([x, y]) => estrella(x, y, 6, C.blanco)).join("") +
      castillo(20, 105, 26, C.oro, C.azul) + castillo(54, 105, 26, C.oro, C.azul)),
    "14": () => escudo("14",
      rect(0, 0, 100, 130, C.carmesi) +
      castillo(14, 52, 18, C.oro) + castillo(36, 52, 18, C.oro) + castillo(14, 74, 18, C.oro) + castillo(36, 74, 18, C.oro) +
      [[74, 64], [62, 82], [74, 82], [86, 82], [68, 98], [80, 98], [74, 113]].map(([x, y]) => corona(x, y, 10)).join("")),
    "15": () => escudo("15", rect(0, 0, 100, 130, C.rojo) + cadenas(8, 28, 84, 98)),
    "16": () => escudo("16",
      cuartel(0, C.plata) + castillo(14, 70, 30, "#9b9b9b", C.azul) +
      cuartel(1, C.plata) + arbol(71, 70, 34) + `<path d="M58 70 h8 l-2 -4 h-6z M78 70 h8 l-2 -4 h-6z" fill="#333"/>` +
      cuartel(2, C.oro) + arbol(29, 120, 34) +
      cuartel(3, C.rojo) +
      `<path d="${FORMA}" fill="none" stroke="${C.verde}" stroke-width="7"/>`),
    "17": () => escudo("17",
      rect(0, 0, 100, 130, C.oro) +
      `<path d="M8 128 L30 82 L50 92 L70 80 L92 128z" fill="#8a6e4b"/>` + castillo(37, 86, 26, C.rojo, C.oro) +
      `<path d="M18 46 h4 v4 h4 v4 h-4 v10 h-4 v-10 h-4 v-4 h4z" fill="${C.rojo}"/><path d="M78 46 h4 v4 h4 v4 h-4 v10 h-4 v-10 h-4 v-4 h4z" fill="${C.rojo}"/>` +
      `<path d="M8 112 q10 -5 21 0 t21 0 t21 0 t21 0" stroke="${C.azul}" stroke-width="4" fill="none"/>`),
    "18": () => escudo("18",
      rect(0, 0, 100, 130, C.rojo) + `<path d="M22 40 H78 V78 Q78 104 50 112 Q22 104 22 78Z" fill="${C.plata}"/>` +
      [[50, 52], [38, 68], [50, 68], [62, 68], [50, 86]].map(([x, y]) => `<path d="M${x - 5} ${y - 6} h10 v7 q0 5 -5 6 q-5 -1 -5 -6z" fill="${C.azul}"/>`).join("") +
      [[15, 40], [15, 62], [15, 84], [85, 40], [85, 62], [85, 84], [50, 120]].map(([x, y]) => castillo(x - 5, y, 10, C.oro)).join("")),
    "19": () => escudo("19",
      cuartel(0, C.azul) + `<path d="M17 45 h24 l-3 16 h-18z" fill="${C.oro}"/>` +
      cuartel(1, C.plata) + [[62, 42], [80, 42], [71, 54], [62, 66], [80, 66]].map(([x, y]) => `<path d="M${x} ${y} l-3 6 h6z" fill="#222"/>`).join("") +
      cuartel(2, C.plata) + [[20, 90], [38, 90], [29, 102], [20, 114], [38, 114]].map(([x, y]) => `<path d="M${x} ${y} l-3 6 h6z" fill="#222"/>`).join("") +
      cuartel(3, C.azul) + `<path d="M59 94 h24 l-3 16 h-18z" fill="${C.oro}"/>`),
  };

  // ---------- Banderas (viewBox 0 0 300 200) ----------
  const bandera = (contenido) =>
    `<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg" role="img" preserveAspectRatio="xMidYMid meet">${contenido}<rect x="0.5" y="0.5" width="299" height="199" fill="none" stroke="rgba(0,0,0,.25)"/></svg>`;
  const escudoEn = (id, x, y, h) => {
    const inner = ESCUDOS[id]().replace(/<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
    return `<g transform="translate(${x - (h * 100) / 130 / 2} ${y - h / 2}) scale(${h / 130})">${inner}</g>`;
  };

  const BANDERAS = {
    "01": () => bandera(rect(0, 0, 300, 200, C.verde) + rect(0, 66.7, 300, 66.6, C.blanco) + escudoEn("01", 150, 100, 92)),
    "02": () => bandera(barras(0, 0, 300, 200, false) + escudoEn("02", 105, 100, 120)),
    "03": () => bandera(rect(0, 0, 300, 200, C.azul) +
      `<path d="M140 30 h20 v40 h40 v20 h-40 v85 h-20 v-85 h-40 v-20 h40z" fill="${C.amarillo}"/>` +
      `<text x="110" y="135" font-size="34" fill="${C.amarillo}" font-family="serif" text-anchor="middle">Α</text><text x="190" y="135" font-size="34" fill="${C.amarillo}" font-family="serif" text-anchor="middle">Ω</text>`),
    "04": () => bandera(barras(0, 0, 300, 200, false) + rect(0, 0, 120, 111, C.morado) + castillo(30, 85, 60, C.blanco, C.morado)),
    "05": () => bandera(rect(0, 0, 100, 200, C.blanco) + rect(100, 0, 100, 200, "#0768a9") + rect(200, 0, 100, 200, C.amarillo)),
    "06": () => bandera(rect(0, 0, 300, 100, C.blanco) + rect(0, 100, 300, 100, C.rojo)),
    "07": () => bandera(rect(0, 0, 150, 100, C.carmesi) + castillo(45, 88, 60, C.oro, C.azul) + rect(150, 0, 150, 100, C.blanco) + leon(185, 8, 85, C.morado) +
      rect(0, 100, 150, 100, C.blanco) + leon(35, 108, 85, C.morado) + rect(150, 100, 150, 100, C.carmesi) + castillo(195, 188, 60, C.oro, C.azul)),
    "08": () => bandera(rect(0, 0, 150, 200, C.carmesi) + castillo(40, 140, 70, C.oro, C.azul) + rect(150, 0, 150, 200, C.blanco)),
    "09": () => bandera(barras(0, 0, 300, 200, false)),
    "10": () => bandera(barras(0, 0, 300, 200, false) + rect(0, 0, 50, 200, "#0b4ea2") + corona(25, 50, 34) +
      `<path d="M0 0 h50 M0 200 h50" stroke="${C.rojo}" stroke-width="10"/>`),
    "11": () => bandera(rect(0, 0, 300, 66.7, C.verde) + rect(0, 66.7, 300, 66.6, C.blanco) + rect(0, 133.3, 300, 66.7, C.negro)),
    "12": () => bandera(rect(0, 0, 300, 200, C.blanco) + `<path d="M0 0 L50 0 L300 170 L300 200 L250 200 L0 30Z" fill="#0099cc"/>`),
    "13": () => bandera(rect(0, 0, 300, 200, "#c8102e") +
      [[60, 72], [120, 72], [180, 72], [240, 72], [90, 128], [150, 128], [210, 128]].map(([x, y]) => estrella(x, y, 22, C.blanco)).join("")),
    "14": () => bandera(rect(0, 0, 300, 200, "#9b1d34") +
      castillo(14, 48, 32, C.oro) + castillo(54, 48, 32, C.oro) + castillo(14, 92, 32, C.oro) + castillo(54, 92, 32, C.oro) +
      [[240, 110], [210, 134], [240, 134], [270, 134], [225, 158], [255, 158], [240, 182]].map(([x, y]) => corona(x, y, 22)).join("")),
    "15": () => bandera(rect(0, 0, 300, 200, C.rojo) + escudoEn("15", 150, 100, 130)),
    "16": () => bandera(rect(0, 0, 300, 200, "#d52b1e") +
      `<path d="M0 0 L300 200 M300 0 L0 200" stroke="#009b48" stroke-width="28"/>` + rect(138, 0, 24, 200, C.blanco) + rect(0, 88, 300, 24, C.blanco)),
    "17": () => bandera(rect(0, 0, 300, 50, C.rojo) + rect(0, 50, 300, 50, C.blanco) + rect(0, 100, 300, 50, C.verde) + rect(0, 150, 300, 50, C.amarillo)),
    "18": () => bandera((() => {
      let s = "";
      for (let i = 0; i < 8; i++) {
        const a1 = (Math.PI / 4) * i - Math.PI / 2, a2 = a1 + Math.PI / 4, R = 400;
        s += `<path d="M150 100 L${150 + R * Math.cos(a1)} ${100 + R * Math.sin(a1)} L${150 + R * Math.cos(a2)} ${100 + R * Math.sin(a2)}Z" fill="${i % 2 ? C.blanco : C.negro}"/>`;
      }
      return s;
    })() + escudoEn("18", 150, 100, 110)),
    "19": () => bandera(rect(0, 0, 300, 200, "#7fc7ef") + escudoEn("19", 150, 100, 130)),
  };

  window.Simbolos = {
    bandera: (id) => (BANDERAS[id] ? BANDERAS[id]() : ""),
    escudo: (id) => (ESCUDOS[id] ? ESCUDOS[id]() : ""),
  };
})();
