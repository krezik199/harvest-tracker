import { useState } from 'react';
import { useLang } from '../i18n/LangContext.jsx';
import { useConfig } from '../i18n/ConfigContext.jsx';
import {
  FormSection, FormGroup, SelectField, InputField, TextArea, CertToggle, FormTopBanner,
} from '../components/FormFields.jsx';

export default function StorageForm({ commodity, onSuccess }) {
  const { t, lang } = useLang();
  const { config, activeNames } = useConfig();
  const [form, setForm] = useState({
    field: '', variety: '', certification: 'Conventional',
    truck: '', storageLocation: '', operator: '', actualWeight: '', unit: '', notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const units = config?.units || ['Tons', 'CWT', 'Bushels'];
  const fields = activeNames(config?.fields);
  const trucks = activeNames(config?.trucks);
  const storageLocations = activeNames(config?.storageLocations);
  const varieties = activeNames(config?.varieties?.[commodity.key]);

  const handleSubmit = async () => {
    const required = ['variety', 'certification', 'truck', 'storageLocation', 'operator', 'actualWeight', 'unit'];
    if (required.some((k) => !form[k])) { setError(t.submitError); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commodityKey: commodity.key,
          sheetId: commodity.sheetId,
          crop: lang === 'es' ? commodity.labelEs : commodity.label,
          ...form,
        }),
      });
      const data = await res.json();
      if (data.success) onSuccess(); else setError(t.submitFailed);
    } catch { setError(t.networkError); }
    finally { setLoading(false); }
  };

  return (
    <div className="form-screen">
      <FormTopBanner commodity={commodity} role="storage" lang={lang} />
      <div className="form-body">
        {error && <div className="error-banner">⚠️ {error}</div>}
        <FormSection title={t.cropInfo}>
          <FormGroup label={t.fieldOptional}>
            <SelectField value={form.field} onChange={set('field')} options={fields} />
          </FormGroup>
          <FormGroup label={t.variety} required>
            <SelectField value={form.variety} onChange={set('variety')} options={varieties} required />
          </FormGroup>
          <FormGroup label={t.certification} required>
            <CertToggle value={form.certification} onChange={set('certification')} />
          </FormGroup>
        </FormSection>
        <FormSection title={t.loadDetails}>
          <FormGroup label={t.truck} required>
            <SelectField value={form.truck} onChange={set('truck')} options={trucks} required />
          </FormGroup>
          <FormGroup label={t.storageLocation} required>
            <SelectField value={form.storageLocation} onChange={set('storageLocation')} options={storageLocations} required />
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
