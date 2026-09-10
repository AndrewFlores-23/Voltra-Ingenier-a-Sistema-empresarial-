import { useMemo } from "react";
import {
  Area, Bar, BarChart, CartesianGrid, Cell, Legend, Line, ComposedChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Banknote, Gauge, Star, Timer, TrendingUp, Wrench } from "lucide-react";
import { useApp, useCatalogos } from "../store/useApp";
import { Encabezado } from "../components/layout/AppShell";
import { Avatar, Barra, Card, CardTitle, Stat, cx } from "../components/ui/base";
import {
  ETIQUETA_ESTADO, ETIQUETA_TIPO, HEX_ESTADO, HEX_TIPO, compacto, costoOT,
  cumplioSla, estaAbierta, money,
} from "../lib/dominio";

const DIA = 86_400_000;

export function Tablero() {
  const ordenes = useApp((s) => s.ordenes);
  const tema = useApp((s) => s.tema);
  const { clientes, cuadrillas, tecnico, precioMaterial } = useCatalogos();

  const ejes = tema === "oscuro" ? "#475569" : "#cbd5e1";
  const texto = tema === "oscuro" ? "#94a3b8" : "#64748b";
  const tooltipEstilo = {
    background: tema === "oscuro" ? "#0f172a" : "#ffffff",
    border: `1px solid ${tema === "oscuro" ? "#1e293b" : "#e2e8f0"}`,
    borderRadius: 12,
    fontSize: 12,
    color: tema === "oscuro" ? "#e2e8f0" : "#0f172a",
    boxShadow: "0 10px 30px rgb(2 6 23 / .18)",
  };

  const m = useMemo(() => {
    const ahora = Date.now();
    const atendidas = ordenes.filter((o) => o.iniciadaEn && o.estado !== "cancelada");
    const ventana = (desde: number, hasta: number) =>
      atendidas.filter((o) => {
        const t = new Date(o.creadaEn).getTime();
        return t >= ahora - desde * DIA && t < ahora - hasta * DIA;
      });

    const pct = (arr: typeof ordenes) =>
      arr.length ? (arr.filter((o) => cumplioSla(o)).length / arr.length) * 100 : 0;

    const mes = ventana(30, 0);
    const mesPrevio = ventana(60, 30);

    const respuesta = (arr: typeof ordenes) =>
      arr.length
        ? arr.reduce((a, o) => a + (new Date(o.iniciadaEn!).getTime() - new Date(o.creadaEn).getTime()), 0) /
          arr.length / 3_600_000
        : 0;

    const facturables = ordenes.filter(
      (o) => o.cerradaEn && new Date(o.cerradaEn).getTime() >= ahora - 30 * DIA,
    );
    const ingresos = facturables.reduce((a, o) => a + costoOT(o, precioMaterial).total, 0);
    const ingresosPrevios = ordenes
      .filter((o) => {
        if (!o.cerradaEn) return false;
        const t = new Date(o.cerradaEn).getTime();
        return t >= ahora - 60 * DIA && t < ahora - 30 * DIA;
      })
      .reduce((a, o) => a + costoOT(o, precioMaterial).total, 0);

    // Serie semanal de cumplimiento
    const semanas = Array.from({ length: 9 }, (_, i) => {
      const fin = ahora - (8 - i) * 7 * DIA;
      const ini = fin - 7 * DIA;
      const arr = atendidas.filter((o) => {
        const t = new Date(o.creadaEn).getTime();
        return t >= ini && t < fin;
      });
      return {
        semana: new Date(fin).toLocaleDateString("es-CR", { day: "2-digit", month: "short" }),
        cumplimiento: Math.round(pct(arr)),
        respuesta: Math.round(respuesta(arr) * 10) / 10,
        ordenes: arr.length,
      };
    });

    // Volumen por tipo y semana
    const volumen = Array.from({ length: 6 }, (_, i) => {
      const fin = ahora - (5 - i) * 7 * DIA;
      const ini = fin - 7 * DIA;
      const arr = ordenes.filter((o) => {
        const t = new Date(o.creadaEn).getTime();
        return t >= ini && t < fin;
      });
      const fila: Record<string, string | number> = {
        semana: new Date(fin).toLocaleDateString("es-CR", { day: "2-digit", month: "short" }),
      };
      for (const tipo of Object.keys(ETIQUETA_TIPO)) {
        fila[tipo] = arr.filter((o) => o.tipo === tipo).length;
      }
      return fila;
    });

    // Distribución de la carga abierta
    const abiertas = ordenes.filter(estaAbierta);
    const porEstado = Object.entries(
      abiertas.reduce<Record<string, number>>((acc, o) => {
        acc[o.estado] = (acc[o.estado] ?? 0) + 1;
        return acc;
      }, {}),
    ).map(([estado, valor]) => ({ estado, nombre: ETIQUETA_ESTADO[estado as keyof typeof ETIQUETA_ESTADO], valor }));

    // Facturación por cliente
    const porCliente = clientes
      .map((c) => ({
        nombre: c.nombre.length > 26 ? c.nombre.slice(0, 24) + "…" : c.nombre,
        monto: facturables.filter((o) => o.clienteId === c.id).reduce((a, o) => a + costoOT(o, precioMaterial).total, 0),
      }))
      .filter((c) => c.monto > 0)
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 6);

    // Desempeño por cuadrilla
    const ranking = cuadrillas
      .map((c) => {
        const suyas = atendidas.filter((o) => o.cuadrillaId === c.id);
        const delMes = suyas.filter((o) => new Date(o.creadaEn).getTime() >= ahora - 30 * DIA);
        const califs = suyas.filter((o) => o.calificacion).map((o) => o.calificacion!);
        return {
          cuadrilla: c,
          ots: delMes.length,
          cumplimiento: pct(delMes),
          horas: Math.round(delMes.reduce((a, o) => a + (o.horasReales ?? 0), 0)),
          calificacion: califs.length ? califs.reduce((a, b) => a + b, 0) / califs.length : 0,
        };
      })
      .sort((a, b) => b.cumplimiento - a.cumplimiento);

    return {
      cumplimiento: pct(mes),
      cumplimientoPrevio: pct(mesPrevio),
      respuesta: respuesta(mes),
      respuestaPrevia: respuesta(mesPrevio),
      cerradas: facturables.length,
      ingresos,
      ingresosPrevios,
      abiertas: abiertas.length,
      semanas,
      volumen,
      porEstado,
      porCliente,
      ranking,
      satisfaccion:
        facturables.filter((o) => o.calificacion).reduce((a, o) => a + o.calificacion!, 0) /
        Math.max(1, facturables.filter((o) => o.calificacion).length),
    };
  }, [ordenes, clientes, cuadrillas, precioMaterial]);

  const deltaCumplimiento = m.cumplimiento - m.cumplimientoPrevio;
  const deltaRespuesta = m.respuesta - m.respuestaPrevia;
  const deltaIngresos = m.ingresosPrevios ? ((m.ingresos - m.ingresosPrevios) / m.ingresosPrevios) * 100 : 0;

  return (
    <div className="p-4 lg:p-6">
      <Encabezado
        titulo="Tablero gerencial"
        sub="Indicadores operativos y financieros de los últimos 30 días"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          etiqueta="Cumplimiento de SLA"
          valor={m.cumplimiento.toFixed(1)}
          sufijo="%"
          icono={<Gauge size={16} />}
          tono={m.cumplimiento >= 90 ? "bien" : "alerta"}
          delta={{ valor: `${Math.abs(deltaCumplimiento).toFixed(1)} pp`, positivo: deltaCumplimiento >= 0 }}
          pie="vs. 30 días previos"
        />
        <Stat
          etiqueta="Tiempo medio de respuesta"
          valor={m.respuesta.toFixed(1)}
          sufijo="h"
          icono={<Timer size={16} />}
          delta={{ valor: `${Math.abs(deltaRespuesta).toFixed(1)} h`, positivo: deltaRespuesta <= 0 }}
          pie="desde el reporte hasta llegar al sitio"
        />
        <Stat
          etiqueta="Órdenes facturables"
          valor={m.cerradas}
          icono={<Wrench size={16} />}
          pie={`${m.abiertas} abiertas en este momento`}
        />
        <Stat
          etiqueta="Ingreso del período"
          valor={compacto(m.ingresos)}
          icono={<Banknote size={16} />}
          tono="bien"
          delta={{ valor: `${Math.abs(deltaIngresos).toFixed(0)} %`, positivo: deltaIngresos >= 0 }}
          pie="mano de obra + materiales"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardTitle
            titulo="Cumplimiento de SLA y tiempo de respuesta"
            sub="Nueve semanas de operación · meta contractual de 90 %"
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={m.semanas} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCumpl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={ejes} strokeOpacity={0.35} vertical={false} />
                <XAxis dataKey="semana" tick={{ fontSize: 11, fill: texto }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="l" domain={[60, 100]} unit="%" tick={{ fontSize: 11, fill: texto }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="r" orientation="right" unit=" h" tick={{ fontSize: 11, fill: texto }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={tooltipEstilo}
                  formatter={(v, n) => [
                    n === "cumplimiento" ? `${v} %` : `${v} h`,
                    n === "cumplimiento" ? "Cumplimiento" : "Respuesta",
                  ]}
                />
                <Area yAxisId="l" type="monotone" dataKey="cumplimiento" stroke="#22c55e" strokeWidth={2.5} fill="url(#gradCumpl)" />
                <Line yAxisId="r" type="monotone" dataKey="respuesta" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 flex items-center gap-2 text-[11px] text-muted">
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-emerald-500" /> Cumplimiento</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-brand-500" /> Horas de respuesta</span>
          </p>
        </Card>

        <Card>
          <CardTitle titulo="Carga abierta" sub={`${m.abiertas} órdenes en curso`} />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={m.porEstado} dataKey="valor" nameKey="nombre" innerRadius={54} outerRadius={82} paddingAngle={3} stroke="none">
                  {m.porEstado.map((d) => (
                    <Cell key={d.estado} fill={HEX_ESTADO[d.estado]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipEstilo} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1.5">
            {m.porEstado.map((d) => (
              <li key={d.estado} className="flex items-center gap-2 text-[12px]">
                <span className="size-2.5 rounded-full" style={{ background: HEX_ESTADO[d.estado] }} />
                <span className="flex-1 text-muted">{d.nombre}</span>
                <span className="font-semibold tabular-nums text-text">{d.valor}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card>
          <CardTitle titulo="Volumen por tipo de trabajo" sub="Órdenes ingresadas por semana" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={m.volumen} margin={{ top: 6, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={ejes} strokeOpacity={0.35} vertical={false} />
                <XAxis dataKey="semana" tick={{ fontSize: 11, fill: texto }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: texto }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipEstilo} cursor={{ fill: ejes, fillOpacity: 0.12 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: texto }} iconType="circle" iconSize={8} />
                {Object.entries(ETIQUETA_TIPO).map(([k, v]) => (
                  <Bar key={k} dataKey={k} name={v} stackId="a" fill={HEX_TIPO[k as keyof typeof HEX_TIPO]} radius={k === "inspeccion" ? [4, 4, 0, 0] : undefined} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle titulo="Facturación por cliente" sub="Órdenes cerradas en los últimos 30 días" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={m.porCliente} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={ejes} strokeOpacity={0.35} horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => compacto(v)} tick={{ fontSize: 11, fill: texto }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="nombre" width={150} tick={{ fontSize: 11, fill: texto }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipEstilo} cursor={{ fill: ejes, fillOpacity: 0.12 }} formatter={(v) => [money(Number(v)), "Facturable"]} />
                <Bar dataKey="monto" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <CardTitle
          titulo="Desempeño por cuadrilla"
          sub="Últimos 30 días"
          accion={
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <Star size={13} className="fill-brand-500 text-brand-500" />
              Satisfacción media {m.satisfaccion.toFixed(1)} / 5
            </span>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem] text-[13px]">
            <thead className="text-[11px] uppercase tracking-wide text-faint">
              <tr className="border-b border-line">
                <th className="pb-2.5 text-left font-semibold">Cuadrilla</th>
                <th className="pb-2.5 text-left font-semibold">Integrantes</th>
                <th className="pb-2.5 text-right font-semibold">OT</th>
                <th className="pb-2.5 text-right font-semibold">Horas</th>
                <th className="pb-2.5 text-left font-semibold">Cumplimiento</th>
                <th className="pb-2.5 text-right font-semibold">Calificación</th>
              </tr>
            </thead>
            <tbody>
              {m.ranking.map((r) => (
                <tr key={r.cuadrilla.id} className="border-b border-line last:border-0">
                  <td className="py-3">
                    <p className="font-semibold text-text">{r.cuadrilla.nombre}</p>
                    <p className="text-[11px] text-muted">{r.cuadrilla.codigo} · {r.cuadrilla.base}</p>
                  </td>
                  <td className="py-3">
                    <div className="flex -space-x-1.5">
                      {r.cuadrilla.tecnicoIds.map((id) => {
                        const t = tecnico(id);
                        return t ? (
                          <span key={id} className="rounded-full ring-2 ring-surface" title={t.nombre}>
                            <Avatar iniciales={t.avatar} size="sm" />
                          </span>
                        ) : null;
                      })}
                    </div>
                  </td>
                  <td className="py-3 text-right font-medium tabular-nums text-text">{r.ots}</td>
                  <td className="py-3 text-right tabular-nums text-muted">{r.horas} h</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-24">
                        <Barra
                          pct={r.cumplimiento / 100}
                          clase={r.cumplimiento >= 90 ? "bg-emerald-500" : r.cumplimiento >= 80 ? "bg-orange-500" : "bg-rose-500"}
                        />
                      </div>
                      <span
                        className={cx(
                          "text-xs font-semibold tabular-nums",
                          r.cumplimiento >= 90 ? "text-emerald-600 dark:text-emerald-400" : r.cumplimiento >= 80 ? "text-orange-500" : "text-rose-600 dark:text-rose-400",
                        )}
                      >
                        {r.cumplimiento.toFixed(0)} %
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    <span className="inline-flex items-center gap-1 font-medium tabular-nums text-text">
                      <Star size={12} className="fill-brand-500 text-brand-500" />
                      {r.calificacion.toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mt-5 flex items-center gap-2 text-[11px] text-faint">
        <TrendingUp size={13} />
        Los indicadores se recalculan sobre los datos vivos de la demostración: cierre una orden desde el
        rol Técnico y verá moverse el cumplimiento y la facturación.
      </p>
    </div>
  );
}
