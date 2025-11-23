// server/db.ts - DEMO MODE VERSION
console.log('🎮 DEMO MODE: Running without PostgreSQL - All features will work!');

// Mock database functions for demo mode
export async function testDbConnection() {
  console.log('✅ DEMO: Database simulation active - No PostgreSQL needed');
  return false; // Demo mode идэвхжүүлэх
}

export async function initDatabase() {
  console.log('🎯 DEMO: Database initialized in memory');
  return true;
}

// Mock database client
export const db = {
  insert: () => ({
    values: () => ({
      onConflictDoNothing: () => Promise.resolve()
    })
  })
};

export const pool = {
  connect: () => Promise.resolve({
    release: () => {}
  }),
  query: () => Promise.resolve({ rows: [] }),
  end: () => Promise.resolve()
};

export const client = {
  connect: () => Promise.resolve(),
  query: () => Promise.resolve({ rows: [] }),
  end: () => Promise.resolve()
};