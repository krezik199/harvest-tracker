import { useState } from 'react';
import './index.css';
import { useLang } from './i18n/LangContext.jsx';
import { useConfig } from './i18n/ConfigContext.jsx';
import CommodityScreen from './pages/CommodityScreen.jsx';
import RoleScreen from './pages/RoleScreen.jsx';
import HarvestForm from './pages/HarvestForm.jsx';
import StorageForm from './pages/StorageForm.jsx';
import LoadOutForm from './pages/LoadOutForm.jsx';
import SuccessScreen from './pages/SuccessScreen.jsx';
import SettingsScreen from './pages/SettingsScreen.jsx';

export default function App() {
  const { lang, setLang, t } = useLang();
  const { config, reload: reloadConfig } = useConfig();

  const [screen, setScreen] = useState('commodity');
  const [selectedCommodity, setSelectedCommodity] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const cropYear = config?.cropYear || '';

  const handleBack = () => {
    if (screen === 'role') setScreen('commodity');
    else if (screen === 'form') setScreen('role');
    else if (screen === 'success') setScreen('commodity');
  };

  const now = new Date().toLocaleString(lang === 'es' ? 'es-MX' : 'en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const showBack = screen !== 'commodity' && !showSettings;

  return (
    <div>
      <header className="app-header">
        <div className="header-left">
          {showBack && (
            <button className="back-btn" onClick={handleBack}>← {t.back}</button>
          )}
        </div>

        <div className="app-logo">
          <div className="app-logo-title">{t.appTitle}</div>
          {cropYear && (
            <span className="app-logo-sub" style={{ color: 'rgba(255,220,80,0.75)' }}>
              {cropYear}
            </span>
          )}
        </div>

        <div className="header-right">
          <button
            className="settings-gear-btn"
            onClick={() => setShowSettings(true)}
            aria-label="Settings"
            title="Settings"
          >⚙️</button>
          <div className="lang-toggle">
            <button className={`lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => setLang('en')} aria-label="English">
              <span className="flag">🇺🇸</span>
              <span className="lang-label">EN</span>
            </button>
            <button className={`lang-btn${lang === 'es' ? ' active' : ''}`} onClick={() => setLang('es')} aria-label="Español">
              <span className="flag">🇲🇽</span>
              <span className="lang-label">ES</span>
            </button>
          </div>
        </div>
      </header>

      {showSettings && (
        <SettingsScreen onClose={() => { setShowSettings(false); reloadConfig(); }} />
      )}

      {!showSettings && (
        <>
          {screen === 'form' && (
            <div className="timestamp-strip">
              📅 {now}&nbsp;&nbsp;·&nbsp;&nbsp;{lang === 'es' ? 'Año' : 'Year'}: {cropYear}
            </div>
          )}
          <main className="app-main">
            {screen === 'commodity' && (
              <CommodityScreen
                cropYear={cropYear}
                onSelect={(c) => { setSelectedCommodity(c); setScreen('role'); }}
              />
            )}
            {screen === 'role' && selectedCommodity && (
              <RoleScreen
                commodity={selectedCommodity}
                onSelect={(r) => { setSelectedRole(r); setScreen('form'); }}
              />
            )}
            {screen === 'form' && selectedRole === 'harvest' && (
              <HarvestForm commodity={selectedCommodity} onSuccess={() => setScreen('success')} />
            )}
            {screen === 'form' && selectedRole === 'storage' && (
              <StorageForm commodity={selectedCommodity} onSuccess={() => setScreen('success')} />
            )}
            {screen === 'form' && selectedRole === 'loadout' && (
              <LoadOutForm commodity={selectedCommodity} onSuccess={() => setScreen('success')} />
            )}
            {screen === 'success' && (
              <SuccessScreen
                commodity={selectedCommodity}
                role={selectedRole}
                cropYear={cropYear}
                onAgain={() => setScreen('form')}
                onCommodity={() => setScreen('role')}
                onHome={() => setScreen('commodity')}
              />
            )}
          </main>
        </>
      )}
    </div>
  );
}
