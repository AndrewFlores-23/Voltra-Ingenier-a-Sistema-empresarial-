import { useEffect, useRef } from "react";
import { Map as MapaGL, Marker, NavigationControl, Popup, type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { OrdenTrabajo } from "../../data/types";
import { useApp, useCatalogos } from "../../store/useApp";
import { COLOR_PRIORIDAD, ETIQUETA_ESTADO, HEX_ESTADO, evaluarSla } from "../../lib/dominio";

/**
 * Basemap raster de CARTO. Se define en línea (en vez de apuntar a un style.json
 * vectorial) para que el mapa funcione sin llave de API y sin depender del CDN
 * de tiles vectoriales, que no siempre está disponible tras un proxy corporativo.
 */
/**
 * Basemap de OpenStreetMap: libre, sin llave de API y sin cuota que administrar.
 * El modo oscuro se resuelve invirtiendo el lienzo por CSS (ver index.css), de
 * modo que los marcadores —que son elementos del DOM— conservan su color.
 */
const ESTILO_OSM: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

/** Pin de orden de trabajo: gota con el color del estado y anillo de alerta si el SLA está vencido */
function pinOrden(ot: OrdenTrabajo, vencido: boolean, seleccionado: boolean) {
  const el = document.createElement("button");
  el.type = "button";
  el.setAttribute("aria-label", `Orden ${ot.folio}`);
  el.style.cssText = "background:none;border:0;padding:0;cursor:pointer;transform-origin:bottom center;";
  el.innerHTML = `
    <span style="position:relative;display:block;width:26px;height:34px;transition:transform .15s;transform:scale(${seleccionado ? 1.25 : 1})">
      ${vencido ? `<span style="position:absolute;left:-5px;top:-1px;width:36px;height:36px;border-radius:50%;background:${HEX_ESTADO.nueva}33;animation:voltra-pulse 1.8s ease-in-out infinite"></span>` : ""}
      <svg width="26" height="34" viewBox="0 0 26 34" fill="none" style="position:relative;filter:drop-shadow(0 3px 5px rgba(2,6,23,.35))">
        <path d="M13 33.5C13 33.5 25 21.4 25 13A12 12 0 1 0 1 13c0 8.4 12 20.5 12 20.5Z"
              fill="${HEX_ESTADO[ot.estado]}" stroke="white" stroke-width="2"/>
        <text x="13" y="17" text-anchor="middle" fill="white" font-size="10"
              font-weight="700" font-family="system-ui,sans-serif">${ot.prioridad}</text>
      </svg>
    </span>`;
  return el;
}

/** Marcador de cuadrilla: cuadro con el código de la unidad */
function pinCuadrilla(codigo: string, disponible: boolean) {
  const el = document.createElement("div");
  el.style.cssText = `
    display:flex;align-items:center;gap:4px;padding:3px 7px;border-radius:8px;
    background:${disponible ? "#0f172a" : "#475569"};color:${disponible ? "#fcd34d" : "#cbd5e1"};
    font:700 10px/1 system-ui,sans-serif;letter-spacing:.02em;white-space:nowrap;
    box-shadow:0 3px 8px rgba(2,6,23,.35);border:1.5px solid rgba(255,255,255,.85);`;
  el.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/>
      <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/><circle cx="7.5" cy="17.5" r="2.5"/>
      <circle cx="17.5" cy="17.5" r="2.5"/></svg>${codigo}`;
  return el;
}

export function MapaOperacion({
  ordenes, seleccionada, onSeleccionar, mostrarCuadrillas = true, className = "",
}: {
  ordenes: OrdenTrabajo[];
  seleccionada?: string | null;
  onSeleccionar?: (id: string) => void;
  mostrarCuadrillas?: boolean;
  className?: string;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaGL | null>(null);
  const marcadores = useRef<Marker[]>([]);
  const tema = useApp((s) => s.tema);
  const { sitio, cliente, cuadrillas } = useCatalogos();

  // Crear el mapa una sola vez
  useEffect(() => {
    if (!contenedor.current || mapa.current) return;
    const instancia = new MapaGL({
      container: contenedor.current,
      style: ESTILO_OSM,
      center: [-84.09, 9.94],
      zoom: 10.2,
      attributionControl: { compact: true },
    });
    instancia.addControl(new NavigationControl({ showCompass: false }), "top-right");
    mapa.current = instancia;
    return () => {
      mapa.current?.remove();
      mapa.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redibujar marcadores cuando cambian las órdenes o la selección
  useEffect(() => {
    const m = mapa.current;
    if (!m) return;

    marcadores.current.forEach((mk) => mk.remove());
    marcadores.current = [];

    for (const ot of ordenes) {
      const s = sitio(ot.sitioId);
      if (!s) continue;
      const sla = evaluarSla(ot);
      const el = pinOrden(ot, sla.semaforo === "vencido" && !ot.iniciadaEn, seleccionada === ot.id);
      el.onclick = () => onSeleccionar?.(ot.id);

      const cli = cliente(ot.clienteId);
      const popup = new Popup({ offset: 30, closeButton: false }).setHTML(`
        <div style="font:400 12px/1.45 system-ui,sans-serif;padding:10px 12px;background:var(--c-surface);color:var(--c-text);min-width:180px">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            <span style="background:${HEX_ESTADO[ot.estado]};color:#fff;font-weight:700;font-size:9px;padding:2px 5px;border-radius:4px">${ot.prioridad}</span>
            <span style="font-family:ui-monospace,monospace;font-size:10px;color:var(--c-muted)">${ot.folio}</span>
          </div>
          <strong style="display:block;font-size:12.5px;margin-bottom:2px">${ot.titulo}</strong>
          <span style="color:var(--c-muted)">${cli?.nombre ?? ""}</span><br/>
          <span style="color:var(--c-muted)">${s.nombre}, ${s.canton}</span>
          <div style="margin-top:6px;font-weight:600;color:${HEX_ESTADO[ot.estado]}">${ETIQUETA_ESTADO[ot.estado]} · ${sla.etiqueta}</div>
        </div>`);

      marcadores.current.push(
        new Marker({ element: el, anchor: "bottom" })
          .setLngLat([s.lng, s.lat])
          .setPopup(popup)
          .addTo(m),
      );
    }

    if (mostrarCuadrillas) {
      for (const c of cuadrillas) {
        const el = pinCuadrilla(c.codigo, c.disponible);
        const popup = new Popup({ offset: 16, closeButton: false }).setHTML(`
          <div style="font:400 12px/1.45 system-ui,sans-serif;padding:10px 12px;background:var(--c-surface);color:var(--c-text)">
            <strong>${c.nombre}</strong><br/>
            <span style="color:var(--c-muted)">Unidad ${c.placaUnidad} · turno ${c.turno}</span><br/>
            <span style="color:${c.disponible ? "#16a34a" : "#f59e0b"};font-weight:600">
              ${c.disponible ? "Disponible" : "En ejecución"}
            </span>
          </div>`);
        marcadores.current.push(
          new Marker({ element: el, anchor: "center" }).setLngLat([c.lng, c.lat]).setPopup(popup).addTo(m),
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordenes, seleccionada, cuadrillas, mostrarCuadrillas, tema]);

  // Centrar el mapa en la orden seleccionada
  useEffect(() => {
    if (!seleccionada || !mapa.current) return;
    const ot = ordenes.find((o) => o.id === seleccionada);
    const s = ot && sitio(ot.sitioId);
    if (s) mapa.current.easeTo({ center: [s.lng, s.lat], zoom: Math.max(mapa.current.getZoom(), 12), duration: 600 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccionada]);

  return <div ref={contenedor} data-tema={tema} className={`mapa-voltra ${className}`} />;
}

export const LEYENDA_PRIORIDAD = COLOR_PRIORIDAD;
