# 🇪🇸 Mapa de España interactivo

Web educativa para estudiantes sobre las **17 comunidades autónomas**, las **2 ciudades autónomas** (Ceuta y Melilla) y las **50 provincias** de España.

## Cómo abrirla

**Opción 1 – Doble clic (la más sencilla).**
Descarga o clona el proyecto y abre `index.html` con Chrome, Firefox, Edge o Safari.
Funciona sin internet: D3, los mapas y los datos están incluidos en el proyecto (solo la tipografía se descarga de Google Fonts si hay conexión).

**Opción 2 – Servidor local** (recomendado si vas a modificar el código):

```bash
cd Mapa-espa-a
python3 -m http.server 8000      # o: npx serve
```

y visita <http://localhost:8000>.

**Opción 3 – Publicarla gratis** con GitHub Pages: en el repositorio, *Settings → Pages → Deploy from a branch* y elige la rama. No necesita compilación.

## Qué incluye

| Sección | Qué se puede hacer |
|---|---|
| 🧭 **Explorar** | Mapa con las fronteras reales. Al pasar el ratón se resalta la comunidad; al hacer clic se hace zoom y aparecen sus provincias. Canarias, Ceuta y Melilla van en recuadros. Ficha de cada comunidad (capital, provincias, población, superficie, densidad, lenguas, Estatuto, bandera y escudo en SVG, gastronomía, fiestas, Patrimonio de la Humanidad y 3 curiosidades) y de cada provincia (capital, población, municipios más poblados y un dato curioso). |
| 🎨 **Colorear** | Mapa de coropletas por población, superficie, densidad o lengua cooficial, por comunidades o por provincias, con leyenda y ranking. |
| ⚖️ **Comparar** | Elige dos comunidades (en las listas o en el mapa) y compara 7 indicadores con barras. |
| 🎮 **Jugar** | 5 niveles: comunidades, capitales autonómicas, provincias, capitales de provincia y grandes ciudades. Cronómetro, puntos (100 por acierto + bonus por rapidez) y récord guardado en el navegador. |

También: modo oscuro (automático o con el botón ☀/☾), diseño adaptado a móvil (zoom con pellizco), animaciones suaves que se desactivan si el sistema pide «reducir movimiento», y navegación con teclado.

## Fuentes de los datos

- **Población**: INE, *Cifras oficiales de población resultantes de la revisión del Padrón municipal*, a **1 de enero de 2025** (operación 22 del INE, una tabla por provincia con todos sus municipios). Se descargan de la API oficial `servicios.ine.es/wstempus`.
- **Superficie**: IGN / INE (Anuario Estadístico de España).
- **Fronteras**: Instituto Geográfico Nacional (IGN-CNIG), *Líneas límite municipales*, a través del paquete [`es-atlas`](https://github.com/martgnz/es-atlas) (licencia MIT).
- **Patrimonio de la Humanidad**: lista de la UNESCO. **Estatutos**: BOE.
- Las banderas y los escudos son **dibujos simplificados** hechos a mano en SVG con fines educativos.

### Actualizar los datos del INE

```bash
bash scripts/descargar-ine.sh   # descarga las 52 tablas provinciales del INE
node scripts/build-data.js      # regenera data/ine.js y data/geo.js
```

## Estructura del proyecto

```
index.html              Página principal
css/styles.css          Estilos (tema claro/oscuro, móvil)
js/
  vendor/               D3 v7.9 y topojson-client (copiados para funcionar sin conexión)
  datos.js              Une los datos del INE con las fichas y calcula densidades, totales...
  mapa.js               Mapa D3: proyecciones, recuadros, zoom, resaltado, etiquetas
  simbolos.js           Banderas y escudos en SVG
  fichas.js             Fichas de comunidad y provincia
  colores.js            Mapa de colores (coropletas) y leyendas
  comparador.js         Comparador con gráficos de barras
  juego.js              Niveles, cronómetro, puntuación y récords
  app.js                Pestañas, estado y conexión mapa ↔ panel
data/
  geo.js                Fronteras (TopoJSON) — generado
  ine.js                Población del INE por provincia y municipio — generado
  comunidades.js        Contenido de cada comunidad (lenguas, Estatuto, gastronomía...)
  provincias.js         Capital, superficie y dato curioso de cada provincia
scripts/                Descarga y generación de datos
tests/prueba.js         Prueba automática con Playwright (escritorio y móvil)
```

## Pruebas

Con [Playwright](https://playwright.dev) instalado:

```bash
node tests/prueba.js
```

Recorre las cuatro secciones en escritorio y en móvil, juega una partida completa, comprueba el récord y guarda capturas en `tests/capturas/`.
