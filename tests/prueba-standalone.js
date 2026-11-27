// Comprueba que mapa-espana.html funciona copiado SOLO en una carpeta vacía (sin css/, js/ ni data/).
// Uso: node tests/prueba-standalone.js
const { chromium } = require("playwright");
const fs = require("fs");
const os = require("os");
const path = require("path");

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mapa-solo-"));
  const archivo = path.join(dir, "mapa-espana.html");
  fs.copyFileSync(path.join(__dirname, "..", "mapa-espana.html"), archivo);

  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1300, height: 850 } });
  const errores = [];
  p.on("pageerror", (x) => errores.push(x.message));
  await p.goto("file://" + archivo);
  await p.waitForSelector(".prov");
  const n = (await p.$$(".prov")).length;
  await p.click('.rejilla-ccaa button[data-ccaa="12"]');
  await p.waitForTimeout(1000);
  const ficha = await p.textContent("#panel-contenido h2");
  await p.click("button[data-tab=jugar]");
  await p.click(".nivel[data-nivel=provincias]");
  const pregunta = await p.textContent(".hud .pregunta");
  await b.close();

  console.log({ provincias: n, ficha, pregunta, errores });
  if (n !== 52 || ficha !== "Galicia" || errores.length) process.exit(1);
  console.log("Archivo único correcto ✔");
})();
