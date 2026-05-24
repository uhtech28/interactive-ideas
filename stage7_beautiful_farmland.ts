// BEAUTIFUL STAGE 7 - TWILIGHT FARMLAND TOWNSHIP
// Copy this method to replace createEnhancedCrossroadsTown in WorldMapScene.ts

private createEnhancedCrossroadsTown(
  panelX: number,
  panelOffsetY: number,
  scale: number,
  tileSize: number,
  cols: number,
  rows: number,
  midRow: number,
  midCol: number,
  colors: Record<string, number>,
): void {
  // Tile type constants for enhanced 2D array
  const EMPTY = 0, GROUND = 1, GRASS = 2, PATH_H = 3, PATH_V = 4;
  const TREE = 5, FLOWER = 6, HOUSE = 7, LAMP = 8, GARDEN = 9, FENCE = 10;
  const BUSH = 11, ROCK = 12, WELL = 13;
  
  // 8 beautifully planned estates with two trees each and exact checkpoint alignment
  const estates = [
    // --- TOP-LEFT QUADRANT (2 houses) ---
    {
      houseRow: 5, houseCol: 5,
      trees: [[4, 4], [4, 6]],
      lawn: { minR: 3, maxR: 7, minC: 3, maxC: 7 },
      walkway: [[6, 5], [7, 5], [8, 5]]
    },
    {
      houseRow: 5, houseCol: 12,
      trees: [[4, 11], [4, 13]],
      lawn: { minR: 3, maxR: 7, minC: 10, maxC: 14 },
      walkway: [[6, 12], [7, 12], [8, 12]]
    },
    
    // --- TOP-RIGHT QUADRANT (2 houses) ---
    {
      houseRow: 5, houseCol: 27,
      trees: [[4, 26], [4, 28]],
      lawn: { minR: 3, maxR: 7, minC: 25, maxC: 29 },
      walkway: [[6, 27], [7, 27], [8, 27]]
    },
    {
      houseRow: 5, houseCol: 34,
      trees: [[4, 33], [4, 35]],
      lawn: { minR: 3, maxR: 7, minC: 32, maxC: 36 },
      walkway: [[6, 34], [7, 34], [8, 34]]
    },
    
    // --- BOTTOM-LEFT QUADRANT (2 houses) ---
    // House 5: Aligns directly with Checkpoint 1 at (col 7, row 31)
    {
      houseRow: 29, houseCol: 7,
      trees: [[28, 6], [28, 8]],
      lawn: { minR: 27, maxR: 31, minC: 5, maxC: 9 },
      walkway: [[30, 7], [31, 7], [32, 7]]
    },
    // House 6: Aligns directly with Checkpoint 2 at (col 19, row 22)
    {
      houseRow: 20, houseCol: 15,
      trees: [[19, 14], [19, 16]],
      lawn: { minR: 18, maxR: 22, minC: 13, maxC: 17 },
      walkway: [[21, 15], [22, 15], [22, 16], [22, 17], [22, 18], [22, 19]]
    },
    
    // --- BOTTOM-RIGHT QUADRANT (2 houses) ---
    // House 7: Aligns directly with Checkpoint 3 at (col 27, row 22)
    {
      houseRow: 20, houseCol: 27,
      trees: [[19, 26], [19, 28]],
      lawn: { minR: 18, maxR: 22, minC: 25, maxC: 29 },
      walkway: [[21, 27], [22, 27]]
    },
    // House 8: Aligns directly with Checkpoint 4 at (col 38, row 31)
    {
      houseRow: 29, houseCol: 38,
      trees: [[28, 37], [28, 39]],
      lawn: { minR: 27, maxR: 31, minC: 36, maxC: 39 },
      walkway: [[30, 38], [31, 38], [32, 38]]
    }
  ];

  // Generate enhanced tilemap with beautiful town layout
  const levelData: number[][] = Array.from({ length: rows }, (_, row) => 
    Array.from({ length: cols }, (_, col) => {
      // 1. Check estate grids first
      for (const est of estates) {
        if (row === est.houseRow && col === est.houseCol) {
          return HOUSE;
        }
        for (const [tr, tc] of est.trees) {
          if (row === tr && col === tc) {
            return TREE;
          }
        }
        for (const [wr, wc] of est.walkway) {
          if (row === wr && col === wc) {
            return PATH_H; // paved stone walkway to main streets
          }
        }
        if (row >= est.lawn.minR && row <= est.lawn.maxR &&
            col >= est.lawn.minC && col <= est.lawn.maxC) {
          return GRASS;
        }
      }

      // 2. Main crossroads paths (wider)
      if (row >= midRow - 1 && row <= midRow + 1) return PATH_H;
      if (col >= midCol - 1 && col <= midCol + 1) return PATH_V;
      
      // 3. Side paths creating town blocks
      if (row === 8 || row === 22) {
        if (col < midCol - 2 || col > midCol + 2) return PATH_H;
      }
      if (col === 8 || col === 22) {
        if (row < midRow - 2 || row > midRow + 2) return PATH_V;
      }
      
      // 4. Street Junction Lamp Posts (perfectly aligned town planning)
      if (row === 7 && col === 7) return LAMP;
      if (row === 7 && col === midCol + 3) return LAMP;
      if (row === midRow + 3 && col === 7) return LAMP;
      if (row === midRow + 3 && col === midCol + 3) return LAMP;
      
      // Additional highway lamps (spaced regularly)
      if ((row === midRow - 2 || row === midRow + 2) && col % 6 === 0) return LAMP;
      if ((col === midCol - 2 || col === midCol + 2) && row % 6 === 0) return LAMP;
      
      // 5. Symmetric Wells & Benches
      if (row === 8 && col === 2) return WELL;
      if (row === 8 && col === cols - 3) return WELL;
      if (row === midRow + 8 && col === 2) return WELL;
      if (row === midRow + 8 && col === cols - 3) return WELL;
      
      // Benches along paths for weary travelers
      if (row === midRow - 2 && (col === 4 || col === cols - 5)) return ROCK; // Decorative rocks next to highways
      if (row === midRow + 2 && (col === 4 || col === cols - 5)) return ROCK;
      
      // 6. Forest Borders (Organized outer tree lines)
      if (row === 1 && col % 4 === 0) return TREE;
      if (row === rows - 2 && col % 4 === 0) return TREE;
      if (col === 1 && row % 4 === 0) return TREE;
      if (col === cols - 2 && row % 4 === 0) return TREE;
      
      // 7. General wilderness fill (soft grass and random flowers)
      if ((row + col) % 7 === 0) return FLOWER;
      if ((row + col) % 3 === 0) return GRASS;
      
      return GROUND;
    })
  );
  
  // Render tiles from enhanced 2D array
  const toX = (col: number) => panelX + col * tileSize + tileSize / 2;
  const toY = (row: number) => panelOffsetY + row * tileSize + tileSize / 2;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const tileType = levelData[row][col];
      const x = toX(col);
      const y = toY(row);
      
      switch (tileType) {
        case GROUND: {
          const shade = (row + col) % 2 === 0 ? colors.sky : colors.groundAlt;
          const tile = this.add.rectangle(x, y, tileSize, tileSize, shade, 1);
          tile.setDepth(1);
          this.backgroundLayer.add(tile);
          break;
        }
        
        case GRASS: {
          const tile = this.add.rectangle(x, y, tileSize, tileSize, colors.grass, 1);
          tile.setDepth(1);
          this.backgroundLayer.add(tile);
          
          // Add grass texture
          const grassDot = this.add.circle(x + (row % 3) - 1, y + (col % 3) - 1, 1, colors.grassDark, 0.5);
          grassDot.setDepth(2);
          this.backgroundLayer.add(grassDot);
          break;
        }
        
        case PATH_H:
        case PATH_V: {
          const tile = this.add.rectangle(x, y, tileSize, tileSize, colors.path, 1);
          tile.setDepth(2);
          this.backgroundLayer.add(tile);
          
          // Path edge highlights
          if (tileType === PATH_H && (row === midRow - 1 || row === midRow + 1)) {
            const edge = this.add.rectangle(x, y, tileSize, 2, colors.pathEdge, 0.4);
            edge.setDepth(3);
            this.backgroundLayer.add(edge);
          }
          break;
        }
        
        case HOUSE: {
          const ground = this.add.rectangle(x, y, tileSize, tileSize, colors.grass, 1);
          ground.setDepth(1);
          this.backgroundLayer.add(ground);
          
          // Use existing house sprites if available
          if (this.textures.exists('House_Hay_1') || this.textures.exists('House_Hay_2')) {
            const houseKey = (row + col) % 2 === 0 ? 'House_Hay_1' : 'House_Hay_2';
            if (this.textures.exists(houseKey)) {
              const house = this.add.sprite(x, y + tileSize / 2, houseKey);
              house.setOrigin(0.5, 1);
              house.setScale(scale * 0.9);
              house.setTint(colors.glow);
              house.setDepth(8);
              this.midgroundLayer.add(house);
              
              // Add shadow
              const shadow = this.add.ellipse(x, y + tileSize / 2, tileSize * 0.8, tileSize * 0.3, 0x000000, 0.3);
              shadow.setDepth(7);
              this.midgroundLayer.add(shadow);
            }
          } else {
            // Fallback: simple house shape
            const houseBody = this.add.rectangle(x, y, tileSize * 0.8, tileSize * 0.8, 0x8b7355, 1);
            houseBody.setDepth(8);
            this.midgroundLayer.add(houseBody);
            
            const roof = this.add.triangle(x, y - tileSize * 0.4, 0, tileSize * 0.4, tileSize * 0.5, -tileSize * 0.2, -tileSize * 0.5, -tileSize * 0.2, 0xd4a574);
            roof.setDepth(9);
            this.midgroundLayer.add(roof);
            
            // Window glow
            const window1 = this.add.rectangle(x - 4, y, 3, 3, colors.highlight, 0.8);
            window1.setDepth(10);
            this.midgroundLayer.add(window1);
          }
          break;
        }
        
        case GARDEN: {
          const tile = this.add.rectangle(x, y, tileSize, tileSize, colors.grass, 1);
          tile.setDepth(1);
          this.backgroundLayer.add(tile);
          
          // Garden flowers
          const flowerColors = [colors.flower, colors.flowerGlow, colors.highlight];
          const flowerColor = flowerColors[(row + col) % 3];
          const flower = this.add.circle(x, y, 2, flowerColor, 0.7);
          flower.setDepth(4);
          this.backgroundLayer.add(flower);
          break;
        }
        
        case TREE: {
          const ground = this.add.rectangle(x, y, tileSize, tileSize, colors.grass, 1);
          ground.setDepth(1);
          this.backgroundLayer.add(ground);
          
          // Use existing tree sprites if available
          if (this.textures.exists('Tree_Emerald_1')) {
            const tree = this.add.sprite(x, y + tileSize / 2, 'Tree_Emerald_1');
            tree.setOrigin(0.5, 1);
            tree.setScale(scale * 0.8);
            tree.setTint(colors.tree);
            tree.setDepth(6);
            this.midgroundLayer.add(tree);
            
            // Shadow
            const shadow = this.add.ellipse(x, y + tileSize / 2, tileSize * 0.6, tileSize * 0.2, 0x000000, 0.3);
            shadow.setDepth(5);
            this.midgroundLayer.add(shadow);
          } else {
            // Fallback tree
            const canopy = this.add.ellipse(x, y - 4, 14, 18, colors.tree, 0.9);
            canopy.setDepth(6);
            this.backgroundLayer.add(canopy);
            
            const trunk = this.add.rectangle(x, y + 4, 4, 10, colors.treeDark, 1);
            trunk.setDepth(5);
            this.backgroundLayer.add(trunk);
          }
          break;
        }
        
        case FLOWER: {
          const ground = this.add.rectangle(x, y, tileSize, tileSize, colors.grass, 1);
          ground.setDepth(1);
          this.backgroundLayer.add(ground);
          
          // Glowing flower
          const flower = this.add.circle(x, y, 3, colors.flower, 0.8);
          flower.setDepth(4);
          flower.setBlendMode(Phaser.BlendModes.ADD);
          this.backgroundLayer.add(flower);
          
          const glow = this.add.circle(x, y, 8, colors.flowerGlow, 0.2);
          glow.setDepth(4);
          glow.setBlendMode(Phaser.BlendModes.ADD);
          this.backgroundLayer.add(glow);
          break;
        }
        
        case LAMP: {
          const ground = this.add.rectangle(x, y, tileSize, tileSize, colors.path, 1);
          ground.setDepth(2);
          this.backgroundLayer.add(ground);
          
          // Use existing lamp post if available
          if (this.textures.exists('LampPost_3')) {
            const lamp = this.add.sprite(x, y + tileSize / 2, 'LampPost_3');
            lamp.setOrigin(0.5, 1);
            lamp.setScale(scale);
            lamp.setTint(colors.glow);
            lamp.setDepth(9);
            this.midgroundLayer.add(lamp);
            
            // Lamp glow
            const lampGlow = this.add.circle(x, y - tileSize / 2, 12, colors.highlight, 0.3);
            lampGlow.setDepth(10);
            lampGlow.setBlendMode(Phaser.BlendModes.ADD);
            this.midgroundLayer.add(lampGlow);
          } else {
            // Fallback lamp
            const post = this.add.rectangle(x, y, 2, tileSize, 0x4a4a4a, 1);
            post.setDepth(9);
            this.midgroundLayer.add(post);
            
            const light = this.add.circle(x, y - tileSize / 2, 4, colors.highlight, 0.9);
            light.setDepth(10);
            light.setBlendMode(Phaser.BlendModes.ADD);
            this.midgroundLayer.add(light);
          }
          break;
        }
        
        case BUSH: {
          const ground = this.add.rectangle(x, y, tileSize, tileSize, colors.grass, 1);
          ground.setDepth(1);
          this.backgroundLayer.add(ground);
          
          // Decorative bush
          const bush = this.add.ellipse(x, y, 10, 8, colors.tree, 0.8);
          bush.setDepth(4);
          this.backgroundLayer.add(bush);
          
          const bushHighlight = this.add.ellipse(x - 2, y - 2, 4, 3, colors.grass, 0.6);
          bushHighlight.setDepth(5);
          this.backgroundLayer.add(bushHighlight);
          break;
        }
        
        case ROCK: {
          const ground = this.add.rectangle(x, y, tileSize, tileSize, colors.grass, 1);
          ground.setDepth(1);
          this.backgroundLayer.add(ground);
          
          // Use existing rock sprite if available
          if (this.textures.exists('Rock_Brown_1')) {
            const rock = this.add.sprite(x, y, 'Rock_Brown_1');
            rock.setOrigin(0.5, 0.5);
            rock.setScale(scale * 0.6);
            rock.setTint(0x6a5a8a);
            rock.setDepth(4);
            this.backgroundLayer.add(rock);
          } else {
            // Fallback rock
            const rock = this.add.ellipse(x, y, 8, 6, 0x4a3a5a, 1);
            rock.setDepth(4);
            this.backgroundLayer.add(rock);
          }
          break;
        }
        
        case WELL: {
          const ground = this.add.rectangle(x, y, tileSize, tileSize, colors.path, 1);
          ground.setDepth(2);
          this.backgroundLayer.add(ground);
          
          // Town well/fountain
          const wellBase = this.add.circle(x, y, tileSize * 0.6, 0x6a5a4a, 1);
          wellBase.setDepth(7);
          this.backgroundLayer.add(wellBase);
          
          const wellTop = this.add.circle(x, y, tileSize * 0.4, colors.accent, 0.8);
          wellTop.setDepth(8);
          this.midgroundLayer.add(wellTop);
          
          // Water glow
          const waterGlow = this.add.circle(x, y, tileSize * 0.5, colors.highlight, 0.3);
          waterGlow.setDepth(9);
          waterGlow.setBlendMode(Phaser.BlendModes.ADD);
          this.backgroundLayer.add(waterGlow);
          break;
        }
      }
    }
  }
  
  // Add impressive center plaza with decorative elements
  const plazaSize = tileSize * 3;
  
  // Outer plaza circle
  const plazaOuter = this.add.circle(
    toX(midCol),
    toY(midRow),
    plazaSize / 2,
    colors.accent,
    0.2
  );
  plazaOuter.setDepth(3);
  this.backgroundLayer.add(plazaOuter);
  
  // Middle plaza ring
  const plazaMiddle = this.add.circle(
    toX(midCol),
    toY(midRow),
    plazaSize / 3,
    colors.highlight,
    0.3
  );
  plazaMiddle.setDepth(4);
  this.backgroundLayer.add(plazaMiddle);
  
  // Center fountain/monument
  const monumentBase = this.add.circle(
    toX(midCol),
    toY(midRow),
    tileSize * 0.8,
    0x6a5a4a,
    1
  );
  monumentBase.setDepth(7);
  this.backgroundLayer.add(monumentBase);
  
  const monument = this.add.circle(
    toX(midCol),
    toY(midRow),
    tileSize * 0.6,
    colors.highlight,
    0.8
  );
  monument.setDepth(8);
  this.backgroundLayer.add(monument);
  
  // Monument glow (pulsing effect)
  const monumentGlow = this.add.circle(
    toX(midCol),
    toY(midRow),
    tileSize * 1.2,
    colors.glow,
    0.3
  );
  monumentGlow.setDepth(6);
  monumentGlow.setBlendMode(Phaser.BlendModes.ADD);
  this.backgroundLayer.add(monumentGlow);
  
  // Add decorative stars around monument
  const starPositions = [
    { angle: 0, dist: tileSize * 1.5 },
    { angle: 90, dist: tileSize * 1.5 },
    { angle: 180, dist: tileSize * 1.5 },
    { angle: 270, dist: tileSize * 1.5 },
  ];
  
  starPositions.forEach(({ angle, dist }) => {
    const rad = (angle * Math.PI) / 180;
    const starX = toX(midCol) + Math.cos(rad) * dist;
    const starY = toY(midRow) + Math.sin(rad) * dist;
    
    const star = this.add.circle(starX, starY, 3, colors.flower, 0.8);
    star.setDepth(5);
    star.setBlendMode(Phaser.BlendModes.ADD);
    this.backgroundLayer.add(star);
    
    const starGlow = this.add.circle(starX, starY, 8, colors.flowerGlow, 0.2);
    starGlow.setDepth(5);
    starGlow.setBlendMode(Phaser.BlendModes.ADD);
    this.backgroundLayer.add(starGlow);
  });
}
