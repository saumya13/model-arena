import { ComparisonSection } from "@/components/comparison/ComparisonSection";
import { HeroVisualExplainer } from "@/components/hero/HeroVisualExplainer";
import { InteractiveGrid } from "@/components/hero/InteractiveGrid";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

function App() {
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
              <div className="max-w-xl">
                <p className="readout-label-green">MODEL_ARENA · HERO</p>
                <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
                  Run one prompt against many models at once. Watch the
                  numbers, not the vibes.
                </h1>
                <p className="mt-4 text-ink-soft">
                  Paste one prompt, pick up to four OpenRouter models, and
                  watch their answers stream in side by side — with real
                  latency, token, and cost numbers underneath, charted
                  automatically across every run so you can see trends, not
                  just one-off numbers. Bring your own API key; everything
                  runs in your browser.
                </p>
              </div>

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
