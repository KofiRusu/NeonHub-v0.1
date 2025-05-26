/**
 * Database query utility script
 *
 * This script provides functionality similar to `prisma query` but using Prisma Client directly
 *
 * Usage:
 *   node db_query.js "SELECT id, name FROM \"AIAgent\"..."
 *   node db_query.js --file query.sql
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * Execute a raw SQL query and print the results
 */
async function executeQuery(query) {
  try {
    // Execute the query
    const results = await prisma.$queryRawUnsafe(query);

    // Output the results as JSON
    console.log(JSON.stringify(results, null, 2));

    return results;
  } catch (error) {
    console.error('Error executing query:', error.message);
    throw error;
  }
}

/**
 * Main function to execute the query from command line
 */
async function main() {
  try {
    let query;

    // Check if we're reading from a file
    if (process.argv[2] === '--file' && process.argv[3]) {
      query = fs.readFileSync(process.argv[3], 'utf8');
    } else if (process.argv[2]) {
      query = process.argv[2];
    } else {
      console.error('Error: No query provided.');
      console.error('Usage:');
      console.error('  node db_query.js "SELECT * FROM MyTable"');
      console.error('  node db_query.js --file query.sql');
      process.exit(1);
    }

    await executeQuery(query);
  } catch (error) {
    console.error('Query execution failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// If this script is run directly, execute the main function
if (require.main === module) {
  main().catch(console.error);
} else {
  // Export the executeQuery function for use in other scripts
  module.exports = { executeQuery };
}
