import { useEffect, useMemo, useState } from 'react';

function isIosSafari() {
  const ua = window.navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(ua);
  const isSafari = /safari/.test(ua) && !/crios|fxios/.test(ua);
  return isIos && isSafari;
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('install-prompt-dismissed') === '1');

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const canInstall = !!deferredPrompt;
  const showIosGuide = isIosSafari() && !isStandalone();

  const visible = useMemo(() => !dismissed && !isStandalone() && (canInstall || showIosGuide), [dismissed, canInstall, showIosGuide]);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(() => {});
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    localStorage.setItem('install-prompt-dismissed', '1');
    setDismissed(true);
  };

  return { visible, canInstall, showIosGuide, install, dismiss };
}
