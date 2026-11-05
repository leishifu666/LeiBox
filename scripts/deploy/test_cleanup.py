import importlib.util
import hashlib
import json
import os
import pathlib
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('cleanup', pathlib.Path(__file__).with_name('cleanup.py'))
cleanup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cleanup)
sha = lambda data: hashlib.sha256(data).hexdigest()


class CleanupTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = pathlib.Path(self.temp.name).resolve()
        self.now = 2000000000
        self.current = 'out/_next/static/chunks/current123.js'
        self.stale = 'out/_next/static/chunks/obsolete12.js'
        self.rollback = 'out/_next/static/chunks/rollback12.js'
        self.write(self.current, b'current')
        self.write(self.stale, b'obsolete')
        self.write(self.rollback, b'rollback')
        self.write('.env.local', b'PRIVATE_TEST_ONLY')
        self.write('out/uploads/user.txt', b'KEEP')
        self.write('out/doc-assets/.env.local', b'KEEP')
        self.write('out/doc-assets/manual-notes.txt', b'KEEP')
        self.state = {'release': 'new', 'commit': 'a' * 40,
                      'files': [self.entry(self.current, b'current')]}
        self.write('.releases/current-manifest.json', json.dumps(self.state).encode())

    def tearDown(self):
        self.temp.cleanup()

    def entry(self, name, body):
        return {'path': name, 'sha256': sha(body), 'size': len(body)}

    def write(self, name, body):
        file = self.root / name
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_bytes(body)
        os.utime(file, (self.now - 172800, self.now - 172800))
        return file

    def backup(self, name, age, *, before=True):
        folder = self.root / 'backups' / name
        self.write(f'backups/{name}/out/index.html', b'previous page')
        old = {'files': [self.entry('out/index.html', b'previous page'),
                         self.entry(self.rollback, b'rollback')]}
        self.write(f'backups/{name}/manifest.json', json.dumps(self.state).encode())
        if before:
            self.write(f'backups/{name}/previous-manifest.json', json.dumps(old).encode())
        os.utime(folder, (self.now - age, self.now - age))
        os.utime(folder / 'manifest.json', (self.now - age, self.now - age))
        return folder, old

    def run_cleanup(self, apply=False):
        return cleanup.clean(self.root, now=self.now, apply=apply)

    def test_dry_run_does_not_delete(self):
        report = self.run_cleanup()
        self.assertIn(self.stale, [x['path'] for x in report['assets']])
        self.assertTrue((self.root / self.stale).exists())
        self.assertFalse((self.root / '.releases/cleanup-last.json').exists())

    def test_expired_files_removed_current_recent_and_private_files_preserved(self):
        self.backup('new', 1)
        self.backup('previous', 10)
        young = self.write('out/doc-assets/' + 'b' * 24 + '.json', b'young')
        os.utime(young, (self.now - 60, self.now - 60))
        report = self.run_cleanup(True)
        self.assertFalse((self.root / self.stale).exists())
        for name in [self.current, self.rollback, '.env.local', 'out/uploads/user.txt',
                     'out/doc-assets/.env.local', 'out/doc-assets/manual-notes.txt']:
            self.assertTrue((self.root / name).is_file(), name)
        self.assertTrue(young.exists())
        self.assertEqual(report['recentAssetsKept'], 1)

    def test_only_two_identified_backups_remain(self):
        self.backup('new', 1)
        self.backup('previous', 10)
        obsolete, _ = self.backup('obsolete', 100)
        self.write('backups/admin-setup/authorized_keys.before', b'KEEP_PRIVATE_TEST')
        report = self.run_cleanup(True)
        self.assertFalse(obsolete.exists())
        self.assertEqual(set(report['keptBackups']), {'new', 'previous'})
        self.assertTrue((self.root / 'backups/admin-setup/authorized_keys.before').exists())

    def test_unverified_live_release_aborts_before_deleting_anything(self):
        (self.root / self.current).write_bytes(b'edited')
        with self.assertRaisesRegex(ValueError, 'Current release differs'):
            self.run_cleanup(True)
        self.assertTrue((self.root / self.stale).exists())

    def test_unknown_predecessor_keeps_assets_and_backups(self):
        self.backup('new', 1, before=False)
        self.backup('previous', 10)
        obsolete, _ = self.backup('obsolete', 100)
        report = self.run_cleanup(True)
        self.assertIn('new', report['unresolvedRollbackBackups'])
        self.assertEqual(report['assets'], [])
        self.assertTrue(obsolete.exists())

    def test_legacy_predecessor_is_verified_and_saved_before_old_backup_is_removed(self):
        latest, old = self.backup('new', 1, before=False)
        self.backup('previous', 10)
        obsolete, _ = self.backup('obsolete', 100)
        (obsolete / 'manifest.json').write_text(json.dumps(old))
        report = self.run_cleanup(True)
        self.assertEqual(report['unresolvedRollbackBackups'], [])
        self.assertTrue((latest / 'previous-manifest.json').exists())
        self.assertFalse(obsolete.exists())
        self.assertEqual(self.run_cleanup()['unresolvedRollbackBackups'], [])
        self.assertTrue((self.root / self.rollback).exists())

    def test_invalid_retention_is_rejected(self):
        self.write('.releases/cleanup-policy.json', b'{"keepBackups":0}')
        with self.assertRaises(ValueError):
            self.run_cleanup(True)
        self.assertTrue((self.root / self.stale).exists())

    def test_old_file_newly_retired_gets_a_full_day_of_grace(self):
        state = self.root / '.releases/current-manifest.json'
        os.utime(state, (self.now - 60, self.now - 60))
        report = self.run_cleanup(True)
        self.assertEqual(report['assets'], [])
        self.assertTrue((self.root / self.stale).exists())
        later = cleanup.clean(self.root, now=self.now + 86400, apply=True)
        self.assertIn(self.stale, [x['path'] for x in later['assets']])
        self.assertFalse((self.root / self.stale).exists())

    def test_manifest_path_escape_is_rejected(self):
        self.state['files'][0]['path'] = 'out/../.env.local'
        self.write('.releases/current-manifest.json', json.dumps(self.state).encode())
        with self.assertRaises(ValueError):
            self.run_cleanup(True)

    def test_optimized_images_respect_current_rollback_and_grace_period(self):
        active = 'out/assets/optimized/active-aaaaaaaaaaaa-640.webp'
        stale = 'out/assets/optimized/obsolete-bbbbbbbbbbbb-640.webp'
        recent = 'out/assets/optimized/recent-cccccccccccc-320.webp'
        rollback = 'out/assets/optimized/rollback-dddddddddddd-320.webp'
        for name in [active, stale, recent, rollback]:
            self.write(name, b'image')
        self.state['files'].append(self.entry(active, b'image'))
        self.write('.releases/current-manifest.json', json.dumps(self.state).encode())
        backup, predecessor = self.backup('new', 1)
        predecessor['files'].append(self.entry(rollback, b'image'))
        (backup / 'previous-manifest.json').write_text(json.dumps(predecessor))
        os.utime(self.root / recent, (self.now - 60, self.now - 60))
        self.write('out/assets/optimized/manual.webp', b'keep')
        report = self.run_cleanup(True)
        self.assertIn(stale, [item['path'] for item in report['assets']])
        self.assertFalse((self.root / stale).exists())
        for name in [active, recent, rollback, 'out/assets/optimized/manual.webp']:
            self.assertTrue((self.root / name).exists(), name)

    def test_retired_framework_files_require_verified_publication_history(self):
        stale = 'out/motion-frameworks/retired/react/RetiredEngine.js'
        unknown = 'out/motion-frameworks/custom/react/CustomEngine.js'
        self.write(stale, b'engine')
        self.write(unknown, b'keep')
        for name, age in [('new', 1), ('previous', 10), ('old', 100)]:
            self.backup(name, age)
        history = self.root / 'backups/old/manifest.json'
        snapshot = json.loads(history.read_text())
        snapshot['release'] = 'abcdef123456-1234'
        snapshot['files'].append(self.entry(stale, b'engine'))
        history.write_text(json.dumps(snapshot))
        os.utime(history, (self.now - 100, self.now - 100))
        first = self.run_cleanup(True)
        self.assertNotIn(stale, [item['path'] for item in first['assets']])
        later = cleanup.clean(self.root, now=self.now + 86400, apply=True)
        self.assertIn(stale, [item['path'] for item in later['assets']])
        self.assertFalse((self.root / stale).exists())
        self.assertTrue((self.root / unknown).exists())

    def test_framework_retirement_survives_rollback_snapshot_pruning(self):
        retired = 'out/motion-frameworks/retired/react/RetiredEngine.js'
        self.write(retired, b'engine')
        backup, predecessor = self.backup('new', 1)
        predecessor['files'].append(self.entry(retired, b'engine'))
        previous = backup / 'previous-manifest.json'
        previous.write_text(json.dumps(predecessor))
        self.run_cleanup(True)
        self.assertTrue((self.root / retired).exists())
        timestamps = json.loads((self.root / '.releases/retired-assets.json').read_text())
        self.assertIn(retired, timestamps)
        # Later retained rollbacks no longer refer to that framework directory.
        predecessor['files'] = [item for item in predecessor['files'] if item['path'] != retired]
        previous.write_text(json.dumps(predecessor))
        later = cleanup.clean(self.root, now=self.now + 86400, apply=True)
        self.assertIn(retired, [item['path'] for item in later['assets']])
        self.assertFalse((self.root / retired).exists())

    @unittest.skipUnless(os.name == 'posix', 'POSIX symlink permissions')
    def test_asset_symlink_aborts_without_following_or_deleting_target(self):
        target = self.root / 'out/uploads/user.txt'
        (self.root / 'out/doc-assets/linked.json').symlink_to(target)
        with self.assertRaisesRegex(ValueError, 'Symlink'):
            self.run_cleanup(True)
        self.assertTrue(target.exists())
        self.assertTrue((self.root / self.stale).exists())


if __name__ == '__main__':
    unittest.main()
