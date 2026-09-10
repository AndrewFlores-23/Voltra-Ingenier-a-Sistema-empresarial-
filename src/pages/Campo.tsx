import { useMemo, useState } from "react";
import {
  BatteryFull, CheckCircle2, ChevronRight, Clock, MapPin, Navigation, Phone,
  Signal, Truck, Wifi,
} from "lucide-react";
import { useApp, useCatalogos } from "../store/useApp";
import { Encabezado } from "../components/layout/AppShell";
import { Avatar, Boton, Card, CardTitle, Selector, Vacio, cx } from "../components/ui/base";
import { PanelOrden } from "../components/ot/PanelOrden";
import { ChipEstado, ChipPrioridad, MedidorSla } from "../components/ot/OtBits";
import {
  ESTADOS_ABIERTOS, SIGUIENTE_ESTADO, duracion, evaluarSla, hora,
} from "../lib/dominio";

export function Campo() {
  const ordenes = useApp((s) => s.ordenes);
  const cuadrillaActivaId = useApp((s) => s.cuadrillaActivaId);
  const setCuadrillaActiva = useApp((s) => s.setCuadrillaActiva);
  const cambiarEstado = useApp((s) => s.cambiarEstado);
  const { cuadrillas, cliente, sitio, tecnico } = useCatalogos();
  const [detalle, setDetalle] = useState<string | null>(null);

  const cuad = cuadrillas.find((c) => c.id === cuadrillaActivaId)!;

  const jornada = useMemo(() => {
    const mias = ordenes.filter((o) => o.cuadrillaId === cuadrillaActivaId);
    const hoy = new Date().toDateString();
    const pendientes = mias
      .filter((o) => ESTADOS_ABIERTOS.includes(o.estado))
      .sort((a, b) => {
        const p = { P1: 0, P2: 1, P3: 2, P4: 3 };
        const activo = (x: typeof a) => (x.estado === "en_sitio" || x.estado === "en_ruta" ? 0 : 1);
        return activo(a) - activo(b) || p[a.prioridad] - p[b.prioridad];
      });
    const cerradasHoy = mias.filter((o) => o.cerradaEn && new Date(o.cerradaEn).toDateString() === hoy);
    return {
      pendientes,
      cerradasHoy,
      horas: cerradasHoy.reduce((a, o) => a + (o.horasReales ?? 0), 0),
      enCurso: pendientes.find((o) => o.estado === "en_sitio" || o.estado === "en_ruta"),
    };
  }, [ordenes, cuadrillaActivaId]);

  return (
    <div className="p-4 lg:p-6">
      <Encabezado
        titulo="Mi jornada"
        sub="Vista que usa la cuadrilla en el teléfono durante el turno"
        acciones={
          <Selector
            value={cuadrillaActivaId}
            onChange={(e) => setCuadrillaActiva(e.target.value)}
            className="w-56"
          >
            {cuadrillas.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre} · {c.codigo}</option>
            ))}
          </Selector>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
        {/* Teléfono */}
        <div className="mx-auto w-full max-w-sm">
          <div className="rounded-[2.25rem] border-[10px] border-ink-900 bg-ink-900 shadow-2xl dark:border-ink-800 dark:bg-ink-800">
            <div className="overflow-hidden rounded-[1.6rem] bg-canvas">
              {/* Barra de estado */}
              <div className="flex items-center justify-between bg-ink-900 px-5 pb-2 pt-2.5 text-[10px] font-semibold text-white">
                <span>{hora(new Date().toISOString())}</span>
                <span className="flex items-center gap-1">
                  <Signal size={11} /> <Wifi size={11} /> <BatteryFull size={13} />
                </span>
              </div>

              {/* Encabezado de la cuadrilla */}
              <div className="bg-ink-900 px-5 pb-5 pt-1 text-white">
                <p className="text-[11px] text-ink-400">Turno {cuad.turno} · unidad {cuad.placaUnidad}</p>
                <p className="text-lg font-bold tracking-tight">{cuad.nombre}</p>
                <div className="mt-3 flex gap-2">
                  <Metrica valor={jornada.pendientes.length} texto="pendientes" />
                  <Metrica valor={jornada.cerradasHoy.length} texto="cerradas hoy" />
                  <Metrica valor={duracion(jornada.horas)} texto="trabajadas" />
                </div>
              </div>

              {/* Lista de trabajos */}
              <div className="max-h-[30rem] space-y-3 overflow-y-auto bg-canvas p-4">
                {jornada.pendientes.length === 0 ? (
                  <Vacio icono={<CheckCircle2 size={20} />} titulo="Jornada al día" texto="No hay órdenes pendientes para esta cuadrilla." />
                ) : (
                  jornada.pendientes.map((ot) => {
                    const cli = cliente(ot.clienteId);
                    const sit = sitio(ot.sitioId);
                    const siguiente = SIGUIENTE_ESTADO[ot.estado];
                    const activa = ot.estado === "en_sitio" || ot.estado === "en_ruta";
                    const hechos = ot.checklist.filter((i) => i.hecho).length;
                    return (
                      <div
                        key={ot.id}
                        className={cx(
                          "rounded-2xl border bg-surface p-4 transition-shadow",
                          activa ? "border-brand-500 shadow-md ring-1 ring-brand-500/20" : "border-line",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <ChipPrioridad prioridad={ot.prioridad} />
                          <ChipEstado estado={ot.estado} />
                        </div>

                        <h3 className="mt-2.5 text-[14px] font-semibold leading-snug text-text">{ot.titulo}</h3>

                        <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-snug text-muted">
                          <MapPin size={12} className="mt-px shrink-0" />
                          <span>{cli?.nombre}<br />{sit?.nombre}, {sit?.canton}</span>
                        </p>

                        <div className="mt-3"><MedidorSla ot={ot} /></div>

                        <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 size={12} /> Seguridad {hechos}/{ot.checklist.length}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {duracion(ot.horasEstimadas)} est.
                          </span>
                        </div>

                        <div className="mt-3 flex gap-2">
                          {siguiente && (
                            <Boton
                              variante="primario"
                              tamano="sm"
                              className="flex-1"
                              onClick={() => cambiarEstado(ot.id, siguiente.estado)}
                            >
                              {siguiente.accion}
                            </Boton>
                          )}
                          <Boton tamano="sm" onClick={() => setDetalle(ot.id)}>
                            Abrir <ChevronRight size={13} />
                          </Boton>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-[11px] text-faint">
            La misma aplicación web, adaptada al teléfono de la cuadrilla.
          </p>
        </div>

        {/* Contexto de la jornada */}
        <div className="space-y-5">
          {jornada.enCurso && (
            <Card className="border-brand-500/40 bg-brand-500/5">
              <CardTitle
                titulo="Trabajo en curso"
                sub="Lo que la cuadrilla está atendiendo en este momento"
                accion={<ChipEstado estado={jornada.enCurso.estado} />}
              />
              <p className="text-[15px] font-semibold text-text">{jornada.enCurso.titulo}</p>
              <p className="mt-1 text-[13px] text-muted">
                {cliente(jornada.enCurso.clienteId)?.nombre} · {sitio(jornada.enCurso.sitioId)?.nombre}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Boton variante="primario" onClick={() => setDetalle(jornada.enCurso!.id)}>
                  Abrir orden completa
                </Boton>
                <Boton>
                  <Navigation size={15} /> Cómo llegar
                </Boton>
                <Boton>
                  <Phone size={15} /> Llamar al contacto
                </Boton>
              </div>
              <p className="mt-3 text-[11px] text-faint">
                Vencimiento del compromiso: {evaluarSla(jornada.enCurso).etiqueta.toLowerCase()}.
              </p>
            </Card>
          )}

          <Card>
            <CardTitle titulo="Integrantes de la cuadrilla" sub={`Base ${cuad.base} · unidad ${cuad.placaUnidad}`} />
            <ul className="space-y-3">
              {cuad.tecnicoIds.map((id) => {
                const t = tecnico(id)!;
                return (
                  <li key={id} className="flex items-center gap-3">
                    <Avatar iniciales={t.avatar} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-text">{t.nombre}</p>
                      <p className="text-[11px] capitalize text-muted">{t.rol} · {t.telefono}</p>
                    </div>
                    <div className="hidden flex-wrap justify-end gap-1 sm:flex">
                      {t.certificaciones.map((c) => (
                        <span key={c} className="rounded-md bg-raised px-1.5 py-0.5 text-[10px] font-medium text-muted ring-1 ring-inset ring-line">
                          {c}
                        </span>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <CardTitle titulo="Cerradas hoy" sub="Trabajos completados en el turno" />
            {jornada.cerradasHoy.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-muted">Todavía no hay cierres registrados hoy.</p>
            ) : (
              <ul className="divide-y divide-line">
                {jornada.cerradasHoy.map((o) => (
                  <li key={o.id} className="flex items-center gap-3 py-2.5">
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-text">{o.titulo}</p>
                      <p className="text-[11px] text-muted">
                        {cliente(o.clienteId)?.nombre} · {o.folio}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-[11px] font-medium tabular-nums text-muted">
                      {duracion(o.horasReales ?? 0)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="bg-raised">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-text">
              <Truck size={15} /> Cómo se ve en la práctica
            </p>
            <ol className="mt-3 space-y-2 text-[12px] leading-relaxed text-muted">
              <li><span className="font-semibold text-text">1.</span> Despacho asigna la orden y la cuadrilla la recibe en el teléfono.</li>
              <li><span className="font-semibold text-text">2.</span> "Iniciar traslado" y "Registrar llegada" detienen el reloj de SLA.</li>
              <li><span className="font-semibold text-text">3.</span> En sitio se completa el checklist de seguridad, se registran materiales y se adjunta evidencia.</li>
              <li><span className="font-semibold text-text">4.</span> El cliente firma; la orden queda lista para facturar sin papelería de por medio.</li>
            </ol>
          </Card>
        </div>
      </div>

      <PanelOrden otId={detalle} onCerrar={() => setDetalle(null)} />
    </div>
  );
}

function Metrica({ valor, texto }: { valor: string | number; texto: string }) {
  return (
    <div className="flex-1 rounded-xl bg-white/10 px-2.5 py-2 text-center">
      <p className="text-base font-bold leading-none tabular-nums">{valor}</p>
      <p className="mt-1 text-[10px] text-ink-300">{texto}</p>
    </div>
  );
}
