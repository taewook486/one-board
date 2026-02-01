import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@/lib/db/schema';
import {
  createMember,
  findMemberByUsername,
  findMemberByEmail,
  findMemberById,
  updateMember,
  verifyMemberPassword,
  lockMemberAccount,
  unlockMemberAccount,
} from '@/lib/db/members';
import {
  createBoard,
  findAllBoards,
  findBoardById,
  findBoardByKey,
  updateBoard,
  deleteBoard,
  updatePostCount,
  checkBoardPermission,
} from '@/lib/db/boards';
import {
  createPost,
  findPostById,
  findPostsByBoard,
  updatePost,
  deletePost,
  incrementViewCount,
  incrementLikeCount,
  updateCommentCount,
  searchPosts,
} from '@/lib/db/posts';
import {
  createComment,
  findCommentsByPostId,
  findCommentById,
  updateComment,
  deleteComment,
  incrementCommentLikeCount,
} from '@/lib/db/comments';
import { hashPassword } from '@/lib/utils/security';

// Create in-memory test database
let db: ReturnType<typeof drizzle>;
let sqlite: Database.Database;

beforeAll(async () => {
  sqlite = new Database(':memory:');
  db = drizzle(sqlite, { schema });

  // Enable foreign keys
  sqlite.pragma('foreign_keys = ON');

  // Create tables
  sqlite.exec(`
    CREATE TABLE members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      nickname TEXT NOT NULL UNIQUE,
      name TEXT,
      phone TEXT,
      profile_image TEXT,
      role INTEGER NOT NULL DEFAULT 1,
      email_verified INTEGER NOT NULL DEFAULT 0,
      email_verification_token TEXT,
      status INTEGER NOT NULL DEFAULT 1,
      last_login_at TEXT,
      login_fail_count INTEGER NOT NULL DEFAULT 0,
      locked_until TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE boards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      board_key TEXT NOT NULL UNIQUE,
      category TEXT,
      icon TEXT,
      skin_id INTEGER,
      read_permission INTEGER NOT NULL DEFAULT 0,
      write_permission INTEGER NOT NULL DEFAULT 1,
      comment_permission INTEGER NOT NULL DEFAULT 1,
      allow_file_upload INTEGER NOT NULL DEFAULT 1,
      max_file_count INTEGER NOT NULL DEFAULT 5,
      max_file_size INTEGER NOT NULL DEFAULT 5242880,
      allowed_file_types TEXT,
      post_count INTEGER NOT NULL DEFAULT 0,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (skin_id) REFERENCES skins(id) ON DELETE SET NULL
    );

    CREATE TABLE board_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id INTEGER NOT NULL,
      member_id INTEGER,
      author_name TEXT,
      author_password TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT,
      tags TEXT,
      view_count INTEGER NOT NULL DEFAULT 0,
      like_count INTEGER NOT NULL DEFAULT 0,
      comment_count INTEGER NOT NULL DEFAULT 0,
      is_notice INTEGER NOT NULL DEFAULT 0,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      is_secret INTEGER NOT NULL DEFAULT 0,
      is_event INTEGER NOT NULL DEFAULT 0,
      status INTEGER NOT NULL DEFAULT 1,
      ip_address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT,
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
    );

    CREATE TABLE post_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      member_id INTEGER,
      author_name TEXT,
      author_password TEXT,
      parent_id INTEGER,
      content TEXT NOT NULL,
      like_count INTEGER NOT NULL DEFAULT 0,
      status INTEGER NOT NULL DEFAULT 1,
      ip_address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT,
      FOREIGN KEY (post_id) REFERENCES board_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL,
      FOREIGN KEY (parent_id) REFERENCES post_comments(id) ON DELETE CASCADE
    );

    CREATE TABLE skins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      skin_key TEXT NOT NULL UNIQUE,
      description TEXT,
      version TEXT,
      author TEXT,
      is_system INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      config TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    INSERT INTO skins (name, skin_key, description, version, author, is_system, is_active)
    VALUES ('Basic Skin', 'basic', '기본 스킨', '1.0.0', 'One Board', 1, 1);
  `);
});

afterAll(() => {
  sqlite.close();
});

describe('Member Database Functions', () => {
  let testMemberId = 0;

  it('should create a new member', async () => {
    const passwordHash = await hashPassword('TestPassword123!');
    const member = await createMember(db, {
      username: 'testuser',
      email: 'test@example.com',
      passwordHash,
      nickname: 'TestUser',
      name: 'Test User',
    });

    expect(member).toBeDefined();
    expect(member.username).toBe('testuser');
    expect(member.email).toBe('test@example.com');
    testMemberId = member.id;
  });

  it('should find member by username', async () => {
    const member = await findMemberByUsername(db, 'testuser');

    expect(member).toBeDefined();
    expect(member?.username).toBe('testuser');
  });

  it('should find member by email', async () => {
    const member = await findMemberByEmail(db, 'test@example.com');

    expect(member).toBeDefined();
    expect(member?.email).toBe('test@example.com');
  });

  it('should find member by ID', async () => {
    const member = await findMemberById(db, testMemberId);

    expect(member).toBeDefined();
    expect(member?.id).toBe(testMemberId);
  });

  it('should update member', async () => {
    const updated = await updateMember(db, testMemberId, {
      nickname: 'UpdatedNickname',
    });

    expect(updated).toBeDefined();
    expect(updated?.nickname).toBe('UpdatedNickname');
  });

  it('should verify member password', async () => {
    const member = await verifyMemberPassword(db, 'testuser', 'TestPassword123!');

    expect(member).toBeDefined();
    expect(member?.username).toBe('testuser');
  });

  it('should fail verification with wrong password', async () => {
    const member = await verifyMemberPassword(db, 'testuser', 'WrongPassword123!');

    expect(member).toBeNull();
  });

  it('should lock member account', async () => {
    const locked = await lockMemberAccount(db, testMemberId, 15);

    expect(locked).toBeDefined();
    expect(locked?.status).toBe(2);
  });

  it('should unlock member account', async () => {
    const unlocked = await unlockMemberAccount(db, testMemberId);

    expect(unlocked).toBeDefined();
    expect(unlocked?.status).toBe(1);
  });
});

describe('Board Database Functions', () => {
  let testBoardId = 0;

  it('should create a new board', async () => {
    const board = await createBoard(db, {
      name: 'Test Board',
      description: 'Test board description',
      boardKey: 'test-board',
      category: 'Test',
      readPermission: 0,
      writePermission: 1,
      commentPermission: 1,
    });

    expect(board).toBeDefined();
    expect(board.name).toBe('Test Board');
    expect(board.boardKey).toBe('test-board');
    testBoardId = board.id;
  });

  it('should find all active boards', async () => {
    const boards = await findAllBoards(db);

    expect(boards.length).toBeGreaterThan(0);
    expect(boards.some((b) => b.boardKey === 'test-board')).toBe(true);
  });

  it('should find board by ID', async () => {
    const board = await findBoardById(db, testBoardId);

    expect(board).toBeDefined();
    expect(board?.id).toBe(testBoardId);
  });

  it('should find board by key', async () => {
    const board = await findBoardByKey(db, 'test-board');

    expect(board).toBeDefined();
    expect(board?.boardKey).toBe('test-board');
  });

  it('should update board', async () => {
    const updated = await updateBoard(db, testBoardId, {
      name: 'Updated Board',
    });

    expect(updated).toBeDefined();
    expect(updated?.name).toBe('Updated Board');
  });

  it('should update post count', async () => {
    await updatePostCount(db, testBoardId, 1);

    const board = await findBoardById(db, testBoardId);
    expect(board?.postCount).toBe(1);
  });

  it('should check board permission', async () => {
    const canRead = await checkBoardPermission(db, testBoardId, 'read', 1);
    const canWrite = await checkBoardPermission(db, testBoardId, 'write', 1);

    expect(canRead).toBe(true);
    expect(canWrite).toBe(true);
  });

  it('should delete board', async () => {
    await deleteBoard(db, testBoardId);

    const board = await findBoardById(db, testBoardId);
    expect(board).toBeNull();
  });
});

describe('Post Database Functions', () => {
  let testMemberId = 0;
  let testBoardId = 0;
  let testPostId = 0;

  beforeAll(async () => {
    const passwordHash = await hashPassword('TestPassword123!');
    const member = await createMember(db, {
      username: 'postuser',
      email: 'post@example.com',
      passwordHash,
      nickname: 'PostUser',
    });
    testMemberId = member.id;

    const board = await createBoard(db, {
      name: 'Post Test Board',
      boardKey: 'post-test',
      category: 'Test',
    });
    testBoardId = board.id;
  });

  it('should create a new post', async () => {
    const post = await createPost(db, {
      boardId: testBoardId,
      memberId: testMemberId,
      title: 'Test Post',
      content: 'Test post content',
    });

    expect(post).toBeDefined();
    expect(post.title).toBe('Test Post');
    testPostId = post.id;
  });

  it('should find post by ID', async () => {
    const post = await findPostById(db, testPostId);

    expect(post).toBeDefined();
    expect(post?.id).toBe(testPostId);
  });

  it('should find posts by board', async () => {
    const posts = await findPostsByBoard(db, testBoardId, { page: 1, limit: 10 });

    expect(posts.length).toBeGreaterThan(0);
    expect(posts[0].id).toBe(testPostId);
  });

  it('should update post', async () => {
    const updated = await updatePost(db, testPostId, {
      title: 'Updated Post',
    });

    expect(updated).toBeDefined();
    expect(updated?.title).toBe('Updated Post');
  });

  it('should increment view count', async () => {
    await incrementViewCount(db, testPostId);

    const post = await findPostById(db, testPostId);
    expect(post?.viewCount).toBe(1);
  });

  it('should increment like count', async () => {
    await incrementLikeCount(db, testPostId);

    const post = await findPostById(db, testPostId);
    expect(post?.likeCount).toBe(1);
  });

  it('should update comment count', async () => {
    await updateCommentCount(db, testPostId, 1);

    const post = await findPostById(db, testPostId);
    expect(post?.commentCount).toBe(1);
  });

  it('should search posts', async () => {
    const results = await searchPosts(db, 'Test', { page: 1, limit: 10 });

    expect(results.length).toBeGreaterThan(0);
  });

  it('should delete post (soft delete)', async () => {
    await deletePost(db, testPostId);

    const post = await findPostById(db, testPostId);
    expect(post?.deletedAt).toBeDefined();
  });
});

describe('Comment Database Functions', () => {
  let testMemberId = 0;
  let testBoardId = 0;
  let testPostId = 0;
  let testCommentId = 0;

  beforeAll(async () => {
    const passwordHash = await hashPassword('TestPassword123!');
    const member = await createMember(db, {
      username: 'commentuser',
      email: 'comment@example.com',
      passwordHash,
      nickname: 'CommentUser',
    });
    testMemberId = member.id;

    const board = await createBoard(db, {
      name: 'Comment Test Board',
      boardKey: 'comment-test',
      category: 'Test',
    });
    testBoardId = board.id;

    const post = await createPost(db, {
      boardId: testBoardId,
      memberId: testMemberId,
      title: 'Comment Test Post',
      content: 'Test content',
    });
    testPostId = post.id;
  });

  it('should create a new comment', async () => {
    const comment = await createComment(db, {
      postId: testPostId,
      memberId: testMemberId,
      content: 'Test comment',
    });

    expect(comment).toBeDefined();
    expect(comment.content).toBe('Test comment');
    testCommentId = comment.id;
  });

  it('should find comments by post ID', async () => {
    const comments = await findCommentsByPostId(db, testPostId);

    expect(comments.length).toBe(1);
    expect(comments[0].id).toBe(testCommentId);
  });

  it('should find comment by ID', async () => {
    const comment = await findCommentById(db, testCommentId);

    expect(comment).toBeDefined();
    expect(comment?.id).toBe(testCommentId);
  });

  it('should update comment', async () => {
    const updated = await updateComment(db, testCommentId, {
      content: 'Updated comment',
    });

    expect(updated).toBeDefined();
    expect(updated?.content).toBe('Updated comment');
  });

  it('should increment comment like count', async () => {
    await incrementCommentLikeCount(db, testCommentId);

    const comment = await findCommentById(db, testCommentId);
    expect(comment?.likeCount).toBe(1);
  });

  it('should delete comment (soft delete)', async () => {
    await deleteComment(db, testCommentId);

    const comment = await findCommentById(db, testCommentId);
    expect(comment?.deletedAt).toBeDefined();
  });

  it('should create reply to comment', async () => {
    const reply = await createComment(db, {
      postId: testPostId,
      memberId: testMemberId,
      content: 'Reply to comment',
      parentId: testCommentId,
    });

    expect(reply).toBeDefined();
    expect(reply.parentId).toBe(testCommentId);
  });
});
