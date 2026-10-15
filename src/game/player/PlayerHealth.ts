export interface DamageResult {
  actualHealthDamage: number;
  actualArmorDamage: number;
  isDead: boolean;
}

export class PlayerHealth {
  public health = 100;
  public maxHealth = 100;
  public armor = 50;
  public maxArmor = 50;
  public isDead = false;

  constructor(health = 100, armor = 50) {
    this.health = health;
    this.maxHealth = health;
    this.armor = armor;
    this.maxArmor = armor;
  }

  /**
   * Applies damage to player according to armor absorption rule:
   * - Armor absorbs 65% of damage while available
   * - 35% penetrates directly to health
   * - Excess unabsorbed damage spills over to health
   */
  public takeDamage(amount: number): DamageResult {
    if (this.isDead || amount <= 0) {
      return { actualHealthDamage: 0, actualArmorDamage: 0, isDead: this.isDead };
    }

    let armorDamage = 0;
    let healthDamage = 0;

    if (this.armor > 0) {
      const absorbShare = amount * 0.65;
      const directShare = amount * 0.35;

      if (this.armor >= absorbShare) {
        armorDamage = absorbShare;
        this.armor -= absorbShare;
        healthDamage = directShare;
      } else {
        armorDamage = this.armor;
        const spillover = absorbShare - this.armor;
        this.armor = 0;
        healthDamage = directShare + spillover;
      }
    } else {
      healthDamage = amount;
    }

    this.health = Math.max(0, this.health - healthDamage);
    if (this.health <= 0) {
      this.isDead = true;
    }

    return {
      actualHealthDamage: healthDamage,
      actualArmorDamage: armorDamage,
      isDead: this.isDead
    };
  }

  public heal(amount: number): void {
    if (this.isDead) return;
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  public restoreArmor(amount: number): void {
    if (this.isDead) return;
    this.armor = Math.min(this.maxArmor, this.armor + amount);
  }

  public reset(): void {
    this.health = this.maxHealth;
    this.armor = this.maxArmor;
    this.isDead = false;
  }
}
