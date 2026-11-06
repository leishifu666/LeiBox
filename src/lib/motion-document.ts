type Lease = { promise: Promise<string>; release(): void };
type Entry = { promise: Promise<string>; controller: AbortController; users: number; settled: boolean; navigation?: ReturnType<typeof setTimeout> };

/** Share document bytes between cards and details, without keeping abandoned downloads alive. */
export function createMotionDocumentLoader({ fetch: fetcher = (...args) => fetch(...args), capacity = 4, handoffMs = 10000 }: {
  fetch?: typeof fetch; capacity?: number; handoffMs?: number;
} = {}) {
  const entries = new Map<string, Entry>();
  const prune = () => {
    const idle = [...entries].filter(([, entry]) => entry.settled && entry.users === 0 && !entry.navigation);
    for (const [url] of idle.slice(0, Math.max(0, idle.length - capacity))) entries.delete(url);
  };
  const cancelUnused = (url: string, entry: Entry) => {
    if (entry.users === 0 && !entry.settled && !entry.navigation) {
      if (entries.get(url) === entry) entries.delete(url);
      entry.controller.abort();
    }
    prune();
  };
  return {
    prepareNavigation(url: string) {
      const entry = entries.get(url);
      if (!entry) return;
      clearTimeout(entry.navigation);
      entry.navigation = setTimeout(() => { entry.navigation = undefined; cancelUnused(url, entry); }, handoffMs);
    },
    acquire(url: string): Lease {
      let entry = entries.get(url);
      if (!entry) {
        const controller = new AbortController();
        const promise = fetcher(url, { signal: controller.signal }).then(response => {
          if (!response.ok) throw new Error(`Preview unavailable (${response.status})`);
          return response.text();
        });
        entry = { promise, controller, users: 0, settled: false };
        const current = entry;
        promise.then(() => { current.settled = true; prune(); }, () => {
          current.settled = true;
          if (entries.get(url) === current) entries.delete(url);
        });
      }
      clearTimeout(entry.navigation); entry.navigation = undefined;
      entries.delete(url); entries.set(url, entry); entry.users++;
      let released = false;
      return {
        promise: entry.promise,
        release() {
          if (released) return;
          released = true;
          entry.users--;
          if (entry.settled) { prune(); return; }
          // React can unmount the card and mount the detail in the same commit.
          // Let the next consumer take ownership before cancelling the request.
          setTimeout(() => {
            cancelUnused(url, entry);
          }, 0);
        },
      };
    },
  };
}

export const motionDocuments = createMotionDocumentLoader();
