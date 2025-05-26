import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import {
  AuthService,
  RegisterData,
  LoginCredentials,
  OAuthProvider,
} from '../../../services/auth/AuthService';
import * as jwtUtils from '../../../utils/jwt';

// Mock Prisma
jest.mock('@prisma/client');
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
} as unknown as PrismaClient;

// Mock JWT utils
jest.mock('../../../utils/jwt', () => ({
  generateJWT: jest.fn().mockReturnValue('mock-token'),
}));

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerData: RegisterData = {
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
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      // Mock bcrypt
      jest.spyOn(bcrypt, 'genSalt').mockResolvedValueOnce('salt' as any);
      jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValueOnce('hashed-password' as any);

      // Mock user creation
      (mockPrisma.user.create as jest.Mock).mockResolvedValueOnce(mockUser);

      const result = await authService.register(registerData);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerData.email },
      });

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerData.password, 'salt');

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
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);

      await expect(authService.register(registerData)).rejects.toThrow(
        'User with this email already exists',
      );

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginCredentials: LoginCredentials = {
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
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);

      // Mock bcrypt compare
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true as any);

      const result = await authService.login(loginCredentials);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginCredentials.email },
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginCredentials.password,
        mockUser.password,
      );

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
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(authService.login(loginCredentials)).rejects.toThrow(
        'Invalid credentials',
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw an error if password is invalid', async () => {
      // Mock user exists
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);

      // Mock bcrypt compare (password doesn't match)
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false as any);

      await expect(authService.login(loginCredentials)).rejects.toThrow(
        'Invalid credentials',
      );

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

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);

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
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

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
      provider: OAuthProvider.GOOGLE,
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
        .spyOn(authService as any, 'getGoogleProfile')
        .mockResolvedValueOnce(mockProfile);

      // Mock user creation
      jest
        .spyOn(authService as any, 'findOrCreateOAuthUser')
        .mockResolvedValueOnce(mockUser);

      const result = await authService.authenticateWithOAuth(
        OAuthProvider.GOOGLE,
        mockCode,
      );

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
      jest.spyOn(authService as any, 'getGithubProfile').mockResolvedValueOnce({
        ...mockProfile,
        provider: OAuthProvider.GITHUB,
      });

      // Mock user creation
      jest
        .spyOn(authService as any, 'findOrCreateOAuthUser')
        .mockResolvedValueOnce(mockUser);

      const result = await authService.authenticateWithOAuth(
        OAuthProvider.GITHUB,
        mockCode,
      );

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
      await expect(
        authService.authenticateWithOAuth(
          'unsupported' as OAuthProvider,
          mockCode,
        ),
      ).rejects.toThrow('Unsupported OAuth provider: unsupported');
    });
  });
});
