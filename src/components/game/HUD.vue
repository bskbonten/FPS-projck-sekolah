<template>
  <div class="hud-layer">
    <!-- Objective Tracker (Top Left) -->
    <ObjectiveTracker />

    <!-- Center Crosshair & Hit Markers -->
    <Crosshair />

    <!-- Directional Damage Arcs -->
    <DamageIndicator />

    <!-- Interactive Prompt (Center Bottom) -->
    <div v-if="gameStore.interactionPrompt" class="interaction-prompt tactical-panel">
      <span class="prompt-icon">[E]</span>
      <span class="prompt-text">{{ gameStore.interactionPrompt }}</span>
    </div>

    <!-- Center Mission Notification Banner -->
    <transition name="banner-slide">
      <div v-if="gameStore.bannerMessage" class="banner-toast" :class="gameStore.bannerMessage.type">
        <div class="banner-title">{{ gameStore.bannerMessage.title }}</div>
        <div v-if="gameStore.bannerMessage.subtitle" class="banner-sub mono">
          {{ gameStore.bannerMessage.subtitle }}
        </div>
      </div>
    </transition>

    <!-- Health & Armor Status (Bottom Left) -->
    <HealthArmor />

    <!-- Ammo & Weapon Gauge (Bottom Right) -->
    <AmmoCounter />
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '../../stores/gameStore';
import Crosshair from './Crosshair.vue';
import HealthArmor from './HealthArmor.vue';
import AmmoCounter from './AmmoCounter.vue';
import ObjectiveTracker from './ObjectiveTracker.vue';
import DamageIndicator from './DamageIndicator.vue';

const gameStore = useGameStore();
</script>

<style scoped>
.hud-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  user-select: none;
}

.interaction-prompt {
  position: absolute;
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 24px;
  background: rgba(10, 18, 28, 0.92);
  border: 1px solid var(--color-primary);
  box-shadow: 0 0 20px var(--color-primary-glow);
  z-index: 25;
}

.prompt-icon {
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 700;
  color: var(--color-primary);
  background: rgba(0, 240, 255, 0.15);
  padding: 2px 8px;
  border-radius: 2px;
}

.prompt-text {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--color-text-bright);
}

.banner-toast {
  position: absolute;
  top: 15%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 32px;
  background: rgba(8, 12, 18, 0.9);
  backdrop-filter: blur(8px);
  border-top: 2px solid;
  border-bottom: 2px solid;
  z-index: 30;
}

.banner-toast.info {
  border-color: var(--color-primary);
  box-shadow: 0 0 24px var(--color-primary-glow);
}

.banner-toast.info .banner-title {
  color: var(--color-primary);
}

.banner-toast.danger {
  border-color: var(--color-danger);
  box-shadow: 0 0 24px var(--color-danger-glow);
}

.banner-toast.danger .banner-title {
  color: var(--color-danger);
}

.banner-toast.success {
  border-color: var(--color-success);
  box-shadow: 0 0 24px rgba(5, 241, 175, 0.2);
}

.banner-toast.success .banner-title {
  color: var(--color-success);
}

.banner-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.15em;
}

.banner-sub {
  font-size: 12px;
  color: var(--color-text-dim);
}

.banner-slide-enter-active,
.banner-slide-leave-active {
  transition: all 0.3s ease;
}

.banner-slide-enter-from {
  opacity: 0;
  transform: translate(-50%, -20px);
}

.banner-slide-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>
