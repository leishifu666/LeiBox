import type { Metadata } from "next";
import { OrbitNotFound } from "@/components/not-found-experiments/not-found-experiments";
import { getNotFoundItems } from "@/lib/not-found-items";

export const metadata: Metadata = {
  title: "组件环游 404 演示",
  robots: { index: false },
};

export default function OrbitNotFoundDemo() {
  return <OrbitNotFound items={getNotFoundItems()} preview />;
}
