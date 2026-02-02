# One Board Operations Runbook

배포, 모니터링, 문제 해결 가이드라인입니다.

## 배포 가이드

### Vercel 배포

#### 1. 처음 배포

```bash
# Vercel CLI 설치
npm install -g vercel

# 프로젝트 배포
vercel

# 프로덕션 배포
vercel --prod
```

#### 2. 환경 변수 설정

Vercel 대시보드 → Settings → Environment Variables:

**필수 변수:**
```bash
NEXTAUTH_SECRET=<랜덤-32자-문자열>
NEXTAUTH_URL=https://your-app.vercel.app
DATABASE_URL=/tmp/oneboard.db
NODE_ENV=production
```

**선택 변수:**
```bash
UPLOAD_MAX_SIZE=5242880
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,webp,pdf,doc,docx,xls,xlsx,txt,zip
SESSION_MAX_AGE=604800
```

#### 3. 데이터베이스 설정

Vercel의 경우, 데이터베이스는 `/tmp` 디렉토리를 사용합니다.

```javascript
// lib/db/index.ts 수정
const dbPath = process.env.DATABASE_URL ||
  (process.env.NODE_ENV === 'production'
    ? '/tmp/oneboard.db'
    : path.join(process.cwd(), 'data', 'oneboard.db'));
```

#### 4. 빌드 확인

```bash
# 로컬 빌드 테스트
npm run build

# Vercel 빌드 로그 확인
vercel logs
```

### GitHub 자동 배포

1. Vercel 대시보드 → Git Integration
2. GitHub repository 연결
3. Push할 때마다 자동 배포

## 모니터링

### Vercel Analytics

대시보드에서 확인:
- **Page Views**: 페이지 조회수
- **Visitors**: 방문자 수
- **Top Pages**: 인기 페이지
- **Geography**: 지역별 방문자

### Vercel Logs

```bash
# 실시간 로그
vercel logs

# 최근 100줄
vercel logs -n 100

# 특정 함수 로그
vercel logs --filter function-name
```

### 주요 모니터링 지표

1. **빌드 성공률**: 모든 빌드가 성공하는지 확인
2. **응답 시간**: API 엔드포인트 응답 시간
3. **오류율**: 4xx, 5xx 오류 비율
4. **데이터베이스 연결**: SQLite 파일 접근 가능 여부

## 문제 해결

### 자주 발생하는 문제

#### 1. 빌드 실패

**증상:**
```
Error: Build failed with exit code 1
```

**해결:**
```bash
# 로컬에서 빌드 테스트
npm run build

# 타입 오류 확인
npx tsc --noEmit

# 의존성 재설치
rm -rf node_modules
npm install
```

#### 2. 환경 변수 누락

**증상:**
```
Error: NEXTAUTH_SECRET is not defined
```

**해결:**
1. Vercel 대시보드 → Settings → Environment Variables
2. `NEXTAUTH_SECRET` 추가 (최소 32자)
3. Redeploy

```bash
# 랜덤 시크릿 생성
openssl rand -base64 32
```

#### 3. 데이터베이스 오류

**증상:**
```
Error: SQLITE_CANTOPEN: unable to open database file
```

**해결:**
```bash
# 데이터베이스 경로 확인
# Vercel: /tmp/oneboard.db
# Local: ./data/oneboard.db
```

#### 4. 500 Internal Server Error

**증상:**
API 요청이 500 오류 반환

**해결:**
```bash
# 로그 확인
vercel logs --filter api

# 공통 원인:
# 1. 데이터베이스 연결 실패
# 2. 환경 변수 누락
# 3. 타입 오류
# 4. 미들웨어 오류
```

#### 5. FOUC (Flash of Unstyled Content)

**증상:**
페이지가 깜빡이며 흰 화면으로 시작

**해결:**
```javascript
// app/layout.tsx에서 body{display:none} 제거
// 또는 적절한 로딩 상태 관리
```

### 응급 복구 절차

#### 1. 즉시 롤백

```bash
# Vercel 대시보드 → Deployments
# 이전 성공한 배포 클릭 → Promote to Production
# 또는 CLI 사용:
vercel rollback
```

#### 2. 유지보수 모드

```javascript
// app/page.tsx
export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1>현재 점검 중입니다</h1>
        <p>곧 돌아옵니다</p>
      </div>
    </div>
  );
}
```

#### 3. 데이터베이스 복구

```bash
# Vercel CLI 사용
vercel exec -- bash

# 데이터베이스 백업
cp /tmp/oneboard.db /tmp/oneboard.db.backup

# 복구
cp /tmp/oneboard.db.backup /tmp/oneboard.db
```

## 정기 작업

### 매일

- [ ] 배포 상태 확인
- [ ] 에러 로그 검토
- [ ] 사용자 활동 모니터링

### 매주

- [ ] 보안 패치 확인
- [ ] 의존성 업데이트 확인
- [ ] 성능 지표 분석

### 매월

- [ ] 데이터베이스 백업 (Vercel: 자동으로 /tmp 초기화됨)
- [ ] 사용자 통계 분석
- [ ] 개선 사항 우선순위 결정

## 보안

### 필수 보안 점검

1. **NEXTAUTH_SECRET**
   - [ ] 프로덕션에서 강력한 시크릿 사용
   - [ ] 로그에 노출되지 않음
   - [ ] 주기적으로 교체

2. **CORS 설정**
   ```javascript
   // next.config.js
   module.exports = {
     async headers() {
       return [
         {
           source: '/api/:path*',
           headers: [
             { key: 'Access-Control-Allow-Origin', value: 'https://your-domain.com' }
           ]
         }
       ];
     }
   };
   ```

3. **Rate Limiting**
   - API 엔드포인트에 rate limiting 구현
   - 로그인 시도 제한

4. **입력 검증**
   - Zod 스키마 사용
   - SQL Injection 방지 (Drizzle ORM 사용)
   - XSS 방지 (DOMPurify 사용)

## 성능 최적화

### 이미지 최적화

```javascript
import Image from 'next/image';

<Image
  src="/path/to/image.jpg"
  width={500}
  height={300}
  alt="Description"
  loading="lazy"
/>
```

### API 캐싱

```javascript
// route.ts
export const revalidate = 3600; // 1시간
```

### 정적 생성

```javascript
// page.tsx
export const dynamic = 'force-static';
```

## 연락처

- **GitHub Issues**: https://github.com/taewook486/one-board/issues
- **Vercel Dashboard**: https://vercel.com/comfit99-4265s-projects/oneboard

## 변경 이력

| 날짜 | 변경 사항 | 작성자 |
|------|----------|--------|
| 2025-02-02 | 초기 문서 생성 | Claude Code |
