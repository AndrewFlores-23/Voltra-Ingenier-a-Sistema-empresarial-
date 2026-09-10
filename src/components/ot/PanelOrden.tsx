import { useMemo, useState } from "react";
import {
  Camera, CircleCheck, Clock, FileSignature, HardHat, Lock, MapPin, Package,
  Phone, PlayCircle, Plus, ShieldCheck, Star, Truck, User, Wallet,
} from "lucide-react";
import type { OrdenTrabajo } from "../../data/types";
import { useApp, useCatalogos } from "../../store/useApp";
import {
  SIGUIENTE_ESTADO, costoOT, duracion,
  evaluarSla, fechaHora, hora, money,
} from "../../lib/dominio";
import { AreaTexto, Avatar, Boton, Campo, Entrada, Modal, Panel, Selector, cx } from "../ui/base";
import { ChipEstado, ChipPrioridad, ChipTipo, MedidorSla } from "./OtBits";

type Pestana = "resumen" | "seguridad" | "materiales" | "evidencia" | "bitacora";

const PESTANAS: { id: Pestana; texto: string }[] = [
  { id: "resumen", texto: "Resumen" },
  { id: "seguridad", texto: "Seguridad" },
  { id: "materiales", texto: "Materiales" },
  { id: "evidencia", texto: "Evidencia" },
  { id: "bitacora", texto: "Bitácora" },
];

export function PanelOrden({ otId, onCerrar }: { otId: string | null; onCerrar: () => void }) {
  const ot = useApp((s) => s.ordenes.find((o) => o.id === otId));
  const [pestana, setPestana] = useState<Pestana>("resumen");
  const [firmando, setFirmando] = useState(false);

  if (!ot) return null;

  return (
    <>
      <Panel
        abierto={!!otId}
        onCerrar={onCerrar}
        titulo={ot.titulo}
        sub={
          <span className="flex flex-wrap items-center gap-2">
            <ChipPrioridad prioridad={ot.prioridad} />
            <span className="font-mono">{ot.folio}</span>
            <ChipEstado estado={ot.estado} />
            <ChipTipo tipo={ot.tipo} />
          </span>
        }
      >
        <nav className="sticky top-0 z-10 flex gap-1 border-b border-line bg-surface px-4">
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPestana(p.id)}
              className={cx(
                "relative px-3 py-3 text-[13px] font-semibold transition-colors",
                pestana === p.id ? "text-text" : "text-muted hover:text-text",
              )}
            >
              {p.texto}
              {pestana === p.id && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand-500" />}
            </button>
          ))}
        </nav>

        <div className="p-5">
          {pestana === "resumen" && <Resumen ot={ot} />}
          {pestana === "seguridad" && <Seguridad ot={ot} />}
          {pestana === "materiales" && <Materiales ot={ot} />}
          {pestana === "evidencia" && <Evidencia ot={ot} />}
          {pestana === "bitacora" && <Bitacora ot={ot} />}
        </div>

        <BarraAcciones ot={ot} onFirmar={() => setFirmando(true)} />
      </Panel>

      <ModalFirma ot={ot} abierto={firmando} onCerrar={() => setFirmando(false)} />
    </>
  );
}

/* ---------------- Resumen ---------------- */

function Dato({ icono, etiqueta, valor }: { icono: React.ReactNode; etiqueta: string; valor: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl border border-line bg-surface p-3.5">
      <span className="mt-0.5 text-faint">{icono}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">{etiqueta}</p>
        <div className="mt-0.5 text-[13px] font-medium text-text">{valor}</div>
      </div>
    </div>
  );
}

function Resumen({ ot }: { ot: OrdenTrabajo }) {
  const { cliente, sitio, cuadrilla, tecnico, precioMaterial } = useCatalogos();
  const cli = cliente(ot.clienteId)!;
  const sit = sitio(ot.sitioId)!;
  const cuad = cuadrilla(ot.cuadrillaId);
  const costo = costoOT(ot, precioMaterial);
  const sla = evaluarSla(ot);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-line bg-raised p-4">
        <p className="text-[13px] leading-relaxed text-muted">{ot.descripcion}</p>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">Acuerdo de nivel de servicio</p>
        <div className="rounded-xl border border-line bg-surface p-4">
          <MedidorSla ot={ot} />
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-[10px] uppercase text-faint">Reportada</p>
              <p className="text-xs font-semibold text-text">{fechaHora(ot.creadaEn)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-faint">Compromiso</p>
              <p className="text-xs font-semibold text-text">{fechaHora(ot.venceEn)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-faint">Atención</p>
              <p className={cx("text-xs font-semibold", sla.semaforo === "vencido" ? "text-rose-600 dark:text-rose-400" : "text-text")}>
                {ot.iniciadaEn ? fechaHora(ot.iniciadaEn) : "Pendiente"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Dato
          icono={<User size={15} />}
          etiqueta="Cliente"
          valor={
            <>
              {cli.nombre}
              <span className="mt-0.5 block text-[11px] font-normal text-muted">
                Contrato {cli.contratoSla} · {cli.cedulaJuridica}
              </span>
            </>
          }
        />
        <Dato
          icono={<MapPin size={15} />}
          etiqueta="Sitio"
          valor={
            <>
              {sit.nombre}
              <span className="mt-0.5 block text-[11px] font-normal text-muted">
                {sit.distrito}, {sit.canton} · tensión {sit.tension}
              </span>
            </>
          }
        />
        <Dato icono={<Phone size={15} />} etiqueta="Contacto en sitio" valor={<>{cli.contacto}<span className="mt-0.5 block text-[11px] font-normal text-muted">{cli.telefono}</span></>} />
        <Dato
          icono={<Clock size={15} />}
          etiqueta="Tiempo"
          valor={
            <>
              {duracion(ot.horasReales ?? ot.horasEstimadas)}
              <span className="mt-0.5 block text-[11px] font-normal text-muted">
                {ot.horasReales ? `estimado ${duracion(ot.horasEstimadas)}` : "estimado"}
              </span>
            </>
          }
        />
      </div>

      {cuad && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">Cuadrilla asignada</p>
          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-ink-900 text-brand-400 dark:bg-brand-500/15">
                <HardHat size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-text">{cuad.nombre}</p>
                <p className="text-[11px] text-muted">
                  {cuad.codigo} · unidad {cuad.placaUnidad} · base {cuad.base}
                </p>
              </div>
              <Truck size={16} className="text-faint" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
              {cuad.tecnicoIds.map((id) => {
                const t = tecnico(id)!;
                return (
                  <span key={id} className="flex items-center gap-2 rounded-lg bg-raised py-1 pl-1 pr-2.5">
                    <Avatar iniciales={t.avatar} size="sm" />
                    <span className="text-[11px] font-medium text-text">{t.nombre}</span>
                    <span className="text-[10px] capitalize text-faint">{t.rol}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">Preliquidación</p>
        <div className="rounded-xl border border-line bg-surface p-4 text-[13px]">
          <div className="flex justify-between py-1">
            <span className="text-muted">
              Mano de obra · {duracion(ot.horasReales ?? ot.horasEstimadas)} × {money(ot.tarifaHora)}
            </span>
            <span className="font-medium tabular-nums text-text">{money(costo.manoObra)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted">Materiales · {ot.materiales.length} línea(s)</span>
            <span className="font-medium tabular-nums text-text">{money(costo.materiales)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-line pt-2.5">
            <span className="flex items-center gap-1.5 font-semibold text-text">
              <Wallet size={14} /> Total facturable
            </span>
            <span className="text-base font-bold tabular-nums text-text">{money(costo.total)}</span>
          </div>
        </div>
      </div>

      {ot.firmaCliente && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-4">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-emerald-700 dark:text-emerald-400">
            <FileSignature size={15} /> Conformidad del cliente
          </p>
          <p className="mt-1.5 font-[cursive] text-lg text-text">{ot.firmaCliente}</p>
          {ot.calificacion && (
            <p className="mt-1 flex items-center gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} size={13} className={i < ot.calificacion! ? "fill-brand-500 text-brand-500" : "text-line"} />
              ))}
              <span className="ml-1.5 text-[11px] text-muted">{ot.calificacion} de 5</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- Seguridad / checklist ---------------- */

function Seguridad({ ot }: { ot: OrdenTrabajo }) {
  const marcar = useApp((s) => s.marcarItem);
  const rol = useApp((s) => s.rol);
  const editable = rol === "tecnico" && ot.estado !== "cerrada" && ot.estado !== "completada";
  const hechos = ot.checklist.filter((i) => i.hecho).length;
  const criticosPendientes = ot.checklist.filter((i) => i.critico && !i.hecho).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-line bg-raised px-4 py-3">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-text">
          <ShieldCheck size={16} className="text-brand-500" /> Protocolo de trabajo seguro
        </p>
        <span className="text-[13px] font-bold tabular-nums text-text">
          {hechos}/{ot.checklist.length}
        </span>
      </div>

      {criticosPendientes > 0 && (
        <p className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/8 px-3.5 py-3 text-[12px] leading-relaxed text-rose-700 dark:text-rose-300">
          <Lock size={14} className="mt-0.5 shrink-0" />
          La orden no puede cerrarse: quedan {criticosPendientes} punto(s) crítico(s) sin confirmar.
        </p>
      )}

      <ul className="space-y-2">
        {ot.checklist.map((item) => (
          <li key={item.id}>
            <button
              disabled={!editable}
              onClick={() => marcar(ot.id, item.id)}
              className={cx(
                "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors",
                item.hecho ? "border-emerald-500/30 bg-emerald-500/8" : "border-line bg-surface",
                editable ? "hover:border-brand-500/50" : "cursor-default",
              )}
            >
              <span
                className={cx(
                  "mt-px grid size-5 shrink-0 place-items-center rounded-md border-2 transition-colors",
                  item.hecho ? "border-emerald-500 bg-emerald-500 text-white" : "border-line",
                )}
              >
                {item.hecho && <CircleCheck size={13} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cx("block text-[13px] font-medium", item.hecho ? "text-muted line-through" : "text-text")}>
                  {item.texto}
                </span>
                {item.critico && (
                  <span className="mt-1 inline-block rounded bg-rose-500/12 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                    Crítico
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {!editable && (
        <p className="text-[11px] text-faint">
          El checklist solo es editable desde el rol Técnico mientras la orden está en ejecución.
        </p>
      )}
    </div>
  );
}

/* ---------------- Materiales ---------------- */

function Materiales({ ot }: { ot: OrdenTrabajo }) {
  const { materiales, material, precioMaterial } = useCatalogos();
  const consumir = useApp((s) => s.consumirMaterial);
  const rol = useApp((s) => s.rol);
  const editable = rol === "tecnico" && ot.estado !== "cerrada";
  const [matId, setMatId] = useState(materiales[0].id);
  const [cant, setCant] = useState("1");

  const total = ot.materiales.reduce((a, m) => a + precioMaterial(m.materialId) * m.cantidad, 0);

  return (
    <div className="space-y-4">
      {ot.materiales.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-[13px] text-muted">
          Todavía no se ha registrado consumo de materiales.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-[13px]">
            <thead className="bg-raised text-[11px] uppercase tracking-wide text-faint">
              <tr>
                <th className="px-3.5 py-2.5 text-left font-semibold">Material</th>
                <th className="px-3.5 py-2.5 text-right font-semibold">Cant.</th>
                <th className="px-3.5 py-2.5 text-right font-semibold">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {ot.materiales.map((c) => {
                const m = material(c.materialId)!;
                return (
                  <tr key={c.materialId} className="border-t border-line">
                    <td className="px-3.5 py-3">
                      <p className="font-medium text-text">{m.descripcion}</p>
                      <p className="font-mono text-[11px] text-faint">{m.codigo}</p>
                    </td>
                    <td className="whitespace-nowrap px-3.5 py-3 text-right tabular-nums text-muted">
                      {c.cantidad} {m.unidad}
                    </td>
                    <td className="px-3.5 py-3 text-right font-medium tabular-nums text-text">
                      {money(m.costoUnitario * c.cantidad)}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t border-line bg-raised">
                <td colSpan={2} className="px-3.5 py-2.5 text-right font-semibold text-text">Total materiales</td>
                <td className="px-3.5 py-2.5 text-right font-bold tabular-nums text-text">{money(total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {editable && (
        <div className="rounded-xl border border-line bg-raised p-4">
          <p className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-text">
            <Package size={15} /> Registrar consumo desde la unidad
          </p>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <Campo etiqueta="Material">
              <Selector value={matId} onChange={(e) => setMatId(e.target.value)}>
                {materiales.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.codigo} · {m.descripcion} ({m.stock} disp.)
                  </option>
                ))}
              </Selector>
            </Campo>
            <Campo etiqueta="Cantidad">
              <Entrada type="number" min={1} value={cant} onChange={(e) => setCant(e.target.value)} className="w-24" />
            </Campo>
            <Boton variante="primario" onClick={() => consumir(ot.id, matId, Number(cant) || 0)}>
              <Plus size={15} /> Agregar
            </Boton>
          </div>
          <p className="mt-2.5 text-[11px] text-faint">
            El consumo descuenta el stock de la bodega y dispara la alerta de reorden cuando corresponde.
          </p>
        </div>
      )}
    </div>
  );
}

/* ---------------- Evidencia ---------------- */

function Evidencia({ ot }: { ot: OrdenTrabajo }) {
  const capturar = useApp((s) => s.capturarEvidencia);
  const rol = useApp((s) => s.rol);
  const editable = rol === "tecnico" && ot.estado !== "cerrada";

  return (
    <div className="space-y-4">
      {ot.evidencias.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-[13px] text-muted">
          Sin evidencia fotográfica adjunta.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {ot.evidencias.map((e) => (
            <figure key={e.id} className="overflow-hidden rounded-xl border border-line bg-surface">
              <div
                className="grid aspect-[4/3] place-items-center"
                style={{ background: `linear-gradient(135deg, ${e.tono}22, ${e.tono}05)` }}
              >
                <Camera size={26} style={{ color: e.tono }} />
              </div>
              <figcaption className="border-t border-line px-3 py-2.5">
                <p className="text-[12px] font-medium text-text">{e.titulo}</p>
                <p className="text-[11px] capitalize text-faint">{e.momento} de la intervención</p>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {editable && (
        <div className="flex flex-wrap gap-2">
          <Boton onClick={() => capturar(ot.id, "Registro fotográfico del hallazgo", "antes")}>
            <Camera size={15} /> Adjuntar "antes"
          </Boton>
          <Boton onClick={() => capturar(ot.id, "Trabajo terminado y rotulado", "despues")}>
            <Camera size={15} /> Adjuntar "después"
          </Boton>
        </div>
      )}
      <p className="text-[11px] text-faint">
        En producción cada archivo se sube desde la cámara del dispositivo con marca de agua de fecha,
        hora y coordenadas GPS.
      </p>
    </div>
  );
}

/* ---------------- Bitácora ---------------- */

const TONO_EVENTO: Record<string, string> = {
  creada: "bg-ink-400",
  asignada: "bg-sky-500",
  en_ruta: "bg-indigo-500",
  en_sitio: "bg-brand-500",
  pausada: "bg-orange-500",
  reanudada: "bg-brand-500",
  nota: "bg-ink-300",
  material: "bg-violet-500",
  evidencia: "bg-cyan-500",
  completada: "bg-emerald-500",
  cerrada: "bg-ink-500",
  escalada: "bg-rose-500",
};

function Bitacora({ ot }: { ot: OrdenTrabajo }) {
  const agregarNota = useApp((s) => s.agregarNota);
  const [texto, setTexto] = useState("");

  return (
    <div className="space-y-5">
      <ol className="relative space-y-4 border-l border-line pl-5">
        {ot.eventos.map((e) => (
          <li key={e.id} className="relative">
            <span className={cx("absolute -left-[26px] top-1 size-2.5 rounded-full ring-4 ring-canvas", TONO_EVENTO[e.tipo] ?? "bg-ink-400")} />
            <div className="flex flex-wrap items-baseline gap-x-2">
              <p className="text-[13px] font-semibold text-text">{e.actor}</p>
              <time className="text-[11px] text-faint">{fechaHora(e.ts)} · {hora(e.ts)}</time>
            </div>
            <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{e.detalle}</p>
          </li>
        ))}
      </ol>

      {ot.estado !== "cerrada" && (
        <div className="rounded-xl border border-line bg-raised p-4">
          <Campo etiqueta="Agregar nota a la bitácora">
            <AreaTexto
              rows={3}
              value={texto}
              placeholder="Hallazgos, coordinaciones con el cliente, recomendaciones..."
              onChange={(e) => setTexto(e.target.value)}
            />
          </Campo>
          <div className="mt-3 flex justify-end">
            <Boton
              variante="primario"
              disabled={!texto.trim()}
              onClick={() => { agregarNota(ot.id, texto.trim()); setTexto(""); }}
            >
              Registrar nota
            </Boton>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Barra inferior de acciones ---------------- */

function BarraAcciones({ ot, onFirmar }: { ot: OrdenTrabajo; onFirmar: () => void }) {
  const rol = useApp((s) => s.rol);
  const cambiarEstado = useApp((s) => s.cambiarEstado);
  const asignar = useApp((s) => s.asignar);
  const { cuadrillas } = useCatalogos();
  const [cuadSel, setCuadSel] = useState("");

  const siguiente = SIGUIENTE_ESTADO[ot.estado];
  const disponibles = useMemo(
    () => cuadrillas.filter((c) => c.disponible || c.especialidad.includes(ot.tipo)),
    [cuadrillas, ot.tipo],
  );

  if (ot.estado === "cerrada" || ot.estado === "cancelada") return null;

  if (rol === "despachador" && !ot.cuadrillaId) {
    return (
      <footer className="sticky bottom-0 border-t border-line bg-surface p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-52 flex-1">
            <Campo etiqueta="Asignar a cuadrilla">
              <Selector value={cuadSel} onChange={(e) => setCuadSel(e.target.value)}>
                <option value="">Seleccione una cuadrilla…</option>
                {disponibles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.codigo}) · {c.disponible ? "disponible" : "ocupada"} · {c.base}
                  </option>
                ))}
              </Selector>
            </Campo>
          </div>
          <Boton variante="primario" disabled={!cuadSel} onClick={() => asignar(ot.id, cuadSel)}>
            <Truck size={15} /> Despachar
          </Boton>
        </div>
      </footer>
    );
  }

  if (rol !== "tecnico") return null;

  return (
    <footer className="sticky bottom-0 flex flex-wrap gap-2 border-t border-line bg-surface p-4">
      {ot.estado === "en_sitio" ? (
        <>
          <Boton variante="primario" onClick={onFirmar} className="flex-1">
            <FileSignature size={16} /> Completar y firmar
          </Boton>
          <Boton onClick={() => cambiarEstado(ot.id, "pausada", "Trabajo pausado por falta de repuesto o acceso")}>
            Pausar
          </Boton>
        </>
      ) : siguiente ? (
        <Boton variante="primario" className="flex-1" onClick={() => cambiarEstado(ot.id, siguiente.estado)}>
          <PlayCircle size={16} /> {siguiente.accion}
        </Boton>
      ) : null}
    </footer>
  );
}

/* ---------------- Modal de firma ---------------- */

function ModalFirma({ ot, abierto, onCerrar }: { ot: OrdenTrabajo; abierto: boolean; onCerrar: () => void }) {
  const { cliente } = useCatalogos();
  const cerrarConFirma = useApp((s) => s.cerrarConFirma);
  const cli = cliente(ot.clienteId)!;
  const [firma, setFirma] = useState(cli.contacto);
  const [estrellas, setEstrellas] = useState(5);
  const pendientes = ot.checklist.filter((i) => i.critico && !i.hecho).length;

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Conformidad del cliente">
      <div className="space-y-4">
        <p className="text-[13px] leading-relaxed text-muted">
          Al firmar, la orden <span className="font-mono font-semibold text-text">{ot.folio}</span> queda
          completada y pasa a validación para facturación.
        </p>

        {pendientes > 0 && (
          <p className="rounded-xl border border-rose-500/30 bg-rose-500/8 px-3.5 py-3 text-[12px] font-medium text-rose-700 dark:text-rose-300">
            Quedan {pendientes} punto(s) crítico(s) del checklist de seguridad sin confirmar. El sistema
            bloquea el cierre hasta completarlos.
          </p>
        )}

        <Campo etiqueta="Nombre de quien recibe" hint="Debe coincidir con la persona autorizada del sitio.">
          <Entrada value={firma} onChange={(e) => setFirma(e.target.value)} />
        </Campo>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-muted">Calificación del servicio</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setEstrellas(n)} aria-label={`${n} estrellas`}>
                <Star size={26} className={n <= estrellas ? "fill-brand-500 text-brand-500" : "text-line"} />
              </button>
            ))}
          </div>
        </div>

        <div className="grid place-items-center rounded-xl border-2 border-dashed border-line bg-raised py-6">
          <p className="font-[cursive] text-2xl text-text">{firma || "—"}</p>
          <p className="mt-1 text-[11px] text-faint">Firma capturada en el dispositivo</p>
        </div>

        <div className="flex justify-end gap-2">
          <Boton onClick={onCerrar}>Cancelar</Boton>
          <Boton
            variante="primario"
            disabled={!firma.trim()}
            onClick={() => { cerrarConFirma(ot.id, firma.trim(), estrellas); if (!pendientes) onCerrar(); }}
          >
            <CircleCheck size={16} /> Confirmar cierre
          </Boton>
        </div>
      </div>
    </Modal>
  );
}
