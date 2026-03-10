import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const SETTINGS_PASSWORD = process.env.SETTINGS_PASSWORD || '8200';

// ═══════════════════════════════════════════════════════════════════════════
// SERVER-SIDE CONFIG STORE
// Seeded from defaults below. All changes via /api/config persist in memory
// and apply immediately to all connected users.
// NOTE: Restarting the server resets to defaults — set DEFAULT_CROP_YEAR in
// env vars so the year survives restarts. Other config resets are intentional
// (edit defaults below to change the seed data for your farm).
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG = {
  cropYear: process.env.DEFAULT_CROP_YEAR || String(new Date().getFullYear()),

  // Each item: { id, name, active }
  fields: [
    "Home Place - North", "Home Place - South", "River Bottom",
    "East 40", "West Quarter", "Bench Field", "Creek Field",
    "Upper Flat", "Lower Flat", "Corner Piece",
  ].map((name, i) => ({ id: `f${i}`, name, active: true })),

  storageLocations: [
    "Main Warehouse - Bay 1", "Main Warehouse - Bay 2", "Main Warehouse - Bay 3",
    "Bin 1", "Bin 2", "Bin 3", "Cellar A", "Cellar B",
    "Outside Pile - North Lot", "Outside Pile - South Lot",
  ].map((name, i) => ({ id: `s${i}`, name, active: true })),

  trucks: [
    "Semi 1", "Semi 2", "Farm Truck 1", "Farm Truck 2", "Piler Truck", "Other / Otro",
  ].map((name, i) => ({ id: `t${i}`, name, active: true })),

  buyers: [
    "Cooperative", "Local Elevator", "Direct Contract", "Processor", "Other / Otro",
  ].map((name, i) => ({ id: `b${i}`, name, active: true })),

  // Varieties keyed by commodity key
  varieties: {
    wheat:    ["WB4303", "Keldin", "Jasper", "Other / Otro"].map((name, i) => ({ id: `wv${i}`, name, active: true })),
    peas:     ["DS Admiral", "Huka", "Cargo", "Other / Otro"].map((name, i) => ({ id: `pv${i}`, name, active: true })),
    potatoes: ["Russet Burbank", "Ranger Russet", "Umatilla", "Shepody", "Other / Otro"].map((name, i) => ({ id: `ptv${i}`, name, active: true })),
    onions:   ["Vaquero", "Cometa", "Infinity", "Highlander", "Other / Otro"].map((name, i) => ({ id: `ov${i}`, name, active: true })),
  },
};

// Deep clone so we can reset to defaults if needed
let appConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

// ── Helper: generate a simple unique ID ──────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS & CONFIG API
// ═══════════════════════════════════════════════════════════════════════════

// GET full config (public — operators use this for dropdowns)
app.get('/api/config', (req, res) => {
  res.json(appConfig);
});

// POST update config (password protected)
app.post('/api/config', (req, res) => {
  const { password, patch } = req.body;
  if (password !== SETTINGS_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Incorrect password' });
  }

  // Apply partial patch — only update keys that are provided
  if (patch.cropYear !== undefined) {
    if (!/^\d{4}$/.test(patch.cropYear)) {
      return res.status(400).json({ success: false, error: 'Invalid crop year' });
    }
    appConfig.cropYear = patch.cropYear;
  }
  if (patch.fields !== undefined)           appConfig.fields = patch.fields;
  if (patch.storageLocations !== undefined) appConfig.storageLocations = patch.storageLocations;
  if (patch.trucks !== undefined)           appConfig.trucks = patch.trucks;
  if (patch.buyers !== undefined)           appConfig.buyers = patch.buyers;
  if (patch.varieties !== undefined)        appConfig.varieties = patch.varieties;

  console.log('Config updated:', Object.keys(patch).join(', '));
  res.json({ success: true, config: appConfig });
});

// Legacy /api/settings redirect (keep backward compat)
app.get('/api/settings', (req, res) => {
  res.json({ cropYear: appConfig.cropYear });
});

// ═══════════════════════════════════════════════════════════════════════════
// GOOGLE SHEETS
// ═══════════════════════════════════════════════════════════════════════════

function getAuthClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function ensureTab(sheets, spreadsheetId, tabName, headers) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = meta.data.sheets.map(s => s.properties.title);
  if (!existing.includes(tabName)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: tabName } } }] },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${tabName}'!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [headers] },
    });
  }
}

async function appendRow(spreadsheetId, tabName, headers, values) {
  const auth = await getAuthClient().getClient();
  const sheets = google.sheets({ version: 'v4', auth });
  await ensureTab(sheets, spreadsheetId, tabName, headers);
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${tabName}'!A1`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [values] },
  });
}

function nowTimestamp() {
  return new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function resolveSheetId(commodityKey, bodySheetId) {
  const envKey = `SHEET_ID_${commodityKey.toUpperCase()}`;
  return process.env[envKey] || bodySheetId;
}

// ── Harvest ──────────────────────────────────────────────────────────────────
app.post('/api/harvest', async (req, res) => {
  try {
    const { commodityKey, sheetId, field, crop, variety, certification,
            truck, operator, estimatedLoad, unit, notes } = req.body;
    const spreadsheetId = resolveSheetId(commodityKey, sheetId);
    const tabName = `${appConfig.cropYear} - ${field || 'Unknown Field'}`;
    const headers = ['Timestamp', 'Crop Year', 'Crop', 'Variety', 'Certification',
                     'Truck', 'Operator', 'Est. Load', 'Unit', 'Notes'];
    const row = [nowTimestamp(), appConfig.cropYear, crop, variety, certification,
                 truck, operator, estimatedLoad, unit, notes || ''];
    await appendRow(spreadsheetId, tabName, headers, row);
    res.json({ success: true });
  } catch (err) {
    console.error('Harvest error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Storage Intake ────────────────────────────────────────────────────────────
app.post('/api/storage', async (req, res) => {
  try {
    const { commodityKey, sheetId, field, crop, variety, certification,
            truck, storageLocation, operator, actualWeight, unit, notes } = req.body;
    const spreadsheetId = resolveSheetId(commodityKey, sheetId);
    const tabName = `${appConfig.cropYear} - IN: ${storageLocation}`;
    const headers = ['Timestamp', 'Crop Year', 'From Field', 'Crop', 'Variety', 'Certification',
                     'Truck', 'Operator', 'Actual Weight', 'Unit', 'Notes'];
    const row = [nowTimestamp(), appConfig.cropYear, field || '', crop, variety, certification,
                 truck, operator, actualWeight, unit, notes || ''];
    await appendRow(spreadsheetId, tabName, headers, row);
    res.json({ success: true });
  } catch (err) {
    console.error('Storage error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Load Out ──────────────────────────────────────────────────────────────────
app.post('/api/loadout', async (req, res) => {
  try {
    const { commodityKey, sheetId, crop, variety, certification,
            storageLocation, truck, buyer, operator, quantity, unit,
            ticketNumber, notes } = req.body;
    const spreadsheetId = resolveSheetId(commodityKey, sheetId);
    const tabName = `${appConfig.cropYear} - OUT: ${storageLocation}`;
    const headers = ['Timestamp', 'Crop Year', 'Crop', 'Variety', 'Certification',
                     'Truck', 'Buyer', 'Operator', 'Quantity', 'Unit', 'Ticket #', 'Notes'];
    const row = [nowTimestamp(), appConfig.cropYear, crop, variety, certification,
                 truck, buyer, operator, quantity, unit, ticketNumber || '', notes || ''];
    await appendRow(spreadsheetId, tabName, headers, row);
    res.json({ success: true });
  } catch (err) {
    console.error('Load out error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', cropYear: appConfig.cropYear }));

// ── Serve React build ─────────────────────────────────────────────────────────
const clientBuild = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuild));
app.get('*', (req, res) => res.sendFile(path.join(clientBuild, 'index.html')));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Harvest Tracker v3 running on port ${PORT}`));
