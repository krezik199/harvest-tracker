// ============================================================
// FARM CONFIGURATION — Edit this file each season
// ============================================================

export const FARM_CONFIG = {
  farmName: "Your Farm Name",

  // ── Fields ────────────────────────────────────────────────
  // These become individual TABS in each commodity's Google Sheet
  fields: [
    "Home Place - North",
    "Home Place - South",
    "River Bottom",
    "East 40",
    "West Quarter",
    "Bench Field",
    "Creek Field",
    "Upper Flat",
    "Lower Flat",
    "Corner Piece",
  ],

  // ── Storage Locations ─────────────────────────────────────
  // These also become individual TABS in each commodity's Google Sheet
  storageLocations: [
    "Main Warehouse - Bay 1",
    "Main Warehouse - Bay 2",
    "Main Warehouse - Bay 3",
    "Bin 1",
    "Bin 2",
    "Bin 3",
    "Cellar A",
    "Cellar B",
    "Outside Pile - North Lot",
    "Outside Pile - South Lot",
  ],

  // ── Trucks ────────────────────────────────────────────────
  trucks: [
    "Semi 1",
    "Semi 2",
    "Farm Truck 1",
    "Farm Truck 2",
    "Piler Truck",
    "Other / Otro",
  ],

  // ── Buyers (Load Out) ─────────────────────────────────────
  buyers: [
    "Cooperative",
    "Local Elevator",
    "Direct Contract",
    "Processor",
    "Other / Otro",
  ],

  // ── Commodities ───────────────────────────────────────────
  // Each commodity has:
  //   - key: used internally
  //   - label / labelEs: display name in English / Spanish
  //   - emoji: shown prominently on the home screen
  //   - color: theme color for that commodity's screens
  //   - varieties: dropdown options
  //   - sheetId: the Google Sheet ID for this commodity
  //     → Get from the URL: docs.google.com/spreadsheets/d/SHEET_ID/edit
  commodities: [
    {
      key: "wheat",
      label: "Wheat",
      labelEs: "Trigo",
      emoji: "🌾",
      color: "#B58A00",
      colorLight: "#F5E6B0",
      colorDark: "#7A5C00",
      varieties: ["WB4303", "Keldin", "Jasper", "Other / Otro"],
      sheetId: "PASTE_WHEAT_SHEET_ID_HERE",
    },
    {
      key: "peas",
      label: "Yellow Field Peas",
      labelEs: "Chícharos Amarillos",
      emoji: "🫛",
      color: "#4A8A42",
      colorLight: "#D4EDCF",
      colorDark: "#2D5A27",
      varieties: ["DS Admiral", "Huka", "Cargo", "Other / Otro"],
      sheetId: "PASTE_PEAS_SHEET_ID_HERE",
    },
    {
      key: "potatoes",
      label: "Potatoes",
      labelEs: "Papas",
      emoji: "🥔",
      color: "#8B5E3C",
      colorLight: "#F0DDD0",
      colorDark: "#5C3A20",
      varieties: ["Russet Burbank", "Ranger Russet", "Umatilla", "Shepody", "Other / Otro"],
      sheetId: "PASTE_POTATOES_SHEET_ID_HERE",
    },
    {
      key: "onions",
      label: "Onions",
      labelEs: "Cebollas",
      emoji: "🧅",
      color: "#7B3FA0",
      colorLight: "#EDD5F5",
      colorDark: "#52278A",
      varieties: ["Vaquero", "Cometa", "Infinity", "Highlander", "Other / Otro"],
      sheetId: "PASTE_ONIONS_SHEET_ID_HERE",
    },
  ],

  // ── Units ─────────────────────────────────────────────────
  units: ["Tons / Toneladas", "CWT", "Bushels", "Bags / Sacos", "Bins"],

  // ── Certifications ────────────────────────────────────────
  certifications: [
    { value: "Conventional", label: "Conventional", labelEs: "Convencional" },
    { value: "Organic", label: "Organic", labelEs: "Orgánico" },
  ],
};
