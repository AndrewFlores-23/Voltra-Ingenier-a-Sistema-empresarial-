import { useMemo, useState } from "react";
import { Download, Filter, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useApp, useCatalogos } from "../store/useApp";
import { Encabezado } from "../components/layout/AppShell";
import { Boton, Card, Entrada, Selector, Vacio, cx } from "../components/ui/base";
import { ChipEstado, ChipPrioridad, ChipTipo, MedidorSla } from "../components/ot/OtBits";
import { PanelOrden } from "../components/ot/PanelOrden";
import { ModalNuevaOrden } from "./NuevaOrden";
import {
  ETIQUETA_ESTADO, ETIQUETA_TIPO, costoOT, cumplioSla, fechaHora, money,
} from "../lib/dominio";

const POR_PAGINA = 14;

export function Ordenes() {
  const ordenes = useApp((s) => s.ordenes);
  const rol = useApp((s) => s.rol);
  const cuadrillaActivaId = useApp((s) => s.cuadrillaActivaId);
  const avisar = useApp((s) => s.avisar);
  const { cliente, sitio, cuadrilla, cuadrillas, precioMaterial } = useCatalogos();

  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [tipo, setTipo] = useState("");
  const [cuad, setCuad] = useState("");
  const [pagina, setPagina] = useState(0);
  const [detalle, setDetalle] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return ordenes.filter((o) => {
      // El técnico solo ve el trabajo de su propia cuadrilla
      if (rol === "tecnico" && o.cuadrillaId !== cuadrillaActivaId) return false;
      if (estado && o.estado !== estado) return false;
      if (tipo && o.tipo !== tipo) return false;
      if (cuad && o.cuadrillaId !== cuad) return false;
      if (!q) return true;
      const cli = cliente(o.clienteId)?.nombre ?? "";
      const sit = sitio(o.sitioId)?.nombre ?? "";
      return (
        o.folio.toLowerCase().includes(q) ||
        o.titulo.toLowerCase().includes(q) ||
        cli.toLowerCase().includes(q) ||
        sit.toLowerCase().includes(q)
      );
    });
  }, [ordenes, busqueda, estado, tipo, cuad, rol, cuadrillaActivaId, cliente, sitio]);

  const paginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const pag = Math.min(pagina, paginas - 1);
  const visibles = filtradas.slice(pag * POR_PAGINA, (pag + 1) * POR_PAGINA);

  const resumen = useMemo(() => {
    const atendidas = filtradas.filter((o) => o.iniciadaEn && o.estado !== "cancelada");
    return {
      total: filtradas.length,
      cumplimiento: atendidas.length
        ? (atendidas.filter((o) => cumplioSla(o)).length / atendidas.length) * 100
        : 0,
      facturable: filtradas
        .filter((o) => o.estado === "cerrada" || o.estado === "completada")
        .reduce((a, o) => a + costoOT(o, precioMaterial).total, 0),
    };
  }, [filtradas, precioMaterial]);

  const limpiar = () => { setBusqueda(""); setEstado(""); setTipo(""); setCuad(""); setPagina(0); };

  return (
    <div className="p-4 lg:p-6">
      <Encabezado
        titulo="Órdenes de trabajo"
        sub={
          rol === "tecnico"
            ? "Historial de su cuadrilla"
            : "Historial completo con filtros, SLA y valor facturable"
        }
        acciones={
          <>
            <Boton onClick={() => avisar("Exportación a Excel disponible en la versión de producción", "info")}>
              <Download size={15} /> Exportar
            </Boton>
            {rol !== "tecnico" && (
              <Boton variante="primario" onClick={() => setCreando(true)}>
                <Plus size={16} /> Nueva orden
              </Boton>
            )}
          </>
        }
      />

      <Card className="mb-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto]">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <Entrada
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPagina(0); }}
              placeholder="Buscar por folio, trabajo, cliente o sitio…"
              className="pl-9"
            />
          </div>
          <Selector value={estado} onChange={(e) => { setEstado(e.target.value); setPagina(0); }} className="lg:w-44">
            <option value="">Todos los estados</option>
            {Object.entries(ETIQUETA_ESTADO).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Selector>
          <Selector value={tipo} onChange={(e) => { setTipo(e.target.value); setPagina(0); }} className="lg:w-40">
            <option value="">Todos los tipos</option>
            {Object.entries(ETIQUETA_TIPO).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Selector>
          {rol !== "tecnico" && (
            <Selector value={cuad} onChange={(e) => { setCuad(e.target.value); setPagina(0); }} className="lg:w-44">
              <option value="">Todas las cuadrillas</option>
              {cuadrillas.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </Selector>
          )}
          <Boton onClick={limpiar} variante="fantasma">
            <Filter size={15} /> Limpiar
          </Boton>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-3.5 text-xs">
          <span className="flex items-center gap-1.5 text-muted">
            <SlidersHorizontal size={13} />
            <span className="font-semibold text-text">{resumen.total}</span> orden(es) en el filtro
          </span>
          <span className="text-muted">
            Cumplimiento de SLA{" "}
            <span className={cx("font-semibold", resumen.cumplimiento >= 90 ? "text-emerald-600 dark:text-emerald-400" : "text-orange-500")}>
              {resumen.cumplimiento.toFixed(1)} %
            </span>
          </span>
          <span className="text-muted">
            Valor facturable <span className="font-semibold text-text">{money(resumen.facturable)}</span>
          </span>
        </div>
      </Card>

      <Card padding={false} className="overflow-hidden">
        {visibles.length === 0 ? (
          <Vacio icono={<Search size={20} />} titulo="Sin resultados" texto="Ajuste los filtros o la búsqueda." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-[13px]">
              <thead className="border-b border-line bg-raised text-[11px] uppercase tracking-wide text-faint">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Folio</th>
                  <th className="px-4 py-3 text-left font-semibold">Trabajo</th>
                  <th className="px-4 py-3 text-left font-semibold">Cliente y sitio</th>
                  <th className="px-4 py-3 text-left font-semibold">Estado</th>
                  <th className="px-4 py-3 text-left font-semibold">SLA</th>
                  <th className="px-4 py-3 text-left font-semibold">Cuadrilla</th>
                  <th className="px-4 py-3 text-right font-semibold">Facturable</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((o) => {
                  const cli = cliente(o.clienteId);
                  const sit = sitio(o.sitioId);
                  const c = cuadrilla(o.cuadrillaId);
                  return (
                    <tr
                      key={o.id}
                      onClick={() => setDetalle(o.id)}
                      className="cursor-pointer border-b border-line transition-colors last:border-0 hover:bg-raised"
                    >
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ChipPrioridad prioridad={o.prioridad} />
                          <span className="font-mono text-[11px] font-medium text-muted">{o.folio}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-faint">{fechaHora(o.creadaEn)}</p>
                      </td>
                      <td className="max-w-72 px-4 py-3">
                        <p className="truncate font-medium text-text">{o.titulo}</p>
                        <div className="mt-1"><ChipTipo tipo={o.tipo} /></div>
                      </td>
                      <td className="max-w-56 px-4 py-3">
                        <p className="truncate text-text">{cli?.nombre}</p>
                        <p className="truncate text-[11px] text-muted">{sit?.nombre} · {sit?.canton}</p>
                      </td>
                      <td className="px-4 py-3"><ChipEstado estado={o.estado} /></td>
                      <td className="px-4 py-3"><MedidorSla ot={o} compacto /></td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {c ? (
                          <>
                            <p className="font-medium text-text">{c.codigo}</p>
                            <p className="text-[11px] text-muted">{c.nombre}</p>
                          </>
                        ) : (
                          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">Sin asignar</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums text-text">
                        {money(costoOT(o, precioMaterial).total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {paginas > 1 && (
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs">
            <span className="text-muted">
              Página {pag + 1} de {paginas} · {filtradas.length} registros
            </span>
            <div className="flex gap-2">
              <Boton tamano="sm" disabled={pag === 0} onClick={() => setPagina(pag - 1)}>Anterior</Boton>
              <Boton tamano="sm" disabled={pag >= paginas - 1} onClick={() => setPagina(pag + 1)}>Siguiente</Boton>
            </div>
          </div>
        )}
      </Card>

      <PanelOrden otId={detalle} onCerrar={() => setDetalle(null)} />
      <ModalNuevaOrden abierto={creando} onCerrar={() => setCreando(false)} />
    </div>
  );
}
