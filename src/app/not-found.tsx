import { OrbitNotFound } from "@/components/not-found-experiments/not-found-experiments";
import { getNotFoundItems } from "@/lib/not-found-items";

export default function NotFound() {
  return <OrbitNotFound items={getNotFoundItems()} />;
}
