from datetime import datetime
from uuid import uuid4
from sqlalchemy.exc import IntegrityError
from database.connection import SessionLocal, engine
from database.models.historico import ResultadoHistorico, ImportacionHistorica
from services import espn_history as espn

def create_tables(bind=engine):
    # Migración aditiva: no altera ni elimina tablas del equipo o sus datos.
    ResultadoHistorico.__table__.create(bind, checkfirst=True)
    ImportacionHistorica.__table__.create(bind, checkfirst=True)

def enqueue(db, leagues, start, end):
    job = ImportacionHistorica(id=str(uuid4()), active_slot=1, leagues=leagues, start=start, end=end,
                              days_total=((end-start).days+2)*len(leagues), errors=[])
    db.add(job)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ValueError('Hay una importación en curso. Espera a que termine.')
    db.refresh(job)
    return job

def run_import(job_id, sessions=SessionLocal):
    with sessions() as db:
        job = db.get(ImportacionHistorica, job_id)
        if not job or job.status not in ('pending', 'interrupted'):
            return
        job.status = 'running'
        db.commit()
        seen = set()
        errors = []
        try:
            for league in job.leagues:
                try:
                    for day, events in espn.boards(league, job.start, job.end):
                        for event in events:
                            record = espn.event_record(event, league)
                            if not record or not job.start <= record['local_day'] <= job.end:
                                continue
                            key = (league, record['event_id'])
                            if key in seen:
                                continue
                            seen.add(key)
                            if len(seen) > 500:
                                errors.append({'league': league, 'message': 'Límite de 500 partidos; divide el rango y vuelve a importar.'})
                                break
                            saved = db.query(ResultadoHistorico).filter_by(league_id=league, event_id=record['event_id']).first()
                            fresh = saved is None
                            if fresh:
                                saved = ResultadoHistorico(**record)
                                db.add(saved)
                            else:
                                if (saved.home_score, saved.away_score) != (record['home_score'], record['away_score']):
                                    saved.summary = None
                                    saved.statistics_state = 'pending'
                                for name, value in record.items():
                                    setattr(saved, name, value)
                            try:
                                payload = espn.request(f'{league}/summary', {'event': record['event_id']})
                                summary, has_stats = espn.summary_record(payload, record)
                                saved.summary = summary
                                saved.statistics_state = 'available' if has_stats else 'unavailable'
                            except espn.ProviderError as exc:
                                # Un resumen fallido no destruye estadísticas ya guardadas.
                                errors.append({'league': league, 'event': record['event_id'], 'message': str(exc)})
                            saved.fetched_at = datetime.utcnow()
                            job.imported += int(fresh)
                            job.updated += int(not fresh)
                            job.errors = errors[-100:]
                            db.commit()
                        job.days_done += 1
                        job.errors = errors[-100:]
                        db.commit()
                except espn.ProviderError as exc:
                    errors.append({'league': league, 'message': str(exc)})
            job.status = 'partial' if errors else 'completed'
        except Exception:
            db.rollback()
            job = db.get(ImportacionHistorica, job_id)
            job.status = 'failed'
            errors.append({'message': 'No se pudo completar la escritura. Revisa el servidor y vuelve a importar.'})
        finally:
            job.errors = errors[-100:]
            job.active_slot = None
            job.finished_at = datetime.utcnow()
            db.commit()

def recover_interrupted(db):
    # El servidor Docker usa un único worker. Un reinicio libera el trabajo detenido.
    db.query(ImportacionHistorica).filter(ImportacionHistorica.active_slot == 1).update(
        {'status': 'interrupted', 'active_slot': None, 'finished_at': datetime.utcnow()})
    db.commit()
