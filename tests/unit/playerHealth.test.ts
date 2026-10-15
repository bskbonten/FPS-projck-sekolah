import { describe, it, expect, beforeEach } from 'vitest';
import { PlayerHealth } from '../../src/game/player/PlayerHealth';

describe('PlayerHealth and Armor Absorption', () => {
  let playerHealth: PlayerHealth;

  beforeEach(() => {
    playerHealth = new PlayerHealth(100, 50);
  });

  it('initializes with 100 health and 50 armor', () => {
    expect(playerHealth.health).toBe(100);
    expect(playerHealth.armor).toBe(50);
    expect(playerHealth.isDead).toBe(false);
  });

  it('absorbs 65% damage with armor, 35% penetrates to health', () => {
    // 20 incoming damage:
    // armor absorbs 20 * 0.65 = 13
    // health takes 20 * 0.35 = 7
    const result = playerHealth.takeDamage(20);
    expect(result.actualArmorDamage).toBe(13);
    expect(result.actualHealthDamage).toBe(7);
    expect(playerHealth.armor).toBe(37);
    expect(playerHealth.health).toBe(93);
    expect(playerHealth.isDead).toBe(false);
  });

  it('spills over absorbed damage to health when armor is depleted', () => {
    // Current armor is 50.
    // Damage of 100:
    // absorbShare = 65. Since armor is 50, armorDamage = 50, spillover = 15.
    // directShare = 35. Total healthDamage = 35 + 15 = 50.
    const result = playerHealth.takeDamage(100);
    expect(result.actualArmorDamage).toBe(50);
    expect(result.actualHealthDamage).toBe(50);
    expect(playerHealth.armor).toBe(0);
    expect(playerHealth.health).toBe(50);
  });

  it('inflicts 100% health damage when armor is completely depleted', () => {
    playerHealth.armor = 0;
    const result = playerHealth.takeDamage(30);
    expect(result.actualArmorDamage).toBe(0);
    expect(result.actualHealthDamage).toBe(30);
    expect(playerHealth.health).toBe(70);
  });

  it('triggers death when health drops to or below zero', () => {
    playerHealth.takeDamage(250);
    expect(playerHealth.health).toBe(0);
    expect(playerHealth.isDead).toBe(true);
  });

  it('does not take additional damage while dead', () => {
    playerHealth.takeDamage(250);
    expect(playerHealth.isDead).toBe(true);
    const result = playerHealth.takeDamage(50);
    expect(result.actualHealthDamage).toBe(0);
  });

  it('resets correctly on mission restart', () => {
    playerHealth.takeDamage(250);
    expect(playerHealth.isDead).toBe(true);
    playerHealth.reset();
    expect(playerHealth.health).toBe(100);
    expect(playerHealth.armor).toBe(50);
    expect(playerHealth.isDead).toBe(false);
  });
});
