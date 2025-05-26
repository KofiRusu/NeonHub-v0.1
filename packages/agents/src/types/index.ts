/**
 * NeonHub Custom Agent Framework - Core Types
 * Comprehensive TypeScript definitions for agent communication and coordination
 */

// ============================================================================
// DOMAIN EVENTS
// ============================================================================

export interface DomainEvent {
  id: string;
  type: string;
  source: string;
  timestamp: Date;
  version: string;
  data: Record<string, any>;
  metadata?: EventMetadata;
}

export interface EventMetadata {
  correlationId?: string;
  causationId?: string;
  userId?: string;
  sessionId?: string;
  traceId?: string;
}

export type EventType = 
  | 'campaign.created'
  | 'campaign.updated'
  | 'campaign.deleted'
  | 'user.signup'
  | 'user.login'
  | 'error.occurred'
  | 'system.health_check'
  | 'agent.heartbeat'
  | 'deployment.started'
  | 'deployment.completed';

// ============================================================================
// AGENT REPORTS & RESULTS
// ============================================================================

export interface AgentReport {
  agentId: string;
  agentName: string;
  executionId: string;
  timestamp: Date;
  status: AgentStatus;
  duration: number;
  result: AgentResult;
  metrics?: AgentMetrics;
  errors?: AgentError[];
}

export interface AgentResult {
  success: boolean;
  message: string;
  data?: Record<string, any>;
  actions?: AgentAction[];
  recommendations?: string[];
}

export interface AgentAction {
  type: ActionType;
  description: string;
  payload: Record<string, any>;
  executed: boolean;
  timestamp: Date;
}

export type ActionType =
  | 'fix.lint'
  | 'fix.type_error'
  | 'generate.test'
  | 'update.documentation'
  | 'optimize.performance'
  | 'scale.infrastructure'
  | 'create.issue'
  | 'rollback.deployment';

export interface AgentMetrics {
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  filesProcessed: number;
  linesChanged: number;
  testsGenerated: number;
  issuesFixed: number;
}

export interface AgentError {
  code: string;
  message: string;
  stack?: string;
  context?: Record<string, any>;
  severity: ErrorSeverity;
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// ============================================================================
// AGENT STATUS & HEALTH
// ============================================================================

export type AgentStatus = 
  | 'idle'
  | 'running'
  | 'completed'
  | 'failed'
  | 'paused'
  | 'disabled';

export interface AgentHealth {
  agentId: string;
  status: AgentStatus;
  lastHeartbeat: Date;
  uptime: number;
  version: string;
  endpoint: string;
  capabilities: string[];
  load: AgentLoad;
}

export interface AgentLoad {
  queueSize: number;
  activeJobs: number;
  averageExecutionTime: number;
  errorRate: number;
  throughput: number;
}

// ============================================================================
// REGISTRY & CONFIGURATION
// ============================================================================

export interface AgentRegistryEntry {
  id: string;
  name: string;
  type: AgentType;
  endpoint: string;
  active: boolean;
  version: string;
  capabilities: string[];
  configuration: AgentConfiguration;
  lastHeartbeat: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type AgentType = 
  | 'architecture'
  | 'backend'
  | 'frontend'
  | 'devops'
  | 'qa'
  | 'docs'
  | 'debug'
  | 'performance'
  | 'security'
  | 'monitoring';

export interface AgentConfiguration {
  triggers: string[];
  schedule?: string;
  timeout: number;
  retries: number;
  autoCommit: boolean;
  qualityGates: Record<string, string>;
  environment: Record<string, string>;
}

// ============================================================================
// EXECUTION CONTEXT
// ============================================================================

export interface ExecutionContext {
  executionId: string;
  agentId: string;
  event?: DomainEvent;
  payload: Record<string, any>;
  environment: string;
  timeout: number;
  retryCount: number;
  correlationId?: string;
  parentExecutionId?: string;
}

export interface ExecutionResult {
  executionId: string;
  success: boolean;
  duration: number;
  output: Record<string, any>;
  logs: LogEntry[];
  metrics: AgentMetrics;
  nextActions?: AgentAction[];
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// ============================================================================
// COMMUNICATION PROTOCOLS
// ============================================================================

export interface AgentRequest {
  id: string;
  agentId: string;
  method: string;
  payload: Record<string, any>;
  timeout?: number;
  priority?: number;
  metadata?: Record<string, any>;
}

export interface AgentResponse {
  id: string;
  success: boolean;
  data?: Record<string, any>;
  error?: AgentError;
  duration: number;
  timestamp: Date;
}

// ============================================================================
// ORCHESTRATOR TYPES
// ============================================================================

export interface OrchestratorConfig {
  eventBus: EventBusConfig;
  agents: AgentRegistryEntry[];
  workflows: WorkflowDefinition[];
  monitoring: MonitoringConfig;
}

export interface EventBusConfig {
  type: 'kafka' | 'redis' | 'memory';
  connection: Record<string, any>;
  topics: string[];
  retryPolicy: RetryPolicy;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential';
  baseDelay: number;
  maxDelay: number;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  trigger: EventType;
  agents: string[];
  parallel: boolean;
  failureStrategy: 'fail_fast' | 'continue_on_error';
  timeout: number;
}

export interface MonitoringConfig {
  metricsEnabled: boolean;
  metricsPort: number;
  healthCheckInterval: number;
  alerting: AlertingConfig;
}

export interface AlertingConfig {
  enabled: boolean;
  channels: string[];
  thresholds: Record<string, number>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface ReportRecord {
  id: string;
  agentId: string;
  timestamp: Date;
  type: 'execution' | 'health' | 'error' | 'metric';
  data: Record<string, any>;
  retention: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AgentCapability {
  name: string;
  version: string;
  description: string;
  parameters: Record<string, any>;
}

// ============================================================================
// EXPORTS
// ============================================================================

export * from './events';
export * from './metrics';
export * from './errors'; 