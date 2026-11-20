"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";
import { COMPONENT_CATALOG_GROUPS } from "@/data/component-catalog";

const categoryParser = parseAsStringLiteral(COMPONENT_CATALOG_GROUPS.map(({ id }) => id)).withOptions({
  history: "push",
  scroll: true,
});

export function useComponentCategory() {
  return useQueryState("category", categoryParser);
}
