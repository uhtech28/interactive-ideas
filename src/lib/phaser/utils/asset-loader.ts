/**
 * asset-loader.ts
 *
 * Programmatic Phaser texture creation for Interactive Ideas — Week 1.
 *
 * All game textures are painted at runtime via Phaser's Graphics API so that
 * zero external image files are required during Week 1 development.
 *
 * Call `AssetLoader.createAllTextures(scene)` from your Scene's `create()`
 * method before any sprites are instantiated.
 *
 * ─── Texture registry ────────────────────────────────────────────────────────
 *  Checkpoints : cp_locked | cp_active | cp_in_progress | cp_completed | cp_gold
 *  Personas    : persona_male | persona_female   (32×48 px pixel art)
 *  Tiles       : path_tile                       (32×32 px)
 *  Particles   : particle_glow                   (16×16 px)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Phaser from 'phaser';

// ─────────────────────────────────────────────────────────────────────────────
// Module-level draw helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fill a solid rectangular block on a Graphics object.
 * @param gfx   Target Graphics instance.
 * @param color 24-bit packed RGB integer, e.g. `0xFF0000`.
 * @param x     Left edge (pixels).
 * @param y     Top edge (pixels).
 * @param w     Width in pixels.
 * @param h     Height in pixels.
 * @param alpha Optional opacity, 0–1. Default `1`.
 */
function B(
  gfx: Phaser.GameObjects.Graphics,
  color: number,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha = 1,
): void {
  gfx.fillStyle(color, alpha);
  gfx.fillRect(x, y, w, h);
}

/**
 * Fill a single 1×1 pixel on a Graphics object.
 * @param gfx   Target Graphics instance.
 * @param color 24-bit packed RGB integer.
 * @param x     Column (pixel).
 * @param y     Row (pixel).
 */
function P(gfx: Phaser.GameObjects.Graphics, color: number, x: number, y: number): void {
  gfx.fillStyle(color, 1);
  gfx.fillRect(x, y, 1, 1);
}

/**
 * Compute the vertices of an N-pointed star polygon.
 *
 * Returns alternating outer-radius / inner-radius vertices, starting at
 * the 12-o'clock position (−90° from the positive X axis).
 *
 * @param cx      Centre X.
 * @param cy      Centre Y.
 * @param points  Number of star points (e.g. 5 for a standard star).
 * @param outerR  Outer (tip) radius.
 * @param innerR  Inner (valley) radius.
 */
function starPolygon(
  cx: number,
  cy: number,
  points: number,
  outerR: number,
  innerR: number,
): { x: number; y: number }[] {
  const verts: { x: number; y: number }[] = [];
  const total = points * 2;
  for (let i = 0; i < total; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    verts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
  }
  return verts;
}

// ─────────────────────────────────────────────────────────────────────────────
// AssetLoader
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Static factory that generates all programmatic Phaser textures.
 *
 * @example
 * // In your Scene's create():
 * AssetLoader.createAllTextures(this);
 */
export class AssetLoader {
  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Creates every texture group in one call.
   * Safe to call multiple times — existing textures will be overwritten.
   */
  static createAllTextures(scene: Phaser.Scene): void {
    AssetLoader.createCheckpointTextures(scene);
    AssetLoader.createPersonaTextures(scene);
    AssetLoader.createPathTextures(scene);
    AssetLoader.createParticleTextures(scene);
  }

  // ── Checkpoint textures ────────────────────────────────────────────────────

  /**
   * Creates five 64×64 checkpoint node textures:
   * `cp_locked` | `cp_active` | `cp_in_progress` | `cp_completed` | `cp_gold`
   */
  static createCheckpointTextures(scene: Phaser.Scene): void {
    AssetLoader.createLockedTexture(scene);
    AssetLoader.createActiveTexture(scene);
    AssetLoader.createInProgressTexture(scene);
    AssetLoader.createCompletedTexture(scene);
    AssetLoader.createGoldTexture(scene);
  }

  // ── Checkpoint: cp_locked ──────────────────────────────────────────────────

  /**
   * **cp_locked** — 64×64
   * Dark grey filled circle (#374151) with a padlock icon in #6B7280.
   * Black border ring.
   */
  private static createLockedTexture(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();

    // Background circle
    gfx.fillStyle(0x374151);
    gfx.fillCircle(32, 32, 30);

    // Black border ring
    gfx.lineStyle(3, 0x000000, 1);
    gfx.strokeCircle(32, 32, 30);

    // Lock shackle — U-shaped: two vertical arms + crossbar
    gfx.fillStyle(0x6B7280);
    gfx.fillRect(23, 16, 5, 17); // left arm
    gfx.fillRect(36, 16, 5, 17); // right arm
    gfx.fillRect(23, 16, 18, 5); // top crossbar

    // Lock body (rounded rectangle)
    gfx.fillStyle(0x6B7280);
    gfx.fillRoundedRect(19, 31, 26, 20, 3);

    // Keyhole — dark circle + vertical slot
    gfx.fillStyle(0x374151);
    gfx.fillCircle(32, 38, 4);
    gfx.fillRect(30, 39, 4, 7);

    gfx.generateTexture('cp_locked', 64, 64);
    gfx.destroy();
  }

  // ── Checkpoint: cp_active ──────────────────────────────────────────────────

  /**
   * **cp_active** — 64×64
   * Bright blue circle (#3B82F6) with an outer glow ring (#1D4ED8)
   * and a crystal/diamond shape (#60A5FA) in the centre.
   */
  private static createActiveTexture(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();

    // Outer glow ring
    gfx.fillStyle(0x1D4ED8);
    gfx.fillCircle(32, 32, 32);

    // Main circle
    gfx.fillStyle(0x3B82F6);
    gfx.fillCircle(32, 32, 27);

    // Outer diamond — 4-point crystal
    gfx.fillStyle(0x60A5FA);
    gfx.fillPoints(
      [
        { x: 32, y: 13 }, // top
        { x: 45, y: 32 }, // right
        { x: 32, y: 51 }, // bottom
        { x: 19, y: 32 }, // left
      ],
      true,
    );

    // Inner diamond — bright highlight
    gfx.fillStyle(0xBFDBFE);
    gfx.fillPoints(
      [
        { x: 32, y: 20 }, // top
        { x: 39, y: 32 }, // right
        { x: 32, y: 44 }, // bottom
        { x: 25, y: 32 }, // left
      ],
      true,
    );

    gfx.generateTexture('cp_active', 64, 64);
    gfx.destroy();
  }

  // ── Checkpoint: cp_in_progress ─────────────────────────────────────────────

  /**
   * **cp_in_progress** — 64×64
   * Orange/amber circle (#F59E0B) with a 60 % progress arc overlay
   * and a flame shape (#FCD34D) in the centre.
   */
  private static createInProgressTexture(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();

    // Background circle
    gfx.fillStyle(0xF59E0B);
    gfx.fillCircle(32, 32, 30);

    // Darker border
    gfx.lineStyle(2, 0x92400E, 1);
    gfx.strokeCircle(32, 32, 30);

    // Progress arc — 60 % clockwise from the 12-o'clock position (270°)
    // Arc goes from 270° → 270° + 216° (60 % of 360°)
    gfx.lineStyle(5, 0xFEF3C7, 0.85);
    gfx.beginPath();
    gfx.arc(32, 32, 23, 270, 486, false);
    gfx.strokePath();

    // Outer flame body
    gfx.fillStyle(0xFCD34D);
    gfx.fillPoints(
      [
        { x: 32, y: 15 }, // tip
        { x: 40, y: 24 }, // upper right
        { x: 42, y: 35 }, // right
        { x: 37, y: 28 }, // right inner dip
        { x: 36, y: 45 }, // lower right
        { x: 32, y: 49 }, // bottom
        { x: 28, y: 45 }, // lower left
        { x: 27, y: 28 }, // left inner dip
        { x: 22, y: 35 }, // left
        { x: 24, y: 24 }, // upper left
      ],
      true,
    );

    // Inner flame — bright highlight
    gfx.fillStyle(0xFEF3C7);
    gfx.fillPoints(
      [
        { x: 32, y: 22 },
        { x: 36, y: 30 },
        { x: 35, y: 39 },
        { x: 32, y: 43 },
        { x: 29, y: 39 },
        { x: 28, y: 30 },
      ],
      true,
    );

    gfx.generateTexture('cp_in_progress', 64, 64);
    gfx.destroy();
  }

  // ── Checkpoint: cp_completed ───────────────────────────────────────────────

  /**
   * **cp_completed** — 64×64
   * Green circle (#22C55E) with a gold outer accent ring and a
   * thick checkmark (#4ADE80) in the centre.
   */
  private static createCompletedTexture(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();

    // Gold accent outer ring
    gfx.fillStyle(0xD97706);
    gfx.fillCircle(32, 32, 32);

    // Main green circle
    gfx.fillStyle(0x22C55E);
    gfx.fillCircle(32, 32, 28);

    // Inner highlight ring
    gfx.fillStyle(0x4ADE80, 0.3);
    gfx.fillCircle(32, 32, 24);

    // Checkmark — left-to-valley then valley-to-upper-right
    gfx.lineStyle(6, 0xF0FDF4, 1);
    gfx.beginPath();
    gfx.moveTo(15, 32);
    gfx.lineTo(27, 45);
    gfx.lineTo(49, 20);
    gfx.strokePath();

    gfx.generateTexture('cp_completed', 64, 64);
    gfx.destroy();
  }

  // ── Checkpoint: cp_gold ────────────────────────────────────────────────────

  /**
   * **cp_gold** — 64×64
   * Gold circle (#F59E0B) with a bright outer glow ring (#D97706)
   * and a 5-pointed star (#FEF08A) in the centre.
   */
  private static createGoldTexture(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();

    // Bright outer glow ring — outermost, darkest gold
    gfx.fillStyle(0xD97706);
    gfx.fillCircle(32, 32, 32);

    // Second ring — mid gold
    gfx.fillStyle(0xF59E0B);
    gfx.fillCircle(32, 32, 29);

    // Main circle — warm gold
    gfx.fillStyle(0xFBBF24);
    gfx.fillCircle(32, 32, 26);

    // 5-pointed star outer
    gfx.fillStyle(0xFEF08A);
    gfx.fillPoints(starPolygon(32, 32, 5, 19, 8), true);

    // 5-pointed star inner highlight
    gfx.fillStyle(0xFFFBEB);
    gfx.fillPoints(starPolygon(32, 32, 5, 9, 4), true);

    gfx.generateTexture('cp_gold', 64, 64);
    gfx.destroy();
  }

  // ── Persona textures ───────────────────────────────────────────────────────

  /**
   * Creates two 32×48 pixel-art persona sprites:
   * - `persona_male`   — "The Founder" (purple/indigo theme)
   * - `persona_female` — "The Visionary" (cyan/pink theme)
   *
   * Intended to be rendered at 3× scale → 96×144 display pixels.
   */
  static createPersonaTextures(scene: Phaser.Scene): void {
    // Male ─────────────────────────────────────────────────────────────────
    {
      const gfx = scene.add.graphics();
      AssetLoader.drawMalePersona(gfx);
      gfx.generateTexture('persona_male', 32, 48);
      gfx.destroy();
    }

    // Female ───────────────────────────────────────────────────────────────
    {
      const gfx = scene.add.graphics();
      AssetLoader.drawFemalePersona(gfx);
      gfx.generateTexture('persona_female', 32, 48);
      gfx.destroy();
    }
  }

  // ── Persona: Male "The Founder" ────────────────────────────────────────────

  /**
   * Paints the male "Founder" pixel-art sprite onto `gfx` at origin (0, 0).
   *
   * Layout (32 × 48 px):
   * ```
   * Rows  0– 6  Hair
   * Rows  4–14  Head / face  (overlaps hair bottom)
   * Rows 15–25  Shirt        (purple)
   * Rows 26–28  Belt + buckle
   * Rows 29–40  Pants        (dark navy)
   * Rows 41–47  Boots        (brown)
   * ```
   *
   * All drawing is done with `fillRect` (block fills for large areas,
   * single-pixel calls for fine details such as eye shine and mouth).
   */
  private static drawMalePersona(gfx: Phaser.GameObjects.Graphics): void {
    // ── Palette ─────────────────────────────────────────────────────────────
    const HAIR      = 0x1E1B4B; // dark indigo
    const HAIR_HL   = 0x4F46E5; // side-part highlight
    const SKIN      = 0xFFDCAB;
    const SKIN_SH   = 0xD4A373; // face shadow / ear / nose
    const EYE       = 0x111827; // dark iris
    const EYE_SH    = 0xF8FAFC; // eye shine pixel
    const SHIRT     = 0x7C3AED; // purple
    const SHIRT_SH  = 0x5B21B6; // shirt depth shadow
    const SHIRT_DT  = 0xC4B5FD; // shirt shoulder highlight
    const BELT      = 0x78350F; // dark brown
    const BUCKLE    = 0xF59E0B; // gold
    const PANTS     = 0x1E1B4B; // dark navy
    const PANTS_HL  = 0x3730A3; // knee highlight
    const BOOT      = 0x92400E; // warm brown
    const SOLE      = 0x451A03; // very dark brown
    const OUTLINE   = 0x0A0A14; // near-black

    // ── Hair (rows 0–6) ─────────────────────────────────────────────────────
    // Main hair block — slightly wider than the face
    B(gfx, HAIR,    8, 0, 16,  7); // x 8..23, y 0..6
    // Side-part highlight (left-of-centre stripe, rows 0–4)
    B(gfx, HAIR_HL, 12, 0,  3,  5);

    // ── Head / face (rows 4–14) ─────────────────────────────────────────────
    // Face skin — overwrites the bottom 3 rows of the hair block in the centre
    B(gfx, SKIN,    9, 4, 14, 11); // x 9..22, y 4..14
    // Shadow on the cheek sides
    B(gfx, SKIN_SH, 9, 8,  2,  6); // left cheek shadow
    B(gfx, SKIN_SH, 21, 8, 2,  6); // right cheek shadow
    // Ears (1 px outside face, sits at hair-bottom level)
    B(gfx, SKIN_SH, 8,  7, 1,  4); // left ear
    B(gfx, SKIN_SH, 23, 7, 1,  4); // right ear

    // ── Eyes (rows 7–8) ─────────────────────────────────────────────────────
    B(gfx, EYE,    11, 7, 2, 2); // left eye
    B(gfx, EYE,    19, 7, 2, 2); // right eye
    P(gfx, EYE_SH, 12, 7);       // left shine  (top-right corner of eye)
    P(gfx, EYE_SH, 20, 7);       // right shine

    // ── Nose + mouth ────────────────────────────────────────────────────────
    P(gfx, SKIN_SH, 16, 10);              // nose tip (single shadow pixel)
    B(gfx, SKIN_SH, 14, 12, 4, 1);       // mouth line

    // ── Neck (rows 15–16) ───────────────────────────────────────────────────
    B(gfx, SKIN, 13, 15, 6, 2);

    // ── Shirt (rows 15–25) ──────────────────────────────────────────────────
    B(gfx, SHIRT_DT, 7, 15, 18,  1); // shoulder highlight stripe (top)
    B(gfx, SHIRT,    7, 16, 18, 10); // main shirt body  x 7..24, y 16..25
    B(gfx, SHIRT_SH, 7, 16,  3, 10); // left depth shadow
    B(gfx, SHIRT_SH,22, 16,  3, 10); // right depth shadow
    // Arms (extend 2 px beyond shirt body at mid-height)
    B(gfx, SHIRT_SH, 5, 17, 2,  9); // left arm
    B(gfx, SHIRT_SH,25, 17, 2,  9); // right arm
    // White collar V-shape (two pixels per side, spreading downward)
    P(gfx, 0xFFFFFF, 15, 16);
    P(gfx, 0xFFFFFF, 16, 16);
    P(gfx, 0xFFFFFF, 14, 17);
    P(gfx, 0xFFFFFF, 17, 17);

    // ── Belt (rows 26–28) ───────────────────────────────────────────────────
    B(gfx, BELT,   7, 26, 18, 3); // belt body
    B(gfx, BUCKLE,14, 26,  4, 3); // centre gold buckle

    // ── Pants / legs (rows 29–40) ───────────────────────────────────────────
    B(gfx, PANTS,   8, 29, 7, 12); // left leg   x  8..14
    B(gfx, PANTS,  17, 29, 7, 12); // right leg  x 17..23
    B(gfx, OUTLINE,15, 29, 2, 12); // inner-leg gap / deep shadow
    // Knee highlights
    B(gfx, PANTS_HL,11, 35, 2,  3); // left knee
    B(gfx, PANTS_HL,19, 35, 2,  3); // right knee

    // ── Boots (rows 41–47) ──────────────────────────────────────────────────
    // Boots extend 1 px beyond the leg width on each outer edge
    B(gfx, BOOT, 7, 41, 8, 6); // left boot
    B(gfx, BOOT,17, 41, 8, 6); // right boot
    B(gfx, SOLE, 7, 47, 8, 1); // left sole
    B(gfx, SOLE,17, 47, 8, 1); // right sole

    // ── Silhouette outline touches ───────────────────────────────────────────
    // Left and right body edges add depth against light backgrounds
    B(gfx, OUTLINE, 6, 16, 1, 32); // left body outline
    B(gfx, OUTLINE,25, 16, 1, 32); // right body outline
    // Hair top edge
    B(gfx, OUTLINE, 8,  0, 1,  7); // left hair edge
    B(gfx, OUTLINE,23,  0, 1,  7); // right hair edge
    // Head top
    B(gfx, OUTLINE, 9,  3,14,  1); // crown
  }

  // ── Persona: Female "The Visionary" ───────────────────────────────────────

  /**
   * Paints the female "Visionary" pixel-art sprite onto `gfx` at origin (0, 0).
   *
   * Layout (32 × 48 px):
   * ```
   * Rows  0– 8  Hair (2 rows longer than male, with side-swept look)
   * Rows  6–16  Head / face
   * Rows 17–27  Top / shirt  (cyan)
   * Rows 28–30  Belt + buckle
   * Rows 31–41  Pants        (purple)
   * Rows 42–47  Boots        (dark purple)
   * ```
   *
   * Notable additions vs the male:
   * - Pink eyebrows (1 px, row 9)
   * - Gold star hair accessory at (22, 2)
   * - Light-pink highlight stripe in hair (right side)
   * - Longer side locks hanging below the main hair block
   */
  private static drawFemalePersona(gfx: Phaser.GameObjects.Graphics): void {
    // ── Palette ─────────────────────────────────────────────────────────────
    const HAIR      = 0xDB2777; // hot pink
    const HAIR_HL   = 0xF9A8D4; // light pink highlight
    const HAIR_ACC  = 0xF59E0B; // gold star accessory
    const SKIN      = 0xFFDCAB;
    const SKIN_SH   = 0xD4A373;
    const EYE       = 0x111827;
    const EYE_SH    = 0xF8FAFC;
    const BROW      = 0xDB2777; // pink eyebrow
    const TOP       = 0x0EA5E9; // sky blue
    const TOP_SH    = 0x0369A1; // top shadow
    const TOP_AC    = 0x7DD3FC; // top shoulder accent
    const BELT      = 0x78350F;
    const BUCKLE    = 0xF59E0B;
    const PANTS     = 0x7C3AED; // purple
    const PANTS_HL  = 0xA78BFA; // purple highlight
    const BOOT      = 0x4C1D95; // dark purple
    const SOLE      = 0x2E1065;
    const OUTLINE   = 0x0A0A14;

    // ── Hair (rows 0–8) — 2 rows taller than male ──────────────────────────
    B(gfx, HAIR,    8, 0, 16, 9); // main hot-pink block  x 8..23, y 0..8
    B(gfx, HAIR_HL,19, 0,  4, 8); // light-pink highlight stripe (right side)
    // Side locks that hang below the main block
    B(gfx, HAIR,    8, 9,  3, 4); // left side lock
    B(gfx, HAIR,   21, 9,  3, 4); // right side lock
    // Gold star hair accessory (row 2, near right shoulder region)
    P(gfx, HAIR_ACC, 22, 2);

    // ── Head / face (rows 6–16) ─────────────────────────────────────────────
    B(gfx, SKIN,    9,  6, 14, 11); // face skin  y 6..16
    B(gfx, SKIN_SH, 9, 10,  2,  6); // left cheek shadow
    B(gfx, SKIN_SH,21, 10,  2,  6); // right cheek shadow
    B(gfx, SKIN_SH, 8,  9,  1,  4); // left ear
    B(gfx, SKIN_SH,23,  9,  1,  4); // right ear

    // ── Eyebrows (row 8) — pink, 1 px tall ──────────────────────────────────
    B(gfx, BROW, 11, 8, 2, 1); // left eyebrow
    B(gfx, BROW, 19, 8, 2, 1); // right eyebrow

    // ── Eyes (rows 9–10) ────────────────────────────────────────────────────
    B(gfx, EYE,    11,  9, 2, 2);
    B(gfx, EYE,    19,  9, 2, 2);
    P(gfx, EYE_SH, 12,  9);
    P(gfx, EYE_SH, 20,  9);

    // ── Nose + mouth ────────────────────────────────────────────────────────
    P(gfx, SKIN_SH, 16, 12);           // nose tip
    B(gfx, SKIN_SH, 14, 14, 4, 1);     // mouth line

    // ── Neck (rows 17–18) ───────────────────────────────────────────────────
    B(gfx, SKIN, 13, 17, 6, 2);

    // ── Top / shirt (rows 17–27) ────────────────────────────────────────────
    B(gfx, TOP_AC, 7, 17, 18,  1); // shoulder accent line (lighter cyan)
    B(gfx, TOP,    7, 18, 18, 10); // main top body
    B(gfx, TOP_SH, 7, 18,  3, 10); // left depth shadow
    B(gfx, TOP_SH,22, 18,  3, 10); // right depth shadow
    // Arms
    B(gfx, TOP_SH, 5, 19, 2,  9); // left arm
    B(gfx, TOP_SH,25, 19, 2,  9); // right arm
    // Open collar (skin pixels at neckline)
    P(gfx, SKIN, 15, 18);
    P(gfx, SKIN, 16, 18);
    P(gfx, SKIN, 14, 19);
    P(gfx, SKIN, 17, 19);

    // ── Belt (rows 28–30) ───────────────────────────────────────────────────
    B(gfx, BELT,   7, 28, 18, 3);
    B(gfx, BUCKLE,14, 28,  4, 3);

    // ── Pants / legs (rows 31–41) ───────────────────────────────────────────
    B(gfx, PANTS,   8, 31, 7, 11); // left leg
    B(gfx, PANTS,  17, 31, 7, 11); // right leg
    B(gfx, OUTLINE,15, 31, 2, 11); // inner-leg shadow
    B(gfx, PANTS_HL,11, 37, 2,  3); // left knee highlight
    B(gfx, PANTS_HL,19, 37, 2,  3); // right knee highlight

    // ── Boots (rows 42–47) ──────────────────────────────────────────────────
    B(gfx, BOOT, 7, 42, 8, 5); // left boot
    B(gfx, BOOT,17, 42, 8, 5); // right boot
    B(gfx, SOLE, 7, 47, 8, 1); // left sole
    B(gfx, SOLE,17, 47, 8, 1); // right sole

    // ── Silhouette outline touches ───────────────────────────────────────────
    B(gfx, OUTLINE, 6, 18, 1, 30); // left body edge
    B(gfx, OUTLINE,25, 18, 1, 30); // right body edge
    B(gfx, OUTLINE, 8,  0, 1,  9); // left hair edge
    B(gfx, OUTLINE,23,  0, 1,  9); // right hair edge
    B(gfx, OUTLINE, 9,  5,14,  1); // crown top
  }

  // ── Path tile texture ──────────────────────────────────────────────────────

  /**
   * Creates **path_tile** — a 32×32 dirt/road tile.
   *
   * Features a warm brown base with a lighter centre lane and random pebble
   * details for visual texture.
   */
  static createPathTextures(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();

    // Base road colour
    gfx.fillStyle(0x92400E);
    gfx.fillRect(0, 0, 32, 32);

    // Slightly lighter centre lane
    gfx.fillStyle(0xA16207, 0.5);
    gfx.fillRect(4, 0, 24, 32);

    // Edge trim (dark border strips)
    gfx.fillStyle(0x78350F);
    gfx.fillRect(0,  0, 3, 32);
    gfx.fillRect(29, 0, 3, 32);

    // Subtle pebble specks for texture
    gfx.fillStyle(0x6B4F3A, 0.8);
    const pebbles: [number, number][] = [
      [5, 4], [13, 8], [22, 5], [8, 17],
      [19, 22], [26, 13], [3, 27], [14, 29],
      [10, 14], [25, 20],
    ];
    for (const [px, py] of pebbles) {
      gfx.fillRect(px, py, 2, 2);
    }

    gfx.generateTexture('path_tile', 32, 32);
    gfx.destroy();
  }

  // ── Particle glow texture ──────────────────────────────────────────────────

  /**
   * Creates **particle_glow** — a 16×16 soft radial glow texture.
   *
   * Built from five concentric white circles with increasing opacity toward
   * the centre, producing a smooth falloff suitable for particle emitters.
   */
  static createParticleTextures(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const SIZE = 16;
    const CX   = SIZE / 2;
    const CY   = SIZE / 2;

    // Concentric layers: outer → inner, increasing alpha
    const layers: { r: number; alpha: number }[] = [
      { r: 8.0, alpha: 0.10 },
      { r: 6.0, alpha: 0.25 },
      { r: 4.0, alpha: 0.50 },
      { r: 2.5, alpha: 0.78 },
      { r: 1.2, alpha: 1.00 },
    ];

    for (const layer of layers) {
      gfx.fillStyle(0xFFFFFF, layer.alpha);
      gfx.fillCircle(CX, CY, layer.r);
    }

    gfx.generateTexture('particle_glow', SIZE, SIZE);
    gfx.destroy();
  }
}
