#!/usr/bin/env node
/*
 * Genera "mapa-espana.html": la web entera en UN SOLO archivo (CSS, librerías, datos y código dentro).
 * Así se puede abrir con doble clic aunque se copie suelto, se envíe por correo o se abra desde un ZIP.
 * Uso: node scripts/build-standalone.js
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const leer = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

let html = leer("index.html");

html = html.replace(/<link rel="stylesheet" href="css\/styles\.css">/, () => `<style>\n${leer("css/styles.css")}\n</style>`);

html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, src) => {
  // "</script" dentro del código cerraría la etiqueta antes de tiempo
  const codigo = leer(src).replace(/<\/script/gi, "<\\/script");
  return `<script>/* ${src} */\n${codigo}\n</script>`;
});

const destino = path.join(ROOT, "mapa-espana.html");
fs.writeFileSync(destino, html);
console.log(`OK: ${path.basename(destino)} (${(fs.statSync(destino).size / 1024).toFixed(0)} KB)`);
