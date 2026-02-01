# One Board 🎊

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)

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

## 🚀 빠른 시작

### 1. 데이터베이스 초기화

```bash
cd oneboard
npm run init-db
```

이 명령은:
- SQLite 데이터베이스 생성
- 기본 관리자 계정 생성 (username: `admin`, password: `admin123`)
- 기본 게시판 생성 (공지사항, 자유게시판)
- 기본 스킨 생성

### 2. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

### 3. 관리자 로그인

- 아이디: `admin`
- 비밀번호: `admin123`

⚠️ 첫 로그인 후 비밀번호를 변경하세요.

## 📁 프로젝트 구조

```
oneboard/
├── app/              # Next.js App Router
│   ├── (auth)/     # 인증 페이지
│   ├── (main)/     # 메인 페이지
│   ├── (admin)/     # 관리자 페이지
│   └── api/        # API 라우트
├── components/      # React 컴포넌트
├── lib/            # 라이브러리
│   ├── db/         # 데이터베이스
│   └── utils/      # 유틸리티
├── skins/          # 스킨
└── docs/           # 문서
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

## 📚 문서

- [사용자 가이드](./docs/USER_GUIDE.md) - 사용 방법 상세 설명
- [프로젝트 완료 보고서](./docs/PROJECT_COMPLETION_REPORT.md) - 완료된 기능 목록
- [프로젝트 상태](./docs/PROJECT_STATUS_TODO.md) - 개발 진행 상태

## 🔑 기본 관리자 계정

| 항목 | 값 |
|------|-----|
| 아이디 | `admin` |
| 비밀번호 | `admin123` |
| 이메일 | `admin@oneboard.com` |

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 확인하세요.

## 🤝 기여

버그 리포트나 기능 요청은 이슈를 통해 제출해주세요.

## 📞 지원

질문이나 문의가 있으시면 이슈를 등록해주세요.

---

**Built with ❤️ using Next.js**
