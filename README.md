# Voltra Ingeniería · Sistema de gestión de órdenes de trabajo

Sistema empresarial de demostración para un **contratista eléctrico** que atiende mantenimiento
de redes, subestaciones y clientes industriales en el Gran Área Metropolitana de Costa Rica.

> **Voltra Ingeniería S.A. es una empresa ficticia.** Clientes, cuadrillas, personal, montos y
> órdenes de trabajo son datos simulados creados para mostrar el funcionamiento del sistema.

**Vista previa:** https://andrewflores-23.github.io/Voltra-Ingenier-a-Sistema-empresarial-/

---

## El problema que resuelve

En un contratista eléctrico típico el trabajo se coordina por WhatsApp, la evidencia llega en
fotos sueltas y nadie sabe con certeza si se cumplió el tiempo de respuesta pactado. La
consecuencia es doble: se incumplen contratos sin darse cuenta y la facturación se atrasa
porque falta el respaldo del trabajo ejecutado.

Este sistema cierra ese ciclo completo: **reporte → despacho → ejecución en campo → firma del
cliente → orden lista para facturar**, con el reloj de SLA corriendo de punta a punta.

## Qué incluye

| Módulo | Para quién | Qué hace |
| --- | --- | --- |
| **Tablero gerencial** | Gerencia | Cumplimiento de SLA, tiempo medio de respuesta, ingreso facturable, volumen por tipo de trabajo, facturación por cliente y ranking de cuadrillas |
| **Despacho en vivo** | Despacho | Cola priorizada por criticidad y SLA, mapa de la operación, asignación arrastrando la orden sobre la cuadrilla |
| **Órdenes de trabajo** | Todos | Historial con filtros, búsqueda, semáforo de SLA y valor facturable por orden |
| **Mi jornada** | Cuadrilla | Vista móvil: checklist de seguridad, consumo de materiales, evidencia fotográfica y firma del cliente |
| **Cuadrillas** | Gerencia y despacho | Integrantes, certificaciones vigentes, carga de trabajo y desempeño |
| **Almacén** | Todos | Existencias por bodega, consumo cargado a cada orden y alertas de punto de reorden |
| **Clientes y sitios** | Gerencia y despacho | Cartera, nivel de contrato, sitios atendidos y cumplimiento por cuenta |

## Reglas de negocio implementadas

- **SLA calculado, no digitado.** El compromiso sale de la prioridad (P1 4 h, P2 8 h, P3 24 h,
  P4 72 h) multiplicada por el factor del contrato del cliente: platino 0.75, oro 1.00,
  plata 1.35. Una emergencia P1 de un cliente platino vence en 3 horas.
- **El reloj se detiene al llegar al sitio,** no al cerrar la orden: se mide el tiempo de
  respuesta, que es lo que el contrato compromete.
- **Escalamiento automático** a jefatura de operaciones cuando una orden vence sin atender.
- **Cierre bloqueado por seguridad.** Si quedan puntos críticos del checklist sin confirmar
  (ATS firmado, LOTO aplicado, verificación de ausencia de tensión), el sistema no permite
  firmar el cierre.
- **Inventario en línea.** El consumo registrado por la cuadrilla descuenta el stock de la
  bodega, dispara la alerta de reorden y carga el costo a la preliquidación de la orden.
- **Permisos por rol.** Cada puesto ve solo sus módulos; el técnico ve únicamente el trabajo de
  su propia cuadrilla y es el único que puede marcar el checklist o firmar.

## Cómo recorrer la demostración

El selector de rol en la barra superior cambia el sistema completo. Sugerencia de recorrido:

1. **Despacho** — arrastre una orden de la cola hacia una cuadrilla disponible; observe cómo
   cambia su estado y aparece en el mapa.
2. **Técnico** — abra la orden en curso, complete el checklist de seguridad, registre un
   material (verá bajar el stock en Almacén) y firme el cierre.
3. **Gerencia** — el cumplimiento de SLA y el ingreso del período ya reflejan ese cierre.

El botón *Restaurar datos* de la barra lateral devuelve todo al estado inicial.

## Detalles técnicos

- **React 19 + TypeScript + Vite**, enrutado con React Router (modo hash, para publicar en
  GitHub Pages sin configuración de servidor).
- **Tailwind CSS v4** con tokens de superficie propios: un único juego de variables sostiene
  el tema claro y el oscuro.
- **Zustand** como store de dominio; toda la lógica de negocio (SLA, costeo, transiciones de
  estado) vive en `src/lib/dominio.ts` y `src/store/useApp.ts`, separada de la interfaz.
- **MapLibre GL** sobre teselas de OpenStreetMap: sin llave de API ni cuota que administrar.
- **Recharts** para la analítica del tablero.
- **Datos simulados deterministas.** Un generador con semilla fija produce ~200 órdenes con
  historial de 75 días; las fechas son relativas al día en que se abre la aplicación, así que
  la demostración nunca se ve vencida. No hay backend: el estado vive en memoria.
- **Carga por módulo.** Cada pantalla se descarga cuando el rol la necesita; el mapa y las
  gráficas no pesan en la carga inicial.

## Ejecutar en local

```bash
npm install
npm run dev
```

La aplicación queda en `http://localhost:5180`.

```bash
npm run build     # compila a dist/
npm run preview   # sirve el build de producción
```

## Publicación

Cada push a `main` dispara el flujo de `.github/workflows/deploy.yml`, que verifica tipos,
compila y publica en GitHub Pages.

---

Desarrollado por [Andrew Corea Flores](https://github.com/AndrewFlores-23) · AWRise CR
