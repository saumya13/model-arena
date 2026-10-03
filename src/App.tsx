import { motion, useReducedMotion } from "motion/react";
import { ComparisonSection } from "@/components/comparison/ComparisonSection";
import { HeroVisualExplainer } from "@/components/hero/HeroVisualExplainer";
import { InteractiveGrid } from "@/components/hero/InteractiveGrid";
import { ShuffleWords } from "@/components/hero/ShuffleWords";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { RollingText } from "@/components/ui/RollingText";

// The hero's label/headline/subheading/CTA reveal one after another on
// mount rather than all at once — `staggerChildren` on the parent and a
// matching `variants` entry on each child is Motion's standard pattern for
// this ("stagger reveal"), so the orchestration lives in one place here.
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

function App() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div id="top" className="relative min-h-screen bg-paper">
      <div
        className="grid-backdrop pointer-events-none fixed inset-10 -z-10"
        aria-hidden
      />

      <SiteHeader />

      <main>
        <section className="relative mx-auto max-w-7xl px-5 py-14">
          <InteractiveGrid />
          {/* pointer-events-none so the empty space around this block-level
              text (which otherwise spans the full section width) doesn't
              swallow hover before it reaches the grid cells underneath. */}
          <div className="relative z-10 pointer-events-none">
            <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
              <motion.div
                className="max-w-xl"
                variants={staggerContainer}
                initial={prefersReducedMotion ? false : "hidden"}
                animate="visible"
              >
                <motion.p
                  variants={staggerItem}
                  className="flex items-center gap-2 readout-label-green"
                >
                  MODEL_ARENA
                  <span className="font-mono text-[0.9rem] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                    ·
                  </span>
                  <ShuffleWords />
                </motion.p>
                <motion.h1
                  variants={staggerItem}
                  className="mt-3 font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl"
                >
                  Compare AI models without the guesswork.
                  {/* Run one prompt against many models at once. Watch the numbers,
                  not the vibes. */}
                </motion.h1>
                <motion.p variants={staggerItem} className="mt-4 text-ink-soft">
                  Benchmark up to four OpenRouter models side by side with
                  real-time response, latency, token, and cost data — then track
                  results across runs to spot trends.{" "}
                  <span className="text-secondary">
                    Bring your own API key; nothing needs to leave your browser.
                  </span>
                  {/* Run prompts across multiple AI models, track latency, tokens,
                  cost, and compare their performance over time — all in one
                  place, directly in your browser. Bring your own API key;
                  everything runs in your browser. */}
                </motion.p>
                <motion.a
                  variants={staggerItem}
                  href="#arena"
                  // The hero text column is pointer-events-none so hover can
                  // reach the grid cells behind it — this is the one element
                  // in it that needs to opt back in to receive clicks.
                  className="pointer-events-auto mt-6 inline-flex min-w-[220px] items-center justify-center rounded-md bg-signal px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-signal-strong"
                >
                  <RollingText text="Start the Battle" />
                </motion.a>
              </motion.div>

              <div className="shrink-0">
                <HeroVisualExplainer />
              </div>
            </div>
          </div>
        </section>

        <ComparisonSection />
      </main>

      <SiteFooter />
    </div>
  );
}

export default App;
