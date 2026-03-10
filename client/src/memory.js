// Per-device memory — remembers last selections in localStorage
// Truck is intentionally excluded (always needs fresh selection)

const MEMORY_KEY = 'harvest_tracker_memory';

function loadMemory() {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMemory(data) {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(data));
  } catch {}
}

// Get all remembered values
export function getMemory() {
  return loadMemory();
}

// Remember a set of values (merged with existing)
export function rememberValues(values) {
  const current = loadMemory();
  saveMemory({ ...current, ...values });
}

// Get the last-used values for a specific form + commodity
// Returns an object with remembered field values
export function getFormMemory(formType, commodityKey) {
  const mem = loadMemory();
  return {
    // Global (shared across forms)
    operator: mem.operator || '',
    certification: mem.certification || 'Conventional',
    unit: mem.unit || '',
    // Per-commodity
    variety: mem[`variety_${commodityKey}`] || '',
    // Per-form
    field: formType === 'harvest' ? (mem[`field_${commodityKey}`] || '') : '',
    storageLocation: (formType === 'storage' || formType === 'loadout')
      ? (mem[`storage_${commodityKey}`] || '') : '',
    buyer: formType === 'loadout' ? (mem.buyer || '') : '',
  };
}

// Save form values after successful submission
export function saveFormMemory(formType, commodityKey, values) {
  const patch = {};
  if (values.operator)    patch.operator = values.operator;
  if (values.certification) patch.certification = values.certification;
  if (values.unit)        patch.unit = values.unit;
  if (values.variety)     patch[`variety_${commodityKey}`] = values.variety;
  if (values.field && formType === 'harvest')
    patch[`field_${commodityKey}`] = values.field;
  if (values.storageLocation && (formType === 'storage' || formType === 'loadout'))
    patch[`storage_${commodityKey}`] = values.storageLocation;
  if (values.buyer && formType === 'loadout')
    patch.buyer = values.buyer;

  rememberValues(patch);
}
