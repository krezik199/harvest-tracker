import { useState } from 'react';
import { useLang } from '../i18n/LangContext.jsx';
import { useConfig } from '../i18n/ConfigContext.jsx';
import { FARM_CONFIG } from '../farmConfig.js';
import { getFormMemory, saveFormMemory } from '../memory.js';
import { getCommoditiesForStorage, getVarietiesForStorage } from '../assignments.js';
import {
  FormSection, FormGroup, SelectField, InputField, TextArea, CertToggle, FormTopBanner,
} from '../components/FormFields.jsx';

export default function StorageForm({ commodity, onSuccess }) {
  const { t, lang } = useLang();
  const { config, activeNames } = useConfig();

  const mem = getFormMemory('storage', commodity.key);

  const [form, setForm] = useState({
    storageLocation: mem.storageLocation || '',
    commodity: commodity.key,
    field: mem.field || '',
    variety: mem.variety || '',
    certification: mem.certification || 'Conventional',
    truck: '',
    operator: mem.operator || '',
    actualWeight: '',
    unit: mem.unit || '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (val) => {
    setForm(f => {
      const next = { ...f, [key]: val };
      if (key === 'storageLocation') {
        const storageItem = config?.storageLocations?.find(s => s.name === val);
        const allowed = storageItem
          ? getCommoditiesForStorage(storageItem.id, config, FARM_CONFIG.commodities)
          : FARM_CONFIG.commodities;
        const stillValid = allowed.some(c => c.key === next.commodity);
        if (!stillValid) { next.commodity = allowed[0]?.key || commodity.key; next.variety = ''; }
        else next.variety = '';
      }
      if (key === 'commodity') next.variety = '';
      return next;
    });
  };

  const storageItem = config?.storageLocations?.find(s => s.name === form.storageLocation);
  const allCommodities = FARM_CONFIG.commodities;
  const allowedCommodities = storageItem
    ? getCommoditiesForStorage(storageItem.id, config, allCommodities)
    : allCommodities;

  const allVarieties = activeNames(config?.varieties?.[form.commodity]);
  const allowedVarieties = storageItem
    ? getVarietiesForStorage(storageItem.id, form.commodity, config, allVarieties)
    : allVarieties;

  const activeCommodity = FARM_CONFIG.commodities.find(c => c.key === form.commodity) || commodity;
  const fields = activeNames(config?.fields);
  const storageLocations = activeNames(config?.storageLocations);
  const trucks = activeNames(config?.trucks);
  const units = config?.units || ['Tons', 'CWT', 'Bushels'];

  const handleSubmit = async () => {
    const required = ['storageLocation', 'variety', 'certification', 'truck', 'operator', 'actualWeight', 'unit'];
    if (required.some(k => !form[k])) { setError(t.submitError); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commodityKey: form.commodity,
          sheetId: activeCommodity.sheetId,
          crop: lang === 'es' ? activeCommodity.labelEs : activeCommodity.label,
          field: form.field, variety: form.variety, certification: form.certification,
          truck: form.truck, storageLocation: form.storageLocation,
          operator: form.operator, actualWeight: form.actualWeight,
          unit: form.unit, notes: form.notes,
        }),
      });
      const data = await res.json();
      if (data.success) { saveFormMemory('storage', form.commodity, form); onSuccess(); }
      else setError(t.submitFailed);
    } catch { setError(t.networkError); }
    finally { setLoading(false); }
  };

  return (
    <div className="form-screen">
      <FormTopBanner commodity={activeCommodity} role="storage" lang={lang} />
      <div className="form-body">
        {error && <div className="error-banner">⚠️ {error}</div>}

        <FormSection title={t.loadDetails}>
          {/* Storage location first — drives commodity/variety options */}
          <FormGroup label={t.storageLocation} required>
            <SelectField value={form.storageLocation} onChange={set('storageLocation')} options={storageLocations} required />
          </FormGroup>

          {/* Commodity pills filtered by storage assignment */}
          {form.storageLocation && allowedCommodities.length > 1 && (
            <FormGroup label={t.crop} required>
              <div className="commodity-pill-row">
                {allowedCommodities.map(c => (
                  <button key={c.key}
                    className={`commodity-pill${form.commodity === c.key ? ' active' : ''}`}
                    style={form.commodity === c.key ? { background: c.color, borderColor: c.color } : {}}
                    onClick={() => set('commodity')(c.key)} type="button">
                    {c.emoji} {lang === 'es' ? c.labelEs : c.label}
                  </button>
                ))}
              </div>
            </FormGroup>
          )}

          {form.storageLocation && allowedCommodities.length === 1 && (
            <div className="assigned-commodity-badge" style={{ borderColor: allowedCommodities[0].color, background: allowedCommodities[0].colorLight }}>
              <span>{allowedCommodities[0].emoji}</span>
              <span style={{ color: allowedCommodities[0].colorDark, fontWeight: 700 }}>
                {lang === 'es' ? allowedCommodities[0].labelEs : allowedCommodities[0].label}
              </span>
              <span style={{ color: allowedCommodities[0].colorDark, opacity: 0.6, fontSize: 12 }}>
                {lang === 'es' ? '— asignado a este almacén' : '— assigned to this location'}
              </span>
            </div>
          )}

          <FormGroup label={t.truck} required>
            <SelectField value={form.truck} onChange={set('truck')} options={trucks} required />
          </FormGroup>
          <div className="form-row">
            <FormGroup label={t.actualWeight} required>
              <InputField value={form.actualWeight} onChange={set('actualWeight')} type="number" inputMode="decimal" placeholder="0" required />
            </FormGroup>
            <FormGroup label={t.unit} required>
              <SelectField value={form.unit} onChange={set('unit')} options={units} required />
            </FormGroup>
          </div>
          <FormGroup label={t.operator} required>
            <InputField value={form.operator} onChange={set('operator')} placeholder={t.operatorPlaceholder} required />
          </FormGroup>
        </FormSection>

        <FormSection title={t.cropInfo}>
          <FormGroup label={t.variety} required>
            <SelectField value={form.variety} onChange={set('variety')} options={allowedVarieties} required />
          </FormGroup>
          <FormGroup label={t.certification} required>
            <CertToggle value={form.certification} onChange={set('certification')} />
          </FormGroup>
          <FormGroup label={t.fieldOptional}>
            <SelectField value={form.field} onChange={set('field')} options={fields} />
          </FormGroup>
        </FormSection>

        <FormSection title={`${t.notesSection} (${t.optional})`}>
          <TextArea value={form.notes} onChange={set('notes')} placeholder={t.notesPlaceholder} />
        </FormSection>

        <button className="submit-btn storage" onClick={handleSubmit} disabled={loading}>
          {loading ? <><span className="spinner" />{t.submitting}</> : `⬇ ${t.storageBanner}`}
        </button>
      </div>
    </div>
  );
}
