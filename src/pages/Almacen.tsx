import { useMemo, useState } from "react";
import { Boxes, PackageCheck, Search, TriangleAlert, Warehouse } from "lucide-react";
import { useApp, useCatalogos } from "../store/useApp";
import { Encabezado } from "../components/layout/AppShell";
import { Barra, Boton, Card, CardTitle, Entrada, Selector, Stat, cx } from "../components/ui/base";
import { compacto, money } from "../lib/dominio";

const DIA = 86_400_000;

export function Almacen() {
  const ordenes = useApp((s) => s.ordenes);
  const avisar = useApp((s) => s.avisar);
  const { materiales } = useCatalogos();
  const [busqueda, setBusqueda] = useState("");
  const [bodega, setBodega] = useState("");

  const bodegas = useMemo(() => [...new Set(materiales.map((m) => m.bodega))], [materiales]);

  const consumo = useMemo(() => {
    const desde = Date.now() - 30 * DIA;
    const acc: Record<string, number> = {};
    for (const o of ordenes) {
      if (new Date(o.creadaEn).getTime() < desde) continue;
      for (const c of o.materiales) acc[c.materialId] = (acc[c.materialId] ?? 0) + c.cantidad;
    }
    return acc;
  }, [ordenes]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return materiales.filter(
      (m) =>
        (!bodega || m.bodega === bodega) &&
        (!q || m.descripcion.toLowerCase().includes(q) || m.codigo.toLowerCase().includes(q)),
    );
  }, [materiales, busqueda, bodega]);

  const bajos = materiales.filter((m) => m.stock <= m.puntoReorden);
  const valorInventario = materiales.reduce((a, m) => a + m.stock * m.costoUnitario, 0);
  const valorConsumido = Object.entries(consumo).reduce(
    (a, [id, cant]) => a + cant * (materiales.find((m) => m.id === id)?.costoUnitario ?? 0),
    0,
  );

  return (
    <div className="p-4 lg:p-6">
      <Encabezado
        titulo="Almacén de materiales"
        sub="Existencias por bodega, consumo por orden de trabajo y alertas de reorden"
        acciones={
          <Boton
            variante="primario"
            onClick={() =>
              avisar(
                bajos.length
                  ? `Solicitud de compra generada para ${bajos.length} código(s) bajo el punto de reorden`
                  : "No hay materiales bajo el punto de reorden",
                bajos.length ? "ok" : "info",
              )
            }
          >
            <PackageCheck size={16} /> Generar solicitud de compra
          </Boton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat etiqueta="Valor del inventario" valor={compacto(valorInventario)} icono={<Warehouse size={16} />} pie={`${materiales.length} códigos activos`} />
        <Stat etiqueta="Consumo del mes" valor={compacto(valorConsumido)} icono={<Boxes size={16} />} pie="cargado a órdenes de trabajo" />
        <Stat
          etiqueta="Bajo punto de reorden"
          valor={bajos.length}
          icono={<TriangleAlert size={16} />}
          tono={bajos.length ? "alerta" : "bien"}
          pie={bajos.length ? "requieren compra inmediata" : "inventario saludable"}
        />
        <Stat etiqueta="Bodegas" valor={bodegas.length} icono={<Warehouse size={16} />} pie={bodegas.join(" · ")} />
      </div>

      {bajos.length > 0 && (
        <Card className="mt-5 border-rose-500/30 bg-rose-500/5">
          <CardTitle
            titulo="Materiales que frenan la operación"
            sub="Sin estas existencias las cuadrillas deben pausar trabajos en sitio"
          />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {bajos.map((m) => (
              <div key={m.id} className="rounded-xl border border-rose-500/25 bg-surface p-3.5">
                <p className="font-mono text-[11px] font-semibold text-rose-600 dark:text-rose-400">{m.codigo}</p>
                <p className="mt-1 text-[13px] font-medium leading-snug text-text">{m.descripcion}</p>
                <p className="mt-2 text-[11px] text-muted">
                  Quedan <span className="font-bold text-rose-600 dark:text-rose-400">{m.stock} {m.unidad}</span> de un
                  mínimo de {m.puntoReorden} · bodega {m.bodega}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="mt-5" padding={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <div className="relative min-w-56 flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <Entrada
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código o descripción…"
              className="pl-9"
            />
          </div>
          <Selector value={bodega} onChange={(e) => setBodega(e.target.value)} className="w-48">
            <option value="">Todas las bodegas</option>
            {bodegas.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </Selector>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-[13px]">
            <thead className="border-b border-line bg-raised text-[11px] uppercase tracking-wide text-faint">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Código</th>
                <th className="px-4 py-3 text-left font-semibold">Descripción</th>
                <th className="px-4 py-3 text-left font-semibold">Bodega</th>
                <th className="px-4 py-3 text-left font-semibold">Existencia</th>
                <th className="px-4 py-3 text-right font-semibold">Consumo 30 d</th>
                <th className="px-4 py-3 text-right font-semibold">Costo unit.</th>
                <th className="px-4 py-3 text-right font-semibold">Valor</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((m) => {
                const bajo = m.stock <= m.puntoReorden;
                const nivel = Math.min(1, m.stock / Math.max(1, m.puntoReorden * 2.5));
                return (
                  <tr key={m.id} className="border-b border-line last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] font-medium text-muted">{m.codigo}</td>
                    <td className="px-4 py-3 font-medium text-text">{m.descripcion}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{m.bodega}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-20">
                          <Barra pct={nivel} clase={bajo ? "bg-rose-500" : nivel < 0.5 ? "bg-orange-500" : "bg-emerald-500"} />
                        </div>
                        <span className={cx("whitespace-nowrap text-xs font-semibold tabular-nums", bajo ? "text-rose-600 dark:text-rose-400" : "text-text")}>
                          {m.stock} {m.unidad}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-faint">mínimo {m.puntoReorden}</p>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted">{consumo[m.id] ?? 0}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted">{money(m.costoUnitario)}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-text">{money(m.stock * m.costoUnitario)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mt-4 text-[11px] leading-relaxed text-faint">
        Cada consumo registrado por una cuadrilla desde la orden de trabajo descuenta la existencia en línea y,
        al cruzar el punto de reorden, dispara la alerta de compra. Así el costo de materiales llega a la
        factura del cliente sin digitación manual.
      </p>
    </div>
  );
}
