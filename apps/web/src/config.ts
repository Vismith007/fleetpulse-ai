/**
 * Central configuration — all URLs come from here.
 * Override via .env.local (Vite exposes VITE_* env vars to the client).
 */
const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://localhost:3001';

const WS_BASE =
  (import.meta.env.VITE_WS_BASE as string | undefined) ??
  API_BASE.replace(/^http/, 'ws');

export const config = {
  apiBase: API_BASE,
  wsUrl: `${WS_BASE}/ws`,
  wsReconnectDelayMs: 2000,
  wsMaxReconnectAttempts: 10,
} as const;
