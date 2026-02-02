# One Board 🎊

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black)](https://vercel.com/new)

> 현대적인 커뮤니티 게시판 플랫폼

## ✨ 특징

- 🔐 **완전한 인증 시스템** - 로그인, 회원가입, 비밀번호 찾기/재설정
- 📝 **WYSIWYG 에디터** - Tiptap 기반 리치 텍스트 에디터
- 🎨 **스킨 시스템** - 커스터마이저블 스킨 변경 기능
- 🌓 **다크 모드** - 라이트/다크 테마 전환
- 🔔 **알림 시스템** - 게시글, 댓글, 좋아요 알림
- 📁 **파일 업로드** - 이미지 및 파일 첨부 지원
- 🔍 **고급 검색** - 키워드, 게시판, 카테고리, 날짜 필터
- 👑 **관리자 기능** - 회원, 게시판, 스킨, 설정 관리
- 📱 **반응형 디자인** - 모바일 친화 UI
- 🧪 **테스트 커버리지** - 유닛 테스트 및 E2E 테스트 포함

## 🚀 빠른 시작

### 1. 설치

```bash
git clone https://github.com/taewook486/one-board.git
cd one-board
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일에서 필수 변수를 설정하세요:
```bash
NEXTAUTH_SECRET=<랜덤-32자-문자열>
NEXTAUTH_URL=http://localhost:3000
```

### 3. 데이터베이스 초기화

```bash
npm run db:init
```

이 명령은:
- SQLite 데이터베이스 생성
- 기본 관리자 계정 생성 (username: `admin`, password: `admin123`)
- 기본 게시판 생성 (공지사항, 자유게시판)
- 기본 스킨 생성

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

### 5. 테스트

```bash
# 유닛 테스트
npm test

# E2E 테스트
npx playwright test
```

## 📋 사용 가능한 스크립트

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
| `npx playwright test` | Playwright E2E 테스트 |
| `npx playwright test --ui` | Playwright UI 모드 |

### 데이터베이스

| 명령어 | 설명 |
|--------|------|
| `npm run db:generate` | Drizzle 마이그레이션 생성 |
| `npm run db:migrate` | 마이그레이션 실행 |
| `npm run db:push` | 스키마 푸시 |
| `npm run db:studio` | Drizzle Studio 실행 |
| `npm run db:init` | 데이터베이스 초기화 |

## 📁 프로젝트 구조

```
oneboard/
├── app/              # Next.js App Router
│   ├── (auth)/       # 인증 페이지
│   ├── (main)/       # 메인 페이지
│   ├── admin/        # 관리자 페이지
│   └── api/         # API 라우트
├── components/       # React 컴포넌트
├── lib/             # 라이브러리
│   ├── db/          # 데이터베이스
│   └── utils/       # 유틸리티
├── skins/           # 스킨
├── docs/            # 문서
├── tests/           # 유닛 테스트
└── e2e/             # E2E 테스트
```

## 🛠️ 기술 스택

- **프론트엔드**: Next.js 14, React 18, TypeScript
- **스타일링**: Tailwind CSS
- **데이터베이스**: SQLite (better-sqlite3)
- **ORM**: Drizzle ORM
- **에디터**: Tiptap
- **인증**: bcryptjs
- **검증**: Zod
- **보안**: DOMPurify
- **테스트**: Vitest, Playwright
- **차트**: Recharts

## 📚 문서

- [사용자 가이드](./docs/USER_GUIDE.md) - 사용 방법 상세 설명
- [기여 가이드](./docs/CONTRIB.md) - 개발 환경 설정 및 기여 방법
- [운영 가이드](./docs/RUNBOOK.md) - 배포 및 운영 가이드
- [API 문서](./docs/API.md) - API 엔드포인트 참조
- [프로젝트 상태](./docs/PROJECT_STATUS_TODO.md) - 개발 진행 상태

## 🔑 기본 관리자 계정

| 항목 | 값 |
|------|-----|
| 아이디 | `admin` |
| 비밀번호 | `admin123` |
| 이메일 | `admin@oneboard.com` |

⚠️ 첫 로그인 후 비밀번호를 변경하세요.

## 🌐 배포

### Vercel 배포

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/taewook486/one-board)

필수 환경 변수:
- `NEXTAUTH_SECRET` (랜덤 32자 문자열)
- `NEXTAUTH_URL` (배포된 URL)

상세 내용은 [운영 가이드](./docs/RUNBOOK.md)를 참조하세요.

## 🔧 환경 변수

필수 환경 변수 (`.env.example` 참조):

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `DATABASE_URL` | SQLite 데이터베이스 경로 | `./data/oneboard.db` |
| `NEXTAUTH_SECRET` | 인증 서명 키 (최소 32자) | - |
| `NEXTAUTH_URL` | 애플리케이션 URL | `http://localhost:3000` |
| `UPLOAD_MAX_SIZE` | 최대 업로드 크기 (bytes) | `5242880` |
| `ALLOWED_FILE_TYPES` | 허용된 파일 확장자 | `jpg,jpeg,png,gif,webp,pdf,doc,docx,xls,xlsx,txt,zip` |
| `SESSION_MAX_AGE` | 세션 만료 기간 (seconds) | `604800` |
| `NODE_ENV` | 환경 | `development` |

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 확인하세요.

## 🤝 기여

버그 리포트나 기능 요청은 [기여 가이드](./docs/CONTRIB.md)를 참조하여 PR을 제출해주세요.

## 📞 지원

질문이나 문의사항은 [GitHub Issues](https://github.com/taewook486/one-board/issues)를 통해 제출해주세요.

---

**Built with ❤️ using Next.js**
