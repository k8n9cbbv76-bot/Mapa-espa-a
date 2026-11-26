#!/usr/bin/env node
/*
 * Genera los ficheros de datos que usa la web:
 *   data/geo.js  → fronteras (TopoJSON) de provincias y comunidades
 *   data/ine.js  → población oficial del INE por provincia y municipio
 *
 * Fuentes:
 *   - scripts/fuentes/es-atlas-provinces.json: paquete npm "es-atlas" (MIT),
 *     generado a partir de las Líneas Límite del Instituto Geográfico Nacional (IGN/CNIG).
 *   - scripts/fuentes/ine/*.json: API del INE, operación 22 (Padrón municipal),
 *     descargada con scripts/descargar-ine.sh
 *
 * Uso: node scripts/build-data.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const FUENTES = path.join(__dirname, "fuentes");

// ---------- 1. Geometrías ----------
const topo = JSON.parse(fs.readFileSync(path.join(FUENTES, "es-atlas-provinces.json"), "utf8"));
// Quitamos Gibraltar (territorio no español que el IGN incluye como "no asociado").
topo.objects.provinces.geometries = topo.objects.provinces.geometries.filter((g) => g.id !== "54");
topo.objects.autonomous_regions.geometries = topo.objects.autonomous_regions.geometries.filter((g) => g.id !== "20");
delete topo.objects.border;
fs.writeFileSync(
  path.join(ROOT, "data", "geo.js"),
  "/* Fronteras: IGN (Líneas Límite) vía es-atlas (MIT). Generado por scripts/build-data.js */\n" +
    "window.ES_TOPO = " + JSON.stringify(topo) + ";\n"
);

// ---------- 2. Población INE ----------
// Nombre de provincia en el INE → código INE de provincia
const PROV_INE = {
  "Araba/Álava": "01", Albacete: "02", "Alicante/Alacant": "03", Almería: "04", Ávila: "05",
  Badajoz: "06", "Balears, Illes": "07", Barcelona: "08", Burgos: "09", Cáceres: "10",
  Cádiz: "11", "Castellón/Castelló": "12", "Ciudad Real": "13", Córdoba: "14", "Coruña, A": "15",
  Cuenca: "16", Girona: "17", Granada: "18", Guadalajara: "19", Gipuzkoa: "20", Huelva: "21",
  Huesca: "22", Jaén: "23", León: "24", Lleida: "25", "Rioja, La": "26", Lugo: "27", Madrid: "28",
  Málaga: "29", Murcia: "30", Navarra: "31", Ourense: "32", Asturias: "33", Palencia: "34",
  "Palmas, Las": "35", Pontevedra: "36", Salamanca: "37", "Santa Cruz de Tenerife": "38",
  Cantabria: "39", Segovia: "40", Sevilla: "41", Soria: "42", Tarragona: "43", Teruel: "44",
  Toledo: "45", "Valencia/València": "46", Valladolid: "47", Bizkaia: "48", Zamora: "49",
  Zaragoza: "50", Ceuta: "51", Melilla: "52",
};
// Nombre (tal como aparece en el INE) de la capital de cada provincia
const CAPITAL_INE = {
  "01": "Vitoria-Gasteiz", "02": "Albacete", "03": "Alacant/Alicante", "04": "Almería", "05": "Ávila",
  "06": "Badajoz", "07": "Palma", "08": "Barcelona", "09": "Burgos", "10": "Cáceres", "11": "Cádiz",
  "12": "Castelló de la Plana/Castellón de la Plana", "13": "Ciudad Real", "14": "Córdoba",
  "15": "Coruña, A", "16": "Cuenca", "17": "Girona", "18": "Granada", "19": "Guadalajara",
  "20": "Donostia/San Sebastián", "21": "Huelva", "22": "Huesca", "23": "Jaén", "24": "León",
  "25": "Lleida", "26": "Logroño", "27": "Lugo", "28": "Madrid", "29": "Málaga", "30": "Murcia",
  "31": "Pamplona/Iruña", "32": "Ourense", "33": "Oviedo", "34": "Palencia",
  "35": "Palmas de Gran Canaria, Las", "36": "Pontevedra", "37": "Salamanca",
  "38": "Santa Cruz de Tenerife", "39": "Santander", "40": "Segovia", "41": "Sevilla", "42": "Soria",
  "43": "Tarragona", "44": "Teruel", "45": "Toledo", "46": "València", "47": "Valladolid",
  "48": "Bilbao", "49": "Zamora", "50": "Zaragoza", "51": "Ceuta", "52": "Melilla",
};

// "Ejido, El" → "El Ejido";  "Hospitalet de Llobregat, L'" → "L'Hospitalet de Llobregat"
function nombreBonito(n) {
  return n
    .split("/")
    .map((parte) => {
      const m = parte.match(/^(.*), (El|La|Los|Las|L'|A|O|Os|As|Les|Els|Es|Sa|Ses|S'|Lo|el|la|les|els|l')$/);
      if (!m) return parte;
      const art = m[2][0].toUpperCase() + m[2].slice(1);
      return art.endsWith("'") ? art + m[1] : art + " " + m[1];
    })
    .join("/");
}

const dirIne = path.join(FUENTES, "ine");
const provincias = {};
let anyo = null;
for (const f of fs.readdirSync(dirIne)) {
  if (!/^\d+\.json$/.test(f)) continue;
  const series = JSON.parse(fs.readFileSync(path.join(dirIne, f), "utf8"));
  const totales = series
    .filter((s) => /\. Total\. Total habitantes/.test(s.Nombre) && s.Data && s.Data.length)
    .map((s) => ({ nombre: s.Nombre.split(". Total.")[0].trim(), valor: s.Data[0].Valor, anyo: s.Data[0].Anyo }));
  // La fila de la provincia es la de mayor población cuyo nombre es una provincia
  const prov = totales.filter((t) => PROV_INE[t.nombre]).sort((a, b) => b.valor - a.valor)[0];
  const code = prov && PROV_INE[prov.nombre];
  if (!code) throw new Error("No encuentro la fila de provincia en " + f);
  anyo = prov.anyo;
  const municipios = totales.filter((t) => t !== prov).sort((a, b) => b.valor - a.valor);
  const cap = municipios.find((m) => m.nombre === CAPITAL_INE[code]);
  if (!cap) throw new Error("No encuentro la capital de " + prov.nombre);
  provincias[code] = {
    nombreIne: prov.nombre,
    poblacion: prov.valor,
    numMunicipios: municipios.length,
    poblacionCapital: cap.valor,
    principales: municipios.slice(0, 6).map((m) => [nombreBonito(m.nombre), m.valor]),
  };
}
const faltan = Object.values(PROV_INE).filter((c) => !provincias[c]);
if (faltan.length) throw new Error("Faltan provincias: " + faltan.join(","));

const total = Object.values(provincias).reduce((s, p) => s + p.poblacion, 0);
const out = {
  fuente: "INE. Cifras oficiales de población resultantes de la revisión del Padrón municipal",
  fecha: "1 de enero de " + anyo,
  anyo,
  totalEspana: total,
  provincias,
};
fs.writeFileSync(
  path.join(ROOT, "data", "ine.js"),
  "/* Datos oficiales del INE (Padrón municipal, 1 de enero de " + anyo + "). Generado por scripts/build-data.js */\n" +
    "window.INE = " + JSON.stringify(out, null, 1) + ";\n"
);
console.log("OK: " + Object.keys(provincias).length + " provincias, España = " + total.toLocaleString("es-ES") + " hab. (" + anyo + ")");
