import { useState, useEffect } from 'react';
import { useLang } from '../i18n/LangContext.jsx';
import { useConfig } from '../i18n/ConfigContext.jsx';
import { FARM_CONFIG } from '../farmConfig.js';
import { getFormMemory, saveFormMemory } from '../memory.js';
import { getCommoditiesForField, getVarietiesForField } from '../assignments.js';
import {
  FormSection, FormGroup, SelectField, InputField, TextArea, CertToggle, FormTopBanner,
} from '../components/FormFields.jsx';

export default function HarvestForm({ commodity, onSuccess }) {
  const { t, lang } = useLang();
  const { config, activeNames } = useConfig();

  const mem = getFormMemory('harvest', commodity.key);

  const [form, setForm] = useState({
    field: mem.field || '',
    commodity: commodity.key,  // may change if field restricts
    variety: mem.variety || '',
    certification: mem.certification || 'Conventional',
    truck: '',
    operator: mem.operator || '',
    estimatedLoad: '',
    unit: mem.unit || '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (val) => {
    setForm(f => {
      const next = { ...f, [key]: val };
      // When field changes, check if current commodity is still valid; reset if not
      if (key === 'field') {
        const fieldItem = config?.fields?.find(fi => fi.name === val);
        const allowed = fieldItem
          ? getCommoditiesForField(fieldItem.id, config, FARM_CONFIG.commodities.filter(c =>
              config?.varieties?.[c.key]
            ))
          : FARM_CONFIG.commodities;
        const stillValid = allowed.some(c => c.key === next.commodity);
        if (!stillValid) {
          next.commodity = allowed[0]?.key || commodity.key;
          next.variety = '';
        } else {
          // Variety may no longer be valid for new field
          next.variety = '';
        }
      }
      // When commodity changes, clear variety
      if (key === 'commodity') next.variety = '';
      return next;
    });
  };

  // Derive allowed commodities for selected field
  const fieldItem = config?.fields?.find(f => f.name === form.field);
  const allCommodities = FARM_CONFIG.commodities;
  const allowedCommodities = fieldItem
    ? getCommoditiesForField(fieldItem.id, config, allCommodities)
    : allCommodities;

  // Derive allowed varieties for selected field + commodity
  const allVarieties = activeNames(config?.varieties?.[form.commodity]);
  const allowedVarieties = fieldItem
    ? getVarietiesForField(fieldItem.id, form.commodity, config, allVarieties)
    : allVarieties;

  const activeCommodity = FARM_CONFIG.commodities.find(c => c.key === form.commodity) || commodity;
  const fields = activeNames(config?.fields);
  const trucks = activeNames(config?.trucks);
  const units = config?.units || ['Tons', 'CWT', 'Bushels'];

  const handleSubmit = async () => {
    const required = ['field', 'variety', 'certification', 'truck', 'operator', 'estimatedLoad', 'unit'];
    if (required.some(k => !form[k])) { setError(t.submitError); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/harvest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commodityKey: form.commodity,
          sheetId: activeCommodity.sheetId,
          crop: lang === 'es' ? activeCommodity.labelEs : activeCommodity.label,
          field: form.field,
          variety: form.variety,
          certification: form.certification,
          truck: form.truck,
          operator: form.operator,
          estimatedLoad: form.estimatedLoad,
          unit: form.unit,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        saveFormMemory('harvest', form.commodity, form);
        onSuccess();
      } else setError(t.submitFailed);
    } catch { setError(t.networkError); }
    finally { setLoading(false); }
  };

  return (
    <div className="form-screen">
      <FormTopBanner commodity={activeCommodity} role="harvest" lang={lang} />
      <div className="form-body">
        {error && <div className="error-banner">⚠️ {error}</div>}

        <FormSection title={t.cropInfo}>
          {/* Field first — drives commodity/variety options */}
          <FormGroup label={t.field} required>
            <SelectField value={form.field} onChange={set('field')} options={fields} required />
          </FormGroup>

          {/* Commodity — filtered by field assignment */}
          {form.field && allowedCommodities.length > 1 && (
            <FormGroup label={t.crop} required>
              <div className="commodity-pill-row">
                {allowedCommodities.map(c => (
                  <button
                    key={c.key}
                    className={`commodity-pill${form.commodity === c.key ? ' active' : ''}`}
                    style={form.commodity === c.key ? { background: c.color, borderColor: c.color } : {}}
                    onClick={() => set('commodity')(c.key)}
                    type="button"
                  >
                    {c.emoji} {lang === 'es' ? c.labelEs : c.label}
                  </button>
                ))}
              </div>
            </FormGroup>
          )}

          {/* If only one commodity allowed for this field, show it as info */}
          {form.field && allowedCommodities.length === 1 && (
            <div className="assigned-commodity-badge" style={{ borderColor: allowedCommodities[0].color, background: allowedCommodities[0].colorLight }}>
              <span>{allowedCommodities[0].emoji}</span>
              <span style={{ color: allowedCommodities[0].colorDark, fontWeight: 700 }}>
                {lang === 'es' ? allowedCommodities[0].labelEs : allowedCommodities[0].label}
              </span>
              <span style={{ color: allowedCommodities[0].colorDark, opacity: 0.6, fontSize: 12 }}>
                {lang === 'es' ? '— asignado a este campo' : '— assigned to this field'}
              </span>
            </div>
          )}

          <FormGroup label={t.variety} required>
            <SelectField value={form.variety} onChange={set('variety')} options={allowedVarieties} required />
          </FormGroup>

          <FormGroup label={t.certification} required>
            <CertToggle value={form.certification} onChange={set('certification')} />
          </FormGroup>
        </FormSection>

        <FormSection title={t.loadDetails}>
          <FormGroup label={t.truck} required>
            <SelectField value={form.truck} onChange={set('truck')} options={trucks} required />
          </FormGroup>
          <div className="form-row">
            <FormGroup label={t.estimatedLoad} required>
              <InputField value={form.estimatedLoad} onChange={set('estimatedLoad')} type="number" inputMode="decimal" placeholder="0" required />
            </FormGroup>
            <FormGroup label={t.unit} required>
              <SelectField value={form.unit} onChange={set('unit')} options={units} required />
            </FormGroup>
          </div>
          <FormGroup label={t.operator} required>
            <InputField value={form.operator} onChange={set('operator')} placeholder={t.operatorPlaceholder} required />
          </FormGroup>
        </FormSection>

        <FormSection title={`${t.notesSection} (${t.optional})`}>
          <TextArea value={form.notes} onChange={set('notes')} placeholder={t.notesPlaceholder} />
        </FormSection>

        <button className="submit-btn harvest" onClick={handleSubmit} disabled={loading}>
          {loading ? <><span className="spinner" />{t.submitting}</> : `✓ ${t.harvestBanner}`}
        </button>
      </div>
    </div>
  );
}
