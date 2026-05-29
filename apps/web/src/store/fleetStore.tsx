import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from 'react';
import type { Device, Alert, LogEntry, AIInsight, SystemHealth, WSMessage } from '@fleetpulse/types';
import type { WSStatus } from '../hooks/useWebSocket';

// ─── State ────────────────────────────────────────────────────────────────────

export interface FleetState {
  devices: Device[];
  alerts: Alert[];
  logs: LogEntry[];
  aiInsights: AIInsight[];
  systemHealth: SystemHealth | null;
  selectedDeviceId: string | null;
  wsStatus: WSStatus;
  wsReconnectCount: number;
  isInitialized: boolean;
}

const initialState: FleetState = {
  devices: [],
  alerts: [],
  logs: [],
  aiInsights: [],
  systemHealth: null,
  selectedDeviceId: null,
  wsStatus: 'connecting',
  wsReconnectCount: 0,
  isInitialized: false,
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type FleetAction =
  | { type: 'WS_MESSAGE'; payload: WSMessage }
  | { type: 'WS_STATUS'; status: WSStatus; reconnectCount: number }
  | { type: 'SELECT_DEVICE'; id: string | null }
  | { type: 'UPDATE_DEVICE'; device: Device };

const MAX_ALERTS = 100;
const MAX_LOGS = 200;
const MAX_INSIGHTS = 80;

function reducer(state: FleetState, action: FleetAction): FleetState {
  switch (action.type) {
    case 'WS_MESSAGE': {
      const msg = action.payload;
      switch (msg.type) {
        case 'fleet':
          return { ...state, devices: msg.payload, isInitialized: true };
        case 'alert':
          if (state.alerts.some((a) => a.id === msg.payload.id)) return state;
          return { ...state, alerts: [msg.payload, ...state.alerts].slice(0, MAX_ALERTS) };
        case 'log':
          if (state.logs.some((l) => l.id === msg.payload.id)) return state;
          return { ...state, logs: [msg.payload, ...state.logs].slice(0, MAX_LOGS) };
        case 'ai_insight':
          if (state.aiInsights.some((i) => i.id === msg.payload.id)) return state;
          return { ...state, aiInsights: [msg.payload, ...state.aiInsights].slice(0, MAX_INSIGHTS) };
        case 'system_health':
          return { ...state, systemHealth: msg.payload };
        default:
          return state;
      }
    }
    case 'WS_STATUS':
      return { ...state, wsStatus: action.status, wsReconnectCount: action.reconnectCount };
    case 'SELECT_DEVICE':
      return { ...state, selectedDeviceId: action.id };
    case 'UPDATE_DEVICE':
      return {
        ...state,
        devices: state.devices.map((d) => (d.id === action.device.id ? action.device : d)),
      };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface FleetContextValue {
  state: FleetState;
  dispatch: React.Dispatch<FleetAction>;
  handleWSMessage: (msg: WSMessage) => void;
  selectDevice: (id: string | null) => void;
  updateDevice: (device: Device) => void;
}

const FleetContext = createContext<FleetContextValue | null>(null);

export function FleetProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleWSMessage = useCallback((msg: WSMessage) => {
    dispatch({ type: 'WS_MESSAGE', payload: msg });
  }, []);

  const selectDevice = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_DEVICE', id });
  }, []);

  const updateDevice = useCallback((device: Device) => {
    dispatch({ type: 'UPDATE_DEVICE', device });
  }, []);

  return (
    <FleetContext.Provider value={{ state, dispatch, handleWSMessage, selectDevice, updateDevice }}>
      {children}
    </FleetContext.Provider>
  );
}

export function useFleet(): FleetContextValue {
  const ctx = useContext(FleetContext);
  if (!ctx) throw new Error('useFleet must be used inside <FleetProvider>');
  return ctx;
}
