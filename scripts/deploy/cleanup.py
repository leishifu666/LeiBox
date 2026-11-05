"""Expire only published build assets and identified incremental release backups."""
import argparse
import contextlib
import hashlib
import json
import math
import os
import pathlib
import re
import shutil
import time

ROOT = pathlib.Path('/opt/Project/leibox')
POLICY = {'assetGraceHours': 24, 'keepBackups': 2}
ASSET_PREFIXES = ('out/_next/static/', 'out/doc-assets/',
                  'out/assets/optimized/', 'out/motion-frameworks/')


def build_asset(name):
    if name.startswith('out/assets/optimized/'):
        return re.fullmatch(r'out/assets/optimized/[\w-]+-[a-f0-9]{12}-\d+\.webp', name) is not None
    if name.startswith('out/motion-frameworks/'):
        return re.fullmatch(r'out/motion-frameworks/(?:manifest\.json|[a-z0-9-]+/(?:packages\.json|(?:react|vue|svelte|solid|preact|vanilla)/[\w.-]+\.(?:js|ts|tsx|vue|svelte|css|json)))', name) is not None
    if name.startswith('out/doc-assets/'):
        return re.fullmatch(r'out/doc-assets/[a-f0-9]{24}\.json', name) is not None
    if name.startswith('out/_next/static/chunks/'):
        return re.fullmatch(r'out/_next/static/chunks/[\w-]{8,}\.(?:js|css)(?:\.map)?', name) is not None
    return re.fullmatch(r'out/_next/static/[\w-]{8,}/_(?:build|ssg|clientMiddleware)Manifest\.js', name) is not None


@contextlib.contextmanager
def publication_lock(root):
    state = root / '.releases'
    state.mkdir(exist_ok=True)
    with (state / 'publish.lock').open('a+b') as lock:
        if os.name == 'posix':
            import fcntl
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
        try:
            yield
        finally:
            if os.name == 'posix':
                fcntl.flock(lock.fileno(), fcntl.LOCK_UN)


def digest(file):
    with file.open('rb') as source:
        return hashlib.file_digest(source, 'sha256').hexdigest()


def contained(root, path):
    """Reject symlinks, including a link in any intermediate directory."""
    relative = path.relative_to(root)
    cursor = root
    for part in relative.parts:
        cursor = cursor / part
        if cursor.is_symlink():
            raise ValueError('Symlink in cleanup path: ' + str(relative))
    if not path.resolve().is_relative_to(root.resolve()):
        raise ValueError('Cleanup path escapes project')
    return path


def snapshot(file):
    value = json.loads(file.read_text())
    files = value['files']
    if not files or not isinstance(files, list):
        raise ValueError('Empty or invalid release manifest')
    entries = {}
    for item in files:
        name = item['path']
        p = pathlib.PurePosixPath(name)
        if (p.is_absolute() or '\\' in name or '..' in p.parts or
                len(p.parts) < 2 or p.parts[0] != 'out' or
                any(part.startswith('.') for part in p.parts[2:]) or
                p.name.startswith('.env') or p.suffix in ('.key', '.pem')):
            raise ValueError('Invalid published path')
        if p.parts[1].startswith('.') and p.parts[1] != '.well-known':
            raise ValueError('Unexpected hidden published path')
        if name in entries or not re.fullmatch('[a-f0-9]{64}', item['sha256']):
            raise ValueError('Invalid or duplicate manifest digest')
        entries[name] = item
    return value, entries


def managed_backups(root):
    folder = root / 'backups'
    if not folder.exists():
        return [], []
    contained(root, folder)
    managed, skipped = [], []
    for backup in folder.iterdir():
        try:
            contained(root, backup)
            if not backup.is_dir():
                raise ValueError('Not a release directory')
            manifest = contained(root, backup / 'manifest.json')
            value, entries = snapshot(manifest)
            saved = {}
            for child in backup.rglob('*'):
                contained(root, child)
                if child.is_dir():
                    continue
                relative = child.relative_to(backup).as_posix()
                if relative in ('manifest.json', 'previous-manifest.json'):
                    continue
                if not relative.startswith('out/') or not child.is_file():
                    raise ValueError('Contains non-publication files')
                if child.name.startswith('.env') or child.suffix in ('.key', '.pem'):
                    raise ValueError('Contains private files')
                saved[relative] = digest(child)
            managed.append({'path': backup, 'manifest': value, 'entries': entries,
                            'saved': saved, 'modified': manifest.stat().st_mtime})
        except (ValueError, KeyError, TypeError, OSError):
            skipped.append(backup.name)
    return managed, skipped


def rollback_snapshot(backup, candidates):
    """Legacy manifests describe the new release, not the files being backed up.

    A legacy predecessor is accepted only when every saved file's digest agrees.
    Otherwise asset pruning stops; a guessed predecessor could break rollback.
    """
    before = backup['path'] / 'previous-manifest.json'
    if before.exists():
        candidates = [snapshot(before)[1]]
    if not backup['saved']:
        return {}
    for entries in candidates:
        if all(name in entries and entries[name]['sha256'] == checksum
               for name, checksum in backup['saved'].items()):
            return entries
    return None


def clean(root=ROOT, *, apply=False, now=None):
    root = pathlib.Path(root)
    if root.is_symlink() or root != root.resolve():
        raise ValueError('Project root must be a resolved real directory')
    now = time.time() if now is None else now
    with publication_lock(root):
        state = contained(root, root / '.releases/current-manifest.json')
        current, entries = snapshot(state)
        # Do not remove recovery data while the live release itself is incomplete.
        for name, item in entries.items():
            file = contained(root, root / name)
            if not file.is_file() or digest(file) != item['sha256']:
                raise ValueError('Current release differs: ' + name)
        policy_file = contained(root, root / '.releases/cleanup-policy.json')
        policy = {**POLICY, **(json.loads(policy_file.read_text()) if policy_file.exists() else {})}
        if (type(policy['assetGraceHours']) is not int or policy['assetGraceHours'] < 24 or
                type(policy['keepBackups']) is not int or policy['keepBackups'] < 2):
            raise ValueError('Keep at least 24 hours of assets and two rollback backups')
        backups, skipped = managed_backups(root)
        backups.sort(key=lambda b: (b['path'].name == current.get('release'), b['modified']), reverse=True)
        kept, expired = backups[:policy['keepBackups']], backups[policy['keepBackups']:]
        protected = set(entries)
        inferred = []
        unresolved = []
        candidates = [entries] + [b['entries'] for b in backups]
        for backup in kept:
            predecessor = rollback_snapshot(backup, candidates)
            if predecessor is None:
                unresolved.append(backup['path'].name)
            else:
                protected.update(predecessor)
                if predecessor and not (backup['path'] / 'previous-manifest.json').exists():
                    inferred.append((backup['path'], predecessor))
        if unresolved:
            expired = []
        # Bootstrap retirement times from complete receiver-era snapshots. A
        # file's creation date alone says nothing about when pages stopped using it.
        history = [(state.stat().st_mtime, entries)]
        for backup in backups:
            if re.fullmatch(r'[a-f0-9]{12}-[a-f0-9]+', backup['manifest'].get('release', '')):
                history.append((backup['modified'], backup['entries']))
        history.sort(key=lambda item: item[0])
        retired_file = contained(root, root / '.releases/retired-assets.json')
        retired_before = json.loads(retired_file.read_text()) if retired_file.exists() else {}
        if not isinstance(retired_before, dict) or any(
                type(value) not in (int, float) or not math.isfinite(value) or value < 0 or value > now
                for value in retired_before.values()):
            raise ValueError('Invalid retired asset timestamps')
        retired = {}
        assets, recent = [], 0
        # Unknown files elsewhere (uploads, config, mail, source, certificates) are
        # deliberately outside this operation, even when absent from the manifest.
        if not unresolved:
            for prefix in ASSET_PREFIXES:
                folder = contained(root, root / prefix)
                if not folder.exists():
                    continue
                for file in folder.rglob('*'):
                    contained(root, file)
                    name = file.relative_to(root).as_posix()
                    if not file.is_file() or name in entries or not build_asset(name):
                        continue
                    info = file.stat()
                    last_present = max((i for i, (_, names) in enumerate(history) if name in names), default=-1)
                    # Only retire framework files recorded by our publisher; leave unknown files alone.
                    if (prefix == 'out/motion-frameworks/' and last_present < 0 and
                            name not in retired_before and name not in protected):
                        continue
                    first_absent = history[last_present + 1][0] if last_present + 1 < len(history) else now
                    since = max(retired_before.get(name, first_absent), info.st_mtime)
                    retired[name] = since
                    # Remember verified retirement while rollback snapshots still protect the file.
                    # Those snapshots may be pruned before the file becomes eligible for removal.
                    if name in protected:
                        continue
                    if now - since < policy['assetGraceHours'] * 3600:
                        recent += 1
                        continue
                    assets.append({'path': file.relative_to(root).as_posix(), 'bytes': info.st_size})
        expired_items = []
        for backup in expired:
            size = sum(p.stat().st_size for p in backup['path'].rglob('*') if p.is_file())
            expired_items.append({'path': backup['path'].relative_to(root).as_posix(), 'bytes': size})
        report = {'applied': apply, 'commit': current.get('commit'), 'policy': policy,
                  'assets': assets, 'expiredBackups': expired_items,
                  'keptBackups': [b['path'].name for b in kept],
                  'skippedUnmanagedBackups': skipped, 'unresolvedRollbackBackups': unresolved,
                  'recentAssetsKept': recent,
                  'assetBytes': sum(x['bytes'] for x in assets),
                  'backupBytes': sum(x['bytes'] for x in expired_items)}
        if apply:
            pending_retired = retired_file.with_suffix('.new')
            pending_retired.write_text(json.dumps(retired))
            os.replace(pending_retired, retired_file)
            # Preserve verified legacy predecessor snapshots before pruning the
            # older directories that supplied them, so the next run stays safe.
            for backup, predecessor in inferred:
                target = contained(root, backup / 'previous-manifest.json')
                with target.open('x') as output:
                    json.dump({'files': list(predecessor.values())}, output)
            for item in assets:
                contained(root, root / item['path']).unlink()
            for item in expired_items:
                target = contained(root, root / item['path'])
                if target.parent != root / 'backups':
                    raise ValueError('Invalid backup deletion target')
                shutil.rmtree(target)
            # Prune only empty asset folders; retain the two namespace roots.
            for prefix in ASSET_PREFIXES:
                folder = root / prefix
                if folder.exists():
                    for child in sorted(folder.rglob('*'), key=lambda p: len(p.parts), reverse=True):
                        if child.is_dir() and not child.is_symlink() and not any(child.iterdir()):
                            child.rmdir()
            # A receipt makes automatic runs inspectable without logging credentials.
            output = root / '.releases/cleanup-last.json'
            pending = output.with_suffix('.new')
            pending.write_text(json.dumps({**report, 'finishedAt': now}, indent=2))
            os.replace(pending, output)
        return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true', help='Delete the reported expired files')
    args = parser.parse_args()
    if ROOT.resolve() != ROOT:
        raise ValueError('Unexpected production root')
    result = clean(apply=args.apply)
    print(json.dumps({**result, 'assetCount': len(result['assets']),
                      'backupCount': len(result['expiredBackups']),
                      'assets': None, 'expiredBackups': None}))
