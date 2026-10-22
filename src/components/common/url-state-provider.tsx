"use client";

import { NuqsAdapter, enableHistorySync } from "nuqs/adapters/react";
import { useEffect, type ReactNode } from "react";

function isNextRouterState(state: unknown): boolean {
  return (
    typeof state === "object" &&
    state !== null &&
    "__NA" in (state as Record<string, unknown>)
  );
}

let historySyncDeferred = false;

function deferHistorySyncForNextRouter() {
  if (historySyncDeferred) return;
  historySyncDeferred = true;
  const { pushState, replaceState } = window.history;
  let resyncQueued = false;

  const queueResync = () => {
    if (resyncQueued) return;
    resyncQueued = true;
    queueMicrotask(() => {
      resyncQueued = false;
      replaceState.call(window.history, window.history.state, "", location.href);
    });
  };

  const wrap = (method: typeof pushState): typeof pushState =>
    function (this: History, state, unused, url) {
      if (url != null && isNextRouterState(state)) {
        method.call(this, state, "__nuqs__", url);
        queueResync();
      } else {
        method.call(this, state, unused, url);
      }
    };

  window.history.pushState = wrap(pushState);
  window.history.replaceState = wrap(replaceState);
}

export function UrlStateProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    enableHistorySync();
    deferHistorySyncForNextRouter();
  }, []);

  return <NuqsAdapter>{children}</NuqsAdapter>;
}
