import { Server as SocketIOServer } from 'socket.io';
import { EventEmitter } from 'events';
import {
  initializeAgentEvents,
  emitAgentEvent,
  AgentEventType,
  AgentStartedEvent,
  AgentCompletedEvent,
  AgentFailedEvent,
  AgentProgressEvent,
  AgentScheduledEvent,
} from '../../socket/agentEvents';
import { schedulerSingleton } from '../../services/schedulerSingleton';
import { logger } from '../../utils/logger';

// Mock dependencies
jest.mock('../../services/schedulerSingleton');
jest.mock('../../utils/logger');

// Create a mock scheduler that extends EventEmitter
class MockScheduler extends EventEmitter {
  // Add any scheduler methods needed for testing
}

describe('WebSocket Agent Events', () => {
  let mockIO: jest.Mocked<SocketIOServer>;
  let mockScheduler: MockScheduler;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock scheduler with event emitter capabilities
    mockScheduler = new MockScheduler();

    // Mock the schedulerSingleton to return our mock scheduler
    (schedulerSingleton.getScheduler as jest.Mock).mockReturnValue(
      mockScheduler,
    );

    // Mock Socket.IO server
    mockIO = {
      emit: jest.fn(),
      on: jest.fn(),
      of: jest.fn(),
      to: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      sockets: {
        emit: jest.fn(),
        sockets: new Map(),
      },
      engine: {} as any,
      close: jest.fn(),
      listen: jest.fn(),
    } as any;

    // Mock logger methods
    (logger.info as jest.Mock) = jest.fn();
    (logger.debug as jest.Mock) = jest.fn();
    (logger.error as jest.Mock) = jest.fn();
  });

  describe('initializeAgentEvents', () => {
    it('should initialize all agent event handlers', () => {
      // Act
      initializeAgentEvents(mockIO);

      // Assert
      expect(schedulerSingleton.getScheduler).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        'Agent WebSocket events initialized',
      );

      // Verify all event listeners are registered
      expect(mockScheduler.listenerCount('agentStarted')).toBe(1);
      expect(mockScheduler.listenerCount('agentCompleted')).toBe(1);
      expect(mockScheduler.listenerCount('agentFailed')).toBe(1);
      expect(mockScheduler.listenerCount('agentProgress')).toBe(1);
      expect(mockScheduler.listenerCount('agentScheduled')).toBe(1);
    });
  });

  describe('Agent Event Broadcasting', () => {
    beforeEach(() => {
      // Initialize events before each test
      initializeAgentEvents(mockIO);
    });

    it('should broadcast agent started event', () => {
      // Arrange
      const event: AgentStartedEvent = {
        agentId: 'agent-123',
        sessionId: 'session-456',
        timestamp: new Date(),
        scheduledBy: 'cron',
      };

      // Act
      mockScheduler.emit('agentStarted', event);

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        'Broadcasting agent started event: agent-123',
      );
      expect(mockIO.emit).toHaveBeenCalledWith(
        AgentEventType.AGENT_STARTED,
        event,
      );
    });

    it('should broadcast agent completed event', () => {
      // Arrange
      const event: AgentCompletedEvent = {
        agentId: 'agent-123',
        sessionId: 'session-456',
        timestamp: new Date(),
        duration: 5000,
        result: { success: true, data: 'test result' },
      };

      // Act
      mockScheduler.emit('agentCompleted', event);

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        'Broadcasting agent completed event: agent-123',
      );
      expect(mockIO.emit).toHaveBeenCalledWith(
        AgentEventType.AGENT_COMPLETED,
        event,
      );
    });

    it('should broadcast agent failed event', () => {
      // Arrange
      const event: AgentFailedEvent = {
        agentId: 'agent-123',
        sessionId: 'session-456',
        timestamp: new Date(),
        error: 'Test error message',
        retryCount: 2,
        willRetry: true,
      };

      // Act
      mockScheduler.emit('agentFailed', event);

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        'Broadcasting agent failed event: agent-123',
      );
      expect(mockIO.emit).toHaveBeenCalledWith(
        AgentEventType.AGENT_FAILED,
        event,
      );
    });

    it('should broadcast agent progress event', () => {
      // Arrange
      const event: AgentProgressEvent = {
        agentId: 'agent-123',
        sessionId: 'session-456',
        timestamp: new Date(),
        progress: 75,
        message: 'Processing data...',
      };

      // Act
      mockScheduler.emit('agentProgress', event);

      // Assert
      expect(logger.debug).toHaveBeenCalledWith(
        'Broadcasting agent progress event: agent-123 - 75%',
      );
      expect(mockIO.emit).toHaveBeenCalledWith(
        AgentEventType.AGENT_PROGRESS,
        event,
      );
    });

    it('should broadcast agent scheduled event', () => {
      // Arrange
      const event: AgentScheduledEvent = {
        agentId: 'agent-123',
        cronExpression: '0 */6 * * *',
        nextRunAt: new Date('2025-06-01T00:00:00Z'),
        enabled: true,
      };

      // Act
      mockScheduler.emit('agentScheduled', event);

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        'Broadcasting agent scheduled event: agent-123',
      );
      expect(mockIO.emit).toHaveBeenCalledWith(
        AgentEventType.AGENT_SCHEDULED,
        event,
      );
    });
  });

  describe('emitAgentEvent', () => {
    it('should emit custom agent event', () => {
      // Arrange
      const customEvent = 'custom:agent:event';
      const eventData = {
        agentId: 'agent-123',
        customField: 'custom value',
      };

      // Act
      emitAgentEvent(mockIO, customEvent, eventData);

      // Assert
      expect(mockIO.emit).toHaveBeenCalledWith(customEvent, eventData);
    });

    it('should handle null data', () => {
      // Act
      emitAgentEvent(mockIO, 'test:event', null);

      // Assert
      expect(mockIO.emit).toHaveBeenCalledWith('test:event', null);
    });

    it('should handle undefined data', () => {
      // Act
      emitAgentEvent(mockIO, 'test:event', undefined);

      // Assert
      expect(mockIO.emit).toHaveBeenCalledWith('test:event', undefined);
    });
  });

  describe('Event Payload Validation', () => {
    beforeEach(() => {
      initializeAgentEvents(mockIO);
    });

    it('should handle events with missing optional fields', () => {
      // Arrange
      const minimalEvent = {
        agentId: 'agent-123',
        sessionId: 'session-456',
        timestamp: new Date(),
      };

      // Act
      mockScheduler.emit('agentStarted', minimalEvent);

      // Assert
      expect(mockIO.emit).toHaveBeenCalled();
    });

    it('should handle multiple rapid events', () => {
      // Arrange
      const events = Array.from({ length: 10 }, (_, i) => ({
        agentId: `agent-${i}`,
        sessionId: `session-${i}`,
        timestamp: new Date(),
        progress: i * 10,
        message: `Progress ${i * 10}%`,
      }));

      // Act
      events.forEach((event) => {
        mockScheduler.emit('agentProgress', event);
      });

      // Assert
      expect(mockIO.emit).toHaveBeenCalledTimes(10);
      events.forEach((event, i) => {
        expect(logger.debug).toHaveBeenCalledWith(
          `Broadcasting agent progress event: agent-${i} - ${i * 10}%`,
        );
      });
    });
  });

  describe('Error Scenarios', () => {
    beforeEach(() => {
      initializeAgentEvents(mockIO);
    });

    it('should handle IO emit errors gracefully', () => {
      // Arrange
      mockIO.emit = jest.fn().mockImplementation(() => {
        throw new Error('Socket emit error');
      });

      const event: AgentStartedEvent = {
        agentId: 'agent-123',
        sessionId: 'session-456',
        timestamp: new Date(),
        scheduledBy: 'manual',
      };

      // Act & Assert - should not throw
      expect(() => {
        mockScheduler.emit('agentStarted', event);
      }).toThrow('Socket emit error');
    });

    it('should handle scheduler not initialized error', () => {
      // Arrange
      (schedulerSingleton.getScheduler as jest.Mock).mockImplementation(() => {
        throw new Error('Scheduler not initialized');
      });

      // Create new mock IO to test initialization error
      const newMockIO = {
        emit: jest.fn(),
      } as any;

      // Act & Assert
      expect(() => {
        initializeAgentEvents(newMockIO);
      }).toThrow('Scheduler not initialized');
    });
  });

  describe('Integration with Scheduler Events', () => {
    it('should properly chain events from scheduler to socket', async () => {
      // Arrange
      initializeAgentEvents(mockIO);

      const startEvent: AgentStartedEvent = {
        agentId: 'agent-123',
        sessionId: 'session-456',
        timestamp: new Date(),
        scheduledBy: 'manual',
      };

      const progressEvents = [25, 50, 75, 100].map((progress) => ({
        agentId: 'agent-123',
        sessionId: 'session-456',
        timestamp: new Date(),
        progress,
        message: `Progress: ${progress}%`,
      }));

      const completeEvent: AgentCompletedEvent = {
        agentId: 'agent-123',
        sessionId: 'session-456',
        timestamp: new Date(),
        duration: 10000,
        result: { success: true },
      };

      // Act - simulate full agent execution lifecycle
      mockScheduler.emit('agentStarted', startEvent);

      for (const progressEvent of progressEvents) {
        mockScheduler.emit('agentProgress', progressEvent);
      }

      mockScheduler.emit('agentCompleted', completeEvent);

      // Assert
      expect(mockIO.emit).toHaveBeenCalledTimes(6); // 1 start + 4 progress + 1 complete
      expect(mockIO.emit).toHaveBeenNthCalledWith(
        1,
        AgentEventType.AGENT_STARTED,
        startEvent,
      );
      expect(mockIO.emit).toHaveBeenLastCalledWith(
        AgentEventType.AGENT_COMPLETED,
        completeEvent,
      );
    });
  });
});
