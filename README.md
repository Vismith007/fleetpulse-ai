# FleetPulse — IoT Fleet Monitoring Dashboard

> A production-grade, real-time IoT fleet monitoring dashboard built as a full-stack TypeScript monorepo. Designed as a portfolio-quality project demonstrating WebSocket-driven live data, clean architecture, and modern UI engineering.

---

## Screenshot

> ![FleetPulse Dashboard](./docs/screenshot-placeholder.png)
> *(Run the project and open http://localhost:5173 — the dashboard populates immediately with 12 live simulated devices)*

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, TypeScript (strict), Tailwind CSS |
| **UI Components** | Radix UI primitives, shadcn/ui patterns, Lucide icons |
| **Charts** | Recharts (live telemetry line chart) |
| **Backend** | Node.js, Fastify 4, TypeScript (strict) |
| **Real-time** | WebSockets via `@fastify/websocket` |
| **Monorepo** | pnpm workspaces |
| **Shared Types** | `@fleetpulse/types` workspace package |
| **Dev tooling** | ESLint, Prettier, tsx (watch mode) |

---

## Project Architecture

```
FleetPulse/
├── package.json              ← root: scripts, devDependencies (eslint, prettier, concurrently)
├── pnpm-workspace.yaml       ← declares apps/* and packages/* as workspace members
├── tsconfig.base.json        ← shared strict TypeScript config
├── .eslintrc.js              ← root ESLint config (shared rules)
├── .prettierrc               ← Prettier config
│
├── packages/
│   └── types/                ← @fleetpulse/types
│       └── src/index.ts      ← Device, Telemetry, Alert, WSMessage interfaces
│
├── apps/
│   ├── server/               ← @fleetpulse/server  (port 3001)
│   │   └── src/
│   │       ├── index.ts              ← Fastify bootstrap, WS broadcast loop
│   │       ├── routes/
│   │       │   ├── devices.ts        ← GET/POST /api/devices
│   │       │   └── alerts.ts         ← GET /api/alerts
│   │       └── services/
│   │           ├── simulator.ts      ← device seed data + 2s tick loop
│   │           └── alerts.ts         ← threshold checks + alert store
│   │
│   └── web/                  ← @fleetpulse/web  (port 5173)
│       └── src/
│           ├── config.ts             ← single place for all URLs/env vars
│           ├── hooks/
│           │   ├── useWebSocket.ts   ← auto-reconnecting WS hook
│           │   └── useApi.ts         ← REST fetch hooks (toggle, device detail)
│           └── components/
│               ├── StatsBar.tsx      ← top stats (total/online/alerts/avg temp)
│               ├── DeviceCard.tsx    ← live-updating device grid card
│               ├── DeviceDetailModal.tsx ← modal with recharts history + toggle
│               ├── AlertsPanel.tsx   ← slide-in alerts sidebar
│               ├── StatusPill.tsx    ← online/offline/warning pill
│               ├── BatteryBar.tsx    ← animated battery progress bar
│               ├── DeviceIcon.tsx    ← type-based icon (sensor/gateway/actuator)
│               └── WSStatusBadge.tsx ← live/connecting/reconnecting badge
```

### Data flow

```
Simulator (2s tick)
  └─▶ mutates Device state
        └─▶ Alert engine checks thresholds
              └─▶ broadcast({ type: 'fleet', payload: Device[] })
              └─▶ broadcast({ type: 'alert', payload: Alert })
                    └─▶ WebSocket /ws ──▶ useWebSocket hook ──▶ React state
                                                                     └─▶ DeviceCard re-renders
                                                                     └─▶ AlertsPanel updates
```

REST endpoints serve the same in-memory state for initial loads and the device detail modal.

---

## Why WebSockets Instead of Polling?

| Concern | Polling | WebSockets |
|---|---|---|
| **Latency** | Up to poll interval (e.g. 2 s) | Sub-millisecond after connection |
| **Server load** | N requests/second from M clients | 1 persistent connection per client |
| **Bandwidth** | Full response payload on every request | Only changed data on mutation |
| **UX** | Visible "stale" windows | Truly live — cards update the instant the server ticks |
| **Complexity** | Simple HTTP | Slightly more setup; worth it for real-time UX |

For a fleet dashboard where device status changes every 2 seconds and operators need to react to alerts immediately, WebSockets are the correct primitive. Polling at the same frequency would generate 12× the HTTP overhead and still feel laggy.

---

## Run Instructions

### Prerequisites

- [Node.js](https://nodejs.org) ≥ 18
- [pnpm](https://pnpm.io) ≥ 9 — install with `npm i -g pnpm`

### Install & run

```bash
# 1. Clone / enter the project
cd FleetPulse

# 2. Install all workspace dependencies (one command)
pnpm install

# 3. Build shared types (required before first run)
pnpm --filter @fleetpulse/types build

# 4. Start both server and web in watch mode
pnpm dev
```

That's it. Open **http://localhost:5173** — the dashboard is immediately populated with 12 simulated IoT devices streaming live telemetry.

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001/api/devices |
| WebSocket | ws://localhost:3001/ws |

### Other scripts

```bash
pnpm build       # production build of all packages
pnpm lint        # ESLint across all workspaces
pnpm format      # Prettier write
pnpm typecheck   # tsc --noEmit for all packages
```

---

## Environment Variables

Create `apps/web/.env.local` or `apps/server/.env` to override defaults:

```env
# apps/web/.env.local
VITE_API_BASE=http://localhost:3001
VITE_WS_BASE=ws://localhost:3001

# apps/server/.env
PORT=3001
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:5173
```

---

## Device Simulation Details

- **12 virtual devices** across three types: `sensor`, `gateway`, `actuator`
- Seeded with realistic lat/lng coordinates (San Francisco area)
- Every **2 seconds**: temperature drifts ±0.8°C, battery drains 0–0.3%, random 2% chance of going offline
- **Alert thresholds**: temperature > 75°C (warning) / > 80°C (critical), battery < 15% (warning) / < 10% (critical)
- 10-second cooldown per device prevents alert spam
- Last **50 telemetry points** per device kept in memory for the history chart
- `POST /api/devices/:id/toggle` manually overrides a device's online/offline state

---

## License

MIT
