import { useState } from "react";
import { Zap } from "lucide-react";
import { useApp, useCatalogos } from "../store/useApp";
import { AreaTexto, Boton, Campo, Entrada, Modal, Selector } from "../components/ui/base";
import { ETIQUETA_PRIORIDAD, ETIQUETA_TIPO, duracion } from "../lib/dominio";
import type { Prioridad, TipoTrabajo } from "../data/types";

const SLA_BASE = { P1: 4, P2: 8, P3: 24, P4: 72 } as const;
const FACTOR = { platino: 0.75, oro: 1, plata: 1.35 } as const;

export function ModalNuevaOrden({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const crear = useApp((s) => s.crearOrden);
  const { sitios, cliente } = useCatalogos();

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [sitioId, setSitioId] = useState(sitios[0].id);
  const [tipo, setTipo] = useState<TipoTrabajo>("correctivo");
  const [prioridad, setPrioridad] = useState<Prioridad>("P2");
  const [horas, setHoras] = useState("3");

  const sitio = sitios.find((s) => s.id === sitioId)!;
  const cli = cliente(sitio.clienteId)!;
  const sla = SLA_BASE[prioridad] * FACTOR[cli.contratoSla];

  const enviar = () => {
    if (!titulo.trim()) return;
    crear({
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || `Reporte recibido de ${cli.contacto} para ${sitio.nombre}.`,
      sitioId,
      tipo,
      prioridad,
      horasEstimadas: Number(horas) || 2,
    });
    setTitulo("");
    setDescripcion("");
    onCerrar();
  };

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Registrar orden de trabajo" ancho="max-w-xl">
      <div className="space-y-4">
        <Campo etiqueta="Título del trabajo">
          <Entrada
            autoFocus
            value={titulo}
            placeholder="Ej. Disparo recurrente del interruptor general"
            onChange={(e) => setTitulo(e.target.value)}
          />
        </Campo>

        <Campo etiqueta="Sitio del cliente">
          <Selector value={sitioId} onChange={(e) => setSitioId(e.target.value)}>
            {sitios.map((s) => (
              <option key={s.id} value={s.id}>
                {cliente(s.clienteId)?.nombre} — {s.nombre} ({s.canton})
              </option>
            ))}
          </Selector>
        </Campo>

        <div className="grid gap-4 sm:grid-cols-3">
          <Campo etiqueta="Tipo">
            <Selector value={tipo} onChange={(e) => setTipo(e.target.value as TipoTrabajo)}>
              {Object.entries(ETIQUETA_TIPO).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Selector>
          </Campo>
          <Campo etiqueta="Prioridad">
            <Selector value={prioridad} onChange={(e) => setPrioridad(e.target.value as Prioridad)}>
              {Object.entries(ETIQUETA_PRIORIDAD).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Selector>
          </Campo>
          <Campo etiqueta="Horas estimadas">
            <Entrada type="number" min={1} step={0.5} value={horas} onChange={(e) => setHoras(e.target.value)} />
          </Campo>
        </div>

        <Campo etiqueta="Descripción del reporte">
          <AreaTexto
            rows={3}
            value={descripcion}
            placeholder="Qué reportó el cliente, condiciones del sitio, accesos, contacto…"
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </Campo>

        <div className="flex items-start gap-3 rounded-xl border border-brand-500/30 bg-brand-500/8 px-4 py-3">
          <Zap size={16} className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-400" />
          <p className="text-[12px] leading-relaxed text-text">
            <span className="font-semibold">Compromiso calculado: {duracion(sla)}.</span>{" "}
            {cli.nombre} tiene contrato <span className="font-semibold capitalize">{cli.contratoSla}</span>, que
            ajusta el SLA base de {SLA_BASE[prioridad]} h por un factor de {FACTOR[cli.contratoSla]}.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Boton onClick={onCerrar}>Cancelar</Boton>
          <Boton variante="primario" disabled={!titulo.trim()} onClick={enviar}>
            Crear y enviar a la cola
          </Boton>
        </div>
      </div>
    </Modal>
  );
}
