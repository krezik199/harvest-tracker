# Harvest Tracker v2 — Setup & Deployment Guide

## What's New in v2
- **Bilingual** — 🇺🇸 English / 🇲🇽 Spanish toggle in the header on every screen
- **Commodity-first flow** — operators pick their crop first (Wheat / Peas / Potatoes / Onions), then their role
- **Crystal-clear role labeling** — "INTO Storage" vs "OUT of Storage" with directional arrows, distinct colors
- **4 separate Google Sheets** — one per commodity, tabs auto-created per field and storage location

---

## App Flow

```
Home → [Pick Commodity] → [Pick Role: Harvest / INTO Storage / OUT of Storage] → Form → ✅
```

---

## Step 1: Create 4 Google Sheets

Create **one Google Sheet per commodity**. Name them clearly:
- `Wheat Harvest 2025`
- `Peas Harvest 2025`
- `Potatoes Harvest 2025`
- `Onions Harvest 2025`

**Leave them blank** — the app will automatically create tabs as they're needed.
Tabs will be named like:
- `Home Place - North` (harvest entries for that field)
- `IN: Cellar A` (loads arriving into Cellar A)
- `OUT: Cellar A` (loads leaving Cellar A)

Copy the **Sheet ID** from each URL:
`https://docs.google.com/spreadsheets/d/` **THIS_IS_THE_ID** `/edit`

---

## Step 2: Set Up Google Service Account

*(Same process for all 4 sheets — one service account works for all)*

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project named "Harvest Tracker"
3. Enable **Google Sheets API**: APIs & Services → Library → Search "Sheets" → Enable
4. Create a Service Account: APIs & Services → Credentials → Create Credentials → Service Account
   - Name: `harvest-tracker`
5. Create a JSON key: Click the service account → Keys tab → Add Key → JSON → Download
6. **Share all 4 Google Sheets** with the service account email:
   - Open each sheet → Share → paste the service account email (e.g. `harvest-tracker@your-project.iam.gserviceaccount.com`)
   - Give it **Editor** access on each sheet

---

## Step 3: Customize Your Farm

Edit `client/src/farmConfig.js`:

- **`fields`** — your actual field names (these become tabs in each sheet)
- **`storageLocations`** — your bins, bays, cellars (also become tabs)
- **`trucks`** — your equipment IDs
- **`buyers`** — your common buyers
- **`commodities[].varieties`** — update varieties for each crop
- **`commodities[].sheetId`** — paste each commodity's Sheet ID here (as backup)

---

## Step 4: Push to GitHub

```bash
cd harvest-app
git init
git add .
git commit -m "Harvest Tracker v2 - bilingual, commodity-first"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/harvest-tracker.git
git push -u origin main
```

---

## Step 5: Deploy on Render

1. Log into [render.com](https://render.com)
2. New → Web Service → connect your GitHub repo
3. Settings:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. Add Environment Variables:

| Key | Value |
|-----|-------|
| `SHEET_ID_WHEAT` | Your Wheat sheet ID |
| `SHEET_ID_PEAS` | Your Peas sheet ID |
| `SHEET_ID_POTATOES` | Your Potatoes sheet ID |
| `SHEET_ID_ONIONS` | Your Onions sheet ID |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Paste entire contents of the downloaded JSON key file (minified to one line) |

5. Deploy — takes 3–5 minutes. You'll get a URL like `https://harvest-tracker.onrender.com`

---

## Sharing With Your Team

**One URL for everyone.** Operators:
1. Open the URL
2. Tap 🇲🇽 or 🇺🇸 to set their language
3. Tap their commodity
4. Tap their role (Harvest / INTO Storage / OUT of Storage)
5. Fill out the form

**Add to phone home screen (iPhone):**
- Open URL in Safari → Share → "Add to Home Screen" → "Add"

**Add to phone home screen (Android):**
- Open URL in Chrome → Menu (⋮) → "Add to Home screen"

---

## How the Google Sheets Get Organized

For each commodity (e.g. **Potatoes**), the sheet will look like this:

| Tab Name | Contents |
|----------|----------|
| `Home Place - North` | Harvest loads from that field |
| `River Bottom` | Harvest loads from that field |
| `IN: Cellar A` | Loads arriving into Cellar A |
| `IN: Cellar B` | Loads arriving into Cellar B |
| `OUT: Cellar A` | Loads leaving Cellar A for sale |
| `OUT: Cellar B` | Loads leaving Cellar B for sale |

Tabs are **created automatically** the first time a form is submitted for that location — no setup needed.

---

## Updating the App

All farm-specific data is in one file: `client/src/farmConfig.js`

```bash
# After editing farmConfig.js:
git add client/src/farmConfig.js
git commit -m "Update field list for 2026 season"
git push
# Render auto-deploys in ~2 minutes
```

---

## Adding a Language

Translations live in `client/src/i18n/translations.js`. Each key has an `en` and `es` version. To add another language, duplicate the `es` block with a new key (e.g. `ru`) and add a flag button in `App.jsx`.

---

## Troubleshooting

**"Network error" when submitting:**
- Render free tier sleeps after 15 min of inactivity — first submission after sleep takes ~30 seconds to wake up. Try again.

**Data not appearing in sheet:**
- Confirm the service account has Editor access on that specific sheet
- Check Render logs: Dashboard → your service → Logs

**Tab not being created:**
- Sheet IDs must match exactly — no extra spaces
- Service account must have Editor (not just Viewer) access
