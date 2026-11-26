// Prueba automática con Playwright: abre la web, recorre las pestañas y hace capturas.
// Uso: node tests/prueba.js   (necesita Playwright con Chromium)
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const url = "file://" + path.join(__dirname, "..", "index.html");
const out = path.join(__dirname, "capturas");
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const errores = [];
  const ok = (cond, msg) => {
    if (!cond) { errores.push(msg); console.log("  ✗ " + msg); } else console.log("  ✓ " + msg);
  };

  const dispositivos = [
    ["escritorio", { viewport: { width: 1400, height: 900 } }],
    ["movil", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
  ];
  for (const [nombre, opts] of dispositivos) {
    console.log("== " + nombre);
    const page = await browser.newPage(opts);
    page.on("pageerror", (e) => errores.push("JS: " + e.message));
    page.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.text())) errores.push("console: " + m.text()); });
    await page.goto(url);
    await page.waitForSelector(".prov");
    ok((await page.$$(".prov")).length === 52, "52 provincias dibujadas (50 + Ceuta y Melilla)");
    ok((await page.$$(".ccaa")).length === 19, "19 comunidades y ciudades autónomas");
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}/${nombre}-1-inicio.png` });

    // Andalucía desde la lista del panel
    await page.click('.rejilla-ccaa button[data-ccaa="01"]');
    await page.waitForTimeout(1100);
    ok(await page.isVisible("text=Patrimonio de la Humanidad"), "Ficha de Andalucía visible");
    ok((await page.$$(".etiquetas text")).length === 8, "8 provincias etiquetadas en Andalucía");
    await page.screenshot({ path: `${out}/${nombre}-2-andalucia.png` });
    await page.click('.lista-prov button[data-prov="23"]');
    await page.waitForTimeout(600);
    ok(await page.isVisible("text=Municipios más poblados"), "Ficha de la provincia de Jaén visible");
    await page.screenshot({ path: `${out}/${nombre}-3-jaen.png`, fullPage: nombre === "movil" });

    // Clic directo en el mapa: Canarias (recuadro)
    await page.click("#zoom-reset");
    await page.waitForTimeout(900);
    await page.evaluate(() => document.querySelector('.prov[data-id="38"]').dispatchEvent(new MouseEvent("click", { bubbles: true })));
    await page.waitForTimeout(1100);
    ok((await page.textContent("#panel-contenido")).includes("Teide"), "Clic en el recuadro de Canarias abre su ficha");
    await page.screenshot({ path: `${out}/${nombre}-3b-canarias.png` });

    // Colorear
    await page.click('button[data-tab="colorear"]');
    await page.click('button[data-var="densidad"]');
    await page.click('button[data-nivel="prov"]');
    await page.waitForTimeout(700);
    ok(!(await page.isHidden("#leyenda")), "Leyenda visible en el mapa de colores");
    await page.screenshot({ path: `${out}/${nombre}-4-densidad.png` });
    await page.click('button[data-var="lengua"]');
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${out}/${nombre}-5-lenguas.png` });

    // Comparar
    await page.click('button[data-tab="comparar"]');
    await page.selectOption("#comp-b", "13");
    await page.waitForTimeout(900);
    ok((await page.$$(".metrica")).length === 7, "Comparador con 7 métricas");
    await page.screenshot({ path: `${out}/${nombre}-6-comparar.png`, fullPage: nombre === "movil" });

    // Juego: responde siempre bien para comprobar puntuación y récord
    await page.click('button[data-tab="jugar"]');
    await page.click('.nivel[data-nivel="comunidades"]');
    for (let i = 0; i < 10; i++) {
      const texto = await page.textContent(".hud .pregunta em");
      const pid = await page.evaluate((t) => Object.values(DATA.ccaa).find((c) => c.nombreCorto === t).provincias[0], texto);
      if (i === 0) await page.screenshot({ path: `${out}/${nombre}-7-juego.png` });
      await page.evaluate((p) => document.querySelector(`.prov[data-id="${p}"]`).dispatchEvent(new MouseEvent("click", { bubbles: true })), pid);
      await page.waitForTimeout(1000);
    }
    await page.waitForTimeout(500);
    ok(await page.isVisible("text=¡Nuevo récord!"), "Fin de partida con nuevo récord");
    ok((await page.textContent(".resultado-grande")).trim().startsWith("1."), "Puntuación ≥ 1.000 con 10 aciertos");
    await page.screenshot({ path: `${out}/${nombre}-8-final.png` });
    await page.click('button[data-accion="niveles"]');
    ok(!(await page.textContent('.nivel[data-nivel="comunidades"] .record')).includes("—"), "Récord guardado y mostrado");

    // Un fallo a propósito en el nivel de provincias
    await page.click('.nivel[data-nivel="provincias"]');
    const em = await page.textContent(".hud .pregunta em");
    const mal = await page.evaluate((t) => Object.values(DATA.provincias).find((p) => p.nombre !== t).id, em);
    await page.evaluate((p) => document.querySelector(`.prov[data-id="${p}"]`).dispatchEvent(new MouseEvent("click", { bubbles: true })), mal);
    await page.waitForTimeout(200);
    ok((await page.textContent(".hud .feedback")).includes("respuesta era"), "Un fallo muestra la solución");
    ok((await page.$$(".prov.solucion")).length === 1, "La provincia correcta se resalta");
    await page.screenshot({ path: `${out}/${nombre}-8b-fallo.png` });

    // Modo oscuro
    await page.click("#btn-tema");
    await page.click('button[data-tab="explorar"]');
    await page.click('.rejilla-ccaa button[data-ccaa="09"]');
    await page.waitForTimeout(1100);
    await page.screenshot({ path: `${out}/${nombre}-9-oscuro.png` });
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "Sin desplazamiento horizontal");
    await page.close();
  }
  await browser.close();
  if (errores.length) { console.log("\nERRORES:\n" + errores.join("\n")); process.exit(1); }
  console.log("\nTodo correcto ✔");
})();
