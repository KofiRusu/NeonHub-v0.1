'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Calendar, 
  Clock, 
  Play, 
  Pause, 
  RefreshCw,
  Activity,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { AgentMonitor } from '@/components/agents/AgentMonitor';

interface ScheduledAgent {
  agentId: string;
  agentName: string;
  priority: number;
  nextRunTime: string;
  retryCount: number;
  lastError?: string;
  backoffUntil?: string;
  isRunning: boolean;
  isPaused: boolean;
  jobId?: string;
}

interface SchedulerStats {
  isRunning: boolean;
  scheduledTasksCount: number;
  runningAgentsCount: number;
  queuedTasksCount: number;
  maxConcurrentAgents: number;
  pausedJobsCount: number;
}

async function fetchScheduledAgents(): Promise<ScheduledAgent[]> {
  const response = await fetch('/api/agents', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch agents');
  }

  const agents = await response.json();
  const scheduledAgents: ScheduledAgent[] = [];

  // Fetch schedule details for each agent
  for (const agent of agents.data) {
    try {
      const scheduleResponse = await fetch(`/api/agents/${agent.id}/schedule`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (scheduleResponse.ok) {
        const scheduleData = await scheduleResponse.json();
        if (scheduleData.data.scheduleEnabled && scheduleData.data.taskDetails) {
          scheduledAgents.push({
            agentId: agent.id,
            agentName: agent.name,
            ...scheduleData.data.taskDetails,
          });
        }
      }
    } catch (error) {
      console.error(`Failed to fetch schedule for agent ${agent.id}:`, error);
    }
  }

  return scheduledAgents;
}

async function fetchSchedulerStats(): Promise<SchedulerStats> {
  const response = await fetch('/api/agents/schedule/status', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch scheduler status');
  }

  const data = await response.json();
  return data.data;
}

export default function SchedulerOverviewPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const { data: agents, isLoading: agentsLoading, refetch: refetchAgents } = useQuery({
    queryKey: ['scheduled-agents'],
    queryFn: fetchScheduledAgents,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['scheduler-stats'],
    queryFn: fetchSchedulerStats,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    const socketInstance = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000');
    setSocket(socketInstance);

    // Subscribe to scheduler updates
    socketInstance.emit('subscribe-scheduler-updates');

    // Listen for scheduler status updates
    socketInstance.on('scheduler:status', () => {
      refetchStats();
      refetchAgents();
    });

    // Cleanup
    return () => {
      socketInstance.emit('unsubscribe-scheduler-updates');
      socketInstance.disconnect();
    };
  }, [refetchStats, refetchAgents]);

  const getPriorityBadge = (priority: number) => {
    switch (priority) {
      case 4:
        return <Badge className="bg-red-500">Critical</Badge>;
      case 3:
        return <Badge className="bg-orange-500">High</Badge>;
      case 2:
        return <Badge className="bg-blue-500">Normal</Badge>;
      case 1:
        return <Badge className="bg-gray-500">Low</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusBadge = (agent: ScheduledAgent) => {
    if (agent.isRunning) {
      return <Badge className="bg-blue-500">Running</Badge>;
    }
    if (agent.isPaused) {
      return <Badge className="bg-yellow-500">Paused</Badge>;
    }
    if (agent.lastError) {
      return <Badge className="bg-red-500">Error</Badge>;
    }
    return <Badge className="bg-green-500">Scheduled</Badge>;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Agent Scheduler Overview</h1>
        <Button onClick={() => { refetchAgents(); refetchStats(); }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Scheduler Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : stats ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduler Status</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.isRunning ? 'Running' : 'Stopped'}
                </div>
                <Badge className={stats.isRunning ? 'bg-green-500 mt-2' : 'bg-red-500 mt-2'}>
                  {stats.isRunning ? 'Active' : 'Inactive'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduled Tasks</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.scheduledTasksCount}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.pausedJobsCount} paused
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Running Agents</CardTitle>
                <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.runningAgentsCount} / {stats.maxConcurrentAgents}
                </div>
                <p className="text-xs text-muted-foreground">
                  Max concurrent limit
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Queued Tasks</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.queuedTasksCount}</div>
                <p className="text-xs text-muted-foreground">
                  Waiting to execute
                </p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* Scheduled Agents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Agents</CardTitle>
        </CardHeader>
        <CardContent>
          {agentsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : agents && agents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Retry Count</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.agentId}>
                    <TableCell className="font-medium">{agent.agentName}</TableCell>
                    <TableCell>{getStatusBadge(agent)}</TableCell>
                    <TableCell>{getPriorityBadge(agent.priority)}</TableCell>
                    <TableCell>
                      {agent.nextRunTime
                        ? format(new Date(agent.nextRunTime), 'PPp')
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{agent.retryCount}</span>
                        {agent.lastError && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedAgent(agent.agentId)}
                      >
                        Monitor
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No scheduled agents found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Agent Monitor */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Agent Monitor</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAgent(null)}
              >
                Close
              </Button>
            </div>
            <AgentMonitor
              agentId={selectedAgent}
              agentName={agents?.find(a => a.agentId === selectedAgent)?.agentName || 'Unknown Agent'}
              jobId={agents?.find(a => a.agentId === selectedAgent)?.jobId}
              canControl={true}
            />
          </div>
        </div>
      )}
    </div>
  );
} 