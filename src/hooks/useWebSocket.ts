import { useEffect, useRef, useCallback } from 'react';
import { useConfigStore } from '@/stores/configStore';
import { useConnectionStore } from '@/stores/connectionStore';

interface WebSocketMessage {
  type: string;
  data?: unknown;
}

export function useWebSocket(onMessage?: (message: WebSocketMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const { wsBaseUrl } = useConfigStore();
  const { setStatus, setLastSync, setError } = useConnectionStore();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      wsRef.current = new WebSocket(wsBaseUrl);

      wsRef.current.onopen = () => {
        setStatus('connected');
        setError(null);
        setLastSync(new Date());
        reconnectAttempts.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          setLastSync(new Date());
          onMessage?.(message);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      wsRef.current.onclose = () => {
        setStatus('disconnected');
        attemptReconnect();
      };

      wsRef.current.onerror = () => {
        setStatus('error');
        setError('WebSocket connection failed');
      };
    } catch (error) {
      setStatus('error');
      setError('Failed to create WebSocket connection');
    }
  }, [wsBaseUrl, setStatus, setLastSync, setError, onMessage]);

  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      setStatus('error');
      setError('Max reconnection attempts reached');
      return;
    }

    setStatus('reconnecting');
    reconnectAttempts.current += 1;

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect, setStatus, setError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close();
    setStatus('disconnected');
  }, [setStatus]);

  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { connect, disconnect, send };
}
