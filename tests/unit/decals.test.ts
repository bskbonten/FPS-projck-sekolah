import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { DecalManager } from '../../src/game/effects/DecalManager';

describe('DecalManager Pooling and Surface Placement', () => {
  let scene: THREE.Scene;
  let decalManager: DecalManager;

  beforeEach(() => {
    scene = new THREE.Scene();
    decalManager = new DecalManager(scene, 10); // Small pool of 10 for test
  });

  it('pre-allocates the configured pool capacity', () => {
    // 10 decals pre-allocated in scene
    expect(scene.children.length).toBe(10);
  });

  it('spawns decals and recycles oldest when capacity is exceeded without throwing', () => {
    const origin = new THREE.Vector3(0, 1, -5);
    const normal = new THREE.Vector3(0, 0, 1);

    // Spawn 15 decals (exceeding capacity of 10)
    for (let i = 0; i < 15; i++) {
      decalManager.spawnDecal(origin, normal);
    }

    // Still exactly 10 in scene (recycled cleanly, no leak)
    expect(scene.children.length).toBe(10);
  });

  it('clears and disposes cleanly without memory leaks', () => {
    decalManager.spawnDecal(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0));
    decalManager.clear();
    decalManager.dispose();
    expect(scene.children.length).toBe(0);
  });
});
