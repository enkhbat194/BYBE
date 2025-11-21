import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/bybe_ai',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Initialize Drizzle ORM
export const db = drizzle(pool, { schema });

// Test database connection
export async function testDbConnection() {
  try {
    const client = await pool.connect();
    client.release();
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Initialize database tables
export async function initDatabase() {
  try {
    // Insert default providers if they don't exist
    const defaultProviders = [
      {
        id: 'openai',
        name: 'OpenAI',
        enabled: 'true',
        meta: {
          baseUrl: 'https://api.openai.com',
          docs: 'https://platform.openai.com/docs'
        }
      },
      {
        id: 'groq',
        name: 'Groq',
        enabled: 'true',
        meta: {
          baseUrl: 'https://api.groq.com',
          docs: 'https://console.groq.com/docs'
        }
      },
      {
        id: 'openrouter',
        name: 'OpenRouter',
        enabled: 'true',
        meta: {
          baseUrl: 'https://openrouter.ai',
          docs: 'https://openrouter.ai/docs'
        }
      }
    ];

    for (const provider of defaultProviders) {
      try {
        await db.insert(schema.providers)
          .values(provider)
          .onConflictDoNothing({ target: schema.providers.id });
      } catch (error) {
        console.error(`Failed to insert provider ${provider.id}:`, error);
      }
    }

    console.log('Database initialization completed');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

export { pool };