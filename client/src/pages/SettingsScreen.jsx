import { useState, useEffect } from 'react';
import { useLang } from '../i18n/LangContext.jsx';
import { FARM_CONFIG } from '../farmConfig.js';

function uid() { return Math.random().toString(36).slice(2, 9); }

function getYearOptions() {
  const current = new Date().getFullYear();
  const years = [];
  for (let y = current - 5; y <= current + 3; y++) years.push(String(y));
  return years;
}

// ── Editable List ─────────────────────────────────────────────────────────────
function EditableList({ title, titleEs, items, onChange, accentColor = '#1E130A' }) {
  const { lang } = useLang();
  const [newName, setNewName] = useState('');

  const toggle = (id) => onChange(items.map(it => it.id === id ? { ...it, active: !it.active } : it));
  const deleteItem = (id) => onChange(items.filter(it => it.id !== id));
  const moveUp = (idx) => { if (idx === 0) return; const a = [...items]; [a[idx-1], a[idx]] = [a[idx], a[idx-1]]; onChange(a); };
  const moveDown = (idx) => { if (idx === items.length-1) return; const a = [...items]; [a[idx], a[idx+1]] = [a[idx+1], a[idx]]; onChange(a); };
  const addItem = () => {
    const name = newName.trim();
    if (!name || items.some(it => it.name.toLowerCase() === name.toLowerCase())) { setNewName(''); return; }
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
            <button className={`config-toggle-btn${item.active ? ' on' : ' off'}`} onClick={() => toggle(item.id)}>
              {item.active ? (lang === 'es' ? 'Activo' : 'Active') : (lang === 'es' ? 'Oculto' : 'Hidden')}
            </button>
            <button className="config-delete-btn" onClick={() => deleteItem(item.id)} title="Delete">✕</button>
          </div>
        ))}
      </div>
      <div className="config-add-row">
        <input className="config-add-input" value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
          placeholder={lang === 'es' ? '+ Agregar nuevo...' : '+ Add new...'} />
        <button className="config-add-btn" style={{ background: accentColor }}
          onClick={addItem} disabled={!newName.trim()}>Add</button>
      </div>
    </div>
  );
}

// ── Assignment Panel ──────────────────────────────────────────────────────────
// Used for both fields and storage locations
function AssignmentPanel({ type, items, assignments, varieties, onChange, lang }) {
  const [selectedItemId, setSelectedItemId] = useState(null);

  const selectedItem = items.find(i => i.id === selectedItemId);
  const itemAssignments = selectedItemId ? (assignments[selectedItemId] || {}) : {};

  const toggleCommodity = (commodityKey) => {
    if (!selectedItemId) return;
    const current = { ...assignments };
    const itemA = { ...(current[selectedItemId] || {}) };
    if (itemA[commodityKey] !== undefined) {
      delete itemA[commodityKey]; // remove commodity
    } else {
      itemA[commodityKey] = []; // add commodity, all varieties
    }
    current[selectedItemId] = itemA;
    onChange(current);
  };

  const toggleVariety = (commodityKey, varietyName) => {
    if (!selectedItemId) return;
    const current = { ...assignments };
    const itemA = { ...(current[selectedItemId] || {}) };
    const varieties = [...(itemA[commodityKey] || [])];
    const idx = varieties.indexOf(varietyName);
    if (idx >= 0) varieties.splice(idx, 1);
    else varieties.push(varietyName);
    itemA[commodityKey] = varieties;
    current[selectedItemId] = itemA;
    onChange(current);
  };

  const activeItems = items.filter(i => i.active);
  const isField = type === 'field';

  return (
    <div className="assignment-panel">
      <div className="assignment-info">
        {lang === 'es'
          ? `Selecciona un ${isField ? 'campo' : 'almacén'} para asignar qué cultivos y variedades se permiten. Sin asignación = todos los cultivos mostrados.`
          : `Select a ${isField ? 'field' : 'storage location'} to assign which commodities and varieties are allowed. No assignment = all commodities shown.`}
      </div>

      {/* Item selector */}
      <div className="assignment-item-list">
        {activeItems.map(item => {
          const hasAssignment = assignments[item.id] && Object.keys(assignments[item.id]).length > 0;
          return (
            <button
              key={item.id}
              className={`assignment-item-btn${selectedItemId === item.id ? ' selected' : ''}${hasAssignment ? ' has-assignment' : ''}`}
              onClick={() => setSelectedItemId(selectedItemId === item.id ? null : item.id)}
            >
              <span className="assignment-item-name">{item.name}</span>
              {hasAssignment && (
                <span className="assignment-dot">
                  {Object.keys(assignments[item.id]).map(key =>
                    FARM_CONFIG.commodities.find(c => c.key === key)?.emoji
                  ).join('')}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Commodity + variety assignment for selected item */}
      {selectedItem && (
        <div className="assignment-editor">
          <div className="assignment-editor-title">
            {lang === 'es' ? 'Configurando:' : 'Configuring:'} <strong>{selectedItem.name}</strong>
          </div>
          <div className="assignment-editor-hint">
            {lang === 'es'
              ? 'Sin selección = todos los cultivos disponibles'
              : 'No selection = all commodities available to operator'}
          </div>

          {FARM_CONFIG.commodities.map(commodity => {
            const isEnabled = itemAssignments[commodity.key] !== undefined;
            const assignedVarieties = itemAssignments[commodity.key] || [];
            const allVars = (varieties[commodity.key] || []).filter(v => v.active).map(v => v.name);
            const allSelected = assignedVarieties.length === 0; // empty array = all varieties

            return (
              <div key={commodity.key} className={`commodity-assignment-block${isEnabled ? ' enabled' : ''}`}
                style={isEnabled ? { borderColor: commodity.color, background: commodity.colorLight + '44' } : {}}>
                {/* Commodity toggle header */}
                <button
                  className="commodity-assignment-header"
                  onClick={() => toggleCommodity(commodity.key)}
                  style={isEnabled ? { background: commodity.color } : {}}
                >
                  <span>{commodity.emoji} {lang === 'es' ? commodity.labelEs : commodity.label}</span>
                  <span className={`commodity-assign-toggle${isEnabled ? ' on' : ' off'}`}>
                    {isEnabled
                      ? (lang === 'es' ? '✓ Permitido' : '✓ Allowed')
                      : (lang === 'es' ? '✗ No asignado' : '✗ Not assigned')}
                  </span>
                </button>

                {/* Variety sub-selection when commodity is enabled */}
                {isEnabled && (
                  <div className="variety-assignment-list">
                    <div className="variety-assignment-hint">
                      {lang === 'es' ? 'Variedades permitidas (ninguna = todas):' : 'Allowed varieties (none checked = all):'}
                    </div>
                    {allVars.map(varietyName => {
                      const checked = assignedVarieties.length === 0 || assignedVarieties.includes(varietyName);
                      return (
                        <button
                          key={varietyName}
                          className={`variety-assign-btn${checked ? ' checked' : ''}`}
                          style={checked ? { borderColor: commodity.color, color: commodity.colorDark, background: commodity.colorLight } : {}}
                          onClick={() => toggleVariety(commodity.key, varietyName)}
                        >
                          {checked ? '✓' : '○'} {varietyName}
                        </button>
                      );
                    })}
                    {assignedVarieties.length === 0 && (
                      <div className="variety-all-note">
                        {lang === 'es' ? 'Todas las variedades activas permitidas' : 'All active varieties allowed'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SETTINGS SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
export default function SettingsScreen({ onClose }) {
  const { t, lang } = useLang();

  const [unlocked, setUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [activeTab, setActiveTab] = useState('year');

  const [config, setConfig] = useState(null);
  const [localConfig, setLocalConfig] = useState(null);
  const [selectedCommodityKey, setSelectedCommodityKey] = useState('wheat');
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [yearSaveResult, setYearSaveResult] = useState('');

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(data => {
      setConfig(data);
      setLocalConfig(JSON.parse(JSON.stringify(data)));
      setSelectedYear(data.cropYear);
    }).catch(() => {});
  }, []);

  const handleUnlock = () => {
    if (passwordInput === '8200') { setUnlocked(true); setPasswordError(''); }
    else { setPasswordError(t.settingsWrongPassword); setPasswordInput(''); }
  };

  const saveYear = async () => {
    setSaving(true); setYearSaveResult('');
    try {
      const res = await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: '8200', patch: { cropYear: selectedYear } }) });
      const data = await res.json();
      if (data.success) { setConfig(data.config); setLocalConfig(JSON.parse(JSON.stringify(data.config))); setYearSaveResult('success'); }
      else setYearSaveResult('error');
    } catch { setYearSaveResult('error'); }
    finally { setSaving(false); }
  };

  const saveConfig = async (extraPatch = {}) => {
    setSaving(true); setSaveResult('');
    try {
      const res = await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: '8200', patch: {
          fields: localConfig.fields,
          storageLocations: localConfig.storageLocations,
          trucks: localConfig.trucks,
          buyers: localConfig.buyers,
          varieties: localConfig.varieties,
          fieldAssignments: localConfig.fieldAssignments,
          storageAssignments: localConfig.storageAssignments,
          ...extraPatch,
        }}) });
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setLocalConfig(JSON.parse(JSON.stringify(data.config)));
        setSaveResult('success');
        setTimeout(() => setSaveResult(''), 3000);
      } else setSaveResult('error');
    } catch { setSaveResult('error'); }
    finally { setSaving(false); }
  };

  const updateLocalList = (key, newItems) => { setLocalConfig(prev => ({ ...prev, [key]: newItems })); setSaveResult(''); };
  const updateVarieties = (commodityKey, newItems) => { setLocalConfig(prev => ({ ...prev, varieties: { ...prev.varieties, [commodityKey]: newItems } })); setSaveResult(''); };
  const updateFieldAssignments = (newAssignments) => { setLocalConfig(prev => ({ ...prev, fieldAssignments: newAssignments })); setSaveResult(''); };
  const updateStorageAssignments = (newAssignments) => { setLocalConfig(prev => ({ ...prev, storageAssignments: newAssignments })); setSaveResult(''); };

  const commodityColors = { wheat: '#B58A00', peas: '#4A8A42', potatoes: '#8B5E3C', onions: '#7B3FA0' };
  const yearOptions = getYearOptions();

  const SaveFooter = ({ onSave }) => (
    <div className="config-save-footer">
      {saveResult === 'success' && <div className="save-success">✓ {lang === 'es' ? 'Guardado para todos' : 'Saved — applied to all users'}</div>}
      {saveResult === 'error' && <div className="save-error">⚠️ {t.settingsSaveFailed}</div>}
      <button className="settings-save-btn config-save-btn" onClick={onSave || saveConfig} disabled={saving}>
        {saving ? <><span className="spinner" />{lang === 'es' ? 'Guardando...' : 'Saving...'}</> : lang === 'es' ? '✓ Guardar y Aplicar a Todos' : '✓ Save & Apply to All Users'}
      </button>
    </div>
  );

  return (
    <div className="settings-screen">
      <div className="settings-header">
        <button className="settings-close-btn" onClick={onClose}>✕</button>
        <div className="settings-header-title">⚙️ {t.settingsTitle}</div>
        <div style={{ width: 36 }} />
      </div>

      {!unlocked ? (
        <div className="settings-lock-screen">
          <div className="lock-icon">🔒</div>
          <div className="lock-title">{t.settingsTitle}</div>
          <div className="lock-subtitle">{t.settingsPasswordPlaceholder}</div>
          <div className="lock-form">
            <input className="lock-input" type="password" inputMode="numeric"
              value={passwordInput} onChange={e => setPasswordInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUnlock()} placeholder="••••" autoFocus />
            {passwordError && <div className="lock-error">⚠️ {passwordError}</div>}
            <button className="lock-btn" onClick={handleUnlock}>{t.settingsUnlock}</button>
          </div>
        </div>
      ) : (
        <div className="settings-unlocked">
          {/* Tab Bar — 3 tabs */}
          <div className="settings-tab-bar">
            <button className={`settings-tab${activeTab === 'year' ? ' active' : ''}`} onClick={() => setActiveTab('year')}>
              📅 {lang === 'es' ? 'Año' : 'Crop Year'}
            </button>
            <button className={`settings-tab${activeTab === 'config' ? ' active' : ''}`} onClick={() => setActiveTab('config')}>
              🗂️ {lang === 'es' ? 'Listas' : 'Lists'}
            </button>
            <button className={`settings-tab${activeTab === 'assignments' ? ' active' : ''}`} onClick={() => setActiveTab('assignments')}>
              📌 {lang === 'es' ? 'Asignaciones' : 'Assignments'}
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
                    <button key={y}
                      className={`year-option${selectedYear === y ? ' selected' : ''}${config.cropYear === y ? ' current' : ''}`}
                      onClick={() => { setSelectedYear(y); setYearSaveResult(''); }}>
                      {y}{config.cropYear === y && <span className="year-active-dot" />}
                    </button>
                  ))}
                </div>
                {yearSaveResult === 'success' && <div className="save-success">{t.settingsSaved} <strong>{config.cropYear}</strong></div>}
                {yearSaveResult === 'error' && <div className="save-error">⚠️ {t.settingsSaveFailed}</div>}
                <button className="settings-save-btn" onClick={saveYear} disabled={saving || selectedYear === config.cropYear}>
                  {saving ? <><span className="spinner" />Saving...</> : t.settingsSave}
                </button>
                {selectedYear === config.cropYear && yearSaveResult !== 'success' && <div className="settings-no-change">{config.cropYear} is already active</div>}
              </div>
              <div className="settings-card preview-card">
                <div className="settings-card-title">📋 {lang === 'es' ? 'Vista Previa' : 'Tab Preview'}</div>
                <div className="preview-list">
                  <div className="preview-item harvest-preview">🚜 <span>{selectedYear} - Home Place - North</span></div>
                  <div className="preview-item storage-preview">⬇️ <span>{selectedYear} - IN: Cellar A</span></div>
                  <div className="preview-item loadout-preview">⬆️ <span>{selectedYear} - OUT: Cellar A</span></div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Lists ── */}
          {activeTab === 'config' && localConfig && (
            <div className="settings-panel">
              <div className="config-info-banner">
                {lang === 'es' ? '✏️ Los cambios aplican a todos al guardar. Ocultos = no visibles para operadores.' : '✏️ Changes apply to all operators when saved. Hidden items disappear from dropdowns.'}
              </div>
              <EditableList title="Fields" titleEs="Campos" items={localConfig.fields} onChange={items => updateLocalList('fields', items)} accentColor="#5CB85C" />
              <EditableList title="Storage Locations" titleEs="Almacenes" items={localConfig.storageLocations} onChange={items => updateLocalList('storageLocations', items)} accentColor="#4A9EE0" />
              <EditableList title="Trucks" titleEs="Camiones" items={localConfig.trucks} onChange={items => updateLocalList('trucks', items)} accentColor="#8B7358" />
              <EditableList title="Buyers / Destinations" titleEs="Compradores" items={localConfig.buyers} onChange={items => updateLocalList('buyers', items)} accentColor="#E07A30" />

              <div className="config-section">
                <div className="config-section-title" style={{ borderLeftColor: '#7B3FA0' }}>
                  {lang === 'es' ? 'Variedades por Cultivo' : 'Varieties by Commodity'}
                </div>
                <div className="variety-commodity-tabs">
                  {FARM_CONFIG.commodities.map(c => (
                    <button key={c.key}
                      className={`variety-commodity-tab${selectedCommodityKey === c.key ? ' active' : ''}`}
                      style={selectedCommodityKey === c.key ? { background: c.color, borderColor: c.color } : {}}
                      onClick={() => setSelectedCommodityKey(c.key)}>
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
              <SaveFooter />
            </div>
          )}

          {/* ── TAB: Assignments ── */}
          {activeTab === 'assignments' && localConfig && (
            <div className="settings-panel">
              <div className="config-info-banner">
                {lang === 'es'
                  ? '📌 Asigna cultivos y variedades a cada campo y almacén para que los operadores solo vean las opciones correctas.'
                  : '📌 Assign commodities and varieties to each field and storage location so operators only see the correct options.'}
              </div>

              <div className="assignment-section-header">
                🚜 {lang === 'es' ? 'Asignaciones de Campo' : 'Field Assignments'}
              </div>
              <AssignmentPanel
                type="field"
                items={localConfig.fields}
                assignments={localConfig.fieldAssignments || {}}
                varieties={localConfig.varieties}
                onChange={updateFieldAssignments}
                lang={lang}
              />

              <div className="assignment-section-header" style={{ marginTop: 20 }}>
                🏚️ {lang === 'es' ? 'Asignaciones de Almacén' : 'Storage Assignments'}
              </div>
              <AssignmentPanel
                type="storage"
                items={localConfig.storageLocations}
                assignments={localConfig.storageAssignments || {}}
                varieties={localConfig.varieties}
                onChange={updateStorageAssignments}
                lang={lang}
              />

              <SaveFooter />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
