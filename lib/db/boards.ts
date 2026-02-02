import { eq, and, desc, asc } from 'drizzle-orm';
import { db } from './index';
import { boards, type Board, type NewBoard, Permission } from './index';
import { z } from 'zod';

// Validation schemas
export const createBoardSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  boardKey: z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/),
  category: z.string().max(50).optional().nullable(),
  icon: z.string().optional().nullable(),
  skinId: z.number().optional().nullable(),
  readPermission: z.number().int().min(0).max(2).default(0),
  writePermission: z.number().int().min(0).max(2).default(1),
  commentPermission: z.number().int().min(0).max(2).default(1),
  allowFileUpload: z.boolean().default(true),
  maxFileCount: z.number().int().min(0).default(5),
  maxFileSize: z.number().int().min(0).default(5242880),
  allowedFileTypes: z.string().optional().nullable(),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateBoardSchema = createBoardSchema.partial().extend({
  id: z.number(),
});

/**
 * Create a new board
 */
export async function createBoard(data: NewBoard): Promise<Board> {
  // Validate input
  const validatedData = createBoardSchema.parse(data);

  // Check if board_key already exists
  const existingBoard = await findBoardByKey(validatedData.boardKey);
  if (existingBoard) {
    throw new Error('이미 존재하는 게시판 키입니다.');
  }

  // Insert board
  const [newBoard] = await db
    .insert(boards)
    .values(validatedData)
    .returning();

  return newBoard;
}

/**
 * Find all active boards
 */
export async function findAllBoards(options?: {
  category?: string;
  orderBy?: 'displayOrder' | 'name' | 'createdAt';
  order?: 'asc' | 'desc';
}): Promise<Board[]> {
  const { category, orderBy = 'displayOrder', order = 'asc' } = options || {};

  // Build where conditions
  const conditions = [eq(boards.isActive, true)];
  if (category) {
    conditions.push(eq(boards.category, category));
  }

  let query = db
    .select()
    .from(boards)
    .where(and(...conditions));

  if (orderBy === 'displayOrder') {
    return query.orderBy(asc(boards.displayOrder));
  } else if (orderBy === 'name') {
    return query.orderBy(order === 'asc' ? asc(boards.name) : desc(boards.name));
  } else {
    return query.orderBy(order === 'asc' ? asc(boards.createdAt) : desc(boards.createdAt));
  }
}

/**
 * Find board by ID
 */
export async function findBoardById(id: number): Promise<Board | undefined> {
  const [board] = await db.select().from(boards).where(eq(boards.id, id));
  return board;
}

/**
 * Find board by board_key
 */
export async function findBoardByKey(
  boardKey: string
): Promise<Board | undefined> {
  const [board] = await db
    .select()
    .from(boards)
    .where(eq(boards.boardKey, boardKey));
  return board;
}

/**
 * Update board
 */
export async function updateBoard(
  id: number,
  data: Partial<NewBoard>
): Promise<Board> {
  // Validate data
  const validatedData = createBoardSchema.partial().parse(data);

  // Check if board_key is being changed and already exists
  if (validatedData.boardKey) {
    const existingBoard = await findBoardByKey(validatedData.boardKey);
    if (existingBoard && existingBoard.id !== id) {
      throw new Error('이미 존재하는 게시판 키입니다.');
    }
  }

  // Update board
  const [updatedBoard] = await db
    .update(boards)
    .set({
      ...validatedData,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(boards.id, id))
    .returning();

  if (!updatedBoard) {
    throw new Error('게시판을 찾을 수 없습니다.');
  }

  return updatedBoard;
}

/**
 * Delete board (soft delete by setting isActive to false)
 */
export async function deleteBoard(id: number): Promise<void> {
  await db
    .update(boards)
    .set({
      isActive: false,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(boards.id, id));
}

/**
 * Update post count for a board
 */
export async function updatePostCount(
  boardId: number,
  increment: number = 1
): Promise<void> {
  const board = await findBoardById(boardId);
  if (!board) {
    throw new Error('게시판을 찾을 수 없습니다.');
  }

  const newCount = Math.max(0, board.postCount + increment);

  await db
    .update(boards)
    .set({
      postCount: newCount,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(boards.id, boardId));
}

/**
 * Check if user has permission for board
 */
export async function checkPermission(
  boardId: number,
  userRole: number,
  action: 'read' | 'write' | 'comment'
): Promise<boolean> {
  const board = await findBoardById(boardId);
  if (!board) {
    return false;
  }

  let permissionLevel: number;
  switch (action) {
    case 'read':
      permissionLevel = board.readPermission;
      break;
    case 'write':
      permissionLevel = board.writePermission;
      break;
    case 'comment':
      permissionLevel = board.commentPermission;
      break;
    default:
      return false;
  }

  // If permission is ALL (0), allow everyone
  if (permissionLevel === Permission.ALL) {
    return true;
  }

  // If permission is MEMBER (1), user must have at least MEMBER role
  if (permissionLevel === Permission.MEMBER) {
    return userRole >= Permission.MEMBER;
  }

  // If permission is ADMIN (2), user must have ADMIN role
  if (permissionLevel === Permission.ADMIN) {
    return userRole === Permission.ADMIN;
  }

  return false;
}

/**
 * Get all boards (including inactive) - admin only
 */
export async function getAllBoards(options?: {
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Board[]> {
  const { includeInactive = false, limit = 100, offset = 0 } = options || {};

  const conditions = includeInactive ? [] : [eq(boards.isActive, true)];

  return db
    .select()
    .from(boards)
    .where(and(...conditions))
    .limit(limit)
    .offset(offset)
    .orderBy(asc(boards.displayOrder));
}

/**
 * Count boards
 */
export async function countBoards(options?: {
  includeInactive?: boolean;
  category?: string;
}): Promise<number> {
  const { includeInactive = false, category } = options || {};

  if (category) {
    const result = await db
      .select({ count: boards.id })
      .from(boards)
      .where(
        and(
          eq(boards.category, category),
          includeInactive ? undefined : eq(boards.isActive, true)
        )
      );
    return result.length;
  }

  const result = await db
    .select({ count: boards.id })
    .from(boards)
    .where(includeInactive ? undefined : eq(boards.isActive, true));
  return result.length;
}

/**
 * Get board categories
 */
export async function getBoardCategories(): Promise<string[]> {
  const result = await db
    .selectDistinct({ category: boards.category })
    .from(boards)
    .where(eq(boards.isActive, true));

  return result
    .map((r: { category: string | null }) => r.category)
    .filter((c: string | null | undefined): c is string => c !== null && c !== undefined);
}

/**
 * Update board display order
 */
export async function updateBoardOrder(
  boardOrders: { id: number; displayOrder: number }[]
): Promise<void> {
  for (const { id, displayOrder } of boardOrders) {
    await db
      .update(boards)
      .set({
        displayOrder,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(boards.id, id));
  }
}

/**
 * Search boards by name or description
 */
export async function searchBoards(
  query: string,
  limit: number = 20
): Promise<Board[]> {
  const lowerQuery = query.toLowerCase();

  const allBoards = await findAllBoards();

  return allBoards
    .filter(
      (board) =>
        board.name.toLowerCase().includes(lowerQuery) ||
        (board.description?.toLowerCase().includes(lowerQuery) ?? false)
    )
    .slice(0, limit);
}
