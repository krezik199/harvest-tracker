// Given a field/storage item ID and the full config, return:
// - which commodity keys are allowed (empty = all)
// - which varieties are allowed per commodity (empty = all active)

export function getCommoditiesForField(fieldId, config, allCommodities) {
  const assignments = config?.fieldAssignments?.[fieldId];
  if (!assignments || Object.keys(assignments).length === 0) {
    // No restrictions — return all active commodities
    return allCommodities;
  }
  return allCommodities.filter(c => assignments[c.key] !== undefined);
}

export function getCommoditiesForStorage(storageId, config, allCommodities) {
  const assignments = config?.storageAssignments?.[storageId];
  if (!assignments || Object.keys(assignments).length === 0) {
    return allCommodities;
  }
  return allCommodities.filter(c => assignments[c.key] !== undefined);
}

export function getVarietiesForField(fieldId, commodityKey, config, allVarieties) {
  const assignments = config?.fieldAssignments?.[fieldId];
  if (!assignments || !assignments[commodityKey] || assignments[commodityKey].length === 0) {
    return allVarieties; // No restriction — show all active varieties
  }
  return allVarieties.filter(v => assignments[commodityKey].includes(v));
}

export function getVarietiesForStorage(storageId, commodityKey, config, allVarieties) {
  const assignments = config?.storageAssignments?.[storageId];
  if (!assignments || !assignments[commodityKey] || assignments[commodityKey].length === 0) {
    return allVarieties;
  }
  return allVarieties.filter(v => assignments[commodityKey].includes(v));
}
