import { useMemo, useState } from "react";
import { Building2, MapPin, Phone, ShieldCheck, Zap } from "lucide-react";
import { useApp, useCatalogos } from "../store/useApp";
import { Encabezado } from "../components/layout/AppShell";
import { Barra, Card, CardTitle, cx } from "../components/ui/base";
import { MapaOperacion } from "../components/mapa/MapaOperacion";
import { PanelOrden } from "../components/ot/PanelOrden";
import { ChipEstado } from "../components/ot/OtBits";
import { ESTADOS_ABIERTOS, costoOT, cumplioSla, money } from "../lib/dominio";

const DIA = 86_400_000;

const COLOR_CONTRATO = {
  platino: "bg-ink-900 text-brand-300 dark:bg-brand-500 dark:text-ink-950",
  oro: "bg-brand-500/15 text-brand-700 dark:text-brand-400 ring-1 ring-inset ring-brand-500/30",
  plata: "bg-raised text-muted ring-1 ring-inset ring-line",
};

const SECTOR = {
  industrial: "Industrial",
  comercial: "Comercial",
  residencial: "Residencial",
  institucional: "Institucional",
  distribucion: "Distribución eléctrica",
};

export function Clientes() {
  const ordenes = useApp((s) => s.ordenes);
  const { clientes, sitios, precioMaterial } = useCatalogos();
  const [seleccionado, setSeleccionado] = useState(clientes[0].id);
  const [detalle, setDetalle] = useState<string | null>(null);

  const resumen = useMemo(() => {
    const desde = Date.now() - 30 * DIA;
    return clientes.map((c) => {
      const suyas = ordenes.filter((o) => o.clienteId === c.id);
      const recientes = suyas.filter((o) => new Date(o.creadaEn).getTime() >= desde);
      const atendidas = recientes.filter((o) => o.iniciadaEn && o.estado !== "cancelada");
      return {
        cliente: c,
        abiertas: suyas.filter((o) => ESTADOS_ABIERTOS.includes(o.estado)),
        totales: suyas.length,
        cumplimiento: atendidas.length
          ? (atendidas.filter((o) => cumplioSla(o)).length / atendidas.length) * 100
          : 100,
        facturado: suyas
          .filter((o) => o.cerradaEn && new Date(o.cerradaEn).getTime() >= desde)
          .reduce((a, o) => a + costoOT(o, precioMaterial).total, 0),
      };
    });
  }, [clientes, ordenes, precioMaterial]);

  const activo = resumen.find((r) => r.cliente.id === seleccionado)!;
  const sitiosCliente = sitios.filter((s) => s.clienteId === seleccionado);
  const ordenesCliente = ordenes.filter((o) => o.clienteId === seleccionado).slice(0, 8);

  return (
    <div className="p-4 lg:p-6">
      <Encabezado
        titulo="Clientes y sitios"
        sub="Cartera, nivel de contrato y desempeño del servicio por cuenta"
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className="space-y-2.5">
          {resumen.map((r) => {
            const c = r.cliente;
            const activoAqui = c.id === seleccionado;
            return (
              <button
                key={c.id}
                onClick={() => setSeleccionado(c.id)}
                className={cx(
                  "w-full rounded-xl border bg-surface p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
                  activoAqui ? "border-brand-500 ring-2 ring-brand-500/20" : "border-line",
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-raised text-muted">
                    <Building2 size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-text">{c.nombre}</p>
                    <p className="text-[11px] text-muted">{SECTOR[c.sector]}</p>
                  </div>
                  <span className={cx("rounded-full px-2 py-0.5 text-[10px] font-bold capitalize", COLOR_CONTRATO[c.contratoSla])}>
                    {c.contratoSla}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-4 text-[11px] text-muted">
                  <span>{r.totales} OT históricas</span>
                  {r.abiertas.length > 0 && (
                    <span className="font-semibold text-brand-600 dark:text-brand-400">
                      {r.abiertas.length} abierta(s)
                    </span>
                  )}
                  <span className="ml-auto font-medium tabular-nums text-text">{money(r.facturado)}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-5">
          <Card>
            <CardTitle
              titulo={activo.cliente.nombre}
              sub={`${SECTOR[activo.cliente.sector]} · cédula jurídica ${activo.cliente.cedulaJuridica}`}
              accion={
                <span className={cx("rounded-full px-3 py-1 text-[11px] font-bold capitalize", COLOR_CONTRATO[activo.cliente.contratoSla])}>
                  Contrato {activo.cliente.contratoSla}
                </span>
              }
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-raised p-3.5">
                <p className="text-[10px] uppercase tracking-wide text-faint">Facturado 30 días</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-text">{money(activo.facturado)}</p>
              </div>
              <div className="rounded-xl bg-raised p-3.5">
                <p className="text-[10px] uppercase tracking-wide text-faint">Cumplimiento de SLA</p>
                <p
                  className={cx(
                    "mt-1 text-lg font-bold tabular-nums",
                    activo.cumplimiento >= 90 ? "text-emerald-600 dark:text-emerald-400" : "text-orange-500",
                  )}
                >
                  {activo.cumplimiento.toFixed(0)} %
                </p>
                <Barra
                  pct={activo.cumplimiento / 100}
                  clase={activo.cumplimiento >= 90 ? "bg-emerald-500" : "bg-orange-500"}
                />
              </div>
              <div className="rounded-xl bg-raised p-3.5">
                <p className="text-[10px] uppercase tracking-wide text-faint">Contacto autorizado</p>
                <p className="mt-1 text-[13px] font-semibold text-text">{activo.cliente.contacto}</p>
                <p className="flex items-center gap-1 text-[11px] text-muted">
                  <Phone size={11} /> {activo.cliente.telefono}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-line bg-surface p-3.5">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-brand-500" />
              <p className="text-[12px] leading-relaxed text-muted">
                El contrato <span className="font-semibold capitalize text-text">{activo.cliente.contratoSla}</span>{" "}
                aplica un factor de{" "}
                <span className="font-semibold text-text">
                  {activo.cliente.contratoSla === "platino" ? "0.75" : activo.cliente.contratoSla === "oro" ? "1.00" : "1.35"}
                </span>{" "}
                sobre el tiempo base de respuesta. Una emergencia P1 debe atenderse en{" "}
                <span className="font-semibold text-text">
                  {activo.cliente.contratoSla === "platino" ? "3 h" : activo.cliente.contratoSla === "oro" ? "4 h" : "5 h 24 m"}
                </span>.
              </p>
            </div>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardTitle titulo="Sitios atendidos" sub={`${sitiosCliente.length} ubicación(es) bajo contrato`} />
              <ul className="space-y-2.5">
                {sitiosCliente.map((s) => (
                  <li key={s.id} className="flex items-start gap-2.5 rounded-xl border border-line p-3">
                    <MapPin size={15} className="mt-0.5 shrink-0 text-faint" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-text">{s.nombre}</p>
                      <p className="text-[11px] text-muted">{s.distrito}, {s.canton}</p>
                    </div>
                    <span className="flex items-center gap-1 whitespace-nowrap rounded-md bg-raised px-1.5 py-0.5 text-[10px] font-semibold capitalize text-muted">
                      <Zap size={10} /> {s.tension}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card padding={false} className="overflow-hidden">
              <div className="border-b border-line px-5 py-3.5">
                <h2 className="text-[15px] font-semibold tracking-tight text-text">Ubicación de los sitios</h2>
                <p className="mt-0.5 text-xs text-muted">Órdenes registradas para esta cuenta</p>
              </div>
              <MapaOperacion
                ordenes={ordenes.filter((o) => o.clienteId === seleccionado && ESTADOS_ABIERTOS.includes(o.estado))}
                mostrarCuadrillas={false}
                className="h-72 w-full"
              />
            </Card>
          </div>

          <Card>
            <CardTitle titulo="Últimas órdenes de la cuenta" sub="Ocho registros más recientes" />
            <ul className="divide-y divide-line">
              {ordenesCliente.map((o) => (
                <li key={o.id}>
                  <button onClick={() => setDetalle(o.id)} className="flex w-full items-center gap-3 py-3 text-left hover:opacity-80">
                    <span className="font-mono text-[11px] text-muted">{o.folio}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-text">{o.titulo}</span>
                    <ChipEstado estado={o.estado} />
                    <span className="hidden whitespace-nowrap text-[12px] font-medium tabular-nums text-muted sm:block">
                      {money(costoOT(o, precioMaterial).total)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <PanelOrden otId={detalle} onCerrar={() => setDetalle(null)} />
    </div>
  );
}
