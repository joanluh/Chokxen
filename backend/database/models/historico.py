from datetime import datetime
from sqlalchemy import Column, Integer, String, Date, DateTime, JSON, UniqueConstraint
from database.connection import Base

class ResultadoHistorico(Base):
    __tablename__ = 'resultados_historicos'
    __table_args__ = (UniqueConstraint('league_id', 'event_id', name='uq_historico_espn'),)
    id = Column(Integer, primary_key=True)
    league_id = Column(String(100), nullable=False, index=True)
    event_id = Column(String(40), nullable=False)
    kickoff = Column(DateTime, nullable=False, index=True)  # UTC sin tz para MySQL/SQLite.
    local_day = Column(Date, nullable=False, index=True)
    home_id = Column(String(40), nullable=False, index=True)
    away_id = Column(String(40), nullable=False, index=True)
    home = Column(String(200), nullable=False)
    away = Column(String(200), nullable=False)
    home_score = Column(Integer, nullable=False)
    away_score = Column(Integer, nullable=False)
    logos = Column(JSON, nullable=False)
    venue = Column(String(250))
    scoreboard = Column(JSON, nullable=False)
    summary = Column(JSON)
    statistics_state = Column(String(30), nullable=False, default='pending')
    fetched_at = Column(DateTime, nullable=False, default=datetime.utcnow)

class ImportacionHistorica(Base):
    __tablename__ = 'importaciones_historicas'
    id = Column(String(36), primary_key=True)
    # Una sola importación activa por BD, incluidos procesos CLI concurrentes.
    active_slot = Column(Integer, unique=True, nullable=True)
    status = Column(String(30), nullable=False, default='pending')
    leagues = Column(JSON, nullable=False)
    start = Column(Date, nullable=False)
    end = Column(Date, nullable=False)
    days_done = Column(Integer, nullable=False, default=0)
    days_total = Column(Integer, nullable=False)
    imported = Column(Integer, nullable=False, default=0)
    updated = Column(Integer, nullable=False, default=0)
    errors = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    finished_at = Column(DateTime)
