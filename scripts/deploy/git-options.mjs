/** Keep release connection overrides local to each Git command. */
export function deploymentGitOptions(config, platform = process.platform) {
  const args = [];
  if (config.gitProxy) {
    const proxy = new URL(config.gitProxy);
    if (!['http:', 'https:'].includes(proxy.protocol)) throw new Error('Invalid gitProxy: use an HTTP(S) proxy URL');
    args.push('-c', `http.proxy=${config.gitProxy}`, '-c', `http.https://github.com.proxy=${config.gitProxy}`, '-c', 'http.version=HTTP/1.1');
  } else if (config.directGitHub) {
    args.push('-c', 'http.proxy=', '-c', 'http.https://github.com.proxy=', '-c', 'http.version=HTTP/1.1');
  }
  const backend = config.gitSslBackend ?? (platform === 'win32' ? 'schannel' : undefined);
  if (backend) {
    if (!['schannel', 'openssl'].includes(backend)) throw new Error('Invalid gitSslBackend: use schannel or openssl');
    args.push('-c', `http.sslBackend=${backend}`);
  }
  return args;
}
