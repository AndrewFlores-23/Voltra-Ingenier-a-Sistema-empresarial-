import { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* ---------------- Tarjeta ---------------- */

export function Card({
  children, className, padding = true,
}: { children: ReactNode; className?: string; padding?: boolean }) {
  return (
    <section
      className={cx(
        "rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgb(2_6_23/0.04),0_8px_24px_-16px_rgb(2_6_23/0.25)]",
        padding && "p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardTitle({
  titulo, sub, accion,
}: { titulo: string; sub?: string; accion?: ReactNode }) {
  return (
    <header className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight text-text">{titulo}</h2>
        {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
      </div>
      {accion}
    </header>
  );
}

/* ---------------- Chip ---------------- */

export function Chip({
  children, className, tono = "neutro",
}: { children: ReactNode; className?: string; tono?: "neutro" | "custom" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
        tono === "neutro" && "bg-raised text-muted ring-line",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ---------------- Botón ---------------- */

type BotonProps = {
  children: ReactNode;
  onClick?: () => void;
  variante?: "primario" | "secundario" | "fantasma" | "peligro";
  tamano?: "sm" | "md";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
  title?: string;
};

export function Boton({
  children, onClick, variante = "secundario", tamano = "md", disabled, className, type = "button", title,
}: BotonProps) {
  const variantes = {
    primario: "bg-ink-900 text-white hover:bg-ink-800 dark:bg-brand-500 dark:text-ink-950 dark:hover:bg-brand-400",
    secundario: "bg-surface text-text ring-1 ring-inset ring-line hover:bg-raised",
    fantasma: "text-muted hover:bg-raised hover:text-text",
    peligro: "bg-rose-600 text-white hover:bg-rose-500",
  };
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
        "disabled:cursor-not-allowed disabled:opacity-45",
        tamano === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-[13px]",
        variantes[variante],
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ---------------- Indicador numérico ---------------- */

export function Stat({
  etiqueta, valor, sufijo, delta, pie, icono, tono = "neutro",
}: {
  etiqueta: string;
  valor: string | number;
  sufijo?: string;
  delta?: { valor: string; positivo: boolean };
  pie?: string;
  icono?: ReactNode;
  tono?: "neutro" | "alerta" | "bien";
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{etiqueta}</p>
        {icono && (
          <span
            className={cx(
              "grid size-8 shrink-0 place-items-center rounded-lg",
              tono === "alerta" ? "bg-rose-500/12 text-rose-500"
                : tono === "bien" ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                : "bg-brand-500/12 text-brand-600 dark:text-brand-400",
            )}
          >
            {icono}
          </span>
        )}
      </div>
      <p className="mt-3 flex items-baseline gap-1 text-3xl font-semibold tracking-tight text-text tabular-nums">
        {valor}
        {sufijo && <span className="text-base font-medium text-muted">{sufijo}</span>}
      </p>
      <div className="mt-1.5 flex items-center gap-2 text-xs">
        {delta && (
          <span className={cx("font-semibold", delta.positivo ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
            {delta.positivo ? "▲" : "▼"} {delta.valor}
          </span>
        )}
        {pie && <span className="text-faint">{pie}</span>}
      </div>
    </Card>
  );
}

/* ---------------- Barra de progreso ---------------- */

export function Barra({ pct, clase, alto = "h-1.5" }: { pct: number; clase: string; alto?: string }) {
  return (
    <div className={cx("w-full overflow-hidden rounded-full bg-line", alto)}>
      <div className={cx("h-full rounded-full transition-[width] duration-500", clase)} style={{ width: `${Math.min(100, Math.max(2, pct * 100))}%` }} />
    </div>
  );
}

/* ---------------- Avatar ---------------- */

export function Avatar({ iniciales, size = "md" }: { iniciales: string; size?: "sm" | "md" }) {
  return (
    <span
      className={cx(
        "grid shrink-0 place-items-center rounded-full bg-ink-900 font-semibold text-brand-300 dark:bg-brand-500 dark:text-ink-950",
        size === "sm" ? "size-6 text-[9px]" : "size-9 text-[11px]",
      )}
    >
      {iniciales}
    </span>
  );
}

/* ---------------- Panel lateral ---------------- */

export function Panel({
  abierto, onCerrar, titulo, sub, children, ancho = "max-w-2xl",
}: {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  sub?: ReactNode;
  children: ReactNode;
  ancho?: string;
}) {
  useEffect(() => {
    if (!abierto) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink-950/45 backdrop-blur-[2px]" onClick={onCerrar} />
      <aside className={cx("animate-slide-in relative flex h-full w-full flex-col border-l border-line bg-canvas shadow-2xl", ancho)}>
        <header className="flex items-start justify-between gap-4 border-b border-line bg-surface px-6 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold tracking-tight text-text">{titulo}</h2>
            {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
          </div>
          <button
            onClick={onCerrar}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-text"
            aria-label="Cerrar panel"
          >
            <X size={16} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </aside>
    </div>
  );
}

/* ---------------- Modal ---------------- */

export function Modal({
  abierto, onCerrar, titulo, children, ancho = "max-w-lg",
}: { abierto: boolean; onCerrar: () => void; titulo: string; children: ReactNode; ancho?: string }) {
  useEffect(() => {
    if (!abierto) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [abierto, onCerrar]);

  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink-950/45 backdrop-blur-[2px]" onClick={onCerrar} />
      <div className={cx("animate-in-up relative w-full rounded-2xl border border-line bg-surface shadow-2xl", ancho)}>
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-sm font-semibold tracking-tight text-text">{titulo}</h2>
          <button onClick={onCerrar} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-raised hover:text-text" aria-label="Cerrar">
            <X size={16} />
          </button>
        </header>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- Campos de formulario ---------------- */

const campoBase =
  "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] text-text placeholder:text-faint " +
  "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25";

export function Campo({ etiqueta, children, hint }: { etiqueta: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted">{etiqueta}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-faint">{hint}</span>}
    </label>
  );
}

export function Entrada(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(campoBase, props.className)} />;
}

export function AreaTexto(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(campoBase, "resize-none", props.className)} />;
}

export function Selector(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(campoBase, "cursor-pointer appearance-none pr-8", props.className)} />;
}

/* ---------------- Estado vacío ---------------- */

export function Vacio({ icono, titulo, texto }: { icono: ReactNode; titulo: string; texto?: string }) {
  return (
    <div className="grid place-items-center gap-2 px-6 py-14 text-center">
      <span className="grid size-11 place-items-center rounded-2xl bg-raised text-faint">{icono}</span>
      <p className="text-sm font-semibold text-text">{titulo}</p>
      {texto && <p className="max-w-xs text-xs text-muted">{texto}</p>}
    </div>
  );
}
