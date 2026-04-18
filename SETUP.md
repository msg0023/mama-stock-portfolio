# 엄마 주식 포트폴리오 앱 - 설정 가이드

## 1단계: Firebase 설정

1. [Firebase 콘솔](https://console.firebase.google.com) 접속
2. 새 프로젝트 생성 (예: `mama-portfolio`)
3. **Authentication** → 로그인 방법 → Google 사용 설정
4. **Firestore Database** → 데이터베이스 만들기 → 프로덕션 모드
5. Firestore 규칙 설정:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
6. 프로젝트 설정 → 웹 앱 추가 → 설정값 복사

## 2단계: 환경 변수 설정

`.env.example`을 복사하여 `.env` 파일 생성:
```bash
cp .env.example .env
```

`.env` 파일에 Firebase 설정값 붙여넣기:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# 허용할 구글 이메일 (엄마 계정)
VITE_ALLOWED_EMAIL=mama@gmail.com
```

## 3단계: 로컬 개발 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 4단계: Vercel 배포

1. [Vercel](https://vercel.com) 가입 및 GitHub 연동
2. GitHub에 이 코드 올리기
3. Vercel에서 GitHub 레포 가져오기
4. **Environment Variables**에 `.env` 내용 모두 입력
5. Deploy!

## 주식 코드 입력 방법

| 시장 | 코드 예시 | 설명 |
|------|----------|------|
| 코스피 | 005930 | 삼성전자 |
| 코스피 | 000660 | SK하이닉스 |
| 코스닥 | 035720 | 카카오 |
| 미국 | AAPL | 애플 |
| 미국 | TSLA | 테슬라 |

## 현재가 조회 안될 때

- 주식 상세 화면에서 **현재가 직접 입력** 기능 사용
- 증권사 앱에서 현재가 확인 후 수동 입력 가능
