'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.AgentEventType = void 0;
exports.initializeAgentEvents = initializeAgentEvents;
exports.emitAgentEvent = emitAgentEvent;
const logger_1 = require('../utils/logger');
// Event types
var AgentEventType;
(function (AgentEventType) {
  AgentEventType['AGENT_STARTED'] = 'agent:started';
  AgentEventType['AGENT_COMPLETED'] = 'agent:completed';
  AgentEventType['AGENT_FAILED'] = 'agent:failed';
  AgentEventType['AGENT_PROGRESS'] = 'agent:progress';
  AgentEventType['AGENT_SCHEDULED'] = 'agent:scheduled';
})(AgentEventType || (exports.AgentEventType = AgentEventType = {}));
/**
 * Initialize agent event handlers for Socket.IO
 */
function initializeAgentEvents(io) {
  // TODO: AgentScheduler doesn't currently extend EventEmitter
  // The event handling would need to be implemented differently
  // For now, we'll just log that the events are initialized
  logger_1.logger.info(
    'Agent WebSocket events initialized (event listeners not yet implemented)',
  );
  // The following code is commented out until AgentScheduler supports events:
  /*
    const scheduler = schedulerSingleton.getScheduler();
  
    // Agent started event
    scheduler.on('agentStarted', (data: AgentStartedEvent) => {
      logger.info(`Broadcasting agent started event: ${data.agentId}`);
      io.emit(AgentEventType.AGENT_STARTED, data);
    });
  
    // Agent completed event
    scheduler.on('agentCompleted', (data: AgentCompletedEvent) => {
      logger.info(`Broadcasting agent completed event: ${data.agentId}`);
      io.emit(AgentEventType.AGENT_COMPLETED, data);
    });
  
    // Agent failed event
    scheduler.on('agentFailed', (data: AgentFailedEvent) => {
      logger.info(`Broadcasting agent failed event: ${data.agentId}`);
      io.emit(AgentEventType.AGENT_FAILED, data);
    });
  
    // Agent progress event
    scheduler.on('agentProgress', (data: AgentProgressEvent) => {
      logger.debug(
        `Broadcasting agent progress event: ${data.agentId} - ${data.progress}%`,
      );
      io.emit(AgentEventType.AGENT_PROGRESS, data);
    });
  
    // Agent scheduled event
    scheduler.on('agentScheduled', (data: AgentScheduledEvent) => {
      logger.info(`Broadcasting agent scheduled event: ${data.agentId}`);
      io.emit(AgentEventType.AGENT_SCHEDULED, data);
    });
    */
}
/**
 * Emit a custom agent event
 */
function emitAgentEvent(io, event, data) {
  io.emit(event, data);
}
