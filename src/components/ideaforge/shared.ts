import { industryCardOptions, skillCardOptions } from "@/lib/options";

export const cardSurface =
  "rounded-[16px] border border-white/[0.07] bg-[#111827]/92 shadow-[0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl";
export const transitionBase = "transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]";
export const displayFontClass = "[font-family:var(--font-display)]";
export const codeFontClass = "[font-family:var(--font-code)]";
export const shellMax = "mx-auto w-full max-w-[1440px]";

export const composerCategories = ["SaaS", "AI", "Climate", "Fintech", "Creator Tools", "HealthTech"];
export const stageOptions = ["Concept", "Validated", "MVP", "Launched"];
export const feedTabs = [
  { key: "for-you", label: "For You" },
  { key: "latest", label: "Latest" },
  { key: "hot", label: "Hot This Week" },
  { key: "following", label: "Following" },
] as const;
export const myIdeaTabs = [
  { key: "ideas", label: "My Ideas" },
  { key: "saved", label: "Saved" },
  { key: "drafts", label: "Drafts" },
  { key: "analytics", label: "Analytics" },
] as const;

export type FeedTabKey = (typeof feedTabs)[number]["key"];
export type MyIdeasTabKey = (typeof myIdeaTabs)[number]["key"];
export type ViewMode = "grid" | "list";

export type IdeaAuthor = {
  _id?: string;
  displayName?: string;
  name?: string;
  username?: string;
  avatar?: string;
  role?: string;
};

export type IdeaForgeIdea = {
  _id: string;
  title: string;
  description: string;
  category: string;
  visibility: string;
  sparkCount: number;
  commentCount: number;
  createdAt: number;
  updatedAt: number;
  authorId: string;
  industries?: string;
  attachments?: { name: string; type: string; size: number; url: string; fileId: string }[];
  author?: IdeaAuthor | null;
  contributionCount?: number;
  activeContributions?: number;
};

export type CurrentUserProfile = {
  _id: string;
  clerkId?: string;
  username: string;
  displayName: string;
  avatar?: string;
  role?: string;
  skills?: string[];
  industries?: string[];
  industry?: string;
  xp?: number;
  level?: number;
  followersCount?: number;
  followingCount?: number;
};

export type BuilderSuggestion = {
  _id?: string;
  id?: string;
  username?: string;
  displayName?: string;
  avatar?: string;
  skills?: string[];
};

export interface ComposerDraft {
  title: string;
  description: string;
  tags: string[];
  category: string;
  stage: string;
}

export function getInitials(name?: string) {
  if (!name) return "IF";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatRelativeTime(timestamp: number) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

// Pre-built lookup table of known canonical industry/skill names. Sorted by
// length so the parser greedily matches the longest known name first when a
// raw legacy string is supplied (handles values that contain commas).
const KNOWN_TAGS: string[] = [
  ...industryCardOptions.map((o) => o.value),
  ...skillCardOptions.map((o) => o.value),
].sort((a, b) => b.length - a.length);

/**
 * Parse a stored tag string into an array of clean tag values.
 *
 * Three formats are supported:
 *  1. JSON array (preferred for new posts) — e.g. `["Automobiles, Two...","Social Services, ..."]`
 *  2. Legacy comma-joined string of canonical industry/skill names that may
 *     themselves contain commas — e.g. `"Automobiles, Two Wheelers..., Social Services..."`.
 *     These are reassembled by greedily matching against KNOWN_TAGS.
 *  3. Free-form comma-separated text — fallback simple split.
 */
export function parseTags(tagStr?: string) {
  if (!tagStr) return [] as string[];

  // 1. JSON array form (new posts)
  try {
    const parsed = JSON.parse(tagStr);
    if (Array.isArray(parsed)) {
      return parsed.map((entry) => String(entry).trim()).filter(Boolean);
    }
  } catch {
    // not JSON — fall through
  }

  // 2. Greedy match against canonical names (legacy data with commas inside names)
  const result: string[] = [];
  let remaining = tagStr.trim();

  outer: while (remaining.length > 0) {
    for (const known of KNOWN_TAGS) {
      if (
        remaining === known ||
        remaining.startsWith(known + ",") ||
        remaining.startsWith(known + ", ")
      ) {
        result.push(known);
        remaining = remaining.slice(known.length).replace(/^[\s,]+/, "");
        continue outer;
      }
    }
    // 3. No canonical match — fall back to comma split for the rest of the string.
    const idx = remaining.indexOf(",");
    if (idx >= 0) {
      const part = remaining.slice(0, idx).trim();
      if (part) result.push(part);
      remaining = remaining.slice(idx + 1).trim();
    } else {
      const part = remaining.trim();
      if (part) result.push(part);
      break;
    }
  }
  return result;
}

export function getDisplayName(author?: IdeaAuthor | null) {
  return author?.displayName || author?.name || author?.username || "InteractiveIdeas Builder";
}

export function getRoleBadge(author?: IdeaAuthor | null) {
  const rawRole = (author?.role || "").toLowerCase();
  if (rawRole.includes("admin")) return "AI Curator";
  if (rawRole.includes("moderator")) return "Founder";
  return "Builder";
}

export function getIdeaStage(idea: IdeaForgeIdea) {
  if (idea.visibility === "private") return "Concept Stage";
  if ((idea.sparkCount || 0) >= 12) return "Validated";
  if ((idea.attachments || []).length > 0) return "MVP Ready";
  return "Concept Stage";
}

export function getReadTime(description: string) {
  const words = description.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 120))} min read`;
}

export function getBannerImage(idea: IdeaForgeIdea) {
  return Array.isArray(idea.attachments)
    ? idea.attachments.find((item) => (item.type || "").toLowerCase().startsWith("image/"))?.url
    : undefined;
}

export function matchesSearch(idea: IdeaForgeIdea, searchQuery: string) {
  if (!searchQuery.trim()) return true;
  const needle = searchQuery.toLowerCase();
  const haystack = [
    idea.title,
    idea.description,
    idea.category,
    idea.industries,
    idea.author?.name,
    idea.author?.displayName,
    idea.author?.username,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(needle);
}