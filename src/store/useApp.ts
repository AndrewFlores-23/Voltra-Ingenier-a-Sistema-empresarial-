import { create } from "zustand";
import {
  clientes as seedClientes,
  cuadrillas as seedCuadrillas,
  materiales as seedMateriales,
  ordenes as seedOrdenes,
  sitios as seedSitios,
  tecnicos as seedTecnicos,
} from "../data/seed";
import type {
  Cliente, Cuadrilla, EstadoOT, EventoOT, Material, OrdenTrabajo, Rol, Sitio, Tecnico,
} from "../data/types";
import { ETIQUETA_ESTADO } from "../lib/dominio";

const clonar = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

export interface Aviso {
  id: string;
  texto: string;
  tono: "ok" | "info" | "alerta";
}

interface AppState {
  rol: Rol;
  tema: "claro" | "oscuro";
  cuadrillaActivaId: string;

  clientes: Cliente[];
  sitios: Sitio[];
  tecnicos: Tecnico[];
  cuadrillas: Cuadrilla[];
  materiales: Material[];
  ordenes: OrdenTrabajo[];
  avisos: Aviso[];

  setRol: (r: Rol) => void;
  toggleTema: () => void;
  setCuadrillaActiva: (id: string) => void;

  avisar: (texto: string, tono?: Aviso["tono"]) => void;
  descartarAviso: (id: string) => void;

  asignar: (otId: string, cuadrillaId: string) => void;
  cambiarEstado: (otId: string, estado: EstadoOT, detalle?: string) => void;
  marcarItem: (otId: string, itemId: string) => void;
  consumirMaterial: (otId: string, materialId: string, cantidad: number) => void;
  agregarNota: (otId: string, texto: string) => void;
  capturarEvidencia: (otId: string, titulo: string, momento: "antes" | "despues") => void;
  cerrarConFirma: (otId: string, firma: string, calificacion: number) => void;
  crearOrden: (datos: NuevaOrden) => string;
  reiniciarDemo: () => void;
}

export interface NuevaOrden {
  titulo: string;
  descripcion: string;
  sitioId: string;
  tipo: OrdenTrabajo["tipo"];
  prioridad: OrdenTrabajo["prioridad"];
  horasEstimadas: number;
}

const SLA_BASE = { P1: 4, P2: 8, P3: 24, P4: 72 } as const;
const FACTOR = { platino: 0.75, oro: 1, plata: 1.35 } as const;

const evento = (tipo: EventoOT["tipo"], actor: string, detalle: string): EventoOT => ({
  id: `ev${Math.random().toString(36).slice(2, 10)}`,
  ts: new Date().toISOString(),
  tipo,
  actor,
  detalle,
});

const ACTOR_POR_ROL: Record<Rol, string> = {
  gerente: "Jefatura de operaciones",
  despachador: "Central de despacho",
  tecnico: "Cuadrilla en campo",
};

const temaInicial = (): "claro" | "oscuro" =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro";

export const useApp = create<AppState>((set, get) => ({
  rol: "despachador",
  tema: temaInicial(),
  cuadrillaActivaId: "q1",

  clientes: seedClientes,
  sitios: seedSitios,
  tecnicos: seedTecnicos,
  cuadrillas: clonar(seedCuadrillas),
  materiales: clonar(seedMateriales),
  ordenes: clonar(seedOrdenes),
  avisos: [],

  setRol: (rol) => set({ rol }),
  toggleTema: () => set((s) => ({ tema: s.tema === "claro" ? "oscuro" : "claro" })),
  setCuadrillaActiva: (cuadrillaActivaId) => set({ cuadrillaActivaId }),

  avisar: (texto, tono = "ok") => {
    const id = `a${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({ avisos: [...s.avisos, { id, texto, tono }] }));
    setTimeout(() => get().descartarAviso(id), 4200);
  },
  descartarAviso: (id) => set((s) => ({ avisos: s.avisos.filter((a) => a.id !== id) })),

  asignar: (otId, cuadrillaId) => {
    const { cuadrillas, rol } = get();
    const cuad = cuadrillas.find((c) => c.id === cuadrillaId);
    if (!cuad) return;
    set((s) => ({
      ordenes: s.ordenes.map((ot) =>
        ot.id !== otId
          ? ot
          : {
              ...ot,
              cuadrillaId,
              estado: "asignada" as EstadoOT,
              eventos: [
                ...ot.eventos,
                evento("asignada", ACTOR_POR_ROL[rol], `Asignada a ${cuad.nombre} (${cuad.codigo}) · unidad ${cuad.placaUnidad}`),
              ],
            },
      ),
      cuadrillas: s.cuadrillas.map((c) => (c.id === cuadrillaId ? { ...c, disponible: false } : c)),
    }));
    const folio = get().ordenes.find((o) => o.id === otId)?.folio;
    get().avisar(`${folio} asignada a ${cuad.nombre}`, "ok");
  },

  cambiarEstado: (otId, estado, detalle) => {
    const rol = get().rol;
    const mapa: Partial<Record<EstadoOT, EventoOT["tipo"]>> = {
      en_ruta: "en_ruta",
      en_sitio: "en_sitio",
      pausada: "pausada",
      completada: "completada",
      cerrada: "cerrada",
    };
    set((s) => ({
      ordenes: s.ordenes.map((ot) => {
        if (ot.id !== otId) return ot;
        const ahora = new Date().toISOString();
        return {
          ...ot,
          estado,
          iniciadaEn: estado === "en_sitio" && !ot.iniciadaEn ? ahora : ot.iniciadaEn,
          cerradaEn: estado === "completada" || estado === "cerrada" ? (ot.cerradaEn ?? ahora) : ot.cerradaEn,
          eventos: [
            ...ot.eventos,
            evento(mapa[estado] ?? "nota", ACTOR_POR_ROL[rol], detalle ?? `Estado actualizado a ${ETIQUETA_ESTADO[estado]}`),
          ],
        };
      }),
    }));
  },

  marcarItem: (otId, itemId) =>
    set((s) => ({
      ordenes: s.ordenes.map((ot) =>
        ot.id !== otId
          ? ot
          : { ...ot, checklist: ot.checklist.map((i) => (i.id === itemId ? { ...i, hecho: !i.hecho } : i)) },
      ),
    })),

  consumirMaterial: (otId, materialId, cantidad) => {
    const mat = get().materiales.find((m) => m.id === materialId);
    if (!mat || cantidad <= 0) return;
    if (mat.stock < cantidad) {
      get().avisar(`Stock insuficiente de ${mat.codigo}: quedan ${mat.stock} ${mat.unidad}`, "alerta");
      return;
    }
    set((s) => ({
      materiales: s.materiales.map((m) => (m.id === materialId ? { ...m, stock: m.stock - cantidad } : m)),
      ordenes: s.ordenes.map((ot) => {
        if (ot.id !== otId) return ot;
        const existente = ot.materiales.find((m) => m.materialId === materialId);
        return {
          ...ot,
          materiales: existente
            ? ot.materiales.map((m) => (m.materialId === materialId ? { ...m, cantidad: m.cantidad + cantidad } : m))
            : [...ot.materiales, { materialId, cantidad }],
          eventos: [
            ...ot.eventos,
            evento("material", ACTOR_POR_ROL[s.rol], `Consumo registrado: ${cantidad} ${mat.unidad} de ${mat.descripcion}`),
          ],
        };
      }),
    }));
    const restante = get().materiales.find((m) => m.id === materialId)!;
    if (restante.stock <= restante.puntoReorden) {
      get().avisar(`${restante.codigo} bajó del punto de reorden (${restante.stock}/${restante.puntoReorden})`, "alerta");
    } else {
      get().avisar(`Consumo registrado: ${cantidad} ${mat.unidad} de ${mat.codigo}`, "ok");
    }
  },

  agregarNota: (otId, texto) =>
    set((s) => ({
      ordenes: s.ordenes.map((ot) =>
        ot.id !== otId ? ot : { ...ot, eventos: [...ot.eventos, evento("nota", ACTOR_POR_ROL[s.rol], texto)] },
      ),
    })),

  capturarEvidencia: (otId, titulo, momento) => {
    const tonos = ["#f59e0b", "#0ea5e9", "#22c55e", "#ef4444", "#8b5cf6"];
    set((s) => ({
      ordenes: s.ordenes.map((ot) =>
        ot.id !== otId
          ? ot
          : {
              ...ot,
              evidencias: [
                ...ot.evidencias,
                { id: `ev${Math.random().toString(36).slice(2, 9)}`, titulo, momento, tono: tonos[ot.evidencias.length % tonos.length] },
              ],
              eventos: [...ot.eventos, evento("evidencia", ACTOR_POR_ROL[s.rol], `Evidencia adjunta: ${titulo}`)],
            },
      ),
    }));
    get().avisar("Evidencia adjunta a la orden", "ok");
  },

  cerrarConFirma: (otId, firma, calificacion) => {
    const ot = get().ordenes.find((o) => o.id === otId);
    if (!ot) return;
    const pendientesCriticos = ot.checklist.filter((i) => i.critico && !i.hecho);
    if (pendientesCriticos.length) {
      get().avisar(`Faltan ${pendientesCriticos.length} punto(s) crítico(s) del checklist de seguridad`, "alerta");
      return;
    }
    const horas = ot.iniciadaEn
      ? Math.max(0.5, Math.round(((Date.now() - new Date(ot.iniciadaEn).getTime()) / 3600_000) * 10) / 10)
      : ot.horasEstimadas;
    set((s) => ({
      ordenes: s.ordenes.map((o) =>
        o.id !== otId
          ? o
          : {
              ...o,
              estado: "completada" as EstadoOT,
              cerradaEn: new Date().toISOString(),
              horasReales: horas,
              firmaCliente: firma,
              calificacion,
              eventos: [...o.eventos, evento("completada", ACTOR_POR_ROL[s.rol], `Trabajo completado y firmado por ${firma}`)],
            },
      ),
      cuadrillas: s.cuadrillas.map((c) => (c.id === ot.cuadrillaId ? { ...c, disponible: true } : c)),
    }));
    get().avisar(`${ot.folio} completada y firmada`, "ok");
  },

  crearOrden: (datos) => {
    const { sitios, clientes, ordenes } = get();
    const sitio = sitios.find((s) => s.id === datos.sitioId)!;
    const cliente = clientes.find((c) => c.id === sitio.clienteId)!;
    const sla = SLA_BASE[datos.prioridad] * FACTOR[cliente.contratoSla];
    const num = 1400 + ordenes.length;
    const id = `ot-new-${num}`;
    const ahora = Date.now();
    const nueva: OrdenTrabajo = {
      id,
      folio: `OT-2026-${num}`,
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      clienteId: cliente.id,
      sitioId: sitio.id,
      tipo: datos.tipo,
      prioridad: datos.prioridad,
      estado: "nueva",
      cuadrillaId: null,
      creadaEn: new Date(ahora).toISOString(),
      venceEn: new Date(ahora + sla * 3600_000).toISOString(),
      iniciadaEn: null,
      cerradaEn: null,
      horasEstimadas: datos.horasEstimadas,
      horasReales: null,
      tarifaHora: cliente.contratoSla === "platino" ? 32000 : cliente.contratoSla === "oro" ? 27500 : 24000,
      checklist: [
        { id: `${id}-ck0`, texto: "Análisis de trabajo seguro (ATS) firmado", critico: true, hecho: false },
        { id: `${id}-ck1`, texto: "Bloqueo y etiquetado LOTO aplicado", critico: true, hecho: false },
        { id: `${id}-ck2`, texto: "Verificación de ausencia de tensión", critico: true, hecho: false },
        { id: `${id}-ck3`, texto: "Prueba de operación con el cliente", critico: false, hecho: false },
        { id: `${id}-ck4`, texto: "Área entregada limpia", critico: false, hecho: false },
      ],
      materiales: [],
      eventos: [evento("creada", ACTOR_POR_ROL[get().rol], `Reporte recibido de ${cliente.contacto}`)],
      evidencias: [],
      firmaCliente: null,
      calificacion: null,
    };
    set((s) => ({ ordenes: [nueva, ...s.ordenes] }));
    get().avisar(`${nueva.folio} creada · SLA de ${sla} h`, "info");
    return id;
  },

  reiniciarDemo: () => {
    set({
      cuadrillas: clonar(seedCuadrillas),
      materiales: clonar(seedMateriales),
      ordenes: clonar(seedOrdenes),
      avisos: [],
    });
    get().avisar("Datos de demostración restaurados", "info");
  },
}));

/* ---------- Selectores derivados ---------- */

export function useCatalogos() {
  const clientes = useApp((s) => s.clientes);
  const sitios = useApp((s) => s.sitios);
  const cuadrillas = useApp((s) => s.cuadrillas);
  const materiales = useApp((s) => s.materiales);
  const tecnicos = useApp((s) => s.tecnicos);

  return {
    clientes,
    sitios,
    cuadrillas,
    materiales,
    tecnicos,
    cliente: (id: string) => clientes.find((c) => c.id === id),
    sitio: (id: string) => sitios.find((s) => s.id === id),
    cuadrilla: (id: string | null) => (id ? cuadrillas.find((c) => c.id === id) : undefined),
    material: (id: string) => materiales.find((m) => m.id === id),
    tecnico: (id: string) => tecnicos.find((t) => t.id === id),
    precioMaterial: (id: string) => materiales.find((m) => m.id === id)?.costoUnitario ?? 0,
  };
}
