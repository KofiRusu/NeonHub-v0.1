'use client';

import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Pause, Play, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface AgentProgressData {
  agentId: string;
  jobId?: string;
  progress: number;
  message?: string;
  currentStep?: string;
  totalSteps?: number;
  timestamp: string;
}

interface AgentEventData {
  agentId: string;
  jobId?: string;
  status: string;
  message?: string;
  error?: string;
  duration?: number;
  timestamp: string;
}

interface AgentMonitorProps {
  agentId: string;
  agentName: string;
  jobId?: string;
  canControl?: boolean;
}

export function AgentMonitor({
  agentId,
  agentName,
  jobId,
  canControl = false,
}: AgentMonitorProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<
    'idle' | 'running' | 'paused' | 'completed' | 'failed'
  >('idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [duration, setDuration] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Connect to WebSocket
    const socketInstance = io(
      process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000',
    );
    setSocket(socketInstance);

    // Subscribe to agent updates
    socketInstance.emit('subscribe-agent-updates', agentId);

    // Listen for agent events
    socketInstance.on('agent:started', (data: AgentEventData) => {
      if (data.agentId === agentId) {
        setStatus('running');
        setProgress(0);
        setError('');
        setDuration(null);
      }
    });

    socketInstance.on('agent:progress', (data: AgentProgressData) => {
      if (data.agentId === agentId) {
        setProgress(data.progress);
        if (data.message) {
          setProgressMessage(data.message);
        }
      }
    });

    socketInstance.on('agent:completed', (data: AgentEventData) => {
      if (data.agentId === agentId) {
        setStatus('completed');
        setProgress(100);
        if (data.duration) {
          setDuration(data.duration);
        }
      }
    });

    socketInstance.on('agent:failed', (data: AgentEventData) => {
      if (data.agentId === agentId) {
        setStatus('failed');
        if (data.error) {
          setError(data.error);
        }
      }
    });

    socketInstance.on('agent:paused', (data: AgentEventData) => {
      if (data.agentId === agentId) {
        setStatus('paused');
      }
    });

    socketInstance.on('agent:resumed', (data: AgentEventData) => {
      if (data.agentId === agentId) {
        setStatus('running');
      }
    });

    // Cleanup
    return () => {
      socketInstance.emit('unsubscribe-agent-updates', agentId);
      socketInstance.disconnect();
    };
  }, [agentId]);

  const handlePause = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/agents/${agentId}/schedule/${jobId || agentId}/pause`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to pause agent');
      }

      toast({
        title: 'Agent Paused',
        description: `${agentName} has been paused successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to pause agent. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/agents/${agentId}/schedule/${jobId || agentId}/resume`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to resume agent');
      }

      toast({
        title: 'Agent Resumed',
        description: `${agentName} has been resumed successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resume agent. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'running':
        return <Badge className="bg-blue-500">Running</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500">Paused</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">Failed</Badge>;
      default:
        return <Badge variant="secondary">Idle</Badge>;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'running':
        return <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <CardTitle>{agentName}</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
            {canControl && status === 'running' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handlePause}
                disabled={isLoading}
              >
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
            )}
            {canControl && status === 'paused' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleResume}
                disabled={isLoading}
              >
                <Play className="h-4 w-4 mr-1" />
                Resume
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {(status === 'running' || status === 'paused') && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              {progressMessage && (
                <p className="text-sm text-muted-foreground">
                  {progressMessage}
                </p>
              )}
            </div>
          )}

          {status === 'failed' && error && (
            <div className="rounded-lg bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {status === 'completed' && duration && (
            <div className="rounded-lg bg-green-50 p-3">
              <p className="text-sm text-green-800">
                Completed in {(duration / 1000).toFixed(2)} seconds
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Agent ID:</span>
              <p className="font-mono text-xs">{agentId}</p>
            </div>
            {jobId && (
              <div>
                <span className="text-muted-foreground">Job ID:</span>
                <p className="font-mono text-xs">{jobId}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
