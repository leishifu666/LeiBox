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
                    'out/ai/packages/example-react.json', 'out/fonts/misans.css']
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


if __name__ == '__main__':
    unittest.main()
