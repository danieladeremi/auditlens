"""
Audit Risk Scoring Engine.

Aggregates signals from Benford's Law analysis and anomaly detection
into a single 0–100 risk score with component breakdown.
"""

from typing import Dict


# Component weights (must sum to 1.0)
W_BENFORD   = 0.40
W_ANOMALY   = 0.35
W_MARGIN    = 0.25


def _benford_score(benford_result: Dict) -> float:
    """0–100 risk contribution from Benford analysis."""
    if "error" in benford_result:
        return 30.0  # unknown risk if insufficient data
    verdict = benford_result["verdict"]
    p       = benford_result["p_value"]
    mad     = benford_result["mad"]

    if verdict == "PASS":
        base = 5.0
    elif verdict == "WARN":
        base = 45.0
    else:
        base = 75.0

    # MAD amplifier: unusually high MAD pushes score up
    mad_penalty = min(mad * 1000, 20.0)
    return min(base + mad_penalty, 100.0)


def _anomaly_score(anomaly_result: Dict, total_quarters: int = 12) -> float:
    """0–100 risk from anomaly count and severity."""
    if not anomaly_result or "anomalies" not in anomaly_result:
        return 0.0
    count = anomaly_result["anomaly_count"]
    if count == 0:
        return 0.0

    # Severity: average absolute pct_diff of top-5 anomalies
    top5 = sorted(anomaly_result["anomalies"],
                  key=lambda x: abs(x["pct_diff"]), reverse=True)[:5]
    avg_pct = sum(abs(a["pct_diff"]) for a in top5) / len(top5) if top5 else 0

    density_score  = min((count / (total_quarters * 3)) * 100, 50.0)
    severity_score = min(avg_pct / 2, 50.0)
    return round(density_score + severity_score, 2)


def _margin_volatility_score(financials_rows: list) -> float:
    """
    0–100 risk from margin instability.
    High quarter-over-quarter swings in gross/net margin are suspicious.
    """
    if len(financials_rows) < 3:
        return 0.0

    import numpy as np
    gross_margins = [r["gross_margin"] for r in financials_rows]
    net_margins   = [r["net_margin"]   for r in financials_rows]

    gm_diffs = np.abs(np.diff(gross_margins))
    nm_diffs = np.abs(np.diff(net_margins))

    gm_vol = float(np.mean(gm_diffs)) * 100   # as percentage points
    nm_vol = float(np.mean(nm_diffs)) * 100

    # Threshold: > 3pp swing per quarter is elevated
    score = min((gm_vol / 3) * 30 + (nm_vol / 3) * 30, 100.0)
    return round(score, 2)


def compute(benford_result: Dict, anomaly_result: Dict, financials_rows: list) -> Dict:
    """
    Compute overall audit risk score and component breakdown.

    Returns:
        overall_score   : 0–100 weighted composite
        risk_level      : LOW | MEDIUM | HIGH | CRITICAL
        components      : dict of sub-scores
        top_flags       : top 3 plain-English risk flags
    """
    b_score = _benford_score(benford_result)
    a_score = _anomaly_score(anomaly_result)
    m_score = _margin_volatility_score(financials_rows)

    overall = round(
        W_BENFORD * b_score +
        W_ANOMALY * a_score +
        W_MARGIN  * m_score,
        1
    )

    if overall < 25:
        risk_level = "LOW"
    elif overall < 50:
        risk_level = "MEDIUM"
    elif overall < 72:
        risk_level = "HIGH"
    else:
        risk_level = "CRITICAL"

    # Build top flags
    flags = []
    verdict = benford_result.get("verdict", "PASS")
    if verdict == "FAIL":
        flags.append(f"Benford's Law FAIL — first-digit distribution is statistically anomalous (p={benford_result.get('p_value','?')})")
    elif verdict == "WARN":
        flags.append(f"Benford's Law WARNING — digit distribution deviates from expected (p={benford_result.get('p_value','?')})")

    top_anomaly = (anomaly_result.get("anomalies") or [])
    if top_anomaly:
        a = top_anomaly[0]
        flags.append(f"Largest anomaly: {a['metric_label']} in {a['quarter']} was {abs(a['pct_diff'])}% {a['direction']} average")

    if m_score > 40:
        flags.append("Elevated margin volatility — significant quarter-over-quarter swings detected")

    if not flags:
        flags.append("No material audit concerns identified")

    return {
        "overall_score": overall,
        "risk_level":    risk_level,
        "components": {
            "benford":          round(b_score, 1),
            "anomaly":          round(a_score, 1),
            "margin_volatility": m_score,
        },
        "weights": {
            "benford":          W_BENFORD,
            "anomaly":          W_ANOMALY,
            "margin_volatility": W_MARGIN,
        },
        "top_flags": flags[:3],
    }
