# Pirate Game - Project Guide

## Project Overview
A turn-based pirate-themed game built with **Vue 3**, **Three.js (WebGPU)**, and **TypeScript**. The game features a crew phase and parrot phase with grid-based navigation and fog of war mechanics.

## Tech Stack
- **Frontend**: Vue 3 + TypeScript
- **3D Graphics**: Three.js with WebGPU support
- **Rendering**: Instanced rendering for performance optimization
- **Animations**: GSAP for smooth transitions
- **State Management**: Vue reactive store
- **Events**: Mitt for event-driven communication
- **Build Tool**: Vite

## Project Structure

```
src/
├── components/          # Vue components
│   └── canvas.vue      # Main 3D canvas component
├── three/              # Three.js logic
│   ├── player.ts       # Player 3D model (boat + bird)
│   ├── tile.ts         # Individual tile with fog system
│   ├── mapManager.ts   # Manages all tiles and game board
│   ├── mapGenerator.ts # Procedural map generation
│   ├── camera.ts       # Camera management
│   ├── sceneManager.ts # Three.js scene setup
│   └── instancedModelManger.ts # Object pooling for meshes
├── utils/
│   ├── gameStore.ts    # Vue reactive state management
│   └── gameLoop.ts     # Turn-based game flow controller
├── events/
│   └── gameEvents.ts   # Typed event system (mitt-based)
├── types/
│   └── general.ts      # Shared TypeScript types (Position, etc)
└── App.vue            # Main app component
```

## Key Architecture Patterns

### 1. Game State Management (`gameStore.ts`)
- Vue reactive store tracks: `currentPhase`, `userPosition`, `userPositionHistory`, `turnCount`, `showActionPanel`
- Types: `'crew'` | `'parrot'` phases
- Position type: `THREE.Vector2` for coordinates

### 2. Unified State Management Pattern
**CRITICAL**: All state changes affecting the Three.js scene or game logic MUST follow this pattern:

```
Vue Component/User Input
        ↓
Update gameStore (reactive state)
        ↓
Watchers in StoreAdapter/Classes react to state change
        ↓
Classes update their own Three.js objects/properties
```

**Rule**: Never call scene methods directly from Vue components. Always:
1. Update `gameState` in `gameStore.ts`
2. Let watchers handle side effects
3. Each affected class (`MapManager`, `Camera`, `Player`) has its own watcher with cleanup

Example pattern:
```typescript
// ❌ WRONG: Direct method call
sceneManager.mapManager.hideEntities();

// ✅ RIGHT: Update state, let watchers react
gameState.entitiesVisible = false;
```

### 3. Decentralized State Watchers
**Each scene class manages its own state reactions**:
- `MapManager`, `Camera`, and `Player` each have `initWatchers()` method
- Called in constructor automatically
- Each class watches only the state it needs
- Watchers use Vue's `watch()` for reactive updates

**Benefits**:
- Self-contained responsibility: each class owns its state reactions
- Single source of truth (game store)
- Easier to trace: watch the class that updates the scene
- Consistent pattern across all state changes

### 4. Event-Driven Communication (`gameEvents.ts`)
Using **mitt** for type-safe events:
- `'crew:move'` - Crew movement action
- `'parrot:attack'` - Parrot attack action
- `'animation:complete'` - Animation finished
- `'video:play'` - Video playback
- `'crew:actionSelected'` - UI crew action selection

**Pattern**: Listeners use promise-based `waitForEvent()` to handle async game flow.

### 5. Game Loop (`gameLoop.ts`)
- Recursive turn-based system: `crew phase → parrot phase → next turn`
- Crew phase: Waits for player UI input
- Parrot phase: AI computes action (stub: TODO)
- Animation: Waits for 3D animations to complete

### 6. 3D Rendering Hierarchy
```
Scene
└── Player Group (playerGroup)
    ├── Boat Group (boatGroup) → boat.glb model
    └── Bird Group (birdGroup) → bird.glb model
└── Map Group (mapGroup)
    └── Tiles (49 tiles: 7x7 grid)
        ├── Tile mesh (water/island/monster/typhon)
        └── Fog mesh (fog of war visualization)
```

### 7. Tile System (`tile.ts`)
Each tile manages:
- **Position**: Grid coordinates (THREE.Vector2)
- **State**: `'water'` | `'island'` | `'monster'` | `'typhon'`
- **Fog**: Reveal/hide based on player position and fog distance
- **3D Models**: Instanced mesh references (idx) for performance

**Fog Mechanics**:
- `fogDistance`: 0.4 (reveal distance from player)
- `fogAmount`: Controls opacity
- `updateFog()`: Calculates distance to player and updates visibility

### 8. Map Management (`mapManager.ts`)
- Displays/hides tiles based on game phase
- Updates fog positions based on player movement
- Manages 7x7 tile grid
- Loads 3D models from `models/` directory:
  - `water.glb`, `island.glb`, `monster.glb`, `typhon.glb`, `boat.glb`, `bird.glb`

### 9. Player Representation (`player.ts`)
Two-part system:
- **Boat**: Parent object following player position
- **Bird**: Companion object with floating animation
- **Animation**: Uses GSAP for smooth movement (1.5s duration)
- **Updates**: Continuous rotation and bobbing animation

**Note**: Separate from `CrewPlayer` (deleted) - this handles 3D visualization only, not game logic.

## Game Models (GLTF)
Located in `public/models/`:
- `boat.glb` - Player boat (scaled 0.5)
- `bird.glb` - Companion bird (scaled 0.5)
- `water.glb` - Water tiles
- `island.glb` - Island tiles
- `monster.glb` - Monster encounter tiles
- `typhon.glb` - Typhon encounter tiles

## Known Issues & TODOs

### Type Errors in mapGenerator.ts
- Objects possibly undefined (TS2532)
- Need null checks or refactoring of procedural generation logic
- **Priority**: Medium - doesn't break gameplay but prevents clean builds

### Incomplete Implementations (Stubs)
1. **`gameLoop.ts` line 46**: `computeParrotAction()` - Returns empty object, needs AI logic
2. **`camera.ts` line 20**: `setPhase()` - Only logs, should implement phase-specific camera angles
3. **`player.ts` line 37**: `setPhase()` - Only logs, should implement phase-specific player behavior

### Deleted Broken Code
- ✅ `CrewPlayer.ts` - Incomplete class with syntax errors (never used)
- ✅ `ParrotPlayer.ts` - Empty file (never used)
- ✅ Removed unused properties: `fogPosition`, `hideFog` from Tile
- ✅ Removed dead code: empty `setActive()`/`removeActive()` methods

## Development Workflow

### Running the Project
```bash
yarn dev      # Start dev server
yarn build    # Build for production (shows TS errors)
yarn preview  # Preview production build
```

### Adding New Features
1. **New Game State**: Add property to `StoreInterface` and `gameState` in `gameStore.ts`
2. **React to State Changes**: Add watcher to the class that needs to respond (e.g., `MapManager.initWatchers()`)
3. **Update Vue Components**: Change state instead of calling methods directly
4. **3D Visuals**: Add models to `models/` and load in `SceneManager`
5. **Game Logic**: Extend `gameLoop.ts` or create new utility
6. **UI**: Create Vue component in `components/`

**Key Pattern**:
```typescript
// 1. Add to gameStore.ts
interface StoreInterface {
  myNewState: boolean;
}
export const gameState = reactive({ myNewState: false });

// 2. Add watcher in the affected class (e.g., MapManager)
private initWatchers(): void {
  watch(() => gameState.myNewState, (newValue) => {
    // Update Three.js objects
  });
}

// 3. Update from Vue
gameState.myNewState = true; // ✅ triggers watcher in MapManager
```

### Key File Relationships
- `App.vue` → calls `initGame()` → creates `GameLoop` → emits events
- `canvas.vue` → renders Three.js scene managed by `SceneManager`
- `SceneManager` → manages `Player`, `MapManager`, `Camera`
- `MapManager` → manages grid of `Tile` objects
- `Tile` → updates fog based on `gameState.userPosition`

## Performance Optimizations
- **Instanced Rendering**: Using `InstancedModelManager` for mesh pooling
- **Fog of War**: Only visible tiles are updated
- **Model Scaling**: Models pre-scaled (0.5x) to match scene
- **GSAP**: Hardware-accelerated animations for smooth 60fps

## Naming Conventions
- **Classes**: PascalCase (e.g., `MapManager`, `GameLoop`)
- **Methods**: camelCase (e.g., `setPlayerPosition()`)
- **Events**: kebab-case with colon separator (e.g., `'crew:move'`)
- **Types**: PascalCase suffix (e.g., `TileStateType`, `PhaseType`)
- **Private members**: `private` keyword prefix (e.g., `private fogDistance`)

## Type Safety Notes
- Use `THREE.Vector2` for 2D positions in game logic
- Use `Position` type from `general.ts` for event data (consider unifying)
- Game phases strictly typed as `PhaseType`: `'crew'` | `'parrot'`
- Tile states: `TileStateType`: `'water'` | `'island'` | `'monster'` | `'typhon'`

## Testing Considerations
- Event flow: Verify crew/parrot phase transitions
- Animation: Check GSAP movements and camera transitions
- Fog of War: Validate tile visibility at various distances
- Map Generation: Handle edge cases in procedural generation
- Performance: Monitor with large tile counts

## Next Steps for Development
1. Fix mapGenerator.ts type errors
2. Implement `computeParrotAction()` with parrot AI
3. Implement phase-specific camera logic in `setPhase()`
4. Implement phase-specific player logic in `player.ts`
5. Add UI for crew action selection (currently stubbed)
6. Integrate with game loop
