import { v4 as uuidv4 } from 'uuid';
import type { Alert, AlertSeverity, Device } from '@fleetpulse/types';

const MAX_ALERTS = 100;
const alertStore: Alert[] = [];

// Track last-alert time per device to avoid alert spam
const lastAlertTime = new Map<string, number>();
const ALERT_COOLDOWN_MS = 10_000; // 10 s per device

export function checkAndGenerateAlerts(devices: Device[]): Alert[] {
  const newAlerts: Alert[] = [];
  const now = Date.now();

  for (const device of devices) {
    const lastTime = lastAlertTime.get(device.id) ?? 0;
    if (now - lastTime < ALERT_COOLDOWN_MS) continue;

    let severity: AlertSeverity | null = null;
    let message = '';

    if (device.temperature > 80) {
      severity = 'critical';
      message = `Critical temperature: ${device.temperature}°C (threshold: 80°C)`;
    } else if (device.temperature > 75) {
      severity = 'warning';
      message = `High temperature: ${device.temperature}°C (threshold: 75°C)`;
    } else if (device.battery < 10) {
      severity = 'critical';
      message = `Critical battery: ${device.battery}% (threshold: 10%)`;
    } else if (device.battery < 15) {
      severity = 'warning';
      message = `Low battery: ${device.battery}% (threshold: 15%)`;
    } else if (device.status === 'offline') {
      severity = 'info';
      message = `Device went offline`;
    }

    if (severity !== null) {
      const alert: Alert = {
        id: uuidv4(),
        deviceId: device.id,
        deviceName: device.name,
        severity,
        message,
        timestamp: new Date().toISOString(),
      };
      newAlerts.push(alert);
      alertStore.unshift(alert);
      lastAlertTime.set(device.id, now);
    }
  }

  // Trim store
  if (alertStore.length > MAX_ALERTS) {
    alertStore.splice(MAX_ALERTS);
  }

  return newAlerts;
}

export function getAllAlerts(): Alert[] {
  return alertStore.slice();
}
