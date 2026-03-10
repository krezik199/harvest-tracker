import { useState } from 'react';
import { useLang } from '../i18n/LangContext.jsx';
import { useConfig } from '../i18n/ConfigContext.jsx';
import { FARM_CONFIG } from '../farmConfig.js';
import { getFormMemory, saveFormMemory } from '../memory.js';
import { getCommoditiesForStorage, getVarietiesForStorage } from '../assignments.js';
import {
  FormSection, FormGroup, SelectField, InputField, TextArea, CertToggle, FormTopBanner,
} from '../components/FormFields.jsx';

export default function LoadOutForm({ commodity, onSuccess }) {
  const { t, lang } = useLang();
  const { config, activeNames } = useConfig();

  const mem = getFormMemory('loadout', commodity.key);

  const [form, setForm] = useState({
    storageLocation: mem.storageLocation || '',
    commodity: commodity.key,
    variety: mem.variety || '',
    certification: mem.certification || 'Conventional',
    truck: '',
    buyer: mem.buyer || '',
    operator: mem.operator || '',
    quantity: '',
    unit: mem.unit || '',
    ticketNumber: '',
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
  const storageLocations = activeNames(config?.storageLocations);
  const trucks = activeNames(config?.trucks);
  const buyers = activeNames(config?.buyers);
  const units = config?.units || ['Tons', 'CWT', 'Bushels'];

  const handleSubmit = async () => {
    const required = ['storageLocation', 'variety', 'certification', 'truck', 'buyer', 'operator', 'quantity', 'unit'];
    if (required.some(k => !form[k])) { setError(t.submitError); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/loadout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commodityKey: form.commodity,
          sheetId: activeCommodity.sheetId,
          crop: lang === 'es' ? activeCommodity.labelEs : activeCommodity.label,
          variety: form.variety, certification: form.certification,
          storageLocation: form.storageLocation, truck: form.truck,
          buyer: form.buyer, operator: form.operator,
          quantity: form.quantity, unit: form.unit,
          ticketNumber: form.ticketNumber, notes: form.notes,
        }),
      });
      const data = await res.json();
      if (data.success) { saveFormMemory('loadout', form.commodity, form); onSuccess(); }
      else setError(t.submitFailed);
    } catch { setError(t.networkError); }
    finally { setLoading(false); }
  };

  return (
    <div className="form-screen">
      <FormTopBanner commodity={activeCommodity} role="loadout" lang={lang} />
      <div className="form-body">
        {error && <div className="error-banner">⚠️ {error}</div>}

        <FormSection title={t.loadDetails}>
          <FormGroup label={t.storageLocation} required>
            <SelectField value={form.storageLocation} onChange={set('storageLocation')} options={storageLocations} required />
          </FormGroup>

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
          <FormGroup label={t.buyer} required>
            <SelectField value={form.buyer} onChange={set('buyer')} options={buyers} required />
          </FormGroup>
          <div className="form-row">
            <FormGroup label={t.quantity} required>
              <InputField value={form.quantity} onChange={set('quantity')} type="number" inputMode="decimal" placeholder="0" required />
            </FormGroup>
            <FormGroup label={t.unit} required>
              <SelectField value={form.unit} onChange={set('unit')} options={units} required />
            </FormGroup>
          </div>
          <FormGroup label={`${t.ticketNumber} (${t.optional})`}>
            <InputField value={form.ticketNumber} onChange={set('ticketNumber')} placeholder={t.ticketPlaceholder} inputMode="numeric" />
          </FormGroup>
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
        </FormSection>

        <FormSection title={`${t.notesSection} (${t.optional})`}>
          <TextArea value={form.notes} onChange={set('notes')} placeholder={t.notesPlaceholder} />
        </FormSection>

        <button className="submit-btn loadout" onClick={handleSubmit} disabled={loading}>
          {loading ? <><span className="spinner" />{t.submitting}</> : `⬆ ${t.loadoutBanner}`}
        </button>
      </div>
    </div>
  );
}
