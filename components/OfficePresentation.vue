<script setup lang="ts">
/**
 * The diegetic problem statement: as the camera zooms into the XYZ Developers
 * tower, we "arrive" inside their office and a TV sales-review deck cycles the
 * real problems Rechitta solves. Opacity is scroll-driven by the parent.
 */
const slides = [
  {
    metric: '60%',
    line: 'of brokers are still selling from the launch-day deck.',
    sub: 'Re-briefing the network means another round of in-person sessions.'
  },
  {
    metric: '200+',
    line: 'calls a week to the sales office — just to confirm availability.',
    sub: 'Inventory lives in our heads and our PDFs, not in the broker’s hand.'
  },
  {
    metric: '7 units',
    line: 'of prime stock unsold while overseas demand goes dark.',
    sub: 'The pitch never reaches the buyer in the buyer’s language.'
  }
]

const active = ref(0)
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  timer = setInterval(() => (active.value = (active.value + 1) % slides.length), 2600)
})
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div class="office">
    <div class="room">
      <div class="tv">
        <div class="tv-head">
          <span class="badge">XYZ DEVELOPERS</span>
          <span class="deck">Q3 SALES REVIEW</span>
        </div>
        <div class="tv-body">
          <Transition name="slide" mode="out-in">
            <div :key="active" class="slide">
              <p class="metric display">{{ slides[active].metric }}</p>
              <p class="line">{{ slides[active].line }}</p>
              <p class="sub">{{ slides[active].sub }}</p>
            </div>
          </Transition>
        </div>
        <div class="tv-foot">
          <span v-for="(s, i) in slides" :key="i" class="dot" :class="{ on: i === active }" />
          <span class="sound">Sound familiar?</span>
        </div>
      </div>
      <div class="table" aria-hidden="true" />
      <div class="downlight" aria-hidden="true" />
    </div>
  </div>
</template>

<style scoped>
.office {
  position: fixed;
  inset: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(120% 100% at 50% 30%, rgba(10, 14, 28, 0.6), rgba(3, 5, 12, 0.96) 75%);
}
.room {
  position: relative;
  width: min(760px, 86vw);
  display: flex;
  justify-content: center;
}

.tv {
  position: relative;
  z-index: 2;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: linear-gradient(160deg, #0c1326, #070b16);
  border: 1px solid rgba(143, 180, 255, 0.18);
  border-radius: 12px;
  box-shadow: 0 40px 120px rgba(0, 0, 0, 0.7), 0 0 80px rgba(61, 111, 245, 0.12);
  padding: clamp(20px, 3.5vw, 40px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.tv-head {
  display: flex;
  align-items: center;
  gap: 14px;
}
.badge {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  color: var(--gold);
  border: 1px solid rgba(197, 165, 114, 0.4);
  padding: 4px 10px;
  border-radius: 6px;
}
.deck {
  font-size: 11px;
  letter-spacing: 0.22em;
  color: var(--text-dim);
}

.tv-body {
  flex: 1;
  display: flex;
  align-items: center;
}
.slide { text-align: left; }
.metric {
  font-size: clamp(40px, 6vw, 72px);
  color: #ff7a6b;
  line-height: 1;
  margin-bottom: 12px;
}
.line {
  font-size: clamp(16px, 2.2vw, 22px);
  color: var(--text-primary);
  max-width: 30ch;
  line-height: 1.3;
}
.sub {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 10px;
  max-width: 42ch;
}

.tv-foot {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(250, 250, 249, 0.2);
  transition: background 300ms;
}
.dot.on { background: var(--gold); }
.sound {
  margin-left: auto;
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.table {
  position: absolute;
  bottom: -8%;
  left: 50%;
  transform: translateX(-50%);
  width: 130%;
  height: 90px;
  background: linear-gradient(to bottom, rgba(8, 11, 22, 0.9), rgba(3, 5, 12, 0));
  filter: blur(2px);
  z-index: 1;
}
.downlight {
  position: absolute;
  top: -40%;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 80%;
  background: radial-gradient(ellipse at top, rgba(159, 182, 255, 0.12), transparent 70%);
  z-index: 0;
}

.slide-enter-active, .slide-leave-active { transition: opacity 400ms, transform 400ms; }
.slide-enter-from { opacity: 0; transform: translateY(10px); }
.slide-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
