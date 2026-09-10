import { useMemo, useState } from "react";
import { AlertTriangle, HardHat, Inbox, Plus, RadioTower, Timer, Truck } from "lucide-react";
import { useApp, useCatalogos } from "../store/useApp";
import { Encabezado } from "../components/layout/AppShell";
import { Avatar, Boton, Card, CardTitle, Vacio, cx } from "../components/ui/base";
import { TarjetaOT } from "../components/ot/OtBits";
import { PanelOrden } from "../components/ot/PanelOrden";
import { MapaOperacion } from "../components/mapa/MapaOperacion";
import { ModalNuevaOrden } from "./NuevaOrden";
import { ESTADOS_ABIERTOS, evaluarSla } from "../lib/dominio";

type Filtro = "todas" | "sin_asignar" | "en_curso" | "riesgo";

const FILTROS: { id: Filtro; texto: string }[] = [
  { id: "todas", texto: "Todas" },
  { id: "sin_asignar", texto: "Sin asignar" },
  { id: "en_curso", texto: "En curso" },
  { id: "riesgo", texto: "SLA en riesgo" },
];

export function Despacho() {
  const ordenes = useApp((s) => s.ordenes);
  const asignar = useApp((s) => s.asignar);
  const { cuadrillas, tecnico } = useCatalogos();
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const [zonaActiva, setZonaActiva] = useState<string | null>(null);

  const abiertas = useMemo(
    () => ordenes.filter((o) => ESTADOS_ABIERTOS.includes(o.estado)),
    [ordenes],
  );

  const visibles = useMemo(() => {
    const orden = { P1: 0, P2: 1, P3: 2, P4: 3 };
    return abiertas
      .filter((o) => {
        const sla = evaluarSla(o);
        if (filtro === "sin_asignar") return !o.cuadrillaId;
        if (filtro === "en_curso") return o.estado === "en_ruta" || o.estado === "en_sitio";
        if (filtro === "riesgo") return sla.semaforo !== "ok";
        return true;
      })
      .sort((a, b) => {
        const sa = evaluarSla(a).semaforo === "vencido" ? 0 : 1;
        const sb = evaluarSla(b).semaforo === "vencido" ? 0 : 1;
        return sa - sb || orden[a.prioridad] - orden[b.prioridad] || +new Date(a.creadaEn) - +new Date(b.creadaEn);
      });
  }, [abiertas, filtro]);

  const conteos = useMemo(() => {
    const semaforos = abiertas.map((o) => evaluarSla(o).semaforo);
    return {
      sinAsignar: abiertas.filter((o) => !o.cuadrillaId).length,
      enCurso: abiertas.filter((o) => o.estado === "en_ruta" || o.estado === "en_sitio").length,
      riesgo: semaforos.filter((s) => s === "riesgo").length,
      vencidas: semaforos.filter((s) => s === "vencido").length,
    };
  }, [abiertas]);

  const soltarEnCuadrilla = (cuadrillaId: string, e: React.DragEvent) => {
    e.preventDefault();
    const otId = e.dataTransfer.getData("text/plain");
    setZonaActiva(null);
    if (otId) asignar(otId, cuadrillaId);
  };

  return (
    <div className="p-4 lg:p-6">
      <Encabezado
        titulo="Despacho en vivo"
        sub="Cola priorizada, ubicación de cuadrillas y control de SLA en tiempo real"
        acciones={
          <Boton variante="primario" onClick={() => setCreando(true)}>
            <Plus size={16} /> Nueva orden
          </Boton>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Pulso icono={<Inbox size={15} />} etiqueta="Sin asignar" valor={conteos.sinAsignar} tono="alerta" />
        <Pulso icono={<Truck size={15} />} etiqueta="En ejecución" valor={conteos.enCurso} tono="marca" />
        <Pulso icono={<Timer size={15} />} etiqueta="SLA en riesgo" valor={conteos.riesgo} tono="aviso" />
        <Pulso icono={<AlertTriangle size={15} />} etiqueta="SLA vencido" valor={conteos.vencidas} tono="alerta" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        {/* Cola de despacho */}
        <div className="flex min-h-0 flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id)}
                className={cx(
                  "rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition-colors",
                  filtro === f.id
                    ? "bg-ink-900 text-white ring-ink-900 dark:bg-brand-500 dark:text-ink-950 dark:ring-brand-500"
                    : "bg-surface text-muted ring-line hover:text-text",
                )}
              >
                {f.texto}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between px-1 text-[11px] text-faint">
            <span>{visibles.length} orden(es)</span>
            <span className="hidden xl:inline">Arrastre una tarjeta hacia una cuadrilla</span>
          </div>

          <div className="max-h-[38rem] space-y-2.5 overflow-y-auto pr-1">
            {visibles.length === 0 ? (
              <Card>
                <Vacio icono={<RadioTower size={20} />} titulo="Sin órdenes en este filtro" texto="La cola de despacho está al día." />
              </Card>
            ) : (
              visibles.map((ot) => (
                <TarjetaOT
                  key={ot.id}
                  ot={ot}
                  arrastrable
                  activa={seleccionada === ot.id}
                  onClick={() => { setSeleccionada(ot.id); setDetalle(ot.id); }}
                />
              ))
            )}
          </div>
        </div>

        {/* Mapa y cuadrillas */}
        <div className="space-y-5">
          <Card padding={false} className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
              <div>
                <h2 className="text-[15px] font-semibold tracking-tight text-text">Mapa de operación · Gran Área Metropolitana</h2>
                <p className="mt-0.5 text-xs text-muted">Órdenes abiertas y posición de las unidades</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted">
                {[["#f43f5e", "Sin asignar"], ["#0ea5e9", "Asignada"], ["#6366f1", "En ruta"], ["#f59e0b", "En sitio"]].map(([c, t]) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full" style={{ background: c }} /> {t}
                  </span>
                ))}
              </div>
            </div>
            <MapaOperacion
              ordenes={abiertas}
              seleccionada={seleccionada}
              onSeleccionar={(id) => { setSeleccionada(id); setDetalle(id); }}
              className="h-[26rem] w-full"
            />
          </Card>

          <Card>
            <CardTitle
              titulo="Cuadrillas en turno"
              sub="Suelte una orden sobre la cuadrilla para despacharla"
              accion={<span className="text-xs text-muted">{cuadrillas.filter((c) => c.disponible).length} disponibles</span>}
            />
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {cuadrillas.map((c) => {
                const carga = abiertas.filter((o) => o.cuadrillaId === c.id);
                return (
                  <div
                    key={c.id}
                    onDragOver={(e) => { e.preventDefault(); setZonaActiva(c.id); }}
                    onDragLeave={() => setZonaActiva((z) => (z === c.id ? null : z))}
                    onDrop={(e) => soltarEnCuadrilla(c.id, e)}
                    className={cx(
                      "rounded-xl border-2 border-dashed p-3.5 transition-all",
                      zonaActiva === c.id
                        ? "border-brand-500 bg-brand-500/8 scale-[1.02]"
                        : c.disponible
                          ? "border-line bg-surface"
                          : "border-line bg-raised",
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cx(
                          "grid size-9 shrink-0 place-items-center rounded-xl",
                          c.disponible ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" : "bg-brand-500/12 text-brand-600 dark:text-brand-400",
                        )}
                      >
                        <HardHat size={17} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-text">{c.nombre}</p>
                        <p className="text-[11px] text-muted">
                          {c.codigo} · {c.base}
                        </p>
                      </div>
                      <span
                        className={cx(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold",
                          c.disponible ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-brand-500/15 text-brand-600 dark:text-brand-400",
                        )}
                      >
                        {c.disponible ? "Libre" : "Ocupada"}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-1.5">
                      {c.tecnicoIds.map((id) => {
                        const t = tecnico(id);
                        return t ? <Avatar key={id} iniciales={t.avatar} size="sm" /> : null;
                      })}
                      <span className="ml-auto text-[11px] font-medium text-muted">
                        {carga.length} OT activa(s)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <PanelOrden otId={detalle} onCerrar={() => setDetalle(null)} />
      <ModalNuevaOrden abierto={creando} onCerrar={() => setCreando(false)} />
    </div>
  );
}

function Pulso({
  icono, etiqueta, valor, tono,
}: { icono: React.ReactNode; etiqueta: string; valor: number; tono: "alerta" | "marca" | "aviso" }) {
  const tonos = {
    alerta: "bg-rose-500/12 text-rose-600 dark:text-rose-400",
    marca: "bg-brand-500/12 text-brand-600 dark:text-brand-400",
    aviso: "bg-orange-500/12 text-orange-600 dark:text-orange-400",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
      <span className={cx("grid size-9 shrink-0 place-items-center rounded-lg", tonos[tono])}>{icono}</span>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none tabular-nums text-text">{valor}</p>
        <p className="mt-1 truncate text-[11px] font-medium text-muted">{etiqueta}</p>
      </div>
    </div>
  );
}
