"""Importador para backfill, también utilizable dentro de Docker."""
import argparse
import os
import sys
from pathlib import Path
from datetime import date, timedelta
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from services.espn_history import CATALOG
from services.history_store import create_tables, enqueue, run_import
from routes.historico import ImportRequest
from database.connection import SessionLocal
from database.models.historico import ImportacionHistorica

def main():
    parser = argparse.ArgumentParser(description='Guarda resultados ESPN y estadísticas; idempotente y sin demos.')
    parser.add_argument('--leagues', default=os.getenv('HISTORY_LEAGUES', 'soccer/mex.1'), help='all o códigos separados por coma')
    parser.add_argument('--start', default=os.getenv('HISTORY_START'), required=not os.getenv('HISTORY_START'), type=date.fromisoformat)
    parser.add_argument('--end', default=os.getenv('HISTORY_END'), required=not os.getenv('HISTORY_END'), type=date.fromisoformat)
    args = parser.parse_args()
    selected = list(CATALOG) if args.leagues == 'all' else args.leagues.split(',')
    if args.start > args.end:
        parser.error('El inicio debe preceder al final.')
    create_tables()
    partial = False
    for league in selected:
        start = args.start
        while start <= args.end:
            end = min(start + timedelta(days=6), args.end)
            body = ImportRequest(leagues=[league], start=start, end=end)
            with SessionLocal() as db:
                job_id = enqueue(db, body.leagues, body.start, body.end).id
            run_import(job_id)
            with SessionLocal() as db:
                job = db.get(ImportacionHistorica, job_id)
                print(f'{league} {start}..{end}: {job.status}; nuevos={job.imported}; actualizados={job.updated}; errores={len(job.errors)}', flush=True)
                partial |= job.status != 'completed'
            start = end + timedelta(days=1)
    return int(partial)

if __name__ == '__main__':
    raise SystemExit(main())
