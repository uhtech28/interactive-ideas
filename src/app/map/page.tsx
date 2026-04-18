/**
 * World Map Page
 *
 * React page component that mounts the Phaser canvas and manages
 * two-way communication between React/Convex state and Phaser game state.
 *
 * Features:
 * - Phaser game lifecycle management with proper cleanup
 * - Convex data synchronization to Phaser
 * - Event bridge for bidirectional communication
 * - FPS monitoring and debug HUD
 * - Touch-friendly canvas configuration
 *
 * @module app/map/page
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import * as Phaser from "phaser";
import { createGameConfig } from "@/lib/phaser/game-config";
import {
  eventBridge,
  type CheckpointState,
} from "@/lib/phaser/utils/event-bridge";

/**
 * Maps numeric boss IDs (1-12) to string slugs for Phaser
 */
function mapBossIdToSlug(bossId: number): string {
  const mapping: Record<number, string> = {
    1: "unraveller",
    2: "pale_architect",
    3: "hollow_king",
    4: "thornwarden",
    5: "mirror_witch",
    6: "ashen_drake",
    7: "tide_caller",
    8: "gravemind",
    9: "rusted_oracle",
    10: "wraith_council",
    11: "stonecaller",
    12: "veilwalker",
  };
  return mapping[bossId] || "unknown";
}

/**
 * Maps Convex checkpoint status to Phaser-compatible status
 */
function mapCheckpointStatus(
  convexStatus: "not_started" | "in_progress" | "completed" | "skipped",
  t1: boolean,
  t2: boolean,
  t3: boolean,
): CheckpointState["status"] {
  // All tasks completed = gold
  if (t1 && t2 && t3) return "gold";

  // Check Convex status
  if (convexStatus === "completed") return "completed";
  if (convexStatus === "in_progress") return "in_progress";
  if (convexStatus === "skipped") return "locked";
  if (convexStatus === "not_started") return "locked";

  return "locked";
}

/**
 * World Map Page Component
 *
 * Displays the interactive world map using Phaser game engine.
 * Syncs venture progress data from Convex to the Phaser scene.
 *
 * @returns The world map page with embedded Phaser canvas
 */
export default function MapPage() {
  /** Reference to the Phaser game instance */
  const gameRef = useRef<Phaser.Game | null>(null);

  /** Reference to the DOM container for the Phaser canvas */
  const containerRef = useRef<HTMLDivElement>(null);

  /** Whether Phaser scene is ready to receive events */
  const [phaserReady, setPhaserReady] = useState(false);

  /** Current frames per second for performance monitoring */
  const [fps, setFps] = useState(60);

  // Get user's ventures from Convex
  const ventures = useQuery(api.worldMap.getVenturesByUser);
  const activeVenture = ventures?.[0]; // First venture for demo

  // Get world map data for active venture
  const worldMapData = useQuery(
    api.worldMap.getWorldMapData,
    activeVenture ? { ventureId: activeVenture._id } : "skip",
  );

  /**
   * Mount and unmount Phaser game
   *
   * Effect runs once on component mount to:
   * 1. Create Phaser game instance
   * 2. Listen for ready and FPS events
   * 3. Clean up on unmount
   */
  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    // Create Phaser game
    const game = new Phaser.Game(createGameConfig(containerRef.current));
    gameRef.current = game;

    // Listen for Phaser ready signal
    const handleReady = () => setPhaserReady(true);
    const handleFPS = (event: { fps: number }) => setFps(event.fps);

    eventBridge.onReact("PHASER_READY", handleReady);
    eventBridge.onReact("FPS_UPDATE", handleFPS);

    // Cleanup on unmount
    return () => {
      eventBridge.off("PHASER_READY", handleReady);
      eventBridge.off("FPS_UPDATE", handleFPS);
      game.destroy(true);
      gameRef.current = null;
      setPhaserReady(false);
    };
  }, []);

  /**
   * Send venture data to Phaser when ready
   *
   * Effect synchronizes Convex data to Phaser:
   * 1. Sets active venture and persona
   * 2. Updates checkpoint states
   * 3. Applies brightness adjustments
   */
  useEffect(() => {
    if (!phaserReady || !worldMapData) return;

    const { venture, checkpoints, brightness } = worldMapData;

    // Send active venture to Phaser
    eventBridge.dispatchToPhaser({
      type: "SET_ACTIVE_VENTURE",
      ventureId: venture._id,
      personaGender: "male", // TODO: Get from venture.personaId lookup
      assignedBosses: venture.assignedBosses.map(mapBossIdToSlug),
      currentStage: venture.currentStage,
    });

    // Send checkpoint states to Phaser
    const checkpointStates: CheckpointState[] = checkpoints.map((cp) => ({
      id: cp._id,
      stage: cp.stage,
      checkpoint: cp.checkpoint,
      status: mapCheckpointStatus(
        cp.status,
        cp.t1Completed,
        cp.t2Completed,
        cp.t3Completed,
      ),
      t1: cp.t1Completed,
      t2: cp.t2Completed,
      t3: cp.t3Completed,
    }));

    eventBridge.dispatchToPhaser({
      type: "UPDATE_CHECKPOINTS",
      checkpoints: checkpointStates,
    });

    // Send brightness level to Phaser
    eventBridge.dispatchToPhaser({
      type: "UPDATE_BRIGHTNESS",
      brightness: brightness.worldBrightness,
    });
  }, [phaserReady, worldMapData]);

  /**
   * Listen for checkpoint clicks from Phaser
   *
   * Effect handles user interactions in Phaser:
   * - Checkpoint clicks for navigation
   * - Future: Boss interactions, persona clicks, etc.
   */
  useEffect(() => {
    const handleCheckpointClick = (event: {
      checkpointId: string;
      stage: number;
      checkpoint: number;
    }) => {
      console.log("Checkpoint clicked:", event);
      // TODO: Navigate to checkpoint detail page
      // router.push(`/checkpoint/${event.checkpointId}`)
    };

    eventBridge.onReact("CHECKPOINT_CLICKED", handleCheckpointClick);

    return () => {
      eventBridge.off("CHECKPOINT_CLICKED", handleCheckpointClick);
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-slate-950">
      {/* Phaser canvas container */}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ touchAction: "none" }} // Prevent mobile scroll interference
      />

      {/* Debug HUD - shows performance and connection status */}
      <div className="absolute top-4 left-4 text-white/70 text-sm font-mono bg-black/50 px-3 py-2 rounded">
        <div>FPS: {fps}</div>
        <div>Phaser: {phaserReady ? "✓" : "..."}</div>
        <div>
          Venture: {activeVenture ? activeVenture._id.slice(0, 8) : "None"}
        </div>
        <div>
          Brightness:{" "}
          {worldMapData?.brightness.worldBrightness.toFixed(1) ?? "—"}%
        </div>
        <div>Checkpoints: {worldMapData?.checkpoints.length ?? 0}</div>
      </div>

      {/* Loading overlay while Phaser initializes */}
      {!phaserReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80">
          <div className="text-white text-lg">Loading world map...</div>
        </div>
      )}

      {/* Error state if no venture found */}
      {phaserReady && !activeVenture && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80">
          <div className="text-white text-center">
            <p className="text-xl mb-2">No active venture</p>
            <p className="text-sm text-white/60">
              Create a venture to see your world map
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
