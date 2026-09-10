import { MapPin, Timer } from "lucide-react";
import type { OrdenTrabajo } from "../../data/types";
import {
  BARRA_SEMAFORO, COLOR_ESTADO, COLOR_PRIORIDAD, COLOR_SEMAFORO, ETIQUETA_ESTADO,
  ETIQUETA_TIPO, HEX_TIPO, evaluarSla, relativo,
} from "../../lib/dominio";
import { Barra, Chip, cx } from "../ui/base";
import { useCatalogos } from "../../store/useApp";

export function ChipEstado({ estado }: { estado: OrdenTrabajo["estado"] }) {
  return (
    <Chip tono="custom" className={COLOR_ESTADO[estado]}>
      {(estado === "en_ruta" || estado === "en_sitio") && (
        <span className="animate-blip size-1.5 rounded-full bg-current" />
      )}
      {ETIQUETA_ESTADO[estado]}
    </Chip>
  );
}

export function ChipPrioridad({ prioridad }: { prioridad: OrdenTrabajo["prioridad"] }) {
  return (
    <span className={cx("rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide", COLOR_PRIORIDAD[prioridad])}>
      {prioridad}
    </span>
  );
}

export function ChipTipo({ tipo }: { tipo: OrdenTrabajo["tipo"] }) {
  return (
    <Chip tono="custom" className="bg-raised text-muted ring-line">
      <span className="size-1.5 rounded-full" style={{ background: HEX_TIPO[tipo] }} />
      {ETIQUETA_TIPO[tipo]}
    </Chip>
  );
}

/** Reloj de SLA con barra y etiqueta */
export function MedidorSla({ ot, compacto }: { ot: OrdenTrabajo; compacto?: boolean }) {
  const sla = evaluarSla(ot);
  if (sla.semaforo === "na") return <span className="text-xs text-faint">No aplica</span>;
  return (
    <div className={compacto ? "w-36" : "w-full"}>
      <div className="mb-1 flex items-center gap-1.5">
        <Timer size={12} className={cx("shrink-0", COLOR_SEMAFORO[sla.semaforo])} />
        <span
          className={cx("truncate text-[11px] font-semibold", COLOR_SEMAFORO[sla.semaforo])}
          title={sla.etiqueta}
        >
          {compacto ? sla.corta : sla.etiqueta}
        </span>
      </div>
      <Barra pct={sla.consumido} clase={BARRA_SEMAFORO[sla.semaforo]} />
    </div>
  );
}

/** Tarjeta compacta usada en el tablero de despacho y en la vista de campo */
export function TarjetaOT({
  ot, onClick, activa, arrastrable,
}: { ot: OrdenTrabajo; onClick?: () => void; activa?: boolean; arrastrable?: boolean }) {
  const { cliente, sitio, cuadrilla } = useCatalogos();
  const cli = cliente(ot.clienteId);
  const sit = sitio(ot.sitioId);
  const cuad = cuadrilla(ot.cuadrillaId);
  const sla = evaluarSla(ot);

  return (
    <article
      onClick={onClick}
      draggable={arrastrable}
      onDragStart={(e) => e.dataTransfer.setData("text/plain", ot.id)}
      className={cx(
        "group cursor-pointer rounded-xl border bg-surface p-3.5 transition-all",
        "hover:-translate-y-0.5 hover:shadow-md",
        activa ? "border-brand-500 ring-2 ring-brand-500/25" : "border-line",
        arrastrable && "active:cursor-grabbing",
      )}
      style={{ borderLeftWidth: 3, borderLeftColor: HEX_TIPO[ot.tipo] }}
    >
      <div className="flex items-center gap-2">
        <ChipPrioridad prioridad={ot.prioridad} />
        <span className="font-mono text-[11px] font-medium text-muted">{ot.folio}</span>
        <span className="ml-auto text-[11px] text-faint">{relativo(ot.creadaEn)}</span>
      </div>

      <h3 className="mt-2 line-clamp-2 text-[13px] font-semibold leading-snug text-text">{ot.titulo}</h3>

      <p className="mt-1.5 flex items-center gap-1 truncate text-[11px] text-muted">
        <MapPin size={11} className="shrink-0" />
        {cli?.nombre} · {sit?.canton}
      </p>

      <div className="mt-3 flex items-end justify-between gap-3">
        <MedidorSla ot={ot} compacto />
        <span className="truncate text-[11px] font-medium text-faint">{cuad ? cuad.codigo : "Sin asignar"}</span>
      </div>

      {sla.semaforo === "vencido" && !ot.iniciadaEn && (
        <p className="mt-2 rounded-lg bg-rose-500/10 px-2 py-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
          Escalado a jefatura de operaciones
        </p>
      )}
    </article>
  );
}
