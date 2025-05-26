"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../../app");
const services_1 = require("../../services");
const jwtUtils = __importStar(require("../../utils/jwt"));
// Mock services
jest.mock('../../services');
const mockGetAuthService = services_1.getAuthService;
const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    authenticateWithOAuth: jest.fn(),
    getUserById: jest.fn(),
};
// Mock JWT utils
jest.mock('../../utils/jwt', () => ({
    generateJWT: jest.fn().mockReturnValue('mock-token'),
    verifyJWT: jest.fn(),
    verifyToken: jest.fn(),
    extractTokenFromHeader: jest.fn(),
}));
describe('Auth Controller', () => {
    beforeEach(() => {
        mockGetAuthService.mockReturnValue(mockAuthService);
        jest.clearAllMocks();
    });
    afterAll(async () => {
        app_1.server.close();
    });
    describe('POST /api/auth/register', () => {
        const registerData = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
        };
        it('should register a user successfully', async () => {
            const mockResult = {
                user: {
                    id: 'user-id',
                    name: 'Test User',
                    email: 'test@example.com',
                    role: 'USER',
                    avatar: null,
                },
                token: 'mock-token',
            };
            mockAuthService.register.mockResolvedValueOnce(mockResult);
            const response = await (0, supertest_1.default)(app_1.app)
                .post('/api/auth/register')
                .send(registerData)
                .expect(201);
            expect(mockAuthService.register).toHaveBeenCalledWith(registerData);
            expect(response.body).toEqual({
                success: true,
                token: mockResult.token,
                user: mockResult.user,
            });
        });
        it('should return 400 if input validation fails', async () => {
            const response = await (0, supertest_1.default)(app_1.app)
                .post('/api/auth/register')
                .send({ email: 'test@example.com' }) // Missing name and password
                .expect(400);
            expect(response.body).toEqual({
                success: false,
                message: 'Please provide name, email and password',
            });
            expect(mockAuthService.register).not.toHaveBeenCalled();
        });
        it('should return 400 if user already exists', async () => {
            mockAuthService.register.mockRejectedValueOnce(new Error('User with this email already exists'));
            const response = await (0, supertest_1.default)(app_1.app)
                .post('/api/auth/register')
                .send(registerData)
                .expect(400);
            expect(response.body).toEqual({
                success: false,
                message: 'User with this email already exists',
            });
        });
    });
    describe('POST /api/auth/login', () => {
        const loginData = {
            email: 'test@example.com',
            password: 'password123',
        };
        it('should login a user successfully', async () => {
            const mockResult = {
                user: {
                    id: 'user-id',
                    name: 'Test User',
                    email: 'test@example.com',
                    role: 'USER',
                    avatar: null,
                },
                token: 'mock-token',
            };
            mockAuthService.login.mockResolvedValueOnce(mockResult);
            const response = await (0, supertest_1.default)(app_1.app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(200);
            expect(mockAuthService.login).toHaveBeenCalledWith(loginData);
            expect(response.body).toEqual({
                success: true,
                token: mockResult.token,
                user: mockResult.user,
            });
        });
        it('should return 400 if input validation fails', async () => {
            const response = await (0, supertest_1.default)(app_1.app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com' }) // Missing password
                .expect(400);
            expect(response.body).toEqual({
                success: false,
                message: 'Please provide email and password',
            });
            expect(mockAuthService.login).not.toHaveBeenCalled();
        });
        it('should return 400 if credentials are invalid', async () => {
            mockAuthService.login.mockRejectedValueOnce(new Error('Invalid credentials'));
            const response = await (0, supertest_1.default)(app_1.app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(400);
            expect(response.body).toEqual({
                success: false,
                message: 'Invalid credentials',
            });
        });
    });
    describe('POST /api/auth/oauth/:provider', () => {
        const oauthData = {
            code: 'auth-code',
        };
        it('should authenticate with Google OAuth successfully', async () => {
            const mockResult = {
                user: {
                    id: 'user-id',
                    name: 'OAuth User',
                    email: 'oauth@example.com',
                    role: 'USER',
                    avatar: 'https://example.com/avatar.jpg',
                },
                token: 'mock-token',
            };
            mockAuthService.authenticateWithOAuth.mockResolvedValueOnce(mockResult);
            const response = await (0, supertest_1.default)(app_1.app)
                .post('/api/auth/oauth/google')
                .send(oauthData)
                .expect(200);
            expect(mockAuthService.authenticateWithOAuth).toHaveBeenCalledWith(services_1.OAuthProvider.GOOGLE, oauthData.code);
            expect(response.body).toEqual({
                success: true,
                token: mockResult.token,
                user: mockResult.user,
            });
        });
        it('should return 400 if code is missing', async () => {
            const response = await (0, supertest_1.default)(app_1.app)
                .post('/api/auth/oauth/google')
                .send({}) // Missing code
                .expect(400);
            expect(response.body).toEqual({
                success: false,
                message: 'Authorization code is required',
            });
            expect(mockAuthService.authenticateWithOAuth).not.toHaveBeenCalled();
        });
        it('should return 400 for unsupported provider', async () => {
            const response = await (0, supertest_1.default)(app_1.app)
                .post('/api/auth/oauth/unsupported')
                .send(oauthData)
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Unsupported OAuth provider');
        });
    });
    describe('GET /api/auth/me', () => {
        it('should return current user data', async () => {
            const mockUser = {
                id: 'user-id',
                name: 'Test User',
                email: 'test@example.com',
                role: 'USER',
                avatar: null,
                createdAt: new Date().toISOString(),
            };
            // Mock request user (set by auth middleware)
            const mockReq = {
                user: {
                    id: 'user-id',
                    email: 'test@example.com',
                    role: 'USER',
                },
            };
            // Mock JWT verification
            jwtUtils.verifyJWT.mockReturnValueOnce(mockReq.user);
            jwtUtils.extractTokenFromHeader.mockReturnValueOnce('mock-token');
            mockAuthService.getUserById.mockResolvedValueOnce(mockUser);
            const response = await (0, supertest_1.default)(app_1.app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer mock-token')
                .expect(200);
            expect(mockAuthService.getUserById).toHaveBeenCalledWith(mockReq.user.id);
            expect(response.body).toEqual({
                success: true,
                data: mockUser,
            });
        });
        it('should return 401 if not authenticated', async () => {
            // Mock JWT verification fails
            jwtUtils.verifyJWT.mockReturnValueOnce(null);
            const response = await (0, supertest_1.default)(app_1.app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
            expect(response.body).toEqual({
                success: false,
                message: 'Invalid token',
            });
            expect(mockAuthService.getUserById).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=auth.controller.test.js.map