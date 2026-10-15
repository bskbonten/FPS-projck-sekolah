# SHADOW PROTOCOL // Realistic Tactical FPS Campaign

**SHADOW PROTOCOL** is a realistic, single-player first-person shooter campaign vertical slice set in 2089, developed with **Vue 3**, **Three.js**, **TypeScript**, **Vite**, **Pinia**, and the **Web Audio API**.

The player takes on the role of an elite reconnaissance operative infiltrating Sector 4 industrial district to retrieve classified defense network encryption keys, eliminate hostile patrols, override a high-security data terminal, and evacuate via tactical VTOL.

---

## 1. Quick Start & Commands

```bash
# Navigate to project directory
cd shadow-protocol

# Install dependencies
npm install

# Start local development server with Vite (default http://localhost:3000)
npm run dev

# Run Vitest automated unit test suite (39 tests covering health, ammo, weapons, inspection, AI, missions, settings, decals)
npm run test

# Run TypeScript strict type-checking
npx tsc --noEmit

# Build production bundle
npm run build
```

---

## 2. Tactical Controls & Keybindings

| Input | Action |
|---|---|
| **W / A / S / D** | Tactical movement (Forward, Left, Backward, Right) |
| **Mouse Move** | First-person look / Camera rotation (yaw and pitch) |
| **Left Mouse Button** | Fire active weapon |
| **Right Mouse Button** | Aim Down Sights (ADS) with FOV zoom, sight alignment, and reduced spread |
| **R** | Tactical reload magazine |
| **X** | Inspect Weapon (rotates 3D model to reveal chamber, markings, and receiver) |
| **Shift** | Tactical Sprint |
| **Ctrl / C** | Crouch (lowers eye level and profile, slows movement) |
| **Space** | Jump |
| **1** | Equip Primary Weapon (**AR-01 PHANTOM**) |
| **2** | Equip Secondary Weapon (**P-09 ENFORCER**) |
| **E** | Interact (Data Terminal override) |
| **Esc** | Pause menu / Release pointer lock |

---

## 3. AAA Graphics Overhaul Features

### A. Modern City Environment & Infrastructure
- **Realistic Asphalt Roadway**: 4-lane city avenue featuring high-resolution procedural aggregate grain, double solid yellow centerline dividers, broken white lane markers, pedestrian zebra crosswalks, iron manhole covers, storm drain grates, and subtle wet reflective puddles.
- **Raised Sidewalks & Curbs**: Beveled granite curbs and concrete paver slabs with expansion seams and micro-grit roughness.
- **High-Rise Skyscraper Boulevards**: Modern corporate office towers (36m to 54m) with architectural facades, window mullions, tinted glass reflections, illuminated offices, rooftop HVAC units, and aviation warning beacons.
- **Distant Skyline Depth**: Background skyline silhouettes (65m to 90m) framing both horizons for true scale and perspective.
- **Urban Street Clutter & Cover**:
  - Curved modern street lamps with warm-white LED luminaire heads.
  - Tactical patrol SUVs with wheels, cabin glass, and headlights blocking road lanes.
  - Glass bus stop transit shelter with illuminated digital schedule panel.
  - Heavy concrete Jersey highway barriers with black and yellow 45° hazard chevrons.
- **Corporate Control Facility**: Polished dark granite server room with reflective floor, high-density server blade racks, cyan LED strips, and glowing holographic Data Terminal console.
- **Extraction Helipad**: Asphalt landing pad with yellow safety ring, white "H" landing decals, and flashing amber perimeter strobe beacons.

### B. High-Fidelity 3D Weapon Presentation
- **AR-01 PHANTOM**: Detailed upper/lower split receiver, Picatinny top rail, vented M-LOK handguard, angled tactical foregrip, fluted barrel, flash hider, 30-round ribbed curved magazine, ergonomic stippled grip, buffer tube with collapsible stock, and reflex optic with glass lens and glowing cyan reticle.
- **P-09 ENFORCER**: Steel slide with angled cocking serrations, barrel ejection port, polymer frame with under-barrel tactical light, 3-dot tritium night sights (front blade and rear notch), flared magwell, and magazine baseplate.
- **Shell Casings**: Dynamic spinning brass shell casings ejecting from the weapon port on every shot.
- **Multi-Plane Muzzle Flash**: Cross-billboard muzzle flash with dynamic point light illumination.

### C. Dedicated Weapon Animation State Machine (`WeaponAnimationController`)
- **Explicit Animation Layers**: `IDLE`, `WALK`, `SPRINT`, `ADS`, `FIRING`, `RELOADING`, `INSPECTING`, `SWITCHING`, `DISABLED`.
- **Idle**: Natural breathing sway and micro-movements.
- **Walk**: Smooth figure-8 translational bobbing matching footstep cadence.
- **Sprint**: Smooth weapon lowering and angled rotation to the side.
- **ADS (Aim Down Sights)**: Central sight alignment directly along camera optical axis (eliminating parallax).
- **Reload**: Procedural multi-stage animation (tilt left, magazine drop, insert click, bolt rack forward).
- **Recoil**: Controlled punchy kickback displacement and muzzle rise with spring-damper recovery.
- **Weapon Inspection (`X`)**: Smoothly tilts and rotates weapon to inspect markings, chamber, and receiver; seamlessly interruptible by firing, sprinting, or reloading.

### D. Post-Processing & Decals
- **EffectComposer Pipeline**:
  - `RenderPass`
  - `UnrealBloomPass` (subtle threshold `0.82`, strength `0.28`) for glowing server LEDs, optics, and lamps without blinding the player.
  - Custom cinematic vignette, film contrast curve, and slight saturation grading.
  - `OutputPass` with accurate ACES Filmic tone mapping and sRGB color space.
- **Pooled Bullet Impact Decals (`DecalManager`)**: Reusable pool of 64 bullet hole marks placed on hit surfaces with polygon offsets to completely eliminate z-fighting.

---

## 4. Performance & Memory Management (MacBook Air M1)

- Tested and verified for smooth 60 FPS performance on Apple Silicon (M1, 8GB RAM).
- Scalable quality settings (`High`, `Medium`, `Low`) via settings store:
  - **High**: Full post-processing, 2048x2048 shadow cascades, 1.5x DPR cap.
  - **Medium**: Post-processing, 1024x1024 shadows, 1.25x DPR cap.
  - **Low**: Direct WebGL rendering (post-processing bypassed), shadows disabled, 1.0x DPR.
- Object pooling for decals and particles; zero garbage collection allocations in frame loop.
- Throttled reactive HUD bridge (~15 Hz) keeping Vue 3 reactivity completely decoupled from the 60 FPS Three.js rendering loop.

---

## 5. Automated Unit Test Matrix (100% Pass Rate)

Executed with `npm run test`:
```
Test Files  6 passed (6)
     Tests  39 passed (39)
  Duration  252ms

✓ tests/unit/playerHealth.test.ts (7 tests) - Armor 65/35 absorption, spillover, and death
✓ tests/unit/weapons.test.ts     (10 tests) - Fire rate, ammo, reload, switching, and inspection
✓ tests/unit/enemyAI.test.ts      (7 tests) - FSM transitions, line-of-sight occlusion, damage, and death
✓ tests/unit/missions.test.ts     (8 tests) - Objective sequence, terminal distance check, extraction, and ratings
✓ tests/unit/settings.test.ts     (4 tests) - LocalStorage persistence, reset defaults, and invalid fallback
✓ tests/unit/decals.test.ts       (3 tests) - Pool capacity, recycling oldest decals, and memory cleanup
```
