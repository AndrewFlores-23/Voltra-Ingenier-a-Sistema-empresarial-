export type Rol = "gerente" | "despachador" | "tecnico";

export type EstadoOT =
  | "nueva"
  | "asignada"
  | "en_ruta"
  | "en_sitio"
  | "pausada"
  | "completada"
  | "cerrada"
  | "cancelada";

export type Prioridad = "P1" | "P2" | "P3" | "P4";

export type TipoTrabajo =
  | "emergencia"
  | "correctivo"
  | "preventivo"
  | "instalacion"
  | "inspeccion";

export type Sector =
  | "industrial"
  | "comercial"
  | "residencial"
  | "institucional"
  | "distribucion";

export interface Cliente {
  id: string;
  nombre: string;
  sector: Sector;
  contacto: string;
  telefono: string;
  cedulaJuridica: string;
  contratoSla: "platino" | "oro" | "plata";
}

export interface Sitio {
  id: string;
  clienteId: string;
  nombre: string;
  distrito: string;
  canton: string;
  lat: number;
  lng: number;
  tension: "baja" | "media" | "alta";
}

export interface Tecnico {
  id: string;
  nombre: string;
  rol: "lider" | "electricista" | "ayudante";
  certificaciones: string[];
  telefono: string;
  avatar: string;
}

export interface Cuadrilla {
  id: string;
  nombre: string;
  codigo: string;
  placaUnidad: string;
  base: string;
  especialidad: TipoTrabajo[];
  tecnicoIds: string[];
  disponible: boolean;
  lat: number;
  lng: number;
  turno: "diurno" | "nocturno";
}

export interface Material {
  id: string;
  codigo: string;
  descripcion: string;
  unidad: string;
  costoUnitario: number;
  stock: number;
  puntoReorden: number;
  bodega: string;
}

export interface ConsumoMaterial {
  materialId: string;
  cantidad: number;
}

export interface ItemChecklist {
  id: string;
  texto: string;
  critico: boolean;
  hecho: boolean;
}

export interface EventoOT {
  id: string;
  ts: string;
  tipo:
    | "creada"
    | "asignada"
    | "en_ruta"
    | "en_sitio"
    | "pausada"
    | "reanudada"
    | "nota"
    | "material"
    | "evidencia"
    | "completada"
    | "cerrada"
    | "escalada";
  actor: string;
  detalle: string;
}

export interface Evidencia {
  id: string;
  titulo: string;
  momento: "antes" | "despues";
  tono: string;
}

export interface OrdenTrabajo {
  id: string;
  folio: string;
  titulo: string;
  descripcion: string;
  clienteId: string;
  sitioId: string;
  tipo: TipoTrabajo;
  prioridad: Prioridad;
  estado: EstadoOT;
  cuadrillaId: string | null;
  creadaEn: string;
  venceEn: string;
  iniciadaEn: string | null;
  cerradaEn: string | null;
  horasEstimadas: number;
  horasReales: number | null;
  tarifaHora: number;
  checklist: ItemChecklist[];
  materiales: ConsumoMaterial[];
  eventos: EventoOT[];
  evidencias: Evidencia[];
  firmaCliente: string | null;
  calificacion: number | null;
}
