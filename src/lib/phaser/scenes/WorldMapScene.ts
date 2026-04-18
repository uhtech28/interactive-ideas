import * as Phaser from "phaser";
import { AssetLoader } from "../utils/asset-loader";
import { CheckpointNode, CheckpointStatus } from "../entities/Checkpoint";
import { Persona, PersonaGender } from "../entities/Persona";
import { BossSilhouette } from "../entities/Boss";
import { brightnessToPhaser } from "../utils/brightness-calculator";
import { eventBridge, type CheckpointState } from "../utils/event-bridge";
import { VENTURE_STAGES } from "@convex/ventureConstants";

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

  /** Container for interactive game elements (checkpoints, persona, bosses) */
  private gameLayer!: Phaser.GameObjects.Container;

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
  };

  /** Biome and map layout constants */
  private readonly BIOME_WIDTH = 400;
  private readonly MAP_WIDTH = 3600; // 200 start + (8 × 400) + 200 end
  private readonly MAP_HEIGHT = 720;
  private readonly PATH_CENTER_Y = 360;
  private readonly PATH_AMPLITUDE = 60;

  /** Camera state tracking */
  private cameraTarget: { x: number; y: number } | null = null;
  private cameraFollowSpeed = 0.05;

  /** Biome background system */
  private biomeBackgrounds: Phaser.GameObjects.TileSprite[] = [];
  private readonly BIOME_COLORS = [
    0x8b7355, // Village (brown/earth)
    0x2d5016, // Forest (dark green)
    0x8b4513, // Arena (sandy brown)
    0x4a5568, // Artisan Quarter (grey stone)
    0x1a1a2e, // Mine (dark purple/black)
    0x1e3a8a, // Harbour (deep blue)
    0x92400e, // Crossroads (rust/orange)
    0x713f12, // Capital (gold/bronze)
  ];

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
    AssetLoader.createAllTextures(this);
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
    // Initialize layer containers
    this.backgroundLayer = this.add.container(0, 0);
    this.backgroundLayer.setDepth(0);

    this.gameLayer = this.add.container(0, 0);
    this.gameLayer.setDepth(10);

    // Create biome backgrounds first (bottom layer)
    this.createBiomeBackgrounds();

    // Create biome zones and labels
    this.createBiomeZones();

    // Draw visual path connecting all checkpoints
    this.createVisualPath();
    
    // Create biome crossfade blending at boundaries
    this.createBiomeCrossfades();

    // Bind event handlers
    this.boundHandlers.updateBrightness =
      this.handleUpdateBrightness.bind(this);
    this.boundHandlers.updateCheckpoints =
      this.handleUpdateCheckpoints.bind(this);
    this.boundHandlers.setActiveVenture =
      this.handleSetActiveVenture.bind(this);
    this.boundHandlers.scrollToCheckpoint =
      this.handleScrollToCheckpoint.bind(this);

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

    // Setup camera with smooth lerp
    this.cameras.main.setBounds(0, 0, this.MAP_WIDTH, this.MAP_HEIGHT);
    this.cameras.main.setScroll(0, 0);
    this.cameras.main.setZoom(1.0);

    // Enable smooth camera lerp (no target object, just for lerp settings)
    // Note: We use pan() for actual camera movements
    this.cameras.main.setLerp(this.cameraFollowSpeed, this.cameraFollowSpeed);

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
   * using post-processing effects
   */
  private handleUpdateBrightness(event: { brightness: number }): void {
    try {
      const { brightness, contrast } = brightnessToPhaser(event.brightness);

      // Apply to entire scene via camera post-processing
      if (this.cameras.main.postFX) {
        this.cameras.main.postFX.clear();
        this.cameras.main.postFX.addColorMatrix().brightness(brightness - 1.0);
        this.cameras.main.postFX.addColorMatrix().contrast(contrast);
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
   * Create boss silhouettes at stage boundaries
   *
   * @param assignedBosses - Array of boss IDs assigned to this venture
   */
  private createBossSilhouettes(assignedBosses: string[]): void {
    // Clear existing bosses
    this.bosses.forEach((boss) => boss.destroy());
    this.bosses.clear();

    // Super Boss (far right of map)
    if (assignedBosses.length > 0) {
      const superBossX = 3400; // Near end of map
      const superBossY = 360;

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

    for (let stage = 1; stage <= 8; stage++) {
      // Position at end of each biome
      const x = 200 + stage * 400 - 50; // Near right edge of biome
      const y = 250; // Upper portion of screen

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
    for (let stage = 1; stage <= 8; stage++) {
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
   * Calculate checkpoint position using snake path through 8 biomes
   *
   * The path flows left-to-right through biome zones with alternating
   * up/down sine wave pattern for visual interest.
   */
  private calculateCheckpointPosition(
    stage: number,
    checkpoint: number,
    _globalIndex: number,
  ): { x: number; y: number } {
    // Checkpoint counts per stage from Venture template
    const checkpointCounts = [4, 5, 4, 5, 6, 3, 4, 5]; // Total: 36
    const checkpointsInStage = checkpointCounts[stage - 1] || 4;

    const biomeStartX = 200 + (stage - 1) * this.BIOME_WIDTH;
    const posInBiome = checkpoint - 1;

    // Horizontal position within biome
    const biomeProgress = posInBiome / Math.max(checkpointsInStage - 1, 1);
    const x = biomeStartX + biomeProgress * this.BIOME_WIDTH;

    // Vertical sine wave (alternates direction per biome)
    const isOddBiome = stage % 2 === 1;
    const wavePhase = biomeProgress * Math.PI;
    const verticalOffset = isOddBiome
      ? Math.sin(wavePhase) * this.PATH_AMPLITUDE
      : -Math.sin(wavePhase) * this.PATH_AMPLITUDE;

    const y = this.PATH_CENTER_Y + verticalOffset;

    return { x, y };
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
   * Create visual boundaries and labels for 8 biome zones
   */
  private createBiomeZones(): void {
    const stageData = [
      { name: "Ideation", subtitle: "Village" },
      { name: "Research", subtitle: "Forest" },
      { name: "Validation", subtitle: "Arena" },
      { name: "Design", subtitle: "Artisan Quarter" },
      { name: "Development", subtitle: "Mine" },
      { name: "Launch", subtitle: "Harbour" },
      { name: "Iteration", subtitle: "Crossroads" },
      { name: "Scale", subtitle: "Capital" },
    ];

    // Draw separator lines between biomes
    const separators = this.add.graphics();
    separators.lineStyle(2, 0x4a5568, 0.2);

    for (let i = 1; i <= 7; i++) {
      const x = 200 + i * this.BIOME_WIDTH;
      separators.lineBetween(x, 0, x, this.MAP_HEIGHT);
    }
    this.backgroundLayer.add(separators);

    // Add stage labels
    stageData.forEach((stage, index) => {
      const centerX = 200 + index * this.BIOME_WIDTH + this.BIOME_WIDTH / 2;

      const stageName = this.add.text(centerX, 40, stage.name, {
        fontSize: "20px",
        fontFamily: "Arial",
        color: "#E2E8F0",
        fontStyle: "bold",
      });
      stageName.setOrigin(0.5, 0);

      const subtitle = this.add.text(centerX, 65, stage.subtitle, {
        fontSize: "14px",
        fontFamily: "Arial",
        color: "#94A3B8",
      });
      subtitle.setOrigin(0.5, 0);

      const stageNum = this.add.text(centerX, 85, `Stage ${index + 1}`, {
        fontSize: "12px",
        fontFamily: "Arial",
        color: "#64748B",
      });
      stageNum.setOrigin(0.5, 0);

      this.backgroundLayer.add([stageName, subtitle, stageNum]);
    });
  }

  /**
   * Create procedural biome backgrounds with parallax scrolling
   */
  private createBiomeBackgrounds(): void {
    this.BIOME_COLORS.forEach((color, index) => {
      const x = 200 + index * this.BIOME_WIDTH;

      // Create graphics for this biome
      const bg = this.add.graphics();
      bg.fillStyle(color, 0.3);
      bg.fillRect(0, 0, this.BIOME_WIDTH, this.MAP_HEIGHT);

      // Add some texture/pattern
      bg.fillStyle(color, 0.1);
      for (let i = 0; i < 20; i++) {
        const px = Math.random() * this.BIOME_WIDTH;
        const py = Math.random() * this.MAP_HEIGHT;
        const size = 20 + Math.random() * 40;
        bg.fillCircle(px, py, size);
      }

      // Generate texture and create sprite
      bg.generateTexture(`biome_${index}`, this.BIOME_WIDTH, this.MAP_HEIGHT);
      bg.destroy();

      const bgSprite = this.add.tileSprite(
        x + this.BIOME_WIDTH / 2,
        this.MAP_HEIGHT / 2,
        this.BIOME_WIDTH,
        this.MAP_HEIGHT,
        `biome_${index}`,
      );
      bgSprite.setAlpha(0.4);
      bgSprite.setDepth(-100);

      this.backgroundLayer.add(bgSprite);
      this.biomeBackgrounds.push(bgSprite);
    });
  }

  /**
   * Create visual path/trail connecting all checkpoints in snake pattern
   *
   * @remarks
   * Draws a textured road/trail connecting all 36 checkpoints
   * Uses dashed line style with subtle glow effect
   */
  private createVisualPath(): void {
    const pathGraphics = this.add.graphics();
    
    // Main path line - earthy brown color
    const pathColor = 0x8B7355;
    pathGraphics.lineStyle(3, pathColor, 0.6);
    
    // Draw path segments between all checkpoints
    let lastPos: { x: number; y: number } | null = null;
    let globalIndex = 0;
    
    for (let stage = 1; stage <= 8; stage++) {
      const count = this.getCheckpointsForStage(stage);
      for (let cp = 1; cp <= count; cp++) {
        const pos = this.calculateCheckpointPosition(stage, cp, globalIndex);
        
        if (lastPos) {
          pathGraphics.lineBetween(lastPos.x, lastPos.y, pos.x, pos.y);
        }
        lastPos = pos;
        globalIndex++;
      }
    }
    
    this.backgroundLayer.add(pathGraphics);
    
    // Add subtle glow path (slightly offset, higher alpha for depth)
    const glowGraphics = this.add.graphics();
    glowGraphics.lineStyle(6, pathColor, 0.15);
    
    lastPos = null;
    globalIndex = 0;
    
    for (let stage = 1; stage <= 8; stage++) {
      const count = this.getCheckpointsForStage(stage);
      for (let cp = 1; cp <= count; cp++) {
        const pos = this.calculateCheckpointPosition(stage, cp, globalIndex);
        
        if (lastPos) {
          glowGraphics.lineBetween(lastPos.x - 2, lastPos.y + 2, pos.x - 2, pos.y + 2);
        }
        lastPos = pos;
        globalIndex++;
      }
    }
    
    glowGraphics.setDepth(-95);
    this.backgroundLayer.add(glowGraphics);
  }

  /**
   * Create crossfade blending effect between biome transitions
   *
   * @remarks
   * Uses a gradient overlay at biome boundaries for smooth transitions
   */
  private createBiomeCrossfades(): void {
    for (let i = 0; i < 7; i++) {
      const boundaryX = 200 + (i + 1) * this.BIOME_WIDTH;
      
      // Create gradient for crossfade at biome boundary
      const crossfade = this.add.graphics();
      const gradientWidth = 80;
      
      // Left side of boundary (current biome fade)
      for (let j = 0; j < gradientWidth; j++) {
        const alpha = (j / gradientWidth) * 0.3;
        crossfade.lineStyle(1, 0x000000, alpha);
        crossfade.lineBetween(boundaryX - j, 0, boundaryX - j, this.MAP_HEIGHT);
      }
      
      // Right side of boundary (next biome fade)
      for (let j = 0; j < gradientWidth; j++) {
        const alpha = (1 - j / gradientWidth) * 0.3;
        crossfade.lineStyle(1, 0x000000, alpha);
        crossfade.lineBetween(boundaryX + j, 0, boundaryX + j, this.MAP_HEIGHT);
      }
      
      crossfade.setDepth(-50);
      this.backgroundLayer.add(crossfade);
    }
  }

  /**
   * Debug helper to visualize the full path layout
   *
   * @remarks
   * Draws a line connecting all 36 checkpoints in sequence
   * Useful during development to verify the snake path
   * Can be removed or commented out in production
   */
  private debugPathLayout(): void {
    const pathGraphics = this.add.graphics();
    pathGraphics.lineStyle(2, 0xff00ff, 0.5);

    let lastPos: { x: number; y: number } | null = null;

    // Simulate all 36 checkpoints
    let globalIndex = 0;
    for (let stage = 1; stage <= 8; stage++) {
      const count = this.getCheckpointsForStage(stage);
      for (let cp = 1; cp <= count; cp++) {
        const pos = this.calculateCheckpointPosition(stage, cp, globalIndex);

        if (lastPos) {
          pathGraphics.lineBetween(lastPos.x, lastPos.y, pos.x, pos.y);
        }
        lastPos = pos;
        globalIndex++;
      }
    }

    this.backgroundLayer.add(pathGraphics);
  }

  /**
   * Update loop called every frame
   *
   * @param time - Total elapsed time in ms
   * @param delta - Time since last frame in ms
   *
   * @remarks
   * Handles parallax scrolling for biome backgrounds
   */
  update(): void {
    // Parallax scrolling for backgrounds
    const scrollX = this.cameras.main.scrollX;

    this.biomeBackgrounds.forEach((bg) => {
      // Each background scrolls at 30% of camera speed for parallax effect
      bg.tilePositionX = scrollX * 0.3;
    });
  }

  /**
   * Cleanup when scene is shutdown
   *
   * @remarks
   * Removes all event listeners to prevent memory leaks
   * Called automatically by Phaser when scene is stopped
   */
  shutdown(): void {
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

    this.boundHandlers = {};
  }
}
