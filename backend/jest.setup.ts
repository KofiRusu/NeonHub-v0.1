import { PrismaClient } from '@prisma/client';
import { prisma } from './src/tests/mocks/prismaMock';

// Mock the Prisma module
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => prisma),
  };
});

// Silence console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}; 