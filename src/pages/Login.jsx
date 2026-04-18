import { TrendingUp, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login, error } = useAuth();

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e3a5f 50%, #1d4ed8 100%)' }}
    >
      {/* 상단 브랜드 */}
      <div className="flex flex-col items-center mb-10 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
          style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)' }}
        >
          <TrendingUp size={32} strokeWidth={2.5} color="white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
          내 포트폴리오
        </h1>
        <p className="text-[15px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
          주식 · 코인 · 자산을 한 눈에
        </p>
      </div>

      {/* 로그인 카드 */}
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <div className="p-7">
          <p className="text-[14px] text-center mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
            구글 계정으로 로그인하면<br />
            포트폴리오가 안전하게 동기화돼요
          </p>

          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl font-semibold text-[15px] transition-all"
            style={{
              background: 'white',
              color: '#1e293b',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseOut={(e)  => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <GoogleIcon />
            Google로 로그인
          </button>

          {error && (
            <div className="mt-4 px-4 py-3 rounded-xl text-[13px] text-center"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              {error}
            </div>
          )}
        </div>

        {/* 하단 보안 뱃지 */}
        <div className="flex items-center justify-center gap-2 py-3.5 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }}
        >
          <ShieldCheck size={13} />
          <span className="text-[12px]">Firebase로 안전하게 저장</span>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.9 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C36.9 36.1 44 31 44 24c0-1.3-.1-2.7-.4-3.9z"/>
    </svg>
  );
}
