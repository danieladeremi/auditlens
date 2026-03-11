# AuditLens — Financial Anomaly & Audit Risk Intelligence Platform

A full-stack web application that applies real forensic accounting techniques
to detect financial statement anomalies and score audit risk across a portfolio
of companies.

## What It Does

AuditLens ingests financial transaction and statement data, then runs three
analytical engines:

1. **Benford's Law Analysis** — Tests whether leading-digit distributions in
   transaction data conform to the natural Benford distribution. Significant
   deviation is a well-established forensic indicator of data manipulation,
   used by auditors at firms like KPMG and Deloitte.

2. **Anomaly Detection** — Applies Z-Score (parametric) and IQR
   (non-parametric) outlier detection across 10 quarterly financial metrics
   (revenue, COGS, gross/EBITDA/net margins, etc.) to flag unusual movements
   with plain-English explanations.

3. **Audit Risk Scoring** — Aggregates the above signals into a 0–100
   composite risk score with weighted components and actionable findings.

## Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Backend   | Python 3.11 · FastAPI · SQLAlchemy  |
| Database  | SQLite (auto-seeded on startup)     |
| Analysis  | pandas · numpy · scipy              |
| Frontend  | React 18 · Recharts · Tailwind CSS  |

## Project Structure

```
auditlens/
├── backend/
│   ├── main.py            # FastAPI app + REST routes
│   ├── data_generator.py  # Synthetic financial data (reproducible, seeded)
│   ├── benford.py         # Benford's Law chi-squared analysis
│   ├── anomaly.py         # Z-Score + IQR outlier detection
│   ├── risk_engine.py     # Composite risk scoring
│   ├── database.py        # SQLite + SQLAlchemy ORM
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── api/client.js
    │   └── components/
    │       ├── Sidebar.jsx
    │       ├── RiskScoreCard.jsx    # Gauge + component breakdown
    │       ├── BenfordChart.jsx     # Bar chart with chi² stats
    │       ├── AnomalyTable.jsx     # Sortable findings table
    │       ├── TrendChart.jsx       # Time-series with anomaly dots
    │       └── CompanyComparison.jsx # Portfolio heatmap
    └── package.json
```

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# API runs on http://localhost:8000
# DB auto-seeds on first startup (~4,000 transactions, 60 quarterly statements)
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

## Demo Data

Five synthetic companies spanning 2022–2024 (12 quarters each):

| Company                 | Sector         | Expected Finding |
|-------------------------|----------------|------------------|
| Northfield Manufacturing| Industrials    | Low risk         |
| Crestview Retail Group  | Consumer       | Low risk         |
| Pinnacle Tech Solutions | Technology     | Low risk         |
| Harborline Logistics    | Transportation | Medium risk      |
| **Redstone Capital Corp** | Finance     | **CRITICAL** — seeded fraud patterns |

Redstone Capital is seeded with Benford-violating transaction amounts and
inflated revenue/earnings in 2024, producing a CRITICAL risk score and a
Benford FAIL with p ≈ 0.000.

## API Endpoints

| Method | Endpoint                                        | Description              |
|--------|-------------------------------------------------|--------------------------|
| GET    | `/api/companies`                                | List all companies       |
| GET    | `/api/companies/summary`                        | Risk scores for all      |
| GET    | `/api/companies/{id}/benford`                   | Benford analysis         |
| GET    | `/api/companies/{id}/anomalies`                 | Anomaly detection result |
| GET    | `/api/companies/{id}/risk`                      | Composite risk score     |
| GET    | `/api/companies/{id}/financials`                | Quarterly P&L data       |
| GET    | `/api/companies/{id}/transactions/summary`      | Category breakdown       |

## Technical Notes

- **Benford's Law**: Chi-squared goodness-of-fit (8 degrees of freedom).
  PASS: p ≥ 0.05, WARN: 0.01 ≤ p < 0.05, FAIL: p < 0.01.
- **Z-Score threshold**: |z| > 2.5 (conservative for audit context).
- **IQR multiplier**: 2.0× (outside Q1 − 2·IQR or Q3 + 2·IQR).
- **Risk weights**: Benford 40%, Anomaly 35%, Margin Volatility 25%.
