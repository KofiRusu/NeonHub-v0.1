'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../../../components/ui/tabs';
import { Badge } from '../../../../../components/ui/badge';
import { Textarea } from '../../../../../components/ui/textarea';
import {
  Play,
  AlertCircle,
  CheckCircle,
  Clock,
  Terminal,
  FileText,
  Info,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  context?: Record<string, any>;
}

interface AgentOutput {
  success?: boolean;
  data?: any;
  error?: {
    message: string;
    stack?: string;
  };
}

export default function AgentRunPage() {
  const params = useParams();
  const agentId = params.id as string;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agentType, setAgentType] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<AgentOutput | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState('{}');
  const [isValidJson, setIsValidJson] = useState(true);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch agent details
    const fetchAgentDetails = async () => {
      try {
        const response = await fetch(`/api/agents/${agentId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.agent) {
            setAgentName(data.agent.name);
            setAgentType(data.agent.type);
          }
        }
      } catch (error) {
        console.error('Error fetching agent details:', error);
      }
    };

    fetchAgentDetails();

    // Initialize Socket.io connection
    const socketInstance = io(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/agents`,
    );

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to WebSocket server');

      // Join room for this specific agent
      socketInstance.emit('join:agent', agentId);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket server');
    });

    // Set up event listeners
    socketInstance.on('agent:start', (data) => {
      console.log('Agent started:', data);
      setIsRunning(true);
      setOutput(null);
      setDuration(null);
      setError(null);
      setLogs([]);

      // Add initial log
      const startLog: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Started execution for agent: ${data.name || agentId}`,
      };
      setLogs([startLog]);
    });

    socketInstance.on('agent:log', (data) => {
      console.log('Agent log:', data);
      if (data.log) {
        setLogs((prev) => [...prev, data.log]);
      }
    });

    socketInstance.on('agent:done', (data) => {
      console.log('Agent done:', data);
      setIsRunning(false);
      setOutput({
        success: true,
        data: data.data,
      });
      setDuration(data.duration);

      // Add final log
      const completeLog: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Execution completed successfully in ${data.duration}ms`,
      };
      setLogs((prev) => [...prev, completeLog]);
    });

    socketInstance.on('agent:error', (data) => {
      console.log('Agent error:', data);
      setIsRunning(false);
      setError(data.error.message);
      setOutput({
        success: false,
        error: data.error,
      });

      // Add error log
      const errorLog: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Execution failed: ${data.error.message}`,
        context: { stack: data.error.stack },
      };
      setLogs((prev) => [...prev, errorLog]);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [agentId]);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Validate JSON input for context
  useEffect(() => {
    try {
      JSON.parse(context);
      setIsValidJson(true);
    } catch (e) {
      setIsValidJson(false);
    }
  }, [context]);

  const runAgent = async () => {
    if (!isValidJson) return;

    try {
      let contextData = {};
      try {
        contextData = JSON.parse(context);
      } catch (e) {
        // If parsing fails, use empty object
        console.error('Failed to parse context JSON:', e);
      }

      const response = await fetch('/api/agents/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId,
          context: contextData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to run agent');
      }

      // WebSocket events will handle the UI updates
    } catch (error) {
      console.error('Error running agent:', error);
      setError(
        error instanceof Error ? error.message : 'An unknown error occurred',
      );
    }
  };

  const getLogBadgeColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      case 'debug':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            {agentName || 'Agent'} Execution
          </h1>
          <p className="text-muted-foreground">
            Monitor agent execution and see real-time output
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge variant="outline" className="bg-green-100 text-green-800">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
              Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-100 text-red-800">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span>
              Disconnected
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Run Agent</CardTitle>
              <CardDescription>Configure and execute the agent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Context (JSON)</h3>
                <Textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className={`h-60 font-mono text-sm ${!isValidJson ? 'border-red-500' : ''}`}
                  placeholder='{\n  "key": "value"\n}'
                />
                {!isValidJson && (
                  <p className="text-red-500 text-xs mt-1">
                    Invalid JSON format
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={runAgent}
                disabled={isRunning || !isValidJson}
                className="w-full"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Run Agent
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {output && (
            <Card className="mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  {output.success ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Success
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                      Error
                    </>
                  )}
                </CardTitle>
                {duration !== null && (
                  <CardDescription className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Completed in {duration}ms
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                    <p className="font-semibold">Error:</p>
                    <p>{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="logs" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="logs" className="flex items-center">
                <Terminal className="h-4 w-4 mr-2" />
                Logs
              </TabsTrigger>
              <TabsTrigger value="output" className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Output
              </TabsTrigger>
            </TabsList>

            <TabsContent value="logs">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Execution Logs</CardTitle>
                  <CardDescription>
                    Real-time logs from agent execution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-black text-white font-mono text-sm p-4 rounded-md h-[600px] overflow-y-auto">
                    {logs.length === 0 ? (
                      <div className="text-gray-400 flex items-center justify-center h-full">
                        <Info className="h-4 w-4 mr-2" />
                        No logs available. Start agent execution to see logs.
                      </div>
                    ) : (
                      logs.map((log, index) => (
                        <div key={index} className="mb-2">
                          <span className="text-gray-400">
                            [{formatTimestamp(log.timestamp)}]
                          </span>{' '}
                          <span
                            className={`px-1.5 py-0.5 rounded text-xs ${getLogBadgeColor(log.level)}`}
                          >
                            {log.level.toUpperCase()}
                          </span>{' '}
                          <span>{log.message}</span>
                          {log.context && (
                            <pre className="text-xs text-gray-400 ml-8 mt-1">
                              {JSON.stringify(log.context, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))
                    )}
                    <div ref={logsEndRef} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="output">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Agent Output</CardTitle>
                  <CardDescription>
                    Final result from agent execution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 font-mono text-sm p-4 rounded-md border h-[600px] overflow-auto">
                    {output ? (
                      output.success ? (
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(output.data, null, 2)}
                        </pre>
                      ) : (
                        <div className="text-red-500">
                          <p className="font-bold mb-2">Error:</p>
                          <p>{output.error?.message}</p>
                          {output.error?.stack && (
                            <pre className="mt-4 text-xs text-gray-600 whitespace-pre-wrap">
                              {output.error.stack}
                            </pre>
                          )}
                        </div>
                      )
                    ) : (
                      <div className="text-gray-400 flex items-center justify-center h-full">
                        <Info className="h-4 w-4 mr-2" />
                        No output available. Start agent execution to see
                        results.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
