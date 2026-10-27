/** Shared requests are cached only on success; failed requests can be retried. */
const requests = new Map<string, Promise<unknown>>();
const MAX_CACHED_ASSETS = 24;
export function loadDocAsset<T>(url: string): Promise<T> {
  let request = requests.get(url);
  if (!request) {
    request = fetch(url).then(response => {
      if (!response.ok) throw new Error(`Code unavailable (${response.status})`);
      return response.json();
    }).catch(error => { if (requests.get(url) === request) requests.delete(url); throw error; });
  }
  requests.delete(url);
  requests.set(url, request);
  while (requests.size > MAX_CACHED_ASSETS) requests.delete(requests.keys().next().value!);
  return request as Promise<T>;
}
