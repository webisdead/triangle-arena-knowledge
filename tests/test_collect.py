import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('collector', Path(__file__).parents[1] / 'scripts/collect.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def feed(ms=1793872800000):
    return {'now': ms, 'leaderboard': [{'id': 'a', 'name': 'Alpha', 'rating': 1000, 'wins': 2, 'matches': 3}],
            'bots': {'a': {'id': 'a', 'name': 'Alpha', 'summary': 'Grow.', 'tagline': 'Compact'}},
            'matches': [{'id': '../unsafe', 'replay': {'seed': 2, 'moves': [[1], [2], [3]]}, 'botIds': ['a', 'b', 'c'], 'scores': [1, 2, 3]}]}


class CollectorTests(unittest.TestCase):
    def test_duplicate_bot_rejected_before_any_write(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            value = feed()
            value['leaderboard'] *= 2
            with self.assertRaises(ValueError):
                module.ingest(root, value)
            self.assertEqual(list(root.iterdir()), [])

    def test_snapshot_is_idempotent_and_replays_stay_under_root(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            module.ingest(root, feed())
            original = {str(p): p.read_bytes() for p in root.rglob('*.json') if p.name != 'status.json'}
            module.ingest(root, feed())
            for path, content in original.items():
                self.assertEqual(Path(path).read_bytes(), content)
            self.assertEqual(len(list((root / 'snapshots').rglob('*.json'))), 1)
            self.assertEqual(len(list((root / 'replays').glob('*.json'))), 1)

    def test_changed_strategy_retains_both_versions(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            module.ingest(root, feed())
            next_feed = feed(1793873700000)
            next_feed['bots']['a']['summary'] = 'Capture.'
            module.ingest(root, next_feed)
            archive = json.loads((root / 'strategies.json').read_text())
            self.assertEqual([v['summary'] for v in archive['bots']['a']['versions']], ['Grow.', 'Capture.'])
            self.assertEqual(json.loads((root / 'history/index.json').read_text())['snapshotCount'], 2)

    def test_stale_source_rejected(self):
        with self.assertRaises(ValueError):
            module.validate(feed(), now=1793876800)


if __name__ == '__main__':
    unittest.main()
