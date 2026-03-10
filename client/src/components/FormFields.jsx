import { useLang } from '../i18n/LangContext.jsx';
import { FARM_CONFIG } from '../farmConfig.js';

export function FormSection({ title, children }) {
  return (
    <div className="form-section">
      {title && <div className="form-section-title">{title}</div>}
      {children}
    </div>
  );
}

export function FormGroup({ label, required, children }) {
  const { t } = useLang();
  return (
    <div className="form-group">
      <label className="form-label">
        {label}
        {required && <span className="req">*</span>}
      </label>
      {children}
    </div>
  );
}

export function SelectField({ value, onChange, options, required }) {
  const { t } = useLang();
  return (
    <select
      className="form-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
    >
      <option value="">{t.selectPlaceholder}</option>
      {options.map((opt) => {
        const val = typeof opt === 'object' ? opt.value : opt;
        const label = typeof opt === 'object' ? opt.label : opt;
        return <option key={val} value={val}>{label}</option>;
      })}
    </select>
  );
}

export function InputField({ value, onChange, type = 'text', placeholder, required, inputMode }) {
  return (
    <input
      className="form-input"
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
    />
  );
}

export function TextArea({ value, onChange, placeholder }) {
  return (
    <textarea
      className="form-textarea"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

export function CertToggle({ value, onChange }) {
  const { t } = useLang();
  return (
    <div className="cert-toggle">
      {FARM_CONFIG.certifications.map((cert) => (
        <div className="cert-option" key={cert.value}>
          <input
            type="radio"
            id={`cert-${cert.value}`}
            name="certification"
            value={cert.value}
            checked={value === cert.value}
            onChange={() => onChange(cert.value)}
          />
          <label htmlFor={`cert-${cert.value}`}>
            {cert.value === 'Organic' ? '🌿 ' : '🌾 '}
            {t[cert.value.toLowerCase()]}
          </label>
        </div>
      ))}
    </div>
  );
}

// Banner at top of every form showing commodity + role clearly
export function FormTopBanner({ commodity, role, lang }) {
  const { t } = useLang();
  const name = lang === 'es' ? commodity.labelEs : commodity.label;

  const roleConfig = {
    harvest: { emoji: '🚜', titleKey: 'harvestBanner', subKey: 'harvestBannerSub' },
    storage: { emoji: '⬇️', titleKey: 'storageBanner', subKey: 'storageBannerSub' },
    loadout: { emoji: '⬆️', titleKey: 'loadoutBanner', subKey: 'loadoutBannerSub' },
  };
  const rc = roleConfig[role];

  return (
    <div className="form-top-banner">
      {/* Commodity stripe */}
      <div
        className="form-commodity-stripe"
        style={{ background: `linear-gradient(135deg, ${commodity.colorDark}, ${commodity.color})` }}
      >
        <span style={{ fontSize: 22 }}>{commodity.emoji}</span>
        <span>{name}</span>
      </div>

      {/* Role block */}
      <div className={`form-role-block ${role}`}>
        <div className="form-role-emoji">{rc.emoji}</div>
        <div className="form-role-text">
          <h2 className="form-role-title">{t[rc.titleKey]}</h2>
          <div className="form-role-sub">{t[rc.subKey]}</div>
          {role === 'storage' && (
            <div className="direction-badge into">⬇ {lang === 'es' ? 'AL Almacén' : 'INTO Storage'}</div>
          )}
          {role === 'loadout' && (
            <div className="direction-badge out">⬆ {lang === 'es' ? 'DEL Almacén' : 'OUT of Storage'}</div>
          )}
        </div>
      </div>
    </div>
  );
}
