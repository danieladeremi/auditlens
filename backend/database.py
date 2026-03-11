"""
SQLite database setup using SQLAlchemy.
Seeds data on first run from the synthetic data generator.
"""

import os
from sqlalchemy import create_engine, Column, String, Float, Integer, Date, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

DB_PATH = os.path.join(os.path.dirname(__file__), "auditlens.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = Engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class Transaction(Base):
    __tablename__ = "transactions"
    transaction_id = Column(String, primary_key=True)
    company_id     = Column(String, index=True)
    date           = Column(String)
    category       = Column(String)
    amount         = Column(Float)
    type           = Column(String)
    quarter        = Column(String)


class Financials(Base):
    __tablename__ = "financials"
    id             = Column(Integer, primary_key=True, autoincrement=True)
    company_id     = Column(String, index=True)
    quarter        = Column(String)
    revenue        = Column(Float)
    cogs           = Column(Float)
    gross_profit   = Column(Float)
    sga            = Column(Float)
    rd             = Column(Float)
    ebitda         = Column(Float)
    ebit           = Column(Float)
    net_income     = Column(Float)
    gross_margin   = Column(Float)
    ebitda_margin  = Column(Float)
    net_margin     = Column(Float)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create tables and seed synthetic data if DB is fresh."""
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        count = db.execute(text("SELECT COUNT(*) FROM transactions")).scalar()
        if count and count > 0:
            return  # already seeded

    from data_generator import generate_all, COMPANY_LIST
    txn_df, fin_df = generate_all()

    with SessionLocal() as db:
        # Seed transactions
        txn_records = txn_df.to_dict(orient="records")
        for rec in txn_records:
            rec["date"] = str(rec["date"])[:10]
            db.add(Transaction(**rec))

        # Seed financials
        fin_records = fin_df.to_dict(orient="records")
        for rec in fin_records:
            db.add(Financials(**rec))

        db.commit()

    print(f"[DB] Seeded {len(txn_records)} transactions and {len(fin_records)} financial records.")
