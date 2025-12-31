# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language

Please respond in Japanese.

## Project Overview

Lumina Logic is a 3D "lights out" puzzle game built as a single-file HTML application using Three.js. Players click cubes to toggle their state and adjacent neighbors, with the goal of lighting all cubes.

## Development Commands

This is a zero-build project with no package.json or build tools:

- **Run**: Open `index.html` in any modern browser (WebGL required)
- **Develop**: Edit `index.html` directly and refresh browser
- **Dependencies**: Three.js r128 loaded from CDN (no installation needed)

## Architecture

### Single-File Structure
All game code is contained in `index.html` (754 lines):
- Inline CSS with neon aesthetic styling
- Inline JavaScript with Three.js game logic

### Core Data Structures
```javascript
cubes          // Array of THREE.Mesh objects
cubeStates     // Object with "x,y,z" keys → boolean (lit/unlit)
initialCubeStates  // Saved state for reset functionality
cubeAnimations // Track in-flight color animations
```

### Key Functions
- `getStageConfig(stage)` - Returns grid size and shuffle count for stage
- `initStage(stage)` - Generate cubes, shuffle, save initial state
- `handleClick(cube)` - Toggle cube + 6 neighbors, animate, check clear
- `toggleCube(x,y,z)` - Flip state boolean at coordinates
- `shuffle(count)` - Randomize board via simulated clicks
- `findHintCube()` - Score all cubes, return best move suggestion
- `checkClear()` - Verify win condition (all cubes lit)

### Stage Configuration
- Stages 1-2: 3x3x3 grid
- Stages 3-4: 4x4x4 grid
- Stage 5+: 5x5x5 grid
- Surface-only rendering (interior cubes excluded)

### Game Mechanics
- Click/tap toggles target cube plus all 6 adjacent neighbors (±1 in each axis)
- Only surface cubes are interactive and rendered
- Camera distance auto-adjusts to `gridSize * 2.5`
- 0.2 second color animations with cubic ease-out

### Controls
- Mouse: drag to rotate, wheel to zoom, click to toggle
- Touch: drag to rotate, tap to toggle
- RESET button: returns to stage's initial shuffled state
- HINT button: highlights recommended move with blinking animation
