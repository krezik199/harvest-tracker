import { useState, useEffect } from 'react';
import { useLang } from '../i18n/LangContext.jsx';
import { FARM_CONFIG } from '../farmConfig.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9); }

function getYearOptions() {
  const current = new Date().getFullYear();
  const years = [];
  for (let y = current - 5; y <= current + 3; y++) years.push(String(y));
  return years;
}

// ── Editable List Component ───────────────────────────────────────────────────
function EditableList({ title, titleEs, items, onChange, accentColor = '#1E130A' }) {
  const { lang } = useLang();
  const [newName, setNewName] = useState('');

  const toggle = (id) => onChange(items.map(it => it.id === id ? { ...it, active: !it.active } : it));
  const moveUp = (idx) => { if (idx === 0) return; const a = [...items]; [a[idx-1], a[idx]] = [a[idx], a[idx-1]]; onChange(a); };
  const moveDown = (idx) => { if (idx === items.length-1) return; const a = [...items]; [a[idx], a[idx+1]] = [a[idx+1], a[idx]]; onChange(a); };
  const addItem = () => {
    const name = newName.trim();
    if (!name) return;
    if (items.some(it => it.name.toLowerCase() === name.toLowerCase())) { setNewName(''); return; }
    onChange([...items, { id: uid(), name, active: true }]);
    setNewName('');
  };

  return (
    <div className="config-section">
      <div className="config-section-title" style={{ borderLeftColor: accentColor }}>
        {lang === 'es' ? titleEs : title}
        <span className="config-count">{items.filter(i=>i.active).length}/{items.length}</span>
      </div>

      <div className="config-list">
        {items.map((item, idx) => (
          <div key={item.id} className={`config-item${item.active ? '' : ' inactive'}`}>
            <div className="config-item-reorder">
              <button className="reorder-btn" onClick={() => moveUp(idx)} disabled={idx === 0}>▲</button>
              <button className="reorder-btn" onClick={() => moveDown(idx)} disabled={idx === items.length-1}>▼</button>
            </div>
            <div className="config-item-name">{item.name}</div>
            <button
              className={`config-toggle-btn${item.active ? ' on' : ' off'}`}
              onClick={() => toggle(item.id)}
            >
              {item.active ? (lang === 'es' ? 'Activo' : 'Active') : (lang === 'es' ? 'Oculto' : 'Hidden')}
            </button>
          </div>
        ))}
      </div>

      {/* Add new item */}
      <div className="config-add-row">
        <input
          className="config-add-input"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
          placeholder={lang === 'es' ? '+ Agregar nuevo...' : '+ Add new...'}
        />
        <button
          className="config-add-btn"
          style={{ background: accentColor }}
          onClick={addItem}
          disabled={!newName.trim()}
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
export default function SettingsScreen({ onClose }) {
  const { t, lang } = useLang();

  const [unlocked, setUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [activeTab, setActiveTab] = useState('year'); // 'year' | 'config'

  // Config state — mirrors server
  const [config, setConfig] = useState(null);
  const [localConfig, setLocalConfig] = useState(null); // editable local copy
  const [selectedCommodityKey, setSelectedCommodityKey] = useState('wheat');

  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(''); // 'success' | 'error' | ''
  const [selectedYear, setSelectedYear] = useState('');
  const [yearSaveResult, setYearSaveResult] = useState('');

  // Load config from server
  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(data => {
        setConfig(data);
        setLocalConfig(JSON.parse(JSON.stringify(data)));
        setSelectedYear(data.cropYear);
      })
      .catch(() => {});
  }, []);

  const handleUnlock = () => {
    if (passwordInput === '8200') {
      setUnlocked(true);
      setPasswordError('');
    } else {
      setPasswordError(t.settingsWrongPassword);
      setPasswordInput('');
    }
  };

  // Save crop year
  const saveYear = async () => {
    setSaving(true);
    setYearSaveResult('');
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: '8200', patch: { cropYear: selectedYear } }),
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setLocalConfig(JSON.parse(JSON.stringify(data.config)));
        setYearSaveResult('success');
      } else { setYearSaveResult('error'); }
    } catch { setYearSaveResult('error'); }
    finally { setSaving(false); }
  };

  // Save field config
  const saveConfig = async () => {
    setSaving(true);
    setSaveResult('');
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: '8200',
          patch: {
            fields: localConfig.fields,
            storageLocations: localConfig.storageLocations,
            trucks: localConfig.trucks,
            buyers: localConfig.buyers,
            varieties: localConfig.varieties,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setLocalConfig(JSON.parse(JSON.stringify(data.config)));
        setSaveResult('success');
        setTimeout(() => setSaveResult(''), 3000);
      } else { setSaveResult('error'); }
    } catch { setSaveResult('error'); }
    finally { setSaving(false); }
  };

  const updateLocalList = (key, newItems) => {
    setLocalConfig(prev => ({ ...prev, [key]: newItems }));
    setSaveResult('');
  };

  const updateVarieties = (commodityKey, newItems) => {
    setLocalConfig(prev => ({
      ...prev,
      varieties: { ...prev.varieties, [commodityKey]: newItems },
    }));
    setSaveResult('');
  };

  const yearOptions = getYearOptions();

  // ── Commodity accent colors for variety sections ──────────────────────────
  const commodityColors = {
    wheat: '#B58A00', peas: '#4A8A42', potatoes: '#8B5E3C', onions: '#7B3FA0',
  };

  return (
    <div className="settings-screen">
      {/* Sub-header */}
      <div className="settings-header">
        <button className="settings-close-btn" onClick={onClose}>✕</button>
        <div className="settings-header-title">⚙️ {t.settingsTitle}</div>
        <div style={{ width: 36 }} />
      </div>

      {!unlocked ? (
        /* ── Lock Screen ── */
        <div className="settings-lock-screen">
          <div className="lock-icon">🔒</div>
          <div className="lock-title">{t.settingsTitle}</div>
          <div className="lock-subtitle">{t.settingsPasswordPlaceholder}</div>
          <div className="lock-form">
            <input
              className="lock-input"
              type="password"
              inputMode="numeric"
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUnlock()}
              placeholder="••••"
              autoFocus
            />
            {passwordError && <div className="lock-error">⚠️ {passwordError}</div>}
            <button className="lock-btn" onClick={handleUnlock}>{t.settingsUnlock}</button>
          </div>
        </div>
      ) : (
        /* ── Unlocked ── */
        <div className="settings-unlocked">
          {/* Tab Bar */}
          <div className="settings-tab-bar">
            <button
              className={`settings-tab${activeTab === 'year' ? ' active' : ''}`}
              onClick={() => setActiveTab('year')}
            >
              📅 {lang === 'es' ? 'Año' : 'Crop Year'}
            </button>
            <button
              className={`settings-tab${activeTab === 'config' ? ' active' : ''}`}
              onClick={() => setActiveTab('config')}
            >
              🗂️ {lang === 'es' ? 'Configuración' : 'Field Config'}
            </button>
          </div>

          {/* ── TAB: Crop Year ── */}
          {activeTab === 'year' && config && (
            <div className="settings-panel">
              <div className="year-status-badge">
                <div className="year-status-label">{t.settingsCurrentYear}</div>
                <div className="year-status-value">{config.cropYear}</div>
              </div>

              <div className="settings-card">
                <div className="settings-card-title">📅 {t.settingsCropYear}</div>
                <div className="settings-card-desc">{t.settingsCropYearDesc}</div>

                <div className="year-picker">
                  {yearOptions.map(y => (
                    <button
                      key={y}
                      className={`year-option${selectedYear === y ? ' selected' : ''}${config.cropYear === y ? ' current' : ''}`}
                      onClick={() => { setSelectedYear(y); setYearSaveResult(''); }}
                    >
                      {y}
                      {config.cropYear === y && <span className="year-active-dot" />}
                    </button>
                  ))}
                </div>

                {yearSaveResult === 'success' && (
                  <div className="save-success">{t.settingsSaved} <strong>{config.cropYear}</strong></div>
                )}
                {yearSaveResult === 'error' && (
                  <div className="save-error">⚠️ {t.settingsSaveFailed}</div>
                )}

                <button
                  className="settings-save-btn"
                  onClick={saveYear}
                  disabled={saving || selectedYear === config.cropYear}
                >
                  {saving ? <><span className="spinner" />Saving...</> : t.settingsSave}
                </button>
                {selectedYear === config.cropYear && yearSaveResult !== 'success' && (
                  <div className="settings-no-change">{config.cropYear} is already active</div>
                )}
              </div>

              {/* Tab name preview */}
              <div className="settings-card preview-card">
                <div className="settings-card-title">📋 {lang === 'es' ? 'Vista Previa de Pestañas' : 'Sheet Tab Preview'}</div>
                <div className="preview-list">
                  <div className="preview-item harvest-preview">🚜 <span>{selectedYear} - Home Place - North</span></div>
                  <div className="preview-item storage-preview">⬇️ <span>{selectedYear} - IN: Cellar A</span></div>
                  <div className="preview-item loadout-preview">⬆️ <span>{selectedYear} - OUT: Cellar A</span></div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Field Config ── */}
          {activeTab === 'config' && localConfig && (
            <div className="settings-panel">

              {/* Info banner */}
              <div className="config-info-banner">
                {lang === 'es'
                  ? '✏️ Los cambios son visibles para todos los operadores de inmediato al guardar.'
                  : '✏️ Changes apply to all operators immediately when saved. Hidden items disappear from operator dropdowns.'}
              </div>

              {/* Fields */}
              <EditableList
                title="Fields"
                titleEs="Campos"
                items={localConfig.fields}
                onChange={items => updateLocalList('fields', items)}
                accentColor="#5CB85C"
              />

              {/* Storage Locations */}
              <EditableList
                title="Storage Locations"
                titleEs="Lugares de Almacenamiento"
                items={localConfig.storageLocations}
                onChange={items => updateLocalList('storageLocations', items)}
                accentColor="#4A9EE0"
              />

              {/* Trucks */}
              <EditableList
                title="Trucks"
                titleEs="Camiones"
                items={localConfig.trucks}
                onChange={items => updateLocalList('trucks', items)}
                accentColor="#8B7358"
              />

              {/* Buyers */}
              <EditableList
                title="Buyers / Destinations"
                titleEs="Compradores / Destinos"
                items={localConfig.buyers}
                onChange={items => updateLocalList('buyers', items)}
                accentColor="#E07A30"
              />

              {/* Varieties — per commodity */}
              <div className="config-section">
                <div className="config-section-title" style={{ borderLeftColor: '#7B3FA0' }}>
                  {lang === 'es' ? 'Variedades por Cultivo' : 'Varieties by Commodity'}
                </div>

                {/* Commodity selector tabs */}
                <div className="variety-commodity-tabs">
                  {FARM_CONFIG.commodities.map(c => (
                    <button
                      key={c.key}
                      className={`variety-commodity-tab${selectedCommodityKey === c.key ? ' active' : ''}`}
                      style={selectedCommodityKey === c.key ? { background: c.color, borderColor: c.color } : {}}
                      onClick={() => setSelectedCommodityKey(c.key)}
                    >
                      {c.emoji} {lang === 'es' ? c.labelEs : c.label}
                    </button>
                  ))}
                </div>

                {localConfig.varieties[selectedCommodityKey] && (
                  <EditableList
                    title={`${FARM_CONFIG.commodities.find(c=>c.key===selectedCommodityKey)?.label} Varieties`}
                    titleEs={`Variedades de ${FARM_CONFIG.commodities.find(c=>c.key===selectedCommodityKey)?.labelEs}`}
                    items={localConfig.varieties[selectedCommodityKey]}
                    onChange={items => updateVarieties(selectedCommodityKey, items)}
                    accentColor={commodityColors[selectedCommodityKey]}
                  />
                )}
              </div>

              {/* Save button — sticky at bottom */}
              <div className="config-save-footer">
                {saveResult === 'success' && (
                  <div className="save-success">✓ {lang === 'es' ? 'Configuración guardada para todos' : 'Config saved — applied to all users'}</div>
                )}
                {saveResult === 'error' && (
                  <div className="save-error">⚠️ {t.settingsSaveFailed}</div>
                )}
                <button className="settings-save-btn config-save-btn" onClick={saveConfig} disabled={saving}>
                  {saving
                    ? <><span className="spinner" />{lang === 'es' ? 'Guardando...' : 'Saving...'}</>
                    : lang === 'es' ? '✓ Guardar y Aplicar a Todos' : '✓ Save & Apply to All Users'}
                </button>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
