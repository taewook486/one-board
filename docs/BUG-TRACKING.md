# 버그 진척 관리

## 발견된 버그 및 수정 현황

### ✅ 수정 완료

#### 1. admin/members - 데이터 컬럼 미스매치
- **문제**: 데이터가 올바른 컬럼에 표시되지 않음
  - 가입일 데이터가 상태 컬럼에 표시
  - 상태 데이터가 역할 컬럼에 표시
  - 역할 데이터가 이메일 컬럼에 표시
- **원인**: 테이블 헤더(7열)와 데이터(6열)의 순서 불일치, username/nickname을 합쳐서 보여줌
- **수정**: `app/admin/members/page.tsx`에서 username과 nickname을 별도 컬럼으로 분리
- **수정일**: 2026-02-02
- **상태**: ✅ 완료

#### 2. admin/posts - "게시판 ID가 필요합니다" 에러 + 게시판 정보 누락
- **문제**: 게시글 관리 페이지 접근 시 에러
  - "게시글 목록을 가져오는 중 오류가 발생했습니다"
- **원인**:
  - `/api/posts`가 boardId 파라미터를 필수로 요청
  - `getAllPosts()`에서 게시판 정보(boardName, boardKey) 조인 누락
- **수정**:
  - `app/api/posts/route.ts`에 `all` 파라미터 처리 추가
  - `lib/db/posts.ts`의 `getAllPosts()`에서 boards 테이블 조인 추가
  - `app/admin/posts/page.tsx`에서 `all=true` 파라미터 전달
- **수정일**: 2026-02-02
- **상태**: ✅ 완료

#### 3. admin/reports - 404 에러
- **문제**: 페이지가 존재하지 않음
- **수정**: 플레이스홀더 페이지 생성 (`app/admin/reports/page.tsx`)
- **수정일**: 2026-02-02
- **상태**: ✅ 완료 (준비 중 페이지)

#### 4. admin/system - 404 에러
- **문제**: 페이지가 존재하지 않음
- **수정**: 플레이스홀더 페이지 생성 (`app/admin/system/page.tsx`)
- **수정일**: 2026-02-02
- **상태**: ✅ 완료 (준비 중 페이지)

#### 5. admin/support - 404 에러
- **문제**: 페이지가 존재하지 않음
- **수정**: 플레이스홀더 페이지 생성 (`app/admin/support/page.tsx`)
- **수정일**: 2026-02-02
- **상태**: ✅ 완료 (준비 중 페이지)

#### 6. admin/config - 설정 키, 설정명 컬럼 공란
- **문제**: 설정 키와 설정명이 표시되지 않음
- **원인**: API 응답 필드명 (`configKey`, `configValue`)과 프론트엔드 필드명 (`key`, `value`) 불일치
- **수정**: `app/api/config/route.ts`에서 필드명 변환 추가
- **수정일**: 2026-02-02
- **상태**: ✅ 완료

#### 7. notifications 테이블 누락
- **문제**: `no such table: notifications` 에러
- **원인**: DB 스키마에는 정의되어 있지만 실제 테이블이 생성되지 않음
- **수정**:
  - `scripts/create-notifications-table.ts` 생성
  - notifications 테이블 생성 완료
- **수정일**: 2026-02-02
- **상태**: ✅ 완료

#### 8. admin/members - 상태 매핑 오류
- **문제**: 모든 회원이 "정지"로 표시됨
- **원인**: MemberStatus enum (DELETED=0, ACTIVE=1, SUSPENDED=2)과 페이지 매핑 불일치
- **수정**: `app/admin/members/page.tsx`에서 상태 매핑 수정 (1=활성, 2=정지, 0=삭제)
- **수정일**: 2026-02-02
- **상태**: ✅ 완료

#### 9. board/[boardKey] - Pagination event handler 에러
- **문제**: Server Component에서 Client Component로 함수 전달 시도
- **원인**: `onPageChange` 함수를 props로 전달하려고 함
- **수정**:
  - `components/BoardPagination.tsx` 클라이언트 래퍼 생성
  - URL navigation을 클라이언트에서 처리
- **수정일**: 2026-02-02
- **상태**: ✅ 완료

---

## 🔒 코드 리뷰 이슈 (모두 수정 완료)

### ✅ CRITICAL: Admin Posts API 인증 우회
- **문제**: `/api/posts?all=true`가 관리자 권한 확인 없이 모든 게시글 반환
- **위험**: 비인증 사용자가 모든 게시글(삭제/비공개 포함) 접근 가능
- **수정**: `app/api/posts/route.ts`에 세션 확인 및 관리자 권한(role>=2) 검증 추가
- **수정일**: 2026-02-02
- **상태**: ✅ 완료

### ✅ HIGH: SQL 와일드카드 문자열 검색
- **문제**: LIKE 검색에서 `%`, `_` 와일드카드 미이스케이프
- **위험**: 악의적인 사용자가 `%` 검색 시 모든 레코드 반환
- **수정**: `lib/db/posts.ts`에서 검색어 이스케이프 처리 추가
- **수정일**: 2026-02-02
- **상태**: ✅ 완료

### ✅ MEDIUM: 타입 안전성 우회 (`as any`)
- **문제**: `posts as any`로 TypeScript 타입 검사 우회
- **수정**:
  - `PostWithBoard` 타입 정의
  - `boards` 테이블 import 추가
  - 적절한 타입 캐스팅 사용
- **수정일**: 2026-02-02
- **상태**: ✅ 완료

### ✅ MEDIUM: Pagination limit 제한 없음
- **문제**: `limit` 파라미터에 상한선 없어 DoS 가능성
- **수정**: `Math.min(limit, 100)`으로 최대 100개 제한
- **수정일**: 2026-02-02
- **상태**: ✅ 완료

### ✅ LOW: 페이지 네이션 시 스크롤 미유지
- **문제**: 페이지 이동 시 스크롤이 하단에 머물러 있음
- **수정**: `components/BoardPagination.tsx`에 `window.scrollTo({ top: 0, behavior: 'smooth' })` 추가
- **수정일**: 2026-02-02
- **상태**: ✅ 완료

#### 10. 게시글 작성 - is_event 컬럼 누락
- **문제**: 게시글 작성 시 "table board_posts has no column named is_event" 에러
- **원인**: 스키마에는 `is_event` 컬럼 정의되어 있으나 실제 DB 테이블에는 컬럼 없음
- **수정**:
  - `scripts/add-is-event-column.ts` 생성
  - ALTER TABLE로 컬럼 추가
- **수정일**: 2026-02-02
- **상태**: ✅ 완료

#### 11. 게시판 목록 - 번호 NaN 표시
- **문제**: 게시판 목록에서 게시글 번호가 전부 `NaN`으로 표시
- **원인**: `/api/posts` API에서 `total` 필드 미반환으로 `postsData.total`이 undefined
- **수정**:
  - `app/api/posts/route.ts`에서 `countPosts()` 호출로 total 계산 후 반환
  - `PostStatus` import 추가
- **수정일**: 2026-02-02
- **상태**: ✅ 완료

#### 12. 메인 페이지 Write Post 버튼 - 게시판 미지정
- **문제**: 메인 페이지에서 "Write Post" 클릭 시 게시판 지정 없이 `/write`로 이동
- **원인**:
  - `app/page.tsx`의 "Write Post" 링크가 `/write`로 board 파라미터 없음
  - `WriteClient`에서 boardKey가 없으면 `boardId: undefined`로 전송
- **수정**:
  - `app/page.tsx`의 모든 "Write Post" 링크를 `/write?board=free`로 변경
  - `components/WriteClient.tsx`에 게시판 선택 UI 추가 (board 파라미터 없을 때)
- **수정일**: 2026-02-02
- **상태**: ✅ 완료

#### 13. admin/posts - "제목" 컬럼 중복 및 데이터 불일치
- **문제**: 게시글 관리 목록에서 "제목" 컬럼이 두 번 나오고 데이터가 헤더와 일치하지 않음
- **원인**:
  - `<thead>`에 "제목" 헤더가 두 번 반복
  - "상태 변경" 드롭다운이 별도의 `<td>` 컬럼으로 존재하여 총 9개 컬럼이 됨
  - 헤더는 8개 컬럼로 정의되어 있어 데이터와 불일치
- **수정**:
  - `app/admin/posts/page.tsx`에서 중복된 "제목" 헤더 제거
  - "상태 변경" 드롭다운을 "작업" 컬럼 내부로 통합
  - 총 8개 컬럼으로 정렬 (체크박스, 제목, 작성자, 게시판, 상태, 작성일, 통계, 작업)
- **수정일**: 2026-02-02
- **상태**: ✅ 완료

#### 14. admin/posts - "작업" 컬럼 버튼 UI 개선
- **문제**: "보기", "상태 변경", "이동", "삭제" 링크가 텍스트로만 되어 있어서 클릭 가능한 버튼인지 명확하지 않음
- **수정**:
  - 각 버튼에 아이콘 추가 (eye, check, arrow, trash)
  - 버튼 스타일 적용 (배경색, 테두리, 패딩)
  - title 속성으로 툴팁 추가
- **수정일**: 2026-02-02
- **상태**: ✅ 완료

#### 16. admin/posts - "관리" 컬럼 개선
- **문제**: 컬럼명 "작업"이 명확하지 않고, 삭제 버튼이 잘 안 보임
- **수정**:
  - 컬럼명을 "관리"로 변경 및 중앙 정렬
  - 삭제 버튼 스타일 개선 (빨간 배경, 흰색 글자, 그림자 추가)
  - 관리 컬럼 셀 중앙 정렬
- **수정일**: 2026-02-02
- **상태**: ✅ 완료

#### 15. board/[boardKey] - 가짜 방문자 수
- **문제**: 게시판 화면의 "오늘 방문자"가 `Math.random()`으로 생성된 가짜 데이터
- **원인**: `todayVisitors={Math.floor(Math.random() * 100) + 1000}` 하드코딩
- **수정**:
  - `app/(main)/board/[boardKey]/page.tsx`에서 `/api/stats?type=basic` API 호출
  - 실제 `todayVisitors` 값 사용
- **수정일**: 2026-02-02
- **상태**: ✅ 완료

#### 17. admin/posts - "전체 선택" 체크박스 미작동
- **문제**: 게시글 관리 페이지의 "전체 선택" 체크박스가 비활성화(disabled) 상태로 기능하지 않음
- **수정**:
  - `selectAll`, `selectedPosts` 상태 변수 추가
  - `handleSelectAll()` 함수로 전체 선택/해제 토글 구현
  - `handleSelectIndividual()` 함수로 개별 선택 시 selectAll 상태 자동 업데이트
  - 헤더 체크박스에 `onChange={handleSelectAll}` 연결
  - 개별 체크박스에 `onChange={() => handleSelectIndividual(post.id)}` 연결
  - `cursor-pointer` 클래스 추가로 클릭 가능 표시
- **수정일**: 2026-02-02
- **상태**: ✅ 완료

---

## 🔄 알려진 문제 (향후 작업 필요)

#### 18. Profile 페이지 로딩 속도
- **문제**: `http://localhost:3000/profile` 페이지 로딩이 느림
- **원인**:
  - `next/image` 컴포넌트의 `fill` prop 사용으로 인한 오버헤드
  - 클라이언트 사이드에서 데이터 fetching으로 인한 초기 로딩 지연
- **수정**:
  - `next/image`를 일반 `img` 태그로 변경
  - 이미지 로딩 방식 간소화 (`w-full h-full object-cover` 적용)
- **수정일**: 2026-02-02
- **상태**: ✅ 완료

**참고**: 추가 개선이 필요한 경우:
- 서버 컴포넌트로 변환하여 서버 사이드 데이터 pre-fetching
- 로딩 상태 개선 (스켈레톤 UI 등)
- Next.js Image 컴포넌트의 `width`, `height` prop 사용하여 `fill` 대체

#### 19. 배포 환경에서 로그인 405 에러
- **문제**: Vercel 배포 시 로그인 API가 405 (Method Not Allowed) 에러 반환
- **원인**:
  - middleware에서 `/api/auth/` 경로가 적절히 처리되지 않음
  - Production 환경에서 schema import 문제로 인해 모듈 로딩 실패
- **수정**:
  - `middleware.ts`: `/api/auth/`로 시작하는 모든 경로를 공개 경로로 처리
  - `lib/db/index.ts`: 환경 변수에 따라 내부적으로 올바른 schema 사용 (Postgres in prod)
  - `lib/db/members.ts`: `db` import를 `./index`에서 하도록 수정
- **수정일**: 2026-02-02
- **상태**: ✅ 완료

---

## 📝 수정한 파일 목록

### 2026-02-02 (최종)
- `app/admin/posts/page.tsx` - 전체 선택 체크박스 기능 구현
- `app/profile/page.tsx` - 이미지 태그로 변경로 로딩 속도 개선
- `middleware.ts` - API 인증 경로 처리 개선
- `lib/db/index.ts` - 환경별 schema 자동 선택 로직 개선
- `lib/db/members.ts` - db import 경로 수정

---

## 🔄 알려진 문제 (향후 작업 필요)

**없음** - 모든 알려진 버그가 수정 완료되었습니다.



### 프론트엔드
- `app/admin/members/page.tsx` - 역할/상태 표시 수정, 상태 매핑 수정
- `app/admin/posts/page.tsx` - API 호출 파라미터 수정, 테이블 컬럼 구조 수정 (중복 "제목" 제거, "상태 변경" 통합, 작업 버튼 UI 개선, "관리" 컬럼명 변경 및 삭제 버튼 스타일 강화)
- `app/admin/reports/page.tsx` - 플레이스홀더 페이지 생성
- `app/admin/system/page.tsx` - 플레이스홀더 페이지 생성
- `app/admin/support/page.tsx` - 플레이스홀더 페이지 생성
- `app/(main)/board/[boardKey]/page.tsx` - BoardPagination 컴포넌트 사용, 실제 방문자 수 API 호출 추가
- `components/BoardPagination.tsx` - 클라이언트 페이지네이션 래퍼 생성
- `app/page.tsx` - "Write Post" 링크에 board 파라미터 추가
- `components/WriteClient.tsx` - 게시판 선택 UI 추가

### 백엔드/API
- `app/api/posts/route.ts` - `all` 파라미터 처리, 관리자 권한 검증, limit 제한 추가, `total` 필드 반환 추가
- `app/api/config/route.ts` - 필드명 변환 로직 추가

### 데이터베이스/라이브러리
- `lib/db/posts.ts` - `getAllPosts()` 함수 추가, SQL 와일드카드 이스케이프, 타입 안전성 개선
- `scripts/create-notifications-table.ts` - notifications 테이블 생성 스크립트
- `scripts/add-is-event-column.ts` - is_event 컬럼 추가 스크립트

### 문서
- `docs/BUG-TRACKING.md` - 버그 추적 문서 생성 및 업데이트
- `docs/DEPLOYMENT.md` - 배포 문서 생성

---

## 🗂️ 관련 문서

- [배포 문서](./DEPLOYMENT.md)
- [API 문서](./API.md)
