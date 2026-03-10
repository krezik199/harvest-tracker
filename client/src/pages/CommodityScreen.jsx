import { useLang } from '../i18n/LangContext.jsx';
import { FARM_CONFIG } from '../farmConfig.js';

export default function CommodityScreen({ onSelect, cropYear }) {
  const { t, lang } = useLang();

  return (
    <div className="commodity-screen">
      <div className="commodity-hero">
        <h1>{t.selectCommodity}</h1>
        <p>{t.selectCommoditySubtitle}</p>
        {cropYear && (
          <div className="crop-year-pill">📅 {lang === 'es' ? 'Año de Cosecha' : 'Crop Year'}: <strong>{cropYear}</strong></div>
        )}
      </div>

      <div className="commodity-grid">
        {FARM_CONFIG.commodities.map((c) => (
          <button
            key={c.key}
            className="commodity-card"
            style={{
              background: `linear-gradient(160deg, ${c.color}, ${c.colorDark})`,
              boxShadow: `0 6px 28px ${c.color}55`,
            }}
            onClick={() => onSelect(c)}
          >
            <div className="commodity-emoji">{c.emoji}</div>
            <div className="commodity-name">
              {lang === 'es' ? c.labelEs : c.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
