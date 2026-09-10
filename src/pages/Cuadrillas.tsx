import { useMemo, useState } from "react";
import { BadgeCheck, HardHat, MapPin, Star, Truck } from "lucide-react";
import { useApp, useCatalogos } from "../store/useApp";
import { Encabezado } from "../components/layout/AppShell";
import { Avatar, Barra, Card, CardTitle, cx } from "../components/ui/base";
import { ChipEstado, ChipPrioridad } from "../components/ot/OtBits";
import { PanelOrden } from "../components/ot/PanelOrden";
import { ETIQUETA_TIPO, ESTADOS_ABIERTOS, cumplioSla, duracion } from "../lib/dominio";

const DIA = 86_400_000;

export function Cuadrillas() {
  const ordenes = useApp((s) => s.ordenes);
  const { cuadrillas, tecnico, cliente, sitio } = useCatalogos();
  const [detalle, setDetalle] = useState<string | null>(null);

  const datos = useMemo(() => {
    const ahora = Date.now();
    return cuadrillas.map((c) => {
      const suyas = ordenes.filter((o) => o.cuadrillaId === c.id);
      const delMes = suyas.filter((o) => new Date(o.creadaEn).getTime() >= ahora - 30 * DIA);
      const atendidas = delMes.filter((o) => o.iniciadaEn && o.estado !== "cancelada");
      const califs = suyas.filter((o) => o.calificacion).map((o) => o.calificacion!);
      return {
        cuadrilla: c,
        activas: suyas.filter((o) => ESTADOS_ABIERTOS.includes(o.estado)),
        delMes: delMes.length,
        horas: delMes.reduce((a, o) => a + (o.horasReales ?? 0), 0),
        cumplimiento: atendidas.length
          ? (atendidas.filter((o) => cumplioSla(o)).length / atendidas.length) * 100
          : 0,
        calificacion: califs.length ? califs.reduce((a, b) => a + b, 0) / califs.length : 0,
      };
    });
  }, [cuadrillas, ordenes]);

  return (
    <div className="p-4 lg:p-6">
      <Encabezado
        titulo="Cuadrillas"
        sub="Composición, certificaciones vigentes y carga de trabajo de cada unidad"
      />

      <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
        {datos.map((d) => {
          const c = d.cuadrilla;
          return (
            <Card key={c.id} className="flex flex-col">
              <div className="flex items-start gap-3">
                <span
                  className={cx(
                    "grid size-11 shrink-0 place-items-center rounded-xl",
                    c.disponible ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" : "bg-brand-500/12 text-brand-600 dark:text-brand-400",
                  )}
                >
                  <HardHat size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold tracking-tight text-text">{c.nombre}</p>
                  <p className="text-[11px] text-muted">
                    {c.codigo} · turno {c.turno}
                  </p>
                </div>
                <span
                  className={cx(
                    "rounded-full px-2.5 py-1 text-[10px] font-bold",
                    c.disponible ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-brand-500/15 text-brand-600 dark:text-brand-400",
                  )}
                >
                  {c.disponible ? "Disponible" : "En ejecución"}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
                <span className="flex items-center gap-1"><Truck size={12} /> {c.placaUnidad}</span>
                <span className="flex items-center gap-1"><MapPin size={12} /> {c.base}</span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-raised p-3 text-center">
                <div>
                  <p className="text-lg font-bold leading-none tabular-nums text-text">{d.delMes}</p>
                  <p className="mt-1 text-[10px] text-muted">OT del mes</p>
                </div>
                <div>
                  <p className="text-lg font-bold leading-none tabular-nums text-text">{Math.round(d.horas)}</p>
                  <p className="mt-1 text-[10px] text-muted">horas</p>
                </div>
                <div>
                  <p className="flex items-center justify-center gap-1 text-lg font-bold leading-none tabular-nums text-text">
                    <Star size={13} className="fill-brand-500 text-brand-500" />
                    {d.calificacion.toFixed(1)}
                  </p>
                  <p className="mt-1 text-[10px] text-muted">satisfacción</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-[11px]">
                  <span className="font-medium text-muted">Cumplimiento de SLA</span>
                  <span
                    className={cx(
                      "font-bold tabular-nums",
                      d.cumplimiento >= 90 ? "text-emerald-600 dark:text-emerald-400" : d.cumplimiento >= 80 ? "text-orange-500" : "text-rose-600 dark:text-rose-400",
                    )}
                  >
                    {d.cumplimiento.toFixed(0)} %
                  </span>
                </div>
                <Barra
                  pct={d.cumplimiento / 100}
                  clase={d.cumplimiento >= 90 ? "bg-emerald-500" : d.cumplimiento >= 80 ? "bg-orange-500" : "bg-rose-500"}
                />
              </div>

              <div className="mt-4 space-y-2.5 border-t border-line pt-4">
                {c.tecnicoIds.map((id) => {
                  const t = tecnico(id)!;
                  return (
                    <div key={id} className="flex items-start gap-2.5">
                      <Avatar iniciales={t.avatar} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold text-text">{t.nombre}</p>
                        <p className="flex flex-wrap items-center gap-x-1.5 text-[10px] text-muted">
                          <span className="capitalize">{t.rol}</span>
                          {t.certificaciones.map((cert) => (
                            <span key={cert} className="flex items-center gap-0.5 text-faint">
                              <BadgeCheck size={9} /> {cert}
                            </span>
                          ))}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 border-t border-line pt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
                  Especialidad: {c.especialidad.map((e) => ETIQUETA_TIPO[e]).join(" · ")}
                </p>
                {d.activas.length === 0 ? (
                  <p className="text-[12px] text-muted">Sin órdenes activas asignadas.</p>
                ) : (
                  <ul className="space-y-2">
                    {d.activas.map((o) => (
                      <li key={o.id}>
                        <button
                          onClick={() => setDetalle(o.id)}
                          className="w-full rounded-lg border border-line bg-surface p-2.5 text-left transition-colors hover:border-brand-500/50"
                        >
                          <div className="flex items-center gap-2">
                            <ChipPrioridad prioridad={o.prioridad} />
                            <span className="font-mono text-[10px] text-muted">{o.folio}</span>
                            <span className="ml-auto"><ChipEstado estado={o.estado} /></span>
                          </div>
                          <p className="mt-1.5 truncate text-[12px] font-medium text-text">{o.titulo}</p>
                          <p className="truncate text-[10px] text-muted">
                            {cliente(o.clienteId)?.nombre} · {sitio(o.sitioId)?.canton} · {duracion(o.horasEstimadas)} est.
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-5">
        <CardTitle
          titulo="Cómo se asigna el trabajo"
          sub="Reglas que aplica el despacho antes de enviar una orden"
        />
        <ul className="grid gap-3 text-[13px] leading-relaxed text-muted sm:grid-cols-3">
          <li className="rounded-xl bg-raised p-4">
            <span className="font-semibold text-text">Especialidad.</span> Cada cuadrilla atiende los tipos
            de trabajo para los que su personal está certificado.
          </li>
          <li className="rounded-xl bg-raised p-4">
            <span className="font-semibold text-text">Cercanía.</span> El mapa prioriza la unidad con menor
            tiempo de traslado hacia el sitio del cliente.
          </li>
          <li className="rounded-xl bg-raised p-4">
            <span className="font-semibold text-text">Carga.</span> No se despacha a una cuadrilla que ya
            tenga una emergencia activa, salvo autorización de jefatura.
          </li>
        </ul>
      </Card>

      <PanelOrden otId={detalle} onCerrar={() => setDetalle(null)} />
    </div>
  );
}
