# NeonHub Backend Development Guide

## Development Workflow

This document outlines the development workflow and best practices for working on the NeonHub backend.

### Getting Started

1. **Setup Development Environment**
   ```bash
   # Run the setup script to configure development tools
   node scripts/setup-dev-env.js
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Seed the Database**
   ```bash
   node scripts/seed-db.js
   ```

4. **Run Type Checking**
   ```bash
   npm run typecheck
   ```

### Workflow Enhancements

We've implemented several workflow enhancements to improve development efficiency:

- **TypeScript Integration**: Full TypeScript support with proper type definitions
- **Git Hooks**: Pre-commit hooks using Husky to enforce code quality
- **VS Code Integration**: Custom settings for improved developer experience
- **Development Scripts**: Enhanced NPM scripts for common tasks
- **Database Seeding**: Easy database seeding for development
- **Debugging Support**: Configured for both VS Code and Chrome DevTools

### Type Safety

The codebase is set up with strict TypeScript checking. Follow these guidelines:

1. **Express Request Types**: We've added custom type definitions for Express requests with authentication data
   ```typescript
   // Example: Accessing user in authenticated routes
   router.get('/', (req: Request, res: Response) => {
     const userId = req.user?.id;
     // ...
   });
   ```

2. **Prisma Integration**: Use the generated Prisma types for database operations
   ```typescript
   // Example: Creating a user with proper types
   const user = await prisma.user.create({
     data: {
       name: string,
       email: string,
       password: string,
     }
   });
   ```

3. **Schema Validation**: Use Zod for request validation to ensure type safety

### Database Operations

When working with Prisma, follow these patterns:

1. **Relations in Queries**: Use nested objects for relations
   ```typescript
   // Correct way to filter by related entities
   const campaigns = await prisma.campaign.findMany({
     where: {
       owner: {
         id: userId
       }
     }
   });
   ```

2. **Creating Related Records**: Use connect to link existing records
   ```typescript
   await prisma.generatedContent.create({
     data: {
       // ... other fields
       user: {
         connect: {
           id: userId
         }
       },
       campaign: campaignId ? {
         connect: {
           id: campaignId
         }
       } : undefined
     }
   });
   ```

### Pending Tasks

The following tasks are currently in progress or pending:

1. **Fix Type Errors in CampaignService**: The CampaignService has some type errors related to:
   - Budget field type mismatch (string vs number)
   - Goals field JSON serialization
   - Campaign type mapping

2. **Express Route Type Refinement**: Some Express routes still have type issues with:
   - Request authentication typing
   - Request body validation and typing

3. **Clean up Agent Scheduler Interface**: The AgentScheduler needs consistent method naming:
   - Use `runAgentNow` instead of different method names in different places

4. **Anthropic API Integration**: Need to install the Anthropic SDK:
   ```bash
   npm install @anthropic-ai/sdk
   ```

5. **Fix Service Directory Structure**: Consider:
   - Moving services under src/
   - OR updating tsconfig to include services in the rootDir

6. **Add More Complete Typing for Agent-Related Functionality**:
   - Improve agent configuration types
   - Add proper typing for agent execution results

7. **Create CI/CD Pipeline**:
   - Add GitHub Actions workflow for continuous integration
   - Implement automated testing and deployment

### Best Practices

1. **Error Handling**: Use consistent error handling patterns
   ```typescript
   try {
     // Operation that might fail
   } catch (error) {
     console.error('Operation failed:', error);
     return res.status(500).json({ 
       success: false, 
       message: error instanceof Error ? error.message : 'Unknown error' 
     });
   }
   ```

2. **Authentication**: Always validate authentication in protected routes

3. **Input Validation**: Use Zod schemas to validate all user input

4. **Response Structure**: Use consistent response structure
   ```typescript
   return res.json({
     success: true,
     data: result,
     message: 'Operation successful'
   });
   ```

5. **Logging**: Use the logger utility for all logging operations

6. **Database Transactions**: Use Prisma transactions for operations that involve multiple database changes

### Troubleshooting

Common issues and their solutions:

1. **TypeScript Errors**: Run `npm run typecheck` to identify type errors
2. **Prisma Schema Changes**: Run `npx prisma generate` after schema changes
3. **Authentication Issues**: Check JWT token configuration in .env
4. **Database Connection**: Verify DATABASE_URL in .env file 