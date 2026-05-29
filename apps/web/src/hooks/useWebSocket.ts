import { useEffect, useRef, useCallback, useState } from 'react';
import type { WSMessage } from '@fleetpulse/types';
import { config } from '../config';

export type WSStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketResult {
  status: WSStatus;
  reconnectCount: number;
}

export function useWebSocket(onMessage: (msg: WSMessage) => void): UseWebSocketResult {
  const [status, setStatus] = useState<WSStatus>('connecting');
  const [reconnectCount, setReconnectCount] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMessageRef = useRef(onMessage);
  const mountedRef = useRef(true);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    setStatus('connecting');
    const ws = new WebSocket(config.wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setStatus('connected');
      reconnectAttempts.current = 0;
      setReconnectCount(0);
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const msg = JSON.parse(event.data) as WSMessage;
        onMessageRef.current(msg);
      } catch {
        console.error('[WS] Failed to parse message');
      }
    };

    ws.onerror = () => {
      if (mountedRef.current) setStatus('error');
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setStatus('disconnected');
      if (reconnectAttempts.current >= config.wsMaxReconnectAttempts) return;
      reconnectAttempts.current += 1;
      setReconnectCount(reconnectAttempts.current);
      const delay = Math.min(
        config.wsReconnectDelayMs * Math.pow(1.5, reconnectAttempts.current - 1),
        30_000,
      );
      reconnectTimer.current = setTimeout(connect, delay);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { status, reconnectCount };
}
