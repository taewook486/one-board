import { eq } from 'drizzle-orm';
import { db } from './index';
import { skins, type Skin, type NewSkin } from './schema';
import { z } from 'zod';

// Validation schemas
export const createSkinSchema = z.object({
  name: z.string().min(1).max(100),
  skinKey: z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/),
  description: z.string().optional().nullable(),
  version: z.string().optional().nullable(),
  author: z.string().optional().nullable(),
  isSystem: z.boolean().default(false),
  isActive: z.boolean().default(true),
  config: z.string().optional().nullable(),
});

export const updateSkinSchema = createSkinSchema.partial().extend({
  id: z.number(),
});

/**
 * Create a new skin
 */
export async function createSkin(data: NewSkin): Promise<Skin> {
  const validatedData = createSkinSchema.parse(data);

  // Check if skin_key already exists
  const existingSkin = await findSkinByKey(validatedData.skinKey);
  if (existingSkin) {
    throw new Error('이미 존재하는 스킨 키입니다.');
  }

  const result = await db.insert(skins).values(validatedData).returning();

  if (!Array.isArray(result) || result.length === 0) {
    throw new Error('스킨 생성에 실패했습니다.');
  }

  return result[0] as Skin;
}

/**
 * Find skin by ID
 */
export async function findSkinById(id: number): Promise<Skin | undefined> {
  const result = await db.select().from(skins).where(eq(skins.id, id));

  if (!Array.isArray(result) || result.length === 0) {
    return undefined;
  }

  return result[0] as Skin;
}

/**
 * Find skin by skin_key
 */
export async function findSkinByKey(
  skinKey: string
): Promise<Skin | undefined> {
  const result = await db
    .select()
    .from(skins)
    .where(eq(skins.skinKey, skinKey));

  if (!Array.isArray(result) || result.length === 0) {
    return undefined;
  }

  return result[0] as Skin;
}

/**
 * Find all active skins
 */
export async function findAllSkins(options?: {
  includeInactive?: boolean;
}): Promise<Skin[]> {
  const { includeInactive = false } = options || {};

  if (!includeInactive) {
    const result = await db
      .select()
      .from(skins)
      .where(eq(skins.isActive, true));

    return result as Skin[];
  }

  const result = await db.select().from(skins);

  return result as Skin[];
}

/**
 * Update skin
 */
export async function updateSkin(
  id: number,
  data: Partial<NewSkin>
): Promise<Skin> {
  const validatedData = createSkinSchema.partial().parse(data);

  // Check if skin_key is being changed and already exists
  if (validatedData.skinKey) {
    const existingSkin = await findSkinByKey(validatedData.skinKey);
    if (existingSkin && existingSkin.id !== id) {
      throw new Error('이미 존재하는 스킨 키입니다.');
    }
  }

  const result = await db
    .update(skins)
    .set({
      ...validatedData,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(skins.id, id))
    .returning();

  if (!Array.isArray(result) || result.length === 0) {
    throw new Error('스킨을 찾을 수 없습니다.');
  }

  return result[0] as Skin;
}

/**
 * Delete skin (soft delete by setting isActive to false)
 */
export async function deleteSkin(id: number): Promise<void> {
  await db
    .update(skins)
    .set({
      isActive: false,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(skins.id, id));
}

/**
 * Count skins
 */
export async function countSkins(options?: {
  includeInactive?: boolean;
}): Promise<number> {
  const { includeInactive = false } = options || {};

  if (!includeInactive) {
    const result = await db
      .select({ count: skins.id })
      .from(skins)
      .where(eq(skins.isActive, true));

    return result.length;
  }

  const result = await db.select({ count: skins.id }).from(skins);

  return result.length;
}
