#!/usr/bin/env ts-node
/**
 * Database Initialization Script
 *
 * This script initializes the One Board database with:
 * 1. All required tables
 * 2. Initial data (admin user, skins, boards, system config)
 */

import { db } from '../lib/db';
import {
  members,
  boards,
  boardPosts,
  postComments,
  postFiles,
  skins,
  memberSessions,
  systemConfig,
  UserRole,
  MemberStatus,
  Permission,
} from '../lib/db/schema';
import { hashPassword } from '../lib/utils/security';
import { sql, eq } from 'drizzle-orm';

async function initDatabase() {
  console.log('🚀 Initializing One Board database...');

  try {
    // Create tables
    console.log('📝 Creating tables...');

    // Members table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS members (
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
      )
    `);
    console.log('  ✓ Members table created');

    // Boards table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS boards (
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
      )
    `);
    console.log('  ✓ Boards table created');

    // Board posts table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS board_posts (
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
        status INTEGER NOT NULL DEFAULT 1,
        ip_address TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        deleted_at TEXT,
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
      )
    `);
    console.log('  ✓ Board posts table created');

    // Post comments table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS post_comments (
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
      )
    `);
    console.log('  ✓ Post comments table created');

    // Post files table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS post_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER,
        comment_id INTEGER,
        member_id INTEGER,
        file_type TEXT NOT NULL,
        original_name TEXT NOT NULL,
        stored_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        width INTEGER,
        height INTEGER,
        thumbnail_path TEXT,
        download_count INTEGER NOT NULL DEFAULT 0,
        is_temp INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        deleted_at TEXT,
        FOREIGN KEY (post_id) REFERENCES board_posts(id) ON DELETE CASCADE,
        FOREIGN KEY (comment_id) REFERENCES post_comments(id) ON DELETE CASCADE,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
      )
    `);
    console.log('  ✓ Post files table created');

    // Skins table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS skins (
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
      )
    `);
    console.log('  ✓ Skins table created');

    // Member sessions table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS member_sessions (
        id TEXT PRIMARY KEY,
        member_id INTEGER,
        ip_address TEXT,
        user_agent TEXT,
        data TEXT,
        last_activity INTEGER NOT NULL,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
      )
    `);
    console.log('  ✓ Member sessions table created');

    // System config table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS system_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        config_key TEXT NOT NULL UNIQUE,
        config_value TEXT,
        config_type TEXT NOT NULL DEFAULT 'string',
        description TEXT,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    console.log('  ✓ System config table created');

    // Create indexes
    console.log('📊 Creating indexes...');

    // Members indexes
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_members_username ON members(username)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_members_email ON members(email)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_members_nickname ON members(nickname)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_members_status ON members(status)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_members_role ON members(role)`);

    // Boards indexes
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_boards_board_key ON boards(board_key)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_boards_category ON boards(category)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_boards_is_active ON boards(is_active)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_boards_display_order ON boards(display_order)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_boards_skin_id ON boards(skin_id)`);

    // Board posts indexes
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_posts_board_id ON board_posts(board_id)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_posts_member_id ON board_posts(member_id)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_posts_status ON board_posts(status)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_posts_created_at ON board_posts(created_at)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_posts_view_count ON board_posts(view_count)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_posts_is_notice ON board_posts(is_notice)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_posts_is_pinned ON board_posts(is_pinned)`);

    // Post comments indexes
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_comments_post_id ON post_comments(post_id)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_comments_member_id ON post_comments(member_id)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON post_comments(parent_id)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_comments_status ON post_comments(status)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_comments_created_at ON post_comments(created_at)`);

    // Post files indexes
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_files_post_id ON post_files(post_id)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_files_comment_id ON post_files(comment_id)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_files_member_id ON post_files(member_id)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_files_file_type ON post_files(file_type)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_files_is_temp ON post_files(is_temp)`);

    // Skins indexes
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_skins_skin_key ON skins(skin_key)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_skins_is_active ON skins(is_active)`);

    // Member sessions indexes
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_sessions_member_id ON member_sessions(member_id)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON member_sessions(last_activity)`);

    console.log('  ✓ Indexes created');

    // Create triggers for auto-updating updated_at
    console.log('🔧 Creating triggers...');

    await db.run(sql`
      CREATE TRIGGER IF NOT EXISTS update_members_timestamp
      AFTER UPDATE ON members
      BEGIN
        UPDATE members SET updated_at = datetime('now') WHERE id = NEW.id;
      END
    `);

    await db.run(sql`
      CREATE TRIGGER IF NOT EXISTS update_boards_timestamp
      AFTER UPDATE ON boards
      BEGIN
        UPDATE boards SET updated_at = datetime('now') WHERE id = NEW.id;
      END
    `);

    await db.run(sql`
      CREATE TRIGGER IF NOT EXISTS update_posts_timestamp
      AFTER UPDATE ON board_posts
      BEGIN
        UPDATE board_posts SET updated_at = datetime('now') WHERE id = NEW.id;
      END
    `);

    await db.run(sql`
      CREATE TRIGGER IF NOT EXISTS update_comments_timestamp
      AFTER UPDATE ON post_comments
      BEGIN
        UPDATE post_comments SET updated_at = datetime('now') WHERE id = NEW.id;
      END
    `);

    await db.run(sql`
      CREATE TRIGGER IF NOT EXISTS update_skins_timestamp
      AFTER UPDATE ON skins
      BEGIN
        UPDATE skins SET updated_at = datetime('now') WHERE id = NEW.id;
      END
    `);

    await db.run(sql`
      CREATE TRIGGER IF NOT EXISTS update_config_timestamp
      AFTER UPDATE ON system_config
      BEGIN
        UPDATE system_config SET updated_at = datetime('now') WHERE id = NEW.id;
      END
    `);

    console.log('  ✓ Triggers created');

    // Insert initial data
    console.log('📦 Inserting initial data...');

    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(members)
      .where(sql`${members.username} = 'admin'`);

    if (existingAdmin.length === 0) {
      // Create default admin user
      const adminPasswordHash = await hashPassword('admin123');

      await db.insert(members).values({
        username: 'admin',
        email: 'admin@oneboard.com',
        passwordHash: adminPasswordHash,
        nickname: '관리자',
        name: '시스템 관리자',
        role: UserRole.ADMIN,
        emailVerified: true,
        status: MemberStatus.ACTIVE,
      });
      console.log('  ✓ Default admin user created (username: admin, password: admin123)');
    } else {
      console.log('  ⚠ Admin user already exists');
    }

    // Check if skins already exist
    const existingSkins = await db.select().from(skins);

    if (existingSkins.length === 0) {
      // Create default skins
      await db.insert(skins).values([
        {
          name: 'Basic Skin',
          skinKey: 'basic',
          description: '기본 스킨',
          version: '1.0.0',
          author: 'One Board',
          isSystem: true,
          isActive: true,
        },
        {
          name: 'Modern Skin',
          skinKey: 'modern',
          description: '모던 스킨',
          version: '1.0.0',
          author: 'One Board',
          isSystem: true,
          isActive: true,
        },
      ]);
      console.log('  ✓ Default skins created');
    } else {
      console.log('  ⚠ Skins already exist');
    }

    // Check if boards already exist
    const existingBoards = await db.select().from(boards);

    if (existingBoards.length === 0) {
      // Get basic skin id
      const basicSkin = await db
        .select()
        .from(skins)
        .where(eq(skins.skinKey, 'basic'));

      const basicSkinId = basicSkin[0]?.id || 1;

      // Create default boards
      await db.insert(boards).values([
        {
          name: '공지사항',
          description: '공지사항 게시판',
          boardKey: 'notice',
          readPermission: Permission.ALL,
          writePermission: Permission.ADMIN,
          commentPermission: Permission.MEMBER,
          displayOrder: 1,
          skinId: basicSkinId,
        },
        {
          name: '자유게시판',
          description: '자유게시판',
          boardKey: 'free',
          readPermission: Permission.ALL,
          writePermission: Permission.MEMBER,
          commentPermission: Permission.MEMBER,
          displayOrder: 2,
          skinId: basicSkinId,
        },
      ]);
      console.log('  ✓ Default boards created');
    } else {
      console.log('  ⚠ Boards already exist');
    }

    // Check if system config already exists
    const existingConfig = await db.select().from(systemConfig);

    if (existingConfig.length === 0) {
      // Create default system config
      await db.insert(systemConfig).values([
        { configKey: 'site_name', configValue: 'One Board', configType: 'string', description: '사이트 이름' },
        { configKey: 'site_description', configValue: 'One Board 게시판 시스템', configType: 'string', description: '사이트 설명' },
        { configKey: 'default_skin', configValue: 'basic', configType: 'string', description: '기본 스킨' },
        { configKey: 'max_upload_size', configValue: '5242880', configType: 'int', description: '최대 업로드 크기 (바이트)' },
        { configKey: 'allowed_image_types', configValue: 'jpg,jpeg,png,gif,webp', configType: 'string', description: '허용 이미지 타입' },
      ]);
      console.log('  ✓ Default system config created');
    } else {
      console.log('  ⚠ System config already exists');
    }

    console.log('\n✅ Database initialization completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('\n⚠️  Please change the default admin password after first login!\n');
  } catch (error) {
    console.error('\n❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run the initialization
initDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
