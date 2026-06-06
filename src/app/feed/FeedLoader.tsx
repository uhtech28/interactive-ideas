import { unstable_cache } from "next/cache";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { FeedClient } from "./FeedClient";

// Fast query — no wallet boost, no shuffle, just recent public root ideas.
// Cached 30s across requests. Cold: ~100-200ms. Cached: ~0ms.
const getCachedFastIdeas = unstable_cache(
  async () => fetchQuery(api.ideas.getPublicIdeasFast, { limit: 20 }),
  ["public-feed-fast"],
  { revalidate: 30 }
);

export async function FeedLoader({ seed }: { seed: number }) {
  const initialIdeas = await getCachedFastIdeas();
  return <FeedClient initialIdeas={initialIdeas as any} seed={seed} />;
}
