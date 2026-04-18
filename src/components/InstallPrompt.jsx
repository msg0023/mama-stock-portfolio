import { Download, Smartphone, X } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

export default function InstallPrompt() {
  const { visible, canInstall, showIosGuide, install, dismiss } = useInstallPrompt();

  if (!visible) return null;

  return (
    <div className="install-prompt">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div className="install-prompt__icon">
          {canInstall ? <Download size={18} strokeWidth={2.2} /> : <Smartphone size={18} strokeWidth={2.2} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="install-prompt__title">홈 화면에 추가</div>
          <div className="install-prompt__body">
            {canInstall
              ? '앱처럼 빠르게 열 수 있도록 이 포트폴리오를 홈 화면에 추가할 수 있어요.'
              : 'Safari 공유 버튼을 누른 뒤 "홈 화면에 추가"를 선택하면 앱처럼 사용할 수 있어요.'}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {canInstall ? (
              <button type="button" className="install-prompt__primary" onClick={install}>
                지금 설치
              </button>
            ) : (
              <div className="install-prompt__hint">Safari 공유 → 홈 화면에 추가</div>
            )}
            <button type="button" className="install-prompt__secondary" onClick={dismiss}>
              나중에
            </button>
          </div>
        </div>
        <button type="button" className="install-prompt__close" onClick={dismiss} aria-label="설치 안내 닫기">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
