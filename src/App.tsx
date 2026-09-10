import { Suspense, lazy, useEffect } from "react";
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AppShell, NAV, RUTA_INICIAL } from "./components/layout/AppShell";
import { useApp } from "./store/useApp";

// Cada módulo se descarga cuando el rol lo necesita: el mapa y las gráficas
// pesan, y no tiene sentido cargarlos para quien nunca abre esas pantallas.
const Tablero = lazy(() =>
  import("./pages/Tablero").then((m) => ({ default: m.Tablero })),
);
const Despacho = lazy(() =>
  import("./pages/Despacho").then((m) => ({ default: m.Despacho })),
);
const Ordenes = lazy(() =>
  import("./pages/Ordenes").then((m) => ({ default: m.Ordenes })),
);
const Campo = lazy(() =>
  import("./pages/Campo").then((m) => ({ default: m.Campo })),
);
const Cuadrillas = lazy(() =>
  import("./pages/Cuadrillas").then((m) => ({ default: m.Cuadrillas })),
);
const Almacen = lazy(() =>
  import("./pages/Almacen").then((m) => ({ default: m.Almacen })),
);
const Clientes = lazy(() =>
  import("./pages/Clientes").then((m) => ({ default: m.Clientes })),
);

function Cargando() {
  return (
    <div className="grid h-[60vh] place-items-center">
      <div className="flex items-center gap-3 text-sm text-muted">
        <span className="size-4 animate-spin rounded-full border-2 border-line border-t-brand-500" />
        Cargando módulo…
      </div>
    </div>
  );
}

/**
 * Cada rol ve solo sus módulos. Si la persona cambia de rol estando en una
 * pantalla que su nuevo puesto no tiene, el sistema la devuelve a su inicio.
 */
function GuardiaDeRol() {
  const rol = useApp((s) => s.rol);
  const { pathname } = useLocation();
  const navegar = useNavigate();

  useEffect(() => {
    if (pathname === "/") return;
    const permitida = NAV.some(
      (n) => pathname.startsWith(n.a) && n.roles.includes(rol),
    );
    if (!permitida) navegar(RUTA_INICIAL[rol], { replace: true });
  }, [rol, pathname, navegar]);

  return null;
}

function Inicio() {
  const rol = useApp((s) => s.rol);
  return <Navigate to={RUTA_INICIAL[rol]} replace />;
}

export default function App() {
  return (
    <HashRouter>
      <GuardiaDeRol />
      <AppShell>
        <Suspense fallback={<Cargando />}>
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/tablero" element={<Tablero />} />
            <Route path="/despacho" element={<Despacho />} />
            <Route path="/ordenes" element={<Ordenes />} />
            <Route path="/campo" element={<Campo />} />
            <Route path="/cuadrillas" element={<Cuadrillas />} />
            <Route path="/almacen" element={<Almacen />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="*" element={<Inicio />} />
          </Routes>
        </Suspense>
      </AppShell>
    </HashRouter>
  );
}
