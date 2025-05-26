'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface AgentStatusUpdate {
  agentId: string;
  status: string;
  timestamp: string;
}

interface AgentLog {
  agentId: string;
  log: {
    level: string;
    message: string;
    timestamp: string;
  };
}

export function useRealTimeAgent(agentId: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<string>('IDLE');
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000');
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('subscribe-agent-updates', agentId);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('agent-status-update', (update: AgentStatusUpdate) => {
      if (update.agentId === agentId) {
        setStatus(update.status);
      }
    });

    newSocket.on('agent-log', (logData: AgentLog) => {
      if (logData.agentId === agentId) {
        setLogs(prev => [...prev.slice(-49), logData]); // Keep last 50 logs
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('unsubscribe-agent-updates', agentId);
      newSocket.disconnect();
    };
  }, [agentId]);

  return { socket, status, logs, isConnected };
}