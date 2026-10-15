import * as THREE from 'three';

export interface BoxCollider {
  min: THREE.Vector3;
  max: THREE.Vector3;
  tag?: string;
}

export class CollisionWorld {
  public colliders: BoxCollider[] = [];
  public solidMeshes: THREE.Object3D[] = [];

  public clear(): void {
    this.colliders = [];
    this.solidMeshes = [];
  }

  public addBoxCollider(box: THREE.Box3, tag?: string): void {
    this.colliders.push({
      min: box.min.clone(),
      max: box.max.clone(),
      tag
    });
  }

  public addMeshCollider(mesh: THREE.Object3D, tag?: string): void {
    mesh.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(mesh);
    this.addBoxCollider(box, tag);
    this.solidMeshes.push(mesh);
  }

  /**
   * Check collision and resolve sliding for a cylinder/capsule player
   */
  public resolvePlayerCollision(
    currentPos: THREE.Vector3,
    desiredPos: THREE.Vector3,
    radius: number,
    height: number
  ): THREE.Vector3 {
    const finalPos = desiredPos.clone();
    const playerMinY = finalPos.y;
    const playerMaxY = finalPos.y + height;

    // Check collision along X axis
    const testPosX = new THREE.Vector3(finalPos.x, currentPos.y, currentPos.z);
    if (this.isCollidingAt(testPosX, radius, playerMinY, playerMaxY)) {
      finalPos.x = currentPos.x;
    }

    // Check collision along Z axis
    const testPosZ = new THREE.Vector3(finalPos.x, currentPos.y, finalPos.z);
    if (this.isCollidingAt(testPosZ, radius, playerMinY, playerMaxY)) {
      finalPos.z = currentPos.z;
    }

    // Clamp inside world boundaries
    finalPos.x = Math.max(-50, Math.min(50, finalPos.x));
    finalPos.z = Math.max(-110, Math.min(25, finalPos.z));

    return finalPos;
  }

  public isCollidingAt(pos: THREE.Vector3, radius: number, minY: number, maxY: number): boolean {
    const pxMin = pos.x - radius;
    const pxMax = pos.x + radius;
    const pzMin = pos.z - radius;
    const pzMax = pos.z + radius;

    for (let i = 0; i < this.colliders.length; i++) {
      const c = this.colliders[i];
      // Check vertical overlap
      if (minY < c.max.y && maxY > c.min.y) {
        // Check horizontal AABB overlap
        if (pxMax > c.min.x && pxMin < c.max.x && pzMax > c.min.z && pzMin < c.max.z) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Fast line-of-sight raycast check against box colliders
   * Returns true if clear path (unobstructed), false if blocked by wall/cover
   */
  public hasLineOfSight(origin: THREE.Vector3, target: THREE.Vector3): boolean {
    const dir = new THREE.Vector3().subVectors(target, origin);
    const distance = dir.length();
    if (distance < 0.01) return true;
    dir.normalize();

    const ray = new THREE.Ray(origin, dir);
    const box = new THREE.Box3();
    const hitPoint = new THREE.Vector3();

    for (let i = 0; i < this.colliders.length; i++) {
      const c = this.colliders[i];
      box.min.copy(c.min);
      box.max.copy(c.max);

      // Check if ray intersects this box before reaching the target
      if (ray.intersectBox(box, hitPoint)) {
        const hitDist = origin.distanceTo(hitPoint);
        if (hitDist < distance - 0.2) {
          return false; // Obstructed by wall
        }
      }
    }

    return true;
  }
}
