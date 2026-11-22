import json
import pathlib
import subprocess
import sys
import tarfile
import tempfile
import unittest


class PackageTests(unittest.TestCase):
    def test_archive_omits_build_copies_but_keeps_web_and_ai_source_endpoints(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory).resolve()
            source = root / 'source'
            target = root / 'package'
            target.mkdir()
            (target / 'baseline.json').write_text('{"files":[]}')
            kept = ['out/index.html', 'out/doc-assets/source.json',
                    'out/ai/packages/example-react.json', 'out/fonts/misans.css',
                    'out/assets/motion/' + 'a' * 24 + '.js',
                    'out/assets/motion/example-' + 'b' * 24 + '.html']
            omitted = ['out/motion-frameworks/manifest.json',
                       'out/motion-frameworks/example/react/ExampleEngine.js',
                       'out/previews/test.html', 'out/404-preview.html']
            for name in kept + omitted:
                file = source / name
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_text('fixture')
            subprocess.run([sys.executable, str(pathlib.Path(__file__).with_name('package.py')),
                            str(source), str(target), 'a' * 40, 'abcdef12-1234'],
                           check=True, capture_output=True)
            manifest = json.loads((target / 'release-manifest.json').read_text())
            self.assertEqual({item['path'] for item in manifest['files']}, set(kept))
            with tarfile.open(target / 'release.tar.gz') as archive:
                self.assertEqual(set(archive.getnames()), set(kept) | {'release-manifest.json'})

    def test_retirement_removes_only_stable_endpoints_of_deleted_components(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory).resolve()
            (root / 'out/docs/animations').mkdir(parents=True)
            (root / 'out/docs/animations/keep.html').write_text('active')
            retired = [
                'out/docs/animations/remove.html',
                'out/docs/animations/remove.txt',
                'out/docs/animations/remove/__next._full.txt',
                'out/motion/remove.html',
                'out/ai/components/remove.json',
            ]
            unchanged = [
                'out/docs/animations/keep.html',
                'out/docs/installation.html',
                'out/assets/motion/remove-' + 'a' * 24 + '.html',
                'out/assets/optimized/remove-' + 'b' * 12 + '-320.webp',
            ]
            (root / 'baseline.json').write_text(json.dumps({
                'files': [{'path': name, 'sha256': '0' * 64} for name in retired + unchanged],
            }))
            subprocess.run([sys.executable, str(pathlib.Path(__file__).with_name('package.py')),
                            str(root), str(root), 'a' * 40, 'abcdef12-1234'],
                           check=True, capture_output=True)
            manifest = json.loads((root / 'release-manifest.json').read_text())
            self.assertEqual({item['path'] for item in manifest['retired']}, set(retired))
            with tarfile.open(root / 'release.tar.gz') as archive:
                self.assertTrue(set(retired).isdisjoint(archive.getnames()))


if __name__ == '__main__':
    unittest.main()
