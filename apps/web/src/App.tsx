import { useState, useCallback, useEffect } from 'react';
import type { Device } from '@fleetpulse/types';
import { FleetProvider, useFleet } from './store/fleetStore';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useWebSocket } from './hooks/useWebSocket';
import { Sidebar, type ViewId } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { DashboardView } from './views/DashboardView';
import { AnalyticsView } from './views/AnalyticsView';
import { MapView } from './views/MapView';
import { TerminalView } from './views/TerminalView';
import { AIInsightsView } from './views/AIInsightsView';
import { CommandCenterView } from './views/CommandCenterView';
import { BusinessAnalyticsView } from './views/BusinessAnalyticsView';
import { AlertCenterView } from './views/AlertCenterView';
import { LoginView } from './views/LoginView';
import { DeviceDetailPanel } from './components/device/DeviceDetailPanel';

// ─── View metadata ────────────────────────────────────────────────────────────

const VIEW_META: Record<ViewId, { title: string; subtitle: string }> = {
  command:   { title: 'Command Center',   subtitle: 'Fleet health & live intelligence' },
  dashboard: { title: 'Fleet Dashboard',  subtitle: 'Real-time device overview' },
  analytics: { title: 'Analytics',        subtitle: 'System performance & trends' },
  business:  { title: 'Business KPIs',    subtitle: 'Operational & financial metrics' },
  map:       { title: 'Fleet Map',        subtitle: 'Geographic device distribution' },
  terminal:  { title: 'Log Terminal',     subtitle: 'Live device log stream' },
  ai:        { title: 'AI Insights',      subtitle: 'Predictive intelligence & anomaly detection' },
  alerts:    { title: 'Alert Center',     subtitle: 'Incident management & escalation' },
};

// ─── Authenticated shell ──────────────────────────────────────────────────────

function Shell() {
  const [activeView, setActiveView] = useState<ViewId>('command');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const { state, dispatch, handleWSMessage, updateDevice } = useFleet();
  const { status, reconnectCount } = useWebSocket(handleWSMessage);

  useEffect(() => {
    dispatch({ type: 'WS_STATUS', status, reconnectCount });
  }, [status, reconnectCount, dispatch]);

  const handleSelectDevice = useCallback((device: Device) => {
    setSelectedDevice(device);
  }, []);

  const handleDeviceUpdated = useCallback((device: Device) => {
    updateDevice(device);
    setSelectedDevice((prev) => (prev?.id === device.id ? device : prev));
  }, [updateDevice]);

  const meta = VIEW_META[activeView];

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <div className="flex flex-1 flex-col min-w-0">
        <TopBar title={meta.title} subtitle={meta.subtitle} />

        <main className="flex-1 overflow-y-auto">
          {activeView === 'command' && (
            <CommandCenterView onSelectDevice={handleSelectDevice} />
          )}
          {activeView === 'dashboard' && (
            <DashboardView onSelectDevice={handleSelectDevice} />
          )}
          {activeView === 'analytics' && <AnalyticsView />}
          {activeView === 'business' && <BusinessAnalyticsView />}
          {activeView === 'map' && (
            <MapView onSelectDevice={handleSelectDevice} />
          )}
          {activeView === 'terminal' && <TerminalView />}
          {activeView === 'ai' && (
            <AIInsightsView
              onSelectDevice={(id) => {
                const d = state.devices.find((dev) => dev.id === id);
                if (d) handleSelectDevice(d);
              }}
            />
          )}
          {activeView === 'alerts' && <AlertCenterView />}
        </main>
      </div>

      <DeviceDetailPanel
        device={selectedDevice}
        onClose={() => setSelectedDevice(null)}
        onDeviceUpdated={handleDeviceUpdated}
      />
    </div>
  );
}

// ─── Auth gate ────────────────────────────────────────────────────────────────

function AuthGate() {
  const { user } = useAuth();
  if (!user) return <LoginView />;
  return (
    <FleetProvider>
      <Shell />
    </FleetProvider>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
