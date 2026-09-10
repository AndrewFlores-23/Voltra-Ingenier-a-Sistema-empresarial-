import type {
  Cliente, Cuadrilla, EventoOT, ItemChecklist, Material, OrdenTrabajo,
  Prioridad, Sitio, Tecnico, TipoTrabajo,
} from "./types";

/* ------------------------------------------------------------------ *
 * PRNG determinista: la demo se ve igual en cada carga y en cada
 * dispositivo, pero las fechas siempre son relativas a "hoy".
 * ------------------------------------------------------------------ */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260910);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];
const int = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const chance = (p: number) => rnd() < p;

const HORA = 3600_000;
const DIA = 24 * HORA;
export const AHORA = new Date();
const iso = (ms: number) => new Date(ms).toISOString();

/* ------------------------------------------------------------------ *
 * Clientes - empresas ficticias del Gran Area Metropolitana
 * ------------------------------------------------------------------ */
export const clientes: Cliente[] = [
  { id: "c1", nombre: "Corporación Alimentaria del Valle", sector: "industrial", contacto: "Ing. Marcela Zúñiga", telefono: "2298-4410", cedulaJuridica: "3-101-448120", contratoSla: "platino" },
  { id: "c2", nombre: "Clínica Santa Lucía", sector: "institucional", contacto: "Dr. Fernando Alpízar", telefono: "2224-7788", cedulaJuridica: "3-101-201884", contratoSla: "platino" },
  { id: "c3", nombre: "Plaza Terrazas del Este", sector: "comercial", contacto: "Sra. Karla Venegas", telefono: "2271-0092", cedulaJuridica: "3-101-556301", contratoSla: "oro" },
  { id: "c4", nombre: "Textiles Monteverde S.A.", sector: "industrial", contacto: "Ing. Rodrigo Sandí", telefono: "2438-1120", cedulaJuridica: "3-101-119045", contratoSla: "oro" },
  { id: "c5", nombre: "Condominio Altos de Escazú", sector: "residencial", contacto: "Adm. Priscilla Mora", telefono: "2289-6634", cedulaJuridica: "3-109-772014", contratoSla: "plata" },
  { id: "c6", nombre: "Universidad Técnica del Pacífico", sector: "institucional", contacto: "Lic. Óscar Jiménez", telefono: "2519-3300", cedulaJuridica: "3-006-102039", contratoSla: "oro" },
  { id: "c7", nombre: "Frigoríficos Interamericana", sector: "industrial", contacto: "Ing. Adriana Chaves", telefono: "2293-5567", cedulaJuridica: "3-101-330778", contratoSla: "platino" },
  { id: "c8", nombre: "Hotel Bosque Azul", sector: "comercial", contacto: "Sr. Diego Ramírez", telefono: "2282-9014", cedulaJuridica: "3-101-604411", contratoSla: "plata" },
  { id: "c9", nombre: "Coopelectra R.L.", sector: "distribucion", contacto: "Ing. Luis Fdo. Segura", telefono: "2546-7700", cedulaJuridica: "3-004-045112", contratoSla: "platino" },
  { id: "c10", nombre: "Centro Logístico La Aurora", sector: "industrial", contacto: "Sra. Gabriela Rojas", telefono: "2239-8850", cedulaJuridica: "3-101-712983", contratoSla: "oro" },
  { id: "c11", nombre: "Torre Empresarial Escazú Norte", sector: "comercial", contacto: "Arq. Esteban Fallas", telefono: "2588-1200", cedulaJuridica: "3-101-489217", contratoSla: "oro" },
  { id: "c12", nombre: "Panificadora El Trigal", sector: "industrial", contacto: "Sr. Mauricio Brenes", telefono: "2551-4433", cedulaJuridica: "3-101-267740", contratoSla: "plata" },
];

/* ------------------------------------------------------------------ *
 * Sitios - coordenadas reales del GAM para que el mapa sea legible
 * ------------------------------------------------------------------ */
export const sitios: Sitio[] = [
  { id: "s1", clienteId: "c1", nombre: "Planta de proceso Belén", distrito: "La Ribera", canton: "Belén", lat: 9.9847, lng: -84.1836, tension: "media" },
  { id: "s2", clienteId: "c1", nombre: "Centro de distribución Alajuela", distrito: "Río Segundo", canton: "Alajuela", lat: 10.0032, lng: -84.1978, tension: "media" },
  { id: "s3", clienteId: "c2", nombre: "Torre de hospitalización", distrito: "Mata Redonda", canton: "San José", lat: 9.9370, lng: -84.1030, tension: "media" },
  { id: "s4", clienteId: "c3", nombre: "Plaza comercial Curridabat", distrito: "Granadilla", canton: "Curridabat", lat: 9.9265, lng: -84.0288, tension: "baja" },
  { id: "s5", clienteId: "c4", nombre: "Planta textil Cartago", distrito: "Oriental", canton: "Cartago", lat: 9.8644, lng: -83.9194, tension: "media" },
  { id: "s6", clienteId: "c5", nombre: "Torre A y casa club", distrito: "San Rafael", canton: "Escazú", lat: 9.9189, lng: -84.1400, tension: "baja" },
  { id: "s7", clienteId: "c6", nombre: "Campus central", distrito: "San Pedro", canton: "Montes de Oca", lat: 9.9355, lng: -84.0523, tension: "media" },
  { id: "s8", clienteId: "c7", nombre: "Cámaras de congelación", distrito: "Uruca", canton: "San José", lat: 9.9497, lng: -84.1156, tension: "media" },
  { id: "s9", clienteId: "c8", nombre: "Edificio principal", distrito: "Santa Ana", canton: "Santa Ana", lat: 9.9325, lng: -84.1836, tension: "baja" },
  { id: "s10", clienteId: "c9", nombre: "Subestación Los Santos", distrito: "San Marcos", canton: "Tarrazú", lat: 9.6603, lng: -83.9986, tension: "alta" },
  { id: "s11", clienteId: "c9", nombre: "Red de distribución Heredia", distrito: "Mercedes", canton: "Heredia", lat: 9.9981, lng: -84.1197, tension: "media" },
  { id: "s12", clienteId: "c10", nombre: "Bodegas 1 a 6", distrito: "La Aurora", canton: "Heredia", lat: 9.9727, lng: -84.1450, tension: "media" },
  { id: "s13", clienteId: "c11", nombre: "Torre corporativa", distrito: "San Rafael", canton: "Escazú", lat: 9.9243, lng: -84.1288, tension: "media" },
  { id: "s14", clienteId: "c12", nombre: "Planta de horneado", distrito: "San Antonio", canton: "Desamparados", lat: 9.8975, lng: -84.0664, tension: "baja" },
  { id: "s15", clienteId: "c3", nombre: "Anexo Tibás", distrito: "San Juan", canton: "Tibás", lat: 9.9600, lng: -84.0833, tension: "baja" },
  { id: "s16", clienteId: "c6", nombre: "Sede Grecia", distrito: "Grecia", canton: "Grecia", lat: 10.0722, lng: -84.3128, tension: "baja" },
];

/* ------------------------------------------------------------------ *
 * Personal
 * ------------------------------------------------------------------ */
export const tecnicos: Tecnico[] = [
  { id: "t1", nombre: "Jorge Vargas Mena", rol: "lider", certificaciones: ["CFIA A-12", "NFPA 70E", "Trabajo en altura"], telefono: "8712-4409", avatar: "JV" },
  { id: "t2", nombre: "Kevin Ureña Soto", rol: "electricista", certificaciones: ["NFPA 70E", "LOTO"], telefono: "8804-1123", avatar: "KU" },
  { id: "t3", nombre: "Andrés Picado Lobo", rol: "ayudante", certificaciones: ["Primeros auxilios"], telefono: "6032-7781", avatar: "AP" },
  { id: "t4", nombre: "María José Solís", rol: "lider", certificaciones: ["CFIA A-08", "Termografía nivel II", "NFPA 70E"], telefono: "8390-5540", avatar: "MS" },
  { id: "t5", nombre: "Luis Diego Campos", rol: "electricista", certificaciones: ["Media tensión", "LOTO"], telefono: "8877-2265", avatar: "LC" },
  { id: "t6", nombre: "Wálter Núñez Arias", rol: "lider", certificaciones: ["Alta tensión", "Rescate en altura", "NFPA 70E"], telefono: "8455-9930", avatar: "WN" },
  { id: "t7", nombre: "Steven Corrales Mata", rol: "electricista", certificaciones: ["Media tensión"], telefono: "7011-3388", avatar: "SC" },
  { id: "t8", nombre: "Natalia Bermúdez Rojas", rol: "electricista", certificaciones: ["Automatización", "NFPA 70E"], telefono: "8266-4417", avatar: "NB" },
  { id: "t9", nombre: "Óscar Villalobos Cruz", rol: "ayudante", certificaciones: ["LOTO"], telefono: "6188-7752", avatar: "OV" },
  { id: "t10", nombre: "Randall Espinoza Gómez", rol: "lider", certificaciones: ["CFIA A-15", "Termografía nivel I"], telefono: "8541-0076", avatar: "RE" },
  { id: "t11", nombre: "Yendry Castro Alfaro", rol: "electricista", certificaciones: ["Grupos electrógenos"], telefono: "8933-6621", avatar: "YC" },
  { id: "t12", nombre: "Bryan Hidalgo Quesada", rol: "ayudante", certificaciones: ["Primeros auxilios", "LOTO"], telefono: "7244-8890", avatar: "BH" },
];

export const cuadrillas: Cuadrilla[] = [
  { id: "q1", nombre: "Cuadrilla Alfa", codigo: "ALF-01", placaUnidad: "CL 284739", base: "Taller La Uruca", especialidad: ["emergencia", "correctivo"], tecnicoIds: ["t1", "t2", "t3"], disponible: false, lat: 9.9497, lng: -84.1156, turno: "diurno" },
  { id: "q2", nombre: "Cuadrilla Bravo", codigo: "BRV-02", placaUnidad: "CL 301558", base: "Taller La Uruca", especialidad: ["preventivo", "inspeccion"], tecnicoIds: ["t4", "t5"], disponible: true, lat: 9.9325, lng: -84.1436, turno: "diurno" },
  { id: "q3", nombre: "Cuadrilla Charlie", codigo: "CHR-03", placaUnidad: "CL 277104", base: "Base Cartago", especialidad: ["correctivo", "instalacion"], tecnicoIds: ["t6", "t7", "t9"], disponible: false, lat: 9.8712, lng: -83.9330, turno: "diurno" },
  { id: "q4", nombre: "Cuadrilla Delta", codigo: "DLT-04", placaUnidad: "CL 315902", base: "Base Heredia", especialidad: ["instalacion", "preventivo"], tecnicoIds: ["t8", "t11"], disponible: true, lat: 9.9981, lng: -84.1197, turno: "diurno" },
  { id: "q5", nombre: "Cuadrilla Eco", codigo: "ECO-05", placaUnidad: "CL 268331", base: "Taller La Uruca", especialidad: ["emergencia", "correctivo"], tecnicoIds: ["t10", "t12"], disponible: true, lat: 9.9380, lng: -84.0715, turno: "nocturno" },
];

/* ------------------------------------------------------------------ *
 * Almacen - precios en colones
 * ------------------------------------------------------------------ */
export const materiales: Material[] = [
  { id: "m1", codigo: "BRK-3P-100", descripcion: "Breaker tripolar 100 A, 480 V", unidad: "unidad", costoUnitario: 84500, stock: 14, puntoReorden: 6, bodega: "La Uruca" },
  { id: "m2", codigo: "CBL-THHN-8", descripcion: "Cable THHN #8 AWG", unidad: "metro", costoUnitario: 1850, stock: 640, puntoReorden: 300, bodega: "La Uruca" },
  { id: "m3", codigo: "CBL-THHN-12", descripcion: "Cable THHN #12 AWG", unidad: "metro", costoUnitario: 720, stock: 120, puntoReorden: 400, bodega: "La Uruca" },
  { id: "m4", codigo: "CNT-40A", descripcion: "Contactor 40 A con bobina 220 V", unidad: "unidad", costoUnitario: 47300, stock: 9, puntoReorden: 4, bodega: "Cartago" },
  { id: "m5", codigo: "FUS-NH-160", descripcion: "Fusible NH tamaño 1, 160 A", unidad: "unidad", costoUnitario: 12900, stock: 3, puntoReorden: 10, bodega: "La Uruca" },
  { id: "m6", codigo: "TRF-CT-200", descripcion: "Transformador de corriente 200/5 A", unidad: "unidad", costoUnitario: 68000, stock: 7, puntoReorden: 3, bodega: "Heredia" },
  { id: "m7", codigo: "LMP-LED-150", descripcion: "Luminaria LED industrial 150 W", unidad: "unidad", costoUnitario: 39900, stock: 26, puntoReorden: 12, bodega: "La Uruca" },
  { id: "m8", codigo: "PST-AISL-15", descripcion: "Aislador tipo pin 15 kV", unidad: "unidad", costoUnitario: 15600, stock: 18, puntoReorden: 8, bodega: "Cartago" },
  { id: "m9", codigo: "TUB-EMT-1", descripcion: "Tubería EMT 1 pulgada", unidad: "metro", costoUnitario: 2400, stock: 210, puntoReorden: 100, bodega: "Heredia" },
  { id: "m10", codigo: "GRS-TERM", descripcion: "Grasa dieléctrica para conexiones", unidad: "tubo", costoUnitario: 8900, stock: 2, puntoReorden: 6, bodega: "La Uruca" },
  { id: "m11", codigo: "PRT-SRG-3P", descripcion: "Protector de sobretensión trifásico", unidad: "unidad", costoUnitario: 112000, stock: 5, puntoReorden: 3, bodega: "La Uruca" },
  { id: "m12", codigo: "BAT-UPS-12", descripcion: "Batería sellada 12 V / 100 Ah", unidad: "unidad", costoUnitario: 96500, stock: 11, puntoReorden: 4, bodega: "Cartago" },
];

/* ------------------------------------------------------------------ *
 * Plantillas de trabajo
 * ------------------------------------------------------------------ */
const TRABAJOS: Record<TipoTrabajo, string[]> = {
  emergencia: [
    "Pérdida total de energía en tablero principal",
    "Disparo recurrente del interruptor general",
    "Sobrecalentamiento en barra de distribución",
    "Falla de fase en acometida de media tensión",
    "Cortocircuito en alimentador de bombas",
  ],
  correctivo: [
    "Reemplazo de breaker principal dañado",
    "Corrección de falso contacto en tablero TD-3",
    "Sustitución de contactor de arrancador",
    "Reparación de canalización dañada por filtración",
    "Cambio de fusibles NH en seccionador",
    "Corrección de desbalance de fases",
  ],
  preventivo: [
    "Mantenimiento trimestral de subestación",
    "Termografía de tableros críticos",
    "Limpieza y torqueo de conexiones",
    "Prueba de aislamiento en motores",
    "Mantenimiento de planta de emergencia",
    "Revisión de sistema de puesta a tierra",
  ],
  instalacion: [
    "Instalación de banco de capacitores",
    "Montaje de luminarias LED en nave 2",
    "Instalación de protector de sobretensión",
    "Ampliación de tablero de distribución",
    "Tendido de alimentador para nueva línea",
  ],
  inspeccion: [
    "Inspección de acometida y medición",
    "Levantamiento de cargas para ampliación",
    "Auditoría de calidad de energía",
    "Verificación post-instalación",
    "Inspección de red aérea tras temporal",
  ],
};

const CHECKLISTS: Record<TipoTrabajo, [string, boolean][]> = {
  emergencia: [
    ["Análisis de trabajo seguro (ATS) firmado", true],
    ["Bloqueo y etiquetado LOTO aplicado", true],
    ["Verificación de ausencia de tensión", true],
    ["Equipo de protección personal completo", true],
    ["Delimitación del área de trabajo", false],
    ["Causa raíz documentada", false],
  ],
  correctivo: [
    ["Análisis de trabajo seguro (ATS) firmado", true],
    ["Bloqueo y etiquetado LOTO aplicado", true],
    ["Verificación de ausencia de tensión", true],
    ["Repuestos verificados contra especificación", false],
    ["Prueba de operación con el cliente", false],
    ["Área entregada limpia", false],
  ],
  preventivo: [
    ["Coordinación de ventana de mantenimiento", true],
    ["Bloqueo y etiquetado LOTO aplicado", true],
    ["Medición de resistencia de aislamiento", false],
    ["Torqueo de conexiones según tabla", false],
    ["Registro termográfico adjunto", false],
    ["Bitácora de equipo actualizada", false],
  ],
  instalacion: [
    ["Permiso de trabajo aprobado", true],
    ["Materiales recibidos y verificados", false],
    ["Canalización y soportería conforme a plano", false],
    ["Prueba de continuidad y aislamiento", true],
    ["Rotulación de circuitos", false],
    ["Planos as-built actualizados", false],
  ],
  inspeccion: [
    ["Equipo de protección personal completo", true],
    ["Registro fotográfico de hallazgos", false],
    ["Mediciones de tensión y corriente", false],
    ["Informe preliminar con el cliente", false],
  ],
};

const NOTAS_TECNICO = [
  "Se encontró oxidación en la barra; se recomienda inspección en 3 meses.",
  "Cliente solicita reprogramar la segunda fase para el próximo sábado.",
  "Se detectó desbalance de 11 % entre fases, se deja registrado en bitácora.",
  "Faltaba habilitar el acceso a la subestación; se coordinó con seguridad.",
  "Repuesto no estaba en la unidad, se solicitó traslado desde bodega La Uruca.",
  "Termografía muestra punto caliente de 68 °C en el borne central.",
  "Trabajo ejecutado sin novedades. Se entregó el área al encargado de planta.",
];

/* SLA base en horas por prioridad, ajustado por el contrato del cliente */
const SLA_BASE: Record<Prioridad, number> = { P1: 4, P2: 8, P3: 24, P4: 72 };
const FACTOR_CONTRATO = { platino: 0.75, oro: 1, plata: 1.35 };

export function horasSla(prioridad: Prioridad, contrato: keyof typeof FACTOR_CONTRATO) {
  return SLA_BASE[prioridad] * FACTOR_CONTRATO[contrato];
}

/* ------------------------------------------------------------------ *
 * Generacion de ordenes
 * ------------------------------------------------------------------ */
let folioSeq = 1180;

function nuevaOT(opts: {
  creadaMs: number;
  tipo: TipoTrabajo;
  prioridad: Prioridad;
  estado: OrdenTrabajo["estado"];
  sitio: Sitio;
  cuadrillaId: string | null;
}): OrdenTrabajo {
  const { creadaMs, tipo, prioridad, estado, sitio, cuadrillaId } = opts;
  const cliente = clientes.find((c) => c.id === sitio.clienteId)!;
  const sla = horasSla(prioridad, cliente.contratoSla);
  const id = `ot${++folioSeq}`;
  const folio = `OT-2026-${String(folioSeq).padStart(4, "0")}`;

  const plantilla = CHECKLISTS[tipo];
  const terminada = estado === "completada" || estado === "cerrada";
  const enSitio = estado === "en_sitio" || estado === "pausada";
  const avance = enSitio ? int(1, plantilla.length - 1) : 0;
  const checklist: ItemChecklist[] = plantilla.map(([texto, critico], i) => ({
    id: `${id}-ck${i}`,
    texto,
    critico,
    hecho: terminada ? true : i < avance,
  }));

  const horasEstimadas = tipo === "emergencia" ? int(2, 5) : tipo === "preventivo" ? int(4, 9) : int(2, 8);
  const desvio = chance(0.3) ? 1 + rnd() * 0.5 : 0.8 + rnd() * 0.25;
  const horasReales = terminada ? Math.round(horasEstimadas * desvio * 10) / 10 : null;

  // Respuesta dentro o fuera del SLA (~88 % de cumplimiento)
  const cumple = chance(0.88);
  const respuestaMs = cumple ? sla * HORA * (0.15 + rnd() * 0.7) : sla * HORA * (1.05 + rnd() * 0.9);
  const iniciadaMs = estado === "nueva" || estado === "cancelada" || estado === "asignada" ? null : creadaMs + respuestaMs;
  const cerradaMs = terminada && iniciadaMs ? iniciadaMs + (horasReales ?? 3) * HORA : null;

  const eventos: EventoOT[] = [
    { id: `${id}-e0`, ts: iso(creadaMs), tipo: "creada", actor: "Central de despacho", detalle: `Reporte recibido de ${cliente.contacto}` },
  ];
  const cuad = cuadrillas.find((q) => q.id === cuadrillaId);
  if (cuad) {
    eventos.push({ id: `${id}-e1`, ts: iso(creadaMs + respuestaMs * 0.25), tipo: "asignada", actor: "Central de despacho", detalle: `Asignada a ${cuad.nombre} (${cuad.codigo})` });
  }
  if (cuad && iniciadaMs) {
    eventos.push({ id: `${id}-e2`, ts: iso(creadaMs + respuestaMs * 0.55), tipo: "en_ruta", actor: cuad.nombre, detalle: `Unidad ${cuad.placaUnidad} en camino a ${sitio.nombre}` });
    eventos.push({ id: `${id}-e3`, ts: iso(iniciadaMs), tipo: "en_sitio", actor: cuad.nombre, detalle: "Llegada al sitio y apertura de permiso de trabajo" });
  }
  if (!cumple && iniciadaMs) {
    eventos.push({ id: `${id}-e4`, ts: iso(creadaMs + sla * HORA), tipo: "escalada", actor: "Sistema", detalle: `SLA de ${sla} h incumplido, notificado a jefatura de operaciones` });
  }
  if (terminada && cerradaMs) {
    eventos.push({ id: `${id}-e5`, ts: iso(cerradaMs - HORA * 0.4), tipo: "nota", actor: cuad?.nombre ?? "Cuadrilla", detalle: pick(NOTAS_TECNICO) });
    eventos.push({ id: `${id}-e6`, ts: iso(cerradaMs), tipo: "completada", actor: cuad?.nombre ?? "Cuadrilla", detalle: `Trabajo completado y firmado por ${cliente.contacto}` });
    if (estado === "cerrada") {
      eventos.push({ id: `${id}-e7`, ts: iso(cerradaMs + HORA * int(2, 20)), tipo: "cerrada", actor: "Facturación", detalle: "OT validada y trasladada a facturación" });
    }
  }
  if (estado === "pausada") {
    eventos.push({ id: `${id}-e8`, ts: iso(Date.now() - HORA * 1.2), tipo: "pausada", actor: cuad?.nombre ?? "Cuadrilla", detalle: "En espera de repuesto desde bodega La Uruca" });
  }
  eventos.sort((a, b) => +new Date(a.ts) - +new Date(b.ts));

  const nMats = terminada ? int(1, 4) : enSitio ? int(0, 2) : 0;
  const usados = new Set<string>();
  const mats: OrdenTrabajo["materiales"] = [];
  for (let i = 0; i < nMats; i++) {
    const m = pick(materiales);
    if (usados.has(m.id)) continue;
    usados.add(m.id);
    mats.push({ materialId: m.id, cantidad: m.unidad === "metro" ? int(5, 60) : int(1, 4) });
  }

  const tonos = ["#f59e0b", "#0ea5e9", "#22c55e", "#ef4444", "#8b5cf6"];
  const galeria = [
    { id: `${id}-ev1`, titulo: "Estado inicial del tablero", momento: "antes" as const, tono: pick(tonos) },
    { id: `${id}-ev2`, titulo: "Detalle de la falla encontrada", momento: "antes" as const, tono: pick(tonos) },
    { id: `${id}-ev3`, titulo: "Trabajo terminado y rotulado", momento: "despues" as const, tono: pick(tonos) },
  ];
  const evidencias = terminada ? galeria.slice(0, int(2, 3)) : enSitio ? galeria.slice(0, 1) : [];

  return {
    id,
    folio,
    titulo: pick(TRABAJOS[tipo]),
    descripcion: `Reporte de ${cliente.contacto} en ${sitio.nombre}, ${sitio.distrito} de ${sitio.canton}. Sitio con tensión ${sitio.tension}. Se requiere atención ${prioridad === "P1" ? "inmediata" : prioridad === "P2" ? "prioritaria" : "programada"} según contrato ${cliente.contratoSla}.`,
    clienteId: cliente.id,
    sitioId: sitio.id,
    tipo,
    prioridad,
    estado,
    cuadrillaId,
    creadaEn: iso(creadaMs),
    venceEn: iso(creadaMs + sla * HORA),
    iniciadaEn: iniciadaMs ? iso(iniciadaMs) : null,
    cerradaEn: cerradaMs ? iso(cerradaMs) : null,
    horasEstimadas,
    horasReales,
    tarifaHora: cliente.contratoSla === "platino" ? 32000 : cliente.contratoSla === "oro" ? 27500 : 24000,
    checklist,
    materiales: mats,
    eventos,
    evidencias,
    firmaCliente: terminada ? cliente.contacto : null,
    calificacion: terminada ? (chance(0.75) ? 5 : chance(0.7) ? 4 : 3) : null,
  };
}

function generarOrdenes(): OrdenTrabajo[] {
  const ots: OrdenTrabajo[] = [];
  const ahora = AHORA.getTime();
  const tipos: TipoTrabajo[] = ["emergencia", "correctivo", "preventivo", "instalacion", "inspeccion"];
  const pesosTipo: TipoTrabajo[] = [
    "correctivo", "correctivo", "correctivo", "preventivo", "preventivo",
    "preventivo", "emergencia", "instalacion", "inspeccion",
  ];

  // Historial de los ultimos 75 dias
  for (let d = 75; d >= 1; d--) {
    const porDia = d > 60 ? int(0, 2) : int(1, 3);
    for (let k = 0; k < porDia; k++) {
      const creada = ahora - d * DIA + int(6, 17) * HORA + int(0, 59) * 60_000;
      const tipo = pick(pesosTipo);
      const prioridad: Prioridad =
        tipo === "emergencia"
          ? (chance(0.7) ? "P1" : "P2")
          : tipo === "correctivo"
            ? pick<Prioridad>(["P2", "P2", "P3"])
            : pick<Prioridad>(["P3", "P3", "P4"]);
      ots.push(
        nuevaOT({
          creadaMs: creada,
          tipo,
          prioridad,
          estado: chance(0.04) ? "cancelada" : chance(0.85) ? "cerrada" : "completada",
          sitio: pick(sitios),
          cuadrillaId: chance(0.04) ? null : pick(cuadrillas).id,
        }),
      );
    }
  }

  // Carga viva del dia: lo que el despachador ve ahora mismo
  const vivas: [TipoTrabajo, Prioridad, OrdenTrabajo["estado"], string | null, number][] = [
    ["emergencia", "P1", "en_sitio", "q1", 3.2],
    ["emergencia", "P1", "en_ruta", "q3", 1.1],
    ["correctivo", "P2", "en_sitio", "q3", 5.4],
    ["correctivo", "P2", "nueva", null, 0.6],
    ["emergencia", "P1", "nueva", null, 0.2],
    ["preventivo", "P3", "asignada", "q2", 2.5],
    ["preventivo", "P3", "nueva", null, 4.0],
    ["instalacion", "P4", "asignada", "q4", 6.5],
    ["correctivo", "P2", "pausada", "q1", 7.8],
    ["inspeccion", "P3", "nueva", null, 1.8],
    ["correctivo", "P3", "nueva", null, 9.5],
    ["preventivo", "P4", "asignada", "q2", 3.3],
    ["instalacion", "P3", "en_sitio", "q4", 4.7],
    ["correctivo", "P2", "nueva", null, 11.2],
    ["inspeccion", "P4", "nueva", null, 2.2],
  ];
  for (const [tipo, prioridad, estado, cuadrillaId, horasAtras] of vivas) {
    ots.push(
      nuevaOT({
        creadaMs: ahora - horasAtras * HORA,
        tipo,
        prioridad,
        estado,
        sitio: pick(sitios),
        cuadrillaId,
      }),
    );
  }

  // Trabajos ya completados hoy, para que el dia no arranque en cero
  for (let i = 0; i < 4; i++) {
    ots.push(
      nuevaOT({
        creadaMs: ahora - int(9, 14) * HORA,
        tipo: pick(tipos),
        prioridad: pick<Prioridad>(["P2", "P3"]),
        estado: "completada",
        sitio: pick(sitios),
        cuadrillaId: pick(cuadrillas).id,
      }),
    );
  }

  return ots.sort((a, b) => +new Date(b.creadaEn) - +new Date(a.creadaEn));
}

export const ordenes: OrdenTrabajo[] = generarOrdenes();
