import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// persistentLocalCache/persistentSingleTabManager 제거:
// - 앱 시작 시 IndexedDB 초기화로 10~15초 지연 발생
// - singleTabManager가 lock을 점유해 다른 기기에서 데이터 미조회
// usePortfolio.js의 localStorage 캐시가 오프라인/빠른 로딩을 담당함
export const db   = getFirestore(app);
export const auth = getAuth(app);
