/**
 * Script to set up and verify the database schema for NeonHub
 * 
 * This script will:
 * 1. Check if the database is accessible
 * 2. Run Prisma migrations if needed
 * 3. Apply the engineering_conversation agent migration
 * 4. Create a test user if none exists
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * Apply database migrations
 */
async function applyMigrations() {
  console.log('Applying database migrations...');
  
  try {
    // Run prisma migrate
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('Migrations applied successfully.');
    
    // Check for engineering conversation agent migration
    const manualMigrationPath = path.join(__dirname, '../prisma/migrations/manual/add_engineering_conversation_agent.sql');
    
    if (fs.existsSync(manualMigrationPath)) {
      console.log('Applying engineering conversation agent migration...');
      
      // Read the migration file
      const migrationSql = fs.readFileSync(manualMigrationPath, 'utf8');
      
      try {
        // Run the migration statements - we'll ignore errors if they already exist
        const statements = migrationSql
          .split(';')
          .filter(stmt => stmt.trim().length > 0)
          .map(stmt => stmt.trim() + ';');
        
        for (const statement of statements) {
          try {
            await prisma.$executeRawUnsafe(statement);
          } catch (error) {
            // Only log the error if it's not about the enum value already existing
            if (!error.message.includes('already exists')) {
              console.error(`Error executing statement: ${statement}`);
              console.error(error.message);
            }
          }
        }
        
        console.log('Engineering conversation agent migration applied.');
      } catch (error) {
        console.error('Error applying manual migration:', error);
      }
    }
  } catch (error) {
    console.error('Error applying migrations:', error);
    throw error;
  }
}

/**
 * Check if a user exists, create one if not
 */
async function ensureUserExists() {
  console.log('Checking for users...');
  
  try {
    const userCount = await prisma.user.count();
    
    if (userCount === 0) {
      console.log('No users found. Creating a test user...');
      
      // Generate a password hash (this is just for testing - in production, use proper password hashing)
      const password = crypto.createHash('sha256').update('password123').digest('hex');
      
      const user = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          name: 'Admin User',
          password: password,
          role: 'ADMIN'
        }
      });
      
      console.log(`Created test user: ${user.name} (${user.email})`);
      console.log('Password: password123');
    } else {
      console.log(`Found ${userCount} existing users.`);
    }
  } catch (error) {
    console.error('Error checking/creating user:', error);
    throw error;
  }
}

/**
 * Check if a project exists, create one if not
 */
async function ensureProjectExists() {
  console.log('Checking for projects...');
  
  try {
    const projectCount = await prisma.project.count();
    
    if (projectCount === 0) {
      console.log('No projects found. Creating a test project...');
      
      // Get the first user
      const user = await prisma.user.findFirst();
      
      if (!user) {
        throw new Error('Cannot create project: No users exist');
      }
      
      const project = await prisma.project.create({
        data: {
          name: 'Engineering Domains',
          description: 'Specialized engineering domain conversations',
          owner: {
            connect: { id: user.id }
          },
          members: {
            connect: [{ id: user.id }]
          }
        }
      });
      
      console.log(`Created test project: ${project.name} (${project.id})`);
    } else {
      console.log(`Found ${projectCount} existing projects.`);
    }
  } catch (error) {
    console.error('Error checking/creating project:', error);
    throw error;
  }
}

/**
 * Main function to set up the database
 */
async function setupDatabase() {
  console.log('Setting up database...');
  
  try {
    // Test database connection
    console.log('Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection successful.');
    
    // Apply migrations
    await applyMigrations();
    
    // Ensure a user exists
    await ensureUserExists();
    
    // Ensure a project exists
    await ensureProjectExists();
    
    console.log('Database setup complete!');
    console.log('You can now run: ./manage_domain_chats.sh setup');
  } catch (error) {
    console.error('Database setup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupDatabase().catch(console.error); 