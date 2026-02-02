# Contributing to One Board

개발 환경 설정 및 기여 가이드라인입니다.

## 개발 환경 설정

### 필수 요구사항

- Node.js 18+
- npm 또는 yarn
- Git

### 설치步骤

1. **Repository 클론**
   ```bash
   git clone https://github.com/taewook486/one-board.git
   cd one-board
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경 변수 설정**
   ```bash
   cp .env.example .env.local
   ```

   `.env.local` 파일에서 필수 환경 변수를 설정하세요:
   - `NEXTAUTH_SECRET`: 최소 32자 랜덤 문자열
   - `NEXTAUTH_URL`: 로컬 개발용 `http://localhost:3000`

4. **데이터베이스 초기화**
   ```bash
   npm run db:init
   ```

### 개발 서버 시작

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 사용 가능한 스크립트

### 개발

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | Next.js 개발 서버 시작 |
| `npm run build` | 프로덕션 빌드 |
| `npm start` | 프로덕션 서버 시작 |
| `npm run lint` | ESLint 실행 |

### 테스트

| 명령어 | 설명 |
|--------|------|
| `npm test` | Vitest 테스트 실행 (watch 모드) |
| `npm run test:ui` | Vitest UI 모드 실행 |
| `npm run test:coverage` | 테스트 커버리지 생성 |
| `npm run test:run` | 테스트 한 번 실행 |

### E2E 테스트

| 명령어 | 설명 |
|--------|------|
| `npx playwright test` | Playwright E2E 테스트 실행 |
| `npx playwright test --ui` | Playwright UI 모드 |
| `npx playwright test --headed` | 헤디드 모드로 실행 |

### 데이터베이스

| 명령어 | 설명 |
|--------|------|
| `npm run db:generate` | Drizzle 마이그레이션 생성 |
| `npm run db:migrate` | 마이그레이션 실행 |
| `npm run db:push` | 스키마 푸시 |
| `npm run db:studio` | Drizzle Studio 실행 |
| `npm run db:init` | 데이터베이스 초기화 |

## 프로젝트 구조

```
one-board/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 관련 페이지
│   ├── (main)/            # 메인 페이지
│   ├── admin/             # 관리자 페이지
│   ├── api/               # API Routes
│   └── profile/           # 프로필 페이지
├── components/            # React 컴포넌트
│   ├── admin/            # 관리자 컴포넌트
│   ├── auth/             # 인증 컴포넌트
│   ├── board/            # 게시판 컴포넌트
│   ├── editor/           # 에디터 컴포넌트
│   └── layout/           # 레이아웃 컴포넌트
├── lib/                  # 유틸리티 라이브러리
│   ├── db/              # 데이터베이스 관련
│   ├── hooks/           # React Hooks
│   ├── skin/            # 스킨 시스템
│   └── utils/           # 유틸리티 함수
├── skins/               # 게시판 스킨
│   ├── basic/          # 기본 스킨
│   ├── modern/         # 모던 스킨
│   ├── classic/        # 클래식 스킨
│   └── dark/           # 다크 스킨
├── docs/               # 문서
├── tests/              # 유닛 테스트
└── e2e/                # E2E 테스트
```

## 개발 워크플로우

### 1. 새 기능 개발

1. 기능 브랜치 생성
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. 코드 작성 및 테스트
   ```bash
   npm run dev           # 개발 서버
   npm test              # 테스트 실행
   npm run lint          # 린트 확인
   ```

3. 커밋
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

### 2. 버그 수정

1. 버그 브랜치 생성
   ```bash
   git checkout -b fix/bug-description
   ```

2. 수정 후 테스트
   ```bash
   npm test
   npm run test:run
   ```

3. 커밋
   ```bash
   git commit -m "fix: describe the bug fix"
   ```

### 3. 커밋 컨벤션

- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 스타일 변경 (로직 변경 없음)
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가 또는 수정
- `chore`: 빌드 또는 별도 설정 변경

## 코드 스타일

### TypeScript

- 타입 안전성 유지
- `any` 타입 사용 지양
- 인터페이스와 타입 명확히 정의

### React/Next.js

- 함수형 컴포넌트 사용
- Hooks 사용 규칙 준수
- 서버/클라이언트 컴포넌트 적절히 분리

### 데이터베이스

- Drizzle ORM 사용
- 마이그레이션 파일로 스키마 변경
- 트랜잭션 사용하여 데이터 무결성 유지

## 테스트 가이드라인

### 유닛 테스트

```bash
# 특정 테스트 파일 실행
npm test -- security.test.ts

# 왓치 모드
npm test

# 커버리지 확인
npm run test:coverage
```

### E2E 테스트

```bash
# 모든 E2E 테스트
npx playwright test

# 특정 테스트 파일
npx playwright test basic-e2e.spec.ts

# UI 모드로 실행
npx playwright test --ui
```

## 풀 리퀘스트

1. Fork repository
2. 기능 브랜치 생성
3. 변경 사항 커밋
4. Fork로 푸시
5. Pull Request 생성

PR에 포함할 내용:
- 변경 사항 설명
- 관련 이슈 링크
- 스크린샷 (UI 변경인 경우)
- 테스트 결과

## 환경 변수

필수 환경 변수는 `.env.example`을 참조하세요:

- `DATABASE_URL`: SQLite 데이터베이스 경로
- `NEXTAUTH_SECRET`: 인증 서명 키 (최소 32자)
- `NEXTAUTH_URL`: 애플리케이션 URL
- `UPLOAD_MAX_SIZE`: 최대 업로드 크기 (bytes)
- `ALLOWED_FILE_TYPES`: 허용된 파일 확장자
- `SESSION_MAX_AGE`: 세션 만료 기간 (seconds)
- `NODE_ENV`: 환경 (development/production)

## 문제 해결

### 빌드 실패

```bash
# �시 삭제
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

### 데이터베이스 오류

```bash
# 데이터베이스 재초기화
rm data/oneboard.db
npm run db:init
```

### 테스트 실패

```bash
# Vitest �시 삭제
rm -rf node_modules/.vite

# 재설치
npm install
npm test
```

## 추가 리소스

- [Next.js 문서](https://nextjs.org/docs)
- [Drizzle ORM 문서](https://orm.drizzle.team/)
- [Tiptap 에디터](https://tiptap.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Playwright 문서](https://playwright.dev/)
