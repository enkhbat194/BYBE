import { pgTable, text, integer, jsonb, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Providers table
export const providers = pgTable('providers', {
  id: text('id').primaryKey(), // e.g. 'openai', 'groq', 'openrouter'
  name: text('name').notNull(),
  enabled: text('enabled').default('true'),
  meta: jsonb('meta').default('{}'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Models table
export const providerModels = pgTable('provider_models', {
  id: uuid('id').defaultRandom().primaryKey(),
  providerId: text('provider_id').notNull().references(() => providers.id, { onDelete: 'cascade' }),
  modelId: text('model_id').notNull(), // e.g. 'gpt-4o-mini', 'llama-3'
  displayName: text('display_name'),
  capabilities: jsonb('capabilities'),
  raw: jsonb('raw'),
  fetchedAt: timestamp('fetched_at').defaultNow(),
});

// Profiles table (for user configurations)
export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id'),
  name: text('name'),
  config: jsonb('config'),
  createdAt: timestamp('created_at').defaultNow(),
});