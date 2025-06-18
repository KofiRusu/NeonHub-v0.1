'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __exportStar =
  (this && this.__exportStar) ||
  function (m, exports) {
    for (var p in m)
      if (p !== 'default' && !Object.prototype.hasOwnProperty.call(exports, p))
        __createBinding(exports, m, p);
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.createAgentFactory =
  exports.pluginRegistry =
  exports.AgentEventType =
  exports.BaseAgent =
  exports.AgentFactory =
  exports.AgentScheduler =
  exports.AgentManager =
    void 0;
exports.getAgentManager = getAgentManager;
exports.getAgentScheduler = getAgentScheduler;
exports.getAgentFactory = getAgentFactory;
exports.initializeAgentSystem = initializeAgentSystem;
exports.cleanupAgentSystem = cleanupAgentSystem;
const AgentManager_1 = require('./manager/AgentManager');
Object.defineProperty(exports, 'AgentManager', {
  enumerable: true,
  get: function () {
    return AgentManager_1.AgentManager;
  },
});
const AgentScheduler_1 = require('./scheduler/AgentScheduler');
Object.defineProperty(exports, 'AgentScheduler', {
  enumerable: true,
  get: function () {
    return AgentScheduler_1.AgentScheduler;
  },
});
const AgentFactory_1 = require('./factory/AgentFactory');
Object.defineProperty(exports, 'AgentFactory', {
  enumerable: true,
  get: function () {
    return AgentFactory_1.AgentFactory;
  },
});
Object.defineProperty(exports, 'createAgentFactory', {
  enumerable: true,
  get: function () {
    return AgentFactory_1.createAgentFactory;
  },
});
Object.defineProperty(exports, 'pluginRegistry', {
  enumerable: true,
  get: function () {
    return AgentFactory_1.pluginRegistry;
  },
});
const BaseAgent_1 = require('./base/BaseAgent');
Object.defineProperty(exports, 'BaseAgent', {
  enumerable: true,
  get: function () {
    return BaseAgent_1.BaseAgent;
  },
});
Object.defineProperty(exports, 'AgentEventType', {
  enumerable: true,
  get: function () {
    return BaseAgent_1.AgentEventType;
  },
});
// Import and register all plugins
require('./implementations');
// Singleton instances
let agentManager = null;
let agentScheduler = null;
let agentFactory = null;
/**
 * Get or create the agent manager instance
 * @param prisma Prisma client instance
 * @returns AgentManager instance
 */
function getAgentManager(prisma) {
  if (!agentManager) {
    agentManager = new AgentManager_1.AgentManager(prisma);
  }
  return agentManager;
}
/**
 * Get or create the agent scheduler instance
 * @param prisma Prisma client instance
 * @param manager Optional agent manager instance
 * @returns AgentScheduler instance
 */
function getAgentScheduler(prisma, manager) {
  if (!agentScheduler) {
    const agentMgr = manager || getAgentManager(prisma);
    agentScheduler = new AgentScheduler_1.AgentScheduler(prisma, agentMgr, {
      checkInterval: 60000, // 1 minute
      maxConcurrentAgents: 5,
      maxRetries: 3,
      baseBackoffDelay: 1000,
      maxBackoffDelay: 300000, // 5 minutes
      autoStart: true,
      runMissedOnStartup: true,
    });
  }
  return agentScheduler;
}
/**
 * Get or create the agent factory instance
 * @param prisma Prisma client instance
 * @returns AgentFactory instance
 */
function getAgentFactory(prisma) {
  if (!agentFactory) {
    agentFactory = (0, AgentFactory_1.createAgentFactory)(prisma);
  }
  return agentFactory;
}
/**
 * Initialize the agent system
 * @param prisma Prisma client instance
 * @returns Initialized agent system components
 */
function initializeAgentSystem(prisma) {
  const manager = getAgentManager(prisma);
  const scheduler = getAgentScheduler(prisma, manager);
  const factory = getAgentFactory(prisma);
  console.log('Agent system initialized successfully');
  console.log(
    `Available agent types: ${factory.getAvailableAgentTypes().length}`,
  );
  console.log(`Scheduler running: ${scheduler.isSchedulerRunning()}`);
  return { manager, scheduler, factory };
}
/**
 * Cleanup agent system resources
 */
function cleanupAgentSystem() {
  if (agentScheduler) {
    agentScheduler.stop();
  }
  agentManager = null;
  agentScheduler = null;
  agentFactory = null;
  console.log('Agent system cleaned up');
}
// Export types
__exportStar(require('./types'), exports);
__exportStar(require('./base/BaseAgent'), exports);
__exportStar(require('./factory/AgentFactory'), exports);
__exportStar(require('./scheduler/AgentScheduler'), exports);
