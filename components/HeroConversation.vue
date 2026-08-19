<script setup lang="ts">
/**
 * The self-playing conversation hero. A question types itself out in a
 * rotating language, the orb "listens" (waveform pulse), and a briefing
 * card materialises in answer. Scripted — no live AI on the public page.
 */
const { track } = useTrack()

interface Exchange {
  lang: string
  question: string
  briefing: { title: string; line1: string; line2: string; tag: string }
}

// Demo conversation, scoped to a single (fictional) development on Rechitta —
// the agent knows the project's live inventory, never the whole market.
const DEMO_PROJECT = 'Harbour Gate · demo development'

const exchanges: Exchange[] = [
  {
    lang: 'English',
    question: 'Which 2BR units are still available under AED 2M?',
    briefing: {
      title: 'Harbour Gate · Tower B',
      line1: '4 units available · 1,140–1,210 sqft',
      line2: 'From AED 1.86M · 60/40 plan · Q4 2027',
      tag: 'BRIEFING READY'
    }
  },
  {
    lang: 'العربية',
    question: 'ما هي خطة الدفع لوحدات الطابق الأخير؟',
    briefing: {
      title: 'هاربر جيت · المجموعة العليا',
      line1: '٢٠٪ حجز · ٤٠٪ أثناء الإنشاء · ٤٠٪ عند التسليم',
      line2: 'التسليم الربع الرابع ٢٠٢٧',
      tag: 'الموجز جاهز'
    }
  },
  {
    lang: 'हिन्दी',
    question: 'क्लाइंट को भेजने के लिए 2BR की ब्रीफ़िंग बना दो',
    briefing: {
      title: 'Harbour Gate · 2BR briefing',
      line1: 'Branded link, ready to share on WhatsApp',
      line2: 'Floor plans · payment plan · live availability',
      tag: 'BRIEFING READY'
    }
  },
  {
    lang: 'Русский',
    question: 'Какие студии ещё свободны в башне А?',
    briefing: {
      title: 'Harbour Gate · Башня А',
      line1: '7 студий свободны · 410–480 sqft',
      line2: 'От AED 980K · сдача Q4 2027',
      tag: 'БРИФИНГ ГОТОВ'
    }
  }
]

const current = ref(0)
const typed = ref('')
const phase = ref<'typing' | 'thinking' | 'answer'>('typing')
let timer: ReturnType<typeof setTimeout> | undefined

function play(index: number) {
  const ex = exchanges[index]
  typed.value = ''
  phase.value = 'typing'
  let i = 0

  const typeNext = () => {
    if (i < ex.question.length) {
      typed.value = ex.question.slice(0, ++i)
      timer = setTimeout(typeNext, 38)
    } else {
      phase.value = 'thinking'
      timer = setTimeout(() => {
        phase.value = 'answer'
        timer = setTimeout(() => {
          const next = (index + 1) % exchanges.length
          if (next === 0) track('hero:conversation_loop_completed')
          current.value = next
          play(next)
        }, 4200)
      }, 1100)
    }
  }
  typeNext()
}

onMounted(() => play(0))
onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <section id="hero" class="hero">
    <!-- The orb itself lives in OrbStage (fixed layer) — this spacer holds
         the slot in the layout where it floats during the hero. -->
    <div class="orb-space" />

    <p class="eyebrow">CURATED INTELLIGENCE · OFF-PLAN DUBAI</p>
    <h1 class="display headline">Developers brief brokers.<br />Brokers brief buyers.</h1>
    <p class="subhead">
      Rechitta carries every conversation in off-plan selling — live inventory,
      branded briefings, the buyer's language.
    </p>

    <div class="convo">
      <p class="lang">{{ exchanges[current].lang }} · {{ DEMO_PROJECT }}</p>
      <p class="question" dir="auto">
        {{ typed }}<span class="caret" v-if="phase === 'typing'" />
      </p>

      <Transition name="briefing">
        <div v-if="phase === 'answer'" class="briefing-card">
          <p class="tag">{{ exchanges[current].briefing.tag }}</p>
          <p class="title">{{ exchanges[current].briefing.title }}</p>
          <p class="line">{{ exchanges[current].briefing.line1 }}</p>
          <p class="line">{{ exchanges[current].briefing.line2 }}</p>
        </div>
      </Transition>
    </div>

    <div class="ctas">
      <a href="#developers" class="btn btn-primary" @click="track('cta:upload_project_click', { placement: 'hero' })">
        Upload your project
      </a>
      <a href="#brokers" class="btn btn-ghost" @click="track('cta:broker_waitlist_click', { placement: 'hero' })">
        Join the broker waitlist →
      </a>
    </div>
  </section>
</template>

<style scoped>
.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 120px 24px 80px;
  gap: 28px;
}

.orb-space {
  height: clamp(180px, 26vh, 300px);
}

.headline {
  font-size: clamp(40px, 6.5vw, 76px);
}

.subhead {
  max-width: 520px;
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 16px;
}

/* ─── Conversation ─── */
.convo {
  min-height: 220px;
  width: min(560px, 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.lang {
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-dim);
}
.question {
  font-size: clamp(17px, 2.2vw, 21px);
  color: var(--text-secondary);
  min-height: 2.6em;
}
.caret {
  display: inline-block;
  width: 1px;
  height: 1.1em;
  background: var(--text-primary);
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: blink 900ms steps(1) infinite;
}
@keyframes blink { 50% { opacity: 0; } }

.briefing-card {
  width: 100%;
  text-align: left;
  border: 1px solid rgba(197, 165, 114, 0.35);
  border-radius: 14px;
  padding: 20px 24px;
  background: linear-gradient(160deg, rgba(197, 165, 114, 0.08), rgba(10, 10, 9, 0.4));
}
.briefing-card .tag {
  font-size: 10px;
  letter-spacing: 0.22em;
  color: var(--gold);
  margin-bottom: 8px;
}
.briefing-card .title {
  font-family: var(--font-display);
  font-size: 22px;
  margin-bottom: 6px;
}
.briefing-card .line {
  font-size: 14px;
  color: var(--text-secondary);
}

.briefing-enter-active { transition: opacity 600ms var(--ease-expo), transform 600ms var(--ease-expo); }
.briefing-enter-from { opacity: 0; transform: translateY(14px); }

.ctas {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
