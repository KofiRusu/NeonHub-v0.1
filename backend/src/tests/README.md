# NeonHub Tests

This directory contains unit tests for the NeonHub AI Marketing Platform backend services.

## Test Structure

- `mocks/`: Contains mock implementations for tests
- `agents/`: Tests for agent functionality
- `services/`: Tests for services
- `routes/`: Tests for API routes

## Running Tests

To run all tests:

```
cd backend
npm test
```

To run tests with coverage:

```
cd backend
npm run test:coverage
```

To run a specific test file:

```
cd backend
npm test -- src/tests/services/CampaignService.test.ts
```

## Coverage

Current test coverage focuses on:

- AgentManager and BaseAgent functionality
- CampaignService and MetricService
- Agent campaign API routes
- Campaign and metric API routes

The CustomerSupportAgent is excluded from coverage as it is mostly a placeholder.

## Test Mocks

The tests use Jest mock extensions to mock the Prisma client and other dependencies. The primary mock setup is in `mocks/prismaMock.ts`.

## Manual Testing

Some aspects require manual testing:

1. End-to-end agent execution flow
2. Actual database operations
3. Real-time metric collection
4. Integration with front-end components

These should be tested in a development environment before release.
