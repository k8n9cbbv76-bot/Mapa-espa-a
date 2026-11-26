#!/usr/bin/env bash
# Descarga del INE (API JSON "Tempus3") las cifras oficiales del Padrón municipal
# (operación 22, "Cifras Oficiales de Población de los Municipios Españoles"),
# una tabla por provincia, último año disponible.
# Uso:  bash scripts/descargar-ine.sh   →  luego  node scripts/build-data.js
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p fuentes/ine
API="https://servicios.ine.es/wstempus/js/ES"
curl -sf "$API/TABLAS_OPERACION/22" -o fuentes/ine/tablas.json
ids=$(node -e 'const t=require("./fuentes/ine/tablas.json");console.log(t.filter(x=>/Población por municipios y sexo/.test(x.Nombre)).map(x=>x.Id).join(" "))')
for id in $ids; do
  curl -sf "$API/DATOS_TABLA/$id?nult=1" -o "fuentes/ine/$id.json" &
done
wait
echo "Descargadas $(ls fuentes/ine | wc -l) tablas en scripts/fuentes/ine/"
