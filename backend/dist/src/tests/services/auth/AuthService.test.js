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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const axios_1 = __importDefault(require("axios"));
const AuthService_1 = require("../../../services/auth/AuthService");
const jwtUtils = __importStar(require("../../../utils/jwt"));
// Mock Prisma
jest.mock('@prisma/client');
const mockPrisma = {
    user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
};
// Mock JWT utils
jest.mock('../../../utils/jwt', () => ({
    generateJWT: jest.fn().mockReturnValue('mock-token'),
}));
// Mock axios
jest.mock('axios');
const mockedAxios = axios_1.default;
describe('AuthService', () => {
    let authService;
    beforeEach(() => {
        authService = new AuthService_1.AuthService(mockPrisma);
        jest.clearAllMocks();
    });
    describe('register', () => {
        const registerData = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
        };
        const mockUser = {
            id: 'user-id',
            name: 'Test User',
            email: 'test@example.com',
            role: 'USER',
            avatar: null,
            password: 'hashed-password',
        };
        it('should register a new user successfully', async () => {
            // Mock user does not exist
            mockPrisma.user.findUnique.mockResolvedValueOnce(null);
            // Mock bcrypt
            jest.spyOn(bcryptjs_1.default, 'genSalt').mockResolvedValueOnce('salt');
            jest
                .spyOn(bcryptjs_1.default, 'hash')
                .mockResolvedValueOnce('hashed-password');
            // Mock user creation
            mockPrisma.user.create.mockResolvedValueOnce(mockUser);
            const result = await authService.register(registerData);
            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: registerData.email },
            });
            expect(bcryptjs_1.default.genSalt).toHaveBeenCalledWith(10);
            expect(bcryptjs_1.default.hash).toHaveBeenCalledWith(registerData.password, 'salt');
            expect(mockPrisma.user.create).toHaveBeenCalledWith({
                data: {
                    name: registerData.name,
                    email: registerData.email,
                    password: 'hashed-password',
                },
            });
            expect(jwtUtils.generateJWT).toHaveBeenCalledWith(mockUser);
            expect(result).toEqual({
                user: {
                    id: mockUser.id,
                    name: mockUser.name,
                    email: mockUser.email,
                    role: mockUser.role,
                    avatar: mockUser.avatar,
                },
                token: 'mock-token',
            });
        });
        it('should throw an error if user already exists', async () => {
            // Mock user exists
            mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
            await expect(authService.register(registerData)).rejects.toThrow('User with this email already exists');
            expect(mockPrisma.user.create).not.toHaveBeenCalled();
        });
    });
    describe('login', () => {
        const loginCredentials = {
            email: 'test@example.com',
            password: 'password123',
        };
        const mockUser = {
            id: 'user-id',
            name: 'Test User',
            email: 'test@example.com',
            role: 'USER',
            avatar: null,
            password: 'hashed-password',
        };
        it('should login a user with valid credentials', async () => {
            // Mock user exists
            mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
            // Mock bcrypt compare
            jest.spyOn(bcryptjs_1.default, 'compare').mockResolvedValueOnce(true);
            const result = await authService.login(loginCredentials);
            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: loginCredentials.email },
            });
            expect(bcryptjs_1.default.compare).toHaveBeenCalledWith(loginCredentials.password, mockUser.password);
            expect(jwtUtils.generateJWT).toHaveBeenCalledWith(mockUser);
            expect(result).toEqual({
                user: {
                    id: mockUser.id,
                    name: mockUser.name,
                    email: mockUser.email,
                    role: mockUser.role,
                    avatar: mockUser.avatar,
                },
                token: 'mock-token',
            });
        });
        it('should throw an error if user not found', async () => {
            // Mock user does not exist
            mockPrisma.user.findUnique.mockResolvedValueOnce(null);
            await expect(authService.login(loginCredentials)).rejects.toThrow('Invalid credentials');
            expect(bcryptjs_1.default.compare).not.toHaveBeenCalled();
        });
        it('should throw an error if password is invalid', async () => {
            // Mock user exists
            mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
            // Mock bcrypt compare (password doesn't match)
            jest.spyOn(bcryptjs_1.default, 'compare').mockResolvedValueOnce(false);
            await expect(authService.login(loginCredentials)).rejects.toThrow('Invalid credentials');
            expect(jwtUtils.generateJWT).not.toHaveBeenCalled();
        });
    });
    describe('getUserById', () => {
        it('should return user data when user exists', async () => {
            const mockUser = {
                id: 'user-id',
                name: 'Test User',
                email: 'test@example.com',
                role: 'USER',
                avatar: null,
                createdAt: new Date(),
            };
            mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
            const result = await authService.getUserById('user-id');
            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: 'user-id' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    avatar: true,
                    createdAt: true,
                },
            });
            expect(result).toEqual(mockUser);
        });
        it('should return null when user does not exist', async () => {
            mockPrisma.user.findUnique.mockResolvedValueOnce(null);
            const result = await authService.getUserById('non-existent-id');
            expect(result).toBeNull();
        });
    });
    describe('authenticateWithOAuth', () => {
        const mockCode = 'auth-code';
        const mockProfile = {
            id: 'oauth-id',
            email: 'oauth@example.com',
            name: 'OAuth User',
            avatar: 'https://example.com/avatar.jpg',
            provider: AuthService_1.OAuthProvider.GOOGLE,
        };
        const mockUser = {
            id: 'user-id',
            name: 'OAuth User',
            email: 'oauth@example.com',
            role: 'USER',
            avatar: 'https://example.com/avatar.jpg',
            password: 'hashed-password',
        };
        it('should authenticate with Google OAuth', async () => {
            // Mock Google profile retrieval
            jest
                .spyOn(authService, 'getGoogleProfile')
                .mockResolvedValueOnce(mockProfile);
            // Mock user creation
            jest
                .spyOn(authService, 'findOrCreateOAuthUser')
                .mockResolvedValueOnce(mockUser);
            const result = await authService.authenticateWithOAuth(AuthService_1.OAuthProvider.GOOGLE, mockCode);
            expect(result).toEqual({
                user: {
                    id: mockUser.id,
                    name: mockUser.name,
                    email: mockUser.email,
                    role: mockUser.role,
                    avatar: mockUser.avatar,
                },
                token: 'mock-token',
            });
        });
        it('should authenticate with GitHub OAuth', async () => {
            // Mock GitHub profile retrieval
            jest.spyOn(authService, 'getGithubProfile').mockResolvedValueOnce({
                ...mockProfile,
                provider: AuthService_1.OAuthProvider.GITHUB,
            });
            // Mock user creation
            jest
                .spyOn(authService, 'findOrCreateOAuthUser')
                .mockResolvedValueOnce(mockUser);
            const result = await authService.authenticateWithOAuth(AuthService_1.OAuthProvider.GITHUB, mockCode);
            expect(result).toEqual({
                user: {
                    id: mockUser.id,
                    name: mockUser.name,
                    email: mockUser.email,
                    role: mockUser.role,
                    avatar: mockUser.avatar,
                },
                token: 'mock-token',
            });
        });
        it('should throw an error for unsupported OAuth provider', async () => {
            await expect(authService.authenticateWithOAuth('unsupported', mockCode)).rejects.toThrow('Unsupported OAuth provider: unsupported');
        });
    });
});
//# sourceMappingURL=AuthService.test.js.map