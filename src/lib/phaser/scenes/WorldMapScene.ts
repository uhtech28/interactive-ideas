import * as Phaser from "phaser";
import { AssetLoader } from "../utils/asset-loader";
import { CheckpointNode, CheckpointStatus } from "../entities/Checkpoint";
import { Persona, PersonaGender } from "../entities/Persona";
import { BossSilhouette } from "../entities/Boss";
import { BIOME_PALETTES } from "../utils/biome-textures";

import { eventBridge, type CheckpointState } from "../utils/event-bridge";
import { VENTURE_STAGES } from "@convex/ventureConstants";
import {
  createCheckpointAnimation,
  getAnimationTypeForStage,
  type AnimationVariant,
  type BaseCheckpointAnimation,
} from "./animations";
import {
  VENTURE_BIOMES,
  getBiomeForStage,
  getTotalMapWidth,
  getTotalMapHeight,
  type VentureBiome,
} from "../config/venture-biomes";

/**
 * Main world map scene that displays the venture journey
 * with checkpoints, persona character, and boss silhouettes.
 *
 * @remarks
 * This scene manages:
 * - Checkpoint node visualization and layout
 * - Persona character animation and movement
 * - Boss silhouettes and their status
 * - Dynamic brightness adjustments based on venture progress
 * - Camera panning and scrolling
 * - Two-way communication with React via event bridge
 *
 * @example
 * ```typescript
 * // Scene is automatically instantiated by Phaser
 * // Communicate via event bridge:
 * eventBridge.dispatchToPhaser({
 *   type: 'UPDATE_CHECKPOINTS',
 *   checkpoints: [...]
 * })
 * ```
 */
export class WorldMapScene extends Phaser.Scene {
  /** Map of checkpoint IDs to their visual node instances */
  private checkpointNodes: Map<string, CheckpointNode>;

  /** The player's persona character */
  private persona: Persona | null;

  /** Map of boss IDs to their silhouette instances */
  private bosses: Map<string, BossSilhouette>;

  /** Container for static background elements */
  private backgroundLayer!: Phaser.GameObjects.Container;

  /** Container for midground parallax layer */
  private midgroundLayer!: Phaser.GameObjects.Container;

  /** Container for interactive game elements (checkpoints, persona, bosses) */
  private gameLayer!: Phaser.GameObjects.Container;

  /** Container for animation overlays (displayed on top of everything) */
  private animationLayer!: Phaser.GameObjects.Container;

  /** Currently playing checkpoint animation instance */
  private currentAnimation: BaseCheckpointAnimation | null = null;

  /** Current brightness filter applied to the scene */
  private brightnessFilter: unknown;

  /** Currently active venture ID */
  private currentVentureId: string | null;

  /** Bound event handler references for cleanup */
  private boundHandlers: {
    updateBrightness?: (event: { brightness: number }) => void;
    updateCheckpoints?: (event: { checkpoints: CheckpointState[] }) => void;
    setActiveVenture?: (event: {
      ventureId: string;
      personaGender: "male" | "female";
      assignedBosses?: string[];
      currentStage?: number;
    }) => void;
    scrollToCheckpoint?: (event: { checkpointId: string }) => void;
    playCheckpointAnimation?: (event: {
      checkpointId: string;
      stage: number;
      variant: "standard" | "gold";
    }) => void;
  };

  /** Adventure map layout constants */
  private readonly MAP_WIDTH = getTotalMapWidth();
  private readonly MAP_HEIGHT = getTotalMapHeight();
  private readonly BIOME_PADDING = 100;

  /** Vivid Among Us room colors (brighter, more saturated) */
  private readonly ROOM_BRIGHT_COLORS: Record<number, number> = {};

  /** Camera state tracking */
  private cameraTarget: { x: number; y: number } | null = null;
  private cameraFollowSpeed = 0.05;

  /** Biome background system with enhanced colors */
  private biomeBackgrounds: Phaser.GameObjects.TileSprite[] = [];

  /** Biome crossfade tracking */
  private currentBiome: number = 1;
  private previousBiome: number = 1;
  private crossfadeTween: Phaser.Tweens.Tween | null = null;

  /** Lazy loading system for biomes */
  private loadedBiomes: Set<number> = new Set();
  private biomeContainers: Map<number, Phaser.GameObjects.Container> =
    new Map();

  /**
   * Creates a new WorldMapScene instance
   */
  constructor() {
    super({ key: "WorldMap" });
    this.checkpointNodes = new Map();
    this.persona = null;
    this.bosses = new Map();
    this.currentVentureId = null;
    this.boundHandlers = {};
  }

  /**
   * Preload phase - loads all required assets
   *
   * @remarks
   * Uses AssetLoader to procedurally generate all textures
   * instead of loading from files for better performance
   */
  preload(): void {
    AssetLoader.preloadAssets(this);
    AssetLoader.createAllTextures(this);
    this.load.image("bg_garage", "/assets/maps/garage.png");
    this.load.image("bg_summit", "/assets/maps/summit.png");
  }

  /**
   * Create phase - initializes the scene and sets up event listeners
   *
   * @remarks
   * - Creates layered containers for depth sorting
   * - Sets up event bridge listeners for React communication
   * - Configures camera bounds and scrolling
   * - Starts FPS monitoring
   */
  create(): void {
    // Initialize layer containers for parallax scrolling system
    // Background layer (depth 0) - furthest, contains distant space elements
    this.backgroundLayer = this.add.container(0, 0);
    this.backgroundLayer.setDepth(0);

    // Midground layer (depth 5) - middle distance, contains medium-range stars
    this.midgroundLayer = this.add.container(0, 0);
    this.midgroundLayer.setDepth(5);

    // Game layer (depth 10) - foreground, contains interactive elements
    this.gameLayer = this.add.container(0, 0);
    this.gameLayer.setDepth(10);

    this.animationLayer = this.add.container(0, 0);
    this.animationLayer.setDepth(100);

    // Create premium space background with nebulas and stars
    this.createAdventureBackground();

    // Create biome zones (glassmorphism cards)
    this.createBiomeZones();

    // Draw modern connection paths between biomes
    this.createAdventurePath();

    // Bind event handlers
    this.boundHandlers.updateBrightness =
      this.handleUpdateBrightness.bind(this);
    this.boundHandlers.updateCheckpoints =
      this.handleUpdateCheckpoints.bind(this);
    this.boundHandlers.setActiveVenture =
      this.handleSetActiveVenture.bind(this);
    this.boundHandlers.scrollToCheckpoint =
      this.handleScrollToCheckpoint.bind(this);
    this.boundHandlers.playCheckpointAnimation =
      this.handlePlayCheckpointAnimation.bind(this);

    // Setup event listeners from React
    eventBridge.onPhaser(
      "UPDATE_BRIGHTNESS",
      this.boundHandlers.updateBrightness,
    );
    eventBridge.onPhaser(
      "UPDATE_CHECKPOINTS",
      this.boundHandlers.updateCheckpoints,
    );
    eventBridge.onPhaser(
      "SET_ACTIVE_VENTURE",
      this.boundHandlers.setActiveVenture,
    );
    eventBridge.onPhaser(
      "SCROLL_TO_CHECKPOINT",
      this.boundHandlers.scrollToCheckpoint,
    );
    eventBridge.onPhaser(
      "PLAY_CHECKPOINT_ANIMATION",
      this.boundHandlers.playCheckpointAnimation,
    );

    // Setup camera for adventure map (vertical-scrolling view)
    this.cameras.main.setBounds(0, 0, this.MAP_WIDTH, this.MAP_HEIGHT);
    this.cameras.main.setBackgroundColor("#fbbf24"); // Amber 400

    // Zoom scaled slightly out to see snaking path
    this.cameras.main.setZoom(0.85);

    // Start camera at the BOTTOM (Start)
    this.cameras.main.centerOn(
      this.MAP_WIDTH / 2,
      VENTURE_BIOMES[0].y + VENTURE_BIOMES[0].height - 400,
    );

    // Enable smooth camera lerp (no target object, just for lerp settings)
    // Note: We use pan() for actual camera movements
    this.cameras.main.setLerp(this.cameraFollowSpeed, this.cameraFollowSpeed);

    // Enable camera drag controls for better visibility
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.cameras.main.stopFollow();
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        this.cameras.main.scrollX -=
          (pointer.x - pointer.prevPosition.x) / this.cameras.main.zoom;
        this.cameras.main.scrollY -=
          (pointer.y - pointer.prevPosition.y) / this.cameras.main.zoom;
      }
    });

    // Always fully bright — the brightness system controls scene overlays,
    // but we never dim the map itself below full visibility.
    if (this.cameras.main.postFX) {
      this.cameras.main.postFX.clear();
      // Slight contrast boost for richer colors
      this.cameras.main.postFX.addColorMatrix().contrast(0.15);
    }

    // Signal React that Phaser is ready
    eventBridge.dispatchToReact({ type: "PHASER_READY" });

    // FPS monitoring for performance tracking
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        eventBridge.dispatchToReact({
          type: "FPS_UPDATE",
          fps: Math.round(this.game.loop.actualFps),
        });
      },
    });
  }

  /**
   * Handles brightness update events from React
   *
   * @param event - Event containing brightness value (0-100)
   *
   * @remarks
   * Applies brightness and contrast adjustments to the main camera
   * using post-processing effects. Adds a base brightness of 0.8 to ensure
   * the map is always visible even at 0% progress.
   */
  private handleUpdateBrightness(event: { brightness: number }): void {
    try {
      // Brightness from React is 0–100. We only apply a slight tint for
      // dramatic effect at very low progress. Map is always fully visible.
      const rawBrightness = event.brightness / 100; // 0.0 → 1.0
      const boost = 0.95 + rawBrightness * 0.1; // 0.95 → 1.05
      if (this.cameras.main.postFX) {
        this.cameras.main.postFX.clear();
        this.cameras.main.postFX.addColorMatrix().contrast(0.15);
        // At very low brightness (< 10%) add a slight desaturation only
        if (rawBrightness < 0.1) {
          this.cameras.main.postFX.addColorMatrix().saturate(-0.3, false);
        }
      }
    } catch (error) {
      console.warn("[WorldMapScene] Failed to update brightness:", error);
    }
  }

  /**
   * Handles checkpoint update events from React
   *
   * @param event - Event containing array of checkpoint states
   *
   * @remarks
   * - Destroys all existing checkpoint nodes
   * - Creates new nodes based on provided state
   * - Lays out checkpoints in a snake pattern
   * - Sets up click handlers for each checkpoint
   */
  private handleUpdateCheckpoints(event: {
    checkpoints: CheckpointState[];
  }): void {
    try {
      // Validate checkpoint data
      if (!Array.isArray(event.checkpoints)) {
        console.warn(
          "[WorldMapScene] Invalid checkpoint data - expected array",
        );
        return;
      }

      // Clear existing checkpoints
      this.checkpointNodes.forEach((node) => node.destroy());
      this.checkpointNodes.clear();

      // Create checkpoints in snake path layout
      event.checkpoints.forEach((cp, index) => {
        // Validate checkpoint structure
        if (
          !cp.id ||
          typeof cp.stage !== "number" ||
          typeof cp.checkpoint !== "number"
        ) {
          console.warn("[WorldMapScene] Invalid checkpoint structure:", cp);
          return;
        }

        const { x, y } = this.calculateCheckpointPosition(
          cp.stage,
          cp.checkpoint,
          index,
        );

        const node = new CheckpointNode(this, {
          id: cp.id,
          stage: cp.stage,
          checkpoint: cp.checkpoint,
          status: cp.status as CheckpointStatus,
          x,
          y,
          t1: cp.t1,
          t2: cp.t2,
          t3: cp.t3,
          globalIndex: index + 1,
        });

        // Setup click interaction
        node.setInteractive();
        node.on(
          "checkpoint_clicked",
          (data: { id: string; stage: number; checkpoint: number }) => {
            eventBridge.dispatchToReact({
              type: "CHECKPOINT_CLICKED",
              checkpointId: data.id,
              stage: data.stage,
              checkpoint: data.checkpoint,
            });
          },
        );

        this.gameLayer.add(node);
        this.checkpointNodes.set(cp.id, node);
      });
    } catch (error) {
      console.warn("[WorldMapScene] Failed to update checkpoints:", error);
    }
  }

  /**
   * Handles active venture selection from React
   *
   * @param event - Event containing venture ID and persona gender
   *
   * @remarks
   * Creates the persona character if it doesn't exist yet
   * Updates the current venture ID for tracking
   */
  private handleSetActiveVenture(event: {
    ventureId: string;
    personaGender: "male" | "female";
    assignedBosses?: string[];
    currentStage?: number;
  }): void {
    try {
      this.currentVentureId = event.ventureId;

      // Create persona if doesn't exist
      if (!this.persona) {
        this.persona = new Persona(
          this,
          0,
          0,
          event.personaGender as PersonaGender,
        );
        this.gameLayer.add(this.persona);
      }

      // Create bosses
      if (event.assignedBosses && event.assignedBosses.length > 0) {
        this.createBossSilhouettes(event.assignedBosses);

        // Update boss opacity based on current stage
        if (event.currentStage) {
          this.updateBossOpacity(event.currentStage);
        }
      }

      // Position persona on active checkpoint
      this.positionPersonaOnActiveCheckpoint();

      // Auto-scroll to active checkpoint after a short delay
      this.time.delayedCall(500, () => {
        this.autoScrollToActive();
      });
    } catch (error) {
      console.warn("[WorldMapScene] Failed to set active venture:", error);
    }
  }

  /**
   * Position persona above the active checkpoint
   */
  private positionPersonaOnActiveCheckpoint(): void {
    if (!this.persona) return;

    // Find active checkpoint
    for (const [id, node] of this.checkpointNodes.entries()) {
      const status = node.status; // Use public getter
      if (status === "active" || status === "in_progress") {
        // Position persona 80px above the checkpoint
        this.persona.setPosition(node.x, node.y - 80);
        this.persona.playIdle();
        return;
      }
    }

    // Default: position on first checkpoint if no active found
    const firstNode = Array.from(this.checkpointNodes.values())[0];
    if (firstNode) {
      this.persona.setPosition(firstNode.x, firstNode.y - 80);
      this.persona.playIdle();
    }
  }

  /**
   * Animate persona walking to next stage's first checkpoint
   *
   * @param fromCheckpointId - ID of the checkpoint to walk from
   * @param toCheckpointId - ID of the checkpoint to walk to
   */
  private animateStageTransition(
    fromCheckpointId: string,
    toCheckpointId: string,
  ): void {
    const fromNode = this.checkpointNodes.get(fromCheckpointId);
    const toNode = this.checkpointNodes.get(toCheckpointId);

    if (!fromNode || !toNode || !this.persona) return;

    const targetX = toNode.x;
    const targetY = toNode.y - 80; // 80px above checkpoint

    // Calculate duration based on distance
    const distance = Phaser.Math.Distance.Between(
      this.persona.x,
      this.persona.y,
      targetX,
      targetY,
    );
    const duration = Math.max(1000, distance * 2); // 2ms per pixel, min 1s

    // Walk to new checkpoint
    this.persona.moveToPosition(targetX, targetY, duration);

    // Pan camera to follow
    this.cameras.main.pan(targetX, targetY, duration, "Sine.easeInOut");
  }

  /**
   * Handles camera scroll requests to specific checkpoints
   *
   * @param event - Event containing checkpoint ID to scroll to
   *
   * @remarks
   * Smoothly pans the camera to center on the requested checkpoint
   * using a sine ease for natural movement
   */
  private handleScrollToCheckpoint(event: { checkpointId: string }): void {
    try {
      this.scrollToCheckpoint(event.checkpointId, true);
    } catch (error) {
      console.warn("[WorldMapScene] Failed to scroll to checkpoint:", error);
    }
  }

  /**
   * Scroll camera to show a specific checkpoint
   *
   * @param checkpointId - ID of the checkpoint to scroll to
   * @param smooth - Whether to use smooth panning (default: true)
   */
  private scrollToCheckpoint(checkpointId: string, smooth = true): void {
    const node = this.checkpointNodes.get(checkpointId);
    if (!node) return;

    const targetX = node.x;
    const targetY = node.y;

    if (smooth) {
      this.cameras.main.pan(
        targetX,
        targetY,
        1000, // 1 second duration
        "Sine.easeInOut",
        false,
      );
    } else {
      this.cameras.main.centerOn(targetX, targetY);
    }
  }

  /**
   * Auto-scroll to active checkpoint when venture loads
   */
  private autoScrollToActive(): void {
    // Find the first active or in_progress checkpoint
    for (const [id, node] of this.checkpointNodes.entries()) {
      // Use the public status getter
      if (node.status === "active" || node.status === "in_progress") {
        this.scrollToCheckpoint(id, true);
        break;
      }
    }
  }

  /**
   * Handles checkpoint animation requests from React
   *
   * @param event - Event containing checkpoint ID, stage, and variant
   *
   * @remarks
   * Triggers the appropriate animation based on stage number
   * and variant (standard blue or gold amber)
   */
  private handlePlayCheckpointAnimation(event: {
    checkpointId: string;
    stage: number;
    variant: "standard" | "gold";
  }): void {
    try {
      this.playCheckpointAnimation(
        event.checkpointId,
        event.stage,
        event.variant,
      );
    } catch (error) {
      console.warn(
        "[WorldMapScene] Failed to play checkpoint animation:",
        error,
      );
    }
  }

  /**
   * Create boss silhouettes at stage boundaries
   *
   * @param assignedBosses - Array of boss IDs assigned to this venture
   */
  private createBossSilhouettes(assignedBosses: string[]): void {
    // Clear existing bosses
    this.bosses.forEach((boss) => boss.destroy());
    this.bosses.clear();

    // Super Boss (at the very top of the map - the Final Island)
    if (assignedBosses.length > 0) {
      const superBossX = this.MAP_WIDTH / 2;
      const superBossY = 100; // Right at the finish line

      const superBoss = new BossSilhouette(this, {
        bossId: assignedBosses[0],
        bossName: this.getBossName(assignedBosses[0]),
        status: "silhouette",
        x: superBossX,
        y: superBossY,
      });

      this.gameLayer.add(superBoss);
      this.bosses.set("super_boss", superBoss);
    }

    // 8 Mini-bosses (one per stage, at stage boundaries)
    const miniBossNames = [
      "Fog of Vagueness",
      "Pathwarden Wraith",
      "Advocate of Comfortable Lies",
      "Unfinished Golem",
      "Collapse Specter",
      "Harbourmaster",
      "Babel Merchant",
      "Iron Bureaucrat",
    ];

    for (let stage = 1; stage <= 2; stage++) {
      // Position near the last checkpoint of this stage dynamically
      const lastCheckpoint = this.getCheckpointsForStage(stage);
      const cpPos = this.calculateCheckpointPosition(stage, lastCheckpoint, 0);

      const x = cpPos.x + 70; // Slightly past the last checkpoint
      const y = cpPos.y - 40; // Slightly above

      const miniBoss = new BossSilhouette(this, {
        bossId: `mini_boss_${stage}`,
        bossName: miniBossNames[stage - 1],
        status: "silhouette",
        x,
        y,
      });

      // Scale down mini-bosses
      miniBoss.setScale(0.6);

      this.gameLayer.add(miniBoss);
      this.bosses.set(`mini_boss_${stage}`, miniBoss);
    }
  }

  /**
   * Update boss opacity based on venture progress
   *
   * @param currentStage - Current active stage (1-8)
   */
  private updateBossOpacity(currentStage: number): void {
    // Super Boss opacity progression
    const superBoss = this.bosses.get("super_boss");
    if (superBoss) {
      if (currentStage >= 7) {
        superBoss.updateStatus("foreground");
      } else if (currentStage >= 5) {
        superBoss.updateStatus("present");
      } else {
        superBoss.updateStatus("silhouette");
      }
    }

    // Mini-boss opacity (becomes visible when stage is active)
    for (let stage = 1; stage <= 2; stage++) {
      const miniBoss = this.bosses.get(`mini_boss_${stage}`);
      if (miniBoss) {
        if (currentStage === stage) {
          miniBoss.updateStatus("present");
        } else if (currentStage > stage) {
          miniBoss.updateStatus("slain");
        } else {
          miniBoss.updateStatus("silhouette");
        }
      }
    }
  }

  /**
   * Get friendly boss name from ID
   *
   * @param bossId - The boss identifier
   * @returns Friendly display name
   */
  private getBossName(bossId: string): string {
    const names: Record<string, string> = {
      unraveller: "The Unraveller",
      pale_architect: "The Pale Architect",
      gravemind: "The Gravemind",
    };
    return names[bossId] || "???";
  }

  /**
   * Calculate checkpoint position using organic path through 8 biomes
   *
   * The path flows left-to-right through biome zones with natural
   * sine wave pattern for visual interest.
   */
  private calculateCheckpointPosition(
    stage: number,
    checkpoint: number,
    _globalIndex: number,
  ): { x: number; y: number } {
    const biome = getBiomeForStage(stage);
    if (!biome) return { x: 0, y: 0 };

    // Calculate global cumulative index directly
    let globalProgressIndex = 0;
    for (let s = 1; s < stage; s++) {
      globalProgressIndex += this.getCheckpointsForStage(s);
    }
    globalProgressIndex += checkpoint - 1;

    // Total checkpoints is 8
    const TOTAL_CHECKPOINTS = 8;
    const pathProgress = globalProgressIndex / (TOTAL_CHECKPOINTS - 1); // 0.0 to 1.0

    // Vertical padding so starting and ending nodes aren't touching edges
    const yPadding = 200;
    const usableHeight = biome.height - yPadding * 2;

    // Y axis moves from BOTTOM to TOP
    const baseY =
      biome.y + biome.height - yPadding - usableHeight * pathProgress;

    // X axis snakes back and forth with a sine wave
    const centerX = biome.x + biome.width / 2;
    // 5 full sweeps left-to-right over the entire map length
    const waveOffset =
      Math.sin(pathProgress * Math.PI * 5) * (biome.width * 0.35);

    // Organic micro-randomness to make the islands feel naturally placed
    const seed = stage * 100 + checkpoint;
    const randomX = (Math.sin(seed) * 0.5 + 0.5) * 40 - 20;
    const randomY = (Math.cos(seed) * 0.5 + 0.5) * 40 - 20;

    return {
      x: centerX + waveOffset + randomX,
      y: baseY + randomY,
    };
  }

  /**
   * Gets the number of checkpoints for a given stage
   *
   * @param stage - Stage number (1-based)
   * @returns Number of checkpoints in that stage
   *
   * @remarks
   * Retrieves checkpoint counts from VENTURE_STAGES constant:
   * [4, 5, 4, 5, 6, 3, 4, 5] for stages 1-8
   */
  private getCheckpointsForStage(stage: number): number {
    const stageData = VENTURE_STAGES.find((s) => s.id === stage);
    return stageData?.checkpoints || 4;
  }

  /**
   * Draws a cubic bezier curve on a Graphics object using lineTo steps.
   * Phaser 3 Graphics has no native bezierCurveTo, so we approximate it.
   *
   * @param g      - The Phaser Graphics instance (path must already be open)
   * @param x0     - Start X (current pen position)
   * @param y0     - Start Y (current pen position)
   * @param cp1x   - Control point 1 X
   * @param cp1y   - Control point 1 Y
   * @param cp2x   - Control point 2 X
   * @param cp2y   - Control point 2 Y
   * @param x1     - End X
   * @param y1     - End Y
   * @param steps  - Number of line segments (higher = smoother)
   */
  private cubicBezierPath(
    g: Phaser.GameObjects.Graphics,
    x0: number,
    y0: number,
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x1: number,
    y1: number,
    steps = 14,
  ): void {
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const mt = 1 - t;
      const bx =
        mt * mt * mt * x0 +
        3 * mt * mt * t * cp1x +
        3 * mt * t * t * cp2x +
        t * t * t * x1;
      const by =
        mt * mt * mt * y0 +
        3 * mt * mt * t * cp1y +
        3 * mt * t * t * cp2y +
        t * t * t * y1;
      g.lineTo(bx, by);
    }
  }

  /**
   * Create Among Us style spaceship rooms with metallic industrial aesthetic
   */
  /**
   * LAZY LOADING INITIALIZATION (Week 2 Day 10)
   *
   * Instead of loading all 8 rooms at once, we only load the initial room
   * (stage 1). Additional rooms are loaded dynamically as the camera approaches
   * them via the checkBiomeLoading() method called in update().
   *
   * Performance improvement:
   * - Before: All 8 rooms created in create() = slower initial load
   * - After: Only 1 room created initially = much faster startup
   * - Additional rooms loaded on-demand = smooth, imperceptible loading
   */
  /**
   * Create adventure biome zones (replaces spaceship rooms)
   */
  private createBiomeZones(): void {
    // Load only the starting biome (stage 1, index 0)
    console.log("[LAZY LOADING] Initializing with only first biome (index 0)");
    this.loadBiomeForStage(0);
  }

  /**
   * LAZY LOADING ROOM CREATOR (Week 2 Day 10)
   *
   * Loads a single room by index. This is called both during initialization
   * and dynamically as the camera approaches new areas.
   *
   * @param index - Index into VENTURE_ROOMS array (0-7)
   */
  /**
   * LAZY LOADING BIOME CREATOR
   *
   * Loads a single biome by index. This is called both during initialization
   * and dynamically as the camera approaches new areas.
   *
   * @param index - Index into VENTURE_BIOMES array (0-7)
   */
  private loadBiomeForStage(index: number): void {
    // Prevent duplicate loading
    if (this.loadedBiomes.has(index)) {
      return;
    }

    // Validate index
    if (index < 0 || index >= VENTURE_BIOMES.length) {
      return;
    }

    const biome = VENTURE_BIOMES[index];
    console.log(
      `[LAZY LOADING] Loading biome ${index}: ${biome.biomeName} at (${biome.x}, ${biome.y})`,
    );
    const biomeContainer = this.add.container(biome.x, biome.y);
    this.backgroundLayer.add(biomeContainer);

    // Ocean is drawn automatically via camera background.
    // There are no static pre-rendered backgrounds for the Archipelago,
    // everything is drawn procedurally (islands, bridges).

    // Track that this biome has been loaded
    this.loadedBiomes.add(index);
    this.biomeContainers.set(index, biomeContainer);
    console.log(
      `[LAZY LOADING] Biome ${index} loaded successfully. Total loaded: ${this.loadedBiomes.size}/8`,
    );
  }

  /**
   * Add modern tech-themed decorations
   * (Disabled for RPG map styling overhaul)
   */
  private addBiomeDecorations(
    container: Phaser.GameObjects.Container,
    biome: VentureBiome,
  ): void {
    // Intentionally empty. We rely completely on the high fidelity
    // background images. Procedural strokes clash with pixel art.
  }

  /**
   * LAZY LOADING PROXIMITY CHECK (Week 2 Day 10)
   *
   * Checks camera position and loads any nearby rooms that aren't yet loaded.
   * Called every frame in update() to ensure smooth, just-in-time loading.
   *
   * Buffer zone: 800px - rooms load when camera gets within this distance
   * This ensures rooms appear before they're visible to the player.
   */
  private checkBiomeLoading(): void {
    const cam = this.cameras.main;
    const camX = cam.scrollX + cam.width / 2;
    const camY = cam.scrollY + cam.height / 2;

    // Check each biome to see if it's within loading distance
    for (let i = 0; i < VENTURE_BIOMES.length; i++) {
      // Skip if already loaded
      if (this.loadedBiomes.has(i)) {
        continue;
      }

      const biome = VENTURE_BIOMES[i];

      // Calculate distance from camera center to biome center
      const biomeCenterX = biome.x + biome.width / 2;
      const biomeCenterY = biome.y + biome.height / 2;
      const distance = Math.sqrt(
        Math.pow(camX - biomeCenterX, 2) + Math.pow(camY - biomeCenterY, 2),
      );

      // Load biome if within buffer zone (1000px for larger biomes)
      const LOAD_BUFFER = 1000;
      if (distance < LOAD_BUFFER) {
        console.log(
          `[LAZY LOADING] Biome ${i} (${biome.biomeName}) within range (${Math.round(distance)}px), loading...`,
        );
        this.loadBiomeForStage(i);
      }
    }
  }

  /**
   * Create spaceship background with stars (Among Us style)
   *
   * Implements 3-layer parallax system:
   * - Background layer (0.3x parallax): Distant stars, nebula gradients
   * - Midground layer (0.6x parallax): Medium stars, colored particles
   * - Foreground (1.0x, no parallax): Bright stars with sparkles
   */
  /**
   * Create premium game-like background with stunning visuals
   * Theme: Deep space with nebula clouds, stars, and dynamic lighting
   */
  private createAdventureBackground(): void {
    // LEVEL DEVIL STYLE BACKGROUND
    const bg = this.add.graphics();

    // Base solid orange/yellow color
    bg.fillStyle(0xfbbf24, 1); // Amber 400
    bg.fillRect(0, 0, this.MAP_WIDTH, this.MAP_HEIGHT);
    bg.setDepth(-200);
    this.backgroundLayer.add(bg);

    // Jagged spikes at the top and bottom of the map
    const spikes = this.add.graphics();
    spikes.fillStyle(0xb45309, 1); // Amber 700

    // Top spikes
    spikes.beginPath();
    spikes.moveTo(0, 0);
    for (let x = 0; x <= this.MAP_WIDTH; x += 30) {
      spikes.lineTo(x, 40 + Math.random() * 60);
      spikes.lineTo(x + 15, Math.random() * 20);
    }
    spikes.lineTo(this.MAP_WIDTH, 0);
    spikes.closePath();
    spikes.fillPath();

    // Bottom spikes
    spikes.beginPath();
    spikes.moveTo(0, this.MAP_HEIGHT);
    for (let x = 0; x <= this.MAP_WIDTH; x += 30) {
      spikes.lineTo(x, this.MAP_HEIGHT - (40 + Math.random() * 60));
      spikes.lineTo(x + 15, this.MAP_HEIGHT - Math.random() * 20);
    }
    spikes.lineTo(this.MAP_WIDTH, this.MAP_HEIGHT);
    spikes.closePath();
    spikes.fillPath();

    spikes.setDepth(-190);
    this.backgroundLayer.add(spikes);

    // Add LEVEL DEVIL Title text at the very top of the map
    const titleText = this.add
      .text(this.MAP_WIDTH / 2, 120, "LEVEL DEVIL", {
        fontFamily: '"Press Start 2P", monospace, sans-serif',
        fontSize: "80px",
        fontStyle: "bold",
        color: "#ef4444", // Red text
      })
      .setOrigin(0.5);

    // Title shadow/drop-shadow effect
    const titleShadow = this.add
      .text(this.MAP_WIDTH / 2 + 6, 126, "LEVEL DEVIL", {
        fontFamily: '"Press Start 2P", monospace, sans-serif',
        fontSize: "80px",
        fontStyle: "bold",
        color: "#7f1d1d", // Dark red shadow
      })
      .setOrigin(0.5);

    this.backgroundLayer.add(titleShadow);
    this.backgroundLayer.add(titleText);

    // Subtitle
    const subTitle = this.add
      .text(this.MAP_WIDTH / 2, 200, "by Unept", {
        fontFamily: '"Press Start 2P", monospace, sans-serif',
        fontSize: "24px",
        color: "#b45309",
      })
      .setOrigin(0.5);
    this.backgroundLayer.add(subTitle);

    this.cameras.main.setBackgroundColor("#fbbf24");
  }

  /**
   * Procedural Island Generation
   * Draws wooden bridges connecting all checkpoints and draws a sandy
   * island base beneath each checkpoint coordinate.
   */
  private createAdventurePath(): void {
    const environmentGraphics = this.add.graphics();
    const TOTAL_CHECKPOINTS = 8;

    const checkpointCoords: { x: number; y: number }[] = [];

    // Calculate all 8 coordinates first
    let currentStage = 1;
    let checkpointsInCurrentStageCount = 0;

    for (let i = 0; i < TOTAL_CHECKPOINTS; i++) {
      const stageCheckpoints = this.getCheckpointsForStage(currentStage);
      checkpointsInCurrentStageCount++;

      const pos = this.calculateCheckpointPosition(
        currentStage,
        checkpointsInCurrentStageCount,
        i,
      );
      checkpointCoords.push(pos);

      if (checkpointsInCurrentStageCount >= stageCheckpoints) {
        currentStage++;
        checkpointsInCurrentStageCount = 0;
      }
    }

    // DRAW START SIGN (Bottom)
    const startPos = checkpointCoords[0];
    const startSign = this.add.container(startPos.x - 140, startPos.y + 60);
    const startGfx = this.add.graphics();
    startGfx.fillStyle(0xef4444, 1); // Red background
    startGfx.fillRoundedRect(0, 0, 140, 50, 16);
    startGfx.lineStyle(4, 0x7f1d1d, 1); // Dark red border
    startGfx.strokeRoundedRect(0, 0, 140, 50, 16);
    const startTxt = this.add
      .text(70, 25, "LEVEL 1", {
        fontFamily: '"Press Start 2P", "Courier New", Courier, monospace',
        fontSize: "18px",
        fontStyle: "900",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    startSign.add([startGfx, startTxt]);
    this.backgroundLayer.add(startSign);

    // DRAW FINISH SIGN (Top)
    const finishPos = checkpointCoords[checkpointCoords.length - 1];
    const finishSign = this.add.container(finishPos.x + 60, finishPos.y - 30);
    const finishGfx = this.add.graphics();
    finishGfx.fillStyle(0x3b82f6, 1); // Blue background
    finishGfx.fillRoundedRect(0, 0, 100, 50, 12);
    finishGfx.lineStyle(4, 0x1e3a8a, 1); // Dark blue border
    finishGfx.strokeRoundedRect(0, 0, 100, 50, 12);

    // Draw simple right arrow in finish sign
    const arrow = this.add.graphics();
    arrow.fillStyle(0xffffff, 1);
    arrow.beginPath();
    arrow.moveTo(30, 20);
    arrow.lineTo(60, 20);
    arrow.lineTo(60, 15);
    arrow.lineTo(75, 25);
    arrow.lineTo(60, 35);
    arrow.lineTo(60, 30);
    arrow.lineTo(30, 30);
    arrow.closePath();
    arrow.fillPath();

    finishSign.add([finishGfx, arrow]);
    this.backgroundLayer.add(finishSign);

    // Pre-calculate control points so both path layers use identical curves
    const pathSegments: {
      c1x: number;
      c1y: number;
      cp1x: number;
      cp1y: number;
      cp2x: number;
      cp2y: number;
      c2x: number;
      c2y: number;
    }[] = [];
    for (let i = 1; i < checkpointCoords.length; i++) {
      const c1x = checkpointCoords[i - 1].x;
      const c1y = checkpointCoords[i - 1].y;
      const c2x = checkpointCoords[i].x;
      const c2y = checkpointCoords[i].y;
      pathSegments.push({
        c1x,
        c1y,
        cp1x: c1x + (c2x - c1x) * 0.25 + (Math.random() * 60 - 30),
        cp1y: c1y + (c2y - c1y) * 0.25,
        cp2x: c1x + (c2x - c1x) * 0.75 + (Math.random() * 60 - 30),
        cp2y: c1y + (c2y - c1y) * 0.75,
        c2x,
        c2y,
      });
    }

    // LAYER 1: Draw the Path (Dirt track)
    // Outer border (dark brown)
    environmentGraphics.lineStyle(24, 0x78350f, 1); // Amber 900
    environmentGraphics.beginPath();
    environmentGraphics.moveTo(checkpointCoords[0].x, checkpointCoords[0].y);
    for (const seg of pathSegments) {
      this.cubicBezierPath(
        environmentGraphics,
        seg.c1x,
        seg.c1y,
        seg.cp1x,
        seg.cp1y,
        seg.cp2x,
        seg.cp2y,
        seg.c2x,
        seg.c2y,
      );
    }
    environmentGraphics.strokePath();

    // Inner dirt path
    environmentGraphics.lineStyle(16, 0xd97706, 1); // Amber 600
    environmentGraphics.beginPath();
    environmentGraphics.moveTo(checkpointCoords[0].x, checkpointCoords[0].y);
    for (const seg of pathSegments) {
      this.cubicBezierPath(
        environmentGraphics,
        seg.c1x,
        seg.c1y,
        seg.cp1x,
        seg.cp1y,
        seg.cp2x,
        seg.cp2y,
        seg.c2x,
        seg.c2y,
      );
    }
    environmentGraphics.strokePath();

    // LAYER 2: Draw Tombstones beneath each checkpoint
    for (let i = 0; i < checkpointCoords.length; i++) {
      const pos = checkpointCoords[i];

      // Tombstone base
      environmentGraphics.fillStyle(0x78350f, 1); // Amber 900

      // Draw tombstone shape (arch top, flat bottom)
      const width = 80;
      const height = 90;
      const x = pos.x - width / 2;
      const y = pos.y - height / 2;

      environmentGraphics.beginPath();
      environmentGraphics.moveTo(x, y + height);
      environmentGraphics.lineTo(x, y + 30);
      // Top arch
      environmentGraphics.arc(
        x + width / 2,
        y + 30,
        width / 2,
        Math.PI,
        0,
        false,
      );
      environmentGraphics.lineTo(x + width, y + height);
      environmentGraphics.closePath();
      environmentGraphics.fillPath();

      // Little dirt pile at base
      environmentGraphics.fillStyle(0x92400e, 1); // Amber 800
      environmentGraphics.fillEllipse(
        pos.x,
        pos.y + height / 2,
        width + 20,
        20,
      );
    }

    environmentGraphics.setDepth(-10);
    this.backgroundLayer.add(environmentGraphics);
  }

  /**
   * Draw modern tech-style path with glow effect
   */
  private drawModernPath(
    graphics: Phaser.GameObjects.Graphics,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: number,
  ): void {
    const distance = Phaser.Math.Distance.Between(x1, y1, x2, y2);
    const segments = Math.floor(distance / 30);

    // Outer glow
    graphics.lineStyle(12, color, 0.08);
    graphics.beginPath();
    graphics.moveTo(x1, y1);

    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;

      // Subtle curve for visual interest
      const curve = Math.sin(t * Math.PI) * 20;
      const perpX = -(y2 - y1) / distance;
      const perpY = (x2 - x1) / distance;

      graphics.lineTo(x + perpX * curve, y + perpY * curve);
    }

    graphics.strokePath();

    // Middle glow
    graphics.lineStyle(6, color, 0.15);
    graphics.beginPath();
    graphics.moveTo(x1, y1);

    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      const curve = Math.sin(t * Math.PI) * 20;
      const perpX = -(y2 - y1) / distance;
      const perpY = (x2 - x1) / distance;
      graphics.lineTo(x + perpX * curve, y + perpY * curve);
    }

    graphics.strokePath();

    // Core line
    graphics.lineStyle(2, color, 0.5);
    graphics.beginPath();
    graphics.moveTo(x1, y1);

    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      const curve = Math.sin(t * Math.PI) * 20;
      const perpX = -(y2 - y1) / distance;
      const perpY = (x2 - x1) / distance;
      graphics.lineTo(x + perpX * curve, y + perpY * curve);
    }

    graphics.strokePath();

    // Add data nodes along the path
    for (let i = 0; i < distance / 100; i++) {
      const t = Math.random();
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      const curve = Math.sin(t * Math.PI) * 20;
      const perpX = -(y2 - y1) / distance;
      const perpY = (x2 - x1) / distance;

      const nodeX = x + perpX * curve;
      const nodeY = y + perpY * curve;

      // Node glow
      graphics.fillStyle(color, 0.2);
      graphics.fillCircle(nodeX, nodeY, 8);

      // Node core
      graphics.fillStyle(color, 0.6);
      graphics.fillCircle(nodeX, nodeY, 4);
    }
  }

  /**
   * Play a checkpoint animation based on stage and variant
   *
   * @param checkpointId - ID of the checkpoint being animated
   * @param stage - Stage number (1-8) determines which animation pattern
   * @param variant - 'standard' (blue, 2s) or 'gold' (amber, 3s)
   *
   * @remarks
   * Animation patterns mapped per PRD:
   * - S1, S8: Seal Break
   * - S2: Rune Inscription
   * - S3, S7: Beacon Lighting
   * - S4: Bridge Repair
   * - S5: Compass Calibration
   * - S6: Ward Placement
   */
  playCheckpointAnimation(
    checkpointId: string,
    stage: number,
    variant: AnimationVariant = "standard",
  ): void {
    // Stop any currently playing animation
    this.stopCurrentAnimation();

    // Get checkpoint node position for animation placement
    const node = this.checkpointNodes.get(checkpointId);
    if (!node) {
      console.warn(
        `[WorldMapScene] Cannot play animation - checkpoint ${checkpointId} not found`,
      );
      return;
    }

    // Get world position of checkpoint
    const worldPos = node.getWorldPosition();

    // Determine animation type from stage
    const animationType = getAnimationTypeForStage(stage);

    // Create animation instance
    this.currentAnimation = createCheckpointAnimation(this, animationType, {
      x: worldPos.x,
      y: worldPos.y,
      variant,
      onComplete: () => {
        this.stopCurrentAnimation();
        // Notify React that animation completed
        eventBridge.dispatchToReact({
          type: "CHECKPOINT_ANIMATION_COMPLETE",
          checkpointId,
          stage,
        });
      },
      onSkip: () => {
        // User can skip after 500ms by clicking or pressing ESC
      },
    });

    // Play the animation
    this.currentAnimation.play();
  }

  /**
   * Stop and cleanup the currently playing animation
   *
   * @remarks
   * Called automatically when a new animation starts or when
   * the current animation completes
   */
  private stopCurrentAnimation(): void {
    if (this.currentAnimation) {
      this.currentAnimation.destroy();
      this.currentAnimation = null;
    }
  }

  /**
   * Update loop for scene (simplified for spaceship map)
   */
  update(): void {
    /**
     * PARALLAX SCROLLING IMPLEMENTATION (Week 2 Day 10)
     *
     * Creates depth perception by moving background layers at different speeds
     * relative to camera movement. Slower movement = appears further away.
     *
     * Technical approach:
     * - We offset each layer's position based on camera scroll
     * - Negative values because we move layers opposite to camera scroll
     * - Lower multipliers = slower apparent movement = greater perceived distance
     *
     * Layer structure:
     * - Background: 0.3x speed (distant stars, nebulae) - furthest
     * - Midground: 0.6x speed (medium stars, particles) - middle distance
     * - Game layer: 1.0x speed (checkpoints, rooms, persona) - no parallax
     *
     * When camera scrolls right (+X), backgrounds scroll left (-X) at reduced speed,
     * creating the illusion that they're further away in 3D space.
     */
    const cam = this.cameras.main;

    // Background layer - slowest (0.3x camera speed, furthest away)
    // Contains: Deep space background, distant stars, large nebula gradients
    if (this.backgroundLayer) {
      this.backgroundLayer.x = -cam.scrollX * 0.3;
      this.backgroundLayer.y = -cam.scrollY * 0.3;
    }

    // Midground layer - medium speed (0.6x camera speed, middle distance)
    // Contains: Medium-sized stars, colored nebula particles
    if (this.midgroundLayer) {
      this.midgroundLayer.x = -cam.scrollX * 0.6;
      this.midgroundLayer.y = -cam.scrollY * 0.6;
    }

    // Game layer (foreground) - full speed (1.0x, no parallax multiplier)
    // Contains: Spaceship rooms, checkpoints, persona, bright foreground stars
    // These elements move naturally with the camera (no offset needed)

    /**
     * LAZY LOADING CHECK (Week 2 Day 10)
     *
     * Check if any nearby rooms need to be loaded based on camera position.
     * This ensures rooms are created just before they become visible, improving
     * initial load time and overall performance.
     */
    this.checkBiomeLoading();
  }

  /**
   * Cleanup when scene is shutdown
   *
   * @remarks
   * Removes all event listeners to prevent memory leaks
   * Called automatically by Phaser when scene is stopped
   */
  shutdown(): void {
    // Stop any playing animation
    this.stopCurrentAnimation();

    // Clean up event listeners
    if (this.boundHandlers.updateBrightness) {
      eventBridge.off("UPDATE_BRIGHTNESS", this.boundHandlers.updateBrightness);
    }
    if (this.boundHandlers.updateCheckpoints) {
      eventBridge.off(
        "UPDATE_CHECKPOINTS",
        this.boundHandlers.updateCheckpoints,
      );
    }
    if (this.boundHandlers.setActiveVenture) {
      eventBridge.off(
        "SET_ACTIVE_VENTURE",
        this.boundHandlers.setActiveVenture,
      );
    }
    if (this.boundHandlers.scrollToCheckpoint) {
      eventBridge.off(
        "SCROLL_TO_CHECKPOINT",
        this.boundHandlers.scrollToCheckpoint,
      );
    }
    if (this.boundHandlers.playCheckpointAnimation) {
      eventBridge.off(
        "PLAY_CHECKPOINT_ANIMATION",
        this.boundHandlers.playCheckpointAnimation,
      );
    }

    this.boundHandlers = {};
  }
}
