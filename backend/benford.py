"""
Benford's Law analysis module.
Tests whether the first-digit distribution of a transaction set
conforms to Benford's Law using chi-squared goodness-of-fit.
"""

import numpy as np
import pandas as pd
from scipy import stats


def get_first_digit(amounts: pd.Series) -> pd.Series:
    """Extract leading digit from each amount."""
    return amounts.abs().astype(str).str.lstrip("0").str[0].astype(int)


def benford_expected_probs() -> dict:
    return {d: np.log10(1 + 1 / d) for d in range(1, 10)}


def analyze(transactions_df: pd.DataFrame) -> dict:
    """
    Run Benford's Law analysis on a set of transactions.

    Returns:
        digits        : list of digit labels [1..9]
        observed_pct  : observed frequency % per digit
        expected_pct  : Benford expected % per digit
        chi2_stat     : chi-squared statistic
        p_value       : p-value (low = suspicious)
        verdict       : "PASS" | "WARN" | "FAIL"
        sample_size   : number of transactions analysed
    """
    amounts = transactions_df["amount"].dropna()
    amounts = amounts[amounts > 0]

    if len(amounts) < 30:
        return {"error": "Insufficient transactions for Benford analysis (need ≥ 30)"}

    first_digits = get_first_digit(amounts)
    observed_counts = first_digits.value_counts().reindex(range(1, 10), fill_value=0)

    n = len(amounts)
    expected_probs = benford_expected_probs()
    expected_counts = np.array([expected_probs[d] * n for d in range(1, 10)])
    observed_array  = observed_counts.values.astype(float)

    # Chi-squared goodness-of-fit (8 dof)
    chi2_stat, p_value = stats.chisquare(f_obs=observed_array, f_exp=expected_counts)

    # Mean Absolute Deviation from Benford
    obs_pct = observed_array / n
    exp_pct = np.array([expected_probs[d] for d in range(1, 10)])
    mad = float(np.mean(np.abs(obs_pct - exp_pct)))

    # Verdict thresholds (conservative audit-style)
    if p_value >= 0.05:
        verdict = "PASS"
    elif p_value >= 0.01:
        verdict = "WARN"
    else:
        verdict = "FAIL"

    return {
        "digits":        list(range(1, 10)),
        "observed_pct":  [round(float(v) * 100, 2) for v in obs_pct],
        "expected_pct":  [round(float(v) * 100, 2) for v in exp_pct],
        "chi2_stat":     round(float(chi2_stat), 3),
        "p_value":       round(float(p_value), 4),
        "mad":           round(mad, 5),
        "verdict":       verdict,
        "sample_size":   int(n),
    }
