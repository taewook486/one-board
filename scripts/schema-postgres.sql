-- One Board Database Schema for Postgres
-- Run this directly in Neon SQL Editor

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  nickname TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  profile_image TEXT,
  role INTEGER NOT NULL DEFAULT 1,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_verification_token TEXT,
  status INTEGER NOT NULL DEFAULT 1,
  last_login_at TEXT,
  login_fail_count INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  created_at TEXT NOT NULL DEFAULT now(),
  updated_at TEXT NOT NULL DEFAULT now()
);

-- Skins table (must be before boards)
CREATE TABLE IF NOT EXISTS skins (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  skin_key TEXT NOT NULL UNIQUE,
  description TEXT,
  version TEXT,
  author TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  config TEXT,
  created_at TEXT NOT NULL DEFAULT now(),
  updated_at TEXT NOT NULL DEFAULT now()
);

-- Boards table
CREATE TABLE IF NOT EXISTS boards (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  board_key TEXT NOT NULL UNIQUE,
  category TEXT,
  icon TEXT,
  skin_id INTEGER REFERENCES skins(id) ON DELETE SET NULL,
  read_permission INTEGER NOT NULL DEFAULT 0,
  write_permission INTEGER NOT NULL DEFAULT 1,
  comment_permission INTEGER NOT NULL DEFAULT 1,
  allow_file_upload BOOLEAN NOT NULL DEFAULT TRUE,
  max_file_count INTEGER NOT NULL DEFAULT 5,
  max_file_size INTEGER NOT NULL DEFAULT 5242880,
  allowed_file_types TEXT,
  post_count INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TEXT NOT NULL DEFAULT now(),
  updated_at TEXT NOT NULL DEFAULT now()
);

-- Board posts table
CREATE TABLE IF NOT EXISTS board_posts (
  id SERIAL PRIMARY KEY,
  board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
  author_name TEXT,
  author_password TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  is_notice BOOLEAN NOT NULL DEFAULT FALSE,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_secret BOOLEAN NOT NULL DEFAULT FALSE,
  is_event BOOLEAN NOT NULL DEFAULT FALSE,
  status INTEGER NOT NULL DEFAULT 1,
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT now(),
  updated_at TEXT NOT NULL DEFAULT now(),
  deleted_at TEXT
);

-- Post comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES board_posts(id) ON DELETE CASCADE,
  member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
  author_name TEXT,
  author_password TEXT,
  parent_id INTEGER,
  content TEXT NOT NULL,
  like_count INTEGER NOT NULL DEFAULT 0,
  status INTEGER NOT NULL DEFAULT 1,
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT now(),
  updated_at TEXT NOT NULL DEFAULT now(),
  deleted_at TEXT
);

-- Post files table
CREATE TABLE IF NOT EXISTS post_files (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES board_posts(id) ON DELETE CASCADE,
  comment_id INTEGER REFERENCES post_comments(id) ON DELETE CASCADE,
  member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
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
  is_temp BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TEXT NOT NULL DEFAULT now(),
  deleted_at TEXT
);

-- Member sessions table
CREATE TABLE IF NOT EXISTS member_sessions (
  id TEXT PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  data TEXT,
  last_activity INTEGER NOT NULL
);

-- System config table
CREATE TABLE IF NOT EXISTS system_config (
  id SERIAL PRIMARY KEY,
  config_key TEXT NOT NULL UNIQUE,
  config_value TEXT,
  config_type TEXT NOT NULL DEFAULT 'string',
  description TEXT,
  updated_at TEXT NOT NULL DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TEXT NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_board_posts_board_id ON board_posts(board_id);
CREATE INDEX IF NOT EXISTS idx_board_posts_member_id ON board_posts(member_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_member_id ON post_comments(member_id);
CREATE INDEX IF NOT EXISTS idx_notifications_member_id ON notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
