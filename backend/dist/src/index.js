"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentScheduler = exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
// Routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const project_routes_1 = __importDefault(require("./routes/project.routes"));
const task_routes_1 = __importDefault(require("./routes/task.routes"));
const message_routes_1 = __importDefault(require("./routes/message.routes"));
const document_routes_1 = __importDefault(require("./routes/document.routes"));
// Middleware
const error_middleware_1 = require("./middleware/error.middleware");
// Controllers
const message_controller_1 = require("./controllers/message.controller");
// Socket.io configuration
const agentOutput_1 = require("./socket/agentOutput");
// Agent scheduler
const AgentScheduler_1 = require("./agents/scheduler/AgentScheduler");
const agents_1 = require("./agents");
// Initialize environment variables
dotenv_1.default.config();
// Initialize Express app
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Initialize Prisma client
exports.prisma = new client_1.PrismaClient();
// Initialize Socket.io
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
// Pass Socket.io instance to message controller
(0, message_controller_1.setIo)(io);
// Configure agent socket and store the instance globally
const agentIo = (0, agentOutput_1.configureAgentSocket)(httpServer, exports.prisma);
(0, agentOutput_1.setSocketIO)(agentIo);
// Initialize agent scheduler
const agentManager = (0, agents_1.getAgentManager)(exports.prisma);
const agentScheduler = new AgentScheduler_1.AgentScheduler(exports.prisma, agentManager, {
    runMissedOnStartup: true,
    autoStart: true,
    checkInterval: 30000, // Check every 30 seconds
});
exports.agentScheduler = agentScheduler;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
// Static files
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.use('/public', express_1.default.static(path_1.default.join(__dirname, 'public')));
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/projects', project_routes_1.default);
app.use('/api/tasks', task_routes_1.default);
app.use('/api/messages', message_routes_1.default);
app.use('/api/documents', document_routes_1.default);
// Health check route
app.get('/health', (req, res) => {
    // Check database connection
    exports.prisma.$queryRaw `SELECT 1`
        .then(() => {
        res.status(200).json({
            status: 'ok',
            timestamp: new Date(),
            uptime: process.uptime(),
            databaseConnected: true,
        });
    })
        .catch((err) => {
        console.error('Health check database error:', err);
        res.status(500).json({
            status: 'error',
            timestamp: new Date(),
            uptime: process.uptime(),
            databaseConnected: false,
            error: 'Database connection failed',
        });
    });
});
// Error handling middleware
app.use(error_middleware_1.errorHandler);
// Socket.io connection handler
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    // Join a room (project)
    socket.on('join-project', (projectId) => {
        socket.join(projectId);
        console.log(`User ${socket.id} joined project ${projectId}`);
    });
    // Leave a room (project)
    socket.on('leave-project', (projectId) => {
        socket.leave(projectId);
        console.log(`User ${socket.id} left project ${projectId}`);
    });
    // User typing indicator
    socket.on('typing', ({ projectId, user, }) => {
        socket.to(projectId).emit('user-typing', user);
    });
    // User stopped typing
    socket.on('stop-typing', (projectId) => {
        socket.to(projectId).emit('user-stopped-typing');
    });
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});
// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    // Close server & exit process
    httpServer.close(() => process.exit(1));
});
// Clean up Prisma on exit
process.on('SIGINT', async () => {
    await exports.prisma.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await exports.prisma.$disconnect();
    process.exit(0);
});
//# sourceMappingURL=index.js.map