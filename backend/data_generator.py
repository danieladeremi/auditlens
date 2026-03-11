"""
Synthetic financial data generator for AuditLens.
Produces realistic company transaction and financial statement data,
with one company seeded with intentional anomalies/fraud patterns.
"""

import numpy as np
import pandas as pd
from datetime import date, timedelta
import random

COMPANIES = [
    {"id": "C001", "name": "Northfield Manufacturing", "sector": "Industrials",   "fraud": False},
    {"id": "C002", "name": "Crestview Retail Group",   "sector": "Consumer",      "fraud": False},
    {"id": "C003", "name": "Pinnacle Tech Solutions",  "sector": "Technology",    "fraud": False},
    {"id": "C004", "name": "Harborline Logistics",     "sector": "Transportation","fraud": False},
    {"id": "C005", "name": "Redstone Capital Corp",    "sector": "Finance",       "fraud": True },  # seeded fraud
]

QUARTERS = ["2022-Q1","2022-Q2","2022-Q3","2022-Q4",
            "2023-Q1","2023-Q2","2023-Q3","2023-Q4",
            "2024-Q1","2024-Q2","2024-Q3","2024-Q4"]

rng = np.random.default_rng(42)

# ── Benford's Law helpers ──────────────────────────────────────────────────────

def benford_expected():
    """Return dict of expected Benford first-digit probabilities."""
    return {d: np.log10(1 + 1/d) for d in range(1, 10)}

def draw_benford_amount(base: float, n: int) -> np.ndarray:
    """Sample n amounts whose first digits follow Benford's Law."""
    probs = list(benford_expected().values())
    digits = rng.choice(range(1, 10), size=n, p=probs)
    # Scale: first digit × random decimal expansion
    scales = rng.uniform(1.0, 9.999, size=n)
    magnitudes = rng.integers(2, 7, size=n)  # 10^2 to 10^6
    amounts = (digits / scales) * (10 ** magnitudes)
    return np.abs(amounts).round(2)

def draw_fraud_amounts(n: int) -> np.ndarray:
    """Amounts that violate Benford — over-represent digits 4-6."""
    fraud_probs = np.array([0.03, 0.04, 0.05, 0.22, 0.25, 0.22, 0.08, 0.06, 0.05])
    fraud_probs /= fraud_probs.sum()
    digits = rng.choice(range(1, 10), size=n, p=fraud_probs)
    scales = rng.uniform(1.0, 9.999, size=n)
    magnitudes = rng.integers(2, 6, size=n)
    amounts = (digits / scales) * (10 ** magnitudes)
    return np.abs(amounts).round(2)

# ── Transaction generator ──────────────────────────────────────────────────────

CATEGORIES = ["Revenue", "COGS", "SG&A", "R&D", "CapEx",
              "Accounts Payable", "Accounts Receivable", "Payroll", "Tax", "Other OpEx"]

def generate_transactions(company: dict, n: int = 800) -> pd.DataFrame:
    fraud = company["fraud"]
    start = date(2022, 1, 1)
    end   = date(2024, 12, 31)
    delta = (end - start).days

    dates = [start + timedelta(days=int(d)) for d in rng.integers(0, delta, n)]
    categories = rng.choice(CATEGORIES, size=n,
                             p=[0.25,0.18,0.12,0.07,0.06,0.08,0.08,0.07,0.05,0.04])

    if fraud:
        # 75% of transactions use fraud amounts — strong signal
        amounts = np.where(
            rng.random(n) < 0.75,
            draw_fraud_amounts(n),
            draw_benford_amount(1000, n)
        )
        # Inject a cluster of massive outlier spikes
        spike_idx = rng.choice(n, size=20, replace=False)
        amounts[spike_idx] *= rng.uniform(12, 35, size=20)
    else:
        amounts = draw_benford_amount(1000, n)

    types = np.where(np.isin(categories, ["Revenue","Accounts Receivable"]), "credit", "debit")

    df = pd.DataFrame({
        "transaction_id": [f"{company['id']}-TXN-{i:04d}" for i in range(n)],
        "company_id":     company["id"],
        "date":           dates,
        "category":       categories,
        "amount":         amounts,
        "type":           types,
    })
    df["date"] = pd.to_datetime(df["date"])
    df["quarter"] = df["date"].dt.to_period("Q").astype(str).str.replace("/","")
    return df.sort_values("date").reset_index(drop=True)

# ── Quarterly financials ───────────────────────────────────────────────────────

def generate_financials(company: dict) -> pd.DataFrame:
    fraud = company["fraud"]
    base_rev = {"Industrials":12e6,"Consumer":18e6,"Technology":22e6,
                "Transportation":9e6,"Finance":30e6}[company["sector"]]

    rows = []
    prev_revenue = base_rev
    for i, q in enumerate(QUARTERS):
        trend   = 1 + rng.normal(0.03, 0.015)            # ~3% quarterly growth
        noise   = rng.normal(1.0, 0.04)
        revenue = prev_revenue * trend * noise

        if fraud and i >= 8:                              # fraud starts in 2024
            if rng.random() < 0.6:
                revenue *= rng.uniform(1.15, 1.45)       # inflated revenue

        cogs        = revenue * rng.uniform(0.38, 0.48)
        gross       = revenue - cogs
        sga         = revenue * rng.uniform(0.12, 0.18)
        rd          = revenue * rng.uniform(0.04, 0.09)
        ebitda      = gross - sga - rd
        da          = revenue * rng.uniform(0.03, 0.06)
        ebit        = ebitda - da
        interest    = revenue * rng.uniform(0.01, 0.03)
        tax_rate    = rng.uniform(0.22, 0.27)
        ebt         = ebit - interest
        net_income  = ebt * (1 - tax_rate)

        if fraud and i >= 8 and rng.random() < 0.5:
            net_income *= rng.uniform(1.2, 1.6)          # inflated earnings too

        rows.append({
            "company_id":  company["id"],
            "quarter":     q,
            "revenue":     round(revenue, 2),
            "cogs":        round(cogs, 2),
            "gross_profit":round(gross, 2),
            "sga":         round(sga, 2),
            "rd":          round(rd, 2),
            "ebitda":      round(ebitda, 2),
            "ebit":        round(ebit, 2),
            "net_income":  round(net_income, 2),
            "gross_margin":round(gross / revenue, 4),
            "ebitda_margin":round(ebitda / revenue, 4),
            "net_margin":  round(net_income / revenue, 4),
        })
        prev_revenue = revenue

    return pd.DataFrame(rows)

# ── Public API ─────────────────────────────────────────────────────────────────

def generate_all():
    all_txn = []
    all_fin = []
    for c in COMPANIES:
        all_txn.append(generate_transactions(c))
        all_fin.append(generate_financials(c))
    return pd.concat(all_txn, ignore_index=True), pd.concat(all_fin, ignore_index=True)

COMPANY_LIST = COMPANIES
