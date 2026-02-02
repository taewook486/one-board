#!/usr/bin/env tsx
/**
 * Database Initialization Script for Postgres
 *
 * This script initializes the One Board database with:
 * 1. Initial data (admin user, skins, boards, system config)
 */

import { db } from '../lib/db';
import {
  members,
  boards,
  skins,
  systemConfig,
  UserRole,
  MemberStatus,
  Permission,
} from '../lib/db/schema';
import { hashPassword } from '../lib/utils/security';
import { eq } from 'drizzle-orm';

async function initDatabase() {
  console.log('🚀 Initializing One Board database...');

  try {
    // Check if admin user already exists
    console.log('🔍 Checking if admin user exists...');
    const existingAdmin = await db
      .select()
      .from(members)
      .where(eq(members.username, 'admin'))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log('✅ Admin user already exists. Skipping initialization.');
      return;
    }

    // Create admin user
    console.log('👤 Creating admin user...');
    const passwordHash = await hashPassword('admin123');

    await db.insert(members).values({
      username: 'admin',
      email: 'admin@oneboard.com',
      passwordHash,
      nickname: '관리자',
      role: UserRole.ADMIN,
      emailVerified: true,
      status: MemberStatus.ACTIVE,
    });

    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   ⚠️  Please change the password after first login!');

    // Create default skins
    console.log('🎨 Creating default skins...');

    await db.insert(skins).values([
      {
        name: 'Basic Blue',
        skinKey: 'basic-blue',
        description: 'Clean and simple blue theme',
        version: '1.0.0',
        author: 'One Board',
        isSystem: true,
        isActive: true,
        config: JSON.stringify({
          primaryColor: '#3b82f6',
          secondaryColor: '#1e40af',
          borderRadius: '0.375rem',
        }),
      },
      {
        name: 'Dark Mode',
        skinKey: 'dark-mode',
        description: 'Dark theme for better night viewing',
        version: '1.0.0',
        author: 'One Board',
        isSystem: true,
        isActive: true,
        config: JSON.stringify({
          primaryColor: '#60a5fa',
          secondaryColor: '#3b82f6',
          borderRadius: '0.375rem',
          backgroundColor: '#1f2937',
          textColor: '#f9fafb',
        }),
      },
      {
        name: 'Nature Green',
        skinKey: 'nature-green',
        description: 'Refreshing green nature theme',
        version: '1.0.0',
        author: 'One Board',
        isSystem: true,
        isActive: true,
        config: JSON.stringify({
          primaryColor: '#10b981',
          secondaryColor: '#059669',
          borderRadius: '0.375rem',
        }),
      },
    ]);

    // Create default boards
    console.log('📋 Creating default boards...');

    await db.insert(boards).values([
      {
        name: '공지사항',
        description: '중요 공지와 안내사항을 게시합니다',
        boardKey: 'notice',
        icon: '📢',
        readPermission: Permission.ALL,
        writePermission: Permission.ADMIN,
        commentPermission: Permission.MEMBER,
        displayOrder: 1,
        isActive: true,
      },
      {
        name: '자유게시판',
        description: '자유로운 주제로 대화하세요',
        boardKey: 'free',
        icon: '💬',
        readPermission: Permission.ALL,
        writePermission: Permission.MEMBER,
        commentPermission: Permission.MEMBER,
        displayOrder: 2,
        isActive: true,
      },
      {
        name: '질문게시판',
        description: '궁금한 점을 물어보세요',
        boardKey: 'qna',
        icon: '❓',
        readPermission: Permission.ALL,
        writePermission: Permission.MEMBER,
        commentPermission: Permission.MEMBER,
        displayOrder: 3,
        isActive: true,
      },
    ]);

    // Create system config
    console.log('⚙️  Creating system configuration...');

    await db.insert(systemConfig).values([
      {
        configKey: 'site_name',
        configValue: 'One Board',
        configType: 'string',
        description: '사이트 이름',
      },
      {
        configKey: 'site_description',
        configValue: '현대적인 커뮤니티 게시판',
        configType: 'string',
        description: '사이트 설명',
      },
      {
        configKey: 'allow_signup',
        configValue: 'true',
        configType: 'bool',
        description: '회원가입 허용 여부',
      },
      {
        configKey: 'max_file_size',
        configValue: '5242880',
        configType: 'int',
        description: '최대 파일 크기 (bytes)',
      },
    ]);

    console.log('');
    console.log('✅ Database initialization completed successfully!');
    console.log('');
    console.log('📌 Default credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('');
    console.log('🔗 Login at: /login');
    console.log('');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

export { initDatabase };

// Run initialization if called directly
if (require.main === module) {
  initDatabase();
}
