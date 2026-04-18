import { v } from "convex/values"
import { query } from "./_generated/server"
import { VENTURE_STAGES } from "./ventureConstants"

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pre-computed brightness values returned alongside world map data.
 * These drive the Phaser post-FX pipeline — no further math required client-side.
 */
export interface BrightnessResult {
  /** Contribution from fully-completed stages. Range: 0–60. */
  accumulatedBase: number
  /** Contribution from task progress within the current stage. Range: 0–40. */
  stageLayer: number
  /** Total world brightness percentage fed to Phaser. Range: 0–100. */
  worldBrightness: number
}

// ─────────────────────────────────────────────────────────────────────────────
// BRIGHTNESS CALCULATION (inline — cannot cross the Convex / src boundary)
//
// Formula (two-layer):
//   accumulated base  = completedStages × (60 / 7)  — capped at 60%
//   stage layer       = (tasksDone / tasksTotal) × 40%
//   world brightness  = accumulated base + stage layer   (0–100%)
//
// Worked examples:
//   Stage 1 start          →  0      ×(60/7) +  0/12 ×40 =  0%
//   Entering Stage 2       →  1      ×(60/7) +  0    ×40 ≈  8.57%
//   Mid-Stage 5 (50% done) →  4      ×(60/7) + 0.5   ×40 ≈ 54.28%
//   All 8 stages complete  →  min(7×(60/7), 60) + 40     = 100%
// ─────────────────────────────────────────────────────────────────────────────

const PER_STAGE_CONTRIBUTION = 60 / 7 // ≈ 8.5714…% per completed stage
const MAX_ACCUMULATED        = 60
const MAX_STAGE_LAYER        = 40

/**
 * Derive brightness inputs from raw ventureCheckpoints rows and the venture's
 * currentStage, then return the three-part BrightnessResult.
 *
 * A "completed stage" is one where every checkpoint for that stage has
 * status === "completed" (or "skipped") and the stage precedes currentStage.
 *
 * Tasks done in the current stage = Σ (t1Completed + t2Completed + t3Completed)
 * across all checkpoints that belong to currentStage.
 */
function computeBrightness(
  checkpoints: Array<{
    stage: number
    checkpoint: number
    status: string
    t1Completed: boolean
    t2Completed: boolean
    t3Completed: boolean
  }>,
  currentStage: number,
): BrightnessResult {
  // ── 1. Count fully-completed prior stages ──────────────────────────────────
  let completedStages = 0

  for (const stageDef of VENTURE_STAGES) {
    if (stageDef.id >= currentStage) break // only look at stages before current

    const stageCheckpoints = checkpoints.filter((cp) => cp.stage === stageDef.id)

    // A stage is "complete" when every one of its checkpoints is done.
    // We guard against the edge-case where rows don't exist yet (e.g. fresh venture).
    const allPresent   = stageCheckpoints.length >= stageDef.checkpoints
    const allCompleted = stageCheckpoints.every(
      (cp) => cp.status === "completed" || cp.status === "skipped",
    )

    if (allPresent && allCompleted) {
      completedStages++
    }
  }

  // ── 2. Count tasks done/total in the current stage ────────────────────────
  const currentStageDef = VENTURE_STAGES.find((s) => s.id === currentStage)
  const totalTasksInCurrentStage = (currentStageDef?.checkpoints ?? 0) * 3 // 3 tasks per checkpoint

  const currentStageCheckpoints = checkpoints.filter((cp) => cp.stage === currentStage)
  let tasksDoneInCurrentStage = 0
  for (const cp of currentStageCheckpoints) {
    if (cp.t1Completed) tasksDoneInCurrentStage++
    if (cp.t2Completed) tasksDoneInCurrentStage++
    if (cp.t3Completed) tasksDoneInCurrentStage++
  }

  // ── 3. Apply formula ───────────────────────────────────────────────────────
  const accumulatedBase = Math.min(completedStages * PER_STAGE_CONTRIBUTION, MAX_ACCUMULATED)

  const stageLayer =
    totalTasksInCurrentStage > 0
      ? (tasksDoneInCurrentStage / totalTasksInCurrentStage) * MAX_STAGE_LAYER
      : 0

  const worldBrightness = Math.min(accumulatedBase + stageLayer, 100)

  return {
    accumulatedBase: Math.round(accumulatedBase * 100) / 100,
    stageLayer:      Math.round(stageLayer      * 100) / 100,
    worldBrightness: Math.round(worldBrightness  * 100) / 100,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch everything the Phaser WorldMap scene needs for a single venture:
 *  - The venture document (stage, checkpoint, status, bosses)
 *  - All ventureCheckpoint rows (one per checkpoint across all 8 stages)
 *  - Pre-computed brightness breakdown (accumulatedBase / stageLayer / worldBrightness)
 *
 * The caller does NOT need to re-implement the brightness formula — simply
 * forward `brightness.worldBrightness` straight to the `EventBridge`.
 *
 * Returns `null` if the venture does not exist.
 */
export const getWorldMapData = query({
  args: {
    ventureId: v.id("ventures"),
  },
  handler: async (ctx, args) => {
    // ── Venture ───────────────────────────────────────────────────────────────
    const venture = await ctx.db.get(args.ventureId)
    if (!venture) return null

    // ── Checkpoints ───────────────────────────────────────────────────────────
    const checkpoints = await ctx.db
      .query("ventureCheckpoints")
      .withIndex("by_venture", (q) => q.eq("ventureId", args.ventureId))
      .collect()

    // ── Brightness ────────────────────────────────────────────────────────────
    const brightness = computeBrightness(checkpoints, venture.currentStage)

    return {
      venture,
      checkpoints,
      brightness,
    }
  },
})

/**
 * Return all ventures that belong to the currently authenticated user.
 *
 * Auth flow:
 *   1. Resolve Clerk identity from the request.
 *   2. Look up the internal user doc via the `by_clerk_id` index.
 *   3. Query the `ventures` table via the `by_user` index.
 *
 * Returns an empty array for unauthenticated requests or users who have
 * not yet completed onboarding (i.e. no matching user row).
 */
export const getVenturesByUser = query({
  args: {},
  handler: async (ctx) => {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const clerkId = identity.subject

    // ── User lookup ───────────────────────────────────────────────────────────
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first()

    if (!user) return []

    // ── Ventures ──────────────────────────────────────────────────────────────
    const ventures = await ctx.db
      .query("ventures")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()

    return ventures
  },
})
