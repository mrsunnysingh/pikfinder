import React, { useEffect, useState } from 'react';
import Logo from './Logo';

// Shows a small, dismissible "Install app" card when the browser offers the
// PWA install prompt. Hidden if already installed / running standalone.
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return;
    if (window.navigator.standalone) return; // iOS installed
    const onBIP = (e) => { e.preventDefault(); setDeferred(e); setShow(true); };
    const onInstalled = () => { setShow(false); setDeferred(null); };
    window.addEventListener('beforeinstallprompt', onBIP);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!show) return null;

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch { /* ignore */ }
    setShow(false);
    setDeferred(null);
  };

  return (
    <div className="pwa-install" role="dialog" aria-label="Install PikFinder">
      <span className="pwa-install-logo"><Logo size={30} showText={false} /></span>
      <div className="pwa-install-txt">
        <b>Install PikFinder</b>
        <span>Add the app to your device — one tap away.</span>
      </div>
      <button className="pwa-install-btn" onClick={install}>Install</button>
      <button className="pwa-install-x" onClick={() => setShow(false)} aria-label="Dismiss">×</button>
    </div>
  );
}
