import { db } from './index';
import { systemConfig, type SystemConfig } from './index';
import { eq, and } from 'drizzle-orm';

/**
 * Create or update a config value
 */
export async function setConfig(
  key: string,
  value: string,
  type: 'text' | 'number' | 'boolean' = 'text'
): Promise<void> {
  const existing = await db.select().from(systemConfig).where(eq(systemConfig.configKey, key)).get();

  if (existing) {
    await db
      .update(systemConfig)
      .set({ configValue: value, configType: type, updatedAt: new Date().toISOString() })
      .where(eq(systemConfig.configKey, key));
  } else {
    await db.insert(systemConfig).values({
      configKey: key,
      configValue: value,
      configType: type,
    });
  }
}

/**
 * Get a config value by key
 */
export async function getConfig(key: string): Promise<string | null> {
  const config = await db
    .select()
    .from(systemConfig)
    .where(eq(systemConfig.configKey, key))
    .get();

  return config?.configValue || null;
}

/**
 * Get all config values
 */
export async function getAllConfigs(): Promise<SystemConfig[]> {
  return db.select().from(systemConfig).orderBy(systemConfig.configKey);
}

/**
 * Delete a config value
 */
export async function deleteConfig(key: string): Promise<void> {
  await db.delete(systemConfig).where(eq(systemConfig.configKey, key));
}

/**
 * Bulk update configs
 */
export async function bulkUpdateConfigs(configs: Record<string, { value: string; type: string }>): Promise<void> {
  for (const [key, { value, type }] of Object.entries(configs)) {
    await setConfig(key, value, type as 'text' | 'number' | 'boolean');
  }
}

/**
 * Reset all configs to default values
 */
export async function resetConfigs(defaultConfigs: Record<string, { value: string; type: string }>): Promise<void> {
  // Delete all existing configs
  await db.delete(systemConfig);

  // Insert default configs
  for (const [key, { value, type }] of Object.entries(defaultConfigs)) {
    await db.insert(systemConfig).values({
      configKey: key,
      configValue: value,
      configType: type,
    });
  }
}

/**
 * Parse config value based on type
 */
export function parseConfigValue(value: string, type: string): string | number | boolean {
  switch (type) {
    case 'number':
      return parseFloat(value);
    case 'boolean':
      return value === 'true';
    default:
      return value;
  }
}

/**
 * Convert value to string based on type
 */
export function stringifyConfigValue(value: any, type: string): string {
  switch (type) {
    case 'number':
      return String(value);
    case 'boolean':
      return value ? 'true' : 'false';
    default:
      return String(value);
  }
}
