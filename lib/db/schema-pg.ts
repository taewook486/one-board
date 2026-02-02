import { pgTable, text, integer, boolean, serial } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Role enum
export const UserRole = {
  GUEST: 0,
  MEMBER: 1,
  ADMIN: 2,
} as const;

// Member status enum
export const MemberStatus = {
  DELETED: 0,
  ACTIVE: 1,
  SUSPENDED: 2,
} as const;

// Permission enum
export const Permission = {
  ALL: 0,
  MEMBER: 1,
  ADMIN: 2,
} as const;

// Post status enum
export const PostStatus = {
  DELETED: 0,
  ACTIVE: 1,
  HIDDEN: 2,
} as const;

// Comment status enum
export const CommentStatus = {
  DELETED: 0,
  ACTIVE: 1,
  HIDDEN: 2,
} as const;

// Members table
export const members = pgTable('members', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').unique(),
  passwordHash: text('password_hash').notNull(),
  nickname: text('nickname').notNull().unique(),
  name: text('name'),
  phone: text('phone'),
  profileImage: text('profile_image'),
  role: integer('role').notNull().default(UserRole.MEMBER),
  emailVerified: boolean('email_verified').notNull().default(false),
  emailVerificationToken: text('email_verification_token'),
  status: integer('status').notNull().default(MemberStatus.ACTIVE),
  lastLoginAt: text('last_login_at'),
  loginFailCount: integer('login_fail_count').notNull().default(0),
  lockedUntil: text('locked_until'),
  createdAt: text('created_at').notNull().default(sql`now()`),
  updatedAt: text('updated_at').notNull().default(sql`now()`),
});

// Boards table
export const boards = pgTable('boards', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  boardKey: text('board_key').notNull().unique(),
  category: text('category'),
  icon: text('icon'),
  skinId: integer('skin_id').references(() => skins.id, { onDelete: 'set null' }),
  readPermission: integer('read_permission').notNull().default(Permission.ALL),
  writePermission: integer('write_permission').notNull().default(Permission.MEMBER),
  commentPermission: integer('comment_permission').notNull().default(Permission.MEMBER),
  allowFileUpload: boolean('allow_file_upload').notNull().default(true),
  maxFileCount: integer('max_file_count').notNull().default(5),
  maxFileSize: integer('max_file_size').notNull().default(5242880), // 5MB
  allowedFileTypes: text('allowed_file_types'),
  postCount: integer('post_count').notNull().default(0),
  displayOrder: integer('display_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`now()`),
  updatedAt: text('updated_at').notNull().default(sql`now()`),
});

// Board posts table
export const boardPosts = pgTable('board_posts', {
  id: serial('id').primaryKey(),
  boardId: integer('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
  memberId: integer('member_id').references(() => members.id, { onDelete: 'set null' }),
  authorName: text('author_name'),
  authorPassword: text('author_password'),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category'),
  tags: text('tags'),
  viewCount: integer('view_count').notNull().default(0),
  likeCount: integer('like_count').notNull().default(0),
  commentCount: integer('comment_count').notNull().default(0),
  isNotice: boolean('is_notice').notNull().default(false),
  isPinned: boolean('is_pinned').notNull().default(false),
  isSecret: boolean('is_secret').notNull().default(false),
  isEvent: boolean('is_event').notNull().default(false),
  status: integer('status').notNull().default(PostStatus.ACTIVE),
  ipAddress: text('ip_address'),
  createdAt: text('created_at').notNull().default(sql`now()`),
  updatedAt: text('updated_at').notNull().default(sql`now()`),
  deletedAt: text('deleted_at'),
});

// Post comments table
export const postComments = pgTable('post_comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull().references(() => boardPosts.id, { onDelete: 'cascade' }),
  memberId: integer('member_id').references(() => members.id, { onDelete: 'set null' }),
  authorName: text('author_name'),
  authorPassword: text('author_password'),
  parentId: integer('parent_id'),
  content: text('content').notNull(),
  likeCount: integer('like_count').notNull().default(0),
  status: integer('status').notNull().default(CommentStatus.ACTIVE),
  ipAddress: text('ip_address'),
  createdAt: text('created_at').notNull().default(sql`now()`),
  updatedAt: text('updated_at').notNull().default(sql`now()`),
  deletedAt: text('deleted_at'),
});

// Post files table
export const postFiles = pgTable('post_files', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').references(() => boardPosts.id, { onDelete: 'cascade' }),
  commentId: integer('comment_id').references(() => postComments.id, { onDelete: 'cascade' }),
  memberId: integer('member_id').references(() => members.id, { onDelete: 'set null' }),
  fileType: text('file_type').notNull(), // 'image' or 'file'
  originalName: text('original_name').notNull(),
  storedName: text('stored_name').notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: text('mime_type').notNull(),
  width: integer('width'),
  height: integer('height'),
  thumbnailPath: text('thumbnail_path'),
  downloadCount: integer('download_count').notNull().default(0),
  isTemp: boolean('is_temp').notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`now()`),
  deletedAt: text('deleted_at'),
});

// Skins table
export const skins = pgTable('skins', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  skinKey: text('skin_key').notNull().unique(),
  description: text('description'),
  version: text('version'),
  author: text('author'),
  isSystem: boolean('is_system').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  config: text('config'), // JSON string
  createdAt: text('created_at').notNull().default(sql`now()`),
  updatedAt: text('updated_at').notNull().default(sql`now()`),
});

// Member sessions table
export const memberSessions = pgTable('member_sessions', {
  id: text('id').primaryKey(),
  memberId: integer('member_id').references(() => members.id, { onDelete: 'cascade' }),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  data: text('data'),
  lastActivity: integer('last_activity').notNull(),
});

// System config table
export const systemConfig = pgTable('system_config', {
  id: serial('id').primaryKey(),
  configKey: text('config_key').notNull().unique(),
  configValue: text('config_value'),
  configType: text('config_type').notNull().default('string'), // string, int, bool, json
  description: text('description'),
  updatedAt: text('updated_at').notNull().default(sql`now()`),
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  memberId: integer('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'post', 'comment', 'like', 'mention', 'system'
  title: text('title').notNull(),
  message: text('message').notNull(),
  link: text('link'),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`now()`),
});

// Type exports
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;

export type Board = typeof boards.$inferSelect;
export type NewBoard = typeof boards.$inferInsert;

export type BoardPost = typeof boardPosts.$inferSelect;
export type NewBoardPost = typeof boardPosts.$inferInsert;

export type PostComment = typeof postComments.$inferSelect;
export type NewPostComment = typeof postComments.$inferInsert;

export type PostFile = typeof postFiles.$inferSelect;
export type NewPostFile = typeof postFiles.$inferInsert;

export type Skin = typeof skins.$inferSelect;
export type NewSkin = typeof skins.$inferInsert;

export type MemberSession = typeof memberSessions.$inferSelect;
export type NewMemberSession = typeof memberSessions.$inferInsert;

export type SystemConfig = typeof systemConfig.$inferSelect;
export type NewSystemConfig = typeof systemConfig.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
