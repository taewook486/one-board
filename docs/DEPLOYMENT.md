# One Board 배포 가이드

## 최종 업데이트 (2026-02-02)

### 배포 환경
- **프로덕션 URL:** https://oneboard-beta.vercel.app
- **상태:** ✅ 배포됨 (Neon Postgres 데이터베이스 연동)

---

## Next.js 15 업그레이드 및 호환성 수정

### 변경 개요
Next.js 14 → 15.5.11 업그레이드에 따른 호환성 문제를 해결했습니다.

### 주요 변경 사항

#### 1. Dynamic Route params (Promise-based)
**문제:** Next.js 15부터 동적 라우트의 `params`가 Promise 기반이 됨

**해결:**
- **페이지 컴포넌트:**
  - `app/(main)/board/[boardKey]/page.tsx` - params/searchParams를 Promise로 변경
  - `app/(main)/board/[boardKey]/[postId]/page.tsx` - 서버 래퍼 생성 후 클라이언트 컴포넌트로 분리

- **API 라우트 (8개 파일):**
  - `app/api/posts/[id]/route.ts`
  - `app/api/notifications/[id]/read/route.ts`
  - `app/api/posts/[id]/like/route.ts`
  - `app/api/config/[key]/route.ts`
  - `app/api/skins/[id]/route.ts`
  - `app/api/members/[id]/route.ts`
  - `app/api/comments/[id]/route.ts`
  - `app/api/boards/[id]/route.ts`

  **변경 전:**
  ```typescript
  { params }: { params: { id: string } }
  ```

  **변경 후:**
  ```typescript
  { params }: { params: Promise<{ id: string }> }
  // 함수 내에서:
  const { id } = await params;
  ```

#### 2. Middleware async cookies()
**문제:** Next.js 15부터 `cookies()`가 Promise 반환

**해결:**
- `middleware.ts` - middleware 함수를 async로 변경
  ```typescript
  export async function middleware(request: NextRequest) {
    const cookieStore = await cookies();
    // ...
  }
  ```

#### 3. useSearchParams() Suspense 경고
**문제:** `useSearchParams()` 사용 시 Suspense 래핑 필요

**해결:**
- `app/(auth)/reset-password/page.tsx` - ResetPasswordForm 컴포넌트 추출
- `app/(main)/search/page.tsx` - SearchClient 컴포넌트 추출
- `app/(main)/write/page.tsx` - WriteClient 컴포넌트 추출

**패턴:**
```typescript
// 페이지.tsx
import { Suspense } from 'react';
import ClientComponent from '@/components/ClientComponent';

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ClientComponent />
    </Suspense>
  );
}
```

---

## 데이터베이스 마이그레이션 (SQLite → Neon Postgres)

### 배경
SQLite는 Vercel serverless 환경에서 작동하지 않아 Neon Postgres로 마이그레이션했습니다.

### 스키마 변경
- **기존:** `drizzle-orm/sqlite-core` (SQLite)
- **신규:** `drizzle-orm/neon-http` + `@neondatabase/serverless` (Neon Postgres)

### 파일 구조
```
lib/db/
├── index.ts           # 데이터베이스 연결 (SQLite/Postgres 자동 감지)
├── schema.ts          # 기본 스키마 (SQLite)
├── schema-sqlite.ts   # SQLite 스키마
└── schema-pg.ts        # Postgres 스키마
```

### 환경 변수 설정
```bash
# 로컬 개발 (SQLite)
DATABASE_URL=./data/oneboard.db

# Vercel 배포 (Postgres)
POSTGRES_URL=postgresql://user:pass@host/db
```

### 마이그레이션 스크립트
1. `scripts/schema-postgres.sql` - Postgres DDL 스크립트
2. `scripts/init-db-postgres.ts` - 초기 데이터 생성 스크립트
3. `scripts/setup-postgres.ts` - 전체 설정 실행 스크립트

### 초기 데이터 실행
```bash
POSTGRES_URL="your-neon-url" npm run db:init:pg
```

---

## Vercel 배포 설정

### 환경 변수 (Production)
```bash
NEXTAUTH_SECRET=<32자-랜덤-문자열>
NEXTAUTH_URL=https://oneboard-beta.vercel.app
POSTGRES_URL=postgresql://neondb_owner:***@ep-***.aws.neon.tech/neondb?sslmode=require
```

### 빌드 설정
- **프레임워크:** Next.js 15.5.11
- **Node.js:** 18.x
- **Output:** Standalone
- **Install Command:** `npm install` then `npm run build`

---

## 해결한 주요 이슈

### 1. 로그인 JSON 파싱 오류
**문제:** Vercel 배포 시 로그인 실패
```
Failed to execute 'json' on 'Response': Unexpected end of JSON input
```

**원인:**
- Vercel serverless 환경에서 SQLite 데이터베이스 미작동
- API 라우트가 빈 응답 반환

**해결:**
- Neon Postgres 데이터베이스로 마이그레이션
- Vercel 환경 변수에 `POSTGRES_URL` 설정
- `DATABASE_URL` 제거 (SQLite 충돌 방지)

### 2. Turbopack Worker 오류 (Next.js 16)
**문제:** Next.js 16 업그레이드 시 worker 오류
```
Error: Call retries were exceeded type: 'WorkerError'
```

**해결:** Next.js 15.5.11로 유지

### 3. 빌드 경고 (useSearchParams)
**문제:** 4개 페이지에서 Suspense 경고
```
useSearchParams() should be wrapped in a suspense boundary
```

**해결:** 각 페이지별로 클라이언트 컴포넌트 추출 후 Suspense 래핑

---

## 배포 후 점검清单

### 1. 환경 변수 확인
```bash
npx vercel env ls
```

### 2. 데이터베이스 연결 테스트
```bash
# 로컬
npm run db:push

# Vercel (환경 변수 설정 후)
POSTGRES_URL="..." npm run db:init:pg
```

### 3. 로그인 테스트
- URL: https://oneboard-beta.vercel.app/login
- 아이디: `admin`
- 비밀번호: `admin123`

### 4. 주요 기능 테스트
- [ ] 로그인/로그아웃
- [ ] 게시글 목록 조회
- [ ] 게시글 작성
- [ ] 검색 기능
- [ ] 관리자 대시보드 접근

---

## 알려진 제약사항

### Vercel 제약사항
- **Serverless Functions:** 각 요청이 새로운 컨테이너에서 실행됨
- **Cold Start:** 첫 요청 시 약 2초 지연 가능
- **Execution Timeout:** 최대 10초 (Serverless Functions)

### 데이터베이스
- **Neon Postgres:** Serverless Postgres, 자동 스케일링
- **연결 풀:** HTTP API 기반 (커넥션 풀 시마다 새 연결)
- **성능:** 로컬 개발 시 SQLite가 더 빠를 수 있음

### 개발 vs 배포
| 구분 | 로컬 개발 | Vercel 배포 |
|------|------------|-------------|
| 데이터베이스 | SQLite | Neon Postgres |
| 실행 환경 | Node.js 서버 | Serverless Functions |
| 파일 시스템 | 영구적 | 임시 (EFS) |

---

## 롤백地址

- **프로덕션:** https://oneboard-beta.vercel.app
- **저장소:** https://github.com/taewook486/one-board
- **Neon Console:** https://console.neon.tech/

---

## 문제 해결 가이드

### 로그인 실패
1. Vercel 환경 변수 확인 (`POSTGRES_URL` 존재)
2. Neon 데이터베이스 상태 확인
3. 브라우저 콘솔 오류 확인

### 빌드 실패
1. Next.js 버전 호환성 확인
2. TypeScript 타입 오류 확인
3. 환경 변수 누락 확인

### 데이터베이스 연결 실패
1. 연결 문자열 유효성 확인
2. Neon 데이터베이스 상태
3. Drizzle ORM 버전 호환성

---

## 다음 단계

### 단기 목표
- [ ] Vercel에서 `POSTGRES_URL` 재설정 (줄바꿈 제거)
- [ ] 배포 후 로그인 기능 테스트
- [ ] 일반 사용자 가입/게시글 작성 테스트

### 중기 목표
- [ ] CI/CD 파이프라인 구축
- [ ] 모니터링/로깅 시스템 도입
- [ ] SEO 최적화

### 장기 목표
- [ ] Docker 컨테이너화
- [ ] CDN 설정 (이미지/동적 처리)
- [ ] 접근성(Accessibility) 개선
- [ ] 성능 최적화

---

## 연� 정보

- **문제 해결:** Vercel 배포 시 로그인 오류
- **기술 스택:** Next.js 15, Neon Postgres, Vercel
- **마지링:** `POSTGRES_URL` 환경 변수 설정 중요

---

**문서 작성일:** 2026-02-02
**마지막 수정:** Claude Sonnet 4.5
**상태:** ✅ Vercel 배포됨, 로그인 오류 해결 중
