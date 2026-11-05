"""Archive the public spectator feed. Standard library only; no AI runtime."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import math
import os
from pathlib import Path
import time
from urllib.request import Request, urlopen

SOURCE = 'https://triangle-arena.vercel.zone/api/screen/code-talks-2026'
ROOT = Path(__file__).resolve().parents[1] / 'data'


def iso(seconds):
    return datetime.fromtimestamp(seconds, timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')


def load(path, default):
    return json.loads(path.read_text()) if path.exists() else default


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':'), allow_nan=False) + '\n')
    temporary.replace(path)


def validate(feed, now=None):
    if not isinstance(feed, dict) or not isinstance(feed.get('leaderboard'), list) or not 0 < len(feed['leaderboard']) <= 5000:
        raise ValueError('Missing or empty leaderboard')
    observed = feed.get('now')
    if isinstance(observed, bool) or not isinstance(observed, (int, float)) or not math.isfinite(observed):
        raise ValueError('Invalid source timestamp')
    iso(observed / 1000)
    if now is not None and not -60 <= now - observed / 1000 <= 300:
        raise ValueError('Source timestamp is stale or in the future')
    ids = set()
    for row in feed['leaderboard']:
        ident = row.get('id')
        if not isinstance(ident, str) or not ident or ident in ids:
            raise ValueError('Missing or duplicate bot ID')
        ids.add(ident)
        rating = row.get('rating')
        if isinstance(rating, bool) or not isinstance(rating, (float, int)) or not math.isfinite(rating):
            raise ValueError('Invalid rating')
        for key in ('wins', 'matches'):
            if row.get(key) is not None and (type(row[key]) is not int or row[key] < 0):
                raise ValueError('Invalid match count')
        if row.get('wins', 0) > row.get('matches', float('inf')):
            raise ValueError('Wins exceed matches')


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def ingest(root, feed):
    validate(feed)
    stamp = iso(feed['now'] / 1000)
    entries = [{**{k: row.get(k) for k in ('id', 'name', 'rating', 'wins', 'matches')}, 'rank': i + 1}
               for i, row in enumerate(feed['leaderboard'])]
    snapshot = {'source': SOURCE, 'observedAt': stamp, 'entries': entries}
    day = stamp[:10]
    filename = stamp.replace(':', '-').replace('.', '-') + '.json'
    target = root / 'snapshots' / day / filename
    if target.exists():
        if load(target, None) != snapshot:
            raise ValueError('Source changed at an already archived timestamp')
    else:
        write(target, snapshot)
    history_path = root / 'history' / (day + '.json')
    history = load(history_path, [])
    if not any(s['observedAt'] == stamp for s in history):
        history.append(snapshot)
        history.sort(key=lambda s: s['observedAt'])
        write(history_path, history)
    index = load(root / 'history/index.json', {'days': {}, 'source': SOURCE})
    index['days'][day] = len(history)
    index['snapshotCount'] = sum(index['days'].values())
    index['firstObservedAt'] = min(index['days'])
    index['lastObservedAt'] = max(stamp, index.get('lastObservedAt', stamp))
    write(root / 'history/index.json', index)
    current = load(root / 'latest.json', {})
    if stamp >= current.get('observedAt', ''):
        write(root / 'latest.json', snapshot)

    archive = load(root / 'strategies.json', {'source': SOURCE, 'bots': {}})
    for entry in entries:
        bot = archive['bots'].setdefault(entry['id'], {'id': entry['id'], 'versions': []})
        if stamp >= bot.get('lastListedAt', ''):
            bot.update(entry)
            bot['lastListedAt'] = stamp
    bots = feed.get('bots', {})
    for row in bots.values() if isinstance(bots, dict) else bots:
        if not row.get('id') or not (row.get('summary') or row.get('tagline')):
            continue
        bot = archive['bots'].setdefault(row['id'], {'id': row['id'], 'name': row.get('name', row['id']), 'versions': []})
        content = {k: row.get(k, '') for k in ('summary', 'tagline')}
        version_id = digest(content)
        version = next((v for v in bot['versions'] if v['hash'] == version_id), None)
        if version is None:
            bot['versions'].append({**content, 'hash': version_id, 'firstSeenAt': stamp, 'lastSeenAt': stamp})
        else:
            version['firstSeenAt'] = min(version['firstSeenAt'], stamp)
            version['lastSeenAt'] = max(version['lastSeenAt'], stamp)
        bot['versions'].sort(key=lambda v: v['firstSeenAt'])
    write(root / 'strategies.json', archive)

    replay_index = load(root / 'replays.json', {'source': SOURCE, 'matches': {}})
    for match in feed.get('matches', []):
        if not match.get('id') or not match.get('replay'):
            continue
        # Hash source IDs; untrusted IDs never become filesystem paths.
        key = hashlib.sha256(str(match['id']).encode()).hexdigest()
        fields = {k: match[k] for k in ('id', 'playsAt', 'botIds', 'scores', 'ranking', 'background', 'replay') if k in match}
        replay_path = root / 'replays' / (key + '.json')
        if not replay_path.exists():
            write(replay_path, {'source': SOURCE, 'firstSeenAt': stamp, **fields})
        replay_index['matches'][key] = {k: v for k, v in fields.items() if k != 'replay'}
    write(root / 'replays.json', replay_index)
    return {'observedAt': stamp, 'bots': len(entries), 'snapshotCount': index['snapshotCount'],
            'describedBots': sum(bool(b['versions']) for b in archive['bots'].values()),
            'replays': len(replay_index['matches'])}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, default=ROOT)
    args = parser.parse_args()
    error = None
    for attempt in range(3):
        try:
            request = Request(SOURCE, headers={'User-Agent': 'TriangleArenaKnowledge/1.0', 'Accept': 'application/json'})
            with urlopen(request, timeout=35) as response:
                feed = json.load(response)
            validate(feed, now=time.time())
            summary = ingest(args.root, feed)
            status = {**summary, 'ok': True, 'collectedAt': iso(time.time()), 'source': SOURCE,
                      'scheduled': os.environ.get('GITHUB_ACTIONS') == 'true',
                      'runUrl': ('https://github.com/' + os.environ['GITHUB_REPOSITORY'] + '/actions/runs/' + os.environ['GITHUB_RUN_ID']) if os.environ.get('GITHUB_RUN_ID') else None}
            write(args.root / 'status.json', status)
            print(json.dumps(status))
            return
        except Exception as exc:
            error = exc
            if attempt < 2:
                time.sleep(10)
    # Keep all successful observations; only source-health metadata changes.
    write(args.root / 'status.json', {'ok': False, 'collectedAt': iso(time.time()), 'source': SOURCE, 'error': str(error)})
    raise SystemExit('Collection failed: ' + str(error))


if __name__ == '__main__':
    main()
