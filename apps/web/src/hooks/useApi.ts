import { useState, useCallback } from 'react';
import type { Device, DeviceDetailResponse, AnalyticsSnapshot } from '@fleetpulse/types';
import { config } from '../config';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${config.apiBase}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export function useToggleDevice() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = useCallback(async (deviceId: string): Promise<Device | null> => {
    setLoading(true);
    setError(null);
    try {
      return await apiFetch<Device>(`/api/devices/${deviceId}/toggle`, { method: 'POST' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { toggle, loading, error };
}

export function useDeviceDetail() {
  const [data, setData] = useState<DeviceDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async (deviceId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<DeviceDetailResponse>(`/api/devices/${deviceId}`);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetch: loadDetail };
}

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiFetch<AnalyticsSnapshot>('/api/analytics');
      setData(result);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, load };
}
