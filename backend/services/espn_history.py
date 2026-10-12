"""ESPN histórico. Solo endpoints fijos, resultados terminados y datos deportivos."""
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo
import time
import httpx

BASE = 'https://site.api.espn.com/apis/site/v2/sports'
ZONE = ZoneInfo('America/Mexico_City')
LEAGUES = [
    ('soccer/mex.1', 'Liga MX', 'Fútbol'),
    ('soccer/eng.1', 'Premier League', 'Fútbol'),
    ('soccer/esp.1', 'LaLiga', 'Fútbol'),
    ('soccer/ger.1', 'Bundesliga', 'Fútbol'),
    ('soccer/ita.1', 'Serie A', 'Fútbol'),
    ('soccer/fra.1', 'Ligue 1', 'Fútbol'),
    ('soccer/por.1', 'Primeira Liga', 'Fútbol'),
    ('soccer/ned.1', 'Eredivisie', 'Fútbol'),
    ('soccer/usa.1', 'MLS', 'Fútbol'),
    ('soccer/arg.1', 'Liga Argentina', 'Fútbol'),
    ('soccer/bra.1', 'Brasileirão', 'Fútbol'),
    ('soccer/uefa.champions', 'Champions', 'Fútbol'),
    ('soccer/uefa.europa', 'Europa League', 'Fútbol'),
    ('soccer/conmebol.libertadores', 'Libertadores', 'Fútbol'),
    ('soccer/concacaf.champions', 'Concacaf Champions Cup', 'Fútbol'),
    ('football/nfl', 'NFL', 'NFL'),
    ('basketball/nba', 'NBA', 'Básquet'),
    ('basketball/wnba', 'WNBA', 'Básquet'),
    ('baseball/mlb', 'MLB', 'Béisbol'),
    ('hockey/nhl', 'NHL', 'Hockey'),
]
CATALOG = {path: {'id': path, 'name': name, 'sport': sport} for path, name, sport in LEAGUES}

class ProviderError(Exception):
    pass

def request(endpoint, params):
    """Tiempo y reintentos acotados; no envía credenciales del usuario a ESPN."""
    for attempt in range(3):
        try:
            response = httpx.get(f'{BASE}/{endpoint}', params=params, timeout=12,
                                 follow_redirects=False, headers={'Accept': 'application/json'})
            if response.status_code in (429, 502, 503, 504) and attempt < 2:
                time.sleep(1 + attempt)
                continue
            response.raise_for_status()
            body = response.json()
            if not isinstance(body, dict):
                raise ValueError('Respuesta inválida')
            return body
        except (httpx.HTTPError, ValueError) as exc:
            if attempt == 2 or isinstance(exc, httpx.HTTPStatusError):
                raise ProviderError('ESPN no respondió con datos válidos; vuelve a importar este rango.') from exc
            time.sleep(1 + attempt)
    raise ProviderError('ESPN no está disponible.')

def kickoff(value):
    result = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if result.tzinfo is None:
        raise ValueError('Fecha sin zona horaria')
    return result

def local_date(value):
    return kickoff(value).astimezone(ZONE).date()

def score(value):
    # Las APIs deportivas pueden enviar números, strings o {value, displayValue}.
    if isinstance(value, dict):
        value = value.get('value', value.get('displayValue'))
    try:
        number = float(value)
        return int(number) if number.is_integer() and number >= 0 else None
    except (TypeError, ValueError, OverflowError):
        return None

def event_record(event, league):
    game = (event.get('competitions') or [{}])[0]
    status = game.get('status') or event.get('status') or {}
    kind = status.get('type') or {}
    if not kind.get('completed') or any(word in kind.get('name', '').upper() for word in ('CANCEL', 'POSTPON', 'SUSPEND')):
        return None
    teams = game.get('competitors') or []
    home = next((item for item in teams if item.get('homeAway') == 'home'), None)
    away = next((item for item in teams if item.get('homeAway') == 'away'), None)
    if not home or not away or not str(event.get('id', '')).isdigit():
        return None
    scores = [score(team.get('score')) for team in (home, away)]
    if None in scores:
        return None
    try:
        instant = kickoff(event['date'])
    except (KeyError, ValueError, TypeError):
        return None
    if instant > datetime.now(timezone.utc):
        return None
    names = [(item.get('team') or {}).get('displayName', '') for item in (home, away)]
    ids = [str((item.get('team') or {}).get('id') or item.get('id', '')) for item in (home, away)]
    if not all(names) or not all(item.isdigit() for item in ids):
        return None
    logos = [(item.get('team') or {}).get('logo') for item in (home, away)]
    logos = [logo if isinstance(logo, str) and logo.startswith('https://a.espncdn.com/') else None for logo in logos]
    return dict(event_id=str(event['id']), league_id=league, kickoff=instant.astimezone(timezone.utc).replace(tzinfo=None),
                local_day=instant.astimezone(ZONE).date(), home_id=ids[0], away_id=ids[1], home=names[0], away=names[1],
                home_score=scores[0], away_score=scores[1], logos=logos,
                venue=(game.get('venue') or {}).get('fullName'),
                # Excluye narraciones, noticias, vídeos y odds de la respuesta.
                scoreboard={'id': event['id'], 'date': event['date'], 'season': event.get('season'),
                            'competitions': [{key: game[key] for key in ('id', 'competitors', 'status', 'venue') if key in game}]})

def summary_record(body, record):
    header = body.get('header') or {}
    game = (header.get('competitions') or [{}])[0]
    if str(header.get('id')) != record['event_id'] or not (game.get('status') or {}).get('type', {}).get('completed'):
        raise ProviderError('El resumen de ESPN no corresponde a un resultado terminado.')
    teams = game.get('competitors') or []
    for side, team_id, goals in [('home', record['home_id'], record['home_score']), ('away', record['away_id'], record['away_score'])]:
        team = next((item for item in teams if item.get('homeAway') == side), {})
        if str((team.get('team') or {}).get('id') or team.get('id')) != team_id or score(team.get('score')) != goals:
            raise ProviderError('El resumen y el marcador de ESPN no coinciden.')
    # Se conservan todas las estadísticas de ambos equipos para posteriores modelos.
    stats = [{'team': item.get('team'), 'statistics': item.get('statistics') or []} for item in (body.get('boxscore') or {}).get('teams', [])]
    events = []
    for item in body.get('keyEvents') or body.get('scoringPlays') or game.get('details') or []:
        if item.get('scoringPlay'):
            events.append({key: item[key] for key in ('id', 'type', 'clock', 'addedClock', 'participants', 'team', 'scoringPlay', 'ownGoal', 'penaltyKick', 'shootout') if key in item})
    result = {'header': header, 'boxscore': {'teams': stats}, 'keyEvents': events,
              'gameInfo': {'venue': (body.get('gameInfo') or {}).get('venue')}}
    return result, any(item['statistics'] for item in stats)

def boards(league, start, end):
    day = start
    # Un día adicional cubre encuentros nocturnos en México; filtra por fecha local.
    while day <= end + timedelta(days=1):
        body = request(f'{league}/scoreboard', {'dates': day.strftime('%Y%m%d'), 'limit': 1000})
        if not isinstance(body.get('events'), list):
            raise ProviderError('ESPN devolvió un calendario inválido.')
        yield day, body['events']
        day += timedelta(days=1)
