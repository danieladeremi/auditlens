"""
AuditLens — FastAPI Backend
Exposes REST endpoints for the React frontend.
"""

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import pandas as pd

from database import get_db, init_db, Transaction, Financials
from data_generator import COMPANY_LIST
import benford
import anomaly
import risk_engine

app = FastAPI(title="AuditLens API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


@app.get("/api/companies")
def list_companies():
    return [
        {"id": c["id"], "name": c["name"], "sector": c["sector"]}
        for c in COMPANY_LIST
    ]


@app.get("/api/companies/summary")
def all_company_summaries(db: Session = Depends(get_db)):
    results = []
    for c in COMPANY_LIST:
        cid = c["id"]

        txn_rows = db.query(Transaction).filter(Transaction.company_id == cid).all()
        fin_rows = db.query(Financials).filter(Financials.company_id == cid).order_by(Financials.quarter).all()

        if not txn_rows or not fin_rows:
            continue

        txn_df = pd.DataFrame([{"amount": t.amount} for t in txn_rows])
        fin_dicts = [{
            "quarter": f.quarter, "revenue": f.revenue, "cogs": f.cogs,
            "gross_profit": f.gross_profit, "sga": f.sga, "rd": f.rd,
            "ebitda": f.ebitda, "ebit": f.ebit, "net_income": f.net_income,
            "gross_margin": f.gross_margin, "ebitda_margin": f.ebitda_margin,
            "net_margin": f.net_margin,
        } for f in fin_rows]
        fin_df = pd.DataFrame(fin_dicts)

        b_result = benford.analyze(txn_df)
        a_result = anomaly.analyze(fin_df)
        r_result = risk_engine.compute(b_result, a_result, fin_dicts)

        latest_rev = fin_dicts[-1]["revenue"] if fin_dicts else 0

        results.append({
            "id":              cid,
            "name":            c["name"],
            "sector":          c["sector"],
            "risk_score":      r_result["overall_score"],
            "risk_level":      r_result["risk_level"],
            "anomaly_count":   a_result["anomaly_count"],
            "benford_verdict": b_result.get("verdict", "N/A"),
            "latest_revenue":  round(latest_rev, 2),
            "top_flags":       r_result["top_flags"],
        })

    results.sort(key=lambda x: x["risk_score"], reverse=True)
    return results


@app.get("/api/companies/{company_id}/benford")
def company_benford(company_id: str, db: Session = Depends(get_db)):
    txn_rows = db.query(Transaction).filter(Transaction.company_id == company_id).all()
    if not txn_rows:
        raise HTTPException(status_code=404, detail="Company not found")
    txn_df = pd.DataFrame([{"amount": t.amount} for t in txn_rows])
    return benford.analyze(txn_df)


@app.get("/api/companies/{company_id}/anomalies")
def company_anomalies(company_id: str, db: Session = Depends(get_db)):
    fin_rows = db.query(Financials).filter(
        Financials.company_id == company_id
    ).order_by(Financials.quarter).all()
    if not fin_rows:
        raise HTTPException(status_code=404, detail="Company not found")
    fin_df = pd.DataFrame([{
        "quarter": f.quarter, "revenue": f.revenue, "cogs": f.cogs,
        "gross_profit": f.gross_profit, "sga": f.sga, "rd": f.rd,
        "ebitda": f.ebitda, "ebit": f.ebit, "net_income": f.net_income,
        "gross_margin": f.gross_margin, "ebitda_margin": f.ebitda_margin,
        "net_margin": f.net_margin,
    } for f in fin_rows])
    return anomaly.analyze(fin_df)


@app.get("/api/companies/{company_id}/risk")
def company_risk(company_id: str, db: Session = Depends(get_db)):
    txn_rows = db.query(Transaction).filter(Transaction.company_id == company_id).all()
    fin_rows = db.query(Financials).filter(
        Financials.company_id == company_id
    ).order_by(Financials.quarter).all()
    if not txn_rows or not fin_rows:
        raise HTTPException(status_code=404, detail="Company not found")

    txn_df = pd.DataFrame([{"amount": t.amount} for t in txn_rows])
    fin_dicts = [{
        "quarter": f.quarter, "revenue": f.revenue, "cogs": f.cogs,
        "gross_profit": f.gross_profit, "sga": f.sga, "rd": f.rd,
        "ebitda": f.ebitda, "ebit": f.ebit, "net_income": f.net_income,
        "gross_margin": f.gross_margin, "ebitda_margin": f.ebitda_margin,
        "net_margin": f.net_margin,
    } for f in fin_rows]
    fin_df = pd.DataFrame(fin_dicts)

    b_result = benford.analyze(txn_df)
    a_result = anomaly.analyze(fin_df)
    return risk_engine.compute(b_result, a_result, fin_dicts)


@app.get("/api/companies/{company_id}/financials")
def company_financials(company_id: str, db: Session = Depends(get_db)):
    fin_rows = db.query(Financials).filter(
        Financials.company_id == company_id
    ).order_by(Financials.quarter).all()
    if not fin_rows:
        raise HTTPException(status_code=404, detail="Company not found")
    return [{
        "quarter": f.quarter, "revenue": f.revenue, "cogs": f.cogs,
        "gross_profit": f.gross_profit, "sga": f.sga, "rd": f.rd,
        "ebitda": f.ebitda, "net_income": f.net_income,
        "gross_margin": round(f.gross_margin * 100, 2),
        "ebitda_margin": round(f.ebitda_margin * 100, 2),
        "net_margin": round(f.net_margin * 100, 2),
    } for f in fin_rows]


@app.get("/api/companies/{company_id}/transactions/summary")
def company_txn_summary(company_id: str, db: Session = Depends(get_db)):
    txn_rows = db.query(Transaction).filter(Transaction.company_id == company_id).all()
    if not txn_rows:
        raise HTTPException(status_code=404, detail="Company not found")
    df = pd.DataFrame([{"category": t.category, "amount": t.amount} for t in txn_rows])
    by_cat = df.groupby("category")["amount"].agg(["sum","count","mean"]).reset_index()
    by_cat.columns = ["category","total","count","avg"]
    return by_cat.sort_values("total", ascending=False).round(2).to_dict(orient="records")
