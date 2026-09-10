import type { EstadoOT, OrdenTrabajo, Prioridad, TipoTrabajo } from "../data/types";

/* ---------- Formato ---------- */

const colones = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  maximumFractionDigits: 0,
});

export const money = (n: number) => colones.format(n).replace("CRC", "₡").replace(/\s+/, " ");

export const compacto = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `₡${(n / 1_000_000).toFixed(1)} M`;
  if (Math.abs(n) >= 1_000) return `₡${Math.round(n / 1_000)} K`;
  return `₡${n}`;
};

export const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" });

export const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString("es-CR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true,
  });

export const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit", hour12: true });

/** "hace 2 h 15 m" / "en 45 m" */
export function relativo(iso: string, ahora = Date.now()) {
  const delta = new Date(iso).getTime() - ahora;
  const abs = Math.abs(delta);
  const min = Math.floor(abs / 60_000);
  const h = Math.floor(min / 60);
  const d = Math.floor(h / 24);
  let txt: string;
  if (d >= 1) txt = `${d} d ${h % 24} h`;
  else if (h >= 1) txt = `${h} h ${min % 60} m`;
  else txt = `${min} m`;
  return delta < 0 ? `hace ${txt}` : `en ${txt}`;
}

export const duracion = (horas: number) => {
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  return m === 0 ? `${h} h` : `${h} h ${m} m`;
};

/* ---------- Etiquetas ---------- */

export const ETIQUETA_ESTADO: Record<EstadoOT, string> = {
  nueva: "Sin asignar",
  asignada: "Asignada",
  en_ruta: "En ruta",
  en_sitio: "En sitio",
  pausada: "Pausada",
  completada: "Completada",
  cerrada: "Cerrada",
  cancelada: "Cancelada",
};

export const ETIQUETA_TIPO: Record<TipoTrabajo, string> = {
  emergencia: "Emergencia",
  correctivo: "Correctivo",
  preventivo: "Preventivo",
  instalacion: "Instalación",
  inspeccion: "Inspección",
};

export const ETIQUETA_PRIORIDAD: Record<Prioridad, string> = {
  P1: "P1 · Crítica",
  P2: "P2 · Alta",
  P3: "P3 · Media",
  P4: "P4 · Baja",
};

/** Clases Tailwind por estado, para chips y bordes */
export const COLOR_ESTADO: Record<EstadoOT, string> = {
  nueva: "bg-rose-500/12 text-rose-600 dark:text-rose-400 ring-rose-500/25",
  asignada: "bg-sky-500/12 text-sky-600 dark:text-sky-400 ring-sky-500/25",
  en_ruta: "bg-indigo-500/12 text-indigo-600 dark:text-indigo-400 ring-indigo-500/25",
  en_sitio: "bg-brand-500/15 text-brand-700 dark:text-brand-400 ring-brand-500/30",
  pausada: "bg-orange-500/12 text-orange-600 dark:text-orange-400 ring-orange-500/25",
  completada: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 ring-emerald-500/25",
  cerrada: "bg-ink-500/12 text-ink-600 dark:text-ink-300 ring-ink-500/25",
  cancelada: "bg-ink-500/10 text-ink-500 dark:text-ink-400 ring-ink-500/20 line-through",
};

export const COLOR_PRIORIDAD: Record<Prioridad, string> = {
  P1: "bg-rose-600 text-white",
  P2: "bg-orange-500 text-white",
  P3: "bg-sky-600 text-white",
  P4: "bg-ink-500 text-white",
};

export const HEX_TIPO: Record<TipoTrabajo, string> = {
  emergencia: "#e11d48",
  correctivo: "#f59e0b",
  preventivo: "#0ea5e9",
  instalacion: "#8b5cf6",
  inspeccion: "#22c55e",
};

export const HEX_ESTADO: Record<string, string> = {
  nueva: "#f43f5e",
  asignada: "#0ea5e9",
  en_ruta: "#6366f1",
  en_sitio: "#f59e0b",
  pausada: "#fb923c",
  completada: "#22c55e",
  cerrada: "#64748b",
  cancelada: "#94a3b8",
};

/* ---------- Reglas de negocio ---------- */

export const ESTADOS_ABIERTOS: EstadoOT[] = ["nueva", "asignada", "en_ruta", "en_sitio", "pausada"];
export const estaAbierta = (ot: OrdenTrabajo) => ESTADOS_ABIERTOS.includes(ot.estado);

export type SemaforoSla = "ok" | "riesgo" | "vencido" | "na";

export interface EstadoSla {
  semaforo: SemaforoSla;
  /** 0 a 1+; cuánto del tiempo de SLA se ha consumido */
  consumido: number;
  restanteMs: number;
  etiqueta: string;
  /** Versión de una sola línea, para tarjetas y celdas angostas */
  corta: string;
}

/**
 * El reloj de SLA corre desde que se crea la OT hasta que la cuadrilla
 * llega al sitio. Si ya llegó, el resultado queda congelado.
 */
export function evaluarSla(ot: OrdenTrabajo, ahora = Date.now()): EstadoSla {
  if (ot.estado === "cancelada")
    return { semaforo: "na", consumido: 0, restanteMs: 0, etiqueta: "No aplica", corta: "N/A" };

  const creada = new Date(ot.creadaEn).getTime();
  const vence = new Date(ot.venceEn).getTime();
  const total = vence - creada;
  const corte = ot.iniciadaEn ? new Date(ot.iniciadaEn).getTime() : ahora;
  const consumido = total > 0 ? (corte - creada) / total : 0;
  const restanteMs = vence - corte;
  const horas = duracion(Math.abs(restanteMs) / 3600_000);

  if (ot.iniciadaEn) {
    return restanteMs >= 0
      ? { semaforo: "ok", consumido, restanteMs, etiqueta: `Atendida con ${horas} de margen`, corta: `Atendida · ${horas} antes` }
      : { semaforo: "vencido", consumido, restanteMs, etiqueta: `Atendida ${horas} tarde`, corta: `Atendida · ${horas} tarde` };
  }
  if (restanteMs < 0)
    return { semaforo: "vencido", consumido, restanteMs, etiqueta: `Vencido hace ${horas}`, corta: `Vencido · ${horas}` };
  if (consumido > 0.75)
    return { semaforo: "riesgo", consumido, restanteMs, etiqueta: `Vence en ${horas}`, corta: `Vence en ${horas}` };
  return { semaforo: "ok", consumido, restanteMs, etiqueta: `Vence en ${horas}`, corta: `Vence en ${horas}` };
}

/** ¿Se cumplió el SLA? null si la OT todavía no fue atendida. */
export function cumplioSla(ot: OrdenTrabajo): boolean | null {
  if (!ot.iniciadaEn || ot.estado === "cancelada") return null;
  return new Date(ot.iniciadaEn).getTime() <= new Date(ot.venceEn).getTime();
}

export const COLOR_SEMAFORO: Record<SemaforoSla, string> = {
  ok: "text-emerald-600 dark:text-emerald-400",
  riesgo: "text-orange-500",
  vencido: "text-rose-600 dark:text-rose-400",
  na: "text-ink-400",
};

export const BARRA_SEMAFORO: Record<SemaforoSla, string> = {
  ok: "bg-emerald-500",
  riesgo: "bg-orange-500",
  vencido: "bg-rose-500",
  na: "bg-ink-300",
};

/** Costo facturable de una OT: mano de obra + materiales */
export function costoOT(
  ot: OrdenTrabajo,
  precioMaterial: (id: string) => number,
): { manoObra: number; materiales: number; total: number } {
  const horas = ot.horasReales ?? ot.horasEstimadas;
  const manoObra = horas * ot.tarifaHora;
  const materiales = ot.materiales.reduce((acc, m) => acc + precioMaterial(m.materialId) * m.cantidad, 0);
  return { manoObra, materiales, total: manoObra + materiales };
}

/** Siguiente estado natural en el flujo de campo */
export const SIGUIENTE_ESTADO: Partial<Record<EstadoOT, { estado: EstadoOT; accion: string }>> = {
  asignada: { estado: "en_ruta", accion: "Iniciar traslado" },
  en_ruta: { estado: "en_sitio", accion: "Registrar llegada" },
  en_sitio: { estado: "completada", accion: "Completar y firmar" },
  pausada: { estado: "en_sitio", accion: "Reanudar trabajo" },
};
