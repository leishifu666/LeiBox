import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {deploymentGitOptions} from './git-options.mjs';

test('Windows release Git bypasses stale proxies and overrides OpenSSL using command options', () => {
  const args = deploymentGitOptions({directGitHub: true}, 'win32');
  for (const setting of ['http.proxy=', 'http.https://github.com.proxy=', 'http.version=HTTP/1.1', 'http.sslBackend=schannel']) {
    const index = args.indexOf(setting);
    assert(index > 0 && args[index - 1] === '-c', setting);
  }
});

test('other platforms keep their TLS default; explicit backend overrides are validated', () => {
  assert.deepEqual(deploymentGitOptions({}, 'linux'), []);
  assert.deepEqual(deploymentGitOptions({gitSslBackend: 'openssl'}, 'win32'), ['-c', 'http.sslBackend=openssl']);
  assert.throws(() => deploymentGitOptions({gitSslBackend: 'insecure'}), /Invalid gitSslBackend/);
});

test('an explicit working proxy overrides stale global proxies and direct mode', () => {
  const proxy = 'http://127.0.0.1:7897';
  const args = deploymentGitOptions({gitProxy: proxy, directGitHub: true}, 'win32');
  assert(args.includes(`http.proxy=${proxy}`));
  assert(args.includes(`http.https://github.com.proxy=${proxy}`));
  assert(!args.includes('http.proxy='));
  assert(args.includes('http.sslBackend=schannel'));
  assert.throws(() => deploymentGitOptions({gitProxy: 'file:///tmp/proxy'}), /Invalid gitProxy/);
});

test('help and invalid release modes exit before any connection or publication', () => {
  const script = fileURLToPath(new URL('./server.mjs', import.meta.url));
  const help = spawnSync(process.execPath, [script, '--help'], {encoding: 'utf8'});
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /--check/);
  assert.doesNotMatch(help.stdout, /Deploying committed revision/);
  for (const args of [['--unknown'], ['--check', '--prepare-only']]) {
    const result = spawnSync(process.execPath, [script, ...args], {encoding: 'utf8'});
    assert.equal(result.status, 1);
    assert.match(result.stderr, /See --help/);
    assert.equal(result.stdout, '');
  }
});
