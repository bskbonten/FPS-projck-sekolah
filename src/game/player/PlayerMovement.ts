import * as THREE from 'three';
import { CollisionWorld } from '../world/CollisionWorld';
import type { InputState } from '../core/InputManager';

export class PlayerMovement {
  public position = new THREE.Vector3(0, 0, 15); // Start at infiltration zone
  public velocity = new THREE.Vector3();
  public isGrounded = false;
  public isCrouching = false;
  public isSprinting = false;

  // Speeds
  private walkSpeed = 5.2;
  private sprintSpeed = 8.5;
  private crouchSpeed = 2.6;
  private jumpSpeed = 5.6;
  private gravity = 18.0;

  // Physical bounding
  public radius = 0.45;
  public standHeight = 1.8;
  public crouchHeight = 1.1;
  public currentEyeHeight = 1.7;

  constructor(startX = 0, startY = 0, startZ = 15) {
    this.position.set(startX, startY, startZ);
  }

  public update(dt: number, input: InputState, yaw: number, collision: CollisionWorld): void {
    // 1. Crouch state and eye height interpolation
    this.isCrouching = input.isCrouching;
    const targetEyeHeight = this.isCrouching ? 1.0 : 1.7;
    this.currentEyeHeight = THREE.MathUtils.lerp(this.currentEyeHeight, targetEyeHeight, dt * 12);

    // 2. Sprint state (cannot sprint while crouching or moving backwards)
    this.isSprinting = input.isSprinting && !this.isCrouching && input.moveForward && !input.moveBackward;

    // 3. Movement speed target
    let targetSpeed = this.walkSpeed;
    if (this.isCrouching) {
      targetSpeed = this.crouchSpeed;
    } else if (this.isSprinting) {
      targetSpeed = this.sprintSpeed;
    }

    // 4. Direction vector relative to camera yaw
    const moveDir = new THREE.Vector3();
    if (input.moveForward) moveDir.z -= 1;
    if (input.moveBackward) moveDir.z += 1;
    if (input.moveLeft) moveDir.x -= 1;
    if (input.moveRight) moveDir.x += 1;

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      // Rotate by yaw
      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    }

    // Smooth horizontal velocity
    const targetVx = moveDir.x * targetSpeed;
    const targetVz = moveDir.z * targetSpeed;
    const accel = this.isGrounded ? 14 : 3;

    this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetVx, dt * accel);
    this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetVz, dt * accel);

    // 5. Vertical velocity & Jumping
    if (this.isGrounded) {
      this.velocity.y = 0;
      if (input.jumpPressed && !this.isCrouching) {
        this.velocity.y = this.jumpSpeed;
        this.isGrounded = false;
      }
    } else {
      this.velocity.y -= this.gravity * dt;
    }

    // 6. Integrate movement and resolve collision
    const desiredPos = this.position.clone();
    desiredPos.x += this.velocity.x * dt;
    desiredPos.z += this.velocity.z * dt;

    const resolvedHorizontal = collision.resolvePlayerCollision(
      this.position,
      desiredPos,
      this.radius,
      this.isCrouching ? this.crouchHeight : this.standHeight
    );

    this.position.x = resolvedHorizontal.x;
    this.position.z = resolvedHorizontal.z;

    // Vertical step
    this.position.y += this.velocity.y * dt;

    // Ground floor collision at Y = 0
    if (this.position.y <= 0) {
      this.position.y = 0;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }
  }

  public getEyePosition(): THREE.Vector3 {
    return new THREE.Vector3(this.position.x, this.position.y + this.currentEyeHeight, this.position.z);
  }

  public reset(x = 0, y = 0, z = 15): void {
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.isGrounded = true;
    this.isCrouching = false;
    this.isSprinting = false;
    this.currentEyeHeight = 1.7;
  }
}
