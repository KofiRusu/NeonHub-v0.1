"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_routes_1 = __importDefault(require("../routes/auth.routes"));
// Mock prisma client
jest.mock('@prisma/client', () => {
    const mockPrismaClient = {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        $disconnect: jest.fn(),
    };
    return {
        PrismaClient: jest.fn(() => mockPrismaClient),
    };
});
// Mock jwt utilities
jest.mock('../utils/jwt', () => ({
    generateToken: jest.fn(() => 'test-token'),
    verifyToken: jest.fn(() => ({
        id: 'test-id',
        email: 'test@example.com',
        role: 'USER',
    })),
}));
// Mock bcrypt
jest.mock('bcryptjs', () => ({
    genSalt: jest.fn(() => 'salt'),
    hash: jest.fn(() => 'hashed-password'),
    compare: jest.fn(() => true),
}));
describe('Auth Controller', () => {
    let app;
    let prisma;
    beforeAll(() => {
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        app.use('/api/auth', auth_routes_1.default);
        // Get the mocked prisma client
        prisma = new client_1.PrismaClient();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('POST /api/auth/register', () => {
        it('should register a new user', async () => {
            // Mock data
            const mockUser = {
                id: 'test-id',
                name: 'Test User',
                email: 'test@example.com',
                password: 'hashed-password',
                role: 'USER',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            // Setup mocks
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue(mockUser);
            // Test request
            const res = await (0, supertest_1.default)(app).post('/api/auth/register').send({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
            });
            // Assertions
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBe('test-token');
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
            });
            expect(bcryptjs_1.default.genSalt).toHaveBeenCalledWith(10);
            expect(bcryptjs_1.default.hash).toHaveBeenCalledWith('password123', 'salt');
            expect(prisma.user.create).toHaveBeenCalledWith({
                data: {
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'hashed-password',
                },
            });
        });
        it('should return 400 if user already exists', async () => {
            // Mock existing user
            const mockUser = {
                id: 'existing-id',
                name: 'Existing User',
                email: 'existing@example.com',
                password: 'hashed-password',
                role: 'USER',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            // Setup mocks
            prisma.user.findUnique.mockResolvedValue(mockUser);
            // Test request
            const res = await (0, supertest_1.default)(app).post('/api/auth/register').send({
                name: 'Existing User',
                email: 'existing@example.com',
                password: 'password123',
            });
            // Assertions
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('User already exists');
            expect(prisma.user.create).not.toHaveBeenCalled();
        });
    });
    describe('POST /api/auth/login', () => {
        it('should login a user with valid credentials', async () => {
            // Mock user
            const mockUser = {
                id: 'test-id',
                name: 'Test User',
                email: 'test@example.com',
                password: 'hashed-password',
                role: 'USER',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            // Setup mocks
            prisma.user.findUnique.mockResolvedValue(mockUser);
            bcryptjs_1.default.compare = jest.fn().mockResolvedValue(true);
            // Test request
            const res = await (0, supertest_1.default)(app).post('/api/auth/login').send({
                email: 'test@example.com',
                password: 'password123',
            });
            // Assertions
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBe('test-token');
            expect(res.body.user).toEqual({
                id: 'test-id',
                name: 'Test User',
                email: 'test@example.com',
                role: 'USER',
            });
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
            });
            expect(bcryptjs_1.default.compare).toHaveBeenCalledWith('password123', 'hashed-password');
        });
        it('should return 400 if user does not exist', async () => {
            // Setup mocks
            prisma.user.findUnique.mockResolvedValue(null);
            // Test request
            const res = await (0, supertest_1.default)(app).post('/api/auth/login').send({
                email: 'nonexistent@example.com',
                password: 'password123',
            });
            // Assertions
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid credentials');
            expect(bcryptjs_1.default.compare).not.toHaveBeenCalled();
        });
        it('should return 400 if password is incorrect', async () => {
            // Mock user
            const mockUser = {
                id: 'test-id',
                name: 'Test User',
                email: 'test@example.com',
                password: 'hashed-password',
                role: 'USER',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            // Setup mocks
            prisma.user.findUnique.mockResolvedValue(mockUser);
            bcryptjs_1.default.compare = jest.fn().mockResolvedValue(false);
            // Test request
            const res = await (0, supertest_1.default)(app).post('/api/auth/login').send({
                email: 'test@example.com',
                password: 'wrong-password',
            });
            // Assertions
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid credentials');
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
            });
            expect(bcryptjs_1.default.compare).toHaveBeenCalledWith('wrong-password', 'hashed-password');
        });
    });
});
//# sourceMappingURL=auth.test.js.map