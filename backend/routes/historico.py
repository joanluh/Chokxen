from datetime import date, datetime, timezone
from typing import Annotated
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from pydantic import BaseModel, Field, model_validator
from sqlalchemy import or_
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models.historico import ResultadoHistorico, ImportacionHistorica
from dependencies.roles import requireAdmin
from dependencies.auth import getCurrentUser
from services.espn_history import CATALOG, ZONE
from services.history_store import enqueue, run_import

router = APIRouter()

class ImportRequest(BaseModel):
    leagues: list[str] = Field(min_length=1, max_length=20)
    start: date
    end: date

    @model_validator(mode='after')
    def validate_range(self):
        self.leagues = list(dict.fromkeys(self.leagues))
        days = (self.end - self.start).days + 1
        if not 1 <= days <= 31 or days * len(self.leagues) > 93:
            raise ValueError('Usa hasta 31 días y 93 días-liga por importación; divide rangos mayores.')
        if self.start < date(2000, 1, 1) or self.end > datetime.now(ZONE).date():
            raise ValueError('Elige fechas desde 2000 hasta hoy. La disponibilidad depende de ESPN.')
        if any(league not in CATALOG for league in self.leagues):
            raise ValueError('Liga no admitida.')
        return self

def filters(db, league, start, end, team):
    if league and league not in CATALOG:
        raise HTTPException(422, 'Liga no admitida.')
    if start and end and start > end:
        raise HTTPException(422, 'La fecha inicial debe preceder a la final.')
    query = db.query(ResultadoHistorico)
    if league:
        query = query.filter_by(league_id=league)
    if start:
        query = query.filter(ResultadoHistorico.local_day >= start)
    if end:
        query = query.filter(ResultadoHistorico.local_day <= end)
    if team:
        # Búsqueda literal sin comodines elegidos por el usuario.
        query = query.filter(or_(ResultadoHistorico.home.contains(team, autoescape=True), ResultadoHistorico.away.contains(team, autoescape=True)))
    return query

def match(row):
    info = CATALOG[row.league_id]
    return {'id': f'espn:{row.event_id}', 'eventId': row.event_id, 'sportPath': row.league_id,
            'sport': info['sport'], 'league': info['name'], 'source': 'ESPN', 'storage': 'BD',
            'home': row.home, 'away': row.away, 'teamIds': [row.home_id, row.away_id],
            'logos': row.logos, 'goals': [row.home_score, row.away_score], 'status': 'Finalizado',
            'kickoff': row.kickoff.isoformat()+'Z', 'day': row.local_day.isoformat(),
            'time': row.local_day.strftime('%d/%m/%Y'), 'venue': row.venue,
            'statisticsState': row.statistics_state, 'savedAt': row.fetched_at.isoformat()+'Z'}

def progress(job):
    return {name: getattr(job, name) for name in ('id', 'status', 'leagues', 'start', 'end', 'days_done', 'days_total', 'imported', 'updated', 'errors', 'created_at', 'finished_at')}

@router.get('/ligas')
def leagues():
    return list(CATALOG.values())

@router.get('/partidos')
def results(league: str | None = None, start: date | None = None, end: date | None = None,
            team: str = Query('', max_length=100), offset: int = Query(0, ge=0), limit: int = Query(30, ge=1, le=100), db: Session = Depends(get_db)):
    query = filters(db, league, start, end, team)
    return {'total': query.count(), 'offset': offset, 'limit': limit,
            'matches': [match(row) for row in query.order_by(ResultadoHistorico.kickoff.desc(), ResultadoHistorico.id.desc()).offset(offset).limit(limit)]}

@router.get('/partidos/{event_id}')
def detail(event_id: str, league: str, db: Session = Depends(get_db)):
    row = filters(db, league, None, None, '').filter_by(event_id=event_id).first()
    if row is None:
        raise HTTPException(404, 'Ese partido todavía no está guardado.')
    return {**match(row), 'storedSummary': row.summary}

@router.post('/importaciones', status_code=202)
def import_results(body: ImportRequest, tasks: BackgroundTasks, user: dict = Depends(requireAdmin), db: Session = Depends(get_db)):
    try:
        job = enqueue(db, body.leagues, body.start, body.end)
    except ValueError as exc:
        raise HTTPException(409, str(exc))
    tasks.add_task(run_import, job.id)
    return progress(job)

@router.get('/importaciones/{job_id}')
def import_status(job_id: str, user: dict = Depends(requireAdmin), db: Session = Depends(get_db)):
    job = db.get(ImportacionHistorica, job_id)
    if job is None:
        raise HTTPException(404, 'Importación no encontrada.')
    return progress(job)

@router.get('/dataset')
def dataset(league: str | None = None, start: date | None = None, end: date | None = None,
            team: str = Query('', max_length=100),
            offset: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500),
            user: dict = Depends(getCurrentUser), db: Session = Depends(get_db)):
    query = filters(db, league, start, end, team)
    rows = query.order_by(ResultadoHistorico.kickoff.desc(), ResultadoHistorico.id.desc()).offset(offset).limit(limit).all()
    return {'schemaVersion': 1, 'source': 'ESPN', 'timezone': 'America/Mexico_City', 'total': query.count(), 'offset': offset, 'limit': limit,
            'usage': 'Marcadores y estadísticas son datos posteriores al partido. Para predecirlo usa solo antecedentes anteriores al kickoff.',
            'rows': [{**match(row), 'label': 'home' if row.home_score > row.away_score else 'away' if row.away_score > row.home_score else 'draw',
                      'postMatchStatistics': (row.summary or {}).get('boxscore', {}).get('teams', [])} for row in rows]}

@router.get('/antecedentes')
def antecedents(league: str, team_id: str = Query(pattern=r'^\d+$'), before: datetime = Query(),
                limit: int = Query(20, ge=1, le=100), user: dict = Depends(getCurrentUser), db: Session = Depends(get_db)):
    if before.tzinfo is None:
        raise HTTPException(422, 'before necesita zona horaria, por ejemplo 2026-10-11T20:00:00-06:00.')
    cutoff = before.astimezone(timezone.utc).replace(tzinfo=None)
    rows = filters(db, league, None, None, '').filter(ResultadoHistorico.kickoff < cutoff,
            or_(ResultadoHistorico.home_id == team_id, ResultadoHistorico.away_id == team_id)).order_by(ResultadoHistorico.kickoff.desc()).limit(limit).all()
    return {'teamId': team_id, 'before': before, 'count': len(rows), 'matches': [match(row) for row in rows]}
