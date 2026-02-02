import Database from 'better-sqlite3';

const db = new Database('./data/oneboard.db');

// Check if column exists
try {
  const result = db.pragma("table_info(board_posts)");
  const hasColumn = result.some((col: any) => col.name === 'is_event');

  if (!hasColumn) {
    db.exec(`
      ALTER TABLE board_posts ADD COLUMN is_event INTEGER NOT NULL DEFAULT 0;
    `);
    console.log('✅ is_event 컬럼 추가 완료');
  } else {
    console.log('ℹ️ is_event 컬럼이 이미 존재합니다');
  }
} catch (error) {
  console.error('❌ 에러:', error);
}
