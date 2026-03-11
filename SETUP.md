# AuditLens — Setup Guide

## Prerequisites
- Python 3.10+ installed
- Node.js 18+ installed
- VS Code (or any terminal)

---

## Step 1 — Backend (PowerShell)

Open a terminal in the `auditlens` folder, then run each line separately:

```powershell
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The API will start at: http://localhost:8000
The database seeds automatically on first run (~4,000 transactions).

Leave this terminal running and open a **second terminal** for the frontend.

---

## Step 2 — Frontend (second PowerShell window)

```powershell
cd frontend
npm install
npm run dev
```

The app will open at: http://localhost:5173

---

## Troubleshooting

**"pip is not recognized"** → use `python -m pip install -r requirements.txt`

**"npm is not recognized"** → install Node.js from https://nodejs.org

**Port already in use** → change backend port: `uvicorn main:app --reload --port 8001`
then update `vite.config.js` proxy target to `http://localhost:8001`

**PowerShell execution policy error:**
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```
