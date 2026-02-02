import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { members } from './index';

export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey(),
  memberId: integer('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'post', 'comment', 'like', 'mention', 'system'
  title: text('title').notNull(),
  message: text('message').notNull(),
  link: text('link').notNull(),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});

export type NewNotification = typeof notifications.$inferInsert;
export type InsertNotification = typeof notifications.$inferSelect;
