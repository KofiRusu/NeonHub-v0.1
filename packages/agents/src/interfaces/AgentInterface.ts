/**
 * NeonHub Custom Agent Framework - Core Agent Interface
 * Defines the standard lifecycle and communication protocol for all agents
 */

import {
  DomainEvent,
  AgentReport,
  ReportRecord,
  ExecutionContext,
  ExecutionResult,
  AgentHealth,
  AgentConfiguration,
  ValidationResult,
  AgentCapability,
  AgentStatus
} from '../types';

// ============================================================================
// CORE AGENT INTERFACE
// ============================================================================

/**
 * Core interface that all NeonHub agents must implement
 * Provides standardized lifecycle methods and communication protocols
 */
export interface IAgent {
  // Basic identification
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly type: string;

  // ========================================================================
  // LIFECYCLE METHODS
  // ========================================================================

  /**
   * Initialize the agent with configuration
   * Called once when the agent starts up
   */
  initialize(config: AgentConfiguration): Promise<void>;

  /**
   * Handle incoming domain events
   * Core method for event-driven agent execution
   */
  onEvent(event: DomainEvent): Promise<void>;

  /**
   * Execute agent logic with given payload
   * Primary execution method for direct agent invocation
   */
  execute(payload: any): Promise<AgentReport>;

  /**
   * Generate and return agent status report
   * Used for monitoring and health checks
   */
  report(): Promise<ReportRecord>;

  /**
   * Gracefully shutdown the agent
   * Cleanup resources and save state
   */
  shutdown(): Promise<void>;

  // ========================================================================
  // HEALTH & MONITORING
  // ========================================================================

  /**
   * Get current agent health status
   * Includes performance metrics and availability
   */
  getHealth(): Promise<AgentHealth>;

  /**
   * Perform agent self-diagnostics
   * Validate configuration and dependencies
   */
  selfDiagnostic(): Promise<ValidationResult>;

  /**
   * Get agent capabilities and supported operations
   */
  getCapabilities(): Promise<AgentCapability[]>;

  /**
   * Update agent configuration at runtime
   */
  updateConfiguration(config: Partial<AgentConfiguration>): Promise<void>;

  // ========================================================================
  // EXECUTION CONTEXT
  // ========================================================================

  /**
   * Execute with full context information
   * Advanced execution method with correlation tracking
   */
  executeWithContext(context: ExecutionContext): Promise<ExecutionResult>;

  /**
   * Validate execution payload before processing
   */
  validatePayload(payload: any): Promise<ValidationResult>;

  /**
   * Get execution history and metrics
   */
  getExecutionHistory(limit?: number): Promise<ExecutionResult[]>;
}

// ============================================================================
// SPECIALIZED AGENT INTERFACES
// ============================================================================

/**
 * Interface for agents that handle error diagnosis and debugging
 */
export interface IDebugAgent extends IAgent {
  /**
   * Analyze error and provide diagnostic information
   */
  diagnoseError(error: Error, context?: Record<string, any>): Promise<AgentReport>;

  /**
   * Suggest fixes for identified issues
   */
  suggestFixes(diagnostics: Record<string, any>): Promise<string[]>;

  /**
   * Apply automated fixes if possible
   */
  applyFixes(fixes: string[]): Promise<AgentReport>;
}

/**
 * Interface for agents that handle performance optimization
 */
export interface IPerformanceAgent extends IAgent {
  /**
   * Analyze system performance metrics
   */
  analyzePerformance(metrics: Record<string, any>): Promise<AgentReport>;

  /**
   * Recommend performance optimizations
   */
  recommendOptimizations(): Promise<string[]>;

  /**
   * Apply performance optimizations
   */
  applyOptimizations(optimizations: string[]): Promise<AgentReport>;
}

/**
 * Interface for agents that handle quality assurance
 */
export interface IQualityAgent extends IAgent {
  /**
   * Run quality checks on codebase
   */
  runQualityChecks(scope?: string[]): Promise<AgentReport>;

  /**
   * Generate missing tests
   */
  generateTests(files: string[]): Promise<AgentReport>;

  /**
   * Validate test coverage
   */
  validateCoverage(threshold: number): Promise<ValidationResult>;
}

/**
 * Interface for agents that handle documentation
 */
export interface IDocumentationAgent extends IAgent {
  /**
   * Update documentation based on code changes
   */
  updateDocumentation(changes: string[]): Promise<AgentReport>;

  /**
   * Validate documentation consistency
   */
  validateDocumentation(): Promise<ValidationResult>;

  /**
   * Generate API documentation
   */
  generateApiDocs(endpoints: string[]): Promise<AgentReport>;
}

// ============================================================================
// AGENT FACTORY INTERFACE
// ============================================================================

/**
 * Factory interface for creating agent instances
 */
export interface IAgentFactory {
  /**
   * Create agent instance by type
   */
  createAgent(type: string, config: AgentConfiguration): Promise<IAgent>;

  /**
   * Get available agent types
   */
  getAvailableTypes(): string[];

  /**
   * Validate agent configuration
   */
  validateConfiguration(type: string, config: AgentConfiguration): ValidationResult;
}

// ============================================================================
// AGENT REGISTRY INTERFACE
// ============================================================================

/**
 * Interface for agent registry management
 */
export interface IAgentRegistry {
  /**
   * Register a new agent
   */
  register(agent: IAgent): Promise<void>;

  /**
   * Unregister an agent
   */
  unregister(agentId: string): Promise<void>;

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): Promise<IAgent | null>;

  /**
   * Get all registered agents
   */
  getAllAgents(): Promise<IAgent[]>;

  /**
   * Get agents by type
   */
  getAgentsByType(type: string): Promise<IAgent[]>;

  /**
   * Update agent status
   */
  updateAgentStatus(agentId: string, status: AgentStatus): Promise<void>;

  /**
   * Get agent health status
   */
  getAgentHealth(agentId: string): Promise<AgentHealth>;
}

// ============================================================================
// ORCHESTRATOR INTERFACE
// ============================================================================

/**
 * Interface for agent orchestration and coordination
 */
export interface IAgentOrchestrator {
  /**
   * Start the orchestrator
   */
  start(): Promise<void>;

  /**
   * Stop the orchestrator
   */
  stop(): Promise<void>;

  /**
   * Dispatch event to appropriate agents
   */
  dispatchEvent(event: DomainEvent): Promise<void>;

  /**
   * Execute workflow with multiple agents
   */
  executeWorkflow(workflowId: string, payload: any): Promise<AgentReport[]>;

  /**
   * Get orchestrator health status
   */
  getHealth(): Promise<Record<string, any>>;

  /**
   * Get execution metrics
   */
  getMetrics(): Promise<Record<string, any>>;
}

// ============================================================================
// BASE AGENT ABSTRACT CLASS
// ============================================================================

/**
 * Abstract base class providing common agent functionality
 * Agents can extend this class to inherit standard behavior
 */
export abstract class BaseAgent implements IAgent {
  public readonly id: string;
  public readonly name: string;
  public readonly version: string;
  public readonly type: string;

  protected config: AgentConfiguration;
  protected status: AgentStatus = 'idle';
  protected startTime: Date;
  protected executionHistory: ExecutionResult[] = [];

  constructor(id: string, name: string, version: string, type: string) {
    this.id = id;
    this.name = name;
    this.version = version;
    this.type = type;
    this.startTime = new Date();
  }

  // Abstract methods that must be implemented by concrete agents
  abstract onEvent(event: DomainEvent): Promise<void>;
  abstract execute(payload: any): Promise<AgentReport>;

  // Default implementations that can be overridden
  async initialize(config: AgentConfiguration): Promise<void> {
    this.config = config;
    this.status = 'idle';
  }

  async report(): Promise<ReportRecord> {
    return {
      id: `${this.id}-${Date.now()}`,
      agentId: this.id,
      timestamp: new Date(),
      type: 'health',
      data: {
        status: this.status,
        uptime: Date.now() - this.startTime.getTime(),
        executionCount: this.executionHistory.length
      },
      retention: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
  }

  async shutdown(): Promise<void> {
    this.status = 'disabled';
  }

  async getHealth(): Promise<AgentHealth> {
    return {
      agentId: this.id,
      status: this.status,
      lastHeartbeat: new Date(),
      uptime: Date.now() - this.startTime.getTime(),
      version: this.version,
      endpoint: `http://localhost:3000/agents/${this.id}`,
      capabilities: [],
      load: {
        queueSize: 0,
        activeJobs: 0,
        averageExecutionTime: 0,
        errorRate: 0,
        throughput: 0
      }
    };
  }

  async selfDiagnostic(): Promise<ValidationResult> {
    return {
      valid: true,
      errors: [],
      warnings: []
    };
  }

  async getCapabilities(): Promise<AgentCapability[]> {
    return [];
  }

  async updateConfiguration(config: Partial<AgentConfiguration>): Promise<void> {
    this.config = { ...this.config, ...config };
  }

  async executeWithContext(context: ExecutionContext): Promise<ExecutionResult> {
    const startTime = Date.now();
    this.status = 'running';

    try {
      const report = await this.execute(context.payload);
      const duration = Date.now() - startTime;

      const result: ExecutionResult = {
        executionId: context.executionId,
        success: report.result.success,
        duration,
        output: report.result.data || {},
        logs: [],
        metrics: report.metrics || {
          executionTime: duration,
          memoryUsage: 0,
          cpuUsage: 0,
          filesProcessed: 0,
          linesChanged: 0,
          testsGenerated: 0,
          issuesFixed: 0
        }
      };

      this.executionHistory.push(result);
      this.status = 'idle';
      return result;
    } catch (error) {
      this.status = 'failed';
      throw error;
    }
  }

  async validatePayload(payload: any): Promise<ValidationResult> {
    return {
      valid: true,
      errors: [],
      warnings: []
    };
  }

  async getExecutionHistory(limit: number = 10): Promise<ExecutionResult[]> {
    return this.executionHistory.slice(-limit);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  IAgent,
  IDebugAgent,
  IPerformanceAgent,
  IQualityAgent,
  IDocumentationAgent,
  IAgentFactory,
  IAgentRegistry,
  IAgentOrchestrator,
  BaseAgent
}; 