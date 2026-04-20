/**
 * biome-textures.ts
 * 
 * Adventure-style biome texture generators for the 8 stages.
 * Each biome has unique visual characteristics matching the adventure theme.
 */

import Phaser from "phaser";

/**
 * Biome color palettes for consistent theming
 */
export const BIOME_PALETTES = {
  garage: {
    primary: 0x8b5a2b,    // Wooden floor base
    secondary: 0xa0522d,  // Lighter wood
    accent: 0xd2691e,     // Chocolate brown tools
    path: 0xdeb887,       // Worn dirt/wood path
    decoration: 0x4682b4, // Blueprint blue
  },
  summit: {
    primary: 0x0f172a,    // Deep space/high altitude dark blue
    secondary: 0x1e293b,  // Structural steel
    accent: 0x06b6d4,     // Cyan glowing lines
    path: 0x38bdf8,       // Bright cyan aether path
    decoration: 0xe2e8f0, // Silver/white metallic edges
  },
};

/**
 * Create all biome tile textures
 */
export class BiomeTextureCreator {
  /**
   * Create all 8 biome tile sets
   */
  static createAllBiomeTiles(scene: Phaser.Scene): void {
    BiomeTextureCreator.createGarageTiles(scene);
    BiomeTextureCreator.createSummitTiles(scene);
  }

  /**
   * The Garage: Wood planks, warm messy tables, blueprints
   */
  static createGarageTiles(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const SIZE = 64;
    const palette = BIOME_PALETTES.garage;

    // Base wooden floor
    gfx.fillStyle(palette.primary, 1);
    gfx.fillRect(0, 0, SIZE, SIZE);

    // Hardwood panel lines
    gfx.lineStyle(2, 0x5c3a21, 0.8);
    for (let x = 0; x <= SIZE; x += 16) {
      gfx.lineBetween(x, 0, x, SIZE);
    }
    // Horizontal wood breaks
    for (let i = 0; i < 10; i++) {
        gfx.lineBetween(Math.random()*SIZE, Math.random()*SIZE, Math.random()*SIZE, Math.random()*SIZE);
    }

    // Blueprint table scattered
    gfx.fillStyle(palette.decoration, 0.9);
    gfx.fillRect(10, 10, 20, 15);
    gfx.fillStyle(0xffffff, 0.9); // Paper sketch
    gfx.fillRect(40, 30, 15, 20);
    
    // Tools / Gear pieces
    gfx.fillStyle(0x71717a, 1);
    gfx.fillCircle(25, 45, 4);

    gfx.generateTexture("biome_garage", SIZE, SIZE);
    gfx.destroy();
  }

  /**
   * The Summit: Sleek cyan conduits, metallic glass, crisp geometry
   */
  static createSummitTiles(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const SIZE = 64;
    const palette = BIOME_PALETTES.summit;

    // Base deep blue steel floor
    gfx.fillStyle(palette.primary, 1);
    gfx.fillRect(0, 0, SIZE, SIZE);

    // Glowing cyan grid conduits
    gfx.lineStyle(1, palette.accent, 0.4);
    for (let x = 0; x <= SIZE; x += 32) {
      gfx.lineBetween(x, 0, x, SIZE);
      gfx.lineBetween(0, x, SIZE, x);
    }

    // Glowing nodes at intersections
    gfx.fillStyle(palette.accent, 0.8);
    gfx.fillCircle(32, 32, 3);
    gfx.fillCircle(0,  0,  3);
    gfx.fillCircle(64, 64, 3);

    // Glass panel reflection edge
    gfx.lineStyle(2, palette.decoration, 0.2);
    gfx.strokeRect(2, 2, SIZE - 4, SIZE - 4);

    gfx.generateTexture("biome_summit", SIZE, SIZE);
    gfx.destroy();
  }



  /**
   * Create organic path textures for adventure theme
   */
  static createOrganicPathTextures(scene: Phaser.Scene): void {
    const gfx = scene.add.graphics();
    const WIDTH = 64;
    const HEIGHT = 32;

    // Dirt path base
    gfx.fillStyle(0x6b4423, 1);
    gfx.fillRect(0, 0, WIDTH, HEIGHT);

    // Edge grass (organic, not straight)
    gfx.fillStyle(0x4a7c2f, 0.8);
    for (let x = 0; x < WIDTH; x += 4) {
      const leftEdge = Math.sin(x * 0.2) * 3 + 4;
      const rightEdge = HEIGHT - Math.sin(x * 0.2) * 3 - 4;
      gfx.fillRect(x, 0, 4, leftEdge);
      gfx.fillRect(x, rightEdge, 4, HEIGHT - rightEdge);
    }

    // Pebbles
    gfx.fillStyle(0x5a3a1a, 0.7);
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * WIDTH;
      const y = Math.random() * HEIGHT;
      gfx.fillCircle(x, y, Math.random() * 2 + 1);
    }

    // Grass tufts on edges
    gfx.fillStyle(0x2d5016, 0.6);
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * WIDTH;
      const y = Math.random() < 0.5 ? Math.random() * 8 : HEIGHT - Math.random() * 8;
      gfx.fillRect(x, y, 2, 4);
    }

    gfx.generateTexture("organic_path", WIDTH, HEIGHT);
    gfx.destroy();
  }
}
