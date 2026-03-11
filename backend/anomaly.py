"""
Anomaly detection on quarterly financial data.
Uses Z-score (parametric) and IQR (non-parametric) methods
to flag unusual line items with plain-English explanations.
"""

import numpy as np
import pandas as pd
from typing import List, Dict


Z_THRESHOLD  = 2.5   # flag if |z| > 2.5
IQR_MULT     = 2.0   # flag if outside Q1 - 2*IQR or Q3 + 2*IQR

METRIC_LABELS = {
    "revenue":        "Revenue",
    "cogs":           "Cost of Goods Sold",
    "gross_profit":   "Gross Profit",
    "sga":            "SG&A Expenses",
    "rd":             "R&D Expenses",
    "ebitda":         "EBITDA",
    "net_income":     "Net Income",
    "gross_margin":   "Gross Margin %",
    "ebitda_margin":  "EBITDA Margin %",
    "net_margin":     "Net Margin %",
}


def _zscore_flag(series: pd.Series, quarters: pd.Series) -> List[Dict]:
    flags = []
    if len(series) < 4:
        return flags
    mean = series.mean()
    std  = series.std(ddof=1)
    if std == 0:
        return flags
    for q, val in zip(quarters, series):
        z = (val - mean) / std
        if abs(z) > Z_THRESHOLD:
            flags.append({"quarter": q, "value": val, "z_score": round(z, 2),
                          "method": "Z-Score",
                          "direction": "above" if z > 0 else "below"})
    return flags


def _iqr_flag(series: pd.Series, quarters: pd.Series) -> List[Dict]:
    flags = []
    q1, q3 = series.quantile(0.25), series.quantile(0.75)
    iqr = q3 - q1
    if iqr == 0:
        return flags
    lower = q1 - IQR_MULT * iqr
    upper = q3 + IQR_MULT * iqr
    for q, val in zip(quarters, series):
        if val < lower or val > upper:
            flags.append({"quarter": q, "value": val, "z_score": None,
                          "method": "IQR",
                          "direction": "above" if val > upper else "below"})
    return flags


def analyze(financials_df: pd.DataFrame) -> Dict:
    """
    Detect anomalies across all financial metrics for a single company.

    Returns a list of anomaly dicts with metric, quarter, value, method, explanation.
    Also returns per-metric trend data for charting.
    """
    df = financials_df.sort_values("quarter").reset_index(drop=True)
    anomalies = []
    trends = {}

    for metric, label in METRIC_LABELS.items():
        if metric not in df.columns:
            continue
        series   = df[metric].astype(float)
        quarters = df["quarter"]

        # store trend
        trends[metric] = {
            "quarters": list(quarters),
            "values":   [round(float(v), 2) for v in series],
            "label":    label,
        }

        z_flags  = _zscore_flag(series, quarters)
        iq_flags = _iqr_flag(series, quarters)

        # Deduplicate by quarter — prefer z-score flag
        seen = set()
        for flag in z_flags + iq_flags:
            k = (metric, flag["quarter"])
            if k in seen:
                continue
            seen.add(k)
            mean_val = float(series.mean())
            pct_diff = ((flag["value"] - mean_val) / abs(mean_val) * 100) if mean_val != 0 else 0
            anomalies.append({
                "metric":      metric,
                "metric_label": label,
                "quarter":     flag["quarter"],
                "value":       round(float(flag["value"]), 2),
                "mean_value":  round(mean_val, 2),
                "pct_diff":    round(pct_diff, 1),
                "z_score":     flag["z_score"],
                "method":      flag["method"],
                "direction":   flag["direction"],
                "explanation": (
                    f"{label} in {flag['quarter']} was {abs(pct_diff):.1f}% "
                    f"{flag['direction']} historical average"
                    + (f" (z={flag['z_score']})" if flag['z_score'] else "")
                ),
            })

    # Sort by absolute pct_diff descending
    anomalies.sort(key=lambda x: abs(x["pct_diff"]), reverse=True)

    return {
        "anomaly_count": len(anomalies),
        "anomalies":     anomalies,
        "trends":        trends,
    }
