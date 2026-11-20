import { useState } from "react";

/** Sync an externally updated option while leaving the demo's controls usable. */
export function useDemoOption(option, fallback) {
  const [current, setCurrent] = useState({ option, value: option ?? fallback });
  const changed = !Object.is(option, current.option);
  const value = changed ? option ?? fallback : current.value;
  if (changed) setCurrent({ option, value });
  return [value, next => setCurrent({ option, value: next })];
}
