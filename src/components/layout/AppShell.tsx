import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Boxes, Building2, CheckCircle2, ClipboardList, Gauge, HardHat, Info, Menu, Moon,
  RadioTower, RotateCcw, Smartphone, Sun, TriangleAlert, Zap,
} from "lucide-react";
import { useApp } from "../../store/useApp";
import type { Rol } from "../../data/types";
import { cx } from "../ui/base";
import { estaAbierta, evaluarSla } from "../../lib/dominio";

interface ItemNav {
  a: string;
  texto: string;
  icono: typeof Gauge;
  roles: Rol[];
  insignia?: "abiertas" | "vencidas" | "misOts" | "reorden";
}

export const NAV: ItemNav[] = [
  { a: "/tablero", texto: "Tablero gerencial", icono: Gauge, roles: ["gerente"] },
  { a: "/despacho", texto: "Despacho en vivo", icono: RadioTower, roles: ["gerente", "despachador"], insignia: "abiertas" },
  { a: "/ordenes", texto: "Órdenes de trabajo", icono: ClipboardList, roles: ["gerente", "despachador", "tecnico"], insignia: "vencidas" },
  { a: "/campo", texto: "Mi jornada", icono: Smartphone, roles: ["tecnico"], insignia: "misOts" },
  { a: "/cuadrillas", texto: "Cuadrillas", icono: HardHat, roles: ["gerente", "despachador"] },
  { a: "/almacen", texto: "Almacén", icono: Boxes, roles: ["gerente", "despachador", "tecnico"], insignia: "reorden" },
  { a: "/clientes", texto: "Clientes y sitios", icono: Building2, roles: ["gerente", "despachador"] },
];

export const RUTA_INICIAL: Record<Rol, string> = {
  gerente: "/tablero",
  despachador: "/despacho",
  tecnico: "/campo",
};

const ROLES: { id: Rol; texto: string; desc: string; icono: typeof Gauge }[] = [
  { id: "gerente", texto: "Gerencia", desc: "Indicadores y rentabilidad", icono: Gauge },
  { id: "despachador", texto: "Despacho", desc: "Asignación y control de SLA", icono: RadioTower },
  { id: "tecnico", texto: "Técnico", desc: "Ejecución en campo", icono: HardHat },
];

function useInsignias() {
  const ordenes = useApp((s) => s.ordenes);
  const materiales = useApp((s) => s.materiales);
  const cuadrillaActivaId = useApp((s) => s.cuadrillaActivaId);
  const abiertas = ordenes.filter(estaAbierta);
  return {
    abiertas: abiertas.length,
    vencidas: abiertas.filter((o) => evaluarSla(o).semaforo === "vencido").length,
    misOts: abiertas.filter((o) => o.cuadrillaId === cuadrillaActivaId).length,
    reorden: materiales.filter((m) => m.stock <= m.puntoReorden).length,
  };
}

/* ---------------- Selector de rol ---------------- */

function SelectorRol() {
  const rol = useApp((s) => s.rol);
  const setRol = useApp((s) => s.setRol);
  return (
    <div className="flex rounded-xl bg-raised p-1 ring-1 ring-inset ring-line">
      {ROLES.map((r) => {
        const Icono = r.icono;
        const activo = rol === r.id;
        return (
          <button
            key={r.id}
            onClick={() => setRol(r.id)}
            title={r.desc}
            className={cx(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all",
              activo ? "bg-surface text-text shadow-sm ring-1 ring-line" : "text-muted hover:text-text",
            )}
          >
            <Icono size={13} />
            <span className="hidden sm:inline">{r.texto}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Avisos flotantes ---------------- */

function Avisos() {
  const avisos = useApp((s) => s.avisos);
  const descartar = useApp((s) => s.descartarAviso);
  if (!avisos.length) return null;
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-[min(22rem,calc(100vw-2.5rem))] flex-col gap-2">
      {avisos.map((a) => {
        const Icono = a.tono === "alerta" ? TriangleAlert : a.tono === "info" ? Info : CheckCircle2;
        return (
          <div
            key={a.id}
            onClick={() => descartar(a.id)}
            className={cx(
              "animate-in-up pointer-events-auto flex cursor-pointer items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] shadow-lg backdrop-blur",
              a.tono === "alerta"
                ? "border-rose-500/30 bg-rose-50/95 text-rose-900 dark:bg-rose-950/85 dark:text-rose-100"
                : a.tono === "info"
                  ? "border-sky-500/30 bg-sky-50/95 text-sky-900 dark:bg-sky-950/85 dark:text-sky-100"
                  : "border-emerald-500/30 bg-emerald-50/95 text-emerald-900 dark:bg-emerald-950/85 dark:text-emerald-100",
            )}
          >
            <Icono size={16} className="mt-0.5 shrink-0" />
            <span className="leading-snug">{a.texto}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Contenedor principal ---------------- */

export function AppShell({ children }: { children: React.ReactNode }) {
  const rol = useApp((s) => s.rol);
  const tema = useApp((s) => s.tema);
  const toggleTema = useApp((s) => s.toggleTema);
  const reiniciar = useApp((s) => s.reiniciarDemo);
  const insignias = useInsignias();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", tema === "oscuro");
  }, [tema]);

  useEffect(() => setMenuAbierto(false), [pathname]);

  const items = NAV.filter((n) => n.roles.includes(rol));

  const barraLateral = (
    <nav className="flex h-full flex-col gap-1 p-3">
      {items.map((n) => {
        const Icono = n.icono;
        const cuenta = n.insignia ? insignias[n.insignia] : 0;
        return (
          <NavLink
            key={n.a}
            to={n.a}
            className={({ isActive }) =>
              cx(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-ink-900 text-white dark:bg-brand-500/15 dark:text-brand-300"
                  : "text-muted hover:bg-raised hover:text-text",
              )
            }
          >
            <Icono size={17} className="shrink-0" />
            <span className="flex-1 truncate">{n.texto}</span>
            {cuenta > 0 && (
              <span
                className={cx(
                  "grid min-w-5 place-items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                  n.insignia === "vencidas" || n.insignia === "reorden"
                    ? "bg-rose-500 text-white"
                    : "bg-brand-500 text-ink-950",
                )}
              >
                {cuenta}
              </span>
            )}
          </NavLink>
        );
      })}

      <div className="mt-auto space-y-3 rounded-xl bg-raised p-3.5 text-[11px] leading-relaxed text-muted ring-1 ring-inset ring-line">
        <p className="flex items-center gap-1.5 font-semibold text-text">
          <Info size={13} /> Ambiente de demostración
        </p>
        <p>
          Datos ficticios. Cambie de rol arriba para ver cómo se transforma el sistema según el
          puesto de la persona usuaria.
        </p>
        <button
          onClick={reiniciar}
          className="flex items-center gap-1.5 font-semibold text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-400"
        >
          <RotateCcw size={12} /> Restaurar datos
        </button>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
          <button
            onClick={() => setMenuAbierto((v) => !v)}
            className="grid size-9 place-items-center rounded-lg text-muted hover:bg-raised lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu size={18} />
          </button>

          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-ink-900 dark:bg-brand-500">
              <Zap size={18} className="fill-brand-400 text-brand-400 dark:fill-ink-950 dark:text-ink-950" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight text-text">Voltra Ingeniería</p>
              <p className="hidden text-[11px] text-muted sm:block">Gestión de órdenes de trabajo</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <SelectorRol />
            <button
              onClick={toggleTema}
              className="grid size-9 place-items-center rounded-lg text-muted ring-1 ring-inset ring-line transition-colors hover:bg-raised hover:text-text"
              aria-label="Cambiar tema"
            >
              {tema === "claro" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <div className="hidden items-center gap-2.5 border-l border-line pl-3 md:flex">
              <span className="grid size-9 place-items-center rounded-full bg-brand-500 text-[11px] font-bold text-ink-950">
                AC
              </span>
              <div className="leading-tight">
                <p className="text-[13px] font-semibold text-text">Andrés Corea</p>
                <p className="text-[11px] capitalize text-muted">{ROLES.find((r) => r.id === rol)?.texto}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-64 shrink-0 border-r border-line bg-surface lg:block">
          <div className="sticky top-16 h-[calc(100vh-4rem)]">{barraLateral}</div>
        </aside>

        {menuAbierto && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-ink-950/45" onClick={() => setMenuAbierto(false)} />
            <div className="animate-slide-in absolute right-0 top-16 h-[calc(100vh-4rem)] w-72 border-l border-line bg-surface">
              {barraLateral}
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <Avisos />
    </div>
  );
}

export function Encabezado({
  titulo, sub, acciones,
}: { titulo: string; sub?: string; acciones?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">{titulo}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </div>
  );
}
