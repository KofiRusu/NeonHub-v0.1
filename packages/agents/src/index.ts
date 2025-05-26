/**
 * NeonHub Custom Agent Framework
 * Main export file for all agent interfaces, types, and utilities
 */

// Core interfaces
export * from './interfaces/AgentInterface';

// Type definitions
export * from './types';

// Re-export commonly used types for convenience
export type {
  DomainEvent,
  AgentReport,
  AgentStatus,
  AgentHealth,
  AgentConfiguration,
  ExecutionContext,
  ExecutionResult,
  ValidationResult,
} from './types';
