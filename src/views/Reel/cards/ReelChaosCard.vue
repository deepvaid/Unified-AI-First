<script setup lang="ts">
// The reel's opening beat: a grid of deliberately mismatched UI wobbles,
// then snaps into system components on cue. Hardcoded styles in the
// "before" layer are the point — that's the world without the system.
import MpStatusChip from '@/components/MpStatusChip.vue'
</script>

<template>
  <div class="chaos">
    <div class="chaos__caption chaos__caption--before mp-eyebrow">Before</div>

    <div class="chaos__grid">
      <!-- 1. Button -->
      <div class="chaos__tile" :style="{ '--i': 0 }">
        <div class="chaos__layer chaos__layer--before">
          <button class="chaos__raw" style="background: #2d63e8; border-radius: 0; font-family: Georgia, serif">Save</button>
        </div>
        <div class="chaos__layer chaos__layer--after">
          <v-btn color="primary" variant="flat" class="text-none" tabindex="-1">Save</v-btn>
        </div>
      </div>

      <!-- 2. Button -->
      <div class="chaos__tile" :style="{ '--i': 1 }">
        <div class="chaos__layer chaos__layer--before">
          <button class="chaos__raw" style="background: #1e88e5; border-radius: 18px; font-family: 'Courier New', monospace">SAVE</button>
        </div>
        <div class="chaos__layer chaos__layer--after">
          <v-btn color="primary" variant="tonal" class="text-none" tabindex="-1">Duplicate</v-btn>
        </div>
      </div>

      <!-- 3. Button -->
      <div class="chaos__tile" :style="{ '--i': 2 }">
        <div class="chaos__layer chaos__layer--before">
          <button class="chaos__raw" style="background: #4059ad; border-radius: 3px; padding: 13px 26px; letter-spacing: 2px">SAVE CHANGES</button>
        </div>
        <div class="chaos__layer chaos__layer--after">
          <v-btn variant="outlined" class="text-none" tabindex="-1" prepend-icon="download">Export</v-btn>
        </div>
      </div>

      <!-- 4. Input -->
      <div class="chaos__tile" :style="{ '--i': 3 }">
        <div class="chaos__layer chaos__layer--before">
          <input
            class="chaos__raw-input"
            value="search..."
            readonly
            style="border: 2px inset #9aa4b2; border-radius: 1px; font-family: 'Courier New', monospace"
          />
        </div>
        <div class="chaos__layer chaos__layer--after">
          <v-text-field
            model-value="Search orders"
            prepend-inner-icon="search"
            hide-details
            readonly
            tabindex="-1"
            class="chaos__field"
          />
        </div>
      </div>

      <!-- 5. Status badge -->
      <div class="chaos__tile" :style="{ '--i': 4 }">
        <div class="chaos__layer chaos__layer--before">
          <span class="chaos__raw-badge" style="background: #3366cc; border-radius: 2px; font-family: Arial">SHIPPED!!</span>
        </div>
        <div class="chaos__layer chaos__layer--after">
          <MpStatusChip status="Shipped" type="fulfillment" size="md" show-icon />
        </div>
      </div>

      <!-- 6. Toggle -->
      <div class="chaos__tile" :style="{ '--i': 5 }">
        <div class="chaos__layer chaos__layer--before">
          <label class="chaos__raw-check" style="font-family: Georgia, serif">
            <input type="checkbox" checked tabindex="-1" /> notify me
          </label>
        </div>
        <div class="chaos__layer chaos__layer--after">
          <v-switch :model-value="true" label="Notify me" density="compact" hide-details tabindex="-1" />
        </div>
      </div>

      <!-- 7. Link -->
      <div class="chaos__tile" :style="{ '--i': 6 }">
        <div class="chaos__layer chaos__layer--before">
          <span class="chaos__raw-link" style="color: #00a0c6; text-decoration: underline dotted; font-family: 'Courier New', monospace">view more…</span>
        </div>
        <div class="chaos__layer chaos__layer--after">
          <v-btn variant="text" class="text-none" size="small" append-icon="arrow-right" tabindex="-1">View report</v-btn>
        </div>
      </div>

      <!-- 8. Tag -->
      <div class="chaos__tile" :style="{ '--i': 7 }">
        <div class="chaos__layer chaos__layer--before">
          <span class="chaos__raw-tag" style="border: 2px dashed #1e88e5; border-radius: 999px; font-family: Georgia, serif">tag: vip</span>
        </div>
        <div class="chaos__layer chaos__layer--after">
          <v-chip label size="small" color="primary" tabindex="-1">VIP</v-chip>
        </div>
      </div>

      <!-- 9. Metric -->
      <div class="chaos__tile" :style="{ '--i': 8 }">
        <div class="chaos__layer chaos__layer--before">
          <span class="chaos__raw-metric" style="font-family: Georgia, serif; letter-spacing: 3px; color: #7c89e0">ORDERS: 1982</span>
        </div>
        <div class="chaos__layer chaos__layer--after">
          <div class="text-center">
            <div class="mp-eyebrow">Orders</div>
            <div class="chaos__metric">1,982</div>
          </div>
        </div>
      </div>
    </div>

    <div class="chaos__caption chaos__caption--after mp-eyebrow">
      After — one system, one truth
    </div>
  </div>
</template>

<style scoped>
.chaos {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--mp-space-24);
  padding: 6%;
}

.chaos__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 240px));
  gap: var(--mp-space-16);
}

.chaos__tile {
  position: relative;
  height: clamp(64px, 13vh, 96px);
  border: 1px solid var(--mp-border-subtle);
  border-radius: var(--mp-radius-12);
  background: rgb(var(--v-theme-surface));
  animation: chaos-pop var(--mp-motion-duration-entrance) var(--mp-motion-easing-standard) both;
  animation-delay: calc(var(--i) * 60ms);
  overflow: hidden;
}

.chaos__layer {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--mp-space-8) var(--mp-space-12);
}

/* Before layer: pops in with the tile, wobbles, then gets snapped away. */
.chaos__layer--before {
  animation:
    chaos-wobble 0.9s ease-in-out calc(900ms + var(--i) * 80ms) 2 alternate both,
    chaos-before-out 400ms var(--mp-motion-easing-exit) calc(3400ms + var(--i) * var(--mp-motion-stagger-step)) forwards;
}

/* After layer: lands on the beat, slightly oversized then settling. */
.chaos__layer--after {
  animation: chaos-after-in 450ms var(--mp-motion-easing-standard) calc(3550ms + var(--i) * var(--mp-motion-stagger-step)) both;
}

@keyframes chaos-pop {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes chaos-wobble {
  0% { transform: rotate(0) translate(0, 0); }
  25% { transform: rotate(1.4deg) translate(1px, -2px); }
  50% { transform: rotate(-1.2deg) translate(-2px, 1px); }
  75% { transform: rotate(1deg) translate(1px, 2px); }
  100% { transform: rotate(-0.8deg) translate(-1px, -1px); }
}

@keyframes chaos-before-out {
  to {
    opacity: 0;
    transform: scale(0.9);
  }
}

@keyframes chaos-after-in {
  from {
    opacity: 0;
    transform: scale(1.1);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.chaos__caption--before {
  animation:
    chaos-cap-in 300ms var(--mp-motion-easing-standard) 300ms both,
    chaos-before-out 300ms var(--mp-motion-easing-exit) 3300ms forwards;
}

.chaos__caption--after {
  color: rgb(var(--v-theme-primary));
  animation: chaos-cap-in 400ms var(--mp-motion-easing-standard) 4400ms both;
}

@keyframes chaos-cap-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* Raw "before" artifacts — hardcoded on purpose. */
.chaos__raw {
  color: #fff;
  border: none;
  padding: 8px 16px;
  font-size: 13px;
  cursor: default;
}

.chaos__raw-input {
  width: 80%;
  padding: 6px 8px;
  font-size: 12px;
  color: #333;
  background: #fdfdfd;
}

.chaos__raw-badge {
  color: #fff;
  padding: 3px 8px;
  font-size: 10px;
  font-weight: 700;
}

.chaos__raw-check {
  font-size: 13px;
  color: #d0d4dc;
}

.chaos__raw-link {
  font-size: 13px;
}

.chaos__raw-tag {
  padding: 4px 12px;
  font-size: 12px;
  color: #7ea6e8;
}

.chaos__raw-metric {
  font-size: 15px;
}

.chaos__field {
  width: 100%;
}

.chaos__metric {
  font-size: var(--mp-fontSize-24);
  font-weight: var(--mp-fontWeight-bold);
  font-variant-numeric: tabular-nums;
  line-height: var(--mp-lineHeight-tight);
}

@media (prefers-reduced-motion: reduce) {
  .chaos__tile,
  .chaos__layer--before,
  .chaos__layer--after,
  .chaos__caption--before,
  .chaos__caption--after {
    animation: none;
  }

  .chaos__layer--before,
  .chaos__caption--before {
    opacity: 0;
  }

  .chaos__layer--after,
  .chaos__caption--after,
  .chaos__tile {
    opacity: 1;
  }
}
</style>
