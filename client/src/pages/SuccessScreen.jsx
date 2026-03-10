import { useLang } from '../i18n/LangContext.jsx';

export default function SuccessScreen({ commodity, role, cropYear, onAgain, onCommodity, onHome }) {
  const { t, lang } = useLang();
  const name = lang === 'es' ? commodity.labelEs : commodity.label;

  const titleKey = `${role}Success`;
  const descKey = `${role}SuccessDesc`;

  return (
    <div className="success-screen">
      <div className="success-icon">✅</div>
      <div className="success-commodity" style={{ color: commodity.color }}>
        {commodity.emoji} {name}
      </div>
      {cropYear && (
        <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 4, letterSpacing: '0.06em' }}>
          📅 {cropYear}
        </div>
      )}
      <h2 className="success-title">{t[titleKey]}</h2>
      <p className="success-desc">{t[descKey]}</p>

      <div className="success-actions">
        <button className={`btn-again ${role}`} onClick={onAgain}>
          {t.logAnother}
        </button>
        <button className="btn-commodity" onClick={onCommodity}
          style={{ borderColor: commodity.color, color: commodity.colorDark }}>
          {commodity.emoji} {lang === 'es' ? 'Otra operación' : 'Another operation'} — {name}
        </button>
        <button className="btn-home" onClick={onHome}>
          {t.backToHome}
        </button>
      </div>
    </div>
  );
}
