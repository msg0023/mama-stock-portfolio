import { useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePortfolioCtx as usePortfolio } from '../contexts/PortfolioContext';
import { exportJSON, importJSON } from '../utils/backup';
import { User, BarChart2, Download, Upload, LogOut, AlertTriangle, Check } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Settings() {
  const { user, logout }         = useAuth();
  const { stocks, importStocks } = usePortfolio();
  const fileRef                  = useRef(null);
  const [msg, setMsg]            = useState('');
  const [msgType, setMsgType]    = useState('info'); // 'success' | 'error'
  const [importing, setImporting] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const showMsg = (text, type = 'success') => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(''), 3000);
  };

  const handleExport = () => {
    if (!stocks.length) { showMsg('저장된 종목이 없습니다.', 'error'); return; }
    exportJSON(stocks);
    showMsg('백업 파일을 저장했습니다!');
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const data = await importJSON(file);
      if (window.confirm(`백업 파일에서 ${data.stocks.length}개 종목을 불러옵니다.\n기존 데이터에 추가됩니다. 계속할까요?`)) {
        await importStocks(data.stocks);
        showMsg(`${data.stocks.length}개 종목을 불러왔습니다!`);
      }
    } catch (err) {
      showMsg(err.message, 'error');
    }
    setImporting(false);
    e.target.value = '';
  };

  return (
    <div className="page-inner">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">설정</h1>
      </div>

      {/* 사용자 정보 */}
      <Section icon={<User size={16} />} title="계정 정보">
        <div className="flex items-center gap-4">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              className="w-14 h-14 rounded-full border border-border flex-shrink-0 object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center flex-shrink-0">
              <User size={24} className="text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="text-[17px] font-bold text-foreground">{user?.displayName || '사용자'}</p>
            <p className="text-[13px] text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </Section>

      {/* 저장 현황 */}
      <Section icon={<BarChart2 size={16} />} title="저장 현황">
        <div className="grid grid-cols-2 gap-3">
          <StatBox
            label="저장된 종목"
            value={`${stocks.length}개`}
          />
          <StatBox
            label="총 매수 건수"
            value={`${stocks.reduce((s, st) => s + (st.transactions?.length || 0), 0)}건`}
          />
        </div>
      </Section>

      {/* 백업 */}
      <Section icon={<Download size={16} />} title="데이터 백업 / 복원">
        <p className="text-[13px] text-muted-foreground mb-4 leading-relaxed">
          포트폴리오 데이터를 JSON으로 저장하거나 불러올 수 있어요.
          기기를 바꿔도 데이터를 이어서 쓸 수 있어요.
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleExport}
            className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border text-[14px] font-semibold transition-all cursor-pointer"
            style={{
              background: '#eff6ff',
              borderColor: '#bfdbfe',
              color: '#1d4ed8',
              fontFamily: 'inherit',
            }}
          >
            <Download size={18} />
            JSON으로 저장 (백업)
          </button>

          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border text-[14px] font-semibold transition-all cursor-pointer disabled:opacity-50"
            style={{
              background: '#f0fdf4',
              borderColor: '#bbf7d0',
              color: '#15803d',
              fontFamily: 'inherit',
            }}
          >
            <Upload size={18} />
            {importing ? '불러오는 중…' : 'JSON에서 불러오기 (복원)'}
          </button>

          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>

        {msg && (
          <div className={cn(
            'flex items-center gap-2 mt-3 px-4 py-3 rounded-xl text-[13px] font-medium',
            msgType === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-600 border border-red-200'
          )}>
            {msgType === 'success' ? <Check size={15} /> : <AlertTriangle size={15} />}
            {msg}
          </div>
        )}
      </Section>

      {/* 로그아웃 */}
      <Section icon={<LogOut size={16} />} title="계정 관리">
        {!confirmLogout ? (
          <button
            onClick={() => setConfirmLogout(true)}
            className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-[14px] font-semibold cursor-pointer transition-all hover:bg-red-100"
            style={{ fontFamily: 'inherit' }}
          >
            <LogOut size={16} />
            로그아웃
          </button>
        ) : (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-red-500" />
              <p className="text-[14px] font-semibold text-red-600">정말 로그아웃하시겠어요?</p>
            </div>
            <p className="text-[12px] text-red-400 mb-4">데이터는 Firebase에 저장되어 있어 유실되지 않아요.</p>
            <div className="flex gap-2">
              <button
                className="btn-secondary flex-1"
                style={{ padding: '12px' }}
                onClick={() => setConfirmLogout(false)}
              >
                취소
              </button>
              <button
                onClick={logout}
                className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white text-[14px] font-semibold border-none cursor-pointer transition-all hover:bg-red-600"
                style={{ fontFamily: 'inherit' }}
              >
                로그아웃
              </button>
            </div>
          </div>
        )}
      </Section>

      <p className="text-center text-[11px] text-muted-foreground mt-2 pb-4">
        내 주식 포트폴리오 v1.0
      </p>
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div className="card mb-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-muted-foreground">{icon}</span>
        <h2 className="text-[14px] font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="flex flex-col items-center py-4 px-3 rounded-xl bg-secondary border border-border text-center">
      <p className="text-[22px] font-bold text-primary leading-none mb-1.5">{value}</p>
      <p className="text-[12px] text-muted-foreground">{label}</p>
    </div>
  );
}
