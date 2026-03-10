import { useLang } from '../i18n/LangContext.jsx';

export default function RoleScreen({ commodity, onSelect }) {
  const { t, lang } = useLang();
  const name = lang === 'es' ? commodity.labelEs : commodity.label;

  return (
    <div className="role-screen">
      {/* Commodity identity — always visible */}
      <div
        className="commodity-banner"
        style={{
          background: `linear-gradient(135deg, ${commodity.color}22, ${commodity.colorLight})`,
          borderBottomColor: commodity.color,
        }}
      >
        <div className="banner-emoji">{commodity.emoji}</div>
        <div className="banner-text">
          <div className="banner-label" style={{ color: commodity.colorDark }}>
            {lang === 'es' ? 'Cultivo seleccionado' : 'Selected crop'}
          </div>
          <div className="banner-name" style={{ color: commodity.colorDark }}>
            {name}
          </div>
        </div>
      </div>

      <div className="role-prompt">{t.selectRole}</div>

      <div className="role-list">
        {/* HARVEST */}
        <button className="role-card harvest" onClick={() => onSelect('harvest')}>
          <div className="role-card-header">
            <div className="role-icon">🚜</div>
            <div className="role-info">
              <div className="role-title">{t.harvest}</div>
              <div className="role-desc">{t.harvestDesc}</div>
            </div>
            <div className="role-arrow">›</div>
          </div>
          <div className="role-direction-strip">
            🌾 {lang === 'es' ? 'Campo → Camión' : 'Field → Truck'}
          </div>
        </button>

        {/* STORAGE INTAKE */}
        <button className="role-card storage" onClick={() => onSelect('storage')}>
          <div className="role-card-header">
            <div className="role-icon">⬇️</div>
            <div className="role-info">
              <div className="role-title">{t.storage}</div>
              <div className="role-desc">{t.storageDesc}</div>
            </div>
            <div className="role-arrow">›</div>
          </div>
          <div className="role-direction-strip">
            🏚️ {lang === 'es' ? 'Camión → Almacén' : 'Truck → Storage'}
          </div>
        </button>

        {/* LOAD OUT */}
        <button className="role-card loadout" onClick={() => onSelect('loadout')}>
          <div className="role-card-header">
            <div className="role-icon">⬆️</div>
            <div className="role-info">
              <div className="role-title">{t.loadout}</div>
              <div className="role-desc">{t.loadoutDesc}</div>
            </div>
            <div className="role-arrow">›</div>
          </div>
          <div className="role-direction-strip">
            📦 {lang === 'es' ? 'Almacén → Venta' : 'Storage → Sale'}
          </div>
        </button>
      </div>
    </div>
  );
}
